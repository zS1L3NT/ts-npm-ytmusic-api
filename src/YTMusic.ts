import AlbumParser from "./parsers/AlbumParser"
import ArtistParser from "./parsers/ArtistParser"
import axios, { AxiosInstance } from "axios"
import PlaylistParser from "./parsers/PlaylistParser"
import SearchParser from "./parsers/SearchParser"
import SongParser from "./parsers/SongParser"
import traverse from "./utils/traverse"
import traverseList from "./utils/traverseList"
import traverseString from "./utils/traverseString"
import VideoParser from "./parsers/VideoParser"
import {
	AlbumDetailed,
	AlbumFull,
	ArtistDetailed,
	ArtistFull,
	PlaylistFull,
	SearchResult,
	SongDetailed,
	SongFull,
	VideoDetailed,
	VideoFull
} from "."
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
					const cookie = Cookie.parse(`${cookieString}`)
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
		if (!this.config) {
			throw new Error("API not initialized. Make sure to call the initialize() method first")
		}

		const headers: Record<string, any> = {
			...this.client.defaults.headers,
			"x-origin": this.client.defaults.baseURL,
			"X-Goog-Visitor-Id": this.config.VISITOR_DATA,
			"X-YouTube-Client-Name": this.config.INNERTUBE_CONTEXT_CLIENT_NAME,
			"X-YouTube-Client-Version": this.config.INNERTUBE_CLIENT_VERSION,
			"X-YouTube-Device": this.config.DEVICE,
			"X-YouTube-Page-CL": this.config.PAGE_CL,
			"X-YouTube-Page-Label": this.config.PAGE_BUILD_LABEL,
			"X-YouTube-Utc-Offset": String(-new Date().getTimezoneOffset()),
			"X-YouTube-Time-Zone": new Intl.DateTimeFormat().resolvedOptions().timeZone
		}

		const searchParams = new URLSearchParams({
			...query,
			alt: "json",
			key: this.config.INNERTUBE_API_KEY!
		})

		const res = await this.client.post(
			`youtubei/${this.config.INNERTUBE_API_VERSION}/${endpoint}?${searchParams.toString()}`,
			{
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
		return traverseList(
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
	public async search(query: string, category: "SONG"): Promise<SongDetailed[]>
	public async search(query: string, category: "VIDEO"): Promise<VideoDetailed[]>
	public async search(query: string, category: "ARTIST"): Promise<ArtistDetailed[]>
	public async search(query: string, category: "ALBUM"): Promise<AlbumDetailed[]>
	public async search(query: string, category: "PLAYLIST"): Promise<PlaylistFull[]>
	public async search(query: string): Promise<SearchResult[]>
	public async search(query: string, category?: string) {
		const searchData = await this.constructRequest("search", {
			query,
			params:
				{
					SONG: "Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D",
					VIDEO: "Eg-KAQwIABABGAAgACgAMABqChAEEAMQCRAFEAo%3D",
					ALBUM: "Eg-KAQwIABAAGAEgACgAMABqChAEEAMQCRAFEAo%3D",
					ARTIST: "Eg-KAQwIABAAGAAgASgAMABqChAEEAMQCRAFEAo%3D",
					PLAYLIST: "Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo%3D"
				}[category!] || null
		})

		return traverseList(searchData, "musicResponsiveListItemRenderer").map(
			{
				SONG: SongParser.parseSearchResult,
				VIDEO: VideoParser.parseSearchResult,
				ARTIST: ArtistParser.parseSearchResult,
				ALBUM: AlbumParser.parseSearchResult,
				PLAYLIST: PlaylistParser.parseSearchResult
			}[category!] || SearchParser.parse
		)
	}

	/**
	 * Get all possible information of a Song
	 *
	 * @param videoId Video ID
	 * @returns Song Data
	 */
	public async getSong(videoId: string): Promise<SongFull> {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) throw new Error("Invalid videoId")
		const data = await this.constructRequest("player", { videoId })

		const song = SongParser.parse(data)
		if (song.videoId !== videoId) throw new Error("Invalid videoId")
		return song
	}

	/**
	 * Get all possible information of a Video
	 *
	 * @param videoId Video ID
	 * @returns Video Data
	 */
	public async getVideo(videoId: string): Promise<VideoFull> {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) throw new Error("Invalid videoId")
		const data = await this.constructRequest("player", { videoId })

		const video = VideoParser.parse(data)
		if (video.videoId !== videoId) throw new Error("Invalid videoId")
		return video
	}

	/**
	 * Get all possible information of an Artist
	 *
	 * @param artistId Artist ID
	 * @returns Artist Data
	 */
	public async getArtist(artistId: string): Promise<ArtistFull> {
		const data = await this.constructRequest("browse", { browseId: artistId })

		return ArtistParser.parse(data, artistId)
	}

	/**
	 * Get all of Artist's Songs
	 *
	 * @param artistId Artist ID
	 * @returns Artist's Songs
	 */
	public async getArtistSongs(artistId: string): Promise<SongDetailed[]> {
		const artistData = await this.constructRequest("browse", { browseId: artistId })
		const browseToken = traverse(artistData, "musicShelfRenderer", "title", "browseId")

		const songsData = await this.constructRequest("browse", { browseId: browseToken })
		const continueToken = traverse(songsData, "continuation")
		const moreSongsData = await this.constructRequest(
			"browse",
			{},
			{ continuation: continueToken }
		)

		return [
			...traverseList(songsData, "musicResponsiveListItemRenderer"),
			...traverseList(moreSongsData, "musicResponsiveListItemRenderer")
		].map(SongParser.parseArtistSong)
	}

	/**
	 * Get all of Artist's Albums
	 *
	 * @param artistId Artist ID
	 * @returns Artist's Albums
	 */
	public async getArtistAlbums(artistId: string): Promise<AlbumDetailed[]> {
		const artistData = await this.constructRequest("browse", { browseId: artistId })
		const artistAlbumsData = traverseList(artistData, "musicCarouselShelfRenderer")[0]
		const browseBody = traverse(artistAlbumsData, "moreContentButton", "browseEndpoint")

		const albumsData = await this.constructRequest("browse", browseBody)

		return traverseList(albumsData, "musicTwoRowItemRenderer").map(item =>
			AlbumParser.parseArtistAlbum(item, {
				artistId,
				name: traverseString(albumsData, "header", "text")()
			})
		)
	}

	/**
	 * Get all possible information of an Album
	 *
	 * @param albumId Album ID
	 * @returns Album Data
	 */
	public async getAlbum(albumId: string): Promise<AlbumFull> {
		const data = await this.constructRequest("browse", { browseId: albumId })

		return AlbumParser.parse(data, albumId)
	}

	/**
	 * Get all possible information of a Playlist except the tracks
	 *
	 * @param playlistId Playlist ID
	 * @returns Playlist Data
	 */
	public async getPlaylist(playlistId: string): Promise<PlaylistFull> {
		if (playlistId.startsWith("PL")) playlistId = "VL" + playlistId
		const data = await this.constructRequest("browse", { browseId: playlistId })

		return PlaylistParser.parse(data, playlistId)
	}

	/**
	 * Get all videos in a Playlist
	 *
	 * @param playlistId Playlist ID
	 * @returns Playlist's Videos
	 */
	public async getPlaylistVideos(playlistId: string): Promise<Omit<VideoDetailed, "views">[]> {
		if (playlistId.startsWith("PL")) playlistId = "VL" + playlistId
		const playlistData = await this.constructRequest("browse", { browseId: playlistId })

		const songs = traverseList(
			playlistData,
			"musicPlaylistShelfRenderer",
			"musicResponsiveListItemRenderer"
		)
		let continuation = traverse(playlistData, "musicPlaylistShelfRenderer", "continuation")
		while (true) {
			if (continuation instanceof Array) break

			const songsData = await this.constructRequest("browse", {}, { continuation })
			songs.push(...traverseList(songsData, "musicResponsiveListItemRenderer"))
			continuation = traverse(songsData, "continuation")
		}

		return songs.map(VideoParser.parsePlaylistVideo)
	}
}
