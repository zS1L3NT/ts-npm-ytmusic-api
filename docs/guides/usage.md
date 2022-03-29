# Usage

YTMusic provides you many ways of fetching data from YouTube Music<br />
To leverage all the functions, we will need to create an instance of the class `YTMusic`.
Then, call the `initialize()` to initialize the API before using the API anywhere

```ts
const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	// Use API here
})
```

## `getSearchSuggestions` function

`getSearchSuggestions()` will fetch you a list of search suggestions based on the query

```ts
ytmusic.getSearchSuggestions("Lilac").then(res => {
	console.log(res)
})
// > [
// >     "lilac",
// >     "lilac iu",
// >     "lilac band",
// >     "lilac wine",
// >     "lilac wine miley cyrus",
// >     "lilac close my eyes forever",
// >     "lilac holy diver"
// > ]
```

## `search` function

`search()` will fetch search results from YouTube Music directly based on the query and result type provided

### `search` for songs
### `search` for videos
### `search` for artists
### `search` for albums
### `search` for playlists


This function takes in the following parameters



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

## `getSong` function

## `getVideo` function

## `getArtist` function

## `getArtistVideo` function

## `getArtistAlbums` function

## `getAlbum` function

## `getPlaylist` function

## `getPlaylistVideos` function
