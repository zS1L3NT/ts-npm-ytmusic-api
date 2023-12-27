import { PlaylistDetailed, PlaylistFull } from "../@types/types"
import checkType from "../utils/checkType"
import { isArtist } from "../utils/filters"
import traverse from "../utils/traverse"
import traverseList from "../utils/traverseList"
import traverseString from "../utils/traverseString"

export default class PlaylistParser {
	public static parse(data: any, playlistId: string): PlaylistFull {
		const artist = traverse(data, "header", "subtitle")

		return checkType(
			{
				type: "PLAYLIST",
				playlistId,
				name: traverseString(data, "header", "title", "text")(),
				artist: {
					name: traverseString(artist, "text")(),
					artistId: traverseString(artist, "browseId")(),
				},
				videoCount:
					+traverseList(data, "header", "secondSubtitle", "text")
						.at(2)
						.split(" ")
						.at(0)
						.replaceAll(",", "") ?? null,
				thumbnails: traverseList(data, "header", "thumbnails"),
			},
			PlaylistFull,
		)
	}

	public static parseSearchResult(item: any): PlaylistDetailed {
		const columns = traverseList(item, "flexColumns", "runs").flat()

		// No specific way to identify the title
		const title = columns[0]
		// Possibility to be empty because it's by YouTube Music
		const artist = columns.find(isArtist)

		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "overlay", "playlistId")(),
				name: traverseString(title, "text")(),
				artist: {
					name: artist ? traverseString(artist, "text")() : "YouTube Music",
					artistId: traverseString(artist, "browseId")() || null,
				},
				thumbnails: traverseList(item, "thumbnails"),
			},
			PlaylistDetailed,
		)
	}

	public static parseArtistFeaturedOn(item: any): PlaylistDetailed {
		return checkType(
			{
				type: "PLAYLIST",
				playlistId: traverseString(item, "navigationEndpoint", "browseId")(),
				name: traverseString(item, "runs", "text")(),
				artist: {
					artistId: traverseString(item, "browseId")(),
					name: traverseString(item, "runs", "text")(-3),
				},
				thumbnails: traverseList(item, "thumbnails"),
			},
			PlaylistDetailed,
		)
	}
}
