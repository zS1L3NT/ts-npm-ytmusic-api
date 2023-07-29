# PlaylistFull

## Properties

| Name       | Data Type                           | Description                      |
| :--------- | :---------------------------------- | :------------------------------- |
| type       | `"PLAYLIST"`                        | Type of data                     |
| playlistId | `string`                            | Playlist ID                      |
| name       | `string`                            | Name                             |
| artist     | [ArtistBasic](#ArtistBasic)         | Creator of the Playlist          |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails                       |

## TypeScript Source Code

```ts
interface PlaylistFull {
	type: "PLAYLIST"
	playlistId: string
	name: string
	artist: ArtistBasic
	thumbnails: ThumbnailFull[]
}
```

## Usages

[SearchResult](../types/SearchResult.html)

[YTMusic#searchPlaylists](../ytmusic/searchPlaylists.html)

[YTMusic#getPlaylist](../ytmusic/getPlaylist.html)
