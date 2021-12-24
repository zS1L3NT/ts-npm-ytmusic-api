import traverse from "../utils/traverse"

export default class PlaylistParser {
	public static parseSearch(item: any, specific: boolean): YTMusic.PlaylistDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")
		const artistId = traverse(flexColumns[1], "browseId")

		return {
			type: "PLAYLIST",
			playlistId: traverse(item, "overlay", "playlistId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artist: {
				artistId: artistId instanceof Array ? undefined : artistId,
				name: traverse(flexColumns[1], "runs", "text").at(specific ? 0 : 2)
			},
			trackCount: +traverse(flexColumns[1], "runs", "text").at(-1).split(" ").at(0),
			thumbnails: [thumbnails].flat()
		}
	}
}
