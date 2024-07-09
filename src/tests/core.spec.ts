import { afterAll, beforeAll, describe, it } from "bun:test"
import { equal } from "assert"
import { z } from "zod"

import { ZodError, ZodType } from "zod"
import YTMusic from "../YTMusic"
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
	NextResult
} from "../types"

const errors: ZodError[] = []
const queries = ["Lilac", "Weekend", "Eill", "Eminem", "Lisa Hannigan"]

const nextQueries = [
      //   videoId        playlistId
      ["0-q1KafFCLU", "RDAMVMv7bnOxV4jAc"], 
      ["3_g2un5M350", "RDAOHSpo_Uv9STIRtF73zMywLg"],
      ["k9r74T2d5zc", "RDAO58VCzmAxo6veMZY49UqvQw"],
      ["2JFLxtcMQBM", "RDAOASZzAB4N6PSfsOwzAhxYyQ"],
      ["g9m6oj9JvnE", "RDAOjWghT6s3mcT8SVl7jgbCXw"]
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

const ytmusic = new YTMusic()
beforeAll(() => ytmusic.initialize())

queries.forEach((query, index) => {
	describe("Query: " + query, () => {
		it("Search suggestions", async () => {
			const suggestions = await ytmusic.getSearchSuggestions(query)
			expect(suggestions, z.array(z.string()))
		})

		it("Search Songs", async () => {
			const songs = await ytmusic.searchSongs(query)
			expect(songs, z.array(SongDetailed))
		})

		it("Search Videos", async () => {
			const videos = await ytmusic.searchVideos(query)
			expect(videos, z.array(VideoDetailed))
		})

		it("Search Artists", async () => {
			const artists = await ytmusic.searchArtists(query)
			expect(artists, z.array(ArtistDetailed))
		})

		it("Search Albums", async () => {
			const albums = await ytmusic.searchAlbums(query)
			expect(albums, z.array(AlbumDetailed))
		})

		it("Search Playlists", async () => {
			const playlists = await ytmusic.searchPlaylists(query)
			expect(playlists, z.array(PlaylistDetailed))
		})

		it("Search All", async () => {
			const results = await ytmusic.search(query)
			expect(results, z.array(SearchResult))
		})

            it("Get Next", async () => {
			const results = await ytmusic.getNext.apply(ytmusic, nextQueries[index]);
			expect(results, z.array(NextResult))
		})

		it("Get lyrics of the first song result", async () => {
			const songs = await ytmusic.searchSongs(query)
			const lyrics = await ytmusic.getLyrics(songs[0]!.videoId)
			expect(lyrics, z.nullable(z.array(z.string())))
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
			expect(songs, z.array(SongDetailed))
		})

		it("Get the albums of the first artist result", async () => {
			const artists = await ytmusic.searchArtists(query)
			const albums = await ytmusic.getArtistAlbums(artists[0]!.artistId)
			expect(albums, z.array(AlbumDetailed))
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
			expect(videos, z.array(VideoDetailed))
		})
	})
})

afterAll(() => console.log("Issues:", errors))
