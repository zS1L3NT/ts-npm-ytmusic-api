# getArtistAlbums

See the [guide](../../guides/usage/getArtistAlbums.html) for information on how to use this.

## Properties

| Name       | Data Type | Description |
| :--------- | :-------- | :---------- |
| `artistId` | `string`  | Artist ID   |

## Returns

`Promise<`[AlbumDetailed](../interfaces/AlbumDetailed.html)`[]>`

## TypeScript Source Code

```ts
public async getArtistAlbums(artistId: string): Promise<AlbumDetailed[]>
```
