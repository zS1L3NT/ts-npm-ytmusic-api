import { AlbumBasic, ArtistBasic, SongDetailed, SongFull, ThumbnailFull } from "../types"
import checkType from "../utils/checkType"
import { isAlbum, isArtist, isDuration, isTitle } from "../utils/filters"
import { traverseList, traverseString } from "../utils/traverse"
import Parser from "./Parser"

export default class SongParser {
	public static parse(data: any): SongFull {
		return checkType(
			{
				type: "SONG",
				videoId: traverseString(data, "videoDetails", "videoId"),
				name: traverseString(data, "videoDetails", "title"),
				artist: {
					name: traverseString(data, "author"),
					artistId: traverseString(data, "videoDetails", "channelId"),
				},
				duration: +traverseString(data, "videoDetails", "lengthSeconds"),
				thumbnails: traverseList(data, "videoDetails", "thumbnails"),
				formats: traverseList(data, "streamingData", "formats"),
				adaptiveFormats: traverseList(data, "streamingData", "adaptiveFormats"),
			},
			SongFull,
		)
	}

	public static parseSearchResult(item: any): SongDetailed {
		const columns = traverseList(item, "flexColumns", "runs")
		const listData = traverseList(item, "menu", "navigationEndpoint")

		// It is not possible to identify the title and author
		const title = columns[0]
		const artist = columns.find(isArtist) || columns[3]
		const album = columns.find(isAlbum) ?? null
		const duration = columns.find(isDuration)

		return checkType(
			{
				type: "SONG",
				videoId: traverseString(item, "playlistItemData", "videoId"),
				name: traverseString(title, "text"),
				artist: {
					name: traverseString(artist, "text"),
					artistId: traverseString(artist, "browseId") || null,
				},
				album: album
					? {
							name: traverseString(album, "text"),
							albumId: traverseString(album, "browseId"),
						}
					: null,
				duration: Parser.parseDuration(duration?.text),
				thumbnails: traverseList(item, "thumbnails"),
				listId: traverseString(listData, "playlistId") || null,
				params: traverseString(listData, "params") || null,
			},
			SongDetailed,
		)
	}

	public static parseArtistSong(item: any, artistBasic: ArtistBasic): SongDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()
		const listData = traverseList(item, "menu", "navigationEndpoint")

		const title = columns.find(isTitle)
		const album = columns.find(isAlbum)
		const duration = columns.find(isDuration)

		return checkType(
			{
				type: "SONG",
				videoId: traverseString(item, "playlistItemData", "videoId"),
				name: traverseString(title, "text"),
				artist: artistBasic,
				album: album
					? {
							name: traverseString(album, "text"),
							albumId: traverseString(album, "browseId"),
						}
					: null,
				duration: Parser.parseDuration(duration?.text),
				thumbnails: traverseList(item, "thumbnails"),
				listId: traverseString(listData, "playlistId") || null,
				params: traverseString(listData, "params") || null,
			},
			SongDetailed,
		)
	}

	public static parseArtistTopSong(item: any, artistBasic: ArtistBasic): SongDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()
		const listData = traverseList(item, "menu", "navigationEndpoint")

		const title = columns.find(isTitle)
		const album = columns.find(isAlbum)

		return checkType(
			{
				type: "SONG",
				videoId: traverseString(item, "playlistItemData", "videoId"),
				name: traverseString(title, "text"),
				artist: artistBasic,
				album: {
					name: traverseString(album, "text"),
					albumId: traverseString(album, "browseId"),
				},
				duration: null,
				thumbnails: traverseList(item, "thumbnails"),
				listId: traverseString(listData, "playlistId") || null,
				params: traverseString(listData, "params") || null,
			},
			SongDetailed,
		)
	}

	public static parseAlbumSong(
		item: any,
		artistBasic: ArtistBasic,
		albumBasic: AlbumBasic,
		thumbnails: ThumbnailFull[],
	): SongDetailed {
		const title = traverseList(item, "flexColumns", "runs").find(isTitle)
		const duration = traverseList(item, "fixedColumns", "runs").find(isDuration)
		const listData = traverseList(item, "menu", "navigationEndpoint")

		return checkType(
			{
				type: "SONG",
				videoId: traverseString(item, "playlistItemData", "videoId"),
				name: traverseString(title, "text"),
				artist: artistBasic,
				album: albumBasic,
				duration: Parser.parseDuration(duration?.text),
				thumbnails,
				listId: traverseString(listData, "playlistId") || null,
				params: traverseString(listData, "params") || null,
			},
			SongDetailed,
		)
	}

	public static parseHomeSection(item: any) {
		return SongParser.parseSearchResult(item)
	}
}
