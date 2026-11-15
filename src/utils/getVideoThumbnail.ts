import axios from "axios"
import { ThumbnailFull } from "../types"

export default async function getVideoThumbnail(
	thumbnails: ThumbnailFull[],
): Promise<ThumbnailFull | null> {
	const source = thumbnails
		.filter(image =>
			/^https:\/\/i\.ytimg\.com\/vi(?:_webp)?\/[a-zA-Z0-9_-]{11}\//.test(image.url),
		)
		.sort((a, b) => b.width * b.height - a.width * a.height)[0]
	if (!source) return null
	const videoId = source.url.match(/\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})\//)![1]
	const url = `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`
	try {
		// Use a separate request so account cookies never reach the image host.
		const response = await axios.get<ArrayBuffer>(url, {
			responseType: "arraybuffer",
			timeout: 10_000,
			maxContentLength: 5_000_000,
			withCredentials: false,
			maxRedirects: 0,
		})
		const size = jpegSize(new Uint8Array(response.data))
		if (!size || size.width * size.height <= source.width * source.height) return null
		return { url, ...size }
	} catch {
		return null
	}
}

function jpegSize(bytes: Uint8Array): { width: number; height: number } | null {
	if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return null
	let offset = 2
	while (offset + 3 < bytes.length) {
		if (bytes[offset] !== 0xff) return null
		while (bytes[offset] === 0xff) offset++
		const marker = bytes[offset++]!
		if (marker === 0xd9 || marker === 0xda) return null
		if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue
		const length = bytes[offset]! * 256 + bytes[offset + 1]!
		if (length < 2 || offset + length > bytes.length) return null
		if (
			[0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(
				marker,
			) &&
			length >= 7
		) {
			const height = bytes[offset + 3]! * 256 + bytes[offset + 4]!
			const width = bytes[offset + 5]! * 256 + bytes[offset + 6]!
			return width > 0 && height > 0 ? { width, height } : null
		}
		offset += length
	}
	return null
}
