# search

See the [guide](../../guides/usage/search.html) for information on how to use this.

## Properties

| Name    | Data Type | Description  |
| :------ | :-------- | :----------- |
| `query` | `string`  | Search query |

## Returns

`Promise<`[SearchResult](../types/SearchResult.html)`[]>`

## TypeScript Source Code

```ts
public async search(query: string): Promise<SearchResult[]>
```
