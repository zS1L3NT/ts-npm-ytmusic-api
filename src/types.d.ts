declare namespace YTMusic {
	interface ThumbnailFull {
		url: string
		width: number
		height: number
	}

	interface SongDetailed {
		type: "SONG"
		videoId: string
		name: string
		artists: ArtistBasic[]
		album: AlbumBasic
		duration: number
		thumbnails: ThumbnailFull[]
	}

	interface VideoDetailed {
		type: "VIDEO"
		videoId: string
		name: string
		artist: ArtistBasic
		views: number
		duration: number
		thumbnails: ThumbnailFull[]
	}

	interface ArtistBasic {
		artistId: string
		name: string
	}

	interface ArtistDetailed extends ArtistBasic {
		type: "ARTIST"
		thumbnails: ThumbnailFull[]
	}

	interface AlbumBasic {
		albumId: string
		name: string
	}

	interface AlbumDetailed extends AlbumBasic {
		type: "ALBUM"
		playlistId: string
		artists: ArtistBasic[]
		year: number
		thumbnails: ThumbnailFull[]
	}

	interface PlaylistDetailed {
		type: "PLAYLIST"
		playlistId: string
		name: string
		artist: ArtistBasic
		trackCount: number
		thumbnails: ThumbnailFull[]
	}

	type SearchResult =
		| SongDetailed
		| PlaylistDetailed
		| VideoDetailed
		| AlbumDetailed
		| ArtistDetailed
		| PlaylistDetailed
}
