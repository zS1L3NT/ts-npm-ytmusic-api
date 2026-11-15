import { HomeSection, SearchResult } from "../types"
import checkType from "../utils/checkType"
import { traverseList, traverseString } from "../utils/traverse"
import SearchParser from "./SearchParser"

export default class HomeSectionParser {
	public static parse(data: any): HomeSection {
		return checkType(
			{
				title: traverseString(data, "header", "title", "text"),
				contents: traverseList(data, "contents")
					.flatMap(item => Object.values<any>(item))
					.map(item => SearchParser.parseItem(item))
					.filter((item): item is SearchResult => item !== null),
			},
			HomeSection,
		)
	}
}
