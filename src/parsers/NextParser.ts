import { ArtistBasic, NextResult } from "../types"
import checkType from "../utils/checkType"
import { traverse, traverseList, traverseString } from "../utils/traverse"

export default class NextParser {
	public static parse(data: any): NextResult {
		const nextData = traverseString(data, "playlistPanelVideoRenderer")
            const artistData = traverse(nextData, "longBylineText");
		const artistBasic: ArtistBasic = {
			artistId: traverseString(artistData, "browseId") || null,
			name: traverseString(artistData, "text"),
		}
            
		return checkType(
			{
				index: +traverseString(nextData, "navigationEndpoint", "index"),
				selected: !!traverseString(nextData, "selected"),
				params: traverseString(nextData, "navigationEndpoint", "params"),
				name: traverseString(nextData, "title", "text"),
				artist: artistBasic,
				playlistId: traverseString(nextData, "navigationEndpoint", "playlistId"),
				videoId: traverseString(nextData, "videoId"),
				thumbnails: traverseList(nextData, "thumbnails"),
			},
			NextResult,
		)
	}
}
