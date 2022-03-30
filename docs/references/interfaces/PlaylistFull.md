# PlaylistFull

## Properties

| Name       | Data Type                           | Description                      |
| :--------- | :---------------------------------- | :------------------------------- |
| type       | `"PLAYLIST"`                        | Type of data                     |
| playlistId | `string`                            | Playlist ID                      |
| name       | `string`                            | Name                             |
| artist     | [ArtistBasic](#ArtistBasic)         | Creator of the Playlist          |
| videoCount | `number`                            | Number of videos in the Playlist |
| thumbnails | [ThumbnailFull](#ThumbnailFull)`[]` | Thumbnails                       |

## TypeScript Source Code

```ts
interface PlaylistFull {
	type: "PLAYLIST"
	playlistId: string
	name: string
	artist: ArtistBasic
	videoCount: number
	thumbnails: ThumbnailFull[]
}
```

## Usages

[SearchResult](../types/SearchResult.html)

[YTMusic#searchPlaylists](../ytmusic-methods/searchPlaylists.html)

[YTMusic#getPlaylist](../ytmusic-methods/getPlaylist.html)
