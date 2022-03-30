# SongFull

## Properties

| Name            | Data Type                                 | Description            |
| :-------------- | :---------------------------------------- | :--------------------- |
| type            | `"SONG"`                                  | Type of data           |
| videoId         | `string`                                  | YouTube Video ID       |
| name            | `string`                                  | Name                   |
| artists         | [ArtistBasic](./ArtistBasic.html)`[]`     | Artists                |
| duration        | `number`                                  | Duration in seconds    |
| thumbnails      | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails             |
| description     | `string`                                  | Description            |
| formats         | `any[]`                                   | Video Formats          |
| adaptiveFormats | `any[]`                                   | Adaptive Video Formats |

## TypeScript Source Code

```ts
interface SongFull {
	type: "SONG"
	videoId: string
	name: string
	artists: ArtistBasic[]
	duration: number
	thumbnails: ThumbnailFull[]
	description: string
	formats: any[]
	adaptiveFormats: any[]
}
```

## Usages

[YTMusic#getSong](../ytmusic-methods/getSong.html)
