# AlbumDetailed

## Properties

| Name         | Data Type                                 | Description           |
| :----------- | :---------------------------------------- | :-------------------- |
| `type`       | `"ALBUM"`                                 | Type of data          |
| `albumId`    | `string`                                  | Album ID              |
| `playlistId` | `string`                                  | Playlist ID for Album |
| `name`       | `string`                                  | Name                  |
| `artists`    | [ArtistBasic](./ArtistBasic.html)`[]`     | Creators of the Album |
| `year`	   | `number \| null`                          | Year of release       |
| `thumbnails` | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails            |

## TypeScript Source Code

```ts
interface AlbumDetailed {
	type: "ALBUM"
	albumId: string
	playlistId: string
	name: string
	artists: ArtistBasic[]
	year: number | null
	thumbnails: ThumbnailFull[]
}
```

## Usages

[ArtistFull#topAlbums](./ArtistFull.html)

[ArtistFull#topSingles](./ArtistFull.html)

[SearchResult](../types/SearchResult.html)

[YTMusic#searchAlbums](../ytmusic/searchAlbums.html)

[YTMusic#getArtistAlbums](../ytmusic/getArtistAlbums.html)