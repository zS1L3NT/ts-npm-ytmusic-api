# AlbumFull

## Properties

| Name          | Data Type                                 | Description           |
| :------------ | :---------------------------------------- | :-------------------- |
| `type`        | `"ALBUM"`                                 | Type of data          |
| `albumId`     | `string`                                  | Album ID              |
| `playlistId`  | `string`                                  | Playlist ID for Album |
| `name`        | `string`                                  | Name                  |
| `artists`     | [ArtistBasic](./ArtistBasic.html)`[]`     | Creators of the Album |
| `year`        | `number`                                  | Publication Year      |
| `thumbnails`  | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails            |
| `description` | `string`                                  | Description           |
| `songs`       | [SongDetailed](./SongDetailed.html)`[]`   | Songs in the Album    |

## TypeScript Source Code

```ts
interface AlbumFull {
	type: "ALBUM"
	albumId: string
	playlistId: string
	name: string
	artists: ArtistBasic[]
	year: number
	thumbnails: ThumbnailFull[]
	description: string
	songs: SongDetailed[]
}
```

## Usages

[YTMusic#getAlbum](../ytmusic/getAlbum.md)
