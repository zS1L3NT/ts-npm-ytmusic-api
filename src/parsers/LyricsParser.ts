import { z } from "zod"

import { TimedLyric } from "../types"
import checkType from "../utils/checkType"
import { traverseList } from "../utils/traverse"

export default class LyricsParser {
	public static parse(data: any): string[] | null {
		const lyrics = traverseList(data, "description", "runs", "text")
			.filter(value => typeof value === "string")
			.join("")
			.replaceAll("\r", "")
			.split("\n")
			.filter(Boolean)

		return lyrics.length ? lyrics : null
	}

	public static parseTimed(data: any): TimedLyric[] | null {
		// Each model repeats the lyrics, so only the first is read
		const lines = traverseList(traverseList(data, "timedLyricsModel")[0], "timedLyricsData")

		return lines.length
			? checkType(
					lines.map(line => ({
						text: line.lyricLine,
						startTime: +line.cueRange?.startTimeMilliseconds,
						endTime: +line.cueRange?.endTimeMilliseconds,
					})),
					z.array(TimedLyric),
				)
			: null
	}
}
