import Validator from "validate-any/build/classes/Validator"
import YTMusic from "../YTMusic"
import {
	ALBUM_DETAILED,
	ARTIST_DETAILED,
	ARTIST_FULL,
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
	],
	[() => ytmusic.getArtist("UCUCF7BJBzLcu_6qvgSBk7dA"), ARTIST_FULL],
	[() => ytmusic.getArtist("UCTUR0sVEkD8T5MlSHqgaI_Q"), ARTIST_FULL],
	[() => ytmusic.getArtistSongs("UCUCF7BJBzLcu_6qvgSBk7dA"), LIST(SONG_DETAILED)],
	[() => ytmusic.getArtistSongs("UCTUR0sVEkD8T5MlSHqgaI_Q"), LIST(SONG_DETAILED)],
	[() => ytmusic.getArtistAlbums("UCUCF7BJBzLcu_6qvgSBk7dA"), LIST(ALBUM_DETAILED)],
	[() => ytmusic.getArtistAlbums("UCTUR0sVEkD8T5MlSHqgaI_Q"), LIST(ALBUM_DETAILED)]
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
