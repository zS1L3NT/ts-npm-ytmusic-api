# Getting Started

## Overview

YTMusic API is an npm package that scrapes data from YouTube Music and formats it for you.

## Installation

<code-group>
<code-block title="npm">
```bash
npm i ytmusic-api
```
</code-block>

<code-block title="yarn">
```bash
yarn add ytmusic-api
```
</code-block>

<code-block title="pnpm">
```bash
pnpm i ytmusic-api
```
</code-block>
</code-group>

## Usage

Import YTMusic from the npm package

```ts
// ES6 Import
import YTMusic from "ytmusic-api"

// Node Require
const YTMusic = require("ytmusic-api")
```

Create an instance of the class `YTMusic`.
Then, call the `initialize()` to initialize the API before using the API anywhere

```ts
const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	// Use API here
})
```
