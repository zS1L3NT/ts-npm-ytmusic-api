import { PlaylistFull } from "../schemas"
import checkType from "../utils/checkType"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"

export default class PlaylistParser {
	public static parse(data: any, playlistId: string): PlaylistFull {
		return checkType(
			{
				type: "PLAYLIST",
				playlistId,
				name: traverseString(data, "header", "title", "text")(),
				artist: {
					artistId: traverseString(data, "header", "subtitle", "browseId")(),
					name: traverseString(data, "header", "subtitle", "text")(2)
				},
				thumbnails: traverseList(data, "header", "thumbnails")
			},
			PlaylistFull
		)
	}

	public static parseSearchResult(item: any): PlaylistFull {
		const flexColumns = traverseList(item, "flexColumns")
		const artistId = traverseString(flexColumns[1], "browseId")()

		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "overlay", "playlistId")(),
				name: traverseString(flexColumns[0], "runs", "text")(),
				artist: {
					artistId,
					name: traverseString(flexColumns[1], "runs", "text")(-2)
				},
				thumbnails: traverseList(item, "thumbnails")
			},
			PlaylistFull
		)
	}
}
