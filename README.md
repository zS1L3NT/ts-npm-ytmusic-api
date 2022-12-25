# YTMusic API

![License](https://img.shields.io/github/license/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Languages](https://img.shields.io/github/languages/count/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Top Language](https://img.shields.io/github/languages/top/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Commit Activity](https://img.shields.io/github/commit-activity/y/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Last commit](https://img.shields.io/github/last-commit/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge)

YouTube Music API (Unofficial) is a YouTube Music data scraper. It comes with TypeScript support API for return types. The NPM package can be found [here](https://npmjs.com/package/ytmusic-api)

**Full documentation is available [here](http://ytmusic-api.zectan.com).**

## Motivation

I used to use [youtube-music-api](https://npmjs.com/package/youtube-music-api) as my youtube music api data scraper. I liked looking into the source code of how it works but it never made sense to me. I also didn't like that there were no TypeScript annotations for the return types of methods.
Because of this, I decided to build my own version of a youtube music api with TypeScript annotations, testing and written in a way I can understand.

## Features
20
-   TypeScript Support for data return types
    -   Data from YouTube can be inconsistent but YTMusic API has been tested and the data matches the TypeScript types 95% of the time
-   Scrape information directly from YouTube Music API
    -   Search Suggestions
    -   Songs
    -   Videos
    -   Artists
    -   Albums
    -   Playlists

## Credits

A lot of the credit should go to [youtube-music-api](https://npmjs.com/package/youtube-music-api). I build this package as a refactored and tested version of youtube-music-api with TypeScript annotations

## Testing

YTMusic API's data return types are tested with Mocha. To run the tests, run the command

```
$ npm run test
```

## Built with

-   NodeJS
    -   TypeScript
        -   [![@types/json-schema](https://img.shields.io/badge/%40types%2Fjson--schema-%5E7.0.11-red?style=flat-square)](https://npmjs.com/package/@types/json-schema/v/7.0.11)
        -   [![@types/mocha](https://img.shields.io/badge/%40types%2Fmocha-%5E10.0.1-red?style=flat-square)](https://npmjs.com/package/@types/mocha/v/10.0.1)
        -   [![@types/node](https://img.shields.io/badge/%40types%2Fnode-%5E18.11.17-red?style=flat-square)](https://npmjs.com/package/@types/node/v/18.11.17)
        -   [![@types/tough-cookie](https://img.shields.io/badge/%40types%2Ftough--cookie-%5E4.0.2-red?style=flat-square)](https://npmjs.com/package/@types/tough-cookie/v/4.0.2)
        -   [![typescript](https://img.shields.io/badge/typescript-%5E4.9.4-red?style=flat-square)](https://npmjs.com/package/typescript/v/4.9.4)
    -   Mocha
        -   [![mocha](https://img.shields.io/badge/mocha-%5E10.2.0-red?style=flat-square)](https://npmjs.com/package/mocha/v/10.2.0)
        -   [![mocha.parallel](https://img.shields.io/badge/mocha.parallel-%5E0.15.6-red?style=flat-square)](https://npmjs.com/package/mocha.parallel/v/0.15.6)
        -   [![ts-mocha](https://img.shields.io/badge/ts--mocha-%5E10.0.0-red?style=flat-square)](https://npmjs.com/package/ts-mocha/v/10.0.0)
    -   VuePress
        -   [![@vuepress/plugin-search](https://img.shields.io/badge/%40vuepress%2Fplugin--search-%5E2.0.0--beta.46-red?style=flat-square)](https://npmjs.com/package/@vuepress/plugin-search/v/2.0.0-beta.46)
        -   [![vuepress](https://img.shields.io/badge/vuepress-%5E2.0.0--beta.46-red?style=flat-square)](https://npmjs.com/package/vuepress/v/2.0.0-beta.46)
    -   Miscellaneous
        -   [![axios](https://img.shields.io/badge/axios-%5E0.27.2-red?style=flat-square)](https://npmjs.com/package/axios/v/0.27.2)
        -   [![tough-cookie](https://img.shields.io/badge/tough--cookie-%5E4.1.2-red?style=flat-square)](https://npmjs.com/package/tough-cookie/v/4.1.2)
        -   [![zod](https://img.shields.io/badge/zod-%5E3.20.2-red?style=flat-square)](https://npmjs.com/package/zod/v/3.20.2)
        -   [![zod-to-json-schema](https://img.shields.io/badge/zod--to--json--schema-%5E3.20.1-red?style=flat-square)](https://npmjs.com/package/zod-to-json-schema/v/3.20.1)
