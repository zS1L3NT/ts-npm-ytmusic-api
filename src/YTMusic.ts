import axios, { AxiosInstance } from "axios"
import { Cookie, CookieJar } from "tough-cookie"

import PlayerError from "./PlayerError"
import RequestError from "./RequestError"
import { FE_MUSIC_HOME, LYRICS_CLIENT, ORIGIN, PageType, TRANSIENT_STATUSES } from "./constants"
import AlbumParser from "./parsers/AlbumParser"
import ArtistParser from "./parsers/ArtistParser"
import HomeSectionParser from "./parsers/HomeSectionParser"
import LyricsParser from "./parsers/LyricsParser"
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
	ThumbnailFull,
	TimedLyric,
	VideoDetailed,
	VideoFull,
} from "./types"
import { isAlbum } from "./utils/filters"
import getVideoThumbnail from "./utils/getVideoThumbnail"
import { traverseList, traverseString } from "./utils/traverse"

export default class YTMusic {
	private cookiejar: CookieJar
	private config?: Record<string, string>
	private client: AxiosInstance
	private cache = new Map<string, { data: any; expires: number }>()
	private options = { ttl: 0, size: 100, retries: 3, delay: 1000 }

	/**
	 * Creates an instance of YTMusic
	 * Make sure to call initialize()
	 */
	public constructor() {
		this.cookiejar = new CookieJar()
		this.client = axios.create({
			baseURL: `${ORIGIN}/`,
			headers: {
				"User-Agent":
					"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.5",
				"Accept-Encoding": "gzip",
			},
			withCredentials: true,
			timeout: 30000,
		})

		this.client.interceptors.request.use(req => {
			const cookieString = this.cookiejar.getCookieStringSync(ORIGIN)
			if (cookieString && req.withCredentials) {
				req.headers["cookie"] = cookieString
			}

			return req
		})

		this.client.interceptors.response.use(res => {
			for (const cookieString of res.headers["set-cookie"] || []) {
				const cookie = Cookie.parse(cookieString)
				if (cookie) {
					// Redirects through other Google hosts set cookies this jar must not keep
					this.cookiejar.setCookieSync(cookie, ORIGIN, { ignoreError: true })
				}
			}

			return res
		})

		this.client.interceptors.response.use(undefined, error => {
			// Callers log errors, and Axios attaches the request with the session to them
			error.config?.headers?.delete("cookie")
			error.config?.headers?.delete("Authorization")
			throw error
		})
	}

	/**
	 * Initializes the API
	 *
	 * @param options.cookies Cookie header of a signed-in YouTube Music session
	 * @param options.GL Country code that results are localised for
	 * @param options.HL Language code that results are written in
	 * @param options.timeout Milliseconds to wait for each response, or 0 to wait forever. Defaults to 30000
	 * @param options.cache.ttl Milliseconds to reuse a response for. Responses are not reused by default
	 * @param options.cache.size Responses to keep before the oldest is dropped. Defaults to 100
	 * @param options.retry.retries Attempts after a failure that may pass, such as a rate limit. Defaults to 3
	 * @param options.retry.delay Milliseconds before the first retry, doubling on each. Defaults to 1000
	 */
	public async initialize(options?: {
		cookies?: string
		GL?: string
		HL?: string
		timeout?: number
		cache?: { ttl: number; size?: number }
		retry?: { retries?: number; delay?: number }
	}) {
		const { cookies, GL, HL, timeout, cache, retry } = options ?? {}

		this.client.defaults.timeout = timeout ?? 30000
		this.options = { ttl: 0, size: 100, retries: 3, delay: 1000, ...cache, ...retry }
		// Responses differ by session, country and language
		this.cache.clear()

		if (cookies) {
			for (const cookieString of cookies.split(/;\s*/).filter(Boolean)) {
				const cookie = Cookie.parse(cookieString)
				if (!cookie) throw new Error("Invalid cookie")

				// A Cookie header has no attributes, and the jar drops __Secure- cookies unless marked
				cookie.secure = true
				// YouTube renews cookies for the whole site, which must replace these
				cookie.domain = "youtube.com"
				cookie.path = "/"
				this.cookiejar.setCookieSync(cookie, ORIGIN)
			}
		}

		const html = (await this.retry("/", () => this.client.get("/"))).data as string
		const setConfigs = [...html.matchAll(/ytcfg\.set\((.*?)\);/gs)]

		const configs = setConfigs
			.map(c => c[1]!)
			.map(s => {
				try {
					return JSON.parse(s)
				} catch {
					return null
				}
			})
			.filter(j => !!j)

		const config: Record<string, string> = Object.assign({}, ...configs)
		if (
			!config.INNERTUBE_API_KEY ||
			!config.INNERTUBE_API_VERSION ||
			!config.INNERTUBE_CLIENT_NAME ||
			!config.INNERTUBE_CLIENT_VERSION
		) {
			throw new Error("YouTube Music configuration was not found. Initialization failed.")
		}

		if (GL) config.GL = GL
		if (HL) config.HL = HL
		this.config = config

		return this
	}

	/**
	 * Forgets the responses kept by the `cache` option of initialize()
	 */
	public clearCache() {
		this.cache.clear()
	}

	private async retry<T>(endpoint: string, request: () => Promise<T>): Promise<T> {
		for (let attempt = 0; ; attempt++) {
			try {
				return await request()
			} catch (error) {
				if (!axios.isAxiosError(error)) throw error

				// No response means YouTube Music was not reached, which can pass too
				const status = error.response?.status ?? null
				if (
					attempt < this.options.retries &&
					(status === null || TRANSIENT_STATUSES.includes(status))
				) {
					// Spread out clients that all failed at the same moment
					const delay = this.options.delay * 2 ** attempt * (1 + Math.random() / 5)
					// YouTube can say how many seconds to stay away for
					const wait = +error.response?.headers["retry-after"] * 1000 || 0
					await new Promise(resolve =>
						setTimeout(resolve, Math.min(Math.max(delay, wait), 10000)),
					)
					continue
				}

				throw new RequestError(
					endpoint,
					status,
					traverseString(error.response?.data, "error", "message") || error.message,
					error,
				)
			}
		}
	}

	/**
	 * Constructs a basic YouTube Music API request with all essential headers
	 * and body parameters needed to make the API work
	 *
	 * @param endpoint Endpoint for the request
	 * @param body Body
	 * @param query Search params
	 * @param client Overrides for the client YouTube Music is told it is serving
	 * @returns Raw response from YouTube Music API which needs to be parsed
	 */
	private async constructRequest(
		endpoint: string,
		body: Record<string, any> = {},
		query: Record<string, string> = {},
		client: Record<string, string> = {},
	) {
		if (!this.config) {
			throw new Error("API not initialized. Make sure to call the initialize() method first")
		}

		const key = JSON.stringify([endpoint, body, query, client])
		const cached = this.cache.get(key)
		if (cached && cached.expires > Date.now()) return cached.data

		const headers: Record<string, any> = {
			Origin: ORIGIN,
			"X-Origin": ORIGIN,
			"X-Goog-Visitor-Id": this.config.VISITOR_DATA || "",
			"X-YouTube-Client-Name": this.config.INNERTUBE_CONTEXT_CLIENT_NAME,
			// YouTube ignores a client in the body whose version differs from this one
			"X-YouTube-Client-Version":
				client.clientVersion ?? this.config.INNERTUBE_CLIENT_VERSION,
			"X-YouTube-Device": this.config.DEVICE,
			"X-YouTube-Page-CL": this.config.PAGE_CL,
			"X-YouTube-Page-Label": this.config.PAGE_BUILD_LABEL,
			"X-YouTube-Utc-Offset": String(-new Date().getTimezoneOffset()),
			"X-YouTube-Time-Zone": new Intl.DateTimeFormat().resolvedOptions().timeZone,
		}

		// YouTube rejects a session that arrives with a client other than the one it signed in to
		const withCredentials = !client.clientName
		// Cookies alone leave requests signed out; YouTube also wants this hash of the session
		const sapisid = this.cookiejar
			.getCookiesSync(ORIGIN)
			.find(cookie => ["SAPISID", "__Secure-3PAPISID"].includes(cookie.key))?.value
		if (sapisid && withCredentials) {
			const time = Math.floor(Date.now() / 1000)
			const digest = await crypto.subtle.digest(
				"SHA-1",
				new TextEncoder().encode(`${time} ${sapisid} ${ORIGIN}`),
			)
			const hash = [...new Uint8Array(digest)]
				.map(byte => byte.toString(16).padStart(2, "0"))
				.join("")
			headers["Authorization"] = `SAPISIDHASH ${time}_${hash}`
			headers["X-Goog-AuthUser"] = String(this.config.SESSION_INDEX ?? 0)
		}

		const searchParams = new URLSearchParams({
			alt: "json",
			key: this.config.INNERTUBE_API_KEY!,
		})
		for (const [key, value] of Object.entries(query)) {
			// An undefined value would be sent as the text "undefined"
			if (value !== undefined) searchParams.set(key, value)
		}

		const url = `youtubei/${this.config.INNERTUBE_API_VERSION}/${endpoint}?${searchParams.toString()}`
		const data = {
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
					...client,
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
		const res = await this.retry(endpoint, () =>
			this.client.post(url, data, { responseType: "json", headers, withCredentials }),
		)

		if (this.options.ttl) {
			const now = Date.now()
			for (const [key, { expires }] of this.cache) {
				if (expires <= now) this.cache.delete(key)
			}
			this.cache.set(key, { data: res.data, expires: now + this.options.ttl })
			// A Map lists its keys oldest first
			for (const key of [...this.cache.keys()].slice(0, -this.options.size)) {
				this.cache.delete(key)
			}
		}

		return res.data
	}

	private assertVideoId(videoId: string) {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) throw new Error("Invalid videoId")
	}

	private assertId(name: "artistId" | "albumId" | "playlistId", id: string) {
		// IDs differ in length and prefix, but a URL or a blank is never one
		if (typeof id !== "string" || !id.match(/^[a-zA-Z0-9-_]+$/)) {
			throw new Error(`Invalid ${name}`)
		}
	}

	private async getPlayerData(videoId: string) {
		this.assertVideoId(videoId)
		const data = await this.constructRequest("player", { videoId })
		if (traverseString(data, "videoDetails", "videoId") !== videoId) {
			const status = traverseString(data, "playabilityStatus", "status")
			if (status && status !== "OK") {
				throw new PlayerError(
					videoId,
					status,
					traverseString(data, "playabilityStatus", "reason") ||
						"YouTube did not return video details",
				)
			}
			throw new Error("Invalid videoId")
		}
		return data
	}

	private async getLyricsData(videoId: string, client?: Record<string, string>) {
		this.assertVideoId(videoId)
		const data = await this.constructRequest("next", { videoId })
		const tab = traverseList(data, "tabs", "tabRenderer").find(
			tab => traverseString(tab, "pageType") === PageType.MUSIC_PAGE_TYPE_TRACK_LYRICS,
		)
		const browseId = traverseString(tab, "browseId")

		return browseId ? this.constructRequest("browse", { browseId }, {}, client) : null
	}

	/**
	 * Follows continuation tokens and collects every page, starting with the given one
	 *
	 * @param parse Reads the token for the next page out of a page
	 * @param more Whether to keep going after the pages collected so far
	 */
	private async getContinuationData(
		endpoint: string,
		data: any,
		parse: (data: any) => string,
		more: (pages: any[]) => boolean = () => true,
	): Promise<any[]> {
		const pages = [data]
		const tokens = new Set<string>()
		let continuation = parse(data)
		while (continuation && more(pages)) {
			if (tokens.has(continuation)) throw new Error("Repeated continuation token")
			tokens.add(continuation)
			data = await this.constructRequest(endpoint, {}, { continuation })
			pages.push(data)
			continuation = parse(data)
		}
		return pages
	}

	private async getSearchData(query: string, params: string, limit = 0): Promise<any[]> {
		const data = await this.constructRequest("search", { query, params })
		const items = (pages: any[]) => {
			const items = pages.flatMap(page =>
				traverseList(page, "musicResponsiveListItemRenderer"),
			)
			// YouTube repeats some results on the next page
			const ids = items.map(item => {
				const { endpoint } = Parser.parseFields(item)
				return traverseString(endpoint, "videoId") || traverseString(endpoint, "browseId")
			})

			return items.filter((_, i) => !ids[i] || ids.indexOf(ids[i]!) === i)
		}
		const pages = await this.getContinuationData(
			"search",
			data,
			Parser.parseSectionContinuation,
			pages => items(pages).length < limit,
		)

		return limit > 0 ? items(pages).slice(0, limit) : items(pages)
	}

	/**
	 * Get a list of search suggestiong based on the query
	 *
	 * @param query Query string
	 * @returns Search suggestions
	 */
	public async getSearchSuggestions(query: string): Promise<string[]> {
		return traverseList(
			await this.constructRequest("music/get_search_suggestions", {
				input: query,
			}),
			"query",
		)
	}

	/**
	 * Searches YouTube Music API for results
	 *
	 * @param query Query string
	 */
	public async search(query: string): Promise<SearchResult[]> {
		const searchData = await this.constructRequest("search", {
			query,
			params: null,
		})

		return SearchParser.parse(searchData)
	}

	/**
	 * Searches YouTube Music API for songs
	 *
	 * @param query Query string
	 * @param options.limit Number of results to load, across pages. Defaults to the first page
	 */
	public async searchSongs(query: string, options?: { limit?: number }): Promise<SongDetailed[]> {
		const items = await this.getSearchData(
			query,
			"Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D",
			options?.limit,
		)

		return items.map(item => SongParser.parseItem(item))
	}

	/**
	 * Searches YouTube Music API for videos
	 *
	 * @param query Query string
	 * @param options.limit Number of results to load, across pages. Defaults to the first page
	 */
	public async searchVideos(
		query: string,
		options?: { limit?: number },
	): Promise<VideoDetailed[]> {
		const items = await this.getSearchData(
			query,
			"Eg-KAQwIABABGAAgACgAMABqChAEEAMQCRAFEAo%3D",
			options?.limit,
		)

		return items.map(item => VideoParser.parseItem(item))
	}

	/**
	 * Searches YouTube Music API for artists
	 *
	 * @param query Query string
	 * @param options.limit Number of results to load, across pages. Defaults to the first page
	 */
	public async searchArtists(
		query: string,
		options?: { limit?: number },
	): Promise<ArtistDetailed[]> {
		const items = await this.getSearchData(
			query,
			"Eg-KAQwIABAAGAAgASgAMABqChAEEAMQCRAFEAo%3D",
			options?.limit,
		)

		return items.map(item => ArtistParser.parseItem(item))
	}

	/**
	 * Searches YouTube Music API for albums
	 *
	 * @param query Query string
	 * @param options.limit Number of results to load, across pages. Defaults to the first page
	 */
	public async searchAlbums(
		query: string,
		options?: { limit?: number },
	): Promise<AlbumDetailed[]> {
		const items = await this.getSearchData(
			query,
			"Eg-KAQwIABAAGAEgACgAMABqChAEEAMQCRAFEAo%3D",
			options?.limit,
		)

		return items.map(item => AlbumParser.parseItem(item))
	}

	/**
	 * Searches YouTube Music API for playlists
	 *
	 * @param query Query string
	 * @param options.limit Number of results to load, across pages. Defaults to the first page
	 */
	public async searchPlaylists(
		query: string,
		options?: { limit?: number },
	): Promise<PlaylistDetailed[]> {
		const items = await this.getSearchData(
			query,
			"Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo%3D",
			options?.limit,
		)

		return items.map(item => PlaylistParser.parseItem(item))
	}

	/**
	 * Get all possible information of a Song
	 *
	 * @param videoId Video ID
	 * @returns Song Data
	 */
	public async getSong(videoId: string): Promise<SongFull> {
		return SongParser.parse(await this.getPlayerData(videoId))
	}

	/**
	 * Get the songs queued after the current video.
	 *
	 * @param videoId Video ID
	 * @returns Up next songs
	 */
	public async getUpNexts(videoId: string): Promise<SongDetailed[]> {
		this.assertVideoId(videoId)

		const data = await this.constructRequest("next", {
			videoId,
			playlistId: `RDAMVM${videoId}`,
			isAudioOnly: true,
			enablePersistentPlaylistPanel: true,
		})
		const panel = traverseList(data, "musicQueueRenderer", "playlistPanelRenderer")[0]
		if (!panel) throw new Error("Invalid response structure")

		const videos = traverseList(panel, "contents", "playlistPanelVideoRenderer")
		const current = videos.findIndex(item => item.selected || item.videoId === videoId)
		return videos.slice(current + 1).map(item => SongParser.parseItem(item))
	}

	/**
	 * Get all possible information of a Video
	 *
	 * @param videoId Video ID
	 * @returns Video Data
	 */
	public async getVideo(videoId: string): Promise<VideoFull> {
		return VideoParser.parse(await this.getPlayerData(videoId))
	}

	/**
	 * Get lyrics of a specific Song
	 *
	 * @param videoId Video ID
	 * @returns Lyrics
	 */
	public async getLyrics(videoId: string): Promise<string[] | null> {
		return LyricsParser.parse(await this.getLyricsData(videoId))
	}

	/**
	 * Get lyrics of a specific Song with the time each line is sung at
	 *
	 * @param videoId Video ID
	 * @returns Lyrics with times in milliseconds, or null when YouTube Music has none timed
	 */
	public async getTimedLyrics(videoId: string): Promise<TimedLyric[] | null> {
		return LyricsParser.parseTimed(await this.getLyricsData(videoId, LYRICS_CLIENT))
	}

	/**
	 * Get all possible information of an Artist
	 *
	 * @param artistId Artist ID
	 * @returns Artist Data
	 */
	public async getArtist(artistId: string): Promise<ArtistFull> {
		this.assertId("artistId", artistId)
		const data = await this.constructRequest("browse", {
			browseId: artistId,
		})

		return ArtistParser.parse(data, artistId)
	}

	/**
	 * Get all of Artist's Songs
	 *
	 * @param artistId Artist ID
	 * @returns Artist's Songs
	 */
	public async getArtistSongs(artistId: string): Promise<SongDetailed[]> {
		this.assertId("artistId", artistId)
		const artistData = await this.constructRequest("browse", {
			browseId: artistId,
		})
		const browseToken = traverseString(artistData, "musicShelfRenderer", "title", "browseId")
		if (!browseToken) return []

		const songsData = await this.constructRequest("browse", {
			browseId: browseToken,
		})
		const pages = await this.getContinuationData(
			"browse",
			songsData,
			Parser.parseItemContinuation,
		)
		const artists = [ArtistParser.parseBasic(artistData, artistId)]

		return pages
			.flatMap(page => traverseList(page, "musicResponsiveListItemRenderer"))
			.map(item => SongParser.parseItem(item, { artists }))
	}

	/**
	 * Get all of Artist's Albums
	 *
	 * @param artistId Artist ID
	 * @returns Artist's Albums
	 */
	public async getArtistAlbums(artistId: string): Promise<AlbumDetailed[]> {
		this.assertId("artistId", artistId)
		const artistData = await this.constructRequest("browse", {
			browseId: artistId,
		})
		const browseBody = ArtistParser.parseAlbumsEndpoint(artistData)
		if (!browseBody) return ArtistParser.parse(artistData, artistId).topAlbums

		const albumsData = await this.constructRequest("browse", browseBody)
		const artists = [ArtistParser.parseBasic(artistData, artistId)]

		return traverseList(albumsData, "musicTwoRowItemRenderer").map(item =>
			AlbumParser.parseItem(item, { artists }),
		)
	}

	/**
	 * Get all possible information of an Album
	 *
	 * @param albumId Album ID, or the playlist ID from the album's share link
	 * @returns Album Data
	 */
	public async getAlbum(albumId: string): Promise<AlbumFull> {
		this.assertId("albumId", albumId)
		if (albumId.startsWith("OLAK5uy_")) {
			// Share links carry the album's playlist ID, which only its songs map back to the album
			const playlistData = await this.constructRequest("browse", {
				browseId: `VL${albumId}`,
			})
			const album = traverseList(playlistData, "musicResponsiveListItemRenderer", "runs")
			albumId = traverseString(album.find(isAlbum), "browseId")
			if (!albumId) throw new Error("Invalid albumId")
		}

		const data = await this.constructRequest("browse", {
			browseId: albumId,
		})

		return AlbumParser.parse(data, albumId)
	}

	/**
	 * Get all possible information of a Playlist except the tracks
	 *
	 * @param playlistId Playlist ID
	 * @returns Playlist Data
	 */
	public async getPlaylist(playlistId: string): Promise<PlaylistFull> {
		this.assertId("playlistId", playlistId)
		playlistId = playlistId.replace(/^VL/, "")
		const data = await this.constructRequest("browse", {
			browseId: `VL${playlistId}`,
		})

		return PlaylistParser.parse(data, playlistId)
	}

	/**
	 * Get all videos in a Playlist
	 *
	 * @param playlistId Playlist ID
	 * @returns Playlist's Videos
	 */
	public async getPlaylistVideos(playlistId: string): Promise<VideoDetailed[]> {
		this.assertId("playlistId", playlistId)
		const playlistData = await this.constructRequest("browse", {
			browseId: `VL${playlistId.replace(/^VL/, "")}`,
		})

		const songs = traverseList(
			playlistData,
			"musicPlaylistShelfRenderer",
			"musicResponsiveListItemRenderer",
		)
		const pages = await this.getContinuationData(
			"browse",
			playlistData,
			Parser.parseItemContinuation,
		)
		for (const page of pages.slice(1)) {
			songs.push(...traverseList(page, "musicResponsiveListItemRenderer"))
		}

		return songs.map(item => VideoParser.parseItem(item)).filter(video => video.videoId)
	}

	/**
	 * Get a larger thumbnail of a video, checked to exist. Does not need initialize()
	 *
	 * @param thumbnails Thumbnails of a video or song
	 * @returns The larger thumbnail, or null when YouTube has none
	 */
	public async getHighresThumbnail(thumbnails: ThumbnailFull[]): Promise<ThumbnailFull | null> {
		return getVideoThumbnail(thumbnails)
	}

	/**
	 * Get sections for the home page.
	 *
	 * @returns Mixed HomeSection
	 */
	public async getHomeSections(): Promise<HomeSection[]> {
		const data = await this.constructRequest("browse", {
			browseId: FE_MUSIC_HOME,
		})

		const pages = await this.getContinuationData(
			"browse",
			data,
			Parser.parseSectionContinuation,
		)
		const sections = pages.flatMap(page => [
			...traverseList(page, "sectionListRenderer", "contents"),
			...traverseList(page, "sectionListContinuation", "contents"),
		])

		return (
			sections
				.flatMap(section => traverseList(section, "musicCarouselShelfRenderer"))
				.map(shelf => HomeSectionParser.parse(shelf))
				// Shelves of only podcasts or profiles have nothing this package returns
				.filter(section => section.contents.length)
		)
	}
}
