# AlbumDetailed

## Properties

| Name         | Data Type                            | Description           |
| :----------- | :----------------------------------- | :-------------------- |
| `type`       | `"ALBUM"`                            | Type of data          |
| `albumId`    | `string`                             | Album ID              |
| `playlistId` | `string`                             | Playlist ID for Album |
| `name`       | `string`                             | Name                  |
| `artists`    | [ArtistBasic](./ArtistBasic)`[]`     | Creators of the Album |
| `year`       | `number`                             | Publication Year      |
| `thumbnails` | [ThumbnailFull](./ThumbnailFull)`[]` | Thumbnails            |

## TypeScript Source Code

```ts
interface AlbumBasic {
	type: "ALBUM"
	albumId: string
	playlistId: string
	name: string
	artists: ArtistBasic[]
	year: number
	thumbnails: ThumbnailFull[]
}
```
