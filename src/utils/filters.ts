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

/**
 * Identifies the content category of a raw `musicCarouselShelfRenderer` object
 * by reading its header title.  Matching is case-insensitive and language-tolerant
 * (YouTube may localise titles).
 *
 * @returns One of: "albums" | "singles" | "videos" | "playlists" | "similar" | "unknown"
 */
export const identifyCarouselType = (carousel: any): string => {
	const title = traverseString(
		carousel,
		"header",
		"musicCarouselShelfBasicHeaderRenderer",
		"title",
		"runs",
		"text",
	).toLowerCase()

	if (title.includes("album")) return "albums"
	if (title.includes("single") || title.includes("ep")) return "singles"
	if (title.includes("video")) return "videos"
	if (title.includes("playlist") || title.includes("featured")) return "playlists"
	if (title.includes("artist") || title.includes("similar") || title.includes("fans"))
		return "similar"

	return "unknown"
}
