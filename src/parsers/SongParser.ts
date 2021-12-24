import Parser from "./Parser"
import traverse from "../utils/traverse"

export default class SongParser {
	public static parseSearch(item: any): YTMusic.SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "SONG",
			videoId: traverse(item, "playlistItemData", "videoId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artists: traverse(flexColumns[1], "runs")
				.map((run: any) =>
					"navigationEndpoint" in run
						? { name: run.text, artistId: traverse(run, "browseId") }
						: null
				)
				.slice(0, -3)
				.filter(Boolean),
			album: {
				albumId: traverse(item, "browseId").at(-1),
				name: traverse(flexColumns[1], "runs", "text").at(-3)
			},
			duration: Parser.parseDuration(traverse(flexColumns[1], "runs", "text").at(-1)),
			thumbnails: thumbnails
		}
	}
}
