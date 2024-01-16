import { AlbumBasic, AlbumDetailed, AlbumFull, ArtistBasic } from "../@types/types"
import checkType from "../utils/checkType"
import { isArtist } from "../utils/filters"
import { traverse, traverseList, traverseString } from "../utils/traverse"
import SongParser from "./SongParser"

export default class AlbumParser {
	public static parse(data: any, albumId: string): AlbumFull {
		const albumBasic: AlbumBasic = {
			albumId,
			name: traverseString(data, "header", "title", "text"),
		}

		const artistData = traverse(data, "header", "subtitle", "runs")
		const artistBasic: ArtistBasic = {
			artistId: traverseString(artistData, "browseId") || null,
			name: traverseString(artistData, "text"),
		}

		const thumbnails = traverseList(data, "header", "thumbnails")

		return checkType(
			{
				type: "ALBUM",
				...albumBasic,
				playlistId: traverseString(data, "buttonRenderer", "playlistId"),
				artist: artistBasic,
				year: AlbumParser.processYear(
					traverseList(data, "header", "subtitle", "text").at(-1),
				),
				thumbnails,
				songs: traverseList(data, "musicResponsiveListItemRenderer").map(item =>
					SongParser.parseAlbumSong(item, artistBasic, albumBasic, thumbnails),
				),
			},
			AlbumFull,
		)
	}

	public static parseSearchResult(item: any): AlbumDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()

		// No specific way to identify the title
		const title = columns[0]
		const artist = columns.find(isArtist) || columns[3]
		const playlistId =
			traverseString(item, "overlay", "playlistId") ||
			traverseString(item, "thumbnailOverlay", "playlistId")

		return checkType(
			{
				type: "ALBUM",
				albumId: traverseList(item, "browseId").at(-1),
				playlistId,
				artist: {
					name: traverseString(artist, "text"),
					artistId: traverseString(artist, "browseId") || null,
				},
				year: AlbumParser.processYear(columns.at(-1)?.text),
				name: traverseString(title, "text"),
				thumbnails: traverseList(item, "thumbnails"),
			},
			AlbumDetailed,
		)
	}

	public static parseArtistAlbum(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return checkType(
			{
				type: "ALBUM",
				albumId: traverseList(item, "browseId").at(-1),
				playlistId: traverseString(item, "thumbnailOverlay", "playlistId"),
				name: traverseString(item, "title", "text"),
				artist: artistBasic,
				year: AlbumParser.processYear(traverseList(item, "subtitle", "text").at(-1)),
				thumbnails: traverseList(item, "thumbnails"),
			},
			AlbumDetailed,
		)
	}

	public static parseArtistTopAlbum(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return checkType(
			{
				type: "ALBUM",
				albumId: traverseList(item, "browseId").at(-1),
				playlistId: traverseString(item, "musicPlayButtonRenderer", "playlistId"),
				name: traverseString(item, "title", "text"),
				artist: artistBasic,
				year: AlbumParser.processYear(traverseList(item, "subtitle", "text").at(-1)),
				thumbnails: traverseList(item, "thumbnails"),
			},
			AlbumDetailed,
		)
	}

	private static processYear(year: string) {
		return year && year.match(/^\d{4}$/) ? +year : null
	}
}
