import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import { z } from "zod"
import Parser from "../../parsers/Parser"
import checkType from "../../utils/checkType"
import { isAlbum, isArtist, isDuration, isExplicit, isYear } from "../../utils/filters"
import { traverse, traverseList, traverseString } from "../../utils/traverse"
import {
	albumRun,
	artistLink,
	artistRun,
	browse,
	listItem,
	separator,
	titleRun,
	twoRow,
	watch,
} from "../fixtures/responses"

afterEach(() => mock.restore())

describe("JSON traversal", () => {
	it.each([null, undefined, 1, "text", false, {}, []].map(data => ({ data })))(
		"returns an empty list for a missing key in %j",
		({ data }) => {
			expect(traverseList(data, "absent")).toEqual([])
			expect(traverseString(data, "absent")).toBe("")
		},
	)

	it("finds matches through nested objects and arrays in document order", () => {
		const data = {
			items: [{ nested: { value: "first" } }, { value: "second" }],
			more: { value: "third" },
		}
		expect(traverseList(data, "value")).toEqual(["first", "second", "third"])
	})

	it("limits each next key to the previously selected subtree", () => {
		expect(
			traverse(
				{ header: { title: { text: "chosen" } }, footer: { text: "unrelated" } },
				"header",
				"title",
				"text",
			),
		).toBe("chosen")
	})

	it("treats only the last position of a repeated key name as terminal", () => {
		const data = { text: "outer", wrap: { text: { text: "inner" } } }
		expect(traverse(data, "text", "text")).toBe("inner")
		expect(traverse(data, "text")).toBe("outer")
	})

	it("preserves zero, false, null, and empty arrays as raw values", () => {
		expect(traverse({ value: 0 }, "value")).toBe(0)
		expect(traverse({ value: false }, "value")).toBe(false)
		expect(traverse({ value: null }, "value")).toBeNull()
		expect(traverseList({ value: [] }, "value")).toEqual([])
	})

	it("normalizes a single object or array to a list", () => {
		expect(traverseList({ value: { text: "single" } }, "value")).toEqual([{ text: "single" }])
		expect(traverseList({ value: ["one", "two"] }, "value")).toEqual(["one", "two"])
	})

	it("returns only strings from traverseString", () => {
		expect(traverseString({ value: 42 }, "value")).toBe("")
		expect(traverseString([{ value: {} }, { value: "actual text" }], "value")).toBe(
			"actual text",
		)
	})
})

describe("Run filters", () => {
	it("identifies artist, album, and duration runs without mixing them", () => {
		expect(isArtist(artistRun)).toBe(true)
		expect(isArtist(artistLink("Creator", "UCcreator"))).toBe(true)
		expect(isArtist(albumRun)).toBe(false)
		expect(isAlbum(albumRun)).toBe(true)
		expect(isAlbum(artistRun)).toBe(false)
		expect(isArtist({ text: "Plain" })).toBe(false)
	})

	it.each([
		["3:50", true],
		["1:02:03", true],
		["12:00:00", true],
		["Example Artist", false],
		["3:5", false],
		["2024", false],
	] as const)("recognizes %s as a duration: %p", (text, expected) => {
		expect(isDuration({ text })).toBe(expected)
	})

	it.each([
		["2024", true],
		["1999", true],
		["20245", false],
		["204", false],
		["Single", false],
		["3:50", false],
	] as const)("recognizes %s as a year: %p", (text, expected) => {
		expect(isYear({ text })).toBe(expected)
	})

	it.each(["badges", "subtitleBadges"])("reads the explicit badge from %s", key => {
		const badge = (iconType: string) => [{ musicInlineBadgeRenderer: { icon: { iconType } } }]
		expect(isExplicit({ [key]: badge("MUSIC_EXPLICIT_BADGE") })).toBe(true)
		expect(isExplicit({ [key]: badge("MUSIC_LIVE_BADGE") })).toBe(false)
	})

	it("is not explicit without a badge", () => {
		expect(isExplicit({})).toBe(false)
		expect(isExplicit(undefined)).toBe(false)
		expect(isExplicit({ title: { runs: [{ text: "MUSIC_EXPLICIT_BADGE" }] } })).toBe(false)
	})
})

describe("Item fields", () => {
	it("reads a list row from its flex and fixed columns", () => {
		const item = {
			...listItem(titleRun, [artistRun]),
			fixedColumns: [
				{
					musicResponsiveListItemFixedColumnRenderer: {
						text: { runs: [{ text: "3:50" }] },
					},
				},
			],
		}
		const fields = Parser.parseFields(item)
		expect(fields.title).toBe(titleRun)
		expect(fields.endpoint).toBe(titleRun.navigationEndpoint)
		expect(fields.segments).toEqual([[artistRun], [{ text: "3:50" }]])
		expect(fields.thumbnails).toHaveLength(1)
	})

	it("reads a card from its title and subtitle, falling back to the item's own endpoint", () => {
		const endpoint = watch("mGsOHanQwxk", "MUSIC_VIDEO_TYPE_OMV")
		const { musicTwoRowItemRenderer: card } = twoRow(
			{ text: "Video" },
			[artistRun, separator, { text: "1M views" }],
			endpoint,
		)
		const fields = Parser.parseFields(card)
		expect(fields.title).toEqual({ text: "Video" })
		expect(fields.endpoint).toBe(endpoint)
		expect(fields.segments).toEqual([[artistRun], [{ text: "1M views" }]])
		expect(fields.thumbnails).toEqual([])
	})

	it("reads a queue entry from its title, byline and length", () => {
		const fields = Parser.parseFields({
			title: { runs: [{ text: "Queued" }] },
			longBylineText: { runs: [artistRun, separator, albumRun] },
			lengthText: { runs: [{ text: "3:50" }] },
			navigationEndpoint: titleRun.navigationEndpoint,
			thumbnail: { thumbnails: [{ url: "https://example.com/a.jpg", width: 1, height: 1 }] },
		})
		expect(fields.title).toEqual({ text: "Queued" })
		expect(fields.endpoint).toBe(titleRun.navigationEndpoint)
		expect(fields.segments).toEqual([[artistRun], [albumRun], [{ text: "3:50" }]])
		expect(fields.thumbnails).toHaveLength(1)
	})

	it("reads an empty item without failing", () => {
		expect(Parser.parseFields({ title: {} })).toEqual({
			title: undefined,
			segments: [],
			endpoint: undefined,
			thumbnails: [],
		})
	})

	it("splits runs into segments at the bullet separator only", () => {
		expect(
			Parser.parseSegments([{ text: "a" }, { text: " & " }, separator, { text: "b" }]),
		).toEqual([[{ text: "a" }, { text: " & " }], [{ text: "b" }]])
		expect(Parser.parseSegments([])).toEqual([[]])
	})

	it.each([
		["a song's audio-track endpoint", watch("mGsOHanQwxk", "MUSIC_VIDEO_TYPE_ATV"), "SONG"],
		["a music video endpoint", watch("mGsOHanQwxk", "MUSIC_VIDEO_TYPE_OMV"), "VIDEO"],
		["an uploaded video endpoint", watch("mGsOHanQwxk", "MUSIC_VIDEO_TYPE_UGC"), "VIDEO"],
		[
			"a track the user uploaded",
			watch("mGsOHanQwxk", "MUSIC_VIDEO_TYPE_PRIVATELY_OWNED_TRACK"),
			"SONG",
		],
		["a podcast episode", watch("mGsOHanQwxk", "MUSIC_VIDEO_TYPE_PODCAST_EPISODE"), null],
		["an untyped watch endpoint", { watchEndpoint: { videoId: "mGsOHanQwxk" } }, "SONG"],
		["a radio", { watchPlaylistEndpoint: { playlistId: "RDradio" } }, "PLAYLIST"],
		["an album page", browse("MPREb_album", "MUSIC_PAGE_TYPE_ALBUM"), "ALBUM"],
		["an artist page", browse("UCartist", "MUSIC_PAGE_TYPE_ARTIST"), "ARTIST"],
		["a playlist page", browse("VLPLplaylist", "MUSIC_PAGE_TYPE_PLAYLIST"), "PLAYLIST"],
		["a podcast show", browse("MPSPPLshow", "MUSIC_PAGE_TYPE_PODCAST_SHOW_DETAIL_PAGE"), null],
		["a profile", browse("UCuser", "MUSIC_PAGE_TYPE_USER_CHANNEL"), null],
		["no endpoint", undefined, null],
	] as const)("detects the type of %s from its endpoint", (_, endpoint, type) => {
		expect(Parser.parseType(endpoint)).toBe(type)
	})
})

describe("Artist parsing", () => {
	const names = (...args: Parameters<typeof Parser.parseArtists>) =>
		Parser.parseArtists(...args).map(artist => artist.name)

	it("returns every linked artist of a segment in order", () => {
		const segments = [[artistLink("Lady Gaga"), { text: " & " }, artistLink("Bruno Mars")]]
		expect(Parser.parseArtists(segments)).toEqual([
			{ artistId: "UCLadyGaga", name: "Lady Gaga" },
			{ artistId: "UCBrunoMars", name: "Bruno Mars" },
		])
	})

	it("treats text padded with spaces as a connector, not a name", () => {
		const segments = [
			[artistLink("A"), { text: ", " }, artistLink("B"), { text: " & " }, artistLink("C")],
		]
		expect(names(segments)).toEqual(["A", "B", "C"])
	})

	it("keeps an unlinked artist next to a linked one", () => {
		const segments = [[artistLink("Linked"), { text: " & " }, { text: "Unlinked" }]]
		expect(Parser.parseArtists(segments)).toEqual([
			{ artistId: "UCLinked", name: "Linked" },
			{ artistId: null, name: "Unlinked" },
		])
	})

	it("returns an artist without a channel with a null ID", () => {
		expect(Parser.parseArtists([[{ text: "Various Artists" }]])).toEqual([
			{ artistId: null, name: "Various Artists" },
		])
	})

	it("returns user channels as artists", () => {
		const creator = {
			text: "Creator",
			navigationEndpoint: browse("UCcreator", "MUSIC_PAGE_TYPE_USER_CHANNEL"),
		}
		expect(Parser.parseArtists([[creator]])).toEqual([
			{ artistId: "UCcreator", name: "Creator" },
		])
	})

	it("skips the leading type label of a labelled item", () => {
		const segments = [[{ text: "Song" }], [{ text: "Plain Artist" }], [{ text: "3:50" }]]
		expect(names(segments)).toEqual(["Song"])
		expect(names(segments, { labelled: true })).toEqual(["Plain Artist"])
		expect(names([[{ text: "Titel" }], [{ text: "Someone" }]], { labelled: true })).toEqual([
			"Someone",
		])
	})

	it("prefers a linked artist over the position of plain text", () => {
		expect(
			names([[{ text: "Song" }], [{ text: "1.2M plays" }], [artistLink("Linked")]]),
		).toEqual(["Linked"])
	})

	it.each([
		["a duration", "3:50"],
		["a year", "2024"],
	])("never returns %s in the artist position", (_, text) => {
		expect(Parser.parseArtists([[{ text }]])).toEqual([])
		expect(Parser.parseArtists([[{ text: "Song" }], [{ text }]], { labelled: true })).toEqual(
			[],
		)
	})

	it("keeps a linked artist named like a year", () => {
		expect(
			Parser.parseArtists([[artistLink("1975"), { text: " & " }, { text: "2020" }]]),
		).toEqual([{ artistId: "UC1975", name: "1975" }])
	})

	it("falls back to the given artists when the item names nobody", () => {
		const artists = [{ artistId: "UCfallback", name: "Fallback" }]
		expect(Parser.parseArtists([], { artists })).toEqual(artists)
		expect(Parser.parseArtists([[]], { artists })).toEqual(artists)
		expect(
			Parser.parseArtists([[{ text: "Song" }], [{ text: "3:50" }]], {
				artists,
				labelled: true,
			}),
		).toEqual(artists)
		expect(Parser.parseArtists([[]])).toEqual([])
	})

	it("does not read plain text as an artist when fallback artists are given", () => {
		const artists = [{ artistId: "UCfallback", name: "Fallback" }]
		expect(Parser.parseArtists([[{ text: "12M plays" }]], { artists })).toEqual(artists)
		expect(names([[artistLink("Named")]], { artists })).toEqual(["Named"])
	})

	it("finds the album and the year among all segments", () => {
		const segments = [[{ text: "Song" }], [artistRun], [albumRun], [{ text: "2024" }]]
		expect(Parser.parseAlbum(segments)).toEqual({
			albumId: "MPREb_fixturealbum",
			name: "Example Album",
		})
		expect(Parser.parseAlbum([[artistRun]])).toBeNull()
		expect(Parser.parseYear(segments)).toBe(2024)
		expect(Parser.parseYear([[artistRun]])).toBeNull()
	})
})

describe("Metadata helpers", () => {
	it.each([
		["3:50", 230],
		["1:02:03", 3723],
		["0:00", 0],
		["90:00", 5400],
		["", null],
		[undefined, null],
	] as const)("parses duration %s", (time, seconds) => {
		expect(Parser.parseDuration(time as string)).toBe(seconds)
	})

	it("reads a row continuation but not a section continuation", () => {
		const data = {
			continuationItemRenderer: {
				continuationEndpoint: { continuationCommand: { token: "next-rows" } },
			},
			continuations: [{ nextContinuationData: { continuation: "next-section" } }],
		}
		expect(Parser.parseItemContinuation(data)).toBe("next-rows")
		expect(Parser.parseSectionContinuation(data)).toBe("next-section")
	})

	it.each([{}, { reloadContinuationData: { continuation: "reload" } }, null])(
		"finds no continuation in %j",
		data => {
			expect(Parser.parseItemContinuation(data)).toBe("")
			expect(Parser.parseSectionContinuation(data)).toBe("")
		},
	)
})

describe("Schema diagnostics", () => {
	it("returns valid data without emitting diagnostics", () => {
		const log = spyOn(console, "error").mockImplementation(() => undefined)
		const data = { name: "valid" }
		expect(checkType(data, z.object({ name: z.string() }))).toBe(data)
		expect(log).not.toHaveBeenCalled()
	})

	it("reports invalid data without replacing the returned object", () => {
		const log = spyOn(console, "error").mockImplementation(() => undefined)
		const data = { name: 42 }
		expect(checkType(data, z.object({ name: z.number().min(100) }))).toBe(data)
		expect(log).toHaveBeenCalledTimes(1)
		const diagnostic = JSON.parse(log.mock.calls[0]![1] as string)
		expect(diagnostic.error.issues[0].path).toEqual(["name"])
	})
})

describe("Thumbnails", () => {
	const image = (url: string, width: number, height = width) => ({ url, width, height })

	it.each([
		["lh3.googleusercontent.com", "w60-h60-l90-rj"],
		["yt3.googleusercontent.com", "s60-c-k-c0x00ffffff-no-rj"],
	])("offers a large size of an image on %s after the listed ones", (host, suffix) => {
		const thumbnails = [image(`https://${host}/cover=${suffix}`, 60)]
		const result = Parser.parseThumbnails({ thumbnails })
		expect(result).toEqual([...thumbnails, image(`https://${host}/cover=w1200-h1200`, 1200)])
		expect(thumbnails).toHaveLength(1)
	})

	it("keeps the shape of the largest listed image", () => {
		const host = "https://yt3.googleusercontent.com"
		const result = Parser.parseThumbnails({
			thumbnails: [
				image(`${host}/wide=w200-h100`, 200, 100),
				image(`${host}/wide=w100-h50`, 100, 50),
			],
		})
		expect(result[2]).toEqual(image(`${host}/wide=w1200-h600`, 1200, 600))
	})

	it.each(
		[
			[],
			[image("https://example.com/cover=w60", 60)],
			[image("https://yt3.googleusercontent.com/unknown", 60)],
			[image("https://yt3.googleusercontent.com/cover=w1600-h1600", 1600)],
			[image("https://yt3.googleusercontent.com/cover=w0", 0)],
			[image("https://i.ytimg.com/vi/example/hqdefault.jpg", 480, 360)],
		].map(thumbnails => [thumbnails] as const),
	)("adds nothing when no larger size can be requested: %j", thumbnails => {
		expect(Parser.parseThumbnails({ thumbnails })).toEqual(thumbnails)
	})
})
