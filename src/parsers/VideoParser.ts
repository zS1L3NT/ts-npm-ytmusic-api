import checkType from "../utils/checkType"
import Parser from "./Parser"
import traverse from "../utils/traverse"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"
import { PLAYLIST_VIDEO } from "../interfaces"
import { VideoDetailed, VideoFull } from ".."

export default class VideoParser {
	public static parse(data: any): VideoFull {
		return {
			type: "VIDEO",
			videoId: traverseString(data, "videoDetails", "videoId")(),
			name: traverseString(data, "videoDetails", "title")(),
			artists: [
				{
					artistId: traverseString(data, "videoDetails", "channelId")(),
					name: traverseString(data, "author")()
				}
			],
			views: +traverseString(data, "videoDetails", "viewCount")(),
			duration: +traverseString(data, "videoDetails", "lengthSeconds")(),
			thumbnails: traverseList(data, "videoDetails", "thumbnails"),
			description: traverseString(data, "description")(),
			unlisted: traverse(data, "unlisted"),
			familySafe: traverse(data, "familySafe"),
			paid: traverse(data, "paid"),
			tags: traverseList(data, "tags")
		}
	}

	public static parseSearchResult(item: any): VideoDetailed {
		const flexColumns = traverseList(item, "flexColumns")
		const videoId = traverseString(item, "playNavigationEndpoint", "videoId")()

		return {
			type: "VIDEO",
			videoId,
			name: traverseString(flexColumns[0], "runs", "text")(),
			artists: traverseList(flexColumns[1], "runs")
				.filter(run => "navigationEndpoint" in run)
				.map(run => ({
					artistId: traverseString(run, "browseId")(),
					name: traverseString(run, "text")()
				})),
			views: Parser.parseNumber(
				traverseString(flexColumns[1], "runs", "text")(-3).slice(0, -6)
			),
			duration: Parser.parseDuration(traverseString(flexColumns[1], "text")(-1)),
			thumbnails: traverseList(item, "thumbnails")
		}
	}

	public static parsePlaylistVideo(item: any): Omit<VideoDetailed, "views"> {
		const flexColumns = traverseList(item, "flexColumns")
		const videoId = traverseString(item, "playNavigationEndpoint", "videoId")()

		return checkType<Omit<VideoDetailed, "views">>(
			{
				type: "VIDEO",
				videoId,
				name: traverseString(flexColumns[0], "runs", "text")(),
				artists: traverseList(flexColumns[1], "runs")
					.filter(run => "navigationEndpoint" in run)
					.map(run => ({
						artistId: traverseString(run, "browseId")(),
						name: traverseString(run, "text")()
					})),
				duration: Parser.parseDuration(
					traverseString(item, "fixedColumns", "runs", "text")()
				),
				thumbnails: traverseList(item, "thumbnails")
			},
			PLAYLIST_VIDEO
		)
	}
}
