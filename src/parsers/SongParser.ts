import { AlbumBasic, ArtistBasic, SongDetailed, SongFull, ThumbnailFull } from "../types"
import checkType from "../utils/checkType"
import { isDuration, isExplicit } from "../utils/filters"
import { traverseList, traverseString } from "../utils/traverse"
import Parser from "./Parser"

export default class SongParser {
	public static parse(data: any): SongFull {
		const artist = {
			artistId: traverseString(data, "videoDetails", "channelId"),
			name: traverseString(data, "author"),
		}

		return checkType(
			{
				type: "SONG",
				videoId: traverseString(data, "videoDetails", "videoId"),
				name: traverseString(data, "videoDetails", "title"),
				artist,
				// YouTube only names the channel a video is on
				artists: [artist],
				duration: +traverseString(data, "videoDetails", "lengthSeconds"),
				thumbnails: traverseList(data, "videoDetails", "thumbnails"),
				formats: traverseList(data, "streamingData", "formats"),
				adaptiveFormats: traverseList(data, "streamingData", "adaptiveFormats"),
			},
			SongFull,
		)
	}

	/**
	 * @param options.album Album to use when the item links none, as on the album's page
	 * @param options.thumbnails Thumbnails to use when the item has none, as on the album's page
	 */
	public static parseItem(
		item: any,
		options: {
			artists?: ArtistBasic[]
			album?: AlbumBasic
			thumbnails?: ThumbnailFull[]
			labelled?: boolean
		} = {},
	): SongDetailed {
		const { title, segments, endpoint, thumbnails } = Parser.parseFields(item)
		const artists = Parser.parseArtists(segments, options)

		return checkType(
			{
				type: "SONG",
				videoId: traverseString(endpoint, "videoId") || traverseString(item, "videoId"),
				name: traverseString(title, "text"),
				artist: artists[0] ?? Parser.UNKNOWN_ARTIST,
				artists,
				album: Parser.parseAlbum(segments) ?? options.album ?? null,
				duration: Parser.parseDuration(segments.flat().find(isDuration)?.text),
				explicit: isExplicit(item),
				thumbnails: thumbnails.length ? thumbnails : options.thumbnails ?? [],
			},
			SongDetailed,
		)
	}
}
