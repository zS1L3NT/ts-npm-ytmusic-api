# VideoFull

## Properties

| Name        | Data Type                                 | Description                            |
| :---------- | :---------------------------------------- | :------------------------------------- |
| type        | `"VIDEO"`                                 | Type of data                           |
| videoId     | `string`                                  | YouTube Video ID                       |
| name        | `string`                                  | Name                                   |
| artists     | [ArtistBasic](./ArtistBasic.html)`[]`     | Channels that created the video        |
| views       | `number`                                  | View count                             |
| duration    | `number`                                  | Duration in seconds                    |
| thumbnails  | [ThumbnailFull](./ThumbnailFull.html)`[]` | Thumbnails                             |
| description | `string`                                  | Description                            |
| unlisted    | `boolean`                                 | If the video is unlisted on YouTube    |
| familySafe  | `boolean`                                 | If the video is family safe on YouTube |
| paid        | `boolean`                                 | If the video is paid on YouTube        |
| tags        | `string[]`                                | Tags                                   |

## TypeScript Source Code

```ts
interface VideoFull {
	type: "VIDEO"
	videoId: string
	name: string
	artists: ArtistBasic[]
	views: number
	duration: number
	thumbnails: ThumbnailFull[]
	description: string
	unlisted: boolean
	familySafe: boolean
	paid: boolean
	tags: string[]
}
```

## Usages

[YTMusic#getVideo](../ytmusic-methods/getVideo.html)
