import Parser from "./Parser"
import traverse from "../utils/traverse"
import { VideoDetailed, VideoFull } from ".."

export default class VideoParser {
	public static parse(data: any): VideoFull {
		return {
			type: "VIDEO",
			videoId: traverse(data, "videoDetails", "videoId"),
			name: traverse(data, "videoDetails", "title"),
			artists: [
				{
					artistId: traverse(data, "videoDetails", "channelId"),
					name: traverse(data, "author")
				}
			],
			views: +traverse(data, "videoDetails", "viewCount"),
			duration: +traverse(data, "videoDetails", "lengthSeconds"),
			thumbnails: [traverse(data, "videoDetails", "thumbnails")].flat(),
			description: traverse(data, "description"),
			unlisted: traverse(data, "unlisted"),
			familySafe: traverse(data, "familySafe"),
			paid: traverse(data, "paid"),
			tags: traverse(data, "tags")
		}
	}

	public static parseSearchResult(item: any): VideoDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playNavigationEndpoint", "videoId")

		return {
			type: "VIDEO",
			videoId: videoId instanceof Array ? null : videoId,
			name: traverse(flexColumns[0], "runs", "text"),
			artists: [traverse(flexColumns[1], "runs")]
				.flat()
				.filter((run: any) => "navigationEndpoint" in run)
				.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text })),
			views: Parser.parseNumber(traverse(flexColumns[1], "runs", "text").at(-3).slice(0, -6)),
			duration: Parser.parseDuration(traverse(flexColumns[1], "text").at(-1)),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}

	public static parsePlaylistVideo(item: any): Omit<VideoDetailed, "views"> {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playNavigationEndpoint", "videoId")

		return {
			type: "VIDEO",
			videoId: videoId instanceof Array ? null : videoId,
			name: traverse(flexColumns[0], "runs", "text"),
			artists: [traverse(flexColumns[1], "runs")]
				.flat()
				.filter((run: any) => "navigationEndpoint" in run)
				.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text })),
			duration: Parser.parseDuration(traverse(item, "fixedColumns", "runs", "text")),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}
}
