import checkType from "../utils/checkType"
import SongParser from "./SongParser"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"
import { ALBUM_DETAILED, ALBUM_FULL } from "../interfaces"
import { AlbumBasic, AlbumDetailed, AlbumFull, ArtistBasic } from ".."

export default class AlbumParser {
	public static parse(data: any, albumId: string): AlbumFull {
		const albumBasic: AlbumBasic = {
			albumId,
			name: traverseString(data, "header", "title", "text")()
		}
		const artists: ArtistBasic[] = traverseList(data, "header", "subtitle", "runs")
			.filter(run => "navigationEndpoint" in run)
			.map(run => ({
				artistId: traverseString(run, "browseId")(),
				name: traverseString(run, "text")()
			}))
		const thumbnails = traverseList(data, "header", "thumbnails")

		return checkType<AlbumFull>(
			{
				type: "ALBUM",
				...albumBasic,
				playlistId: traverseString(data, "buttonRenderer", "playlistId")(),
				artists,
				year: +traverseString(data, "header", "subtitle", "text")(-1),
				thumbnails,
				description: traverseString(data, "description", "text")(),
				songs: traverseList(data, "musicResponsiveListItemRenderer").map(item =>
					SongParser.parseAlbumSong(item, artists, albumBasic, thumbnails)
				)
			},
			ALBUM_FULL
		)
	}

	public static parseSearchResult(item: any): AlbumDetailed {
		const flexColumns = traverseList(item, "flexColumns")

		return checkType<AlbumDetailed>(
			{
				type: "ALBUM",
				albumId: traverseString(item, "browseId")(-1),
				playlistId: traverseString(item, "overlay", "playlistId")(),
				artists: traverseList(flexColumns[1], "runs")
					.filter(run => "navigationEndpoint" in run)
					.map(run => ({
						artistId: traverseString(run, "browseId")(),
						name: traverseString(run, "text")()
					})),
				name: traverseString(flexColumns[0], "runs", "text")(),
				year: +traverseString(flexColumns[1], "runs", "text")(-1),
				thumbnails: traverseList(item, "thumbnails")
			},
			ALBUM_DETAILED
		)
	}

	public static parseArtistAlbum(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return checkType<AlbumDetailed>(
			{
				type: "ALBUM",
				albumId: traverseString(item, "browseId")(-1),
				playlistId: traverseString(item, "thumbnailOverlay", "playlistId")(),
				name: traverseString(item, "title", "text")(),
				artists: [artistBasic],
				year: +traverseString(item, "subtitle", "text")(-1),
				thumbnails: traverseList(item, "thumbnails")
			},
			ALBUM_DETAILED
		)
	}

	public static parseArtistTopAlbums(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return checkType<AlbumDetailed>(
			{
				type: "ALBUM",
				albumId: traverseString(item, "browseId")(-1),
				playlistId: traverseString(item, "musicPlayButtonRenderer", "playlistId")(),
				name: traverseString(item, "title", "text")(),
				artists: [artistBasic],
				year: +traverseString(item, "subtitle", "text")(-1),
				thumbnails: traverseList(item, "thumbnails")
			},
			ALBUM_DETAILED
		)
	}
}
