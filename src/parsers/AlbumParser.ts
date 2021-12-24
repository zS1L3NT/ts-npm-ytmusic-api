import traverse from "../utils/traverse"

export default class AlbumParser {
	public static parseSearchResult(item: any): YTMusic.AlbumDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "ALBUM",
			albumId: [traverse(item, "browseId")].flat().at(-1),
			playlistId: traverse(item, "overlay", "playlistId"),
			artists: traverse(flexColumns[1], "runs")
				.filter((run: any) => "navigationEndpoint" in run)
				.map((run: any) => ({ artistId: traverse(run, "browseId"), name: run.text })),
			name: traverse(flexColumns[0], "runs", "text"),
			year: +traverse(flexColumns[1], "runs", "text").at(-1),
			thumbnails: [thumbnails].flat()
		}
	}

	public static parseArtistAlbums(artistId: string, albumsData: any): YTMusic.AlbumDetailed[] {
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

	public static parseArtistTopAlbums(
		item: any,
		artistBasic: YTMusic.ArtistBasic
	): YTMusic.AlbumDetailed {
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
