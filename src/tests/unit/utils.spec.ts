import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import { z } from "zod"
import Parser from "../../parsers/Parser"
import checkType from "../../utils/checkType"
import { isAlbum, isArtist, isDuration, isTitle } from "../../utils/filters"
import { traverse, traverseList, traverseString } from "../../utils/traverse"
import { albumRun, artistRun, titleRun } from "../fixtures/responses"

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

describe("Metadata helpers", () => {
	it.each([
		["3:50", 230],
		["1:02:03", 3723],
		["0:00", 0],
		["90:00", 5400],
		["", null],
	] as const)("parses duration %s", (time, seconds) => {
		expect(Parser.parseDuration(time)).toBe(seconds)
	})

	it.each([
		["123", 123],
		["1.5K", 1500],
		["2M", 2000000],
		["3B", 3000000000],
		["4T", 4000000000000],
	] as const)("parses count %s", (text, number) => {
		expect(Parser.parseNumber(text)).toBe(number)
	})

	it("identifies artist, album, title, and duration runs without mixing them", () => {
		expect(isArtist(artistRun)).toBe(true)
		expect(isArtist(albumRun)).toBe(false)
		expect(isAlbum(albumRun)).toBe(true)
		expect(isAlbum(titleRun)).toBe(false)
		expect(isTitle(titleRun)).toBe(true)
		expect(isTitle(artistRun)).toBe(false)
		expect(isDuration({ text: "3:50" })).toBeTruthy()
		expect(isDuration({ text: "Example Artist" })).toBeFalsy()
	})
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
