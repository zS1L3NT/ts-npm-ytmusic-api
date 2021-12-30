import YTMusicApi from "../Api"

const ytmusic = new YTMusicApi()
ytmusic.initialize().then(() => {
	ytmusic.search("Lilac", "SONG").then(res => {
		ytmusic.getSong(res.find(r => !!r.videoId)!.videoId!).then(res => {
			console.log(res)
		})
	})
})
