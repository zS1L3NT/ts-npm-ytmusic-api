import Parse from "./Parser"
import traverse from "./traverse"

export default class SearchParser {
	private items: any[]

	public constructor(data: any) {
		this.items = [traverse(data, "musicResponsiveListItemRenderer")].flat()
	}

	public parseSongs(): YTMusic.SongDetailed[] {
		return this.items.map(item => this.parseSong(item))
	}

	private parseSong(item: any): YTMusic.SongDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "SONG",
			videoId: traverse(item, "playlistItemData", "videoId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artists: traverse(flexColumns[1], "runs")
				.map((run: any) =>
					"navigationEndpoint" in run
						? { name: run.text, artistId: traverse(run, "browseId") }
						: null
				)
				.slice(0, -3)
				.filter(Boolean),
			album: {
				albumId: traverse(item, "browseId").at(-1),
				name: traverse(flexColumns[1], "runs", "text").at(-3)
			},
			duration: Parse.parseDuration(traverse(flexColumns[1], "runs", "text").at(-1)),
			thumbnails: [thumbnails].flat()
		}
	}

	public parseVideos(): YTMusic.VideoDetailed[] {
		return this.items.map(item => this.parseVideo(item, true))
	}

	private parseVideo(item: any, specific: boolean): YTMusic.VideoDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "VIDEO",
			videoId: traverse(item, "playNavigationEndpoint", "videoId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artist: {
				artistId: traverse(flexColumns[1], "browseId"),
				name: traverse(flexColumns[1], "runs", "text").at(specific ? 0 : 2)
			},
			views: Parse.parseNumber(traverse(flexColumns[1], "runs", "text").at(-3).slice(0, -6)),
			duration: Parse.parseDuration(traverse(flexColumns[1], "text").at(-1)),
			thumbnails: [thumbnails].flat()
		}
	}

	public parseArtists(): YTMusic.ArtistDetailed[] {
		return this.items.map(item => this.parseArtist(item))
	}

	private parseArtist(item: any): YTMusic.ArtistDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "ARTIST",
			artistId: traverse(item, "browseId"),
			name: traverse(flexColumns[0], "runs", "text"),
			thumbnails: [thumbnails].flat()
		}
	}

	public parseAlbums(): YTMusic.AlbumDetailed[] {
		return this.items.map(item => this.parseAlbum(item))
	}

	private parseAlbum(item: any): YTMusic.AlbumDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "ALBUM",
			albumId: traverse(item, "browseId").at(-1),
			playlistId: traverse(item, "overlay", "playlistId"),
			artists: traverse(flexColumns[1], "runs")
				.map((run: any) =>
					"navigationEndpoint" in run
						? { name: run.text, artistId: traverse(run, "browseId") }
						: null
				)
				.slice(0, -1)
				.filter(Boolean),
			name: traverse(flexColumns[0], "runs", "text"),
			year: +traverse(flexColumns[1], "runs", "text").at(-1),
			thumbnails: [thumbnails].flat()
		}
	}

	public parsePlaylists(): YTMusic.PlaylistDetailed[] {
		return this.items.map(item => this.parsePlaylist(item, true))
	}

	private parsePlaylist(item: any, specific: boolean): YTMusic.PlaylistDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "PLAYLIST",
			playlistId: traverse(item, "overlay", "playlistId"),
			name: traverse(flexColumns[0], "runs", "text"),
			artist: {
				artistId: traverse(flexColumns[1], "browseId"),
				name: traverse(flexColumns[1], "runs", "text").at(specific ? 0 : 2)
			},
			trackCount: +traverse(flexColumns[1], "runs", "text").at(-1).split(" ").at(0),
			thumbnails: [thumbnails].flat()
		}
	}

	public parse(): YTMusic.SearchResult[] {
		return this.items.map(item => {
			const flexColumns = traverse(item, "flexColumns")
			const type = traverse(flexColumns[1], "runs", "text").at(0) as
				| "Song"
				| "Video"
				| "Artist"
				| "EP"
				| "Single"
				| "Album"
				| "Playlist"

			return {
				Song: () => this.parseSong(item),
				Video: () => this.parseVideo(item, true),
				Artist: () => this.parseArtist(item),
				EP: () => this.parseAlbum(item),
				Single: () => this.parseAlbum(item),
				Album: () => this.parseAlbum(item),
				Playlist: () => this.parsePlaylist(item, true)
			}[type]()
		})
	}
}
