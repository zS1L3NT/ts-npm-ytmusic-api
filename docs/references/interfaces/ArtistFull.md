# ArtistFull

## Properties

| Name        | Data Type                                                   | Description                          |
| :---------- | :---------------------------------------------------------- | :----------------------------------- |
| type        | `"ARTIST"`                                                  | Type of data                         |
| artistId    | `string`                                                    | Artist ID                            |
| name        | `string`                                                    | Name                                 |
| thumbnails  | [ThumbnailFull](./ThumbnailFull.html)`[]`                   | Thumbnails                           |
| description | `string`                                                    | Description                          |
| topSongs    | `Omit<`[SongDetailed](./SongDetailed.html)`, "duration">[]` | Top Songs from Artist                |
| topAlbums   | [AlbumDetailed](./AlbumDetailed.html)`[]`                   | Top Albums from Artist               |

## TypeScript Source Code

```ts
interface ArtistFull {
	type: "ARTIST"
	artistId: string
	name: string
	thumbnails: ThumbnailFull[]
	description: string
	topSongs: Omit<SongDetailed, "duration">[]
	topAlbums: AlbumDetailed[]
}
```

## Usages

[YTMusic#getArtist](../ytmusic/getArtist.html)
