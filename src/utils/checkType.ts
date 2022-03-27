import Validator from "validate-any/dist/classes/Validator"
import { validate } from "validate-any"

export default <T>(data: T, validator: Validator<T>): T => {
	const result = validate(data, validator)
	if (result.success) {
		return result.data
	} else {
		console.error(
			"Invalid data schema, please report to https://github.com/zS1L3NT/ts-npm-ytmusic-api/issues/new/choose",
			JSON.stringify(
				{
					expected: validator.getSchema(),
					actual: data,
					errors: result.errors
				},
				null,
				2
			)
		)
		return data
	}
}
