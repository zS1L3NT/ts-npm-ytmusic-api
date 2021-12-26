import ObjectValidator from "validate-any/build/validators/ObjectValidator"
import { BOOLEAN, LIST, NULL, NUMBER, OBJECT, OR, STRING } from "validate-any"

export const THUMBNAIL_FULL: ObjectValidator<YTMusic.ThumbnailFull> = OBJECT({
	url: STRING(),
	width: NUMBER(),
	height: NUMBER()
})

export const ARTIST_BASIC: ObjectValidator<YTMusic.ArtistBasic> = OBJECT({
	artistId: OR(STRING(), NULL()),
	name: STRING()
})

export const ALBUM_BASIC: ObjectValidator<YTMusic.AlbumBasic> = OBJECT({
	albumId: STRING(),
	name: STRING()
})

export const SONG_DETAILED: ObjectValidator<YTMusic.SongDetailed> = OBJECT({
	type: STRING("SONG"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	album: ALBUM_BASIC,
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const VIDEO_DETAILED: ObjectValidator<YTMusic.VideoDetailed> = OBJECT({
	type: STRING("VIDEO"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	views: NUMBER(),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const ARTIST_DETAILED: ObjectValidator<YTMusic.ArtistDetailed> = OBJECT({
	artistId: STRING(),
	name: STRING(),
	type: STRING("ARTIST"),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const ALBUM_DETAILED: ObjectValidator<YTMusic.AlbumDetailed> = OBJECT({
	type: STRING("ALBUM"),
	albumId: STRING(),
	playlistId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	year: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const SONG_FULL: ObjectValidator<YTMusic.SongFull> = OBJECT({
	type: STRING("SONG"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	formats: LIST(OBJECT()),
	adaptiveFormats: LIST(OBJECT())
})

export const VIDEO_FULL: ObjectValidator<YTMusic.VideoFull> = OBJECT({
	type: STRING("VIDEO"),
	videoId: OR(STRING(), NULL()),
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

export const ARTIST_FULL: ObjectValidator<YTMusic.ArtistFull> = OBJECT({
	artistId: STRING(),
	name: STRING(),
	type: STRING("ARTIST"),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: OR(STRING(), NULL()),
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

export const ALBUM_FULL: ObjectValidator<YTMusic.AlbumFull> = OBJECT({
	type: STRING("ALBUM"),
	albumId: STRING(),
	playlistId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	year: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: OR(STRING(), NULL()),
	songs: LIST(SONG_DETAILED)
})

export const PLAYLIST_DETAILED: ObjectValidator<YTMusic.PlaylistDetailed> = OBJECT({
	type: STRING("PLAYLIST"),
	playlistId: STRING(),
	name: STRING(),
	artist: ARTIST_BASIC,
	videoCount: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const PLAYLIST_VIDEO: ObjectValidator<Omit<YTMusic.VideoDetailed, "views">> = OBJECT({
	type: STRING("VIDEO"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})
