import Validator from "validate-any/dist/classes/Validator"
import YTMusic from ".."
import {
	ALBUM_DETAILED,
	ALBUM_FULL,
	ARTIST_DETAILED,
	ARTIST_FULL,
	PLAYLIST_FULL,
	PLAYLIST_VIDEO,
	SONG_DETAILED,
	SONG_FULL,
	VIDEO_DETAILED,
	VIDEO_FULL
} from "../interfaces"
import { iValidationError, LIST, STRING, validate } from "validate-any"

const issues: iValidationError[][] = []
const queries = ["Lilac", "Weekend", "Eill", "Eminem", "Lisa Hannigan"]
const _expect = (data: any, validator: Validator<any>) => {
	const { errors } = validate(data, validator)
	if (errors.length > 0) {
		issues.push(errors)
	}

	expect(errors.length).toBe(0)
}

const ytmusic = new YTMusic()

beforeAll(() => ytmusic.initialize())

beforeEach(() => jest.setTimeout(10_000))

queries.forEach(query => {
	describe("Query: " + query, () => {
		test("Search suggestions", done => {
			ytmusic
				.getSearchSuggestions(query)
				.then(suggestions => {
					_expect(suggestions, LIST(STRING()))
					done()
				})
				.catch(done)
		})

		test("Search Songs", done => {
			ytmusic
				.search(query, "SONG")
				.then(songs => {
					_expect(songs, LIST(SONG_DETAILED))
					done()
				})
				.catch(done)
		})

		test("Search Videos", done => {
			ytmusic
				.search(query, "VIDEO")
				.then(videos => {
					_expect(videos, LIST(VIDEO_DETAILED))
					done()
				})
				.catch(done)
		})

		test("Search Artists", done => {
			ytmusic
				.search(query, "ARTIST")
				.then(artists => {
					_expect(artists, LIST(ARTIST_DETAILED))
					done()
				})
				.catch(done)
		})

		test("Search Albums", done => {
			ytmusic
				.search(query, "ALBUM")
				.then(albums => {
					_expect(albums, LIST(ALBUM_DETAILED))
					done()
				})
				.catch(done)
		})

		test("Search Playlists", done => {
			ytmusic
				.search(query, "PLAYLIST")
				.then(playlists => {
					_expect(playlists, LIST(PLAYLIST_FULL))
					done()
				})
				.catch(done)
		})

		test("Search All", done => {
			ytmusic
				.search(query)
				.then(results => {
					_expect(
						results,
						LIST(
							ALBUM_DETAILED,
							ARTIST_DETAILED,
							PLAYLIST_FULL,
							SONG_DETAILED,
							VIDEO_DETAILED
						)
					)
					done()
				})
				.catch(done)
		})

		test("Get details of the first song result", done => {
			ytmusic
				.search(query, "SONG")
				.then(songs => ytmusic.getSong(songs[0]!.videoId!))
				.then(song => {
					_expect(song, SONG_FULL)
					done()
				})
				.catch(done)
		})

		test("Get details of the first video result", done => {
			ytmusic
				.search(query, "VIDEO")
				.then(videos => ytmusic.getVideo(videos[0]!.videoId!))
				.then(video => {
					_expect(video, VIDEO_FULL)
					done()
				})
				.catch(done)
		})

		test("Get details of the first artist result", done => {
			ytmusic
				.search(query, "ARTIST")
				.then(artists => ytmusic.getArtist(artists[0]!.artistId!))
				.then(artist => {
					_expect(artist, ARTIST_FULL)
					done()
				})
				.catch(done)
		})

		test("Get the songs of the first artist result", done => {
			ytmusic
				.search(query, "ARTIST")
				.then(artists => ytmusic.getArtistSongs(artists[0]!.artistId!))
				.then(songs => {
					_expect(songs, LIST(SONG_DETAILED))
					done()
				})
				.catch(done)
		})

		test("Get the albums of the first artist result", done => {
			ytmusic
				.search(query, "ARTIST")
				.then(artists => ytmusic.getArtistAlbums(artists[0]!.artistId!))
				.then(albums => {
					_expect(albums, LIST(ALBUM_DETAILED))
					done()
				})
				.catch(done)
		})

		test("Get details of the first album result", done => {
			ytmusic
				.search(query, "ALBUM")
				.then(albums => ytmusic.getAlbum(albums[0]!.albumId!))
				.then(album => {
					_expect(album, ALBUM_FULL)
					done()
				})
				.catch(done)
		})

		test("Get details of the first playlist result", done => {
			ytmusic
				.search(query, "PLAYLIST")
				.then(playlists => ytmusic.getPlaylist(playlists[0]!.playlistId!))
				.then(playlist => {
					_expect(playlist, PLAYLIST_FULL)
					done()
				})
				.catch(done)
		})

		test("Get the videos of the first playlist result", done => {
			ytmusic
				.search(query, "PLAYLIST")
				.then(playlists => ytmusic.getPlaylistVideos(playlists[0]!.playlistId!))
				.then(videos => {
					_expect(videos, LIST(PLAYLIST_VIDEO))
					done()
				})
				.catch(done)
		})
	})
})

afterAll(() => console.log("Issues:", issues))
