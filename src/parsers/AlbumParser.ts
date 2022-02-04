import SongParser from "./SongParser"
import traverse from "../traverse"
import { AlbumDetailed, AlbumFull, ArtistBasic } from ".."

export default class AlbumParser {
	public static parse(data: any, albumId: string): AlbumFull {
		const albumBasic = {
			albumId,
			name: traverse(data, "header", "title", "text").at(0)
		}
		const artists = traverse(data, "header", "subtitle", "runs")
			.filter((run: any) => "navigationEndpoint" in run)
			.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text }))
		const thumbnails = [traverse(data, "header", "thumbnails")].flat()
		const description = traverse(data, "description", "text")

		return {
			type: "ALBUM",
			...albumBasic,
			playlistId: traverse(data, "buttonRenderer", "playlistId"),
			artists,
			year: +traverse(data, "header", "subtitle", "text").at(-1),
			thumbnails,
			description: description instanceof Array ? null : description,
			songs: [traverse(data, "musicResponsiveListItemRenderer")]
				.flat()
				.map((item: any) =>
					SongParser.parseAlbumSong(item, artists, albumBasic, thumbnails)
				)
		}
	}

	public static parseSearchResult(item: any): AlbumDetailed {
		const flexColumns = traverse(item, "flexColumns")

		return {
			type: "ALBUM",
			albumId: [traverse(item, "browseId")].flat().at(-1),
			playlistId: traverse(item, "overlay", "playlistId"),
			artists: traverse(flexColumns[1], "runs")
				.filter((run: any) => "navigationEndpoint" in run)
				.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text })),
			name: traverse(flexColumns[0], "runs", "text"),
			year: +traverse(flexColumns[1], "runs", "text").at(-1),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}

	public static parseArtistAlbum(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return {
			type: "ALBUM",
			albumId: [traverse(item, "browseId")].flat().at(-1),
			playlistId: traverse(item, "thumbnailOverlay", "playlistId"),
			name: traverse(item, "title", "text").at(0),
			artists: [artistBasic],
			year: +traverse(item, "subtitle", "text").at(-1),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}

	public static parseArtistTopAlbums(item: any, artistBasic: ArtistBasic): AlbumDetailed {
		return {
			type: "ALBUM",
			albumId: traverse(item, "browseId").at(-1),
			playlistId: traverse(item, "musicPlayButtonRenderer", "playlistId"),
			name: traverse(item, "title", "text").at(0),
			artists: [artistBasic],
			year: +traverse(item, "subtitle", "text").at(-1),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}
	}
}
