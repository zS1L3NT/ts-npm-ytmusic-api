import Validator from "validate-any/build/classes/Validator"
import YTMusic from "../YTMusic"
import {
	ALBUM_DETAILED,
	ARTIST_DETAILED,
	PLAYLIST_DETAILED,
	SONG_DETAILED,
	VIDEO_DETAILED
} from "./interfaces"
import { LIST, validate } from "validate-any"

const ytmusic = new YTMusic()
const tests: (query: string) => [() => Promise<any>, Validator<any>][] = query => [
	[() => ytmusic.search(query, "SONG"), LIST(SONG_DETAILED)],
	[() => ytmusic.search(query, "VIDEO"), LIST(VIDEO_DETAILED)],
	[() => ytmusic.search(query, "ARTIST"), LIST(ARTIST_DETAILED)],
	[() => ytmusic.search(query, "ALBUM"), LIST(ALBUM_DETAILED)],
	[() => ytmusic.search(query, "PLAYLIST"), LIST(PLAYLIST_DETAILED)],
	[
		() => ytmusic.search(query),
		LIST(ALBUM_DETAILED, ARTIST_DETAILED, PLAYLIST_DETAILED, SONG_DETAILED, VIDEO_DETAILED)
	]
]

const queries = ["Lilac", "Weekend", "Yours Raiden", "Eminem"]

ytmusic.initialize().then(async () => {
	queries.forEach(query => {
		tests(query).forEach(async ([fetch, validator]) => {
			const value = await fetch()
			const result = validate(value, validator)
			if (!result.success) {
				console.log(JSON.stringify(value))
				console.log(validator.formatSchema())
				console.log(result.errors)
				process.exit(0)
			}
		})
	})
})
