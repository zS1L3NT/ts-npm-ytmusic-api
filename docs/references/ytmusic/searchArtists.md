# searchArtists

See the [guide](../../guides/usage/searchArtists.html) for information on how to use this.

## Properties

| Name    | Data Type | Description  |
| :------ | :-------- | :----------- |
| `query` | `string`  | Search query |

## Returns

`Promise<`[ArtistDetailed](../interfaces/ArtistDetailed.html)`[]>`

## TypeScript Source Code

```ts
public async searchArtists(query: string): Promise<ArtistDetailed[]>
```
