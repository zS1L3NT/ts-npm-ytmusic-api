import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"

import YTMusic from "../../YTMusic"
import Parser from "../../parsers/Parser"
import PlaylistParser from "../../parsers/PlaylistParser"
import VideoParser from "../../parsers/VideoParser"
import { HomeSection, UpNextsDetails } from "../../types"
import { traverseList } from "../../utils/traverse"
import fixtures from "../fixtures/youtube-music.json"

// Reduced browse/next responses captured from music.youtube.com in the browser.
const queue = () => structuredClone(fixtures.next)
const videos = (data: unknown) => traverseList(data, "playlistPanelVideoRenderer")
const mockRequests = (...responses: unknown[]) => {
	const api = new YTMusic()
	const request = spyOn(api as any, "constructRequest").mockImplementation(async () => {
		throw new Error("Unexpected request")
	})
	for (const response of responses) request.mockResolvedValueOnce(response)
	return { api, request }
}

afterEach(() => mock.restore())

describe("Up next parsing", () => {
	it("returns queue entries matching the public schema", async () => {
		const { api, request } = mockRequests(queue())
		const songs = await api.getUpNexts("mGsOHanQwxk")

		expect(songs).toHaveLength(2)
		expect(UpNextsDetails.array().safeParse(songs).success).toBe(true)
		expect(songs[0]).toMatchObject({
			videoId: "4eX9JOyM2VA",
			title: "Hibang",
			artists: { artistId: "UCUBIpcp9MV1pl0zeheoF5Ng", name: "Mariah Deborah" },
			duration: 230,
		})
		expect(request).toHaveBeenCalledWith("next", {
			videoId: "mGsOHanQwxk",
			playlistId: "RDAMVMmGsOHanQwxk",
			isAudioOnly: true,
			enablePersistentPlaylistPanel: true,
		})
	})

	it("skips continuation rows and starts after the selected video", async () => {
		const data = queue()
		const panel = traverseList(data, "playlistPanelRenderer")[0]
		videos(data)[0].selected = false
		videos(data)[1].selected = true
		panel.contents.push({
			continuationItemRenderer: { trigger: "CONTINUATION_TRIGGER_ON_ITEM_SHOWN" },
		})
		const { api } = mockRequests(data)

		expect((await api.getUpNexts("4eX9JOyM2VA")).map(song => song.videoId)).toEqual([
			"eGd6FzzTg1M",
		])
	})

	it("accepts an empty queue and rejects a missing queue", async () => {
		const data = queue()
		traverseList(data, "playlistPanelRenderer")[0].contents = []
		const { api } = mockRequests(data, {})

		expect(await api.getUpNexts("mGsOHanQwxk")).toEqual([])
		await expect(api.getUpNexts("mGsOHanQwxk")).rejects.toThrow("Invalid response structure")
	})

	it("validates IDs before making a request", async () => {
		const { api, request } = mockRequests()
		await expect(api.getUpNexts("invalid")).rejects.toThrow("Invalid videoId")
		expect(request).not.toHaveBeenCalled()
	})
})

describe("Home parsing", () => {
	it("recognizes radio playlists and omits messages without playable content", () => {
		const section = Parser.parseHomeSection({
			header: { title: { runs: [{ text: "Radio" }] } },
			contents: [
				{
					musicTwoRowItemRenderer: {
						title: { runs: [{ text: "Example radio" }] },
						navigationEndpoint: { watchPlaylistEndpoint: { playlistId: "RDradio" } },
						subtitle: { runs: [{ text: "Example Artist" }] },
					},
				},
				{ messageRenderer: { text: { runs: [{ text: "Sign in" }] } } },
			],
		})
		expect(section.contents).toHaveLength(1)
		expect(section.contents[0]).toMatchObject({
			type: "PLAYLIST",
			playlistId: "RDradio",
			name: "Example radio",
		})
	})

	it("classifies each item in a mixed shelf and omits unsupported items", () => {
		const title = (text: string, pageType: string, browseId: string) => ({
			runs: [
				{
					text,
					navigationEndpoint: {
						browseEndpoint: {
							browseId,
							browseEndpointContextSupportedConfigs: {
								browseEndpointContextMusicConfig: { pageType },
							},
						},
					},
				},
			],
		})
		const section = Parser.parseHomeSection({
			header: { title: { runs: [{ text: "Mixed recommendations" }] } },
			contents: [
				{
					musicTwoRowItemRenderer: {
						title: title("An album", "MUSIC_PAGE_TYPE_ALBUM", "album"),
						subtitle: { runs: [{ text: "An artist" }] },
						thumbnailOverlay: { playlistId: "album-playlist" },
					},
				},
				{
					musicTwoRowItemRenderer: {
						title: title("A playlist", "MUSIC_PAGE_TYPE_PLAYLIST", "VLplaylist"),
						subtitle: { runs: [{ text: "A creator" }] },
					},
				},
				{
					musicTwoRowItemRenderer: {
						title: { runs: [{ text: "A song" }] },
						navigationEndpoint: { watchEndpoint: { videoId: "mGsOHanQwxk" } },
						subtitle: { runs: [{ text: "An artist" }] },
					},
				},
				{
					musicTwoRowItemRenderer: {
						title: title("An artist", "MUSIC_PAGE_TYPE_ARTIST", "artist"),
					},
				},
			],
		})

		expect(HomeSection.safeParse(section).success).toBe(true)
		expect(section.contents.map(item => item.type)).toEqual(["ALBUM", "PLAYLIST", "SONG"])
		expect(section.contents[1]).toMatchObject({ playlistId: "VLplaylist" })
		expect(section.contents[2]).toMatchObject({ name: "A song", artist: { name: "An artist" } })
	})

	it("returns the first page and continuation pages without parsing promotional shelves", async () => {
		const first = structuredClone(fixtures.home)
		const shelf = first.contents.sectionListRenderer.contents[0]
		const { api, request } = mockRequests(
			{
				contents: {
					sectionListRenderer: {
						contents: [shelf, { musicTastebuilderShelfRenderer: {} }],
						continuations: [{ nextContinuationData: { continuation: "page-two" } }],
					},
				},
			},
			{ continuationContents: { sectionListContinuation: { contents: [shelf] } } },
		)

		const sections = await api.getHomeSections()
		expect(sections).toHaveLength(2)
		expect(HomeSection.array().safeParse(sections).success).toBe(true)
		expect(sections[0]).toMatchObject({
			title: "Quick picks",
			contents: [{ type: "SONG", videoId: "mGsOHanQwxk", name: "Na Para Bang" }],
		})
		expect(request.mock.calls[1]).toEqual(["browse", {}, { continuation: "page-two" }])
	})
})

describe("Playlist metadata", () => {
	it("reads the creator from the current facepile header", () => {
		expect(PlaylistParser.parse(fixtures.playlist, "VLplaylist")).toMatchObject({
			name: "Best of Liliac - Hard Rock",
			artist: { artistId: "UCFhBAaQu1zeE2t4M4tHXmVw", name: "Tony Lee" },
			videoCount: 13,
		})
	})

	it("retains the unknown-creator representation when YouTube omits the creator", () => {
		expect(PlaylistParser.parseSearchResult(fixtures.playlistSearch)).toMatchObject({
			playlistId: "OLAK5uy_mT8r3eHyGY4imWGftzgLH2ec8LgnMJ58I",
			artist: { artistId: null, name: "" },
		})
	})
})

describe("Playlist video parsing", () => {
	it("uses the endpoint ID even when the thumbnail is missing", () => {
		expect(
			VideoParser.parsePlaylistVideo({
				playNavigationEndpoint: { watchEndpoint: { videoId: "mGsOHanQwxk" } },
			})?.videoId,
		).toBe("mGsOHanQwxk")
	})

	it("uses playlist item IDs and skips unavailable rows", () => {
		expect(
			VideoParser.parsePlaylistVideo({ playlistItemData: { videoId: "mGsOHanQwxk" } })
				?.videoId,
		).toBe("mGsOHanQwxk")
		expect(VideoParser.parsePlaylistVideo({})).toBeUndefined()
	})

	it("extracts only the video ID from a thumbnail URL", () => {
		expect(
			VideoParser.parsePlaylistVideo({
				thumbnail: {
					thumbnails: [
						{
							url: "https://i.ytimg.com/vi/mGsOHanQwxk/hqdefault.jpg",
							width: 120,
							height: 90,
						},
					],
				},
			})?.videoId,
		).toBe("mGsOHanQwxk")
	})
})

describe("Artist pagination", () => {
	it("reads modern continuation commands without treating reload data as a next page", () => {
		expect(
			Parser.parseContinuation({
				continuationItemRenderer: {
					continuationEndpoint: { continuationCommand: { token: "next-page" } },
				},
			}),
		).toBe("next-page")
		expect(
			Parser.parseContinuation({ reloadContinuationData: { continuation: "reload" } }),
		).toBe("")
	})

	it("does not request a continuation when the songs fit on one page", async () => {
		const { api, request } = mockRequests(
			{
				musicShelfRenderer: {
					title: { navigationEndpoint: { browseEndpoint: { browseId: "songs" } } },
				},
			},
			{ musicShelfRenderer: { contents: [] } },
		)

		expect(await api.getArtistSongs("artist")).toEqual([])
		expect(request).toHaveBeenCalledTimes(2)
	})

	it("follows string continuation tokens until the final page", async () => {
		const { api, request } = mockRequests(
			{ musicShelfRenderer: { title: { browseEndpoint: { browseId: "songs" } } } },
			{
				musicShelfRenderer: {
					contents: [],
					continuations: [{ nextContinuationData: { continuation: "page-two" } }],
				},
				unrelated: { continuation: { reload: true } },
			},
			{
				musicShelfContinuation: {
					contents: [],
					continuations: [{ nextContinuationData: { continuation: "page-three" } }],
				},
			},
			{ musicShelfContinuation: { contents: [] } },
		)

		expect(await api.getArtistSongs("artist")).toEqual([])
		expect(request.mock.calls.slice(2)).toEqual([
			["browse", {}, { continuation: "page-two" }],
			["browse", {}, { continuation: "page-three" }],
		])
	})
})
