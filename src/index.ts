import YTMusic from "./YTMusic"

const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	ytmusic.search("Yours Raiden", "ALBUM").then(res => {
		console.log(JSON.stringify(res, null, 4))
	})
})
