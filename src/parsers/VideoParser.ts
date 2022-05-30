import { VideoDetailed, VideoFull } from "../"
import { VIDEO_DETAILED } from "../interfaces"
import checkType from "../utils/checkType"
import traverse from "../utils/traverse"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"
import Parser from "./Parser"

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
			duration: Parser.parseDuration(traverseString(flexColumns[1], "text")(-1)),
			thumbnails: traverseList(item, "thumbnails")
		}
	}

	public static parsePlaylistVideo(item: any): VideoDetailed {
		const flexColumns = traverseList(item, "flexColumns")
		const videoId =
			traverseString(item, "playNavigationEndpoint", "videoId")() ||
			traverseList(item, "thumbnails")[0].url.match(/https:\/\/i\.ytimg\.com\/vi\/(.+)\//)[1]

		return checkType<VideoDetailed>(
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
			VIDEO_DETAILED
		)
	}
}
