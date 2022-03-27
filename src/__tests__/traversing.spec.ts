import assert from "assert"
import describeParallel from "mocha.parallel"
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
const expect = (data: any, validator: Validator<any>) => {
	const { errors } = validate(data, validator)
	if (errors.length > 0) {
		issues.push(errors)
	}
	assert.equal(errors.length, 0)
}

const ytmusic = new YTMusic()
before(() => ytmusic.initialize())

queries.forEach(query => {
	describeParallel("Query: " + query, () => {
		it("Search suggestions", async () => {
			const suggestions = await ytmusic.getSearchSuggestions(query)
			expect(suggestions, LIST(STRING()))
		})

		it("Search Songs", async () => {
			const songs = await ytmusic.search(query, "SONG")
			expect(songs, LIST(SONG_DETAILED))
		})

		it("Search Videos", async () => {
			const videos = await ytmusic.search(query, "VIDEO")
			expect(videos, LIST(VIDEO_DETAILED))
		})

		it("Search Artists", async () => {
			const artists = await ytmusic.search(query, "ARTIST")
			expect(artists, LIST(ARTIST_DETAILED))
		})

		it("Search Albums", async () => {
			const albums = await ytmusic.search(query, "ALBUM")
			expect(albums, LIST(ALBUM_DETAILED))
		})

		it("Search Playlists", async () => {
			const playlists = await ytmusic.search(query, "PLAYLIST")
			expect(playlists, LIST(PLAYLIST_FULL))
		})

		it("Search All", async () => {
			const results = await ytmusic.search(query)
			expect(
				results,
				LIST(ALBUM_DETAILED, ARTIST_DETAILED, PLAYLIST_FULL, SONG_DETAILED, VIDEO_DETAILED)
			)
		})

		it("Get details of the first song result", async () => {
			const songs = await ytmusic.search(query, "SONG")
			const song = await ytmusic.getSong(songs[0]!.videoId)
			expect(song, SONG_FULL)
		})

		it("Get details of the first video result", async () => {
			const videos = await ytmusic.search(query, "VIDEO")
			const video = await ytmusic.getVideo(videos[0]!.videoId)
			expect(video, VIDEO_FULL)
		})

		it("Get details of the first artist result", async () => {
			const artists = await ytmusic.search(query, "ARTIST")
			const artist = await ytmusic.getArtist(artists[0]!.artistId)
			expect(artist, ARTIST_FULL)
		})

		it("Get the songs of the first artist result", async () => {
			const artists = await ytmusic.search(query, "ARTIST")
			const songs = await ytmusic.getArtistSongs(artists[0]!.artistId)
			expect(songs, LIST(SONG_DETAILED))
		})

		it("Get the albums of the first artist result", async () => {
			const artists = await ytmusic.search(query, "ARTIST")
			const albums = await ytmusic.getArtistAlbums(artists[0]!.artistId)
			expect(albums, LIST(ALBUM_DETAILED))
		})

		it("Get details of the first album result", async () => {
			const albums = await ytmusic.search(query, "ALBUM")
			const album = await ytmusic.getAlbum(albums[0]!.albumId)
			expect(album, ALBUM_FULL)
		})

		it("Get details of the first playlist result", async () => {
			const playlists = await ytmusic.search(query, "PLAYLIST")
			const playlist = await ytmusic.getPlaylist(playlists[0]!.playlistId)
			expect(playlist, PLAYLIST_FULL)
		})

		it("Get the videos of the first playlist result", async () => {
			const playlists = await ytmusic.search(query, "PLAYLIST")
			const videos = await ytmusic.getPlaylistVideos(playlists[0]!.playlistId)
			expect(videos, LIST(PLAYLIST_VIDEO))
		})
	})
})

after(() => console.log("Issues:", issues))
