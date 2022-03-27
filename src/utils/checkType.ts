import Validator from "validate-any/dist/classes/Validator"
import { validate } from "validate-any"

export default <T>(data: T, validator: Validator<T>): T => {
	const result = validate(data, validator)
	if (result.success) {
		return result.data
	} else {
		console.error("Invalid data schema, please report as an issue", {
			expected: validator.formatSchema(),
			actual: data,
			errors: result.errors
		})
		return data
	}
}
