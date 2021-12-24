import AlbumParser from "./AlbumParser"
import Parse from "./Parser"
import SongParser from "./SongParser"
import traverse from "../utils/traverse"

export default class ArtistParser {
	public static parse(data: any, artistId: string): YTMusic.ArtistFull {
		const artistBasic = {
			artistId,
			name: traverse(data, "header", "title", "text").at(0)
		}

		const description = traverse(data, "header", "description", "text")

		return {
			type: "ARTIST",
			...artistBasic,
			thumbnails: traverse(data, "header", "thumbnails"),
			description: description instanceof Array ? null : description,
			subscribers: Parse.parseNumber(traverse(data, "subscriberCountText", "text")),
			topSongs: traverse(data, "musicShelfRenderer", "contents").map((item: any) =>
				SongParser.parseArtistTopSong(item, artistBasic)
			),
			topAlbums: [traverse(data, "musicCarouselShelfRenderer")]
				.flat()
				.at(0)
				.contents
				.map((item: any) => AlbumParser.parseArtistTopAlbums(item, artistBasic))
		}
	}

	public static parseSearchResult(item: any): YTMusic.ArtistDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "ARTIST",
			artistId: traverse(item, "browseId"),
			name: traverse(flexColumns[0], "runs", "text"),
			thumbnails: [thumbnails].flat()
		}
	}
}
