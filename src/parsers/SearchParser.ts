import AlbumParser from "./AlbumParser"
import ArtistParser from "./ArtistParser"
import PlaylistParser from "./PlaylistParser"
import SongParser from "./SongParser"
import traverse from "../utils/traverse"
import VideoParser from "./VideoParser"

export default class SearchParser {
	public static parse(item: any): YTMusic.SearchResult {
		const flexColumns = traverse(item, "flexColumns")
		const type = traverse(flexColumns[1], "runs", "text").at(0) as
			| "Song"
			| "Video"
			| "Artist"
			| "EP"
			| "Single"
			| "Album"
			| "Playlist"

		return {
			Song: SongParser.parseSearchResult,
			Video: VideoParser.parseSearchResult,
			Artist: ArtistParser.parseSearchResult,
			EP: AlbumParser.parseSearchResult,
			Single: AlbumParser.parseSearchResult,
			Album: AlbumParser.parseSearchResult,
			Playlist: PlaylistParser.parseSearchResult
		}[type](item)
	}
}
