import { ArtistBasic, VideoDetailed, VideoFull } from "../types"
import checkType from "../utils/checkType"
import { isDuration } from "../utils/filters"
import { traverse, traverseList, traverseString } from "../utils/traverse"
import Parser from "./Parser"

export default class VideoParser {
	public static parse(data: any): VideoFull {
		const artist = {
			artistId: traverseString(data, "videoDetails", "channelId"),
			name: traverseString(data, "author"),
		}

		return checkType(
			{
				type: "VIDEO",
				videoId: traverseString(data, "videoDetails", "videoId"),
				name: traverseString(data, "videoDetails", "title"),
				artist,
				// YouTube only names the channel a video is on
				artists: [artist],
				duration: +traverseString(data, "videoDetails", "lengthSeconds"),
				thumbnails: traverseList(data, "videoDetails", "thumbnails"),
				unlisted: traverse(data, "unlisted"),
				familySafe: traverse(data, "familySafe"),
				paid: traverse(data, "paid"),
				tags: traverseList(data, "tags"),
			},
			VideoFull,
		)
	}

	public static parseItem(
		item: any,
		options: { artists?: ArtistBasic[]; labelled?: boolean } = {},
	): VideoDetailed {
		const { title, segments, endpoint, thumbnails } = Parser.parseFields(item)
		const artists = Parser.parseArtists(segments, options)

		return checkType(
			{
				type: "VIDEO",
				// Unavailable playlist videos keep their ID only in the thumbnail URL
				videoId:
					traverseString(endpoint, "videoId") ||
					traverseString(item, "videoId") ||
					(thumbnails[0]?.url.match(
						/^https:\/\/i\.ytimg\.com\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//,
					)?.[1] ??
						""),
				name: traverseString(title, "text"),
				artist: artists[0] ?? Parser.UNKNOWN_ARTIST,
				artists,
				duration: Parser.parseDuration(segments.flat().find(isDuration)?.text),
				thumbnails,
			},
			VideoDetailed,
		)
	}
}
