import { type, union } from "arktype"

export type ThumbnailFull = typeof ThumbnailFull.infer
export const ThumbnailFull = type({
	url: "string",
	width: "number",
	height: "number",
})

export type ArtistBasic = typeof ArtistBasic.infer
export const ArtistBasic = type({
	artistId: "string|null",
	name: "string",
})

export type AlbumBasic = typeof AlbumBasic.infer
export const AlbumBasic = type({
	albumId: "string",
	name: "string",
})

export type SongDetailed = typeof SongDetailed.infer
export const SongDetailed = type({
	type: '"SONG"',
	videoId: "string",
	name: "string",
	artists: [ArtistBasic, "[]"],
	album: AlbumBasic,
	duration: "number|null",
	thumbnails: [ThumbnailFull, "[]"],
})

export type VideoDetailed = typeof VideoDetailed.infer
export const VideoDetailed = type({
	type: '"VIDEO"',
	videoId: "string",
	name: "string",
	artists: [ArtistBasic, "[]"],
	duration: "number|null",
	thumbnails: [ThumbnailFull, "[]"],
})

export type ArtistDetailed = typeof ArtistDetailed.infer
export const ArtistDetailed = type({
	artistId: "string",
	name: "string",
	type: '"ARTIST"',
	thumbnails: [ThumbnailFull, "[]"],
})

export type AlbumDetailed = typeof AlbumDetailed.infer
export const AlbumDetailed = type({
	type: '"ALBUM"',
	albumId: "string",
	playlistId: "string",
	name: "string",
	artists: [ArtistBasic, "[]"],
	year: "number|null",
	thumbnails: [ThumbnailFull, "[]"],
})

export type PlaylistDetailed = typeof PlaylistDetailed.infer
export const PlaylistDetailed = type({
	type: '"PLAYLIST"',
	playlistId: "string",
	name: "string",
	artist: ArtistBasic,
	thumbnails: [ThumbnailFull, "[]"],
})

export type SongFull = typeof SongFull.infer
export const SongFull = type({
	type: '"SONG"',
	videoId: "string",
	name: "string",
	artists: [ArtistBasic, "[]"],
	duration: "number",
	thumbnails: [ThumbnailFull, "[]"],
	description: "string",
	formats: "any[]",
	adaptiveFormats: "any[]",
})

export type VideoFull = typeof VideoFull.infer
export const VideoFull = type({
	type: '"VIDEO"',
	videoId: "string",
	name: "string",
	artists: [ArtistBasic, "[]"],
	duration: "number",
	thumbnails: [ThumbnailFull, "[]"],
	description: "string",
	unlisted: "boolean",
	familySafe: "boolean",
	paid: "boolean",
	tags: "string[]",
})

export type ArtistFull = typeof ArtistFull.infer
export const ArtistFull = type({
	artistId: "string",
	name: "string",
	type: '"ARTIST"',
	thumbnails: [ThumbnailFull, "[]"],
	description: "string",
	topSongs: [SongDetailed, "[]"],
	topAlbums: [AlbumDetailed, "[]"],
	topSingles: [AlbumDetailed, "[]"],
	topVideos: [VideoDetailed, "[]"],
	featuredOn: [PlaylistDetailed, "[]"],
	similarArtists: [ArtistDetailed, "[]"],
})

export type AlbumFull = typeof AlbumFull.infer
export const AlbumFull = type({
	type: '"ALBUM"',
	albumId: "string",
	playlistId: "string",
	name: "string",
	artists: [ArtistBasic, "[]"],
	year: "number|null",
	thumbnails: [ThumbnailFull, "[]"],
	songs: [SongDetailed, "[]"],
})

export type PlaylistFull = typeof PlaylistFull.infer
export const PlaylistFull = type({
	type: '"PLAYLIST"',
	playlistId: "string",
	name: "string",
	artist: ArtistBasic,
	videoCount: "number",
	thumbnails: [ThumbnailFull, "[]"],
})

export type SearchResult = typeof SearchResult.infer
export const SearchResult = union(
	SongDetailed,
	union(VideoDetailed, union(AlbumDetailed, union(ArtistDetailed, PlaylistDetailed))),
)
