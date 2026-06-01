import YTMusic from "./YTMusic"

export type {
	AlbumBasic,
	AlbumDetailed,
	AlbumFull,
	ArtistBasic,
	ArtistDetailed,
	ArtistFull,
	PlaylistDetailed,
	PlaylistFull,
	SearchResult,
	SongDetailed,
	SongFull,
	ThumbnailFull,
	VideoDetailed,
	VideoFull,
	HomeSection,
	UpNextsDetails,
} from "./types"

export { YTMusicAPIError, YTMusicError } from "./errors"
export type { RetryOptions } from "./utils/retry"

export default YTMusic
