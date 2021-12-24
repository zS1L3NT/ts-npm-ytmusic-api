import YTMusic from "./YTMusic"

const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	ytmusic.search("Lilac").then(res => {
		// ytmusic.getPlaylist(res[0].playlistId).then(res => {
			
		// })
	})
})
