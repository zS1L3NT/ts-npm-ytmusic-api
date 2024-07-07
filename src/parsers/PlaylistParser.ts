import { ArtistBasic, PlaylistDetailed, PlaylistFull } from "../types"
import checkType from "../utils/checkType"
import { isArtist } from "../utils/filters"
import { traverse, traverseList, traverseString } from "../utils/traverse"

export default class PlaylistParser {
	public static parse(data: any, playlistId: string): PlaylistFull {
		const artist = traverse(data, "tabs", "straplineTextOne")

		return checkType(
			{
				type: "PLAYLIST",
				playlistId,
				name: traverseString(data, "tabs", "title", "text"),
				artist: {
					name: traverseString(artist, "text"),
					artistId: traverseString(artist, "browseId") || null,
				},
				videoCount:
					+traverseList(data, "tabs", "secondSubtitle", "text")
						.at(2)
						.split(" ")
						.at(0)
						.replaceAll(",", "") ?? null,
				thumbnails: traverseList(data, "tabs", "thumbnails"),
			},
			PlaylistFull,
		)
	}

	public static parseSearchResult(item: any): PlaylistDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()

		// No specific way to identify the title
		const title = columns[0]
		const artist = columns.find(isArtist) || columns[3]

		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "overlay", "playlistId"),
				name: traverseString(title, "text"),
				artist: {
					name: traverseString(artist, "text"),
					artistId: traverseString(artist, "browseId") || null,
				},
				thumbnails: traverseList(item, "thumbnails"),
			},
			PlaylistDetailed,
		)
	}

	public static parseArtistFeaturedOn(item: any, artistBasic: ArtistBasic): PlaylistDetailed {
		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "navigationEndpoint", "browseId"),
				name: traverseString(item, "runs", "text"),
				artist: artistBasic,
				thumbnails: traverseList(item, "thumbnails"),
			},
			PlaylistDetailed,
		)
	}

	public static parseHomeSection(item: any): PlaylistDetailed {
		const artist = traverse(item, "subtitle", "runs")

		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "navigationEndpoint", "playlistId"),
				name: traverseString(item, "runs", "text"),
				artist: {
					name: traverseString(artist, "text"),
					artistId: traverseString(artist, "browseId") || null,
				},
				thumbnails: traverseList(item, "thumbnails"),
			},
			PlaylistDetailed,
		)
	}
}
