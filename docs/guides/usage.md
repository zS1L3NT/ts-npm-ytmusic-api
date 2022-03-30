# Usage

YTMusic provides you many ways of fetching data from YouTube Music<br />
To leverage all the functions, we will need to create an instance of the class `YTMusic`.
Then, call the `initialize()` to initialize the API before using the API anywhere

```ts
const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	// Use API here
})
```
