# getPlaylistVideos

See the [guide](../../guides/usage/getPlaylistVideos.html) for information on how to use this.

## Properties

| Name         | Data Type | Description |
| :----------- | :-------- | :---------- |
| `playlistId` | `string`  | Playlist ID |

## Returns

`Promise<`[VideoDetailed](../interfaces/VideoDetailed.html)`[]>`

## TypeScript Source Code

```ts
public async getPlaylistVideos(playlistId: string): Promise<VideoDetailed[]>
```
