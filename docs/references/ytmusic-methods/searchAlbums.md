# searchAlbums

See the [guide](../../guides/usage/searchAlbums.html) for information on how to use this.

## Properties

| Name    | Data Type | Description  |
| :------ | :-------- | :----------- |
| `query` | `string`  | Search query |

## Returns

`Promise<`[AlbumDetailed](../interfaces/AlbumDetailed.html)`[]>`

## TypeScript Source Code

```ts
public async searchAlbums(query: string): Promise<AlbumDetailed[]>
```
