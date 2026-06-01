import { ArtistDetailed, ArtistFull } from "../types"
import checkType from "../utils/checkType"
import { identifyCarouselType } from "../utils/filters"
import { traverseList, traverseString } from "../utils/traverse"
import AlbumParser from "./AlbumParser"
import PlaylistParser from "./PlaylistParser"
import SongParser from "./SongParser"
import VideoParser from "./VideoParser"

export default class ArtistParser {
	public static parse(data: any, artistId: string): ArtistFull {
		const artistBasic = {
			artistId,
			name: traverseString(data, "header", "title", "text"),
		}

		// Group every musicCarouselShelfRenderer by its content type so that
		// lookup is independent of the order YouTube returns them.
		const carousels = traverseList(data, "musicCarouselShelfRenderer")
		const carouselMap = new Map<string, any>()
		for (const carousel of carousels) {
			const type = identifyCarouselType(carousel)
			// Keep the first match for each type (mirrors old positional priority)
			if (!carouselMap.has(type)) {
				carouselMap.set(type, carousel)
			}
		}

		/**
		 * Returns the parsed items from the first carousel of the given type,
		 * or an empty array when that section is absent from the response.
		 */
		const getItems = (type: string): any[] => {
			const carousel = carouselMap.get(type)
			if (!carousel) return []
			return (carousel.contents as any[]) ?? []
		}

		return checkType(
			{
				type: "ARTIST",
				...artistBasic,
				thumbnails: traverseList(data, "header", "thumbnails"),
				topSongs: traverseList(data, "musicShelfRenderer", "contents").map(item =>
					SongParser.parseArtistTopSong(item, artistBasic),
				),
				topAlbums: getItems("albums").map(item =>
					AlbumParser.parseArtistTopAlbum(item, artistBasic),
				),
				topSingles: getItems("singles").map(item =>
					AlbumParser.parseArtistTopAlbum(item, artistBasic),
				),
				topVideos: getItems("videos").map(item =>
					VideoParser.parseArtistTopVideo(item, artistBasic),
				),
				featuredOn: getItems("playlists").map(item =>
					PlaylistParser.parseArtistFeaturedOn(item, artistBasic),
				),
				similarArtists: getItems("similar").map(item =>
					ArtistParser.parseSimilarArtists(item),
				),
			},
			ArtistFull,
		)
	}

	public static parseSearchResult(item: any): ArtistDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()

		// No specific way to identify the title
		const title = columns[0]

		return checkType(
			{
				type: "ARTIST",
				artistId: traverseString(item, "browseId"),
				name: traverseString(title, "text"),
				thumbnails: traverseList(item, "thumbnails"),
			},
			ArtistDetailed,
		)
	}

	public static parseSimilarArtists(item: any): ArtistDetailed {
		return checkType(
			{
				type: "ARTIST",
				artistId: traverseString(item, "browseId"),
				name: traverseString(item, "runs", "text"),
				thumbnails: traverseList(item, "thumbnails"),
			},
			ArtistDetailed,
		)
	}
}
