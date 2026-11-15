# YTMusic API

![License](https://img.shields.io/github/license/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Languages](https://img.shields.io/github/languages/count/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Top Language](https://img.shields.io/github/languages/top/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Commit Activity](https://img.shields.io/github/commit-activity/y/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Last commit](https://img.shields.io/github/last-commit/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge)

YouTube Music API (Unofficial) is a YouTube Music data scraper. It comes with TypeScript support API for return types. The NPM package can be found [here](https://npmjs.com/package/ytmusic-api)

## Motivation

I used to use [youtube-music-api](https://npmjs.com/package/youtube-music-api) as my youtube music api data scraper. I liked looking into the source code of how it works but it never made sense to me. I also didn't like that there were no TypeScript annotations for the return types of methods.
Because of this, I decided to build my own version of a youtube music api with TypeScript annotations, testing and written in a way I can understand.

## Features

-   TypeScript Support for data return types
    -   Data from YouTube can be inconsistent but YTMusic API has been tested and the data matches the TypeScript types 95% of the time
-   Scrape information directly from YouTube Music API
    -   Search Suggestions
    -   Songs
    -   Videos
    -   Artists
    -   Albums
    -   Playlists
    -   Lyrics, with or without timestamps
    -   Upcoming Songs
    -   Home sections

## Usage

```js
import YTMusic from "ytmusic-api"

const ytmusic = new YTMusic()
await ytmusic.initialize(/* Optional: { cookies, GL, HL } */)

ytmusic.search("Never gonna give you up").then(songs => {
	console.log(songs)
})
```

## API

Call `initialize()` once before any other method. `GL` is the country code and `HL` is the language code that YouTube Music uses for results.

| Method | Returns |
| --- | --- |
| `getSearchSuggestions(query)` | `string[]` |
| `search(query)` | Mixed `SearchResult[]`, with the top result first |
| `searchSongs(query, options?)` | `SongDetailed[]` |
| `searchVideos(query, options?)` | `VideoDetailed[]` |
| `searchArtists(query, options?)` | `ArtistDetailed[]` |
| `searchAlbums(query, options?)` | `AlbumDetailed[]` |
| `searchPlaylists(query, options?)` | `PlaylistDetailed[]` |
| `getSong(videoId)` | `SongFull` |
| `getVideo(videoId)` | `VideoFull` |
| `getUpNexts(videoId)` | `SongDetailed[]` queued after the song |
| `getLyrics(videoId)` | `string[]`, or `null` when there are no lyrics |
| `getTimedLyrics(videoId)` | `TimedLyric[]` with times in milliseconds, or `null` |
| `getArtist(artistId)` | `ArtistFull` |
| `getArtistSongs(artistId)` | Every `SongDetailed` of the artist |
| `getArtistAlbums(artistId)` | The `AlbumDetailed[]` of the artist, without singles and EPs |
| `getAlbum(albumId)` | `AlbumFull` |
| `getPlaylist(playlistId)` | `PlaylistFull` |
| `getPlaylistVideos(playlistId)` | Every `VideoDetailed` in the playlist |
| `getHomeSections()` | `HomeSection[]` |
| `getHighresThumbnail(thumbnails)` | A larger `ThumbnailFull` of a video, or `null` |

A filtered search returns the first page of about 20 results. To load more, pass `limit`:

```js
const songs = await ytmusic.searchSongs("Never gonna give you up", { limit: 50 })
```

Songs, videos and albums list every artist in `artists`. `artist` is the first of them. Songs also have `explicit`.

`getAlbum()` accepts the ID from an album's share link, which starts with `OLAK5uy_`. `getPlaylist()` and `getPlaylistVideos()` accept radio playlists, whose IDs start with `RD`.

Cover art and artist images end with a 1200 pixel wide thumbnail that Google's image host makes on request. Video thumbnails cannot be resized this way. For a video, `getHighresThumbnail()` looks for a larger image and returns it only when it exists.

YouTube Music only shows the album and duration of a song in a filtered search. Songs from `search()` have `album: null`, and most have `duration: null`.

## Signing in

Some servers, such as cloud hosts, get a sign-in challenge from YouTube instead of data. To sign in, pass the cookies of a YouTube Music session:

```js
await ytmusic.initialize({ cookies: "SID=...; SAPISID=...; __Secure-3PAPISID=..." })
```

To get the cookies, open [music.youtube.com](https://music.youtube.com) while signed in. In the browser's developer tools, open the Network tab and select a request named `browse`. Copy the full value of its `cookie` request header.

When you sign in, the results are personal. For example, `getHomeSections()` returns your own recommendations and `getPlaylistVideos("LM")` returns your liked songs.

Cookies stay with the `YTMusic` instance, also when you call `initialize()` again. To use another account or to sign out, make a new instance.

The cookies give full access to the account, so store them like a password. YouTube can restrict an account that makes automated requests. Use an account that you can afford to lose.

## Failed requests

When YouTube limits requests, has a server error, or cannot be reached, the request is tried again up to 3 times. The wait starts at 1 second and doubles each time. To change this, pass `retry`:

```js
await ytmusic.initialize({ retry: { retries: 5, delay: 500 } })
```

Each attempt waits 30 seconds for a response. To change this, pass `timeout` in milliseconds.

A request that still fails throws `RequestError`. The error includes the `endpoint`, the HTTP `status` (`null` when YouTube could not be reached) and the `reason` that YouTube gave. Import `RequestError` from `ytmusic-api` to handle it.

## Caching

To reuse the response of a repeated request, pass `cache` with the time to keep responses for in milliseconds:

```js
await ytmusic.initialize({ cache: { ttl: 5 * 60 * 1000 } })
```

Responses are kept in memory, 100 at most. To change the number, pass `size` next to `ttl`. `clearCache()` removes them, and so does another call to `initialize()`.

## Playing songs

`getSong()` returns stream formats in `formats` and `adaptiveFormats` only when you sign in. Without cookies, YouTube returns the details of the song but no streams, and both lists are empty. The stream URLs are protected by YouTube and this package does not decode them. To download or play audio, give the `videoId` to a tool made for that, such as [yt-dlp](https://github.com/yt-dlp/yt-dlp).

## Credits

A lot of the credit should go to [youtube-music-api](https://npmjs.com/package/youtube-music-api). I build this package as a refactored and tested version of youtube-music-api with TypeScript annotations

## Testing

Install the locked dependencies before you run the tests:

```sh
bun install --frozen-lockfile
```

Run the offline tests with this command:

```sh
bun run test
```

Offline tests use fixed responses and do not contact YouTube. They cover all public API methods, response parsing, request construction, cookies, sign-in headers, pagination, lyrics, and error handling. The fixtures include reduced JSON captured from YouTube Music.

To produce a coverage report, run:

```sh
bun run test:coverage
```

Coverage must reach 95% of lines and 90% of functions. The report excludes test helpers and generated files. CI saves the report as the `coverage` artifact.

To test against the live website, run:

```sh
bun run test:live
```

To run the live tests signed in, put the cookies in the `YTMUSIC_COOKIES` environment variable.

The live tests remain separate because YouTube can reject requests from GitHub runners with a sign-in challenge. They can also fail when content changes or requests time out. You can run them from GitHub Actions by selecting **On Pull Request**, choosing **Run workflow**, and enabling the live-test option.

CI runs on every pull request update and on pushes to `main`. It runs the offline tests, type checks, formatting checks, and package builds. Package checks test CommonJS and ES module imports on Node 22 and 24.

Run the checks locally with these commands:

```sh
bun run lint
bun run build
bun run test:package
```

`bun run lint` checks files without changing them. To apply formatting fixes, run `bun run lint:fix`.

## Unavailable metadata

If YouTube omits player metadata because it requires sign-in or restricts access, `getSong()` and `getVideo()` throw `PlayerError`. The error includes `videoId`, the upstream `status`, and the upstream `reason`. Import `PlayerError` from `ytmusic-api` to handle these failures separately from invalid video IDs.

```js
import YTMusic, { PlayerError } from "ytmusic-api"

const ytmusic = await new YTMusic().initialize()
try {
	const video = await ytmusic.getVideo("mGsOHanQwxk")
	console.log(video)
} catch (error) {
	if (error instanceof PlayerError) {
		console.error(error.status, error.reason)
	} else {
		throw error
	}
}
```

## Built with

-   NodeJS
    -   TypeScript
        -   [![@types/tough-cookie](https://img.shields.io/badge/%40types%2Ftough--cookie-%5E4.0.5-red?style=flat-square)](https://npmjs.com/package/@types/tough-cookie/v/4.0.5)
        -   [![bun-types](https://img.shields.io/badge/bun--types-%5E1.1.18-red?style=flat-square)](https://npmjs.com/package/bun-types/v/1.1.18)
        -   [![tsup](https://img.shields.io/badge/tsup-%5E8.1.0-red?style=flat-square)](https://npmjs.com/package/tsup/v/8.1.0)
        -   [![typescript](https://img.shields.io/badge/typescript-5.1-red?style=flat-square)](https://npmjs.com/package/typescript/v/5.1)
    -   Miscellaneous
        -   [![@biomejs/biome](https://img.shields.io/badge/%40biomejs%2Fbiome-1.8.3-red?style=flat-square)](https://npmjs.com/package/@biomejs/biome/v/1.8.3)
        -   [![axios](https://img.shields.io/badge/axios-%5E1.7.2-red?style=flat-square)](https://npmjs.com/package/axios/v/1.7.2)
        -   [![tough-cookie](https://img.shields.io/badge/tough--cookie-%5E4.1.4-red?style=flat-square)](https://npmjs.com/package/tough-cookie/v/4.1.4)
        -   [![zod](https://img.shields.io/badge/zod-%5E3.23.8-red?style=flat-square)](https://npmjs.com/package/zod/v/3.23.8)
        -   [![zod-to-json-schema](https://img.shields.io/badge/zod--to--json--schema-%5E3.23.1-red?style=flat-square)](https://npmjs.com/package/zod-to-json-schema/v/3.23.1)
