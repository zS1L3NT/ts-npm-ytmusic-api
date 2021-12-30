import Api from "./Api"

declare namespace YTMusic {
	export { Api }

	export interface ThumbnailFull {
		url: string
		width: number
		height: number
	}

	export interface SongDetailed {
		type: "SONG"
		videoId: string | null
		name: string
		artists: ArtistBasic[]
		album: AlbumBasic
		duration: number
		thumbnails: ThumbnailFull[]
	}

	export interface SongFull extends Omit<SongDetailed, "album"> {
		description: string
		formats: any[]
		adaptiveFormats: any[]
	}

	export interface VideoDetailed {
		type: "VIDEO"
		videoId: string | null
		name: string
		artists: ArtistBasic[]
		views: number
		duration: number
		thumbnails: ThumbnailFull[]
	}

	export interface VideoFull extends VideoDetailed {
		description: string
		unlisted: boolean
		familySafe: boolean
		paid: boolean
		tags: string[]
	}

	export interface ArtistBasic {
		artistId: string | null
		name: string
	}

	export interface ArtistDetailed extends ArtistBasic {
		type: "ARTIST"
		artistId: string
		thumbnails: ThumbnailFull[]
	}

	export interface ArtistFull extends ArtistDetailed {
		description: string | null
		subscribers: number
		topSongs: Omit<SongDetailed, "duration">[]
		topAlbums: AlbumDetailed[]
	}

	export interface AlbumBasic {
		albumId: string
		name: string
	}

	export interface AlbumDetailed extends AlbumBasic {
		type: "ALBUM"
		playlistId: string
		artists: ArtistBasic[]
		year: number
		thumbnails: ThumbnailFull[]
	}

	export interface AlbumFull extends AlbumDetailed {
		description: string | null
		songs: SongDetailed[]
	}

	export interface PlaylistFull {
		type: "PLAYLIST"
		playlistId: string
		name: string
		artist: ArtistBasic
		videoCount: number
		thumbnails: ThumbnailFull[]
	}

	export type SearchResult =
		| SongDetailed
		| VideoDetailed
		| AlbumDetailed
		| ArtistDetailed
		| PlaylistFull
}

export default YTMusic
