# ArtistDetailed

## Properties

| Name       | Data Type                                 | Description  |
| :--------- | :---------------------------------------- | :----------- |
| type       | `"ARTIST"`                                | Type of data |
| artistId   | `string`                                  | Artist ID    |
| name       | `string`                                  | Name         |
| thumbnails | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails   |

## TypeScript Source Code

```ts
interface ArtistDetailed {
	type: "ARTIST"
	artistId: string
	name: string
	thumbnails: ThumbnailFull[]
}
```

## Usages

[SearchResult](../types/SearchResult.html)

[YTMusic#searchArtists](../../guides/usage/searchArtists.html)
