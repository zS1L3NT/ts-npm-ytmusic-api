import { arrayOf, Problem, Type, type } from "arktype"
import { equal } from "assert"
import { afterAll, beforeAll, describe, it } from "bun:test"

import {
	AlbumDetailed,
	AlbumFull,
	ArtistDetailed,
	ArtistFull,
	PlaylistDetailed,
	PlaylistFull,
	SearchResult,
	SongDetailed,
	SongFull,
	VideoDetailed,
	VideoFull,
} from "../@types/types"
import YTMusic from "../YTMusic"

const errors: Problem[] = []
const queries = ["Lilac", "Weekend", "Eill", "Eminem", "Lisa Hannigan"]
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
beforeAll(() => ytmusic.initialize())

queries.forEach(query => {
	describe("Query: " + query, () => {
		it("Search suggestions", async () => {
			const suggestions = await ytmusic.getSearchSuggestions(query)
			expect(suggestions, type("string[]"))
		})

		it("Search Songs", async () => {
			const songs = await ytmusic.searchSongs(query)
			expect(songs, arrayOf(SongDetailed))
		})

		it("Search Videos", async () => {
			const videos = await ytmusic.searchVideos(query)
			expect(videos, arrayOf(VideoDetailed))
		})

		it("Search Artists", async () => {
			const artists = await ytmusic.searchArtists(query)
			expect(artists, arrayOf(ArtistDetailed))
		})

		it("Search Albums", async () => {
			const albums = await ytmusic.searchAlbums(query)
			expect(albums, arrayOf(AlbumDetailed))
		})

		it("Search Playlists", async () => {
			const playlists = await ytmusic.searchPlaylists(query)
			expect(playlists, arrayOf(PlaylistDetailed))
		})

		it("Search All", async () => {
			const results = await ytmusic.search(query)
			expect(results, arrayOf(SearchResult))
		})

		it("Get lyrics of the first song result", async () => {
			const songs = await ytmusic.searchSongs(query)
			const lyrics = await ytmusic.getLyrics(songs[0]!.videoId)
			expect(lyrics, type("string[]|null"))
		})

		it("Get details of the first song result", async () => {
			const songs = await ytmusic.searchSongs(query)
			const song = await ytmusic.getSong(songs[0]!.videoId)
			expect(song, SongFull)
		})

		it("Get details of the first video result", async () => {
			const videos = await ytmusic.searchVideos(query)
			const video = await ytmusic.getVideo(videos[0]!.videoId)
			expect(video, VideoFull)
		})

		it("Get details of the first artist result", async () => {
			const artists = await ytmusic.searchArtists(query)
			const artist = await ytmusic.getArtist(artists[0]!.artistId)
			expect(artist, ArtistFull)
		})

		it("Get the songs of the first artist result", async () => {
			const artists = await ytmusic.searchArtists(query)
			const songs = await ytmusic.getArtistSongs(artists[0]!.artistId)
			expect(songs, arrayOf(SongDetailed))
		})

		it("Get the albums of the first artist result", async () => {
			const artists = await ytmusic.searchArtists(query)
			const albums = await ytmusic.getArtistAlbums(artists[0]!.artistId)
			expect(albums, arrayOf(AlbumDetailed))
		})

		it("Get details of the first album result", async () => {
			const albums = await ytmusic.searchAlbums(query)
			const album = await ytmusic.getAlbum(albums[0]!.albumId)
			expect(album, AlbumFull)
		})

		it("Get details of the first playlist result", async () => {
			const playlists = await ytmusic.searchPlaylists(query)
			const playlist = await ytmusic.getPlaylist(playlists[0]!.playlistId)
			expect(playlist, PlaylistFull)
		})

		it("Get the videos of the first playlist result", async () => {
			const playlists = await ytmusic.searchPlaylists(query)
			const videos = await ytmusic.getPlaylistVideos(playlists[0]!.playlistId)
			expect(videos, arrayOf(VideoDetailed))
		})
	})
})

afterAll(() => console.log("Issues:", errors))
