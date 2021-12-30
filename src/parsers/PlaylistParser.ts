import traverse from "../utils/traverse"
import YTMusic from ".."

export default class PlaylistParser {
	public static parse(data: any, playlistId: string): YTMusic.PlaylistFull {
		return {
			type: "PLAYLIST",
			playlistId,
			name: traverse(data, "header", "title", "text").at(0),
			artist: {
				artistId: traverse(data, "header", "subtitle", "browseId"),
				name: traverse(data, "header", "subtitle", "text").at(2)
			},
			videoCount: +traverse(data, "header", "secondSubtitle", "text")
				.at(0)
				.split(" ")
				.at(0)
				.replaceAll(",", ""),
			thumbnails: traverse(data, "header", "thumbnails")
		}
	}

	public static parseSearchResult(item: any): YTMusic.PlaylistFull {
		const flexColumns = traverse(item, "flexColumns")
		const artistId = traverse(flexColumns[1], "browseId")

		return {
			type: "PLAYLIST",
			playlistId: traverse(item, "overlay", "playlistId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artist: {
				artistId: artistId instanceof Array ? null : artistId,
				name: traverse(flexColumns[1], "runs", "text").at(-2)
			},
			videoCount: +traverse(flexColumns[1], "runs", "text")
				.at(-1)
				.split(" ")
				.at(0)
				.replaceAll(",", ""),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}
}
