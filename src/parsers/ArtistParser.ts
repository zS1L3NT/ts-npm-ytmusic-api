import { ArtistBasic, ArtistDetailed, ArtistFull } from "../"
import { ARTIST_DETAILED, ARTIST_FULL } from "../interfaces"
import checkType from "../utils/checkType"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"
import AlbumParser from "./AlbumParser"
import Parser from "./Parser"
import SongParser from "./SongParser"

export default class ArtistParser {
	public static parse(data: any, artistId: string): ArtistFull {
		const artistBasic: ArtistBasic = {
			artistId,
			name: traverseString(data, "header", "title", "text")()
		}

		const description = traverseString(data, "header", "description", "text")()

		return checkType<ArtistFull>(
			{
				type: "ARTIST",
				...artistBasic,
				thumbnails: traverseList(data, "header", "thumbnails"),
				description,
				subscribers: Parser.parseNumber(
					traverseString(data, "subscriberCountText", "text")()
				),
				topSongs: traverseList(data, "musicShelfRenderer", "contents").map(item =>
					SongParser.parseArtistTopSong(item, artistBasic)
				),
				topAlbums: traverseList(data, "musicCarouselShelfRenderer")
					.at(0)
					.contents.map((item: any) =>
						AlbumParser.parseArtistTopAlbums(item, artistBasic)
					)
			},
			ARTIST_FULL
		)
	}

	public static parseSearchResult(item: any): ArtistDetailed {
		const flexColumns = traverseList(item, "flexColumns")

		return checkType<ArtistDetailed>(
			{
				type: "ARTIST",
				artistId: traverseString(item, "browseId")(),
				name: traverseString(flexColumns[0], "runs", "text")(),
				thumbnails: traverseList(item, "thumbnails")
			},
			ARTIST_DETAILED
		)
	}
}
