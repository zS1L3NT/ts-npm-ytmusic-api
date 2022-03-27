import ObjectValidator from "validate-any/dist/validators/ObjectValidator"
import {
	AlbumBasic,
	AlbumDetailed,
	AlbumFull,
	ArtistBasic,
	ArtistDetailed,
	ArtistFull,
	PlaylistFull,
	SongDetailed,
	SongFull,
	ThumbnailFull,
	VideoDetailed,
	VideoFull
} from "."
import { BOOLEAN, LIST, NUMBER, OBJECT, STRING } from "validate-any"

export const THUMBNAIL_FULL: ObjectValidator<ThumbnailFull> = OBJECT({
	url: STRING(),
	width: NUMBER(),
	height: NUMBER()
})

export const ARTIST_BASIC: ObjectValidator<ArtistBasic> = OBJECT({
	artistId: STRING(),
	name: STRING()
})

export const ALBUM_BASIC: ObjectValidator<AlbumBasic> = OBJECT({
	albumId: STRING(),
	name: STRING()
})

export const SONG_DETAILED: ObjectValidator<SongDetailed> = OBJECT({
	type: STRING("SONG"),
	videoId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	album: ALBUM_BASIC,
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const VIDEO_DETAILED: ObjectValidator<VideoDetailed> = OBJECT({
	type: STRING("VIDEO"),
	videoId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	views: NUMBER(),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const ARTIST_DETAILED: ObjectValidator<ArtistDetailed> = OBJECT({
	artistId: STRING(),
	name: STRING(),
	type: STRING("ARTIST"),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const ALBUM_DETAILED: ObjectValidator<AlbumDetailed> = OBJECT({
	type: STRING("ALBUM"),
	albumId: STRING(),
	playlistId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	year: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const SONG_FULL: ObjectValidator<SongFull> = OBJECT({
	type: STRING("SONG"),
	videoId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	formats: LIST(OBJECT()),
	adaptiveFormats: LIST(OBJECT())
})

export const VIDEO_FULL: ObjectValidator<VideoFull> = OBJECT({
	type: STRING("VIDEO"),
	videoId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	views: NUMBER(),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	unlisted: BOOLEAN(),
	familySafe: BOOLEAN(),
	paid: BOOLEAN(),
	tags: LIST(STRING())
})

export const ARTIST_FULL: ObjectValidator<ArtistFull> = OBJECT({
	artistId: STRING(),
	name: STRING(),
	type: STRING("ARTIST"),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	subscribers: NUMBER(),
	topSongs: LIST(
		OBJECT({
			type: STRING("SONG"),
			videoId: STRING(),
			name: STRING(),
			artists: LIST(ARTIST_BASIC),
			album: ALBUM_BASIC,
			thumbnails: LIST(THUMBNAIL_FULL)
		})
	),
	topAlbums: LIST(ALBUM_DETAILED)
})

export const ALBUM_FULL: ObjectValidator<AlbumFull> = OBJECT({
	type: STRING("ALBUM"),
	albumId: STRING(),
	playlistId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	year: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	songs: LIST(SONG_DETAILED)
})

export const PLAYLIST_FULL: ObjectValidator<PlaylistFull> = OBJECT({
	type: STRING("PLAYLIST"),
	playlistId: STRING(),
	name: STRING(),
	artist: ARTIST_BASIC,
	videoCount: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const PLAYLIST_VIDEO: ObjectValidator<Omit<VideoDetailed, "views">> = OBJECT({
	type: STRING("VIDEO"),
	videoId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})
