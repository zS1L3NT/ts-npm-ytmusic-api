import ObjectValidator from "validate-any/build/validators/ObjectValidator"
import { LIST, NUMBER, OBJECT, OR, STRING, UNDEFINED } from "validate-any"

export const THUMBNAIL_FULL: ObjectValidator<YTMusic.ThumbnailFull> = OBJECT({
	url: STRING(),
	width: NUMBER(),
	height: NUMBER()
})

export const ARTIST_BASIC: ObjectValidator<YTMusic.ArtistBasic> = OBJECT({
	artistId: OR(STRING(), UNDEFINED()),
	name: STRING()
})

export const ALBUM_BASIC: ObjectValidator<YTMusic.AlbumBasic> = OBJECT({
	albumId: STRING(),
	name: STRING()
})

export const SONG_DETAILED: ObjectValidator<YTMusic.SongDetailed> = OBJECT({
	type: STRING("SONG"),
	videoId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	album: ALBUM_BASIC,
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

export const VIDEO_DETAILED: ObjectValidator<YTMusic.VideoDetailed> = OBJECT({
	type: STRING("VIDEO"),
	videoId: STRING(),
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

export const ARTIST_FULL: ObjectValidator<YTMusic.ArtistFull> = OBJECT({
	artistId: STRING(),
	name: STRING(),
	type: STRING("ARTIST"),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	subscribers: NUMBER(),
	topTracks: LIST(
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
	description: STRING(),
	tracks: LIST(SONG_DETAILED)
})

export const PLAYLIST_DETAILED: ObjectValidator<YTMusic.PlaylistDetailed> = OBJECT({
	type: STRING("PLAYLIST"),
	playlistId: STRING(),
	name: STRING(),
	artist: ARTIST_BASIC,
	trackCount: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})
