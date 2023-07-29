import traverse from "./traverse"

export default (data: any, ...keys: string[]) =>
	(index = 0): string => {
		const value = traverse(data, ...keys)
		const flatValue = [value].flat().at(index)
		return flatValue || ""
	}
