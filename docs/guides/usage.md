# Usage

YTMusic provides you with many ways of fetching data from YouTube Music<br />
To leverage all the functions, we will need to create an instance of the class `YTMusic`.
Then, call the `initialize()` to initialize the API before using the API anywhere

```ts
const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	// Use API here
})
```

In an async context, you can initialize the API in one line

```ts
const ytmusic = await new YTMusic().initialize()
// Use API here
```

## Custom Cookies

If you want to use your own cookies for all requests, you can do so like this

```ts
const ytmusic = await new YTMusic()
	.initialize("COOKIES=here; COOKIES=here; COOKIES=here")
```