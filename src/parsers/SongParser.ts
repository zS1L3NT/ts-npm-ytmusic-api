import Parser from "./Parser"
import traverse from "../utils/traverse"

export default class SongParser {
	public static parse(data: any): YTMusic.SongFull {
		return {
			type: "SONG",
			videoId: traverse(data, "videoDetails", "videoId"),
			name: traverse(data, "videoDetails", "title"),
			artists: [
				{
					artistId: traverse(data, "videoDetails", "channelId"),
					name: traverse(data, "author")
				}
			],
			duration: +traverse(data, "videoDetails", "lengthSeconds"),
			thumbnails: [traverse(data, "videoDetails", "thumbnails")].flat(),
			description: traverse(data, "description"),
			formats: traverse(data, "streamingData", "formats"),
			adaptiveFormats: traverse(data, "streamingData", "adaptiveFormats")
		}
	}

	public static parseSearchResult(item: any): YTMusic.SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playlistItemData", "videoId")

		return {
			type: "SONG",
			videoId: videoId instanceof Array ? null : videoId,
			name: traverse(flexColumns[0], "runs", "text"),
			artists: traverse(flexColumns[1], "runs")
				.filter((run: any) => "navigationEndpoint" in run)
				.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text }))
				.slice(0, -1),
			album: {
				albumId: traverse(item, "browseId").at(-1),
				name: traverse(flexColumns[1], "runs", "text").at(-3)
			},
			duration: Parser.parseDuration(traverse(flexColumns[1], "runs", "text").at(-1)),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}

	public static parseArtistSong(item: any): YTMusic.SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playlistItemData", "videoId")

		return {
			type: "SONG",
			videoId: videoId instanceof Array ? null : videoId,
			name: traverse(flexColumns[0], "runs", "text"),
			artists: [traverse(flexColumns[1], "runs")]
				.flat()
				.filter((item: any) => "navigationEndpoint" in item)
				.map((run: any) => ({
					artistId: traverse(run, "browseId"),
					name: run.text
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
		const videoId = traverse(item, "playlistItemData", "videoId")

		return {
			type: "SONG",
			videoId: videoId instanceof Array ? null : videoId,
			name: traverse(flexColumns[0], "runs", "text"),
			artists: [artistBasic],
			album: {
				albumId: traverse(flexColumns[2], "runs", "text"),
				name: traverse(flexColumns[2], "browseId")
			},
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}

	public static parseAlbumSong(
		item: any,
		artists: YTMusic.ArtistBasic[],
		albumBasic: YTMusic.AlbumBasic,
		thumbnails: YTMusic.ThumbnailFull[]
	): YTMusic.SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playlistItemData", "videoId")

		return {
			type: "SONG",
			videoId: videoId instanceof Array ? null : videoId,
			name: traverse(flexColumns[0], "runs", "text"),
			artists,
			album: albumBasic,
			duration: Parser.parseDuration(traverse(item, "fixedColumns", "runs", "text")),
			thumbnails
		}
	}
}
