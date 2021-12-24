import traverse from "../utils/traverse"
import fs from "fs"

export default class AlbumParser {
	public static parseSearch(item: any): YTMusic.AlbumDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "ALBUM",
			albumId: [traverse(item, "browseId")].flat().at(-1),
			playlistId: traverse(item, "overlay", "playlistId"),
			artists: traverse(flexColumns[1], "runs")
				.filter((run: any) => "navigationEndpoint" in run)
				.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text })),
			name: traverse(flexColumns[0], "runs", "text"),
			year: +traverse(flexColumns[1], "runs", "text").at(-1),
			thumbnails: [thumbnails].flat()
		}
	}
}
