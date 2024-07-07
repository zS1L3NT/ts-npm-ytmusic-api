import { ZodType } from "zod"
import { zodToJsonSchema } from "zod-to-json-schema"

export default <T>(data: T, type: ZodType<T>): T => {
	const result = type.safeParse(data)

	if (result.error) {
		console.error(
			"Invalid data type, please report to https://github.com/zS1L3NT/ts-npm-ytmusic-api/issues/new/choose",
			JSON.stringify(
				{
					data,
					schema: zodToJsonSchema(type, "schema"),
					error: result.error,
				},
				null,
				2,
			),
		)
	}

	return data
}
