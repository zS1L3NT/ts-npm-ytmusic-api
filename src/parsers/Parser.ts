import { PageType } from "../constants"
import { HomeSection } from "../types"
import checkType from "../utils/checkType"
import { traverseList, traverseString } from "../utils/traverse"
import AlbumParser from "./AlbumParser"
import PlaylistParser from "./PlaylistParser"
import SongParser from "./SongParser"

export default class Parser {
	public static parseDuration(time: string) {
		if (!time) return null

		const [seconds, minutes, hours] = time
			.split(":")
			.reverse()
			.map(n => +n) as (number | undefined)[]

		return (seconds || 0) + (minutes || 0) * 60 + (hours || 0) * 60 * 60
	}

	public static parseNumber(string: string): number {
		if (string.at(-1)!.match(/^[A-Z]+$/)) {
			const number = +string.slice(0, -1)
			const multiplier = string.at(-1)

			return (
				{
					K: number * 1000,
					M: number * 1000 * 1000,
					B: number * 1000 * 1000 * 1000,
					T: number * 1000 * 1000 * 1000 * 1000,
				}[multiplier!] || NaN
			)
		} else {
			return +string
		}
	}

	public static parseContinuation(data: any): string {
		return (
			traverseString(data, "nextContinuationData", "continuation") ||
			traverseString(data, "continuationCommand", "token")
		)
	}

	public static parseHomeSection(data: any): HomeSection {
		return checkType(
			{
				title: traverseString(data, "header", "title", "text"),
				contents: traverseList(data, "contents")
					.map(item => {
						const pageType = traverseString(item, "title", "browseEndpoint", "pageType")
						const playlistId = traverseString(
							item,
							"navigationEndpoint",
							"watchPlaylistEndpoint",
							"playlistId",
						)
						switch (pageType) {
							case PageType.MUSIC_PAGE_TYPE_ALBUM:
								return AlbumParser.parseHomeSection(item)
							case PageType.MUSIC_PAGE_TYPE_PLAYLIST:
								return PlaylistParser.parseHomeSection(item)
							case "":
								if (playlistId) {
									return PlaylistParser.parseHomeSection(item)
								} else if (traverseString(item, "videoId")) {
									return SongParser.parseHomeSection(item)
								}
								return null
							default:
								return null
						}
					})
					.filter((item): item is HomeSection["contents"][number] => item !== null),
			},
			HomeSection,
		)
	}
}
