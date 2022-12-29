

import { ArtistBasic, ArtistDetailed, ArtistFull } from "../schemas"
import checkType from "../utils/checkType"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"
import AlbumParser from "./AlbumParser"
import SongParser from "./SongParser"
import VideoParser from "./VideoParser"

export default class ArtistParser {
	public static parse(data: any, artistId: string): ArtistFull {
		const artistBasic: ArtistBasic = {
			artistId,
			name: traverseString(data, "header", "title", "text")()
		}

		const description = traverseString(data, "header", "description", "text")()

		return checkType(
			{
				type: "ARTIST",
				...artistBasic,
				thumbnails: traverseList(data, "header", "thumbnails"),
				description,
				topSongs: traverseList(data, "musicShelfRenderer", "contents").map(item =>
					SongParser.parseArtistTopSong(item, artistBasic)
				),
				topAlbums:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(0)
						?.contents.map((item: any) =>
							AlbumParser.parseArtistTopAlbum(item, artistBasic)
						) ?? [],
				topSingles:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(1)
						?.contents.map((item: any) =>
							AlbumParser.parseArtistTopAlbum(item, artistBasic)
						) ?? [],
				topVideos:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(2)
						?.contents.map((item: any) =>
							VideoParser.parseArtistTopVideo(item, artistBasic)
						) ?? []
			},
			ArtistFull
		)
	}

	public static parseSearchResult(item: any): ArtistDetailed {
		const flexColumns = traverseList(item, "flexColumns")

		return checkType(
			{
				type: "ARTIST",
				artistId: traverseString(item, "browseId")(),
				name: traverseString(flexColumns[0], "runs", "text")(),
				thumbnails: traverseList(item, "thumbnails")
			},
			ArtistDetailed
		)
	}
}
