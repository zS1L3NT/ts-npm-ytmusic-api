# YTMusic API

![License](https://img.shields.io/github/license/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Languages](https://img.shields.io/github/languages/count/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Top Language](https://img.shields.io/github/languages/top/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Commit Activity](https://img.shields.io/github/commit-activity/y/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Last commit](https://img.shields.io/github/last-commit/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge)

YouTube Music API (Unofficial) is a YouTube Music data scraper. It comes with TypeScript support API for return types. The NPM Package can be found [here](https://npmjs.com/package/ytmusic-api)

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

#### `search`

This function takes in the following parameters

| Name     | Data Type                                                             | Description                                                                         |
| :------- | :-------------------------------------------------------------------- | :---------------------------------------------------------------------------------- |
| query    | `string`                                                              | Search query                                                                        |
| category | `"SONG" \| "VIDEO" \| "ARTIST" \| "ALBUM" \| "PLAYLIST" \| undefined` | Type of results to search for. If not specified, returns all types of search result |

The function **when nothing is passed as the category** returns a `Promise<`[SearchResult](#SearchResult)`[]>` which are the search results of all categories

```ts
ytmusic.search("Lilac").then(results => {
	console.log(results)
})
```

##### `search (category = "SONG")`

When you pass in `"SONG"` as the category,

The function returns a `Promise<`[SongDetailed](#SongDetailed)`[]>` which are the song results

```ts
ytmusic.search("Lilac", "SONG").then(songs => {
	console.log(songs)
})
```

##### `search (category = "VIDEO")`

When you pass in `"VIDEO"` as the category,

The function returns a `Promise<`[VideoDetailed](#VideoDetailed)`[]>` which are the video results

```ts
ytmusic.search("Lilac", "VIDEO").then(videos => {
	console.log(videos)
})
```

##### `search (category = "ARTIST")`

When you pass in `"ARTIST"` as the category

The function returns a `Promise<`[ArtistDetailed](#ArtistDetailed)`[]>` which are the artist results

```ts
ytmusic.search("Lilac", "ARTIST").then(artists => {
	console.log(artists)
})
```

##### `search (category = "ALBUM")`

When you pass in `"ALBUM"` as the category,

The function returns a `Promise<`[AlbumDetailed](#AlbumDetailed)`[]>` which are the album results

```ts
ytmusic.search("Lilac", "ALBUM").then(albums => {
	console.log(albums)
})
```

##### `search (category = "PLAYLIST")`

When you pass in `"PLAYLIST"` as the category,

The function returns a `Promise<`[PlaylistFull](#PlaylistFull)`[]>` which are the playlist results

```ts
ytmusic.search("Lilac", "PLAYLIST").then(playlists => {
	console.log(playlists)
})
```

#### `getSong`

This function takes in the following parameters

| Name    | Data Type | Description |
| :------ | :-------- | :---------- |
| videoId | `string`  | Video ID    |

The function returns a `Promise<`[SongFull](#SongFull)`>` which is the information about the song

```ts
ytmusic.getSong("v7bnOxV4jAc").then(song => {
	console.log(song)
})
```

#### `getVideo`

This function takes in the following parameters

| Name    | Data Type | Description |
| :------ | :-------- | :---------- |
| videoId | `string`  | Video ID    |

The function returns a `Promise<`[VideoFull](#VideoFull)`>` which is the information about the video

```ts
ytmusic.getVideo("v7bnOxV4jAc").then(video => {
	console.log(video)
})
```

#### `getArtist`

This function takes in the following parameters

| Name     | Data Type | Description |
| :------- | :-------- | :---------- |
| artistId | `string`  | Artist ID   |

The function returns a `Promise<`[ArtistFull](#ArtistFull)`>` which is the information about the artist

```ts
ytmusic.getArtist("UCTUR0sVEkD8T5MlSHqgaI_Q").then(artist => {
	console.log(artist)
})
```

#### `getArtistSongs`

This function takes in the following parameters

| Name     | Data Type | Description |
| :------- | :-------- | :---------- |
| artistId | `string`  | Artist ID   |

The function returns a `Promise<`[SongDetailed](#SongDetailed)`[]>` which is the information about all the artist's songs

```ts
ytmusic.getArtistSongs("UCTUR0sVEkD8T5MlSHqgaI_Q").then(artistSongs => {
	console.log(artistSongs)
})
```

#### `getArtistAlbums`

This function takes in the following parameters

| Name     | Data Type | Description |
| :------- | :-------- | :---------- |
| artistId | `string`  | Artist ID   |

The function returns a `Promise<`[AlbumDetailed](#AlbumDetailed)`[]>` which is the information about all the artist's albums

```ts
ytmusic.getArtistAlbums("UCTUR0sVEkD8T5MlSHqgaI_Q").then(artistAlbums => {
	console.log(artistAlbums)
})
```

#### `getAlbum`

This function takes in the following parameters

| Name    | Data Type | Description |
| :------ | :-------- | :---------- |
| albumId | `string`  | Album ID    |

The function returns a `Promise<`[AlbumFull](#AlbumFull)`>` which is the information about the album

```ts
ytmusic.getAlbum("MPREb_iG5q5DIdhdA").then(album => {
	console.log(album)
})
```

#### `getPlaylist`

This function takes in the following parameters

| Name       | Data Type | Description |
| :--------- | :-------- | :---------- |
| playlistId | `string`  | Playlist ID |

The function returns a `Promise<`[PlaylistFull](#PlaylistFull)`>` which is the information about the playlist (without the videos)

```ts
ytmusic.getPlaylist("OLAK5uy_nRb467jR73IXKybwzw22_rTYIJ808x4Yc").then(playlist => {
	console.log(playlist)
})
```

#### `getPlaylistVideos`

This function takes in the following parameters

| Name       | Data Type | Description |
| :--------- | :-------- | :---------- |
| playlistId | `string`  | Playlist ID |

The function returns a `Promise<Omit<`[VideoDetailed](#VideoDetailed)`, "views">[]>` which is the information about the videos without the view count

```ts
ytmusic.getPlaylistVideos("OLAK5uy_nRb467jR73IXKybwzw22_rTYIJ808x4Yc").then(playlistVideos => {
	console.log(playlistVideos)
})
```

## Credits

A lot of the credit should go to [youtube-music-api](https://npmjs.com/package/youtube-music-api). I build this package as a refactored and tested version of youtube-music-api with TypeScript annotations

## Testing

YTMusic API's data return types are tested with Mocha. To run the tests, run the command

```
$ npm run test
```

## Built with

-   TypeScript
    -   [![@types/mocha](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/@types/mocha?style=flat-square)](https://npmjs.com/package/@types/mocha)
    -   [![@types/node](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/@types/node?style=flat-square)](https://npmjs.com/package/@types/node)
    -   [![@types/tough-cookie](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/@types/tough-cookie?style=flat-square)](https://npmjs.com/package/@types/tough-cookie)
    -   [![typescript](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/typescript?style=flat-square)](https://npmjs.com/package/typescript)
-   Axios
    -   [![axios](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/axios?style=flat-square)](https://npmjs.com/package/axios)
-   Tough Cookie
    -   [![tough-cookie](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/tough-cookie?style=flat-square)](https://npmjs.com/package/tough-cookie)
-   Mocha
    -   [![mocha](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/mocha?style=flat-square)](https://npmjs.com/package/mocha)
    -   [![mocha.parallel](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/mocha.parallel?style=flat-square)](https://npmjs.com/package/mocha.parallel)
    -   [![ts-mocha](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/ts-mocha?style=flat-square)](https://npmjs.com/package/ts-mocha)
-   Miscellaneous
    -   [![validate-any](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/validate-any?style=flat-square)](https://npmjs.com/package/validate-any)
