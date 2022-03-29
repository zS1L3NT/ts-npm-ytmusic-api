# Getting Started

## Overview

YTMusic API is an npm package that scrapes data from YouTube Music and formats it for you.

## Installation

<CodeGroup>
<CodeGroupItem title="npm" active="true">

```bash:no-line-numbers
npm i ytmusic-api
```

</CodeGroupItem>
<CodeGroupItem title="yarn">

```bash:no-line-numbers
yarn add ytmusic-api
```

</CodeGroupItem>
<CodeGroupItem title="pnpm">

```bash:no-line-numbers
pnpm i ytmusic-api
```

</CodeGroupItem>
</CodeGroup>

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
