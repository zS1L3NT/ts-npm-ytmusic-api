import Parse from "./Parser"
import traverse from "./traverse"

export default class ArtistParser {
	private data: any

	public constructor(data: any) {
		this.data = data
	}

	public parse(artistId: string): YTMusic.ArtistFull {
		const artistBasic: YTMusic.ArtistBasic = {
			artistId,
			name: traverse(this.data, "header", "title", "text").at(0)
		}

		return {
			type: "ARTIST",
			...artistBasic,
			thumbnails: traverse(this.data, "header", "thumbnails"),
			description: traverse(this.data, "header", "description", "text"),
			subscribers: Parse.parseNumber(traverse(this.data, "subscriberCountText", "text")),
			topTracks: traverse(this.data, "musicShelfRenderer", "contents").map((item: any) => {
				const flexColumns = traverse(item, "flexColumns")

				return {
					type: "SONG",
					videoId: traverse(item, "playlistItemData", "videoId"),
					name: traverse(flexColumns[0], "runs", "text"),
					artists: [artistBasic],
					album: {
						albumId: traverse(flexColumns[2], "runs", "text"),
						name: traverse(flexColumns[2], "browseId")
					},
					thumbnails: [traverse(item, "thumbnails")].flat()
				}
			}),
			topAlbums: [traverse(this.data, "musicCarouselShelfRenderer")]
				.flat()
				.at(0)
				.contents.map((item: any) => ({
					type: "ALBUM",
					albumId: traverse(item, "browseId").at(-1),
					playlistId: traverse(item, "musicPlayButtonRenderer", "playlistId"),
					name: traverse(item, "title", "text").at(0),
					artists: [artistBasic],
					year: +traverse(item, "subtitle", "text").at(-1),
					thumbnails: [traverse(item, "thumbnails")].flat()
				}))
		}
	}

	public static parseSongs(songsData: any, moreSongsData: any): YTMusic.SongDetailed[] {
		return [
			...traverse(songsData, "musicResponsiveListItemRenderer"),
			...traverse(moreSongsData, "musicResponsiveListItemRenderer")
		].map((item: any) => {
			const flexColumns = traverse(item, "flexColumns")

			return {
				type: "SONG",
				videoId: traverse(item, "playlistItemData", "videoId"),
				name: traverse(flexColumns[0], "runs", "text"),
				artists: [traverse(flexColumns[1], "runs")].flat().map((run: any) => ({
					name: run.text,
					artistId: traverse(run, "browseId")
				})),
				album: {
					albumId: traverse(flexColumns[2], "browseId"),
					name: traverse(flexColumns[2], "runs", "text")
				},
				duration: Parse.parseDuration(traverse(item, "fixedColumns", "runs", "text")),
				thumbnails: [traverse(item, "thumbnails")].flat()
			}
		})
	}

	public static parseAlbums(artistId: string, albumsData: any): YTMusic.AlbumDetailed[] {
		return traverse(albumsData, "musicTwoRowItemRenderer").map((item: any) => ({
			type: "ALBUM",
			albumId: [traverse(item, "browseId")].flat().at(-1),
			playlistId: traverse(item, "thumbnailOverlay", "playlistId"),
			name: traverse(item, "title", "text").at(0),
			artists: [
				{
					artistId,
					name: traverse(albumsData, "header", "text").at(0)
				}
			],
			year: +traverse(item, "subtitle", "text").at(-1),
			thumbnails: [traverse(item, "thumbnails")].flat()
		}))
	}
}
