import traverse from "./traverse"

const parseDuration = (time: string) => {
	const [seconds, minutes, hours] = time
		.split(":")
		.reverse()
		.map(n => +n) as (number | undefined)[]

	return (seconds || 0) + (minutes || 0) * 60 + (hours || 0) * 60 * 60
}

const parseViews = (views: string): number => {
	views = views.slice(0, -6)

	if (views.at(-1)!.match(/^[A-Z]+$/)) {
		const number = +views.slice(0, -1)
		const multiplier = views.at(-1)

		return (
			{
				K: number * 1000,
				M: number * 1000 * 1000,
				B: number * 1000 * 1000 * 1000
			}[multiplier!] || NaN
		)
	} else {
		return +views
	}
}

export default class Parser {
	private items: any[]

	constructor(data: any) {
		this.items = [traverse(data, "musicResponsiveListItemRenderer")].flat()
	}

	public parseSongsSearchResults(): YTMusic.SongDetailed[] {
		return this.items.map(item => this.parseSongSearchResult(item))
	}

	private parseSongSearchResult(item: any): YTMusic.SongDetailed {
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
			duration: parseDuration(traverse(flexColumns[1], "runs", "text").at(-1)),
			thumbnails: [thumbnails].flat()
		}
	}

	public parseVideosSearchResults(): YTMusic.VideoDetailed[] {
		return this.items.map(item => this.parseVideoSearchResult(item, true))
	}

	private parseVideoSearchResult(item: any, specific: boolean): YTMusic.VideoDetailed {
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
			views: parseViews(traverse(flexColumns[1], "runs", "text").at(-3)),
			duration: parseDuration(traverse(flexColumns[1], "text").at(-1)),
			thumbnails: [thumbnails].flat()
		}
	}

	public parseArtistsSearchResults(): YTMusic.ArtistDetailed[] {
		return this.items.map(item => this.parseArtistSearchResult(item))
	}

	private parseArtistSearchResult(item: any): YTMusic.ArtistDetailed {
		const flexColumns = traverse(item, "flexColumns")
		const thumbnails = traverse(item, "thumbnails")

		return {
			type: "ARTIST",
			artistId: traverse(item, "browseId"),
			name: traverse(flexColumns[0], "runs", "text"),
			thumbnails: [thumbnails].flat()
		}
	}

	public parseAlbumsSearchResults(): YTMusic.AlbumDetailed[] {
		return this.items.map(item => this.parseAlbumSearchResult(item))
	}

	private parseAlbumSearchResult(item: any): YTMusic.AlbumDetailed {
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

	public parsePlaylistsSearchResults(): YTMusic.PlaylistDetailed[] {
		return this.items.map(item => this.parsePlaylistSearchResult(item, true))
	}

	private parsePlaylistSearchResult(item: any, specific: boolean): YTMusic.PlaylistDetailed {
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

	public parseSearchResult(): YTMusic.SearchResult[] {
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
				Song: () => this.parseSongSearchResult(item),
				Video: () => this.parseVideoSearchResult(item, true),
				Artist: () => this.parseArtistSearchResult(item),
				EP: () => this.parseAlbumSearchResult(item),
				Single: () => this.parseAlbumSearchResult(item),
				Album: () => this.parseAlbumSearchResult(item),
				Playlist: () => this.parsePlaylistSearchResult(item, true)
			}[type]()
		})
	}
}
