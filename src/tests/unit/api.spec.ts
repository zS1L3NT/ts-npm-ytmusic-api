import { describe, expect, it } from "bun:test"
import type { InternalAxiosRequestConfig } from "axios"
import YTMusic, { PlayerError } from "../../index"
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
	TimedLyric,
	VideoDetailed,
	VideoFull,
} from "../../types"
import { traverseList } from "../../utils/traverse"
import * as responses from "../fixtures/responses"
import real from "../fixtures/youtube-music.json"
import { setup } from "./client"

const url = (request: InternalAxiosRequestConfig) => new URL(request.url!, request.baseURL)
const bodies = (calls: { mock: { calls: [InternalAxiosRequestConfig][] } }) =>
	calls.mock.calls.map(([request]) => (request.data ? JSON.parse(request.data) : undefined))
const continuations = (calls: { mock: { calls: [InternalAxiosRequestConfig][] } }) =>
	calls.mock.calls.map(([request]) => url(request).searchParams.get("continuation"))
const endpoints = (calls: { mock: { calls: [InternalAxiosRequestConfig][] } }) =>
	calls.mock.calls.slice(1).map(([request]) => url(request).pathname.split("/").pop())

describe("Search API", () => {
	it.each([
		["searchSongs", real.searchSongs, SongDetailed, "SONG"],
		["searchVideos", real.searchVideos, VideoDetailed, "VIDEO"],
		["searchArtists", real.searchArtists, ArtistDetailed, "ARTIST"],
		["searchAlbums", real.searchAlbums, AlbumDetailed, "ALBUM"],
		["searchPlaylists", real.searchPlaylists, PlaylistDetailed, "PLAYLIST"],
	] as const)(
		"%s returns typed results and sends the filter",
		async (method, response, schema, type) => {
			const { api, adapter } = await setup(response)
			const result = await api[method]("A search & its symbols")
			expect(result.length).toBeGreaterThan(0)
			expect(schema.array().safeParse(result).success).toBe(true)
			expect(result[0]).toMatchObject({ type })
			const request = bodies(adapter)[1]
			expect(request.query).toBe("A search & its symbols")
			expect(request.params).toMatch(/^Eg-/)
			expect(url(adapter.mock.calls[1]![0]).pathname).toBe("/youtubei/v1/search")
		},
	)

	it.each(
		(
			[
				"search",
				"searchSongs",
				"searchVideos",
				"searchArtists",
				"searchAlbums",
				"searchPlaylists",
			] as const
		).map(method => [method] as const),
	)("%s handles no results", async method => {
		const { api } = await setup({ contents: {} })
		expect(await api[method]("missing")).toEqual([])
	})

	it("returns the top result first and every supported kind in a general search", async () => {
		const { api, adapter } = await setup(real.search)
		const results = await api.search("weekend")
		expect(results.map(result => result.type)).toEqual([
			"ARTIST",
			"SONG",
			"SONG",
			"SONG",
			"VIDEO",
			"ARTIST",
			"ALBUM",
			"PLAYLIST",
		])
		expect(SearchResult.array().safeParse(results).success).toBe(true)
		expect(bodies(adapter)[1]).toMatchObject({ query: "weekend", params: null })
	})

	it("returns single, multiple, and empty suggestion lists", async () => {
		const { api } = await setup(
			{ suggestions: [{ query: "one" }] },
			{ suggestions: [{ query: "one" }, { query: "two" }] },
			{},
		)
		expect(await api.getSearchSuggestions("o")).toEqual(["one"])
		expect(await api.getSearchSuggestions("o")).toEqual(["one", "two"])
		expect(await api.getSearchSuggestions("absent")).toEqual([])
	})
})

describe("Search limits", () => {
	it("makes one request without a limit even when the response has a continuation", async () => {
		const { api, adapter } = await setup(real.searchSongs, real.searchSongsPage)
		expect(await api.searchSongs("weekend")).toHaveLength(3)
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("follows the continuation to the search endpoint until it has enough rows", async () => {
		const { api, adapter } = await setup(
			real.searchSongs,
			real.searchSongsPage,
			real.searchSongsLast,
		)
		const songs = await api.searchSongs("weekend", { limit: 4 })
		expect(songs).toHaveLength(4)
		expect(SongDetailed.array().safeParse(songs).success).toBe(true)
		expect(songs[3]!.name).toBe("House Of Balloons / Glass Table Girls")
		expect(adapter).toHaveBeenCalledTimes(3)
		expect(endpoints(adapter)).toEqual(["search", "search"])
		expect(continuations(adapter).slice(1)).toEqual([null, "page-two"])
	})

	it("returns exactly the limit when the last page holds more", async () => {
		const { api, adapter } = await setup(real.searchSongs, real.searchSongsPage)
		expect(await api.searchSongs("weekend", { limit: 1 })).toHaveLength(1)
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("returns every row once the continuation ends before the limit", async () => {
		const { api, adapter } = await setup(
			real.searchSongs,
			real.searchSongsPage,
			real.searchSongsLast,
		)
		const songs = await api.searchSongs("weekend", { limit: 50 })
		expect(songs.map(song => song.videoId)).toEqual([
			"DlFXDl_ROAM",
			"_WfL_j6-DvM",
			"tXOKabXyR5Q",
			"1OZnXQQPBU0",
			"si-g77lVJ2E",
			"yRVotpLaCD4",
		])
		expect(continuations(adapter).slice(1)).toEqual([null, "page-two", "page-three"])
	})

	it.each([
		["searchVideos", VideoDetailed],
		["searchArtists", ArtistDetailed],
		["searchAlbums", AlbumDetailed],
		["searchPlaylists", PlaylistDetailed],
	] as const)("%s stops at its limit without a continuation", async (method, schema) => {
		const response = {
			searchVideos: real.searchVideos,
			searchArtists: real.searchArtists,
			searchAlbums: real.searchAlbums,
			searchPlaylists: real.searchPlaylists,
		}[method]
		const { api, adapter } = await setup(response)
		const results = await api[method]("weekend", { limit: 5 })
		expect(results).toHaveLength(1)
		expect(schema.array().safeParse(results).success).toBe(true)
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("rejects a repeated continuation token instead of looping", async () => {
		const page = {
			...responses.searchResponse(responses.songItem),
			...responses.nextPage("same"),
		}
		const { api, adapter } = await setup(page, page, page)
		await expect(api.searchSongs("weekend", { limit: 5 })).rejects.toThrow(
			"Repeated continuation token",
		)
		expect(adapter).toHaveBeenCalledTimes(3)
	})
})

const song = (id: string) => ({
	...responses.listItem(
		{ text: id, navigationEndpoint: responses.watch(id, "MUSIC_VIDEO_TYPE_ATV") },
		[{ text: "Song" }, responses.separator, responses.artistRun],
	),
	playlistItemData: { videoId: id },
})
// YouTube repeats "c" on the next page, and "a" two pages later
const searchPages = [
	{ ...responses.searchResponse(song("a"), song("b"), song("c")), ...responses.nextPage("t2") },
	{ ...responses.searchResponse(song("c"), song("d"), song("e")), ...responses.nextPage("t3") },
	responses.searchResponse(song("a"), song("f")),
]
const ids = (page: { items: { videoId: string }[] }) => page.items.map(item => item.videoId)

describe("Pages", () => {
	it("returns pages of exactly the limit without results from earlier pages", async () => {
		const [one, two, three] = searchPages
		const { api, adapter } = await setup(one, one, two, two, three)
		const first = await api.searchSongsPage("weekend", { limit: 2 })
		const second = await api.searchSongsPage("weekend", { limit: 2, cursor: first.cursor })
		const last = await api.searchSongsPage("weekend", { limit: 2, cursor: second.cursor })
		expect([first, second, last].map(ids)).toEqual([
			["a", "b"],
			["c", "d"],
			["e", "f"],
		])
		expect(SongDetailed.array().safeParse(first.items).success).toBe(true)
		expect(last.cursor).toBeNull()
		expect(bodies(adapter)[1]).toMatchObject({
			query: "weekend",
			params: expect.stringMatching(/^Eg-/),
		})
		expect(endpoints(adapter)).toEqual(["search", "search", "search", "search", "search"])
		expect(continuations(adapter).slice(1)).toEqual([null, null, "t2", "t2", "t3"])
	})

	it("defaults to 20 results and ends with a null cursor", async () => {
		const { api, adapter } = await setup(...searchPages)
		const page = await api.searchSongsPage("weekend")
		expect(page).toMatchObject({ cursor: null })
		expect(ids(page)).toEqual(["a", "b", "c", "d", "e", "f"])
		expect(adapter).toHaveBeenCalledTimes(4)
	})

	it("loads the next page only when it is asked for", async () => {
		const [one, two] = searchPages
		const { api, adapter } = await setup(one, two)
		const first = await api.searchSongsPage("weekend", { limit: 3 })
		expect(ids(first)).toEqual(["a", "b", "c"])
		expect(adapter).toHaveBeenCalledTimes(2)
		const second = await api.searchSongsPage("weekend", { limit: 2, cursor: first.cursor })
		expect(ids(second)).toEqual(["d", "e"])
		expect(continuations(adapter).slice(1)).toEqual([null, "t2"])
	})

	it.each([
		["searchVideosPage", real.searchVideos, VideoDetailed],
		["searchArtistsPage", real.searchArtists, ArtistDetailed],
		["searchAlbumsPage", real.searchAlbums, AlbumDetailed],
		["searchPlaylistsPage", real.searchPlaylists, PlaylistDetailed],
	] as const)("%s returns typed results", async (method, response, schema) => {
		const { api, adapter } = await setup(response)
		const page = await api[method]("weekend", { limit: 5 })
		expect(page.items).toHaveLength(1)
		expect(schema.array().safeParse(page.items).success).toBe(true)
		expect(page.cursor).toBeNull()
		expect(bodies(adapter)[1].params).toMatch(/^Eg-/)
	})

	it("returns an empty page without results", async () => {
		const { api } = await setup({ contents: {} })
		expect(await api.searchSongsPage("missing")).toEqual({ items: [], cursor: null })
	})

	it("keeps a query in any script in the cursor", async () => {
		const [one, two] = searchPages
		const { api } = await setup(one, two)
		const first = await api.searchSongsPage("周杰倫 & co", { limit: 3 })
		const second = await api.searchSongsPage("周杰倫 & co", { limit: 1, cursor: first.cursor })
		expect(ids(second)).toEqual(["d"])
	})

	it.each([
		[
			"another query",
			(api: YTMusic, cursor: string) => api.searchSongsPage("other", { cursor }),
		],
		[
			"another kind",
			(api: YTMusic, cursor: string) => api.searchAlbumsPage("weekend", { cursor }),
		],
		[
			"another list",
			(api: YTMusic, cursor: string) => api.getPlaylistVideosPage("PLx", { cursor }),
		],
	])("rejects a cursor from %s before making a request", async (_, next) => {
		const { api, adapter } = await setup(searchPages[0])
		const { cursor } = await api.searchSongsPage("weekend", { limit: 1 })
		await expect(next(api, cursor!)).rejects.toThrow("Cursor is from another request")
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it.each(["not a cursor", "bm90IGpzb24"])("rejects the cursor %p", async cursor => {
		const { api, adapter } = await setup()
		await expect(api.searchSongsPage("weekend", { cursor })).rejects.toThrow("Invalid cursor")
		expect(adapter).toHaveBeenCalledTimes(1)
	})

	it.each([0, -1, 1.5])("rejects a limit of %p", async limit => {
		const { api } = await setup()
		await expect(api.searchSongsPage("weekend", { limit })).rejects.toThrow(
			"limit must be a positive integer",
		)
	})

	it("rejects a repeated continuation token instead of looping", async () => {
		const page = { ...responses.searchResponse(song("a")), ...responses.nextPage("same") }
		const { api, adapter } = await setup(page, page)
		await expect(api.searchSongsPage("weekend", { limit: 5 })).rejects.toThrow(
			"Repeated continuation token",
		)
		expect(adapter).toHaveBeenCalledTimes(3)
	})

	it("loads an artist's songs page by page and keeps the artist on later pages", async () => {
		const { api, adapter } = await setup(real.artist, real.artistSongs, real.artistSongsMore)
		const first = await api.getArtistSongsPage("UCartist", { limit: 1 })
		const last = await api.getArtistSongsPage("UCartist", { limit: 1, cursor: first.cursor })
		const songs = [...first.items, ...last.items]
		expect(SongDetailed.array().safeParse(songs).success).toBe(true)
		expect(songs).toHaveLength(2)
		expect(songs.every(song => song.artist.name === "The Weeknd")).toBe(true)
		expect(last.cursor).toBeNull()
		expect(continuations(adapter).slice(1)).toEqual([null, null, "rows-two"])
	})

	it("gives songs on later pages the artist when their rows name none", async () => {
		const row = responses.listItem(responses.titleRun)
		const { api } = await setup(real.artist, responses.playlistRows([row], "rows-two"), {
			contents: [{ musicResponsiveListItemRenderer: row }],
		})
		const first = await api.getArtistSongsPage("UCartist", { limit: 1 })
		const last = await api.getArtistSongsPage("UCartist", { cursor: first.cursor })
		expect(last.items).toMatchObject([{ artist: { artistId: "UCartist", name: "The Weeknd" } }])
	})

	it("returns an empty page when the artist has no songs link", async () => {
		const { api } = await setup({ header: real.artist.header })
		expect(await api.getArtistSongsPage("UCartist")).toEqual({ items: [], cursor: null })
	})

	it("loads a playlist page by page in the same order as getPlaylistVideos", async () => {
		const pages = [real.playlistRD, real.playlistMore, real.playlistLast]
		const { api, adapter } = await setup(...pages, ...pages, ...pages.slice(1))
		const every = await api.getPlaylistVideos("RDfixture")
		const first = await api.getPlaylistVideosPage("RDfixture", { limit: 2 })
		const last = await api.getPlaylistVideosPage("VLRDfixture", {
			limit: 2,
			cursor: first.cursor,
		})
		expect([...first.items, ...last.items]).toEqual(every)
		expect(last.cursor).toBeNull()
		expect(bodies(adapter)[4].browseId).toBe("VLRDfixture")
	})

	it("keeps a video that a playlist holds twice", async () => {
		const page = responses.playlistRows([responses.songItem, responses.songItem])
		const { api } = await setup(page, page)
		const first = await api.getPlaylistVideosPage("PLfixture", { limit: 1 })
		const last = await api.getPlaylistVideosPage("PLfixture", {
			limit: 1,
			cursor: first.cursor,
		})
		expect([first, last].map(ids)).toEqual([[responses.videoId], [responses.videoId]])
		expect(last.cursor).toBeNull()
	})

	it("loads home sections page by page", async () => {
		const { api } = await setup(real.home, real.homeMore, real.homeLast, real.homeLast)
		const first = await api.getHomeSectionsPage({ limit: 2 })
		const second = await api.getHomeSectionsPage({ limit: 2, cursor: first.cursor })
		const last = await api.getHomeSectionsPage({ limit: 2, cursor: second.cursor })
		expect(HomeSection.array().safeParse(first.items).success).toBe(true)
		expect([first, second, last].map(page => page.items.map(section => section.title))).toEqual(
			[
				["Quick picks", "New releases"],
				["Take it easy", "Trending songs for you"],
				["Indian Music"],
			],
		)
		expect(last.cursor).toBeNull()
	})
})

describe("Player API", () => {
	it("exposes a typed error even when YouTube supplies no failure reason", async () => {
		const { api } = await setup({ playabilityStatus: { status: "UNPLAYABLE" } })
		await expect(api.getVideo(responses.videoId)).rejects.toBeInstanceOf(PlayerError)
	})

	it("returns song metadata and both sets of streaming formats", async () => {
		const { api } = await setup(responses.playerResponse)
		const song = await api.getSong(responses.videoId)
		expect(SongFull.safeParse(song).success).toBe(true)
		expect(song).toEqual({
			type: "SONG",
			videoId: responses.videoId,
			name: "Example Song",
			artist: responses.artistBasic,
			artists: [responses.artistBasic],
			duration: 230,
			thumbnails: responses.thumbnails,
			formats: [{ itag: 18 }],
			adaptiveFormats: [{ itag: 140 }],
		})
	})

	it("returns video metadata and safety flags", async () => {
		const { api } = await setup(responses.playerResponse)
		const video = await api.getVideo(responses.videoId)
		expect(VideoFull.safeParse(video).success).toBe(true)
		expect(video).toMatchObject({
			videoId: responses.videoId,
			artists: [responses.artistBasic],
			duration: 230,
			unlisted: false,
			familySafe: true,
			paid: false,
			tags: ["music"],
		})
	})

	it.each((["getSong", "getVideo"] as const).map(method => [method] as const))(
		"%s preserves available metadata even when playback is restricted",
		async method => {
			const { api } = await setup({
				...responses.playerResponse,
				playabilityStatus: { status: "UNPLAYABLE", reason: "Playback is unavailable" },
			})
			expect((await api[method](responses.videoId)).videoId).toBe(responses.videoId)
		},
	)

	it.each((["getSong", "getVideo"] as const).map(method => [method] as const))(
		"%s reports the upstream sign-in challenge instead of an invalid ID",
		async method => {
			const { api } = await setup({
				responseContext: {},
				playabilityStatus: {
					status: "LOGIN_REQUIRED",
					reason: "Sign in to confirm you’re not a bot",
				},
			})
			await expect(api[method](responses.videoId)).rejects.toMatchObject({
				name: "PlayerError",
				videoId: responses.videoId,
				status: "LOGIN_REQUIRED",
				reason: "Sign in to confirm you’re not a bot",
			})
		},
	)

	it.each((["getSong", "getVideo"] as const).map(method => [method] as const))(
		"%s rejects a response for a different video",
		async method => {
			const { api } = await setup({
				...responses.playerResponse,
				videoDetails: { ...responses.playerResponse.videoDetails, videoId: "4eX9JOyM2VA" },
			})
			await expect(api[method](responses.videoId)).rejects.toThrow("Invalid videoId")
		},
	)

	it.each(
		(["getSong", "getVideo", "getLyrics", "getTimedLyrics", "getUpNexts"] as const).map(
			method => [method] as const,
		),
	)("%s rejects malformed IDs before sending a request", async method => {
		const { api, adapter } = await setup()
		for (const id of ["", "short", "twelvechars!", "with spaces", "mGsOHanQwxk?extra"]) {
			await expect(api[method](id)).rejects.toThrow("Invalid videoId")
		}
		expect(adapter).toHaveBeenCalledTimes(1)
	})
})

describe("Up next API", () => {
	const queue = () => structuredClone(real.next)
	const entries = (data: unknown) => traverseList(data, "playlistPanelVideoRenderer")

	it("returns the songs after the selected entry through the persistent panel request", async () => {
		const { api, adapter } = await setup(queue())
		const songs = await api.getUpNexts("3QZOazpGIQc")
		expect(songs.map(song => song.videoId)).toEqual(["2yqYAsUpdSc", "LztS3R1PZQA"])
		expect(SongDetailed.array().safeParse(songs).success).toBe(true)
		expect(SongDetailed.array().safeParse(songs).success).toBe(true)
		expect(songs[0]).toMatchObject({
			name: "Out of Time",
			artist: { artistId: "UClYV6hHlupm_S_ObS1W-DYw", name: "The Weeknd" },
			album: { name: "Dawn FM" },
			duration: 215,
		})
		expect(bodies(adapter)[1]).toMatchObject({
			videoId: "3QZOazpGIQc",
			playlistId: "RDAMVM3QZOazpGIQc",
			isAudioOnly: true,
			enablePersistentPlaylistPanel: true,
		})
	})

	it("starts after the selected entry and skips continuation rows", async () => {
		const data = queue()
		entries(data)[0].selected = false
		entries(data)[1].selected = true
		traverseList(data, "playlistPanelRenderer")[0].contents.push({
			continuationItemRenderer: { trigger: "CONTINUATION_TRIGGER_ON_ITEM_SHOWN" },
		})
		const { api } = await setup(data)
		expect((await api.getUpNexts("2yqYAsUpdSc")).map(song => song.videoId)).toEqual([
			"LztS3R1PZQA",
		])
	})

	it("falls back to the requested video when no entry is selected", async () => {
		const data = queue()
		for (const entry of entries(data)) entry.selected = false
		const { api } = await setup(data)
		expect((await api.getUpNexts("2yqYAsUpdSc")).map(song => song.videoId)).toEqual([
			"LztS3R1PZQA",
		])
	})

	it("accepts an empty queue and rejects a missing queue", async () => {
		const data = queue()
		traverseList(data, "playlistPanelRenderer")[0].contents = []
		const { api } = await setup(data, {})
		expect(await api.getUpNexts("3QZOazpGIQc")).toEqual([])
		await expect(api.getUpNexts("3QZOazpGIQc")).rejects.toThrow("Invalid response structure")
	})
})

describe("Lyrics API", () => {
	it("returns the lines of the lyrics tab and requests its page", async () => {
		const { api, adapter } = await setup(real.next, real.lyrics)
		expect(await api.getLyrics("3QZOazpGIQc")).toEqual([
			"There was something in the air",
			"I knew that in that moment",
			"I would burn the world to keep you warm",
			"But my life won't let me stay",
		])
		expect(bodies(adapter)[2]).toMatchObject({ browseId: "MPLYt_5qHogi2HE7p-1" })
		expect(endpoints(adapter)).toEqual(["next", "browse"])
	})

	it("finds the lyrics tab by its page type rather than its position", async () => {
		const data = structuredClone(real.next)
		const tabs = traverseList(data, "watchNextTabbedResultsRenderer")[0].tabs
		tabs.reverse()
		const { api, adapter } = await setup(data, real.lyrics)
		expect(await api.getLyrics("3QZOazpGIQc")).toHaveLength(4)
		expect(bodies(adapter)[2].browseId).toBe("MPLYt_5qHogi2HE7p-1")
	})

	it.each((["getLyrics", "getTimedLyrics"] as const).map(method => [method] as const))(
		"%s returns null without a browse request when there is no lyrics tab",
		async method => {
			const data = structuredClone(real.next)
			const watch = traverseList(data, "watchNextTabbedResultsRenderer")[0]
			watch.tabs = watch.tabs.filter(
				(tab: unknown) => !JSON.stringify(tab).includes("TRACK_LYRICS"),
			)
			const { api, adapter } = await setup(data)
			expect(await api[method]("3QZOazpGIQc")).toBeNull()
			expect(adapter).toHaveBeenCalledTimes(2)
		},
	)

	it("returns null for an empty lyrics page", async () => {
		const { api } = await setup(real.next, {})
		expect(await api.getLyrics("3QZOazpGIQc")).toBeNull()
	})

	it("returns timed lines from the mobile client", async () => {
		const { api, adapter } = await setup(
			real.next,
			responses.timedLyrics(["First line", 1000, 2500], ["Second line", 2500, 4000]),
		)
		const lines = await api.getTimedLyrics("3QZOazpGIQc")
		expect(lines).toEqual([
			{ text: "First line", startTime: 1000, endTime: 2500 },
			{ text: "Second line", startTime: 2500, endTime: 4000 },
		])
		expect(TimedLyric.array().safeParse(lines).success).toBe(true)
		const [web, mobile] = [adapter.mock.calls[1]![0], adapter.mock.calls[2]![0]]
		expect(bodies(adapter)[1].context.client.clientName).toBe("WEB_REMIX")
		expect(bodies(adapter)[2]).toMatchObject({
			browseId: "MPLYt_5qHogi2HE7p-1",
			context: { client: { clientName: "ANDROID_MUSIC" } },
		})
		expect(mobile.headers.get("X-YouTube-Client-Version")).toBe(
			bodies(adapter)[2].context.client.clientVersion,
		)
		expect(web.headers.get("X-YouTube-Client-Version")).toBe("1.20260101.01.00")
		expect(mobile.headers.get("X-YouTube-Client-Version")).not.toBe("1.20260101.01.00")
	})

	it("reads only the first timed lyrics model", async () => {
		const { api } = await setup(real.next, [
			responses.timedLyrics(["Kept", 0, 1]),
			responses.timedLyrics(["Repeated", 0, 1]),
		])
		expect(await api.getTimedLyrics("3QZOazpGIQc")).toEqual([
			{ text: "Kept", startTime: 0, endTime: 1 },
		])
	})

	it("returns null when the response has no timed lyrics", async () => {
		const { api } = await setup(real.next, real.lyrics)
		expect(await api.getTimedLyrics("3QZOazpGIQc")).toBeNull()
	})
})

describe("Artist API", () => {
	it("returns an artist with each supported kind of related content", async () => {
		const { api, adapter } = await setup(real.artist)
		const artist = await api.getArtist("UCartist")
		expect(ArtistFull.safeParse(artist).success).toBe(true)
		expect(artist).toMatchObject({ artistId: "UCartist", name: "The Weeknd" })
		for (const field of [
			"topSongs",
			"topAlbums",
			"topSingles",
			"topVideos",
			"featuredOn",
			"similarArtists",
		] as const)
			expect(artist[field].length).toBeGreaterThan(0)
		expect(bodies(adapter)[1]).toMatchObject({ browseId: "UCartist" })
	})

	it("returns no albums for an artist with only singles", async () => {
		const { api } = await setup(real.artistSingles)
		const artist = await api.getArtist("UCsingles")
		expect(artist.topAlbums).toEqual([])
		expect(artist.topSingles).toHaveLength(1)
	})

	it("returns empty related lists for an artist without shelves", async () => {
		const { api } = await setup({ header: real.artist.header })
		const artist = await api.getArtist("UCartist")
		expect(ArtistFull.safeParse(artist).success).toBe(true)
		expect(artist.topSongs).toEqual([])
		expect(artist.topAlbums).toEqual([])
		expect(artist.similarArtists).toEqual([])
	})

	it("retrieves the artist's albums from the browse endpoint of the Albums shelf", async () => {
		const { api, adapter } = await setup(real.artist, real.artistAlbums)
		const albums = await api.getArtistAlbums("UCartist")
		expect(AlbumDetailed.array().safeParse(albums).success).toBe(true)
		expect(albums).toMatchObject([
			{
				albumId: "MPREb_YWjvGjCFaW6",
				name: "Hurry Up Tomorrow",
				artist: { artistId: "UCartist", name: "The Weeknd" },
				year: 2025,
			},
		])
		expect(bodies(adapter)[2]).toMatchObject({
			browseId: "MPADUClYV6hHlupm_S_ObS1W-DYw",
			params: expect.any(String),
		})
	})

	it("returns the shelf's own albums without a second request when it has no endpoint", async () => {
		const data = structuredClone(real.artist)
		const title = traverseList(data, "musicCarouselShelfRenderer")[1].header
			.musicCarouselShelfBasicHeaderRenderer.title.runs[0]
		delete title.navigationEndpoint
		const { api, adapter } = await setup(data)
		const albums = await api.getArtistAlbums("UCartist")
		expect(albums.map(album => album.name)).toEqual(["Hurry Up Tomorrow"])
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("returns no albums for an artist without any", async () => {
		const { api, adapter } = await setup({ header: real.artist.header })
		expect(await api.getArtistAlbums("UCartist")).toEqual([])
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("returns every song of the artist across row continuations", async () => {
		const { api, adapter } = await setup(real.artist, real.artistSongs, real.artistSongsMore)
		const songs = await api.getArtistSongs("UCartist")
		expect(SongDetailed.array().safeParse(songs).success).toBe(true)
		expect(songs).toHaveLength(2)
		expect(songs.every(song => song.artist.name === "The Weeknd")).toBe(true)
		expect(bodies(adapter)[2].browseId).toBe("VLOLAK5uy_m9NcLauVzADCRC6rfmtow_Z6a6TuIO8g8")
		expect(continuations(adapter).slice(1)).toEqual([null, null, "rows-two"])
	})

	it("gives songs the artist when their rows name none", async () => {
		const row = { musicResponsiveListItemRenderer: responses.listItem(responses.titleRun) }
		const { api } = await setup(real.artist, {
			musicPlaylistShelfRenderer: { contents: [row] },
		})
		expect(await api.getArtistSongs("UCartist")).toMatchObject([
			{
				artist: { artistId: "UCartist", name: "The Weeknd" },
				artists: [{ artistId: "UCartist" }],
			},
		])
	})

	it("returns an empty list when the artist has no songs link", async () => {
		const { api, adapter } = await setup({ header: real.artist.header })
		expect(await api.getArtistSongs("UCartist")).toEqual([])
		expect(adapter).toHaveBeenCalledTimes(2)
	})
})

describe("Album API", () => {
	it("returns album details with song metadata, artist, and artwork", async () => {
		const { api, adapter } = await setup(real.album)
		const album = await api.getAlbum("MPREb_CL1trLyE0AA")
		expect(AlbumFull.safeParse(album).success).toBe(true)
		expect(album).toMatchObject({
			albumId: "MPREb_CL1trLyE0AA",
			name: "Weekend",
			artists: [{ artistId: "UC1F_z9eS5tNT1-EXUyJzj0A", name: "wtfstro" }],
			year: 2026,
			playlistId: "OLAK5uy_n2ceO4flWC7fWl5J30a4f6qzfC4RWD658",
		})
		expect(album.songs[0]).toMatchObject({
			artists: album.artists,
			album: { albumId: "MPREb_CL1trLyE0AA", name: "Weekend" },
			thumbnails: album.thumbnails,
		})
		expect(adapter).toHaveBeenCalledTimes(2)
		expect(bodies(adapter)[1].browseId).toBe("MPREb_CL1trLyE0AA")
	})

	it("resolves an album's playlist ID through its songs' album link", async () => {
		const { api, adapter } = await setup(real.albumPlaylist, real.albumOLAK)
		const album = await api.getAlbum("OLAK5uy_npqCTkmCJbXOn7gEIb5XTAGf1aL4no54o")
		expect(album).toMatchObject({ albumId: "MPREb_D5nUoJGAKIO", name: "Till Next Time" })
		expect(
			bodies(adapter)
				.slice(1)
				.map(body => body.browseId),
		).toEqual(["VLOLAK5uy_npqCTkmCJbXOn7gEIb5XTAGf1aL4no54o", "MPREb_D5nUoJGAKIO"])
	})

	it("rejects a playlist ID whose songs link no album", async () => {
		const { api, adapter } = await setup({ musicPlaylistShelfRenderer: { contents: [] } })
		await expect(api.getAlbum("OLAK5uy_unknown")).rejects.toThrow("Invalid albumId")
		expect(adapter).toHaveBeenCalledTimes(2)
	})
})

describe("Playlist API", () => {
	it.each(["PLfixtureplaylist", "OLAK5uy_fixture", "VLPLfixtureplaylist"])(
		"normalizes playlist ID %s",
		async id => {
			const { api, adapter } = await setup(real.playlist)
			const playlist = await api.getPlaylist(id)
			expect(PlaylistFull.safeParse(playlist).success).toBe(true)
			expect(playlist.playlistId).toBe(id.replace(/^VL/, ""))
			expect(bodies(adapter)[1].browseId).toBe(`VL${id.replace(/^VL/, "")}`)
		},
	)

	it("returns the creator and the number of videos", async () => {
		const { api } = await setup(real.playlist)
		expect(await api.getPlaylist("PLfixture")).toMatchObject({
			name: "FNF WEEKEND 1 UPDATE",
			artist: { artistId: null, name: "laik7u7" },
			videoCount: 16,
		})
	})

	it("makes no extra request when the rows have no continuation, whatever the page leads to", async () => {
		const { api, adapter } = await setup(real.playlist)
		const videos = await api.getPlaylistVideos("VLPLfixture")
		expect(VideoDetailed.array().safeParse(videos).success).toBe(true)
		expect(videos).toHaveLength(1)
		expect(videos[0]).toMatchObject({ videoId: "xeDa1c-Y224", duration: 226 })
		expect(adapter).toHaveBeenCalledTimes(2)
		expect(bodies(adapter)[1].browseId).toBe("VLPLfixture")
	})

	it("follows the row continuation and ignores the page's related-playlists token", async () => {
		const { api, adapter } = await setup(real.playlistRD, real.playlistMore, real.playlistLast)
		const videos = await api.getPlaylistVideos("RDfixture")
		expect(videos).toHaveLength(3)
		expect(VideoDetailed.array().safeParse(videos).success).toBe(true)
		expect(continuations(adapter).slice(1)).toEqual([null, "rows-two", "rows-three"])
		expect(endpoints(adapter)).toEqual(["browse", "browse", "browse"])
	})

	it("drops rows without a video ID and falls back to the thumbnail URL", async () => {
		const thumbnail = {
			thumbnails: [
				{ url: "https://i.ytimg.com/vi/mGsOHanQwxk/hqdefault.jpg", width: 120, height: 90 },
			],
		}
		const { api } = await setup(responses.playlistRows([{}, { thumbnail }, responses.songItem]))
		const videos = await api.getPlaylistVideos("PLfixture")
		expect(videos.map(video => video.videoId)).toEqual(["mGsOHanQwxk", "mGsOHanQwxk"])
	})
})

describe("Home API", () => {
	it("returns the shelves of every page", async () => {
		const { api, adapter } = await setup(real.home, real.homeMore, real.homeLast)
		const sections = await api.getHomeSections()
		expect(HomeSection.array().safeParse(sections).success).toBe(true)
		expect(sections.map(section => section.title)).toEqual([
			"Quick picks",
			"New releases",
			"Take it easy",
			"Trending songs for you",
			"Indian Music",
		])
		expect(sections.map(section => section.contents.map(item => item.type))).toEqual([
			["SONG"],
			["ALBUM"],
			["PLAYLIST"],
			["SONG"],
			["PLAYLIST"],
		])
		expect(sections[0]!.contents[0]).toMatchObject({
			name: 'Pavazha Malli (From "Think Indie")',
			artist: { name: "Sai Abhyankkar" },
			artists: [{ name: "Sai Abhyankkar" }, { name: "Shruti Haasan" }, { name: "Vivek" }],
		})
		expect(continuations(adapter).slice(1)).toEqual([null, "home-two", "home-three"])
	})

	it("returns videos, artists and other items next to songs, and omits unsupported items", async () => {
		const [video, , artist] = traverseList(real.artist, "musicTwoRowItemRenderer").slice(3)
		const show = responses.twoRow(
			{ text: "Show" },
			[{ text: "Podcast" }],
			responses.browse("MPSPPLshow", "MUSIC_PAGE_TYPE_PODCAST_SHOW_DETAIL_PAGE"),
		)
		const { api } = await setup(
			responses.sections(
				responses.shelf(
					"Mixed",
					{
						musicResponsiveListItemRenderer: traverseList(
							real.home,
							"musicResponsiveListItemRenderer",
						)[0],
					},
					{ musicTwoRowItemRenderer: video },
					{ musicTwoRowItemRenderer: artist },
					show,
				),
			),
		)
		const [section] = await api.getHomeSections()
		expect(section!.contents.map(item => item.type)).toEqual(["SONG", "VIDEO", "ARTIST"])
	})

	it("returns no sections for an empty page", async () => {
		const { api } = await setup({})
		expect(await api.getHomeSections()).toEqual([])
	})
})

describe("Continuation guards", () => {
	it.each(
		(["getArtistSongs", "getPlaylistVideos", "getHomeSections"] as const).map(
			method => [method] as const,
		),
	)("%s rejects a repeated continuation token instead of looping", async method => {
		const page =
			method === "getHomeSections"
				? responses.nextPage("same-token")
				: responses.playlistRows([responses.songItem], "same-token")
		const pages = method === "getArtistSongs" ? [real.artist, page, page] : [page, page]
		const { api, adapter } = await setup(...pages)
		await expect(api[method]("UCartist")).rejects.toThrow("Repeated continuation token")
		expect(adapter).toHaveBeenCalledTimes(pages.length + 1)
	})
})

describe("Review regressions", () => {
	it("ignores a continuation outside the playlist's own rows", async () => {
		const { api, adapter } = await setup({
			...responses.playlistRows([responses.songItem]),
			...responses.rowsToken("related-shelf"),
		})
		expect(await api.getPlaylistVideos("PLfixture")).toHaveLength(1)
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("keeps search rows without an ID and drops repeated ones", async () => {
		const page = responses.searchResponse(responses.songItem, {}, {}, responses.songItem)
		const { api } = await setup(page, page)
		expect(await api.searchSongs("query")).toHaveLength(3)
		expect(await api.searchSongs("query", { limit: -1 })).toHaveLength(3)
	})

	it("omits home sections with nothing supported in them", async () => {
		const { api } = await setup({
			contents: {
				sectionListRenderer: {
					contents: [{ musicCarouselShelfRenderer: { contents: [{ unknown: {} }] } }],
				},
			},
		})
		expect(await api.getHomeSections()).toEqual([])
	})
})

describe("Input checks", () => {
	it.each(
		(
			[
				"getArtist",
				"getArtistSongs",
				"getArtistAlbums",
				"getAlbum",
				"getPlaylist",
				"getPlaylistVideos",
			] as const
		).flatMap(method =>
			["", "https://music.youtube.com/x", "has space"].map(id => [method, id] as const),
		),
	)("%s rejects %p before making a request", async (method, id) => {
		const { api, adapter } = await setup()
		await expect(api[method](id)).rejects.toThrow(/^Invalid (artist|album|playlist)Id$/)
		expect(adapter).toHaveBeenCalledTimes(1)
	})
})
