import Parser from "./Parser"
import traverse from "../utils/traverse"

export default class SongParser {
	public static parseSearchResult(item: any): YTMusic.SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "SONG",
			videoId: traverse(item, "playlistItemData", "videoId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artists: traverse(flexColumns[1], "runs")
				.map((run: any) =>
					"navigationEndpoint" in run
						? { name: run.text, artistId: traverse(run, "browseId") }
						: null
				)
				.slice(0, -3)
				.filter(Boolean),
			album: {
				albumId: traverse(item, "browseId").at(-1),
				name: traverse(flexColumns[1], "runs", "text").at(-3)
			},
			duration: Parser.parseDuration(traverse(flexColumns[1], "runs", "text").at(-1)),
			thumbnails: thumbnails
		}
	}

	public static parseArtistSong(item: any): YTMusic.SongDetailed {
		const flexColumns = traverse(item, "flexColumns")

		return {
			type: "SONG",
			videoId: traverse(item, "playlistItemData", "videoId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artists: [traverse(flexColumns[1], "runs")]
				.flat()
				.filter((item: any) => "navigationEndpoint" in item)
				.map((run: any) => ({
					name: run.text,
					artistId: traverse(run, "browseId")
				})),
			album: {
				albumId: traverse(flexColumns[2], "browseId"),
				name: traverse(flexColumns[2], "runs", "text")
			},
			duration: Parser.parseDuration(traverse(item, "fixedColumns", "runs", "text")),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}

	public static parseArtistTopSong(
		item: any,
		artistBasic: YTMusic.ArtistBasic
	): Omit<YTMusic.SongDetailed, "duration"> {
		const flexColumns = traverse(item, "flexColumns")

		return {
			type: "SONG",
			videoId: traverse(item, "playlistItemData", "videoId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artists: [artistBasic],
			album: {
				albumId: traverse(flexColumns[2], "runs", "text"),
				name: traverse(flexColumns[2], "browseId")
			},
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}
}
