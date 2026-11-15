import { afterAll } from "bun:test"
import { equal } from "assert"
import { ZodError, ZodType } from "zod"

const errors: ZodError[] = []
afterAll(() => console.log("Issues:", errors))

export default (data: any, type: ZodType) => {
	const result = type.safeParse(data)

	if (!result.error) {
		const empty = JSON.stringify(result.data, (_key, value) => {
			// Playlists made by YouTube Music itself have no creator.
			if (
				value?.type === "PLAYLIST" &&
				value.artist.artistId === null &&
				value.artist.name === ""
			) {
				return { ...value, artist: null }
			}
			// Audiobooks are albums that cannot be played as a playlist.
			if (value?.type === "ALBUM" && value.playlistId === "") {
				return { ...value, playlistId: null }
			}
			return value
		}).match(/"\w+":""/g)
		if (empty) {
			console.log(result.data, empty)
		}
		equal(empty, null)
	}

	equal(result.error, undefined)
}
