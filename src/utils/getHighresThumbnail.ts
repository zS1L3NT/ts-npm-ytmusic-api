import { ThumbnailFull } from "../types"

/**
 * Generates the highest resolution thumbnail for a given list of thumbnails.
 * @param thumbnails Must be thumbnails from the same content for the expected result.
 * @returns The highest resolution thumbnail or null if existing thumbnail has greater resolution.
 */
export default function getHighresThumbnail(
    thumbnails: ThumbnailFull[],
): ThumbnailFull | null {
    if (thumbnails.length === 0) return null

    // Get the highest resolution thumbnail given in the list
    const highestOriginalThumb: ThumbnailFull = thumbnails.reduce(
        (prev, curr) =>
            curr.width * curr.height > prev.width * prev.height ? curr : prev,
    )

    let url: string = highestOriginalThumb.url
    let width: number = highestOriginalThumb.width
    let height: number = highestOriginalThumb.height
    const host: string = new URL(url).host

    switch (host) {
        case "lh3.googleusercontent.com":
            // Expected original url: https://lh3.googleusercontent.com/<some data>=w<original width>-h<original height>-p-l90-rj
            // Example of new url: https://lh3.googleusercontent.com/<some data>=w<max width>
            width = 1200
            height = width
            url = url.split("=w")[0] + `=w${width}`
            break

        case "yt3.googleusercontent.com":
            // Expected original url: https://yt3.googleusercontent.com/<some data>=s<original width>
            // Example of new url: https://yt3.googleusercontent.com/<some data>=w<max width>
            width = 1200
            height = width
            url = url.split("=s")[0] + `=w${width}`
            break

        case "i.ytimg.com":
            // Expected original url: https://i.ytimg.com/vi/<some data>/sddefault.jpg?sqp=<some data>
            // Example of new url: https://i.ytimg.com/vi/<some data>/maxresdefault.jpg
            width = 1280
            height = 720
            url = url.replace("sddefault", "maxresdefault")
            url = url.includes("?") ? url.split("?")[0]! : url
            break

        default:
            // Unknown host => do nothing
            // You can log the host to the console and, if possible, add a case for extracting a higher resolution thumbnail from it.
            // console.log(`DEBUG: Unknown host: '${host}'`)
            return null
    }

    const ifBetterQuality: boolean =
        width * height >
        highestOriginalThumb.width * highestOriginalThumb.height
    return ifBetterQuality ? { url: url, width: width, height: height } : null
}
