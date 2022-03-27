import checkType from "../utils/checkType"
import Parser from "./Parser"
import traverse from "../utils/traverse"
import { ALBUM_BASIC, ARTIST_BASIC, SONG_DETAILED, SONG_FULL, THUMBNAIL_FULL } from "../interfaces"
import { AlbumBasic, ArtistBasic, SongDetailed, SongFull, ThumbnailFull } from ".."
import { LIST, OBJECT, STRING } from "validate-any"

export default class SongParser {
	public static parse(data: any): SongFull {
		return checkType<SongFull>(
			{
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
			},
			SONG_FULL
		)
	}

	public static parseSearchResult(item: any): SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playlistItemData", "videoId")

		return checkType<SongDetailed>(
			{
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
			},
			SONG_DETAILED
		)
	}

	public static parseArtistSong(item: any): SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playlistItemData", "videoId")

		return checkType<SongDetailed>(
			{
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
			},
			SONG_DETAILED
		)
	}

	public static parseArtistTopSong(
		item: any,
		artistBasic: ArtistBasic
	): Omit<SongDetailed, "duration"> {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playlistItemData", "videoId")

		return checkType<Omit<SongDetailed, "duration">>(
			{
				type: "SONG",
				videoId: videoId instanceof Array ? null : videoId,
				name: traverse(flexColumns[0], "runs", "text"),
				artists: [artistBasic],
				album: {
					albumId: traverse(flexColumns[2], "runs", "text"),
					name: traverse(flexColumns[2], "browseId")
				},
				thumbnails: [traverse(item, "thumbnails")].flat()
			},
			OBJECT({
				type: STRING("SONG"),
				videoId: STRING(),
				name: STRING(),
				artists: LIST(ARTIST_BASIC),
				album: ALBUM_BASIC,
				thumbnails: LIST(THUMBNAIL_FULL)
			})
		)
	}

	public static parseAlbumSong(
		item: any,
		artists: ArtistBasic[],
		albumBasic: AlbumBasic,
		thumbnails: ThumbnailFull[]
	): SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const videoId = traverse(item, "playlistItemData", "videoId")

		return checkType<SongDetailed>(
			{
				type: "SONG",
				videoId: videoId instanceof Array ? null : videoId,
				name: traverse(flexColumns[0], "runs", "text"),
				artists,
				album: albumBasic,
				duration: Parser.parseDuration(traverse(item, "fixedColumns", "runs", "text")),
				thumbnails
			},
			SONG_DETAILED
		)
	}
}
