import YTMusic from "./YTMusic"

const ytmusic = new YTMusic()
ytmusic.initialize().then(() => {
	ytmusic.search("Yours Raiden", "ARTIST").then(res => {
		ytmusic.getArtistAlbums(res[0].artistId).then(res => {
			
		})
	})
})
