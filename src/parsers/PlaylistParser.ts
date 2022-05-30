import { PlaylistFull } from "../"
import { PLAYLIST_FULL } from "../interfaces"
import checkType from "../utils/checkType"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"

export default class PlaylistParser {
	public static parse(data: any, playlistId: string): PlaylistFull {
		return checkType<PlaylistFull>(
			{
				type: "PLAYLIST",
				playlistId,
				name: traverseString(data, "header", "title", "text")(),
				artist: {
					artistId: traverseString(data, "header", "subtitle", "browseId")(),
					name: traverseString(data, "header", "subtitle", "text")(2)
				},
				videoCount: +traverseList(data, "header", "secondSubtitle", "text")
					.at(0)
					.split(" ")
					.at(0)
					.replaceAll(",", ""),
				thumbnails: traverseList(data, "header", "thumbnails")
			},
			PLAYLIST_FULL
		)
	}

	public static parseSearchResult(item: any): PlaylistFull {
		const flexColumns = traverseList(item, "flexColumns")
		const artistId = traverseString(flexColumns[1], "browseId")()

		return checkType<PlaylistFull>(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "overlay", "playlistId")(),
				name: traverseString(flexColumns[0], "runs", "text")(),
				artist: {
					artistId,
					name: traverseString(flexColumns[1], "runs", "text")(-2)
				},
				videoCount: +traverseList(flexColumns[1], "runs", "text")
					.at(-1)
					.split(" ")
					.at(0)
					.replaceAll(",", ""),
				thumbnails: traverseList(item, "thumbnails")
			},
			PLAYLIST_FULL
		)
	}
}
