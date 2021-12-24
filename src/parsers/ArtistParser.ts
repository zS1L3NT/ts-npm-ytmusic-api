import AlbumParser from "./AlbumParser"
import Parse from "./Parser"
import SongParser from "./SongParser"
import traverse from "../utils/traverse"

export default class ArtistParser {
	private data: any

	public constructor(data: any) {
		this.data = data
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

	public parse(artistId: string): YTMusic.ArtistFull {
		const artistBasic = {
			artistId,
			name: traverse(this.data, "header", "title", "text").at(0)
		}

		const description = traverse(this.data, "header", "description", "text")

		return {
			type: "ARTIST",
			...artistBasic,
			thumbnails: traverse(this.data, "header", "thumbnails"),
			description: description instanceof Array ? null : description,
			subscribers: Parse.parseNumber(traverse(this.data, "subscriberCountText", "text")),
			topSongs: traverse(this.data, "musicShelfRenderer", "contents").map((item: any) =>
				SongParser.parseArtistTopSong(item, artistBasic)
			),
			topAlbums: [traverse(this.data, "musicCarouselShelfRenderer", "contents")]
				.flat()
				.at(0)
				.map((item: any) => AlbumParser.parseArtistTopAlbums(item, artistBasic))
		}
	}
}
