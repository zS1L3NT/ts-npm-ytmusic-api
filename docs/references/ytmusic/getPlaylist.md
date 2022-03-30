# getPlaylist

See the [guide](../../guides/usage/getPlaylist.html) for information on how to use this.

## Properties

| Name         | Data Type | Description |
| :----------- | :-------- | :---------- |
| `playlistId` | `string`  | Playlist ID |

## Returns

`Promise<`[PlaylistFull](../interfaces/PlaylistFull.html)`>`

## TypeScript Source Code

```ts
public async getPlaylist(playlistId: string): Promise<PlaylistFull>
```
