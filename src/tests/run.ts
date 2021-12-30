import YTMusic from "../YTMusic"

const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	ytmusic.search("Lilac", "SONG").then(res => {
		ytmusic.getSong(res.find(r => !!r.videoId)!.videoId!).then(res => {
			console.log(res)
		})
	})
})
