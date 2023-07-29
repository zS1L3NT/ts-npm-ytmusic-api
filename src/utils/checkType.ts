import { z } from "zod"
import zodtojson from "zod-to-json-schema"

export default <T extends z.Schema>(data: z.infer<T>, schema: T): z.infer<T> => {
	const result = schema.safeParse(data)
	if (result.success) {
		return data
	} else {
		if ("error" in result) {
			console.error(
				"Invalid data schema, please report to https://github.com/zS1L3NT/ts-npm-ytmusic-api/issues/new/choose",
				JSON.stringify(
					{
						schema: zodtojson(schema),
						data,
						error: result.error,
					},
					null,
					2,
				),
			)
		}
		return data
	}
}
