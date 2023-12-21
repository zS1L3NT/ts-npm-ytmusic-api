import { z } from "zod"

export type ThumbnailFull = z.infer<typeof ThumbnailFull>
export const ThumbnailFull = z.object({
	url: z.string(),
	width: z.number(),
	height: z.number(),
})

export type ArtistBasic = z.infer<typeof ArtistBasic>
export const ArtistBasic = z.object({
	artistId: z.string(),
	name: z.string(),
})

export type AlbumBasic = z.infer<typeof AlbumBasic>
export const AlbumBasic = z.object({
	albumId: z.string(),
	name: z.string(),
})

export type SongDetailed = z.infer<typeof SongDetailed>
export const SongDetailed = z.object({
	type: z.literal("SONG"),
	videoId: z.string(),
	name: z.string(),
	artists: z.array(ArtistBasic),
	album: AlbumBasic,
	duration: z.number(),
	thumbnails: z.array(ThumbnailFull),
})

export type VideoDetailed = z.infer<typeof VideoDetailed>
export const VideoDetailed = z.object({
	type: z.literal("VIDEO"),
	videoId: z.string(),
	name: z.string(),
	artists: z.array(ArtistBasic),
	duration: z.number(),
	thumbnails: z.array(ThumbnailFull),
})

export type ArtistDetailed = z.infer<typeof ArtistDetailed>
export const ArtistDetailed = z.object({
	artistId: z.string(),
	name: z.string(),
	type: z.literal("ARTIST"),
	thumbnails: z.array(ThumbnailFull),
})

export type AlbumDetailed = z.infer<typeof AlbumDetailed>
export const AlbumDetailed = z.object({
	type: z.literal("ALBUM"),
	albumId: z.string(),
	playlistId: z.string(),
	name: z.string(),
	artists: z.array(ArtistBasic),
	year: z.number().nullable(),
	thumbnails: z.array(ThumbnailFull),
})

export type PlaylistDetailed = z.infer<typeof PlaylistDetailed>
export const PlaylistDetailed = z.object({
	type: z.literal("PLAYLIST"),
	playlistId: z.string(),
	name: z.string(),
	artist: ArtistBasic,
	thumbnails: z.array(ThumbnailFull),
})

export type SongFull = z.infer<typeof SongFull>
export const SongFull = z.object({
	type: z.literal("SONG"),
	videoId: z.string(),
	name: z.string(),
	artists: z.array(ArtistBasic),
	duration: z.number(),
	thumbnails: z.array(ThumbnailFull),
	description: z.string(),
	formats: z.array(z.any()),
	adaptiveFormats: z.array(z.any()),
})

export type VideoFull = z.infer<typeof VideoFull>
export const VideoFull = z.object({
	type: z.literal("VIDEO"),
	videoId: z.string(),
	name: z.string(),
	artists: z.array(ArtistBasic),
	duration: z.number(),
	thumbnails: z.array(ThumbnailFull),
	description: z.string(),
	unlisted: z.boolean(),
	familySafe: z.boolean(),
	paid: z.boolean(),
	tags: z.array(z.string()),
})

export type ArtistFull = z.infer<typeof ArtistFull>
export const ArtistFull = z.object({
	artistId: z.string(),
	name: z.string(),
	type: z.literal("ARTIST"),
	thumbnails: z.array(ThumbnailFull),
	description: z.string(),
	topSongs: z.array(SongDetailed.omit({ duration: true })),
	topAlbums: z.array(AlbumDetailed),
	topSingles: z.array(AlbumDetailed),
	topVideos: z.array(VideoDetailed.omit({ duration: true })),
	featuredOn: z.array(PlaylistDetailed),
	similarArtists: z.array(ArtistDetailed),
})

export type AlbumFull = z.infer<typeof AlbumFull>
export const AlbumFull = z.object({
	type: z.literal("ALBUM"),
	albumId: z.string(),
	playlistId: z.string(),
	name: z.string(),
	artists: z.array(ArtistBasic),
	year: z.number().nullable(),
	thumbnails: z.array(ThumbnailFull),
	description: z.string(),
	songs: z.array(SongDetailed),
})

export type PlaylistFull = z.infer<typeof PlaylistFull>
export const PlaylistFull = z.object({
	type: z.literal("PLAYLIST"),
	playlistId: z.string(),
	name: z.string(),
	artist: ArtistBasic,
	videoCount: z.number(),
	thumbnails: z.array(ThumbnailFull),
})

export type SearchResult = z.infer<typeof SearchResult>
export const SearchResult = SongDetailed.or(VideoDetailed)
	.or(AlbumDetailed)
	.or(ArtistDetailed)
	.or(PlaylistDetailed)
