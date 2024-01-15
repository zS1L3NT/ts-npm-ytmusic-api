import { HomePageContent } from "../@types/types"
import { PageType } from "../constants"
import { traverse, traverseList } from "../utils/traverse"
import AlbumParser from "./AlbumParser"
import ArtistParser from "./ArtistParser"
import PlaylistParser from "./PlaylistParser"
import SongParser from "./SongParser"

export default class Parser {
	public static parseDuration(time: string) {
		if (!time) return null

		const [seconds, minutes, hours] = time
			.split(":")
			.reverse()
			.map(n => +n) as (number | undefined)[]

		return (seconds || 0) + (minutes || 0) * 60 + (hours || 0) * 60 * 60
	}

	public static parseNumber(string: string): number {
		if (string.at(-1)!.match(/^[A-Z]+$/)) {
			const number = +string.slice(0, -1)
			const multiplier = string.at(-1)

			return (
				{
					K: number * 1000,
					M: number * 1000 * 1000,
					B: number * 1000 * 1000 * 1000,
					T: number * 1000 * 1000 * 1000 * 1000,
				}[multiplier!] || NaN
			)
		} else {
			return +string
		}
	}

	/**
	 * Parses mixed content data into a structured `HomePageContent` object.
	 *
	 * This static method takes raw data of mixed content types and attempts to parse it into a
	 * more structured format suitable for use as home page content. It supports multiple content
	 * types such as music descriptions, artists, albums, playlists, and songs.
	 *
	 * @param {any} data - The raw data to be parsed.
	 * @returns {HomePageContent | null} A `HomePageContent` object if parsing is successful, or null otherwise.
	 */
	public static parseMixedContent(data: any): HomePageContent | null {
		const key = Object.keys(data)[0]
		if (!key) throw new Error("Invalid content")

		const result = data[key]
		const musicDescriptionShelfRenderer = traverse(result, "musicDescriptionShelfRenderer")

		if (musicDescriptionShelfRenderer && !Array.isArray(musicDescriptionShelfRenderer)) {
			return {
				title: traverse(musicDescriptionShelfRenderer, "header", "title", "text"),
				contents: traverseList(
					musicDescriptionShelfRenderer,
					"description",
					"runs",
					"text",
				),
			}
		}

		if (!Array.isArray(result.contents)) {
			return null
		}

		const title = traverse(result, "header", "title", "text")
		const contents: HomePageContent["contents"] = []
		result.contents.forEach((content: any) => {
			const musicTwoRowItemRenderer = traverse(content, "musicTwoRowItemRenderer")
			if (musicTwoRowItemRenderer && !Array.isArray(musicTwoRowItemRenderer)) {
				const pageType = traverse(
					result,
					"navigationEndpoint",
					"browseEndpoint",
					"browseEndpointContextSupportedConfigs",
					"browseEndpointContextMusicConfig",
					"pageType",
				)
				const playlistId = traverse(
					content,
					"navigationEndpoint",
					"watchPlaylistEndpoint",
					"playlistId",
				)

				switch (pageType) {
					case PageType.MUSIC_PAGE_TYPE_ARTIST:
						contents.push(ArtistParser.parseSearchResult(content))
						break
					case PageType.MUSIC_PAGE_TYPE_ALBUM:
						contents.push(AlbumParser.parseSearchResult(content))
						break
					case PageType.MUSIC_PAGE_TYPE_PLAYLIST:
						contents.push(PlaylistParser.parseSearchResult(content))
						break
					default:
						if (playlistId) {
							contents.push(PlaylistParser.parseWatchPlaylist(content))
						} else {
							contents.push(SongParser.parseSearchResult(content))
						}
				}
			} else {
				const musicResponsiveListItemRenderer = traverse(
					content,
					"musicResponsiveListItemRenderer",
				)

				if (
					musicResponsiveListItemRenderer &&
					!Array.isArray(musicResponsiveListItemRenderer)
				) {
					contents.push(SongParser.parseSearchResult(musicResponsiveListItemRenderer))
				}
			}
		})

		return { title, contents }
	}
}
