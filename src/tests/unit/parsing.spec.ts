import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"

import AlbumParser from "../../parsers/AlbumParser"
import ArtistParser from "../../parsers/ArtistParser"
import HomeSectionParser from "../../parsers/HomeSectionParser"
import LyricsParser from "../../parsers/LyricsParser"
import PlaylistParser from "../../parsers/PlaylistParser"
import SearchParser from "../../parsers/SearchParser"
import SongParser from "../../parsers/SongParser"
import VideoParser from "../../parsers/VideoParser"
import { HomeSection, SearchResult, TimedLyric } from "../../types"
import { traverseList } from "../../utils/traverse"
import * as responses from "../fixtures/responses"
import real from "../fixtures/youtube-music.json"

const { artistLink, artistRun, albumRun, card, listItem, section, sections, separator, titleRun } =
	responses
const weeknd = { artistId: "UClYV6hHlupm_S_ObS1W-DYw", name: "The Weeknd" }
const badge = (iconType: string) => [{ musicInlineBadgeRenderer: { icon: { iconType } } }]
const unnamed = { artistId: null, name: "" }

afterEach(() => mock.restore())

describe("General search parsing", () => {
	const results = SearchParser.parse(real.search)

	it("returns the top result first, then every supported row, as typed results", () => {
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
		expect(results[0]).toMatchObject({ ...weeknd, type: "ARTIST" })
	})

	it("gives songs inside an artist card that artist, and leaves album unknown", () => {
		expect(results[1]).toMatchObject({
			videoId: "3QZOazpGIQc",
			name: "Hong Kong (feat. 王菲季候風)",
			artist: weeknd,
			artists: [weeknd],
			album: null,
			duration: 217,
		})
		expect(results[2]).toMatchObject({ name: "Blinding Lights", artists: [weeknd] })
	})

	it("returns every artist of a row in order, across ', ' and ' & ' connectors", () => {
		expect(results[3]).toMatchObject({ name: "One Of The Girls", album: null })
		expect((results[3] as { artists: unknown[] }).artists).toEqual([
			weeknd,
			{ artistId: "UCAl7xQ6q0PEgZMQD7zr4AKQ", name: "JENNIE" },
			{ artistId: "UChGTI8sivCDh1AWues5lrDA", name: "Lily Rose Depp" },
		])
	})

	it("detects the type from the endpoint and skips the label for the artist", () => {
		expect(results[6]).toMatchObject({
			type: "ALBUM",
			name: "Weekend",
			artist: { artistId: "UC1F_z9eS5tNT1-EXUyJzj0A", name: "wtfstro" },
			year: 2026,
		})
		expect(results[7]).toMatchObject({
			type: "PLAYLIST",
			artist: { artistId: "UCyqGc_I1NKnm4ReNmThF7lw", name: "무진" },
		})
	})

	it("omits podcast shows, episodes and profiles", () => {
		const names = results.map(result => result.name)
		expect(names.some(name => /Just Disappear|Podcast|@/.test(name))).toBe(false)
		expect(
			traverseList(real.search, "musicResponsiveListItemRenderer").map(
				item => SearchParser.parseItem(item) === null,
			),
		).toContain(true)
	})

	it("does not give rows outside the card the card's artist", () => {
		const song = listItem(titleRun, [{ text: "Song" }, separator, { text: "3:50" }])
		const [inside, outside] = SearchParser.parse(
			sections(
				card(artistLink("Card Artist", "UCcard"), [{ text: "Artist" }], song),
				section(structuredClone(song)),
			),
		).slice(1)
		expect(inside).toMatchObject({ artists: [{ artistId: "UCcard", name: "Card Artist" }] })
		expect(outside).toMatchObject({ artist: unnamed, artists: [] })
	})

	it("only shares a card's artist when the card is an artist", () => {
		const song = listItem(titleRun, [{ text: "Song" }, separator, { text: "3:50" }])
		const top = card(
			albumRun,
			[{ text: "Album" }, separator, artistRun, separator, { text: "2024" }],
			song,
		)
		const [album, inside] = SearchParser.parse(sections(top))
		expect(album).toMatchObject({ type: "ALBUM", artist: responses.artistBasic, year: 2024 })
		expect(inside).toMatchObject({ type: "SONG", artists: [] })
	})

	it("parses rows labelled in another language", () => {
		const video = {
			...listItem(
				{
					...titleRun,
					navigationEndpoint: responses.watch("mGsOHanQwxk", "MUSIC_VIDEO_TYPE_OMV"),
				},
				[
					{ text: "Vidéo" },
					separator,
					{ text: "Plain Artist" },
					separator,
					{ text: "1:02:03" },
				],
			),
		}
		const song = listItem(titleRun, [{ text: "Titel" }, separator, { text: "Someone" }])
		expect(SearchParser.parse(sections(section(video), section(song)))).toMatchObject([
			{ type: "VIDEO", artist: { artistId: null, name: "Plain Artist" }, duration: 3723 },
			{ type: "SONG", artist: { artistId: null, name: "Someone" } },
		])
	})

	it("returns nothing for a response without results", () => {
		expect(SearchParser.parse({})).toEqual([])
	})
})

describe("Song parsing", () => {
	const [gaga, laufey] = traverseList(real.searchSongs, "musicResponsiveListItemRenderer")

	it("reads the artists, album, duration and explicit flag of a search row", () => {
		expect(SongParser.parseItem(gaga)).toMatchObject({
			videoId: "DlFXDl_ROAM",
			name: "Die With A Smile",
			artist: { artistId: "UCGKXb1syicud01CJOOFRykg", name: "Lady Gaga" },
			artists: [
				{ artistId: "UCGKXb1syicud01CJOOFRykg", name: "Lady Gaga" },
				{ artistId: "UCZn4r7heNOPY-C43YIywnVA", name: "Bruno Mars" },
			],
			album: { albumId: "MPREb_fdn3rDTkRH3", name: "MAYHEM" },
			duration: 252,
			explicit: false,
		})
		expect(SongParser.parseItem(laufey).explicit).toBe(true)
	})

	it("is explicit only with the explicit badge", () => {
		const item = (badges?: unknown) => ({ ...responses.songItem, badges })
		expect(SongParser.parseItem(item(badge("MUSIC_EXPLICIT_BADGE"))).explicit).toBe(true)
		expect(SongParser.parseItem(item(badge("MUSIC_LIVE_BADGE"))).explicit).toBe(false)
		expect(SongParser.parseItem(item()).explicit).toBe(false)
	})

	it("uses the given artists, album and thumbnails only when the item has none", () => {
		const defaults = {
			artists: [{ artistId: "UCdefault", name: "Default" }],
			album: { albumId: "MPREb_default", name: "Default Album" },
			thumbnails: [{ url: "https://example.com/default.jpg", width: 1, height: 1 }],
		}
		const bare = {
			flexColumns: [
				{ musicResponsiveListItemFlexColumnRenderer: { text: { runs: [titleRun] } } },
			],
		}
		expect(SongParser.parseItem(bare, defaults)).toMatchObject({
			...defaults,
			artist: defaults.artists[0],
		})
		expect(SongParser.parseItem(bare)).toMatchObject({
			artist: unnamed,
			artists: [],
			album: null,
			duration: null,
			thumbnails: [],
		})
		expect(SongParser.parseItem(responses.songItem, defaults)).toMatchObject({
			artists: [responses.artistBasic],
			album: responses.albumBasic,
			thumbnails: responses.thumbnails,
		})
	})

	it("reads the video ID from the endpoint or the item's own data", () => {
		const columns = [
			{
				musicResponsiveListItemFlexColumnRenderer: {
					text: { runs: [{ text: "Untitled" }] },
				},
			},
		]
		expect(
			SongParser.parseItem({
				flexColumns: columns,
				playlistItemData: { videoId: "mGsOHanQwxk" },
			}).videoId,
		).toBe("mGsOHanQwxk")
		expect(SongParser.parseItem({ flexColumns: columns }).videoId).toBe("")
	})

	it("reads queue entries with the same shape as other songs", () => {
		const entries = traverseList(real.next, "playlistPanelVideoRenderer")
		expect(entries.map(entry => SongParser.parseItem(entry))).toMatchObject([
			{
				videoId: "3QZOazpGIQc",
				name: "Hong Kong (feat. 王菲季候風)",
				artist: weeknd,
				album: { albumId: "MPREb_5qHogi2HE7p", name: "Hong Kong (feat. 王菲季候風)" },
				duration: 217,
			},
			{
				videoId: "2yqYAsUpdSc",
				name: "Out of Time",
				album: { name: "Dawn FM" },
				duration: 215,
			},
			{ artists: [{ artistId: "UCnAmvOfJxmcMd5q48BEIuPQ", name: "王菲" }], duration: 277 },
		])
	})
})

describe("Video parsing", () => {
	it("reads a typed search row", () => {
		const [item] = traverseList(real.searchVideos, "musicResponsiveListItemRenderer")
		expect(VideoParser.parseItem(item)).toMatchObject({
			videoId: "hX9S94XsySk",
			artist: weeknd,
			artists: [weeknd],
			duration: 223,
		})
	})

	it("uses the endpoint ID even when the thumbnail is missing", () => {
		expect(
			VideoParser.parseItem({
				playNavigationEndpoint: responses.watch("mGsOHanQwxk"),
				...listItem(titleRun),
			}).videoId,
		).toBe("mGsOHanQwxk")
	})

	it("uses the item's own video data before the thumbnail", () => {
		const item = {
			...listItem({ text: "Untitled" }),
			playlistItemData: { videoId: "mGsOHanQwxk" },
			thumbnail: {
				thumbnails: [
					{
						url: "https://i.ytimg.com/vi/aaaaaaaaaaa/hqdefault.jpg",
						width: 1,
						height: 1,
					},
				],
			},
		}
		expect(VideoParser.parseItem(item).videoId).toBe("mGsOHanQwxk")
	})

	it.each([
		["https://i.ytimg.com/vi/mGsOHanQwxk/hqdefault.jpg?sqp=abc", "mGsOHanQwxk"],
		["https://i.ytimg.com/vi_webp/mGsOHanQwxk/hqdefault.webp", "mGsOHanQwxk"],
		["https://i.ytimg.com/vi/short/hqdefault.jpg", ""],
		["https://example.com/vi/mGsOHanQwxk/hqdefault.jpg", ""],
	])("extracts the video ID from the thumbnail URL %s", (url, videoId) => {
		const item = {
			...listItem({ text: "Unavailable" }),
			thumbnail: { thumbnails: [{ url, width: 1, height: 1 }] },
		}
		expect(VideoParser.parseItem(item).videoId).toBe(videoId)
	})

	it("returns no video ID for an item without thumbnails or endpoints", () => {
		expect(VideoParser.parseItem({ flexColumns: [] }).videoId).toBe("")
	})
})

describe("Album parsing", () => {
	it("reads the playlist ID wherever the play button sits", () => {
		const item = (overrides: object) => ({
			...responses.albumItem,
			overlay: undefined,
			...overrides,
		})
		for (const overrides of [
			{ overlay: { playlistId: "PLa" } },
			{ thumbnailOverlay: { playlistId: "PLa" } },
			{ buttons: [{ musicPlayButtonRenderer: { playlistId: "PLa" } }] },
		])
			expect(AlbumParser.parseItem(item(overrides)).playlistId).toBe("PLa")
		expect(AlbumParser.parseItem(item({})).playlistId).toBe("")
	})

	it("skips the type label and uses the given artists when the item names none", () => {
		const [single] = traverseList(real.artistSingles, "musicTwoRowItemRenderer")
		const artists = [{ artistId: "UCwtfstro", name: "wtfstro" }]
		expect(AlbumParser.parseItem(single, { artists })).toMatchObject({
			albumId: "MPREb_CL1trLyE0AA",
			name: "Weekend",
			artist: artists[0],
			artists,
			year: 2026,
		})
		expect(AlbumParser.parseItem(single)).toMatchObject({ artist: unnamed, artists: [] })
	})

	it("gives tracks the album's artists, album and thumbnails unless they name their own", () => {
		const album = AlbumParser.parse(real.album, "MPREb_x")
		const artists = [{ artistId: "UC1F_z9eS5tNT1-EXUyJzj0A", name: "wtfstro" }]
		expect(album).toMatchObject({ name: "Weekend", artist: artists[0], artists, year: 2026 })
		expect(album.songs).toHaveLength(1)
		expect(album.songs[0]).toMatchObject({
			videoId: "MuLW9sWPchQ",
			artists,
			album: { albumId: "MPREb_x", name: "Weekend" },
			duration: 129,
			explicit: true,
			thumbnails: album.thumbnails,
		})

		const various = AlbumParser.parse(real.albumVarious, "MPREb_v")
		expect(various.artists).toEqual([{ artistId: null, name: "Various Artists" }])
		expect(various.songs.map(song => song.artists)).toEqual([
			[{ artistId: "UCksv4FYu55EEkyy5Q1W_yUw", name: "Destiny's Child" }],
			[{ artistId: "UCpJG35xsNdMgxsXn7kqG4Ew", name: "Outkast" }],
		])
		expect(various.songs[0]!.album).toEqual({ albumId: "MPREb_v", name: various.name })
	})
})

describe("Playlist parsing", () => {
	it("reads the creator from the current facepile header", () => {
		expect(PlaylistParser.parse(real.playlist, "xyz")).toMatchObject({
			playlistId: "xyz",
			name: "FNF WEEKEND 1 UPDATE",
			artist: { artistId: null, name: "laik7u7" },
			videoCount: 16,
		})
	})

	it("reads a linked creator from the strapline", () => {
		const data = structuredClone(responses.playlistHeader("2 songs"))
		Object.assign(data.contents.tabs[0]!.musicResponsiveHeaderRenderer, {
			straplineTextOne: { runs: [artistRun] },
		})
		expect(PlaylistParser.parse(data, "xyz").artist).toEqual(responses.artistBasic)
	})

	it.each([
		[["25K views", "292 tracks", "4 weeks"], 292],
		[["49 songs", "3 hours, 8 minutes"], 49],
		[["762 songs"], 762],
		[["1,234 songs", "2 days"], 1234],
		[[], 0],
	])("counts the videos in %j", (facts, videoCount) => {
		expect(PlaylistParser.parse(responses.playlistHeader(...facts), "xyz").videoCount).toBe(
			videoCount,
		)
	})

	it("counts nothing when YouTube Music omits the facts", () => {
		expect(PlaylistParser.parse(real.playlistRD, "xyz")).toMatchObject({
			name: "New Release Mix",
			artist: { artistId: null, name: "YouTube Music" },
			videoCount: 0,
		})
	})

	it("drops the VL prefix of search results and keeps radio IDs", () => {
		const [playlist] = traverseList(real.searchPlaylists, "musicResponsiveListItemRenderer")
		expect(PlaylistParser.parseItem(playlist)).toMatchObject({
			playlistId: "PL_JvlJ9_UYULHWUycuqxH_2QyRnL7XLe-",
			artist: { artistId: "UCiID6heO0n8DfrYnp8j8PPg", name: "laik7u7" },
		})
		const radio = responses.twoRow({ text: "Mix" }, [{ text: "Mix" }], {
			watchPlaylistEndpoint: { playlistId: "RDradio" },
		}).musicTwoRowItemRenderer
		expect(PlaylistParser.parseItem(radio, { labelled: true })).toMatchObject({
			playlistId: "RDradio",
			artist: unnamed,
		})
	})

	it("retains the unknown-creator representation when YouTube omits the creator", () => {
		const item = {
			...listItem({ text: "Anonymous" }, [{ text: "Playlist" }]),
			navigationEndpoint: responses.browse("VLPLanon", "MUSIC_PAGE_TYPE_PLAYLIST"),
		}
		expect(PlaylistParser.parseItem(item, { labelled: true })).toMatchObject({
			playlistId: "PLanon",
			artist: unnamed,
		})
	})
})

describe("Artist parsing", () => {
	const artist = ArtistParser.parse(real.artist, "UCartist")

	it("recognises each shelf by what it holds", () => {
		expect(artist).toMatchObject({ artistId: "UCartist", name: "The Weeknd" })
		expect(artist.topSongs.map(song => song.name)).toEqual([
			"Save Your Tears",
			"Starboy (feat. Daft Punk)",
		])
		expect(artist.topAlbums.map(album => album.name)).toEqual(["Hurry Up Tomorrow"])
		expect(artist.topSingles.map(single => single.name)).toEqual([
			"Hong Kong (feat. 王菲季候風)",
		])
		expect(artist.topVideos.map(video => video.name)).toEqual([
			"Earned It (Fifty Shades Of Grey)",
		])
		expect(artist.featuredOn.map(playlist => playlist.name)).toEqual(["Presenting The Weeknd"])
		expect(artist.similarArtists.map(similar => similar.name)).toEqual(["Khalid"])
	})

	it("ignores the untitled promotional shelf", () => {
		const promo = traverseList(real.artist, "musicCarouselShelfRenderer")[0]
		expect(promo.header).toBeUndefined()
		expect(JSON.stringify(artist)).not.toContain("Watch the new music video")
	})

	it("gives items the artist when the shelf does not name one", () => {
		expect(artist.topAlbums[0]).toMatchObject({
			artists: [{ artistId: "UCartist", name: "The Weeknd" }],
			year: 2025,
		})
		expect(artist.topSingles[0]).toMatchObject({
			artists: [{ artistId: "UCartist", name: "The Weeknd" }],
			year: 2026,
		})
		expect(artist.topVideos[0]).toMatchObject({ artist: weeknd })
		expect(artist.topSongs[0]).toMatchObject({ artist: weeknd, album: { name: "After Hours" } })
	})

	it("tells albums from singles by their subtitle, wherever the shelves are", () => {
		const data = structuredClone(real.artist)
		const contents = traverseList(data, "sectionListRenderer", "contents")
		contents.reverse()
		expect(ArtistParser.parse(data, "UCartist")).toEqual(artist)
	})

	it("returns no albums for an artist with only singles", () => {
		const singles = ArtistParser.parse(real.artistSingles, "UCsingles")
		expect(singles.topAlbums).toEqual([])
		expect(singles.topSingles).toHaveLength(1)
		expect(singles.topSongs).toEqual([])
		expect(singles.topVideos).toEqual([])
		expect(singles.featuredOn).toEqual([])
		expect(singles.similarArtists).toEqual([])
	})

	it("returns empty lists for an artist without shelves", () => {
		const data = { header: real.artist.header }
		expect(ArtistParser.parse(data, "UCartist")).toMatchObject({
			topSongs: [],
			topAlbums: [],
			topSingles: [],
			topVideos: [],
			featuredOn: [],
			similarArtists: [],
		})
	})

	it("reads the request for the page of every album from the Albums shelf title", () => {
		expect(ArtistParser.parseAlbumsEndpoint(real.artist)).toEqual({
			browseId: "MPADUClYV6hHlupm_S_ObS1W-DYw",
			params: expect.any(String),
		})
		expect(ArtistParser.parseAlbumsEndpoint(real.artistSingles)).toBeNull()
		expect(ArtistParser.parseAlbumsEndpoint({})).toBeNull()
	})

	it("reads a search row", () => {
		const [item] = traverseList(real.searchArtists, "musicResponsiveListItemRenderer")
		expect(ArtistParser.parseItem(item)).toMatchObject({ type: "ARTIST", ...weeknd })
	})
})

describe("Home parsing", () => {
	const items = {
		song: traverseList(real.home, "musicResponsiveListItemRenderer")[0],
		video: traverseList(real.artist, "musicTwoRowItemRenderer")[3],
		album: traverseList(real.home, "musicTwoRowItemRenderer")[0],
		playlist: traverseList(real.homeMore, "musicTwoRowItemRenderer")[0],
		artist: traverseList(real.artist, "musicTwoRowItemRenderer").at(-1),
	}
	const unsupported = responses.twoRow(
		{ text: "Show" },
		[{ text: "Podcast" }],
		responses.browse("MPSPPLshow", "MUSIC_PAGE_TYPE_PODCAST_SHOW_DETAIL_PAGE"),
	)

	it("classifies each item of a mixed shelf and omits unsupported ones", () => {
		const shelf = responses.shelf(
			"Mixed recommendations",
			{ musicResponsiveListItemRenderer: items.song },
			{ musicTwoRowItemRenderer: items.video },
			{ musicTwoRowItemRenderer: items.album },
			{ musicTwoRowItemRenderer: items.playlist },
			{ musicTwoRowItemRenderer: items.artist },
			unsupported,
			{ messageRenderer: { text: { runs: [{ text: "Sign in" }] } } },
		).musicCarouselShelfRenderer
		const section = HomeSectionParser.parse(shelf)
		expect(HomeSection.safeParse(section).success).toBe(true)
		expect(section.title).toBe("Mixed recommendations")
		expect(section.contents.map(item => item.type)).toEqual([
			"SONG",
			"VIDEO",
			"ALBUM",
			"PLAYLIST",
			"ARTIST",
		])
	})

	it("recognizes radio playlists", () => {
		const { musicCarouselShelfRenderer: shelf } = responses.shelf(
			"Radio",
			responses.twoRow({ text: "Example radio" }, [{ text: "Example Artist" }], {
				watchPlaylistEndpoint: { playlistId: "RDradio" },
			}),
		)
		expect(HomeSectionParser.parse(shelf).contents).toMatchObject([
			{ type: "PLAYLIST", playlistId: "RDradio", name: "Example radio" },
		])
	})

	it("returns an empty section for a shelf without items", () => {
		expect(HomeSectionParser.parse({})).toEqual({ title: "", contents: [] })
	})
})

describe("Lyrics parsing", () => {
	it("joins the text runs, normalizes line endings and drops blank lines", () => {
		const data = {
			description: {
				runs: [
					{ text: "First line\r\n" },
					{ text: "\nSecond line\n\n" },
					{ text: "Third" },
				],
			},
		}
		expect(LyricsParser.parse(data)).toEqual(["First line", "Second line", "Third"])
	})

	it("returns null for a page without lyrics", () => {
		expect(LyricsParser.parse({})).toBeNull()
		expect(LyricsParser.parse({ description: { runs: [{ text: "\n\r\n" }] } })).toBeNull()
		expect(LyricsParser.parse(null)).toBeNull()
	})

	it("returns timed lines with numeric milliseconds", () => {
		const data = responses.timedLyrics(["First line", 1000, 2500], ["Second line", 2500, 4000])
		const lines = LyricsParser.parseTimed(data)
		expect(lines).toEqual([
			{ text: "First line", startTime: 1000, endTime: 2500 },
			{ text: "Second line", startTime: 2500, endTime: 4000 },
		])
		expect(TimedLyric.array().safeParse(lines).success).toBe(true)
	})

	it("reads only the first timed lyrics model", () => {
		const data = [
			responses.timedLyrics(["Kept", 0, 1]),
			responses.timedLyrics(["Repeated", 0, 1]),
		]
		expect(LyricsParser.parseTimed(data)).toEqual([{ text: "Kept", startTime: 0, endTime: 1 }])
	})

	it("returns null when there are no timed lyrics", () => {
		expect(LyricsParser.parseTimed({})).toBeNull()
		expect(LyricsParser.parseTimed(responses.timedLyrics())).toBeNull()
	})

	it("reports lines without a cue range instead of dropping them", () => {
		const log = spyOn(console, "error").mockImplementation(() => undefined)
		const data = { timedLyricsModel: { timedLyricsData: [{ lyricLine: "No cue" }] } }
		expect(LyricsParser.parseTimed(data)).toMatchObject([
			{ text: "No cue", startTime: Number.NaN },
		])
		expect(log).toHaveBeenCalledTimes(1)
	})
})
