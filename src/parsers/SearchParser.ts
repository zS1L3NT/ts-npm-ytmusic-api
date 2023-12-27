import { SearchResult } from "../@types/types"
import { traverseList } from "../utils/traverse"
import AlbumParser from "./AlbumParser"
import ArtistParser from "./ArtistParser"
import PlaylistParser from "./PlaylistParser"
import SongParser from "./SongParser"
import VideoParser from "./VideoParser"

export default class SearchParser {
	public static parse(item: any): SearchResult | null {
		const flexColumns = traverseList(item, "flexColumns")
		const type = traverseList(flexColumns[1], "runs", "text").at(0) as
			| "Song"
			| "Video"
			| "Artist"
			| "EP"
			| "Single"
			| "Album"
			| "Playlist"

		const parsers = {
			Song: SongParser.parseSearchResult,
			Video: VideoParser.parseSearchResult,
			Artist: ArtistParser.parseSearchResult,
			EP: AlbumParser.parseSearchResult,
			Single: AlbumParser.parseSearchResult,
			Album: AlbumParser.parseSearchResult,
			Playlist: PlaylistParser.parseSearchResult,
		}

		if (parsers[type]) {
			return parsers[type](item)
		} else {
			return null
		}
	}
}
