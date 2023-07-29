import { equal } from "assert"
import describeParallel from "mocha.parallel"
import { z } from "zod"

import {
	AlbumDetailed,
	AlbumFull,
	ArtistDetailed,
	ArtistFull,
	PlaylistFull,
	SongDetailed,
	SongFull,
	VideoDetailed,
	VideoFull,
} from "../schemas"
import YTMusic from "../YTMusic"

const errors = <z.ZodError<any>[]>[]
const queries = ["Lilac", "Weekend", "Eill", "Eminem", "Lisa Hannigan"]
const expect = (data: any, schema: z.Schema) => {
	const result = schema.safeParse(data)
	if (!result.success && "error" in result) {
		errors.push(result.error)
	}
	equal(result.success, true)
}

const ytmusic = new YTMusic()
before(() => ytmusic.initialize())

queries.forEach(query => {
	describeParallel("Query: " + query, () => {
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
			expect(playlists, z.array(PlaylistFull))
		})

		it("Search All", async () => {
			const results = await ytmusic.search(query)
			expect(
				results,
				z.array(
					AlbumDetailed.or(ArtistDetailed)
						.or(PlaylistFull)
						.or(SongDetailed)
						.or(VideoDetailed),
				),
			)
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

after(() => console.log("Issues:", errors))
