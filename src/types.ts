import { z } from "zod"

export type ThumbnailFull = z.infer<typeof ThumbnailFull>
export const ThumbnailFull = z
	.object({
		url: z.string(),
		width: z.number(),
		height: z.number(),
	})
	.strict()

export type ArtistBasic = z.infer<typeof ArtistBasic>
export const ArtistBasic = z
	.object({
		artistId: z.nullable(z.string()),
		name: z.string(),
	})
	.strict()

export type AlbumBasic = z.infer<typeof AlbumBasic>
export const AlbumBasic = z
	.object({
		albumId: z.string(),
		name: z.string(),
	})
	.strict()

export type SongDetailed = z.infer<typeof SongDetailed>
export const SongDetailed = z
	.object({
		type: z.literal("SONG"),
		videoId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		album: z.nullable(AlbumBasic),
		duration: z.nullable(z.number()),
		thumbnails: z.array(ThumbnailFull),
            playlistId: z.string(),
            params: z.string()
	})
	.strict()

export type VideoDetailed = z.infer<typeof VideoDetailed>
export const VideoDetailed = z
	.object({
		type: z.literal("VIDEO"),
		videoId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		duration: z.nullable(z.number()),
		thumbnails: z.array(ThumbnailFull),
            playlistId: z.string(),
            params: z.string()
	})
	.strict()

export type ArtistDetailed = z.infer<typeof ArtistDetailed>
export const ArtistDetailed = z
	.object({
		artistId: z.string(),
		name: z.string(),
		type: z.literal("ARTIST"),
		thumbnails: z.array(ThumbnailFull),
	})
	.strict()

export type AlbumDetailed = z.infer<typeof AlbumDetailed>
export const AlbumDetailed = z
	.object({
		type: z.literal("ALBUM"),
		albumId: z.string(),
		playlistId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		year: z.nullable(z.number()),
		thumbnails: z.array(ThumbnailFull),
	})
	.strict()

export type PlaylistDetailed = z.infer<typeof PlaylistDetailed>
export const PlaylistDetailed = z
	.object({
		type: z.literal("PLAYLIST"),
		playlistId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		thumbnails: z.array(ThumbnailFull),
	})
	.strict()

export type SongFull = z.infer<typeof SongFull>
export const SongFull = z
	.object({
		type: z.literal("SONG"),
		videoId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		duration: z.number(),
		thumbnails: z.array(ThumbnailFull),
		formats: z.array(z.any()),
		adaptiveFormats: z.array(z.any()),
	})
	.strict()

export type VideoFull = z.infer<typeof VideoFull>
export const VideoFull = z
	.object({
		type: z.literal("VIDEO"),
		videoId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		duration: z.number(),
		thumbnails: z.array(ThumbnailFull),
		unlisted: z.boolean(),
		familySafe: z.boolean(),
		paid: z.boolean(),
		tags: z.array(z.string()),
	})
	.strict()

export type ArtistFull = z.infer<typeof ArtistFull>
export const ArtistFull = z
	.object({
		artistId: z.string(),
		name: z.string(),
		type: z.literal("ARTIST"),
		thumbnails: z.array(ThumbnailFull),
		topSongs: z.array(SongDetailed),
		topAlbums: z.array(AlbumDetailed),
		topSingles: z.array(AlbumDetailed),
		topVideos: z.array(VideoDetailed),
		featuredOn: z.array(PlaylistDetailed),
		similarArtists: z.array(ArtistDetailed),
	})
	.strict()

export type AlbumFull = z.infer<typeof AlbumFull>
export const AlbumFull = z
	.object({
		type: z.literal("ALBUM"),
		albumId: z.string(),
		playlistId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		year: z.nullable(z.number()),
		thumbnails: z.array(ThumbnailFull),
		songs: z.array(SongDetailed),
	})
	.strict()

export type PlaylistFull = z.infer<typeof PlaylistFull>
export const PlaylistFull = z
	.object({
		type: z.literal("PLAYLIST"),
		playlistId: z.string(),
		name: z.string(),
		artist: ArtistBasic,
		videoCount: z.number(),
		thumbnails: z.array(ThumbnailFull),
	})
	.strict()

export type SearchResult = z.infer<typeof SearchResult>
export const SearchResult = z.discriminatedUnion("type", [
	SongDetailed,
	VideoDetailed,
	AlbumDetailed,
	ArtistDetailed,
	PlaylistDetailed,
])

export type HomeSection = z.infer<typeof HomeSection>
export const HomeSection = z
	.object({
		title: z.string(),
		contents: z.array(z.union([AlbumDetailed, PlaylistDetailed, SongDetailed])),
	})
	.strict()

export type NextResult = z.infer<typeof NextResult>
export const NextResult = z
      .object({
            index: z.number(),
            name: z.string(),
            artist: ArtistBasic,
            playlistId: z.string(),
            videoId: z.string(),
            selected: z.boolean(),
            params: z.string(),
            thumbnails: z.array(ThumbnailFull)
      })
      .strict()
