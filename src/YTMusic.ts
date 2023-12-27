import axios, { AxiosInstance } from "axios"
import { Cookie, CookieJar } from "tough-cookie"

import {
	AlbumDetailed,
	AlbumFull,
	ArtistDetailed,
	ArtistFull,
	PlaylistDetailed,
	PlaylistFull,
	SearchResult,
	SongDetailed,
	SongFull,
	VideoDetailed,
	VideoFull,
} from "./@types/types"
import AlbumParser from "./parsers/AlbumParser"
import ArtistParser from "./parsers/ArtistParser"
import PlaylistParser from "./parsers/PlaylistParser"
import SearchParser from "./parsers/SearchParser"
import SongParser from "./parsers/SongParser"
import VideoParser from "./parsers/VideoParser"
import traverse from "./utils/traverse"
import traverseList from "./utils/traverseList"
import traverseString from "./utils/traverseString"

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
				"Accept-Language": "en-US,en;q=0.5",
			},
			withCredentials: true,
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
				for (const cookieString of [setCookie].flat()) {
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
	public async initialize(cookies?: string) {
		if (cookies) {
			for (const cookieString of cookies.split("; ")) {
				const cookie = Cookie.parse(`${cookieString}`)
				if (!cookie) return

				this.cookiejar.setCookieSync(cookie, "https://music.youtube.com/")
			}
		}

		const html = (await this.client.get("/")).data as string
		const setConfigs = html.match(/ytcfg\.set\(.*\)/) || []

		const configs = setConfigs
			.map(c => c.slice(10, -1))
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

		return this
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
		query: Record<string, string> = {},
	) {
		if (!this.config) {
			throw new Error("API not initialized. Make sure to call the initialize() method first")
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
			},
			{
				responseType: "json",
				headers,
			},
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
	public async search(query: string): Promise<(typeof SearchResult.infer)[]> {
		const searchData = await this.constructRequest("search", {
			query,
			params: null,
		})

		return traverseList(searchData, "musicResponsiveListItemRenderer")
			.map(SearchParser.parse)
			.filter(Boolean) as (typeof SearchResult.infer)[]
	}

	/**
	 * Searches YouTube Music API for songs
	 *
	 * @param query Query string
	 */
	public async searchSongs(query: string): Promise<(typeof SongDetailed.infer)[]> {
		const searchData = await this.constructRequest("search", {
			query,
			params: "Eg-KAQwIARAAGAAgACgAMABqChAEEAMQCRAFEAo%3D",
		})

		return traverseList(searchData, "musicResponsiveListItemRenderer").map(
			SongParser.parseSearchResult,
		)
	}

	/**
	 * Searches YouTube Music API for videos
	 *
	 * @param query Query string
	 */
	public async searchVideos(query: string): Promise<(typeof VideoDetailed.infer)[]> {
		const searchData = await this.constructRequest("search", {
			query,
			params: "Eg-KAQwIABABGAAgACgAMABqChAEEAMQCRAFEAo%3D",
		})

		return traverseList(searchData, "musicResponsiveListItemRenderer").map(
			VideoParser.parseSearchResult,
		)
	}

	/**
	 * Searches YouTube Music API for artists
	 *
	 * @param query Query string
	 */
	public async searchArtists(query: string): Promise<(typeof ArtistDetailed.infer)[]> {
		const searchData = await this.constructRequest("search", {
			query,
			params: "Eg-KAQwIABAAGAAgASgAMABqChAEEAMQCRAFEAo%3D",
		})

		return traverseList(searchData, "musicResponsiveListItemRenderer").map(
			ArtistParser.parseSearchResult,
		)
	}

	/**
	 * Searches YouTube Music API for albums
	 *
	 * @param query Query string
	 */
	public async searchAlbums(query: string): Promise<(typeof AlbumDetailed.infer)[]> {
		const searchData = await this.constructRequest("search", {
			query,
			params: "Eg-KAQwIABAAGAEgACgAMABqChAEEAMQCRAFEAo%3D",
		})

		return traverseList(searchData, "musicResponsiveListItemRenderer").map(
			AlbumParser.parseSearchResult,
		)
	}

	/**
	 * Searches YouTube Music API for playlists
	 *
	 * @param query Query string
	 */
	public async searchPlaylists(query: string): Promise<(typeof PlaylistDetailed.infer)[]> {
		const searchData = await this.constructRequest("search", {
			query,
			params: "Eg-KAQwIABAAGAAgACgBMABqChAEEAMQCRAFEAo%3D",
		})

		return traverseList(searchData, "musicResponsiveListItemRenderer").map(
			PlaylistParser.parseSearchResult,
		)
	}

	/**
	 * Get all possible information of a Song
	 *
	 * @param videoId Video ID
	 * @returns Song Data
	 */
	public async getSong(videoId: string): Promise<typeof SongFull.infer> {
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
	public async getVideo(videoId: string): Promise<typeof VideoFull.infer> {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) throw new Error("Invalid videoId")
		const data = await this.constructRequest("player", { videoId })

		const video = VideoParser.parse(data)
		if (video.videoId !== videoId) throw new Error("Invalid videoId")
		return video
	}

	/**
	 * Get lyrics of a specific Song
	 * 
	 * @param videoId Video ID
	 * @returns Lyrics
	 */
	public async getLyrics(videoId: string) {
		if (!videoId.match(/^[a-zA-Z0-9-_]{11}$/)) throw new Error("Invalid videoId")
		const data = await this.constructRequest("next", { videoId })
		const browseId = traverse(traverseList(data, "tabs", "tabRenderer")[1], "browseId")

		const lyricsData = await this.constructRequest("browse", { browseId })
		const lyrics = traverseString(lyricsData, "description", "runs", "text")()

		return lyrics ? lyrics.replaceAll("\r", "").split("\n") : null
	}

	/**
	 * Get all possible information of an Artist
	 *
	 * @param artistId Artist ID
	 * @returns Artist Data
	 */
	public async getArtist(artistId: string): Promise<typeof ArtistFull.infer> {
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
	public async getArtistSongs(artistId: string): Promise<(typeof SongDetailed.infer)[]> {
		const artistData = await this.constructRequest("browse", {
			browseId: artistId,
		})
		const browseToken = traverse(artistData, "musicShelfRenderer", "title", "browseId")

		if (browseToken instanceof Array) return []

		const songsData = await this.constructRequest("browse", {
			browseId: browseToken,
		})
		const continueToken = traverse(songsData, "continuation")
		const moreSongsData = await this.constructRequest(
			"browse",
			{},
			{ continuation: continueToken },
		)

		return [
			...traverseList(songsData, "musicResponsiveListItemRenderer"),
			...traverseList(moreSongsData, "musicResponsiveListItemRenderer"),
		].map(SongParser.parseArtistSong)
	}

	/**
	 * Get all of Artist's Albums
	 *
	 * @param artistId Artist ID
	 * @returns Artist's Albums
	 */
	public async getArtistAlbums(artistId: string): Promise<(typeof AlbumDetailed.infer)[]> {
		const artistData = await this.constructRequest("browse", {
			browseId: artistId,
		})
		const artistAlbumsData = traverseList(artistData, "musicCarouselShelfRenderer")[0]
		const browseBody = traverse(artistAlbumsData, "moreContentButton", "browseEndpoint")

		const albumsData = await this.constructRequest("browse", browseBody)

		return traverseList(albumsData, "musicTwoRowItemRenderer").map(item =>
			AlbumParser.parseArtistAlbum(item, {
				artistId,
				name: traverseString(albumsData, "header", "runs", "text")(),
			}),
		)
	}

	/**
	 * Get all possible information of an Album
	 *
	 * @param albumId Album ID
	 * @returns Album Data
	 */
	public async getAlbum(albumId: string): Promise<typeof AlbumFull.infer> {
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
	public async getPlaylist(playlistId: string): Promise<typeof PlaylistFull.infer> {
		if (playlistId.startsWith("PL")) playlistId = "VL" + playlistId
		const data = await this.constructRequest("browse", {
			browseId: playlistId,
		})

		return PlaylistParser.parse(data, playlistId)
	}

	/**
	 * Get all videos in a Playlist
	 *
	 * @param playlistId Playlist ID
	 * @returns Playlist's Videos
	 */
	public async getPlaylistVideos(playlistId: string): Promise<(typeof VideoDetailed.infer)[]> {
		if (playlistId.startsWith("PL")) playlistId = "VL" + playlistId
		const playlistData = await this.constructRequest("browse", {
			browseId: playlistId,
		})

		const songs = traverseList(
			playlistData,
			"musicPlaylistShelfRenderer",
			"musicResponsiveListItemRenderer",
		)
		let continuation = traverse(playlistData, "continuation")
		while (!(continuation instanceof Array)) {
			const songsData = await this.constructRequest("browse", {}, { continuation })
			songs.push(...traverseList(songsData, "musicResponsiveListItemRenderer"))
			continuation = traverse(songsData, "continuation")
		}

		return songs.map(VideoParser.parsePlaylistVideo)
	}
}
