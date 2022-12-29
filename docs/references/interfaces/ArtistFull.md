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
| topSingles   | [AlbumDetailed](./AlbumDetailed.html)`[]`                   | Top Singles from Artist               |
| topVideos    | `Omit<`[VideoDetailed](./VideoDetailed.html)`, "duration">[]` | Top Videos from Artist                |

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
	topSingles: AlbumDetailed[]
	topVideos: Omit<VideoDetailed, "duration">[]
}
```

## Usages

[YTMusic#getArtist](../ytmusic/getArtist.html)
