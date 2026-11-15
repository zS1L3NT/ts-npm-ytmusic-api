import { ArtistDetailed, ArtistFull, SearchResult } from "../types"
import checkType from "../utils/checkType"
import { traverse, traverseList, traverseString } from "../utils/traverse"
import AlbumParser from "./AlbumParser"
import Parser from "./Parser"
import PlaylistParser from "./PlaylistParser"
import SongParser from "./SongParser"
import VideoParser from "./VideoParser"

export default class ArtistParser {
	public static parse(data: any, artistId: string): ArtistFull {
		const artists = [ArtistParser.parseBasic(data, artistId)]
		const { albums, singles } = ArtistParser.parseAlbumShelves(data)
		const items = (type: SearchResult["type"]) =>
			ArtistParser.parseShelves(data, type)[0]?.items ?? []

		return checkType(
			{
				type: "ARTIST",
				...artists[0]!,
				thumbnails: Parser.parseThumbnails(traverse(data, "header")),
				topSongs: traverseList(
					data,
					"musicShelfRenderer",
					"musicResponsiveListItemRenderer",
				).map(item => SongParser.parseItem(item, { artists })),
				topAlbums: (albums?.items ?? []).map(item =>
					AlbumParser.parseItem(item, { artists }),
				),
				topSingles: (singles?.items ?? []).map(item =>
					AlbumParser.parseItem(item, { artists }),
				),
				topVideos: items("VIDEO").map(item => VideoParser.parseItem(item, { artists })),
				featuredOn: items("PLAYLIST").map(item =>
					PlaylistParser.parseItem(item, { labelled: true }),
				),
				similarArtists: items("ARTIST").map(item => ArtistParser.parseItem(item)),
			},
			ArtistFull,
		)
	}

	public static parseItem(item: any): ArtistDetailed {
		const { title, endpoint, thumbnails } = Parser.parseFields(item)

		return checkType(
			{
				type: "ARTIST",
				artistId: traverseString(endpoint, "browseId"),
				name: traverseString(title, "text"),
				thumbnails,
			},
			ArtistDetailed,
		)
	}

	public static parseBasic(data: any, artistId: string) {
		return { artistId, name: traverseString(data, "header", "title", "text") }
	}

	/**
	 * @returns Request body for the page listing every album, when the artist
	 * has more albums than their own page shows
	 */
	public static parseAlbumsEndpoint(data: any): { browseId: string; params: string } | null {
		const endpoint =
			ArtistParser.parseAlbumShelves(data).albums?.title.navigationEndpoint?.browseEndpoint

		return endpoint ? { browseId: endpoint.browseId, params: endpoint.params } : null
	}

	// Shelves have translated titles, so they are told apart by what they hold
	private static parseShelves(data: any, type: SearchResult["type"]) {
		return traverseList(data, "musicCarouselShelfRenderer")
			.map(shelf => ({
				title: traverseList(shelf.header, "title", "runs")[0],
				items: traverseList(shelf.contents, "musicTwoRowItemRenderer"),
			}))
			.filter(
				({ title, items }) =>
					// The untitled shelf only promotes the artist's latest release
					title && Parser.parseType(Parser.parseFields(items[0] ?? {}).endpoint) === type,
			)
	}

	private static parseAlbumShelves(data: any) {
		// Singles and EPs name their type before the year; albums show the year alone
		const isSingles = ({ items }: { items: any[] }) =>
			Parser.parseFields(items[0]).segments.length > 1
		const shelves = ArtistParser.parseShelves(data, "ALBUM")

		return {
			albums: shelves.find(shelf => !isSingles(shelf)),
			singles: shelves.find(isSingles),
		}
	}
}
