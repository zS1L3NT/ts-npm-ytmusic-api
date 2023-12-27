import { ArtistDetailed, ArtistFull } from "../@types/types"
import checkType from "../utils/checkType"
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

		return checkType(
			{
				type: "ARTIST",
				...artistBasic,
				thumbnails: traverseList(data, "header", "thumbnails"),
				topSongs: traverseList(data, "musicShelfRenderer", "contents").map(item =>
					SongParser.parseArtistTopSong(item, artistBasic),
				),
				topAlbums:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(0)
						?.contents.map((item: any) =>
							AlbumParser.parseArtistTopAlbum(item, artistBasic),
						) ?? [],
				topSingles:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(1)
						?.contents.map((item: any) =>
							AlbumParser.parseArtistTopAlbum(item, artistBasic),
						) ?? [],
				topVideos:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(2)
						?.contents.map((item: any) =>
							VideoParser.parseArtistTopVideo(item, artistBasic),
						) ?? [],
				featuredOn:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(3)
						?.contents.map((item: any) =>
							PlaylistParser.parseArtistFeaturedOn(item, artistBasic),
						) ?? [],
				similarArtists:
					traverseList(data, "musicCarouselShelfRenderer")
						?.at(4)
						?.contents.map((item: any) => this.parseSimilarArtists(item)) ?? [],
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
