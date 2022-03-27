import YTMusic from "./YTMusic"

export interface ThumbnailFull {
	url: string
	width: number
	height: number
}

export interface SongDetailed {
	type: "SONG"
	videoId: string
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
	videoId: string
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
	artistId: string
	name: string
}

export interface ArtistDetailed extends ArtistBasic {
	type: "ARTIST"
	artistId: string
	thumbnails: ThumbnailFull[]
}

export interface ArtistFull extends ArtistDetailed {
	description: string
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
	description: string
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

export default YTMusic
