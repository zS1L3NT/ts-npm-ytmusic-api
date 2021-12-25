import Validator from "validate-any/build/classes/Validator"
import YTMusic from "../YTMusic"
import {
	ALBUM_DETAILED,
	ALBUM_FULL,
	ARTIST_DETAILED,
	ARTIST_FULL,
	PLAYLIST_DETAILED,
	SONG_DETAILED,
	VIDEO_DETAILED
} from "./interfaces"
import { LIST, validate } from "validate-any"

const queries = ["Lilac", "Weekend", "Yours Raiden", "Eminem", "IU"]
const ytmusic = new YTMusic()

ytmusic.initialize().then(() =>
	queries.forEach(async query => {
		const [songs, videos, artists, albums, playlists, results] = await Promise.all([
			ytmusic.search(query, "SONG"),
			ytmusic.search(query, "VIDEO"),
			ytmusic.search(query, "ARTIST"),
			ytmusic.search(query, "ALBUM"),
			ytmusic.search(query, "PLAYLIST"),
			ytmusic.search(query)
		])

		const [artist, artistSongs, artistAlbums, album] = await Promise.all([
			// ytmusic.getSong(songs[0].videoId),
			// ytmusic.getVideo(videos[0].videoId),
			ytmusic.getArtist(artists[0].artistId),
			ytmusic.getArtistSongs(artists[0].artistId),
			ytmusic.getArtistAlbums(artists[0].artistId),
			ytmusic.getAlbum(albums[0].albumId)
			// ytmusic.getPlaylist(playlists[0].playlistId)
		])

		const tests: [any, Validator<any>][] = [
			[songs, LIST(SONG_DETAILED)],
			[videos, LIST(VIDEO_DETAILED)],
			[artists, LIST(ARTIST_DETAILED)],
			[albums, LIST(ALBUM_DETAILED)],
			[playlists, LIST(PLAYLIST_DETAILED)],
			[
				results,
				LIST(
					ALBUM_DETAILED,
					ARTIST_DETAILED,
					PLAYLIST_DETAILED,
					SONG_DETAILED,
					VIDEO_DETAILED
				)
			],
			// [song, SONG_DETAILED],
			// [video, VIDEO_DETAILED],
			[artist, ARTIST_FULL],
			[artistSongs, LIST(SONG_DETAILED)],
			[artistAlbums, LIST(ALBUM_DETAILED)],
			[album, ALBUM_FULL]
			// [playlist, PLAYLIST_DETAILED]
		]

		for (const [value, validator] of tests) {
			const result = validate(value, validator)
			if (!result.success) {
				console.log(JSON.stringify(value))
				console.log(validator.formatSchema())
				console.log(result.errors)
				process.exit(0)
			}
		}

		console.log(`Valid 🎉 - ${query}`)
	})
)
