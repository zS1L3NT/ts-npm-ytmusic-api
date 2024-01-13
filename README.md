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
        -   [![@types/tough-cookie](https://img.shields.io/badge/%40types%2Ftough--cookie-%5E4.0.2-red?style=flat-square)](https://npmjs.com/package/@types/tough-cookie/v/4.0.2)
        -   [![@typescript-eslint/eslint-plugin](https://img.shields.io/badge/%40typescript--eslint%2Feslint--plugin-latest-red?style=flat-square)](https://npmjs.com/package/@typescript-eslint/eslint-plugin/v/latest)
        -   [![@typescript-eslint/parser](https://img.shields.io/badge/%40typescript--eslint%2Fparser-latest-red?style=flat-square)](https://npmjs.com/package/@typescript-eslint/parser/v/latest)
        -   [![bun-types](https://img.shields.io/badge/bun--types-%5E1.0.18--1-red?style=flat-square)](https://npmjs.com/package/bun-types/v/1.0.18-1)
        -   [![typescript](https://img.shields.io/badge/typescript-latest-red?style=flat-square)](https://npmjs.com/package/typescript/v/latest)
    -   ESLint
        -   [![eslint](https://img.shields.io/badge/eslint-latest-red?style=flat-square)](https://npmjs.com/package/eslint/v/latest)
        -   [![eslint-config-prettier](https://img.shields.io/badge/eslint--config--prettier-latest-red?style=flat-square)](https://npmjs.com/package/eslint-config-prettier/v/latest)
        -   [![eslint-plugin-simple-import-sort](https://img.shields.io/badge/eslint--plugin--simple--import--sort-latest-red?style=flat-square)](https://npmjs.com/package/eslint-plugin-simple-import-sort/v/latest)
        -   [![prettier](https://img.shields.io/badge/prettier-latest-red?style=flat-square)](https://npmjs.com/package/prettier/v/latest)
    -   Miscellaneous
        -   [![arktype](https://img.shields.io/badge/arktype-%5E1.0.29--alpha-red?style=flat-square)](https://npmjs.com/package/arktype/v/1.0.29-alpha)
        -   [![axios](https://img.shields.io/badge/axios-%5E0.27.2-red?style=flat-square)](https://npmjs.com/package/axios/v/0.27.2)
        -   [![tough-cookie](https://img.shields.io/badge/tough--cookie-%5E4.1.2-red?style=flat-square)](https://npmjs.com/package/tough-cookie/v/4.1.2)
