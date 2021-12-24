const traverse = (data: any, keys: string, single = false) => {
	const again = (data: any, key: string): any => {
		var res = []

		data.hasOwnProperty(key) && res.push(data[key])
		if (single && data.hasOwnProperty(key)) {
			return res.shift()
		}

		if (data instanceof Array) {
			for (let i = 0; i < data.length; i++) {
				res = res.concat(again(data[i], key))
			}
		} else if (data instanceof Object) {
			const c = Object.keys(data)
			if (c.length > 0) {
				for (let i = 0; i < c.length; i++) {
					res = res.concat(again(data[c[i]], key))
				}
			}
		}
		return res.length == 1 ? res.shift() : res
	}

	let z = keys.split(":"),
		value = data
	for (let i = 0; i < z.length; i++) {
		value = again(value, z[i])
	}
	console.log(value)
}

traverse(require("./data.json"), "playNavigationEndpoint:videoId")

export default {}
