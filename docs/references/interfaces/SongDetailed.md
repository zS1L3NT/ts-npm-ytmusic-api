# SongDetailed

## Properties

| Name       | Data Type                                 | Description         |
| :--------- | :---------------------------------------- | :------------------ |
| type       | `"SONG"`                                  | Type of data        |
| videoId    | `string`                                  | YouTube Video ID    |
| name       | `string`                                  | Name                |
| artists    | [ArtistBasic](./ArtistBasic.html)`[]`     | Artists             |
| album      | [AlbumBasic](./AlbumBasic.html)           | Album               |
| duration   | `number`                                  | Duration in seconds |
| thumbnails | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails          |

## TypeScript Source Code

```ts
interface SongDetailed {
	type: "SONG"
	videoId: string
	name: string
	artists: ArtistBasic[]
	album: AlbumBasic
	duration: number
	thumbnails: ThumbnailFull[]
}
```

## Usages

[ArtistFull#topSongs](./ArtistFull.html)

[AlbumFull#songs](./AlbumFull.html)

[SearchResult](../types/SearchResult.html)

[YTMusic#searchSongs](../ytmusic/searchSongs.html)

[YTMusic#getArtistSongs](../ytmusic/getArtistSongs.html)
