import ArtistParser from "./utils/ArtistParser"
import axios, { AxiosInstance } from "axios"
import fs from "fs"
import SearchParser from "./utils/SearchParser"
import traverse from "./utils/traverse"
import { Cookie, CookieJar } from "tough-cookie"

export default class YTMusic {
	private cookiejar: CookieJar
	private config?: Record<string, string>
	private client: AxiosInstance

	/**
	 * Creates an instance of YTMusic
	 * Make sure to call initialize()
	 */
	public constructor() {
		this.cookiejar = new CookieJar()
		this.config = {}
		this.client = axios.create({
			baseURL: "https://music.youtube.com/",
			headers: {
				"User-Agent":
					"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.129 Safari/537.36",
				"Accept-Language": "en-US,en;q=0.5"
			},
			withCredentials: true
		})

		this.client.interceptors.request.use(req => {
			if (!req.baseURL) return

			const cookieString = this.cookiejar.getCookieStringSync(req.baseURL)
			if (cookieString) {
				if (!req.headers) {
					req.headers = {}
				}
				req.headers["Cookie"] = cookieString
			}

			return req
		})

		this.client.interceptors.response.use(res => {
			if ("set-cookie" in res.headers) {
				if (!res.config.baseURL) return

				const setCookie = res.headers["set-cookie"] as Array<string> | string
				const cookieStrings: string[] = []

				if (setCookie instanceof Array) {
					cookieStrings.push(...setCookie)
				} else {
					cookieStrings.push(setCookie)
				}

				for (const cookieString of cookieStrings) {
					const cookie = Cookie.parse(cookieString)
					if (!cookie) return

					this.cookiejar.setCookieSync(cookie, res.config.baseURL)
				}
			}
			return res
		})
	}

	/**
	 * Initializes the API
	 */
	public async initialize() {
		const html = (await this.client.get("/")).data as string
		const setConfigs = html.match(/ytcfg\.set\(.*\)/) || []

		const configs = setConfigs
			.map(c => c.slice(10, -1))
			.map(s => {
				try {
					return JSON.parse(s)
				} catch {}
			})
			.filter(j => !!j)

		for (const config of configs) {
			this.config = {
				...this.config,
				...config
			}
		}
	}

	/**
	 * Asserts that the API has been initialized
	 *
	 * @returns Non-null config
	 */
	private assertInitialized() {
		if (!this.config) {
			throw new Error("API not initialized. Make sure to call the initialize() method first")
		}

		return this.config
	}

	/**
	 * Constructs a basic YouTube Music API request with all essential headers
	 * and body parameters needed to make the API work
	 *
	 * @param endpoint Endpoint for the request
	 * @param body Body
	 * @param query Search params
	 * @returns Raw response from YouTube Music API which needs to be parsed
	 */
	private async constructRequest(
		endpoint: string,
		body: Record<string, any> = {},
		query: Record<string, string> = {}
	) {
		const config = this.assertInitialized()

		const headers: Record<string, any> = {
			...this.client.defaults.headers,
			"x-origin": this.client.defaults.baseURL,
			"X-Goog-Visitor-Id": config.VISITOR_DATA,
			"X-YouTube-Client-Name": config.INNERTUBE_CONTEXT_CLIENT_NAME,
			"X-YouTube-Client-Version": config.INNERTUBE_CLIENT_VERSION,
			"X-YouTube-Device": config.DEVICE,
			"X-YouTube-Page-CL": config.PAGE_CL,
			"X-YouTube-Page-Label": config.PAGE_BUILD_LABEL,
			"X-YouTube-Utc-Offset": String(-new Date().getTimezoneOffset()),
			"X-YouTube-Time-Zone": new Intl.DateTimeFormat().resolvedOptions().timeZone
		}

		const searchParams = new URLSearchParams({
			...query,
			alt: "json",
			key: config.INNERTUBE_API_KEY
		})

		// prettier-ignore
		const res = await this.client.post(
			`youtubei/${config.INNERTUBE_API_VERSION}/${endpoint}?${searchParams.toString()}`,
			{
				context: {
					capabilities: {},
					client: {
						clientName: config.INNERTUBE_CLIENT_NAME,
						clientVersion: config.INNERTUBE_CLIENT_VERSION,
						experimentIds: [],
						experimentsToken: "",
						gl: config.GL,
						hl: config.HL,
						locationInfo: {
							locationPermissionAuthorizationStatus:
								"LOCATION_PERMISSION_AUTHORIZATION_STATUS_UNSUPPORTED"
						},
						musicAppInfo: {
							musicActivityMasterSwitch: "MUSIC_ACTIVITY_MASTER_SWITCH_INDETERMINATE",
							musicLocationMasterSwitch: "MUSIC_LOCATION_MASTER_SWITCH_INDETERMINATE",
							pwaInstallabilityStatus: "PWA_INSTALLABILITY_STATUS_UNKNOWN"
						},
						utcOffsetMinutes: -new Date().getTimezoneOffset()
					},
					request: {
						internalExperimentFlags: [
							{
								key: "force_music_enable_outertube_tastebuilder_browse",
								value: "true"
							},
							{
								key: "force_music_enable_outertube_playlist_detail_browse",
								value: "true"
							},
							{
								key: "force_music_enable_outertube_search_suggestions",
								value: "true"
							}
						],
						sessionIndex: {}
					},
					user: {
						enableSafetyMode: false
					}
				},
				...body
			},
			{
				responseType: "json",
				headers
			}
		)

		return "responseContext" in res.data ? res.data : res
	}

	/**
	 * Get a list of search suggestiong based on the query
	 *
	 * @param query Query string
	 * @returns Search suggestions
	 */
	public async getSearchSuggestions(query: string): Promise<string[]> {
		return traverse(
			await this.constructRequest("music/get_search_suggestions", {
				input: query
			}),
			"query"
		)
	}

	/**
	 * Searches YouTube Music API for content
	 *
	 * @param query Query string
	 * @param category Type of search results to receive
	 */
	public async search(query: string, category: "SONG"): Promise<YTMusic.SongDetailed[]>
	public async search(query: string, category: "PLAYLIST"): Promise<YTMusic.PlaylistDetailed[]>
	public async search(query: string, category: "VIDEO"): Promise<YTMusic.VideoDetailed[]>
	public async search(query: string, category: "ARTIST"): Promise<YTMusic.ArtistDetailed[]>
	public async search(query: string, category: "ALBUM"): Promise<YTMusic.AlbumDetailed[]>
	public async search(query: string, category: "PLAYLIST"): Promise<YTMusic.PlaylistDetailed[]>
	public async search(query: string): Promise<YTMusic.SearchResult[]>
	public async search(query: string, category?: string) {
		const searchData = await this.constructRequest("search", {
			query: query,
			params:
				{
					SONG: "Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D",
					VIDEO: "Eg-KAQwIABABGAAgACgAMABqChAEEAMQCRAFEAo%3D",
					ALBUM: "Eg-KAQwIABAAGAEgACgAMABqChAEEAMQCRAFEAo%3D",
					ARTIST: "Eg-KAQwIABAAGAAgASgAMABqChAEEAMQCRAFEAo%3D",
					PLAYLIST: "Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo%3D"
				}[category!] || null
		})

		const searchParser = new SearchParser(searchData)
		return (
			{
				SONG: searchParser.parseSongs,
				VIDEO: searchParser.parseVideos,
				ARTIST: searchParser.parseArtists,
				ALBUM: searchParser.parseAlbums,
				PLAYLIST: searchParser.parsePlaylists
			}[category!] || searchParser.parse
		).call(searchParser)
	}

	public async getSong(videoId: string) {
		const data = await this.constructRequest("player", { videoId })

		fs.writeFileSync("data.json", JSON.stringify(data))
	}

	public async getVideo(videoId: string) {
		const data = await this.constructRequest("player", { videoId })

		fs.writeFileSync("data.json", JSON.stringify(data))
	}

	public async getArtist(artistId: string): Promise<YTMusic.ArtistFull> {
		const data = await this.constructRequest("browse", { browseId: artistId })

		return new ArtistParser(data).parse(artistId)
	}

	public async getArtistSongs(artistId: string): Promise<YTMusic.SongDetailed[]> {
		const artistData = await this.constructRequest("browse", { browseId: artistId })
		const browseToken = traverse(artistData, "musicShelfRenderer", "title", "browseId")

		const songsData = await this.constructRequest("browse", { browseId: browseToken })
		const continueToken = traverse(songsData, "continuation")
		const moreSongsData = await this.constructRequest(
			"browse",
			{},
			{ continuation: continueToken }
		)

		return ArtistParser.parseSongs(songsData, moreSongsData)
	}

	public async getArtistAlbums(artistId: string): Promise<YTMusic.AlbumDetailed[]> {
		const artistData = await this.constructRequest("browse", { browseId: artistId })
		const artistAlbumsData = traverse(artistData, "musicCarouselShelfRenderer")[0]
		const browseBody = traverse(artistAlbumsData, "moreContentButton", "browseEndpoint")

		const albumsData = await this.constructRequest("browse", browseBody)

		return ArtistParser.parseAlbums(artistId, albumsData)
	}

	public async getAlbum(albumId: string) {
		const data = await this.constructRequest("browse", { browseId: albumId })

		fs.writeFileSync("data.json", JSON.stringify(data))
	}

	public async getPlaylist(playlistId: string) {
		const data = await this.constructRequest("browse", { browseId: playlistId })

		fs.writeFileSync("data.json", JSON.stringify(data))
	}
}

const ytmusicapi = new YTMusic()
ytmusicapi.initialize().then(async () => {
	console.log("Initialized")

	const artistDetailed = (await ytmusicapi.search("Roundworm", "ARTIST"))[0]
	const artistFull = await ytmusicapi.getArtist(artistDetailed.artistId)
	console.log(JSON.stringify(artistFull, null, 4))

	// const artistDetailed = (await ytmusicapi.search("IU Lilac", "ARTIST"))[0]
	// const albumDetailed = (await ytmusicapi.getArtistAlbums(artistDetailed.artistId))[0]
	// const albumFull = await ytmusicapi.getAlbum(albumDetailed.albumId)
	// console.log(JSON.stringify(albumFull))
})
