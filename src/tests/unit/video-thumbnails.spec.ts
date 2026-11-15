import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import axios from "axios"
import YTMusic from "../../YTMusic"

const jpeg = (width: number, height: number) =>
	Uint8Array.from([
		0xff,
		0xd8,
		0xff,
		0xe0,
		0,
		2,
		0xff,
		0xc0,
		0,
		7,
		8,
		height >> 8,
		height & 255,
		width >> 8,
		width & 255,
	]).buffer
const thumbnails = [
	{ url: "https://i.ytimg.com/vi_webp/mGsOHanQwxk/hq720.webp?sqp=old", width: 480, height: 360 },
]
afterEach(() => mock.restore())

describe("Verified video thumbnails (#62)", () => {
	it("reads actual image dimensions without forwarding account cookies", async () => {
		const get = spyOn(axios, "get").mockResolvedValue({ data: jpeg(1920, 1080) })
		const api = new YTMusic()
		expect(await api.getHighresThumbnail(thumbnails)).toEqual({
			url: "https://i.ytimg.com/vi/mGsOHanQwxk/maxresdefault.jpg",
			width: 1920,
			height: 1080,
		})
		expect(get.mock.calls[0]?.[1]).toMatchObject({
			withCredentials: false,
			maxRedirects: 0,
			responseType: "arraybuffer",
		})
		expect(thumbnails).toHaveLength(1)
	})

	it("returns null when the larger image is absent or the request fails", async () => {
		const get = spyOn(axios, "get").mockRejectedValue(new Error("404"))
		expect(await new YTMusic().getHighresThumbnail(thumbnails)).toBeNull()
		expect(get).toHaveBeenCalledTimes(1)
	})

	it.each([
		[new Uint8Array().buffer],
		[jpeg(120, 120)],
		[Uint8Array.from([0xff, 0xd8, 0xff, 0xc0, 0xff, 0xff]).buffer],
	])("ignores invalid or smaller images", async data => {
		spyOn(axios, "get").mockResolvedValue({ data })
		expect(await new YTMusic().getHighresThumbnail(thumbnails)).toBeNull()
	})

	it("does not request arbitrary hosts or malformed video IDs", async () => {
		const get = spyOn(axios, "get")
		const api = new YTMusic()
		expect(await api.getHighresThumbnail([])).toBeNull()
		expect(
			await api.getHighresThumbnail([
				{ url: "https://example.com/vi/mGsOHanQwxk/hqdefault.jpg", width: 1, height: 1 },
			]),
		).toBeNull()
		expect(get).not.toHaveBeenCalled()
	})
})
