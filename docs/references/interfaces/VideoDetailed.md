# VideoDetailed

## Properties

| Name       | Data Type                                 | Description                     |
| :--------- | :---------------------------------------- | :------------------------------ |
| type       | `"VIDEO"`                                 | Type of data                    |
| videoId    | `string`                                  | YouTube Video ID                |
| name       | `string`                                  | Name                            |
| artists    | [ArtistBasic](./ArtistBasic.html)`[]`     | Channels that created the video |
| views      | `number`                                  | View count                      |
| duration   | `number`                                  | Duration in seconds             |
| thumbnails | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails                      |

## TypeScript Source Code

```ts
interface VideoDetailed {
	type: "VIDEO"
	videoId: string
	name: string
	artists: ArtistBasic[]
	views: number
	duration: number
	thumbnails: ThumbnailFull[]
}
```

## Usages

[SearchResult](../types/SearchResult.html)

[YTMusic#searchVideos](../ytmusic-methods/searchVideos.html)

[YTMusic#getPlaylistVideos](../ytmusic-methods/getPlaylistVideos.html)
