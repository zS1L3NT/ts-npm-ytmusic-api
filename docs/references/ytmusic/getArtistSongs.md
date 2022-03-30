# getArtistSongs

See the [guide](../../guides/usage/getArtistSongs.html) for information on how to use this.

## Properties

| Name       | Data Type | Description |
| :--------- | :-------- | :---------- |
| `artistId` | `string`  | Artist ID   |

## Returns

`Promise<`[SongDetailed](../interfaces/SongDetailed.html)`[]>`

## TypeScript Source Code

```ts
public async getArtistSongs(artistId: string): Promise<SongDetailed[]>
```
