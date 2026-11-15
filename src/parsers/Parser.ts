import { PageType, VideoType } from "../constants"
import { AlbumBasic, ArtistBasic, SearchResult, ThumbnailFull } from "../types"
import { isAlbum, isArtist, isDuration, isYear } from "../utils/filters"
import { traverseList, traverseString } from "../utils/traverse"

export default class Parser {
	public static readonly UNKNOWN_ARTIST: ArtistBasic = { artistId: null, name: "" }

	/**
	 * Reduces the three item layouts (list rows, cards and queue entries) to
	 * the same fields, so every parser reads them alike
	 */
	public static parseFields(item: any) {
		const [title, ...texts]: any[][] = (
			item.flexColumns
				? [...item.flexColumns, ...(item.fixedColumns ?? [])]
				: [item.title, item.subtitle ?? item.longBylineText, item.lengthText].filter(
						Boolean,
					)
		).map((text: any) => traverseList(text, "runs"))

		return {
			title: title?.[0],
			segments: texts.flatMap(Parser.parseSegments),
			endpoint: title?.[0]?.navigationEndpoint ?? item.navigationEndpoint,
			thumbnails: Parser.parseThumbnails(item.thumbnailRenderer ?? item.thumbnail),
		}
	}

	/**
	 * Google's image host resizes on request, so a large size is offered after
	 * the ones YouTube Music lists. Video stills cannot be resized this way
	 */
	public static parseThumbnails(data: any): ThumbnailFull[] {
		const thumbnails: ThumbnailFull[] = traverseList(data, "thumbnails")
		const largest = thumbnails.reduce<ThumbnailFull | undefined>(
			(a, b) => (a && a.width >= b.width ? a : b),
			undefined,
		)
		const size = /=(w|s)\d+[^/]*$/
		if (
			!largest ||
			largest.width <= 0 ||
			largest.width >= 1200 ||
			!/^https:\/\/(lh3|yt3)\.googleusercontent\.com\//.test(largest.url) ||
			!size.test(largest.url)
		) {
			return thumbnails
		}

		const height = Math.round((1200 * largest.height) / largest.width)

		return [
			...thumbnails,
			{ url: largest.url.replace(size, `=w1200-h${height}`), width: 1200, height },
		]
	}

	public static parseSegments(runs: any[]): any[][] {
		const segments: any[][] = [[]]
		for (const run of runs) {
			if (run.text === " • ") segments.push([])
			else segments.at(-1)!.push(run)
		}

		return segments
	}

	public static parseType(endpoint: any): SearchResult["type"] | null {
		const videoType = traverseString(endpoint, "musicVideoType")
		if (videoType === VideoType.MUSIC_VIDEO_TYPE_PODCAST_EPISODE) return null
		if (videoType) {
			return [
				VideoType.MUSIC_VIDEO_TYPE_ATV,
				VideoType.MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK,
			].includes(videoType as VideoType)
				? "SONG"
				: "VIDEO"
		}

		switch (traverseString(endpoint, "pageType")) {
			case PageType.MUSIC_PAGE_TYPE_ALBUM:
				return "ALBUM"
			case PageType.MUSIC_PAGE_TYPE_ARTIST:
				return "ARTIST"
			case PageType.MUSIC_PAGE_TYPE_PLAYLIST:
				return "PLAYLIST"
			case "":
				if (endpoint?.watchPlaylistEndpoint) return "PLAYLIST"
				if (endpoint?.watchEndpoint) return "SONG"
		}

		return null
	}

	/**
	 * @param artists Artists to use when the item links none, as on their own pages
	 * @param labelled Whether the item's first segment names its type, like "Song"
	 */
	public static parseArtists(
		segments: any[][],
		{ artists = [], labelled = false }: { artists?: ArtistBasic[]; labelled?: boolean } = {},
	): ArtistBasic[] {
		// Artists without a channel are plain text, which only their position tells apart
		const segment =
			segments.find(segment => segment.some(isArtist)) ??
			(artists.length ? [] : segments[+labelled] ?? [])
		const names = segment.filter(
			run =>
				isArtist(run) ||
				// Text between artists, like " & ", is padded with spaces
				(!run.navigationEndpoint &&
					typeof run.text === "string" &&
					run.text === run.text.trim() &&
					!isDuration(run) &&
					!isYear(run)),
		)
		if (!names.length) return artists

		return names.map(run => ({
			artistId: traverseString(run, "browseId") || null,
			name: traverseString(run, "text"),
		}))
	}

	public static parseAlbum(segments: any[][]): AlbumBasic | null {
		const album = segments.flat().find(isAlbum)

		return album
			? { albumId: traverseString(album, "browseId"), name: traverseString(album, "text") }
			: null
	}

	public static parseDuration(time: string) {
		if (!time) return null

		const [seconds, minutes, hours] = time
			.split(":")
			.reverse()
			.map(n => +n) as (number | undefined)[]

		return (seconds || 0) + (minutes || 0) * 60 + (hours || 0) * 60 * 60
	}

	public static parseYear(segments: any[][]) {
		const year = segments.flat().find(isYear)

		return year ? +year.text : null
	}

	/** Token for the next rows of a playlist, which loads as it scrolls */
	public static parseItemContinuation(data: any): string {
		// Later pages are the rows alone; the first also holds unrelated sections
		const shelf = traverseList(data, "musicPlaylistShelfRenderer")[0]

		return traverseString(shelf ?? data, "continuationItemRenderer", "token")
	}

	/** Token for the next sections of a page, or the next page of search results */
	public static parseSectionContinuation(data: any): string {
		return traverseString(data, "nextContinuationData", "continuation")
	}
}
