import axios, { AxiosInstance } from "axios"
import { Cookie, CookieJar } from "tough-cookie"

import PlayerError from "./PlayerError"
import RequestError from "./RequestError"
import {
	FE_MUSIC_HOME,
	LYRICS_CLIENT,
	ORIGIN,
	PageType,
	SearchFilter,
	TRANSIENT_STATUSES,
} from "./constants"
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
	Page,
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
	 * Loads the next `limit` items of a list that YouTube Music splits into pages
	 *
	 * @param key Names the list, so a cursor cannot continue another list
	 * @param load Loads the first page without a token, or the page of a token, with the token of
	 * the page after it. What it returns as `context` comes back with each later token
	 * @param id Identifies items in lists that repeat items on later pages, to skip those already returned
	 */
	private async getPage<T>(
		key: unknown[],
		options: { limit?: number; cursor?: string | null } = {},
		load: (
			token: string | null,
			context: any,
		) => Promise<{ items: T[]; token: string; context?: any }>,
		id?: (item: T) => string,
	): Promise<Page<T>> {
		const limit = options.limit ?? 20
		if (!Number.isInteger(limit) || limit < 1)
			throw new Error("limit must be a positive integer")

		const name = JSON.stringify(key)
		let cursor: Cursor = { key: name, token: null, skip: 0, seen: [], context: null }
		if (options.cursor) {
			try {
				cursor = JSON.parse(
					new TextDecoder().decode(
						Uint8Array.from(atob(options.cursor), char => char.charCodeAt(0)),
					),
				)
			} catch {
				throw new Error("Invalid cursor")
			}
			if (cursor.key !== name) throw new Error("Cursor is from another request")
		}

		const items: T[] = []
		const seen = new Set(cursor.seen)
		const tokens = new Set<string | null>()
		while (true) {
			if (tokens.has(cursor.token)) throw new Error("Repeated continuation token")
			tokens.add(cursor.token)

			const page = await load(cursor.token, cursor.context)
			let rest: T[]
			if (id) {
				const pageSeen = new Set(seen)
				rest = page.items.filter(item => {
					const itemId = id(item)
					if (!itemId) return true
					if (pageSeen.has(itemId)) return false
					pageSeen.add(itemId)
					return true
				})
			} else {
				rest = page.items.slice(cursor.skip)
			}
			const taken = rest.slice(0, limit - items.length)
			items.push(...taken)
			if (id) {
				for (const item of taken) {
					const itemId = id(item)
					if (itemId) seen.add(itemId)
				}
			}
			cursor = { ...cursor, seen: [...seen], context: page.context ?? cursor.context }

			if (taken.length < rest.length) {
				cursor.skip += taken.length
				break
			}
			if (!page.token) return { items, cursor: null }
			cursor = { ...cursor, token: page.token, skip: 0 }
			if (items.length === limit) break
		}

		const bytes = new TextEncoder().encode(JSON.stringify(cursor))
		return {
			items,
			cursor: btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join("")),
		}
	}

	private getSearchPage<T>(
		method: string,
		query: string,
		params: string,
		options: { limit?: number; cursor?: string | null } | undefined,
		parse: (item: any) => T,
		id: (item: T) => string,
	): Promise<Page<T>> {
		return this.getPage(
			[method, query],
			options,
			async token => {
				const data = token
					? await this.constructRequest("search", {}, { continuation: token })
					: await this.constructRequest("search", { query, params })

				return {
					items: traverseList(data, "musicResponsiveListItemRenderer").map(parse),
					token: Parser.parseSectionContinuation(data),
				}
			},
			id,
		)
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
	 * Searches YouTube Music API for songs, one page at a time without repeats
	 *
	 * @param query Query string
	 * @param options.limit Number of songs on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async searchSongs(
		query: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<SongDetailed>> {
		return this.getSearchPage(
			"searchSongs",
			query,
			SearchFilter.SONGS,
			options,
			item => SongParser.parseItem(item),
			song => song.videoId,
		)
	}

	/**
	 * Searches YouTube Music API for videos, one page at a time without repeats
	 *
	 * @param query Query string
	 * @param options.limit Number of videos on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async searchVideos(
		query: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<VideoDetailed>> {
		return this.getSearchPage(
			"searchVideos",
			query,
			SearchFilter.VIDEOS,
			options,
			item => VideoParser.parseItem(item),
			video => video.videoId,
		)
	}

	/**
	 * Searches YouTube Music API for artists, one page at a time without repeats
	 *
	 * @param query Query string
	 * @param options.limit Number of artists on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async searchArtists(
		query: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<ArtistDetailed>> {
		return this.getSearchPage(
			"searchArtists",
			query,
			SearchFilter.ARTISTS,
			options,
			item => ArtistParser.parseItem(item),
			artist => artist.artistId,
		)
	}

	/**
	 * Searches YouTube Music API for albums, one page at a time without repeats
	 *
	 * @param query Query string
	 * @param options.limit Number of albums on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async searchAlbums(
		query: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<AlbumDetailed>> {
		return this.getSearchPage(
			"searchAlbums",
			query,
			SearchFilter.ALBUMS,
			options,
			item => AlbumParser.parseItem(item),
			album => album.albumId,
		)
	}

	/**
	 * Searches YouTube Music API for playlists, one page at a time without repeats
	 *
	 * @param query Query string
	 * @param options.limit Number of playlists on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async searchPlaylists(
		query: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<PlaylistDetailed>> {
		return this.getSearchPage(
			"searchPlaylists",
			query,
			SearchFilter.PLAYLISTS,
			options,
			item => PlaylistParser.parseItem(item),
			playlist => playlist.playlistId,
		)
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
	 * Loads a page of songs queued after the current video, without repeats
	 *
	 * @param videoId Video ID
	 * @param options.limit Number of songs on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async getUpNexts(
		videoId: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<SongDetailed>> {
		this.assertVideoId(videoId)

		return this.getPage(
			["getUpNexts", videoId],
			options,
			async token => {
				if (token) {
					const data = await this.constructRequest("next", {}, { continuation: token })
					const panel = traverseList(data, "playlistPanelContinuation")[0] ?? data
					const videos = traverseList(panel, "contents", "playlistPanelVideoRenderer")

					return {
						items: videos
							.filter(item => item.videoId !== videoId)
							.map(item => SongParser.parseItem(item)),
						token: traverseString(panel, "nextRadioContinuationData", "continuation"),
					}
				}

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

				return {
					items: videos.slice(current + 1).map(item => SongParser.parseItem(item)),
					token: traverseString(panel, "nextRadioContinuationData", "continuation"),
				}
			},
			song => song.videoId,
		)
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
	 * Loads a page of an Artist's Songs
	 *
	 * @param artistId Artist ID
	 * @param options.limit Number of songs on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async getArtistSongs(
		artistId: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<SongDetailed>> {
		this.assertId("artistId", artistId)

		return this.getPage(["getArtistSongs", artistId], options, async (token, artists) => {
			let data: any
			if (token) {
				data = await this.constructRequest("browse", {}, { continuation: token })
			} else {
				const artistData = await this.constructRequest("browse", {
					browseId: artistId,
				})
				const browseId = traverseString(
					artistData,
					"musicShelfRenderer",
					"title",
					"browseId",
				)
				if (!browseId) return { items: [], token: "" }

				artists = [ArtistParser.parseBasic(artistData, artistId)]
				data = await this.constructRequest("browse", { browseId })
			}

			return {
				items: traverseList(data, "musicResponsiveListItemRenderer").map(item =>
					SongParser.parseItem(item, { artists }),
				),
				token: Parser.parseItemContinuation(data),
				context: artists,
			}
		})
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
	 * Loads a page of videos in a Playlist
	 *
	 * @param playlistId Playlist ID
	 * @param options.limit Number of videos on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async getPlaylistVideos(
		playlistId: string,
		options?: { limit?: number; cursor?: string | null },
	): Promise<Page<VideoDetailed>> {
		this.assertId("playlistId", playlistId)
		playlistId = playlistId.replace(/^VL/, "")

		return this.getPage(["getPlaylistVideos", playlistId], options, async token => {
			const data = token
				? await this.constructRequest("browse", {}, { continuation: token })
				: await this.constructRequest("browse", { browseId: `VL${playlistId}` })
			const items = token
				? traverseList(data, "musicResponsiveListItemRenderer")
				: traverseList(
						data,
						"musicPlaylistShelfRenderer",
						"musicResponsiveListItemRenderer",
					)

			return {
				items: items
					.map(item => VideoParser.parseItem(item))
					.filter(video => video.videoId),
				token: Parser.parseItemContinuation(data),
			}
		})
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
	 * Loads a page of sections for the home page
	 *
	 * @param options.limit Number of sections on the page. Defaults to 20
	 * @param options.cursor `cursor` of the previous page. Defaults to the first page
	 */
	public async getHomeSections(options?: {
		limit?: number
		cursor?: string | null
	}): Promise<Page<HomeSection>> {
		return this.getPage(["getHomeSections"], options, async token => {
			const data = token
				? await this.constructRequest("browse", {}, { continuation: token })
				: await this.constructRequest("browse", { browseId: FE_MUSIC_HOME })

			return {
				items: this.getHomeSectionItems(data),
				token: Parser.parseSectionContinuation(data),
			}
		})
	}

	private getHomeSectionItems(data: any): HomeSection[] {
		return (
			[
				...traverseList(data, "sectionListRenderer", "contents"),
				...traverseList(data, "sectionListContinuation", "contents"),
			]
				.flatMap(section => traverseList(section, "musicCarouselShelfRenderer"))
				.map(shelf => HomeSectionParser.parse(shelf))
				// Shelves of only podcasts or profiles have nothing this package returns
				.filter(section => section.contents.length)
		)
	}
}

type Cursor = {
	key: string
	token: string | null
	skip: number
	seen: string[]
	context: any
}
