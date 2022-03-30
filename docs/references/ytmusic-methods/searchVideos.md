# searchVideos

See the [guide](../../guides/usage/searchVideos.html) for information on how to use this.

## Properties

| Name    | Data Type | Description  |
| :------ | :-------- | :----------- |
| `query` | `string`  | Search query |

## Returns

`Promise<`[VideoDetailed](../interfaces/VideoDetailed.html)`[]>`

## TypeScript Source Code

```ts
public async searchVideos(query: string): Promise<VideoDetailed[]>
```
