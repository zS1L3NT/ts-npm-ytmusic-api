# YTMusic API

![License](https://img.shields.io/github/license/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Languages](https://img.shields.io/github/languages/count/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Top Language](https://img.shields.io/github/languages/top/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Commit Activity](https://img.shields.io/github/commit-activity/y/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Last commit](https://img.shields.io/github/last-commit/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge)

YouTube Music API (Unofficial) is a YouTube Music data scraper. It comes with TypeScript support API for return types. The NPM package can be found [here](https://npmjs.com/package/ytmusic-api)

## Motivation

I used to use [youtube-music-api](https://npmjs.com/package/youtube-music-api) as my youtube music api data scraper. I liked looking into the source code of how it works but it never made sense to me. I also didn't like that there were no TypeScript annotations for the return types of methods.
Because of this, I decided to build my own version of a youtube music api with TypeScript annotations, testing and written in a way I can understand.

## Features

-   TypeScript Support for data return types
    -   Data from YouTube can be inconsistent but YTMusic API has been tested and the data matches the TypeScript types 95% of the time
-   Scrape information directly from YouTube Music API
    -   Search Suggestions
    -   Songs
    -   Videos
    -   Artists
    -   Albums
    -   Playlists
    -   Lyrics

## Usage

```js
import YTMusic from "ytmusic-api"

const ytmusic = new YTMusic()
await ytmusic.initialize(/* Optional: Custom cookies */)

ytmusic.search("Never gonna give you up").then(songs => {
	console.log(songs)
})
```

## Credits

A lot of the credit should go to [youtube-music-api](https://npmjs.com/package/youtube-music-api). I build this package as a refactored and tested version of youtube-music-api with TypeScript annotations

## Testing

YTMusic API's data return types are tested with Bun Test. To run the tests, run the command

```
$ bun test
```

## Built with

-   NodeJS
    -   TypeScript
        -   [![@types/tough-cookie](https://img.shields.io/badge/%40types%2Ftough--cookie-%5E4.0.5-red?style=flat-square)](https://npmjs.com/package/@types/tough-cookie/v/4.0.5)
        -   [![bun-types](https://img.shields.io/badge/bun--types-%5E1.1.18-red?style=flat-square)](https://npmjs.com/package/bun-types/v/1.1.18)
        -   [![tsup](https://img.shields.io/badge/tsup-%5E8.1.0-red?style=flat-square)](https://npmjs.com/package/tsup/v/8.1.0)
        -   [![typescript](https://img.shields.io/badge/typescript-5.1-red?style=flat-square)](https://npmjs.com/package/typescript/v/5.1)
    -   Miscellaneous
        -   [![@biomejs/biome](https://img.shields.io/badge/%40biomejs%2Fbiome-1.8.3-red?style=flat-square)](https://npmjs.com/package/@biomejs/biome/v/1.8.3)
        -   [![axios](https://img.shields.io/badge/axios-%5E1.7.2-red?style=flat-square)](https://npmjs.com/package/axios/v/1.7.2)
        -   [![tough-cookie](https://img.shields.io/badge/tough--cookie-%5E4.1.4-red?style=flat-square)](https://npmjs.com/package/tough-cookie/v/4.1.4)
        -   [![zod](https://img.shields.io/badge/zod-%5E3.23.8-red?style=flat-square)](https://npmjs.com/package/zod/v/3.23.8)
        -   [![zod-to-json-schema](https://img.shields.io/badge/zod--to--json--schema-%5E3.23.1-red?style=flat-square)](https://npmjs.com/package/zod-to-json-schema/v/3.23.1)