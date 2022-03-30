# searchSongs

See the [guide](../../guides/usage/searchSongs.html) for information on how to use this.

## Properties

| Name    | Data Type | Description  |
| :------ | :-------- | :----------- |
| `query` | `string`  | Search query |

## Returns

`Promise<`[SongDetailed](../interfaces/SongDetailed.html)`[]>`

## TypeScript Source Code

```ts
public async searchSongs(query: string): Promise<SongDetailed[]>
```
