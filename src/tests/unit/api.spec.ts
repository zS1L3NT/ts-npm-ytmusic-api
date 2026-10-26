import { describe, expect, it } from "bun:test"
import { PlayerError } from "../../index"
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
} from "../../types"
import * as responses from "../fixtures/responses"
import real from "../fixtures/youtube-music.json"
import { setup } from "./client"

describe("Search API", () => {
	it.each([
		["searchSongs", responses.songItem, SongDetailed, "SONG"],
		["searchVideos", responses.videoItem, VideoDetailed, "VIDEO"],
		["searchArtists", responses.artistItem, ArtistDetailed, "ARTIST"],
		["searchAlbums", responses.albumItem, AlbumDetailed, "ALBUM"],
		["searchPlaylists", responses.playlistItem, PlaylistDetailed, "PLAYLIST"],
	] as const)(
		"%s returns typed results and sends the filter",
		async (method, item, schema, type) => {
			const { api, adapter } = await setup(responses.searchResponse(item))
			const result = await api[method]("A search & its symbols")
			expect(result).toHaveLength(1)
			expect(schema.array().safeParse(result).success).toBe(true)
			expect(result[0]).toMatchObject({ type })
			const request = JSON.parse(adapter.mock.calls[1]![0].data)
			expect(request.query).toBe("A search & its symbols")
			expect(request.params).toMatch(/^Eg-/)
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

	it("returns every supported kind in a mixed search and omits unknown items", async () => {
		const { api } = await setup(
			responses.searchResponse(
				responses.songItem,
				responses.videoItem,
				responses.artistItem,
				responses.albumItem,
				responses.playlistItem,
				{},
			),
		)
		const results = await api.search("example")
		expect(results.map(result => result.type)).toEqual([
			"SONG",
			"VIDEO",
			"ARTIST",
			"ALBUM",
			"PLAYLIST",
		])
		expect(SearchResult.array().safeParse(results).success).toBe(true)
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
		(["getSong", "getVideo", "getLyrics", "getUpNexts"] as const).map(
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

describe("Lyrics API", () => {
	const next = {
		contents: {
			tabs: [
				{ tabRenderer: {} },
				{ tabRenderer: { endpoint: { browseEndpoint: { browseId: "lyrics-page" } } } },
			],
		},
	}

	it("joins text runs and normalizes line endings", async () => {
		const { api, adapter } = await setup(next, {
			description: { runs: [{ text: "First line\r\n" }, { text: "\nSecond line\n" }] },
		})
		expect(await api.getLyrics(responses.videoId)).toEqual(["First line", "Second line"])
		expect(JSON.parse(adapter.mock.calls[2]![0].data).browseId).toBe("lyrics-page")
	})

	it("returns null without a browse request when lyrics are unavailable", async () => {
		const { api, adapter } = await setup({
			tabs: [{ tabRenderer: {} }, { tabRenderer: { unselectable: true } }],
		})
		expect(await api.getLyrics(responses.videoId)).toBeNull()
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("returns null for an empty lyrics page", async () => {
		const { api } = await setup(next, {})
		expect(await api.getLyrics(responses.videoId)).toBeNull()
	})
})

describe("Browse API", () => {
	it("returns album details with song metadata, artist, and artwork", async () => {
		const { api } = await setup(responses.albumResponse)
		const album = await api.getAlbum(responses.albumId)
		expect(AlbumFull.safeParse(album).success).toBe(true)
		expect(album).toMatchObject({
			...responses.albumBasic,
			artist: responses.artistBasic,
			year: 2024,
			playlistId: responses.playlistId,
		})
		expect(album.songs).toEqual([
			{
				type: "SONG",
				videoId: responses.videoId,
				name: "Example Song",
				artist: responses.artistBasic,
				album: responses.albumBasic,
				duration: 230,
				thumbnails: responses.thumbnails,
			},
		])
	})

	it("returns an artist with each supported kind of related content", async () => {
		const { api } = await setup(responses.artistResponse)
		const artist = await api.getArtist(responses.artistId)
		expect(ArtistFull.safeParse(artist).success).toBe(true)
		for (const field of [
			"topSongs",
			"topAlbums",
			"topSingles",
			"topVideos",
			"featuredOn",
			"similarArtists",
		] as const)
			expect(artist[field]).toHaveLength(1)
		expect(artist).toMatchObject(responses.artistBasic)
	})

	it("returns empty related lists for an artist without shelves", async () => {
		const { api } = await setup({ header: responses.artistResponse.header })
		const artist = await api.getArtist(responses.artistId)
		expect(ArtistFull.safeParse(artist).success).toBe(true)
		expect(artist.topSongs).toEqual([])
		expect(artist.topAlbums).toEqual([])
		expect(artist.similarArtists).toEqual([])
	})

	it("retrieves artist albums using the browse endpoint", async () => {
		const { api, adapter } = await setup(responses.artistResponse, {
			header: { runs: [{ text: responses.artistBasic.name }] },
			contents: [{ musicTwoRowItemRenderer: responses.albumRow }],
		})
		const albums = await api.getArtistAlbums(responses.artistId)
		expect(AlbumDetailed.array().safeParse(albums).success).toBe(true)
		expect(albums[0]).toMatchObject({
			...responses.albumBasic,
			artist: responses.artistBasic,
			year: 2024,
		})
		expect(JSON.parse(adapter.mock.calls[2]![0].data)).toMatchObject({
			browseId: "artist-albums",
			params: "albums",
		})
	})

	it.each((["getArtistSongs", "getArtistAlbums"] as const).map(method => [method] as const))(
		"%s returns an empty list when its browse link is absent",
		async method => {
			const { api, adapter } = await setup({ header: responses.artistResponse.header })
			expect(await api[method](responses.artistId)).toEqual([])
			expect(adapter).toHaveBeenCalledTimes(2)
		},
	)

	it.each(["PLfixtureplaylist", "OLAK5uy_fixture", "VLPLfixtureplaylist"])(
		"normalizes playlist ID %s",
		async id => {
			const { api, adapter } = await setup(responses.playlistResponse)
			const playlist = await api.getPlaylist(id)
			expect(PlaylistFull.safeParse(playlist).success).toBe(true)
			expect(playlist.artist).toEqual(responses.artistBasic)
			expect(JSON.parse(adapter.mock.calls[1]![0].data).browseId).toBe(
				id.startsWith("VL") ? id : `VL${id}`,
			)
		},
	)
})

describe("Pagination API", () => {
	it("parses a captured queue through the HTTP adapter and requests a persistent panel", async () => {
		const { api, adapter } = await setup(real.next)
		const songs = await api.getUpNexts("mGsOHanQwxk")
		expect(songs.map(song => song.videoId)).toEqual(["4eX9JOyM2VA", "eGd6FzzTg1M"])
		expect(songs[0]).toMatchObject({ duration: 230, artists: { name: "Mariah Deborah" } })
		expect(JSON.parse(adapter.mock.calls[1]![0].data)).toMatchObject({
			videoId: "mGsOHanQwxk",
			enablePersistentPlaylistPanel: true,
		})
	})

	it("returns every artist song in order across both continuation formats", async () => {
		const second = { ...responses.songItem, playlistItemData: { videoId: "4eX9JOyM2VA" } }
		const { api, adapter } = await setup(
			responses.artistResponse,
			{
				...responses.searchResponse(responses.songItem),
				continuations: [{ nextContinuationData: { continuation: "page-two" } }],
			},
			{
				...responses.searchResponse(second),
				continuationItemRenderer: {
					continuationEndpoint: { continuationCommand: { token: "page-three" } },
				},
			},
			responses.searchResponse(responses.songItem),
		)
		const songs = await api.getArtistSongs(responses.artistId)
		expect(songs.map(song => song.videoId)).toEqual([
			responses.videoId,
			"4eX9JOyM2VA",
			responses.videoId,
		])
		expect(SongDetailed.array().safeParse(songs).success).toBe(true)
		expect(
			adapter.mock.calls
				.slice(3)
				.map(([request]) =>
					new URL(request.url!, request.baseURL).searchParams.get("continuation"),
				),
		).toEqual(["page-two", "page-three"])
	})

	it("returns playlist pages in order and omits unavailable videos", async () => {
		const { api, adapter } = await setup(
			{
				...responses.playlistResponse,
				continuations: [{ nextContinuationData: { continuation: "next" } }],
			},
			responses.searchResponse({}, responses.songItem),
		)
		const videos = await api.getPlaylistVideos(responses.playlistId)
		expect(VideoDetailed.array().safeParse(videos).success).toBe(true)
		expect(videos.map(video => video.videoId)).toEqual([responses.videoId, responses.videoId])
		expect(adapter).toHaveBeenCalledTimes(3)
	})

	it.each(
		(["getArtistSongs", "getPlaylistVideos", "getHomeSections"] as const).map(
			method => [method] as const,
		),
	)("%s rejects a repeated continuation token instead of looping", async method => {
		const repeated = {
			continuations: [{ nextContinuationData: { continuation: "same-token" } }],
		}
		const pages =
			method === "getArtistSongs"
				? [responses.artistResponse, repeated, repeated]
				: [repeated, repeated]
		const { api, adapter } = await setup(...pages)
		await expect(api[method](responses.artistId)).rejects.toThrow("Repeated continuation token")
		expect(adapter).toHaveBeenCalledTimes(pages.length + 1)
	})

	it("returns captured home content through the real request and parsing path", async () => {
		const { api } = await setup(real.home)
		const sections = await api.getHomeSections()
		expect(sections).toHaveLength(1)
		expect(sections[0]?.contents[0]).toMatchObject({
			type: "SONG",
			videoId: "mGsOHanQwxk",
			name: "Na Para Bang",
		})
	})
})
