# YTMusic API

![License](https://img.shields.io/github/license/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Languages](https://img.shields.io/github/languages/count/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Top Language](https://img.shields.io/github/languages/top/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Commit Activity](https://img.shields.io/github/commit-activity/y/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge) ![Last commit](https://img.shields.io/github/last-commit/zS1L3NT/ts-npm-ytmusic-api?style=for-the-badge)

YouTube Music API (Unofficial) is a YouTube Music data scraper. It comes with TypeScript support API for return types. The NPM package can be found [here](https://npmjs.com/package/ytmusic-api)

**Full documentation is available [here](http://ytmusic-api.zectan.com).**

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

## Credits

A lot of the credit should go to [youtube-music-api](https://npmjs.com/package/youtube-music-api). I build this package as a refactored and tested version of youtube-music-api with TypeScript annotations

## Testing

YTMusic API's data return types are tested with Mocha. To run the tests, run the command

```
$ npm run test
```

## Built with

-   TypeScript
    -   [![@types/mocha](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/@types/mocha?style=flat-square)](https://npmjs.com/package/@types/mocha)
    -   [![@types/node](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/@types/node?style=flat-square)](https://npmjs.com/package/@types/node)
    -   [![@types/tough-cookie](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/@types/tough-cookie?style=flat-square)](https://npmjs.com/package/@types/tough-cookie)
    -   [![typescript](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/typescript?style=flat-square)](https://npmjs.com/package/typescript)
-   Axios
    -   [![axios](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/axios?style=flat-square)](https://npmjs.com/package/axios)
-   Tough Cookie
    -   [![tough-cookie](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/tough-cookie?style=flat-square)](https://npmjs.com/package/tough-cookie)
-   Mocha
    -   [![mocha](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/mocha?style=flat-square)](https://npmjs.com/package/mocha)
    -   [![mocha.parallel](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/mocha.parallel?style=flat-square)](https://npmjs.com/package/mocha.parallel)
    -   [![ts-mocha](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/ts-mocha?style=flat-square)](https://npmjs.com/package/ts-mocha)
-   VuePress
    -   [![@vuepress/plugin-search](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/@vuepress/plugin-search?style=flat-square)](https://npmjs.com/package/@vuepress/plugin-search)
    -   [![vuepress](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/dev/vuepress?style=flat-square)](https://npmjs.com/package/vuepress)
-   Miscellaneous
    -   [![validate-any](https://img.shields.io/github/package-json/dependency-version/zS1L3NT/ts-npm-ytmusic-api/validate-any?style=flat-square)](https://npmjs.com/package/validate-any)
