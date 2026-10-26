export const videoId = "mGsOHanQwxk"
export const artistId = "UCfixtureartist"
export const albumId = "MPREb_fixturealbum"
export const playlistId = "PLfixtureplaylist"
export const thumbnails = [{ url: "https://example.com/cover.jpg", width: 120, height: 120 }]
export const artistBasic = { artistId, name: "Example Artist" }
export const albumBasic = { albumId, name: "Example Album" }

export const browse = (browseId: string, pageType: string) => ({
	browseEndpoint: {
		browseId,
		browseEndpointContextSupportedConfigs: { browseEndpointContextMusicConfig: { pageType } },
	},
})
export const artistRun = {
	text: artistBasic.name,
	navigationEndpoint: browse(artistId, "MUSIC_PAGE_TYPE_ARTIST"),
}
export const albumRun = {
	text: albumBasic.name,
	navigationEndpoint: browse(albumId, "MUSIC_PAGE_TYPE_ALBUM"),
}
export const titleRun = {
	text: "Example Song",
	navigationEndpoint: {
		watchEndpoint: {
			videoId,
			watchEndpointMusicSupportedConfigs: {
				watchEndpointMusicConfig: { musicVideoType: "MUSIC_VIDEO_TYPE_ATV" },
			},
		},
	},
}
const column = (...runs: unknown[]) => ({
	musicResponsiveListItemFlexColumnRenderer: { text: { runs } },
})
const separator = { text: " • " }

export const songItem = {
	flexColumns: [
		column(titleRun),
		column({ text: "Song" }, separator, artistRun, separator, albumRun, separator, {
			text: "3:50",
		}),
	],
	fixedColumns: [column({ text: "3:50" })],
	playlistItemData: { videoId },
	playNavigationEndpoint: titleRun.navigationEndpoint,
	thumbnail: { thumbnails },
}
export const videoItem = {
	...songItem,
	flexColumns: [
		column({ ...titleRun, text: "Example Video" }),
		column({ text: "Video" }, separator, artistRun, separator, { text: "3:50" }),
	],
}
export const artistItem = {
	flexColumns: [column({ text: artistBasic.name }), column({ text: "Artist" })],
	navigationEndpoint: browse(artistId, "MUSIC_PAGE_TYPE_ARTIST"),
	thumbnail: { thumbnails },
}
export const albumItem = {
	flexColumns: [
		column({ text: albumBasic.name }),
		column({ text: "Album" }, separator, artistRun, separator, { text: "2024" }),
	],
	navigationEndpoint: browse(albumId, "MUSIC_PAGE_TYPE_ALBUM"),
	overlay: { playlistId },
	thumbnail: { thumbnails },
}
export const playlistItem = {
	flexColumns: [
		column({ text: "Example Playlist" }),
		column({ text: "Playlist" }, separator, artistRun),
	],
	overlay: { playlistId },
	thumbnail: { thumbnails },
}
export const searchResponse = (...items: unknown[]) => ({
	contents: {
		musicShelfRenderer: {
			contents: items.map(item => ({ musicResponsiveListItemRenderer: item })),
		},
	},
})

export const playerResponse = {
	playabilityStatus: { status: "OK" },
	videoDetails: {
		videoId,
		title: "Example Song",
		author: artistBasic.name,
		channelId: artistId,
		lengthSeconds: "230",
		thumbnail: { thumbnails },
	},
	microformat: {
		playerMicroformatRenderer: {
			unlisted: false,
			familySafe: true,
			paid: false,
			tags: ["music"],
		},
	},
	streamingData: { formats: [{ itag: 18 }], adaptiveFormats: [{ itag: 140 }] },
}

export const albumRow = {
	title: { runs: [albumRun] },
	subtitle: { runs: [{ text: "2024" }] },
	thumbnail: { thumbnails },
	navigationEndpoint: browse(albumId, "MUSIC_PAGE_TYPE_ALBUM"),
	thumbnailOverlay: { playlistId },
	musicPlayButtonRenderer: { playlistId },
}
export const albumResponse = {
	contents: {
		tabs: [
			{
				musicResponsiveHeaderRenderer: {
					title: { runs: [{ text: albumBasic.name }] },
					straplineTextOne: { runs: [artistRun] },
					subtitle: { runs: [{ text: "Album" }, separator, { text: "2024" }] },
				},
			},
		],
		musicShelfRenderer: { contents: [{ musicResponsiveListItemRenderer: songItem }] },
	},
	background: { thumbnails },
	musicPlayButtonRenderer: { playlistId },
}
export const playlistResponse = {
	contents: {
		tabs: [
			{
				musicResponsiveHeaderRenderer: {
					title: { runs: [{ text: "Example Playlist" }] },
					straplineTextOne: { runs: [artistRun] },
					secondSubtitle: {
						runs: [{ text: "100 views" }, separator, { text: "2 songs" }],
					},
					thumbnail: { thumbnails },
				},
			},
		],
		musicPlaylistShelfRenderer: { contents: [{ musicResponsiveListItemRenderer: songItem }] },
	},
}
export const artistResponse = {
	header: {
		musicImmersiveHeaderRenderer: {
			title: { runs: [{ text: artistBasic.name }] },
			thumbnail: { thumbnails },
		},
	},
	contents: [
		{
			musicShelfRenderer: {
				title: {
					runs: [
						{
							text: "Songs",
							navigationEndpoint: { browseEndpoint: { browseId: "artist-songs" } },
						},
					],
				},
				contents: [{ musicResponsiveListItemRenderer: songItem }],
			},
		},
		{
			musicCarouselShelfRenderer: {
				moreContentButton: {
					browseEndpoint: { browseId: "artist-albums", params: "albums" },
				},
				contents: [{ musicTwoRowItemRenderer: albumRow }],
			},
		},
		{ musicCarouselShelfRenderer: { contents: [{ musicTwoRowItemRenderer: albumRow }] } },
		{
			musicCarouselShelfRenderer: {
				contents: [
					{
						musicTwoRowItemRenderer: {
							title: { runs: [titleRun] },
							thumbnail: { thumbnails },
						},
					},
				],
			},
		},
		{
			musicCarouselShelfRenderer: {
				contents: [
					{
						musicTwoRowItemRenderer: {
							title: { runs: [{ text: "Featured playlist" }] },
							navigationEndpoint: { browseEndpoint: { browseId: playlistId } },
							thumbnail: { thumbnails },
						},
					},
				],
			},
		},
		{
			musicCarouselShelfRenderer: {
				contents: [
					{
						musicTwoRowItemRenderer: {
							title: { runs: [artistRun] },
							thumbnail: { thumbnails },
						},
					},
				],
			},
		},
	],
}
