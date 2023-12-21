import { AlbumBasic, ArtistBasic, SongDetailed, SongFull, ThumbnailFull } from "../@types/types"
import checkType from "../utils/checkType"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"
import Parser from "./Parser"

export default class SongParser {
	public static parse(data: any): SongFull {
		return checkType(
			{
				type: "SONG",
				videoId: traverseString(data, "videoDetails", "videoId")(),
				name: traverseString(data, "videoDetails", "title")(),
				artists: [
					{
						artistId: traverseString(data, "videoDetails", "channelId")(),
						name: traverseString(data, "author")(),
					},
				],
				duration: +traverseString(data, "videoDetails", "lengthSeconds")(),
				thumbnails: traverseList(data, "videoDetails", "thumbnails"),
				description: traverseString(data, "description")(),
				formats: traverseList(data, "streamingData", "formats"),
				adaptiveFormats: traverseList(data, "streamingData", "adaptiveFormats"),
			},
			SongFull,
		)
	}

	public static parseSearchResult(item: any): SongDetailed {
		const flexColumns = traverseList(item, "flexColumns")

		return checkType(
			{
				type: "SONG",
				videoId: traverseString(item, "playlistItemData", "videoId")(),
				name: traverseString(flexColumns[0], "runs", "text")(),
				artists: traverseList(flexColumns[1], "runs")
					.filter(run => "navigationEndpoint" in run)
					.map(run => ({
						artistId: traverseString(run, "browseId")(),
						name: traverseString(run, "text")(),
					}))
					.slice(0, -1),
				album: {
					albumId: traverseString(flexColumns[1], "runs", "browseId")(-1),
					name: traverseString(flexColumns[1], "runs", "text")(-3),
				},
				duration: Parser.parseDuration(traverseString(flexColumns[1], "runs", "text")(-1)),
				thumbnails: traverseList(item, "thumbnails"),
			},
			SongDetailed,
		)
	}

	public static parseArtistSong(item: any): SongDetailed {
		const flexColumns = traverseList(item, "flexColumns")
		const videoId = traverseString(item, "playlistItemData", "videoId")()

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(flexColumns[0], "runs", "text")(),
				artists: traverseList(flexColumns[1], "runs")
					.filter(run => "navigationEndpoint" in run)
					.map(run => ({
						artistId: traverseString(run, "browseId")(),
						name: traverseString(run, "text")(),
					})),
				album: {
					albumId: traverseString(flexColumns[2], "browseId")(),
					name: traverseString(flexColumns[2], "runs", "text")(),
				},
				duration: Parser.parseDuration(
					traverseString(item, "fixedColumns", "runs", "text")(),
				),
				thumbnails: traverseList(item, "thumbnails"),
			},
			SongDetailed,
		)
	}

	public static parseArtistTopSong(item: any, artistBasic: ArtistBasic): SongDetailed {
		const flexColumns = traverseList(item, "flexColumns")
		const videoId = traverseString(item, "playlistItemData", "videoId")()

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(flexColumns[0], "runs", "text")(),
				artists: [artistBasic],
				album: {
					albumId: traverseString(flexColumns[2], "browseId")(),
					name: traverseString(flexColumns[2], "runs", "text")(),
				},
				duration: null,
				thumbnails: traverseList(item, "thumbnails"),
			},
			SongDetailed,
		)
	}

	public static parseAlbumSong(
		item: any,
		artists: ArtistBasic[],
		albumBasic: AlbumBasic,
		thumbnails: ThumbnailFull[],
	): SongDetailed {
		const flexColumns = traverseList(item, "flexColumns")
		const videoId = traverseString(item, "playlistItemData", "videoId")()

		return checkType(
			{
				type: "SONG",
				videoId,
				name: traverseString(flexColumns[0], "runs", "text")(),
				artists,
				album: albumBasic,
				duration: Parser.parseDuration(
					traverseString(item, "fixedColumns", "runs", "text")(),
				),
				thumbnails,
			},
			SongDetailed,
		)
	}
}
