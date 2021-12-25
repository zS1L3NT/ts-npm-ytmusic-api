import YTMusic from "./YTMusic"

const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	ytmusic.search("Lilac", "ALBUM").then(res => {
		ytmusic.getAlbum(res[0].albumId).then(res => {
			console.log(res)
		})
	})
})
