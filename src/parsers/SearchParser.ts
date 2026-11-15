import { ArtistBasic, SearchResult } from "../types"
import { traverseList } from "../utils/traverse"
import AlbumParser from "./AlbumParser"
import ArtistParser from "./ArtistParser"
import Parser from "./Parser"
import PlaylistParser from "./PlaylistParser"
import SongParser from "./SongParser"
import VideoParser from "./VideoParser"

export default class SearchParser {
	public static parse(data: any): SearchResult[] {
		const card = traverseList(data, "musicCardShelfRenderer")[0]
		const top = card ? SearchParser.parseItem(card, { labelled: true }) : null
		// Songs listed under an artist's card leave the artist out
		const artists = top?.type === "ARTIST" ? [{ artistId: top.artistId, name: top.name }] : []
		const cardItems = traverseList(card, "musicResponsiveListItemRenderer")

		return [
			top,
			...traverseList(data, "musicResponsiveListItemRenderer").map(item =>
				SearchParser.parseItem(item, {
					artists: cardItems.includes(item) ? artists : [],
					labelled: true,
				}),
			),
		].filter((result): result is SearchResult => result !== null)
	}

	/**
	 * Parses an item of any type, for lists that mix them
	 *
	 * @returns null for types outside SearchResult, like podcasts and profiles
	 */
	public static parseItem(
		item: any,
		options: { artists?: ArtistBasic[]; labelled?: boolean } = {},
	): SearchResult | null {
		switch (Parser.parseType(Parser.parseFields(item).endpoint)) {
			case "SONG":
				return SongParser.parseItem(item, options)
			case "VIDEO":
				return VideoParser.parseItem(item, options)
			case "ARTIST":
				return ArtistParser.parseItem(item)
			case "ALBUM":
				return AlbumParser.parseItem(item, options)
			case "PLAYLIST":
				return PlaylistParser.parseItem(item, options)
			default:
				return null
		}
	}
}
