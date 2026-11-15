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
export const watch = (id: string, musicVideoType?: string) => ({
	watchEndpoint: {
		videoId: id,
		watchEndpointMusicSupportedConfigs: { watchEndpointMusicConfig: { musicVideoType } },
	},
})
export const link = (text: string, id: string, pageType: string) => ({
	text,
	navigationEndpoint: browse(id, pageType),
})
export const artistLink = (name: string, id = `UC${name.replaceAll(" ", "")}`) =>
	link(name, id, "MUSIC_PAGE_TYPE_ARTIST")
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
	navigationEndpoint: watch(videoId, "MUSIC_VIDEO_TYPE_ATV"),
}
export const separator = { text: " • " }

const column = (...runs: unknown[]) => ({
	musicResponsiveListItemFlexColumnRenderer: { text: { runs } },
})
export const listItem = (title: unknown, ...columns: unknown[][]) => ({
	flexColumns: [column(title), ...columns.map(runs => column(...runs))],
	thumbnail: { thumbnails },
})

export const songItem = {
	...listItem(titleRun, [
		{ text: "Song" },
		separator,
		artistRun,
		separator,
		albumRun,
		separator,
		{ text: "3:50" },
	]),
	playlistItemData: { videoId },
}
export const albumItem = {
	...listItem({ text: albumBasic.name }, [
		{ text: "Album" },
		separator,
		artistRun,
		separator,
		{ text: "2024" },
	]),
	navigationEndpoint: browse(albumId, "MUSIC_PAGE_TYPE_ALBUM"),
	overlay: { playlistId },
}

const row = (item: unknown) => ({ musicResponsiveListItemRenderer: item })
export const searchResponse = (...items: unknown[]) => ({
	contents: { musicShelfRenderer: { contents: items.map(row) } },
})
export const card = (title: unknown, subtitle: unknown[], ...items: unknown[]) => ({
	musicCardShelfRenderer: {
		title: { runs: [title] },
		subtitle: { runs: subtitle },
		contents: items.map(row),
	},
})
export const sections = (...sections: unknown[]) => ({
	contents: { sectionListRenderer: { contents: sections } },
})
export const section = (item: unknown) => ({ itemSectionRenderer: { contents: [row(item)] } })

export const nextPage = (continuation: string) => ({
	continuations: [{ nextContinuationData: { continuation } }],
})
export const rowsToken = (token: string) => ({
	continuationItemRenderer: { continuationEndpoint: { continuationCommand: { token } } },
})
export const playlistRows = (items: unknown[], token?: string) => ({
	musicPlaylistShelfRenderer: {
		contents: [...items.map(row), ...(token ? [rowsToken(token)] : [])],
	},
})

export const playlistHeader = (...facts: string[]) => ({
	contents: {
		tabs: [
			{
				musicResponsiveHeaderRenderer: {
					title: { runs: [{ text: "Example Playlist" }] },
					secondSubtitle: {
						runs: facts.flatMap((text, i) => (i ? [separator, { text }] : [{ text }])),
					},
				},
			},
		],
	},
})

export const twoRow = (title: unknown, subtitle: unknown[], navigationEndpoint?: unknown) => ({
	musicTwoRowItemRenderer: {
		title: { runs: [title] },
		subtitle: { runs: subtitle },
		navigationEndpoint,
	},
})
export const shelf = (title: string, ...items: unknown[]) => ({
	musicCarouselShelfRenderer: {
		header: { musicCarouselShelfBasicHeaderRenderer: { title: { runs: [{ text: title }] } } },
		contents: items,
	},
})

export const timedLyrics = (...lines: [string, number, number][]) => ({
	timedLyricsModel: {
		lyricsData: {
			timedLyricsData: lines.map(([lyricLine, start, end]) => ({
				lyricLine,
				cueRange: { startTimeMilliseconds: `${start}`, endTimeMilliseconds: `${end}` },
			})),
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
