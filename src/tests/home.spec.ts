import { afterAll, beforeEach, describe, it } from "bun:test"
import { equal } from "assert"

import { ZodError, ZodType, z } from "zod"
import YTMusic from "../YTMusic"
import { FE_MUSIC_HOME } from "../constants"
import { HomeSection } from "../types"

const errors: ZodError[] = []
const configs = [
	{ GL: "RU", HL: "ru" },
	{ GL: "US", HL: "en" },
	{ GL: "DE", HL: "de" },
]

const expect = (data: any, type: ZodType) => {
	const result = type.safeParse(data)

	if (result.error) {
		errors.push(result.error)
	} else {
		const empty = JSON.stringify(result.data).match(/"\w+":""/g)
		if (empty) {
			console.log(result.data, empty)
		}
		equal(empty, null)
	}

	equal(result.error, undefined)
}

let index = 0
const ytmusic = new YTMusic()
beforeEach(() => {
	return ytmusic.initialize(configs[index++])
})

describe(`Query: ${FE_MUSIC_HOME}`, () => {
	configs.forEach(config => {
		it(`Get ${config.GL} ${config.HL}`, async () => {
			const sections = await ytmusic.getHomeSections()
			expect(sections, z.array(HomeSection))
		})
	})
})

afterAll(() => console.log("Issues:", errors))
