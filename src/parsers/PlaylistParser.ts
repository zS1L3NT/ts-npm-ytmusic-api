import { PlaylistDetailed, PlaylistFull } from "../schemas"
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
					name: traverseString(data, "header", "subtitle", "text")(2),
				},
				videoCount:
					+traverseList(data, "header", "secondSubtitle", "text")
						.at(2)
						.split(" ")
						.at(0)
						.replaceAll(",", "") ?? null,
				thumbnails: traverseList(data, "header", "thumbnails"),
			},
			PlaylistFull,
		)
	}

	public static parseSearchResult(item: any): PlaylistDetailed {
		const flexColumns = traverseList(item, "flexColumns")

		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "overlay", "playlistId")(),
				name: traverseString(flexColumns[0], "runs", "text")(),
				artist: {
					artistId: traverseString(flexColumns[1], "browseId")(),
					name: traverseString(flexColumns[1], "runs", "text")(-3),
				},
				thumbnails: traverseList(item, "thumbnails"),
			},
			PlaylistDetailed,
		)
	}

	public static parseArtistFeaturedOn(item: any): PlaylistDetailed {
		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "navigationEndpoint", "browseId")(),
				name: traverseString(item, "runs", "text")(),
				artist: {
					artistId: traverseString(item, "browseId")(),
					name: traverseString(item, "runs", "text")(-3),
				},
				thumbnails: traverseList(item, "thumbnails"),
			},
			PlaylistDetailed,
		)
	}
}
