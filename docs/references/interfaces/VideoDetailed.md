# VideoDetailed

## Properties

| Name       | Data Type                                 | Description                     |
| :--------- | :---------------------------------------- | :------------------------------ |
| type       | `"VIDEO"`                                 | Type of data                    |
| videoId    | `string`                                  | YouTube Video ID                |
| name       | `string`                                  | Name                            |
| artists    | [ArtistBasic](./ArtistBasic.html)`[]`     | Channels that created the video |
| duration   | `number`                                  | Duration in seconds             |
| thumbnails | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails                      |

## TypeScript Source Code

```ts
interface VideoDetailed {
	type: "VIDEO"
	videoId: string
	name: string
	artists: ArtistBasic[]
	duration: number
	thumbnails: ThumbnailFull[]
}
```

## Usages

[SearchResult](../types/SearchResult.html)

[YTMusic#searchVideos](../ytmusic/searchVideos.html)

[YTMusic#getPlaylistVideos](../ytmusic/getPlaylistVideos.html)
