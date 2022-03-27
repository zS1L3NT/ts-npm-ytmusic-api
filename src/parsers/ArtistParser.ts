import AlbumParser from "./AlbumParser"
import checkType from "../utils/checkType"
import Parser from "./Parser"
import SongParser from "./SongParser"
import traverse from "../utils/traverse"
import { ARTIST_DETAILED, ARTIST_FULL } from "../interfaces"
import { ArtistDetailed, ArtistFull } from ".."

export default class ArtistParser {
	public static parse(data: any, artistId: string): ArtistFull {
		const artistBasic = {
			artistId,
			name: traverse(data, "header", "title", "text").at(0)
		}

		const description = traverse(data, "header", "description", "text")

		return checkType<ArtistFull>(
			{
				type: "ARTIST",
				...artistBasic,
				thumbnails: [traverse(data, "header", "thumbnails")].flat(),
				description: description instanceof Array ? null : description,
				subscribers: Parser.parseNumber(traverse(data, "subscriberCountText", "text")),
				topSongs: traverse(data, "musicShelfRenderer", "contents").map((item: any) =>
					SongParser.parseArtistTopSong(item, artistBasic)
				),
				topAlbums: [traverse(data, "musicCarouselShelfRenderer")]
					.flat()
					.at(0)
					.contents.map((item: any) =>
						AlbumParser.parseArtistTopAlbums(item, artistBasic)
					)
			},
			ARTIST_FULL
		)
	}

	public static parseSearchResult(item: any): ArtistDetailed {
		const flexColumns = traverse(item, "flexColumns")

		return checkType<ArtistDetailed>(
			{
				type: "ARTIST",
				artistId: traverse(item, "browseId"),
				name: traverse(flexColumns[0], "runs", "text"),
				thumbnails: [traverse(item, "thumbnails")].flat()
			},
			ARTIST_DETAILED
		)
	}
}
