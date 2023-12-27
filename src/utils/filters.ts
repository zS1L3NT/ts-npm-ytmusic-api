import { traverseString } from "./traverse"

export const isTitle = (data: any) => {
	return traverseString(data, "musicVideoType").startsWith("MUSIC_VIDEO_TYPE_")
}

export const isArtist = (data: any) => {
	return ["MUSIC_PAGE_TYPE_USER_CHANNEL", "MUSIC_PAGE_TYPE_ARTIST"].includes(
		traverseString(data, "pageType"),
	)
}

export const isAlbum = (data: any) => {
	return traverseString(data, "pageType") === "MUSIC_PAGE_TYPE_ALBUM"
}

export const isDuration = (data: any) => {
	return traverseString(data, "text").match(/(\d{1,2}:)?\d{1,2}:\d{1,2}/)
}
