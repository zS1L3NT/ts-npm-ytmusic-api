# ytmusic-api

YouTube Music API which comes with TypeScript support

## Initialization

Import YTMusic from the npm package

```ts
// TypeScript
import YTMusic from "ytmusic-api"

// JavaScript
const YTMusic = require("ytmusic-api")
```

Create an instance of the class `YTMusic`.
Then, call the `initialize()` to initialize the API before using the API anywhere

```ts
const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	// Use API here
})
```

## Class Methods
### `getSearchSuggestions`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| query | `string`  | Search query you want suggestions for |

The function returns a `Promise<string[]>` which are the suggestion results

```ts
ytmusic.getSearchSuggestions("Lilac").then(res => {
	console.log(res)
})
```

### `search`
This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| query | `string` | Search query |
| category | `"SONG" \| "VIDEO" \| "ARTIST" \| "ALBUM" \| "PLAYLIST" \| undefined` | Type of results to search for. If not specified, returns all types of search result |

The function **when nothing is passed as the category** returns a `Promise<`[SearchResult](#SearchResult)`[]>` which are the search results of all categories

```ts
ytmusic.search("Lilac").then(results => {
	console.log(results)
})
```

#### `search (category = "SONG")`
When you pass in `"SONG"` as the category,

The function returns a `Promise<`[SongDetailed](#SongDetailed)`[]>` which are the song results

```ts
ytmusic.search("Lilac", "SONG").then(songs => {
	console.log(songs)
})
```

#### `search (category = "VIDEO")`
When you pass in `"VIDEO"` as the category,

The function returns a `Promise<`[VideoDetailed](#VideoDetailed)`[]>` which are the video results

```ts
ytmusic.search("Lilac", "VIDEO").then(videos => {
	console.log(videos)
})
```

#### `search (category = "ARTIST")`
When you pass in `"ARTIST"` as the category

The function returns a `Promise<`[ArtistDetailed](#ArtistDetailed)`[]>` which are the artist results

```ts
ytmusic.search("Lilac", "ARTIST").then(artists => {
	console.log(artists)
})
```

#### `search (category = "ALBUM")`
When you pass in `"ALBUM"` as the category,

The function returns a `Promise<`[AlbumDetailed](#AlbumDetailed)`[]>` which are the album results

```ts
ytmusic.search("Lilac", "ALBUM").then(albums => {
	console.log(albums)
})
```

#### `search (category = "PLAYLIST")`
When you pass in `"PLAYLIST"` as the category,

The function returns a `Promise<`[PlaylistFull](#PlaylistFull)`[]>` which are the playlist results

```ts
ytmusic.search("Lilac", "PLAYLIST").then(playlists => {
	console.log(playlists)
})
```

### `getSong`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| videoId | `string` | Video ID |

The function returns a `Promise<`[SongFull](#SongFull)`>` which is the information about the song

```ts
ytmusic.getSong("v7bnOxV4jAc").then(song => {
	console.log(song)
})
```

### `getVideo`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| videoId | `string` | Video ID |

The function returns a `Promise<`[VideoFull](#VideoFull)`>` which is the information about the video

```ts
ytmusic.getVideo("v7bnOxV4jAc").then(video => {
	console.log(video)
})
```

### `getArtist`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| artistId | `string` | Artist ID |

The function returns a `Promise<`[ArtistFull](#ArtistFull)`>` which is the information about the artist

```ts
ytmusic.getArtist("UCTUR0sVEkD8T5MlSHqgaI_Q").then(artist => {
	console.log(artist)
})
```

### `getArtistSongs`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| artistId | `string` | Artist ID | 

The function returns a `Promise<`[SongDetailed](#SongDetailed)`[]>` which is the information about all the artist's songs

```ts
ytmusic.getArtistSongs("UCTUR0sVEkD8T5MlSHqgaI_Q").then(artistSongs => {
	console.log(artistSongs)
})
```

### `getArtistAlbums`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| artistId | `string` | Artist ID |

The function returns a `Promise<`[AlbumDetailed](#AlbumDetailed)`[]>` which is the information about all the artist's albums

```ts
ytmusic.getArtistAlbums("UCTUR0sVEkD8T5MlSHqgaI_Q").then(artistAlbums => {
	console.log(artistAlbums)
})
```

### `getAlbum`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| albumId | `string` | Album ID |

The function returns a `Promise<`[AlbumFull](#AlbumFull)`>` which is the information about the album

```ts
ytmusic.getAlbum("MPREb_iG5q5DIdhdA").then(album => {
	console.log(album)
})
```

### `getPlaylist`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| playlistId | `string` | Playlist ID |

The function returns a `Promise<`[PlaylistFull](#PlaylistFull)`>` which is the information about the playlist (without the videos)

```ts
ytmusic.getPlaylist("OLAK5uy_nRb467jR73IXKybwzw22_rTYIJ808x4Yc").then(playlist => {
	console.log(playlist)
})
```

### `getPlaylistVideos`

This function takes in the following parameters

| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| playlistId | `string` | Playlist ID |

The function returns a `Promise<Omit<`[VideoDetailed](#VideoDetailed)`, "views">[]>` which is the information about the videos without the view count

```ts
ytmusic.getPlaylistVideos("OLAK5uy_nRb467jR73IXKybwzw22_rTYIJ808x4Yc").then(playlistVideos => {
	console.log(playlistVideos)
})
```

## Data Types
### `ThumbnailFull`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| url | `string` | Link |
| width | `number` | Width of the image |
| height | `number` | Height of the image |

### `SongDetailed`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"SONG"` | Type of data |
| videoId | `string \| null` | YouTube Video ID |
| name | `string` | Name |
| artists | [ArtistBasic](#ArtistBasic)`[]` | Artists |
| album | [AlbumBasic](#AlbumBasic) | Album |
| duration | `number` | Duration in seconds |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |

### `SongFull`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"SONG"` | Type of data |
| videoId | `string \| null` | YouTube Video ID |
| name | `string` | Name |
| artists | [ArtistBasic](#ArtistBasic)`[]` | Artists |
| duration | `number` | Duration in seconds |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |
| description | `string` | Description |
| formats | `any[]` | Video Formats |
| adaptiveFormats | `any[]` | Adaptive Video Formats |

### `VideoDetailed`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"VIDEO"` | Type of data |
| videoId | `string \| null` | YouTube Video ID |
| name | `string` | Name |
| artists | [ArtistBasic](#ArtistBasic)`[]` | Channels that created the video |
| views | `number` | View count |
| duration | `number` | Duration in seconds |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |

### `VideoFull`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"VIDEO"` | Type of data |
| videoId | `string \| null` | YouTube Video ID |
| name | `string` | Name |
| artists | [ArtistBasic](#ArtistBasic)`[]` | Channels that created the video |
| views | `number` | View count |
| duration | `number` | Duration in seconds |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |
| description | `string` | Description |
| unlisted | `boolean` | If the video is unlisted on YouTube |
| familySafe | `boolean` | If the video is family safe on YouTube |
| paid | `boolean` | If the video is paid on YouTube |
| tags | `string[]` | Tags |

### `ArtistBasic`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| artistId | `string \| null` | Artist ID |
| name | `string` | Name |

### `ArtistDetailed`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"ARTIST"` | Type of data |
| artistId | `string` | Artist ID |
| name | `string` | Name |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |

### `ArtistFull`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"ARTIST"` | Type of data |
| artistId | `string` | Artist ID |
| name | `string` | Name |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |
| description | `string \| null` | Description |
| subscribers | `number` | Number of subscribers the Artist has|
| topSongs | `Omit<`[SongDetailed](#SongDetailed)`, "duration">[]` | Top Songs from Artist |
| topAlbums | [AlbumDetailed](#AlbumDetailed)`[]` | Top Albums from Artist |

### `AlbumBasic`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| albumId | `string` | Album ID |
| name | `string` | Name |

### `AlbumDetailed`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"ALBUM"` | Type of data |
| albumId | `string` | Album ID |
| playlistId | `string` | Playlist ID for Album |
| name | `string` | Name |
| artists | [ArtistBasic](#ArtistBasic)`[]` | Creators of the Album |
| year | `number` | Publication Year |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |

### `AlbumFull`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"ALBUM"` | Type of data |
| albumId | `string` | Album ID |
| playlistId | `string` | Playlist ID for Album |
| name | `string` | Name |
| artists | [ArtistBasic](#ArtistBasic)`[]` | Creators of the Album |
| year | `number` | Publication Year |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |
| description | `string \| null` | Description |
| songs | [SongDetailed](#SongDetailed)`[]` | Songs in the Album

### `PlaylistFull`
| Name | Data Type | Description |
| :--- | :-------- | :---------- |
| type | `"PLAYLIST"` | Type of data |
| playlistId | `string` | Playlist ID |
| name | `string` | Name |
| artist | [ArtistBasic](#ArtistBasic) | Creator of the Playlist |
| videoCount | `number` | Number of videos in the Playlist |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails |

### `SearchResult`
[SongDetailed](#SongDetailed) or [VideoDetailed](#VideoDetailed) or [ArtistDetailed](#ArtistDetailed) or [AlbumDetailed](#AlbumDetailed) or [PlaylistFull](#PlaylistFull)