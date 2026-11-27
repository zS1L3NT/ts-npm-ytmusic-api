import { beforeEach, describe, it } from "bun:test"
import { equal, ok } from "assert"
import { z } from "zod"

import YTMusic from "../../YTMusic"
import { FE_MUSIC_HOME } from "../../constants"
import { HomeSection } from "../../types"
import expect from "./expect"

const configs = [
	{ GL: "RU", HL: "ru" },
	{ GL: "US", HL: "en" },
	{ GL: "DE", HL: "de" },
]

let index = 0
const ytmusic = new YTMusic()
beforeEach(() => {
	return ytmusic.initialize(configs[index++])
})

describe(`Query: ${FE_MUSIC_HOME}`, () => {
	configs.forEach(config => {
		it(`Get ${config.GL} ${config.HL}`, async () => {
			const sections = await ytmusic.getHomeSections()
			ok(sections.length > 0, "Expected at least one home section")
			ok(
				sections.every(section => section.contents.length > 0),
				"Expected every home section to have contents",
			)
			expect(sections, z.array(HomeSection))
		})
	})

	it("Get the home sections page by page", async () => {
		const first = await ytmusic.getHomeSectionsPage({ limit: 2 })
		const next = await ytmusic.getHomeSectionsPage({ limit: 2, cursor: first.cursor })
		equal(first.items.length, 2)
		ok(next.items.length > 0, "Expected a second page of home sections")
		expect([...first.items, ...next.items], z.array(HomeSection))
	})
})
