import { MUSIC_EXPLICIT_BADGE, PageType } from "../constants"
import { traverseList, traverseString } from "./traverse"

export const isArtist = (data: any) => {
	return [PageType.MUSIC_PAGE_TYPE_USER_CHANNEL, PageType.MUSIC_PAGE_TYPE_ARTIST].includes(
		traverseString(data, "pageType") as PageType,
	)
}

export const isAlbum = (data: any) => {
	return traverseString(data, "pageType") === PageType.MUSIC_PAGE_TYPE_ALBUM
}

export const isDuration = (data: any) => {
	return /^(\d{1,2}:)?\d{1,2}:\d{2}$/.test(traverseString(data, "text"))
}

export const isYear = (data: any) => {
	return /^\d{4}$/.test(traverseString(data, "text"))
}

export const isExplicit = (data: any) => {
	return [data?.badges, data?.subtitleBadges].some(badges =>
		traverseList(badges, "iconType").includes(MUSIC_EXPLICIT_BADGE),
	)
}
