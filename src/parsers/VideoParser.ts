import Parser from "./Parser"
import traverse from "../utils/traverse"

export default class VideoParser {
	public static parseSearchResult(item: any): YTMusic.VideoDetailed {
		const flexColumns = traverse(item, "flexColumns")

		return {
			type: "VIDEO",
			videoId: traverse(item, "playNavigationEndpoint", "videoId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artists: traverse(flexColumns[1], "runs")
				.filter((run: any) => "navigationEndpoint" in run)
				.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text })),
			views: Parser.parseNumber(traverse(flexColumns[1], "runs", "text").at(-3).slice(0, -6)),
			duration: Parser.parseDuration(traverse(flexColumns[1], "text").at(-1)),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}
}
