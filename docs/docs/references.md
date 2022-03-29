# References

## `YTMusic` methods

### `getSearchSuggestions`

::: tip Properties

| Name    | Data Type | Description                           |
| :------ | :-------- | :------------------------------------ |
| `query` | `string`  | Search query you want suggestions for |

:::

::: tip Returns

`Promise<string[]>`

:::

```ts
public async getSearchSuggestions(query: string): Promise<string[]>
```

### `search`

::: tip Properties

| Name    | Data Type | Description  |
| :------ | :-------- | :----------- |
| `query` | `string`  | Search query |

:::

::: tip Returns

<code class="code-left">Promise<</code>
<a class="anchor" href="#searchresult">SearchResult</a>
<code class="code-right">[]></code>

:::

```ts
public async search(query: string): Promise<SearchResult[]>
```

#### `search` for songs

::: tip Properties

| Name       | Data Type  | Description                    |
| :--------- | :--------- | :----------------------------- |
| `query`    | `string`   | Search query                   |
| `category` | `"STRING"` | Category of results to receive |

:::

::: tip Returns

<code class="code-left">Promise<</code>
<a class="anchor" href="#songdetailed">SongDetailed</a>
<code class="code-right">[]></code>

:::

```ts
public async search(query: string, category: "SONG"): Promise<SongDetailed[]>
```

#### `search` for videos

::: tip Properties

| Name       | Data Type | Description                    |
| :--------- | :-------- | :----------------------------- |
| `query`    | `string`  | Search query                   |
| `category` | `"VIDEO"` | Category of results to receive |

:::

```ts
public async search(query: string, category: "VIDEO"): Promise<VideoDetailed[]>
```

#### `search` for artists

::: tip Properties

| Name       | Data Type  | Description                    |
| :--------- | :--------- | :----------------------------- |
| `query`    | `string`   | Search query                   |
| `category` | `"ARTIST"` | Category of results to receive |

:::

```ts
public async search(query: string, category: "ARTIST"): Promise<ArtistDetailed[]>
```

#### `search` for albums

::: tip Properties

| Name       | Data Type | Description                    |
| :--------- | :-------- | :----------------------------- |
| `query`    | `string`  | Search query                   |
| `category` | `"ALBUM"` | Category of results to receive |

:::

```ts
public async search(query: string, category: "ALBUM"): Promise<AlbumDetailed[]>
```

#### `search` for playlists

::: tip Properties

| Name       | Data Type    | Description                    |
| :--------- | :----------- | :----------------------------- |
| `query`    | `string`     | Search query                   |
| `category` | `"PLAYLIST"` | Category of results to receive |

:::

```ts
public async search(query: string, category: "PLAYLIST"): Promise<PlaylistFull[]>
```

### `getSong`

### `getVideo`

### `getArtist`

### `getArtistVideo`

### `getArtistAlbums`

### `getAlbum`

### `getPlaylist`

### `getPlaylistVideos`

## Interfaces

### `ThumbnailFull`

### `SongDetailed`

### `SongFull`

### `VideoDetailed`

### `VideoFull`

### `ArtistBasic`

### `ArtistDetailed`

### `ArtistFull`

### `AlbumBasic`

### `AlbumDetailed`

### `AlbumFull`

### `PlaylistFull`
