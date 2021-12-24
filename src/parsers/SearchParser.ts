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
			Song: () => SongParser.parseSearch(item),
			Video: () => VideoParser.parseSearch(item, true),
			Artist: () => ArtistParser.parseSearch(item),
			EP: () => AlbumParser.parseSearch(item),
			Single: () => AlbumParser.parseSearch(item),
			Album: () => AlbumParser.parseSearch(item),
			Playlist: () => PlaylistParser.parseSearch(item, true)
		}[type]()
	}
}
