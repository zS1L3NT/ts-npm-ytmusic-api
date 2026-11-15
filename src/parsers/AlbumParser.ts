import { AlbumBasic, AlbumDetailed, AlbumFull, ArtistBasic } from "../types"
import checkType from "../utils/checkType"
import { traverse, traverseList, traverseString } from "../utils/traverse"
import Parser from "./Parser"
import SongParser from "./SongParser"

export default class AlbumParser {
	public static parse(data: any, albumId: string): AlbumFull {
		const album: AlbumBasic = {
			albumId,
			name: traverseString(data, "tabs", "title", "text"),
		}
		const artists = Parser.parseArtists([
			traverseList(data, "tabs", "straplineTextOne", "runs"),
		])
		const thumbnails = Parser.parseThumbnails(traverse(data, "background"))

		return checkType(
			{
				type: "ALBUM",
				albumId,
				playlistId: traverseString(data, "musicPlayButtonRenderer", "playlistId"),
				name: album.name,
				artist: artists[0] ?? Parser.UNKNOWN_ARTIST,
				artists,
				year: Parser.parseYear([traverseList(data, "tabs", "subtitle", "runs")]),
				thumbnails,
				songs: traverseList(data, "musicResponsiveListItemRenderer").map(item =>
					SongParser.parseItem(item, { artists, album, thumbnails }),
				),
			},
			AlbumFull,
		)
	}

	public static parseItem(item: any, options: { artists?: ArtistBasic[] } = {}): AlbumDetailed {
		const { title, segments, endpoint, thumbnails } = Parser.parseFields(item)
		// Wherever albums show artists, their type, like "Single", comes first
		const artists = Parser.parseArtists(segments, { ...options, labelled: true })

		return checkType(
			{
				type: "ALBUM",
				albumId: traverseString(endpoint, "browseId"),
				playlistId: traverseString(
					item.overlay ?? item.thumbnailOverlay ?? item.buttons,
					"playlistId",
				),
				name: traverseString(title, "text"),
				artist: artists[0] ?? Parser.UNKNOWN_ARTIST,
				artists,
				year: Parser.parseYear(segments),
				thumbnails,
			},
			AlbumDetailed,
		)
	}
}
