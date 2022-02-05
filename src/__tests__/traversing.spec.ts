import ObjectValidator from "validate-any/dist/validators/ObjectValidator"
import Validator from "validate-any/dist/classes/Validator"
import YTMusic, {
	AlbumBasic,
	AlbumDetailed,
	AlbumFull,
	ArtistBasic,
	ArtistDetailed,
	ArtistFull,
	PlaylistFull,
	SongDetailed,
	SongFull,
	ThumbnailFull,
	VideoDetailed,
	VideoFull
} from ".."
import {
	BOOLEAN,
	iValidationError,
	LIST,
	NULL,
	NUMBER,
	OBJECT,
	OR,
	STRING,
	validate
} from "validate-any"

//#region Interfaces
const THUMBNAIL_FULL: ObjectValidator<ThumbnailFull> = OBJECT({
	url: STRING(),
	width: NUMBER(),
	height: NUMBER()
})

const ARTIST_BASIC: ObjectValidator<ArtistBasic> = OBJECT({
	artistId: OR(STRING(), NULL()),
	name: STRING()
})

const ALBUM_BASIC: ObjectValidator<AlbumBasic> = OBJECT({
	albumId: STRING(),
	name: STRING()
})

const SONG_DETAILED: ObjectValidator<SongDetailed> = OBJECT({
	type: STRING("SONG"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	album: ALBUM_BASIC,
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

const VIDEO_DETAILED: ObjectValidator<VideoDetailed> = OBJECT({
	type: STRING("VIDEO"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	views: NUMBER(),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

const ARTIST_DETAILED: ObjectValidator<ArtistDetailed> = OBJECT({
	artistId: STRING(),
	name: STRING(),
	type: STRING("ARTIST"),
	thumbnails: LIST(THUMBNAIL_FULL)
})

const ALBUM_DETAILED: ObjectValidator<AlbumDetailed> = OBJECT({
	type: STRING("ALBUM"),
	albumId: STRING(),
	playlistId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	year: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

const SONG_FULL: ObjectValidator<SongFull> = OBJECT({
	type: STRING("SONG"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	formats: LIST(OBJECT()),
	adaptiveFormats: LIST(OBJECT())
})

const VIDEO_FULL: ObjectValidator<VideoFull> = OBJECT({
	type: STRING("VIDEO"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	views: NUMBER(),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: STRING(),
	unlisted: BOOLEAN(),
	familySafe: BOOLEAN(),
	paid: BOOLEAN(),
	tags: LIST(STRING())
})

const ARTIST_FULL: ObjectValidator<ArtistFull> = OBJECT({
	artistId: STRING(),
	name: STRING(),
	type: STRING("ARTIST"),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: OR(STRING(), NULL()),
	subscribers: NUMBER(),
	topSongs: LIST(
		OBJECT({
			type: STRING("SONG"),
			videoId: STRING(),
			name: STRING(),
			artists: LIST(ARTIST_BASIC),
			album: ALBUM_BASIC,
			thumbnails: LIST(THUMBNAIL_FULL)
		})
	),
	topAlbums: LIST(ALBUM_DETAILED)
})

const ALBUM_FULL: ObjectValidator<AlbumFull> = OBJECT({
	type: STRING("ALBUM"),
	albumId: STRING(),
	playlistId: STRING(),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	year: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL),
	description: OR(STRING(), NULL()),
	songs: LIST(SONG_DETAILED)
})

const PLAYLIST_DETAILED: ObjectValidator<PlaylistFull> = OBJECT({
	type: STRING("PLAYLIST"),
	playlistId: STRING(),
	name: STRING(),
	artist: ARTIST_BASIC,
	videoCount: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})

const PLAYLIST_VIDEO: ObjectValidator<Omit<VideoDetailed, "views">> = OBJECT({
	type: STRING("VIDEO"),
	videoId: OR(STRING(), NULL()),
	name: STRING(),
	artists: LIST(ARTIST_BASIC),
	duration: NUMBER(),
	thumbnails: LIST(THUMBNAIL_FULL)
})
//#endregion

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

queries.forEach(query => {
	describe("Query: " + query, () => {
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
					_expect(playlists, LIST(PLAYLIST_DETAILED))
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
							PLAYLIST_DETAILED,
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
					_expect(playlist, PLAYLIST_DETAILED)
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
