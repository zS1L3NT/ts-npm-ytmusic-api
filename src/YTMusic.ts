import axios, { AxiosInstance } from "axios"
import { Cookie, CookieJar } from "tough-cookie"

import { CacheManager } from "./cache"
import { FE_MUSIC_HOME } from "./constants"
import { YTMusicAPIError, YTMusicError } from "./errors"
import AlbumParser from "./parsers/AlbumParser"
import ArtistParser from "./parsers/ArtistParser"
import Parser from "./parsers/Parser"
import PlaylistParser from "./parsers/PlaylistParser"
import SearchParser from "./parsers/SearchParser"
import SongParser from "./parsers/SongParser"
import VideoParser from "./parsers/VideoParser"
import {
	AlbumDetailed,
	AlbumFull,
	ArtistDetailed,
	ArtistFull,
	HomeSection,
	PlaylistDetailed,
	PlaylistFull,
	SearchResult,
	SongDetailed,
	SongFull,
	UpNextsDetails,
	VideoDetailed,
	VideoFull,
} from "./types"
import { DEFAULT_RETRY_OPTIONS, type RetryOptions, withRetry } from "./utils/retry"
import { traverse, traverseList, traverseString } from "./utils/traverse"
import { validateArtistId, validatePlaylistId } from "./utils/validation"

axios.defaults.headers.common["Accept-Encoding"] = "gzip"

// ─── TTL constants (milliseconds) ───────────────────────────────────────────
const TTL = {
	SUGGESTIONS: 2 * 60 * 1_000, // 2 min
	SEARCH: 5 * 60 * 1_000, // 5 min
	HOME: 1 * 60 * 1_000, // 1 min
	PLAYLIST: 10 * 60 * 1_000, // 10 min
	ARTIST: 30 * 60 * 1_000, // 30 min
	SONG: 60 * 60 * 1_000, // 1 hr
	VIDEO: 60 * 60 * 1_000, // 1 hr
	ALBUM: 60 * 60 * 1_000, // 1 hr
	LYRICS: 24 * 60 * 60 * 1_000, // 24 hr
} as const

export default class YTMusic {
	private cookiejar: CookieJar
	private config?: Record<string, string>
	private client: AxiosInstance
	private cache: CacheManager
	private retryConfig: RetryOptions

	/**
	 * Creates an instance of YTMusic.
	 * Make sure to call `initialize()` before using any other methods.
	 */
	public constructor() {
		this.cookiejar = new CookieJar()
		this.config = {}
		this.cache = new CacheManager()
		this.retryConfig = { ...DEFAULT_RETRY_OPTIONS }

		this.client = axios.create({
			baseURL: "https://music.youtube.com/",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.5",
			},
			withCredentials: true,
		})

		this.client.interceptors.request.use(req => {
			if (req.baseURL) {
				const cookieString = this.cookiejar.getCookieStringSync(req.baseURL)
				if (cookieString) {
					req.headers["cookie"] = cookieString
				}
			}
			return req
		})

		this.client.interceptors.response.use(res => {
			if (res.headers && res.config.baseURL) {
				const cookieStrings = res.headers["set-cookie"] || []
				for (const cookieString of cookieStrings) {
					const cookie = Cookie.parse(cookieString)
					if (cookie) {
						this.cookiejar.setCookieSync(cookie, res.config.baseURL)
					}
				}
			}
			return res
		})
	}

	// ─── Initialization ──────────────────────────────────────────────────────

	/**
	 * Initializes the API.
	 *
	 * @param options.cookies   Cookie string for authenticated requests
	 * @param options.GL        Country code override (e.g. "US")
	 * @param options.HL        Language code override (e.g. "en")
	 * @param options.cache     Cache configuration
	 * @param options.retry     Retry configuration
	 */
	public async initialize(options?: {
		cookies?: string
		GL?: string
		HL?: string
		/**
		 * In-memory response cache settings.
		 * The cache is **enabled by default**.  Pass `{ enabled: false }` to turn
		 * it off, or `{ defaultTTL: ms }` to change the global TTL.
		 */
		cache?: {
			/** Set to `false` to disable all caching (default: `true`). */
			enabled?: boolean
			/** Global default TTL in milliseconds (default: 5 minutes). */
			defaultTTL?: number
		}
		/**
		 * Automatic retry settings for transient HTTP failures.
		 * Retry is **enabled by default** with up to 3 attempts.
		 * Pass `{ enabled: false }` to disable.
		 */
		retry?: {
			/** Set to `false` to disable automatic retries (default: `true`). */
			enabled?: boolean
			/** Maximum number of retry attempts (default: 3). */
			maxRetries?: number
			/** Delay before the first retry in milliseconds (default: 1 000). */
			initialDelay?: number
		}
	}) {
		const { cookies, GL, HL } = options ?? {}

		if (cookies) {
			for (const cookieString of cookies.split("; ")) {
				const cookie = Cookie.parse(`${cookieString}`)
				if (!cookie) return
				this.cookiejar.setCookieSync(cookie, "https://www.youtube.com/")
			}
		}

		const html = (await this.client.get("/")).data as string
		const setConfigs = html.match(/ytcfg\.set\(.*?\);/) || []

		const configs = setConfigs
			.map(c => c.slice(10, -2))
			.map(s => {
				try {
					return JSON.parse(s)
				} catch {
					return null
				}
			})
			.filter(j => !!j)

		for (const config of configs) {
			this.config = {
				...this.config,
				...config,
			}
		}

		if (!this.config) {
			this.config = {}
		}

		if (GL) this.config.GL = GL
		if (HL) this.config.HL = HL

		// ── Configure cache ──────────────────────────────────────────────────
		if (options?.cache?.enabled === false) {
			this.cache.destroy()
			// Replace with a perpetually-empty no-op cache instance
			this.cache = new CacheManager(0)
			this.cache.stopCleanup()
		} else if (options?.cache?.defaultTTL !== undefined) {
			this.cache.destroy()
			this.cache = new CacheManager(options.cache.defaultTTL)
		}

		// ── Configure retry ──────────────────────────────────────────────────
		if (options?.retry?.enabled === false) {
			this.retryConfig = { ...this.retryConfig, maxRetries: 0 }
		}
		if (options?.retry?.maxRetries !== undefined) {
			this.retryConfig = { ...this.retryConfig, maxRetries: options.retry.maxRetries }
		}
		if (options?.retry?.initialDelay !== undefined) {
			this.retryConfig = { ...this.retryConfig, initialDelay: options.retry.initialDelay }
		}

		return this
	}

	// ─── Cache Controls (public) ─────────────────────────────────────────────

	/**
	 * Evict every cached response.
	 * Useful when you know the underlying data has changed (e.g. after editing a playlist).
	 */
	public clearCache(): void {
		this.cache.clear()
	}

	/**
	 * Return a snapshot of the current cache state.
	 * Stale entries are evicted before the snapshot is taken.
	 *
	 * @returns `{ size, keys }` — number of live entries and their keys.
	 */
	public getCacheStats(): { size: number; keys: string[] } {
		return this.cache.getStats()
	}

	// ─── Internal Helpers ────────────────────────────────────────────────────

	/**
	 * Constructs a basic YouTube Music API request with all essential headers
	 * and body parameters needed to make the API work.
	 *
	 * @param endpoint     Endpoint path (e.g. "browse", "search")
	 * @param body         Request body fields merged on top of the context object
	 * @param query        URL search parameters
	 * @param callerMethod Name of the public method, included in error context
	 * @returns            Raw (but typed) response from YouTube Music API
	 */
	private async constructRequest(
		endpoint: string,
		body: Record<string, any> = {},
		query: Record<string, string> = {},
		callerMethod?: string,
	) {
		if (!this.config) {
			throw new YTMusicError(
				"API not initialized. Make sure to call the initialize() method first",
				{ method: callerMethod, endpoint },
			)
		}

		const headers: Record<string, any> = {
			...this.client.defaults.headers,
			"x-origin": this.client.defaults.baseURL,
			"X-Goog-Visitor-Id": this.config.VISITOR_DATA || "",
			"X-YouTube-Client-Name": this.config.INNERTUBE_CONTEXT_CLIENT_NAME,
			"X-YouTube-Client-Version": this.config.INNERTUBE_CLIENT_VERSION,
			"X-YouTube-Device": this.config.DEVICE,
			"X-YouTube-Page-CL": this.config.PAGE_CL,
			"X-YouTube-Page-Label": this.config.PAGE_BUILD_LABEL,
			"X-YouTube-Utc-Offset": String(-new Date().getTimezoneOffset()),
			"X-YouTube-Time-Zone": new Intl.DateTimeFormat().resolvedOptions().timeZone,
		}

		const searchParams = new URLSearchParams({
			...query,
			alt: "json",
			key: this.config.INNERTUBE_API_KEY!,
		})

		const url = `youtubei/${this.config.INNERTUBE_API_VERSION}/${endpoint}?${searchParams.toString()}`

		const requestBody = {
			context: {
				capabilities: {},
				client: {
					clientName: this.config.INNERTUBE_CLIENT_NAME,
					clientVersion: this.config.INNERTUBE_CLIENT_VERSION,
					experimentIds: [],
					experimentsToken: "",
					gl: this.config.GL,
					hl: this.config.HL,
					locationInfo: {
						locationPermissionAuthorizationStatus:
							"LOCATION_PERMISSION_AUTHORIZATION_STATUS_UNSUPPORTED",
					},
					musicAppInfo: {
						musicActivityMasterSwitch: "MUSIC_ACTIVITY_MASTER_SWITCH_INDETERMINATE",
						musicLocationMasterSwitch: "MUSIC_LOCATION_MASTER_SWITCH_INDETERMINATE",
						pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_UNKNOWN",
					},
					utcOffsetMinutes: -new Date().getTimezoneOffset(),
				},
				request: {
					internalExperimentFlags: [
						{
							key: "force_music_enable_outertube_tastebuilder_browse",
							value: "true",
						},
						{
							key: "force_music_enable_outertube_playlist_detail_browse",
							value: "true",
						},
						{
							key: "force_music_enable_outertube_search_suggestions",
							value: "true",
						},
					],
					sessionIndex: {},
				},
				user: {
					enableSafetyMode: false,
				},
			},
			...body,
		}

		return withRetry(async () => {
			try {
				const res = await this.client.post(url, requestBody, {
					responseType: "json",
					headers,
				})
				return "responseContext" in res.data ? res.data : res
			} catch (error: any) {
				// Re-wrap errors that aren't already ours so the retry layer
				// can inspect them uniformly.
				if (error instanceof YTMusicError) throw error

				if (error.response) {
					// HTTP error response from YouTube (4xx / 5xx)
					throw new YTMusicAPIError(
						`YouTube Music API returned ${error.response.status}: ${error.response.statusText ?? ""}`,
						error.response.status,
						callerMethod,
						endpoint,
						error,
					)
				}

				if (error.request) {
					// Request sent but no response received (network failure, timeout)
					throw new YTMusicError(
						"Network error: No response received from YouTube Music API",
						{ method: callerMethod, endpoint, isRetryable: true, originalError: error },
					)
				}

				// Request setup / serialisation error — not retryable
				throw new YTMusicError(`Request configuration error: ${error.message}`, {
					method: callerMethod,
					endpoint,
					isRetryable: false,
					originalError: error,
				})
			}
		}, this.retryConfig)
	}

	/**
	 * Execute a request with transparent caching.
	 *
	 * @param cacheKey  Unique string key for this response (pass `null` to bypass the cache).
	 * @param ttl       Time-to-live for the cached result in milliseconds.
	 * @param requestFn Async factory that performs the actual API call + parsing.
	 * @returns         The result, either freshly fetched or served from cache.
	 */
	private async cachedRequest<T>(
		cacheKey: string | null,
		ttl: number,
		requestFn: () => Promise<T>,
	): Promise<T> {
		if (cacheKey !== null) {
			const cached = this.cache.get<T>(cacheKey)
			if (cached !== null) return cached
		}

		const result = await requestFn()

		if (cacheKey !== null) {
			this.cache.set(cacheKey, result, ttl)
		}

		return result
	}

	// ─── Public API ──────────────────────────────────────────────────────────

	/**
	 * Get a list of search suggestions based on the query.
	 *
	 * @param query Query string
	 * @returns Search suggestions
	 */
	public async getSearchSuggestions(query: string): Promise<string[]> {
		return this.cachedRequest(`suggestions:${query}`, TTL.SUGGESTIONS, async () =>
			traverseList(
				await this.constructRequest(
					"music/get_search_suggestions",
					{ input: query },
					{},
					"getSearchSuggestions",
				),
				"query",
			),
		)
	}

	/**
	 * Searches YouTube Music API for results.
	 *
	 * @param query Query string
	 */
	public async search(query: string): Promise<SearchResult[]> {
		return this.cachedRequest(`search:${query}`, TTL.SEARCH, async () => {
			const searchData = await this.constructRequest(
				"search",
				{ query, params: null },
				{},
				"search",
			)
			return traverseList(searchData, "musicResponsiveListItemRenderer")
				.map(SearchParser.parse)
				.filter(Boolean) as SearchResult[]
		})
	}

	/**
	 * Searches YouTube Music API for songs.
	 *
	 * @param query Query string
	 */
	public async searchSongs(query: string): Promise<SongDetailed[]> {
		return this.cachedRequest(`searchSongs:${query}`, TTL.SEARCH, async () => {
			const searchData = await this.constructRequest(
				"search",
				{ query, params: "Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D" },
				{},
				"searchSongs",
			)
			return traverseList(searchData, "musicResponsiveListItemRenderer").map(
				SongParser.parseSearchResult,
			)
		})
	}

	/**
	 * Searches YouTube Music API for videos.
	 *
	 * @param query Query string
	 */
	public async searchVideos(query: string): Promise<VideoDetailed[]> {
		return this.cachedRequest(`searchVideos:${query}`, TTL.SEARCH, async () => {
			const searchData = await this.constructRequest(
				"search",
				{ query, params: "Eg-KAQwIABABGAAgACgAMABqChAEEAMQCRAFEAo%3D" },
				{},
				"searchVideos",
			)
			return traverseList(searchData, "musicResponsiveListItemRenderer").map(
				VideoParser.parseSearchResult,
			)
		})
	}

	/**
	 * Searches YouTube Music API for artists.
	 *
	 * @param query Query string
	 */
	public async searchArtists(query: string): Promise<ArtistDetailed[]> {
		return this.cachedRequest(`searchArtists:${query}`, TTL.SEARCH, async () => {
			const searchData = await this.constructRequest(
				"search",
				{ query, params: "Eg-KAQwIABAAGAAgASgAMABqChAEEAMQCRAFEAo%3D" },
				{},
				"searchArtists",
			)
			return traverseList(searchData, "musicResponsiveListItemRenderer").map(
				ArtistParser.parseSearchResult,
			)
		})
	}

	/**
	 * Searches YouTube Music API for albums.
	 *
	 * @param query Query string
	 */
	public async searchAlbums(query: string): Promise<AlbumDetailed[]> {
		return this.cachedRequest(`searchAlbums:${query}`, TTL.SEARCH, async () => {
			const searchData = await this.constructRequest(
				"search",
				{ query, params: "Eg-KAQwIABAAGAEgACgAMABqChAEEAMQCRAFEAo%3D" },
				{},
				"searchAlbums",
			)
			return traverseList(searchData, "musicResponsiveListItemRenderer").map(
				AlbumParser.parseSearchResult,
			)
		})
	}

	/**
	 * Searches YouTube Music API for playlists.
	 *
	 * @param query Query string
	 */
	public async searchPlaylists(query: string): Promise<PlaylistDetailed[]> {
		return this.cachedRequest(`searchPlaylists:${query}`, TTL.SEARCH, async () => {
			const searchData = await this.constructRequest(
				"search",
				{ query, params: "Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo%3D" },
				{},
				"searchPlaylists",
			)
			return traverseList(searchData, "musicResponsiveListItemRenderer").map(
				PlaylistParser.parseSearchResult,
			)
		})
	}

	/**
	 * Get all possible information of a Song.
	 *
	 * @param videoId Video ID
	 * @returns Song Data
	 */
	public async getSong(videoId: string): Promise<SongFull> {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) {
			throw new YTMusicError(`Invalid videoId: ${videoId}`, { method: "getSong" })
		}

		return this.cachedRequest(`song:${videoId}`, TTL.SONG, async () => {
			const data = await this.constructRequest("player", { videoId }, {}, "getSong")
			const song = SongParser.parse(data)
			if (song.videoId !== videoId) {
				throw new YTMusicError(`Invalid videoId: ${videoId}`, { method: "getSong" })
			}
			return song
		})
	}

	/**
	 * Get all possible information of the Up Next queue for a given song.
	 * Results are not cached because the radio queue is dynamic.
	 *
	 * @param videoId Video ID
	 * @returns Up Nexts Data
	 */
	public async getUpNexts(videoId: string): Promise<UpNextsDetails[]> {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) {
			throw new YTMusicError(`Invalid videoId: ${videoId}`, { method: "getUpNexts" })
		}

		const data = await this.constructRequest(
			"next",
			{ videoId, playlistId: `RDAMVM${videoId}`, isAudioOnly: true },
			{},
			"getUpNexts",
		)

		const tabs =
			data?.contents?.singleColumnMusicWatchNextResultsRenderer?.tabbedRenderer
				?.watchNextTabbedResultsRenderer?.tabs[0]?.tabRenderer?.content?.musicQueueRenderer
				?.content?.playlistPanelRenderer?.contents

		if (!tabs) {
			throw new YTMusicError("Invalid response structure from getUpNexts", {
				method: "getUpNexts",
				endpoint: "next",
			})
		}

		return tabs.slice(1).map((item: any) => {
			const { videoId, title, shortBylineText, lengthText, thumbnail } =
				item.playlistPanelVideoRenderer
			return {
				type: "SONG",
				videoId,
				title: title?.runs[0]?.text || "Unknown",
				artists: shortBylineText?.runs[0]?.text || "Unknown",
				duration: lengthText?.runs[0]?.text || "Unknown",
				thumbnail: thumbnail?.thumbnails.at(-1)?.url || "Unknown",
			}
		})
	}

	/**
	 * Get all possible information of a Video.
	 *
	 * @param videoId Video ID
	 * @returns Video Data
	 */
	public async getVideo(videoId: string): Promise<VideoFull> {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) {
			throw new YTMusicError(`Invalid videoId: ${videoId}`, { method: "getVideo" })
		}

		return this.cachedRequest(`video:${videoId}`, TTL.VIDEO, async () => {
			const data = await this.constructRequest("player", { videoId }, {}, "getVideo")
			const video = VideoParser.parse(data)
			if (video.videoId !== videoId) {
				throw new YTMusicError(`Invalid videoId: ${videoId}`, { method: "getVideo" })
			}
			return video
		})
	}

	/**
	 * Get lyrics of a specific Song.
	 *
	 * @param videoId Video ID
	 * @returns Lyrics
	 */
	public async getLyrics(videoId: string) {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) {
			throw new YTMusicError(`Invalid videoId: ${videoId}`, { method: "getLyrics" })
		}

		return this.cachedRequest(`lyrics:${videoId}`, TTL.LYRICS, async () => {
			const data = await this.constructRequest("next", { videoId }, {}, "getLyrics")
			const browseId = traverse(traverseList(data, "tabs", "tabRenderer")[1], "browseId")

			const lyricsData = await this.constructRequest("browse", { browseId }, {}, "getLyrics")
			const lyrics = traverseString(lyricsData, "description", "runs", "text")

			return lyrics
				? lyrics
						.replaceAll("\r", "")
						.split("\n")
						.filter(v => !!v)
				: null
		})
	}

	/**
	 * Get all possible information of an Artist.
	 *
	 * @param artistId Artist ID
	 * @returns Artist Data
	 */
	public async getArtist(artistId: string): Promise<ArtistFull> {
		return this.cachedRequest(`artist:${artistId}`, TTL.ARTIST, async () => {
			const data = await this.constructRequest(
				"browse",
				{ browseId: artistId },
				{},
				"getArtist",
			)
			return ArtistParser.parse(data, artistId)
		})
	}

	/**
	 * Get all of Artist's Songs.
	 * Results are not cached because the list is paginated with continuation tokens.
	 *
	 * @param artistId Artist ID
	 * @returns Artist's Songs
	 */
	public async getArtistSongs(artistId: string): Promise<SongDetailed[]> {
		validateArtistId(artistId, "getArtistSongs")

		const artistData = await this.constructRequest(
			"browse",
			{ browseId: artistId },
			{},
			"getArtistSongs",
		)
		const browseToken = traverse(artistData, "musicShelfRenderer", "title", "browseId")

		if (browseToken instanceof Array) return []

		const songsData = await this.constructRequest(
			"browse",
			{ browseId: browseToken },
			{},
			"getArtistSongs",
		)
		const continueToken = traverse(songsData, "continuation")
		const moreSongsData = await this.constructRequest(
			"browse",
			{},
			{ continuation: continueToken },
			"getArtistSongs",
		)

		return [
			...traverseList(songsData, "musicResponsiveListItemRenderer"),
			...traverseList(moreSongsData, "musicResponsiveListItemRenderer"),
		].map(s =>
			SongParser.parseArtistSong(s, {
				artistId,
				name: traverseString(artistData, "header", "title", "text"),
			}),
		)
	}

	/**
	 * Get all of Artist's Albums.
	 * Results are not cached because the list is paginated with continuation tokens.
	 *
	 * @param artistId Artist ID
	 * @returns Artist's Albums
	 */
	public async getArtistAlbums(artistId: string): Promise<AlbumDetailed[]> {
		validateArtistId(artistId, "getArtistAlbums")

		const artistData = await this.constructRequest(
			"browse",
			{ browseId: artistId },
			{},
			"getArtistAlbums",
		)
		const artistAlbumsData = traverseList(artistData, "musicCarouselShelfRenderer")[0]
		const browseBody = traverse(artistAlbumsData, "moreContentButton", "browseEndpoint")

		const albumsData = await this.constructRequest("browse", browseBody, {}, "getArtistAlbums")

		return traverseList(albumsData, "musicTwoRowItemRenderer").map(item =>
			AlbumParser.parseArtistAlbum(item, {
				artistId,
				name: traverseString(albumsData, "header", "runs", "text"),
			}),
		)
	}

	/**
	 * Get all possible information of an Album.
	 *
	 * @param albumId Album ID
	 * @returns Album Data
	 */
	public async getAlbum(albumId: string): Promise<AlbumFull> {
		return this.cachedRequest(`album:${albumId}`, TTL.ALBUM, async () => {
			const data = await this.constructRequest(
				"browse",
				{ browseId: albumId },
				{},
				"getAlbum",
			)
			return AlbumParser.parse(data, albumId)
		})
	}

	/**
	 * Get all possible information of a Playlist except the tracks.
	 *
	 * @param playlistId Playlist ID
	 * @returns Playlist Data
	 */
	public async getPlaylist(playlistId: string): Promise<PlaylistFull> {
		if (playlistId.startsWith("PL")) playlistId = "VL" + playlistId

		return this.cachedRequest(`playlist:${playlistId}`, TTL.PLAYLIST, async () => {
			const data = await this.constructRequest(
				"browse",
				{ browseId: playlistId },
				{},
				"getPlaylist",
			)
			return PlaylistParser.parse(data, playlistId)
		})
	}

	/**
	 * Get all videos in a Playlist.
	 * Results are not cached because the list is paginated with continuation tokens.
	 *
	 * @param playlistId Playlist ID
	 * @returns Playlist's Videos
	 */
	public async getPlaylistVideos(playlistId: string): Promise<VideoDetailed[]> {
		validatePlaylistId(playlistId, "getPlaylistVideos")

		if (playlistId.startsWith("PL")) playlistId = "VL" + playlistId
		const playlistData = await this.constructRequest(
			"browse",
			{ browseId: playlistId },
			{},
			"getPlaylistVideos",
		)

		const songs = traverseList(
			playlistData,
			"musicPlaylistShelfRenderer",
			"musicResponsiveListItemRenderer",
		)
		let continuation = traverse(playlistData, "continuation")
		// Sometimes it returns array, dunno why
		if (continuation instanceof Array) {
			continuation = continuation[0]
		}

		while (!(continuation instanceof Array)) {
			const songsData = await this.constructRequest(
				"browse",
				{},
				{ continuation },
				"getPlaylistVideos",
			)
			songs.push(...traverseList(songsData, "musicResponsiveListItemRenderer"))
			continuation = traverse(songsData, "continuation")
		}

		return songs
			.map(VideoParser.parsePlaylistVideo)
			.filter((video): video is VideoDetailed => video !== undefined)
	}

	/**
	 * Get sections for the home page.
	 *
	 * @returns Mixed HomeSection
	 */
	public async getHomeSections(): Promise<HomeSection[]> {
		// Cache key encodes locale so different users don't share a home feed
		const cacheKey = `home:${this.config?.GL ?? ""}:${this.config?.HL ?? ""}`

		return this.cachedRequest(cacheKey, TTL.HOME, async () => {
			const data = await this.constructRequest(
				"browse",
				{ browseId: FE_MUSIC_HOME },
				{},
				"getHomeSections",
			)

			const sections = traverseList(data, "sectionListRenderer", "contents")
			let continuation = traverseString(data, "continuation")
			while (continuation) {
				const contData = await this.constructRequest(
					"browse",
					{},
					{ continuation },
					"getHomeSections",
				)
				sections.push(...traverseList(contData, "sectionListContinuation", "contents"))
				continuation = traverseString(contData, "continuation")
			}

			return sections.map(Parser.parseHomeSection)
		})
	}
}
