import { beforeAll, describe, it } from "bun:test"
import { deepEqual, equal } from "assert"
import { z } from "zod"

import YTMusic from "../../YTMusic"
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
	TimedLyric,
	VideoDetailed,
	VideoFull,
} from "../../types"
import expect from "./expect"

const queries = ["Lilac", "Weekend", "Eill", "Eminem", "Lisa Hannigan"]

const ytmusic = new YTMusic()
// Set YTMUSIC_COOKIES to a Cookie header to run the same tests signed in
beforeAll(() => {
	const cookies = process.env.YTMUSIC_COOKIES
	return ytmusic.initialize(cookies ? { cookies } : {})
})

queries.forEach(query => {
	describe("Query: " + query, () => {
		it("Search suggestions", async () => {
			const suggestions = await ytmusic.getSearchSuggestions(query)
			expect(suggestions, z.array(z.string()))
		})

		it("Search Songs", async () => {
			const { items: songs } = await ytmusic.searchSongs(query)
			expect(songs, z.array(SongDetailed))
		})

		it("Search Videos", async () => {
			const { items: videos } = await ytmusic.searchVideos(query)
			expect(videos, z.array(VideoDetailed))
		})

		it("Search Artists", async () => {
			const { items: artists } = await ytmusic.searchArtists(query)
			expect(artists, z.array(ArtistDetailed))
		})

		it("Search Albums", async () => {
			const { items: albums } = await ytmusic.searchAlbums(query)
			expect(albums, z.array(AlbumDetailed))
		})

		it("Search Playlists", async () => {
			const { items: playlists } = await ytmusic.searchPlaylists(query)
			expect(playlists, z.array(PlaylistDetailed))
		})

		it("Search Songs across pages", async () => {
			const { items: songs } = await ytmusic.searchSongs(query, { limit: 30 })
			equal(songs.length, 30)
			equal(new Set(songs.map(song => song.videoId)).size, 30)
			expect(songs, z.array(SongDetailed))
		})

		it("Search Songs page by page", async () => {
			const first = await ytmusic.searchSongs(query, { limit: 10 })
			const next = await ytmusic.searchSongs(query, { limit: 10, cursor: first.cursor })
			const songs = [...first.items, ...next.items]
			equal(songs.length, 20)
			equal(new Set(songs.map(song => song.videoId)).size, 20)
			expect(songs, z.array(SongDetailed))
		})

		it("Search All", async () => {
			const results = await ytmusic.search(query)
			expect(results, z.array(SearchResult))
		})

		it("Get lyrics of the first song result", async () => {
			const { items: songs } = await ytmusic.searchSongs(query)
			const lyrics = await ytmusic.getLyrics(songs[0]!.videoId)
			expect(lyrics, z.nullable(z.array(z.string())))
		})

		it("Get timed lyrics of the first song result", async () => {
			const { items: songs } = await ytmusic.searchSongs(query)
			const lyrics = await ytmusic.getTimedLyrics(songs[0]!.videoId)
			expect(lyrics, z.nullable(z.array(TimedLyric)))
		})

		it("Get the songs queued after the first song result", async () => {
			const { items: songs } = await ytmusic.searchSongs(query)
			const upNexts = await ytmusic.getUpNexts(songs[0]!.videoId)
			expect(upNexts, z.array(SongDetailed))
		})

		it("Get details of the first song result", async () => {
			const { items: songs } = await ytmusic.searchSongs(query)
			const song = await ytmusic.getSong(songs[0]!.videoId)
			expect(song, SongFull)
		})

		it("Get details of the first video result", async () => {
			const { items: videos } = await ytmusic.searchVideos(query)
			const video = await ytmusic.getVideo(videos[0]!.videoId)
			expect(video, VideoFull)
		})

		it("Get details of the first artist result", async () => {
			const { items: artists } = await ytmusic.searchArtists(query)
			const artist = await ytmusic.getArtist(artists[0]!.artistId)
			expect(artist, ArtistFull)
		})

		it("Get the songs of the first artist result page by page", async () => {
			const { items: artists } = await ytmusic.searchArtists(query)
			const { items: songs } = await ytmusic.getArtistSongs(artists[0]!.artistId, {
				limit: 20,
			})
			const first = await ytmusic.getArtistSongs(artists[0]!.artistId, { limit: 10 })
			const next = await ytmusic.getArtistSongs(artists[0]!.artistId, {
				limit: 10,
				cursor: first.cursor,
			})
			deepEqual([...first.items, ...next.items], songs)
			expect(songs, z.array(SongDetailed))
		})

		it("Get the albums of the first artist result", async () => {
			const { items: artists } = await ytmusic.searchArtists(query)
			const albums = await ytmusic.getArtistAlbums(artists[0]!.artistId)
			expect(albums, z.array(AlbumDetailed))
		})

		it("Get details of the first album result", async () => {
			const { items: albums } = await ytmusic.searchAlbums(query)
			const album = await ytmusic.getAlbum(albums[0]!.albumId)
			expect(album, AlbumFull)
		})

		it("Get details of the first album result from its share link", async () => {
			const { items: albums } = await ytmusic.searchAlbums(query)
			const album = await ytmusic.getAlbum(albums[0]!.playlistId)
			equal(album.albumId, albums[0]!.albumId)
			expect(album, AlbumFull)
		})

		it("Get details of the first playlist result", async () => {
			const { items: playlists } = await ytmusic.searchPlaylists(query)
			const playlist = await ytmusic.getPlaylist(playlists[0]!.playlistId)
			expect(playlist, PlaylistFull)
		})

		it("Get the videos of the first playlist result page by page", async () => {
			const { items: playlists } = await ytmusic.searchPlaylists(query)
			const playlist = await ytmusic.getPlaylist(playlists[0]!.playlistId)
			const videos = []
			let cursor: string | null = null
			do {
				const page = await ytmusic.getPlaylistVideos(playlists[0]!.playlistId, {
					limit: 30,
					cursor,
				})
				videos.push(...page.items)
				cursor = page.cursor
			} while (cursor)
			// Unavailable videos are counted by YouTube but cannot be listed
			equal(videos.length > 100 || playlist.videoCount <= 100, true)
			expect(videos, z.array(VideoDetailed))
		})
	})
})
