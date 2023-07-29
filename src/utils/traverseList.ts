import traverse from "./traverse"

export default (data: any, ...keys: string[]): any[] => {
	const value = traverse(data, ...keys)
	const flatValue = [value].flat()
	return flatValue
}
