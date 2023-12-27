import { ArtistBasic, VideoDetailed, VideoFull } from "../@types/types"
import checkType from "../utils/checkType"
import { isArtist, isDuration, isTitle } from "../utils/filters"
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
			artist: {
				artistId: traverseString(data, "videoDetails", "channelId")(),
				name: traverseString(data, "author")(),
			},
			duration: +traverseString(data, "videoDetails", "lengthSeconds")(),
			thumbnails: traverseList(data, "videoDetails", "thumbnails"),
			unlisted: traverse(data, "unlisted"),
			familySafe: traverse(data, "familySafe"),
			paid: traverse(data, "paid"),
			tags: traverseList(data, "tags"),
		}
	}

	public static parseSearchResult(item: any): VideoDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()

		const title = columns.find(isTitle)
		const artist = columns.find(isArtist)
		const duration = columns.find(isDuration)

		return {
			type: "VIDEO",
			videoId: traverseString(item, "playNavigationEndpoint", "videoId")(),
			name: traverseString(title, "text")(),
			artist: {
				name: traverseString(artist, "text")(),
				artistId: traverseString(artist, "browseId")(),
			},
			duration: Parser.parseDuration(duration.text),
			thumbnails: traverseList(item, "thumbnails"),
		}
	}

	public static parseArtistTopVideo(item: any, artistBasic: ArtistBasic): VideoDetailed {
		return {
			type: "VIDEO",
			videoId: traverseString(item, "videoId")(),
			name: traverseString(item, "runs", "text")(),
			artist: artistBasic,
			duration: null,
			thumbnails: traverseList(item, "thumbnails"),
		}
	}

	public static parsePlaylistVideo(item: any): VideoDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()

		const title = columns.find(isTitle) || columns[0]
		const artist = columns.find(isArtist) || columns[1]
		const duration = columns.find(isDuration)

		return checkType(
			{
				type: "VIDEO",
				videoId:
					traverseString(item, "playNavigationEndpoint", "videoId")() ||
					traverseList(item, "thumbnails")[0].url.match(
						/https:\/\/i\.ytimg\.com\/vi\/(.+)\//,
					)[1],
				name: traverseString(title, "text")(),
				artist: {
					name: traverseString(artist, "text")(),
					artistId: traverseString(artist, "browseId")() || null,
				},
				duration: duration ? Parser.parseDuration(duration.text) : null,
				thumbnails: traverseList(item, "thumbnails"),
			},
			VideoDetailed,
		)
	}
}
