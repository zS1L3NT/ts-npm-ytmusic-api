const traverse = (data: any, keys: string[], single: boolean = false) => {
	const again = (data: any, key: string): any => {
		let res = []

		if (data instanceof Object && key in data) {
			if (single) return data[key]
			res.push(data[key])
		}

		if (data instanceof Array) {
			res.push(...data.map(v => again(v, key)).flat())
		} else if (data instanceof Object) {
			res.push(
				...Object.keys(data)
					.map(k => again(data[k], key))
					.flat()
			)
		}

		return res
	}

	let value = data
	for (const key of keys) {
		value = again(value, key)
	}
	
	return value
}

traverse(require("./data.json")[0], ["playNavigationEndpoint", "videoId"], true)

export default {}
