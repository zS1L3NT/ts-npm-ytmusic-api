import YTMusic from "./YTMusic"

const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	ytmusic.search("Lilac", "PLAYLIST").then(res => {
		ytmusic.getPlaylist(res[0].playlistId).then(res => {
			console.log(res)
		})
	})
})
