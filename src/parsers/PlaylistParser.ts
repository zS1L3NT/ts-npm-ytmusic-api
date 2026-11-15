import { PlaylistDetailed, PlaylistFull } from "../types"
import checkType from "../utils/checkType"
import { traverse, traverseList, traverseString } from "../utils/traverse"
import Parser from "./Parser"

export default class PlaylistParser {
	public static parse(data: any, playlistId: string): PlaylistFull {
		const artist = traverse(data, "tabs", "straplineTextOne")
		const facepile = traverse(data, "tabs", "facepile", "avatarStackViewModel")
		// A view count comes before the video count, but only on playlists that show three facts
		const facts = Parser.parseSegments(traverseList(data, "tabs", "secondSubtitle", "runs"))
		const count = facts[facts.length > 2 ? 1 : 0]?.[0]?.text

		return checkType(
			{
				type: "PLAYLIST",
				playlistId,
				name: traverseString(data, "tabs", "title", "text"),
				artist: {
					artistId:
						traverseString(artist, "browseId") ||
						traverseString(facepile, "browseId") ||
						null,
					name:
						traverseString(artist, "text") ||
						traverseString(facepile, "text", "content"),
				},
				videoCount: +(count?.replace(/\D/g, "") ?? 0),
				thumbnails: Parser.parseThumbnails(traverse(data, "tabs")),
			},
			PlaylistFull,
		)
	}

	public static parseItem(item: any, options: { labelled?: boolean } = {}): PlaylistDetailed {
		const { title, segments, endpoint, thumbnails } = Parser.parseFields(item)

		return checkType(
			{
				type: "PLAYLIST",
				playlistId:
					traverseString(endpoint, "browseId").replace(/^VL/, "") ||
					traverseString(endpoint, "playlistId"),
				name: traverseString(title, "text"),
				artist: Parser.parseArtists(segments, options)[0] ?? Parser.UNKNOWN_ARTIST,
				thumbnails,
			},
			PlaylistDetailed,
		)
	}
}
