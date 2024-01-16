import { arrayOf, Problem, Type } from "arktype"
import { equal, ok } from "assert"
import { afterAll, beforeEach, describe, it } from "bun:test"

import { HomePageContent } from "../@types/types"
import { FE_MUSIC_HOME } from "../constants"
import YTMusic from "../YTMusic"

const errors: Problem[] = []
const configs = [
	{ GL: "RU", HL: "ru" },
	{ GL: "US", HL: "en" },
	{ GL: "DE", HL: "de" },
]
const expect = (data: any, type: Type) => {
	const result = type(data)
	if (result.problems?.length) {
		errors.push(...result.problems!)
	} else {
		const empty = JSON.stringify(result.data).match(/"\w+":""/g)
		if (empty) {
			console.log(result.data, empty)
		}
		equal(empty, null)
	}
	equal(result.problems, undefined)
}

const ytmusic = new YTMusic()
beforeEach(() => {
	const index = 0
	return ytmusic.initialize(configs[index])
})

describe(`Query: ${FE_MUSIC_HOME}`, () => {
	configs.forEach(config => {
		it(`Get ${config.GL} ${config.HL}`, async () => {
			const homePageContents = await ytmusic.getHome()
			ok(homePageContents.length)
			expect(homePageContents, arrayOf(HomePageContent))
			console.log("Length: ", homePageContents.length)
		})
	})
})

afterAll(() => console.log("Issues:", errors))
