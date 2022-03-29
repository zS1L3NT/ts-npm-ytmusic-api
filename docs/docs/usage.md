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

## `getSong` function

## `getVideo` function

## `getArtist` function

## `getArtistVideo` function

## `getArtistAlbums` function

## `getAlbum` function

## `getPlaylist` function

## `getPlaylistVideos` function
