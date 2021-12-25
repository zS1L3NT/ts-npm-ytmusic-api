declare namespace YTMusic {
	interface ThumbnailFull {
		url: string
		width: number
		height: number
	}

	interface SongDetailed {
		type: "SONG"
		videoId: string | null
		name: string
		artists: ArtistBasic[]
		album: AlbumBasic
		duration: number
		thumbnails: ThumbnailFull[]
	}

	interface SongFull extends Omit<SongDetailed, "album"> {
		description: string
		formats: any[]
		adaptiveFormats: any[]
	}

	interface VideoDetailed {
		type: "VIDEO"
		videoId: string | null
		name: string
		artists: ArtistBasic[]
		views: number
		duration: number
		thumbnails: ThumbnailFull[]
	}

	interface VideoFull extends VideoDetailed {
		description: string
		unlisted: boolean
		familySafe: boolean
		paid: boolean
		tags: string[]
	}

	interface ArtistBasic {
		artistId: string | null
		name: string
	}

	interface ArtistDetailed extends ArtistBasic {
		type: "ARTIST"
		artistId: string
		thumbnails: ThumbnailFull[]
	}

	interface ArtistFull extends ArtistDetailed {
		description: string | null
		subscribers: number
		topSongs: Omit<SongDetailed, "duration">[]
		topAlbums: AlbumDetailed[]
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

	interface AlbumFull extends AlbumDetailed {
		description: string | null
		songs: SongDetailed[]
	}

	interface PlaylistDetailed {
		type: "PLAYLIST"
		playlistId: string
		name: string
		artist: ArtistBasic
		videoCount: number
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
