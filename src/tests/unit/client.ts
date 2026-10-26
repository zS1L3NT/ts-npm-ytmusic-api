import { mock } from "bun:test"
import type { AxiosInstance, InternalAxiosRequestConfig } from "axios"
import YTMusic from "../../index"

export const config = {
	INNERTUBE_API_KEY: "fixture-key",
	INNERTUBE_API_VERSION: "v1",
	INNERTUBE_CLIENT_NAME: "WEB_REMIX",
	INNERTUBE_CLIENT_VERSION: "1.20260101.01.00",
	INNERTUBE_CONTEXT_CLIENT_NAME: "67",
	VISITOR_DATA: "fixture-visitor",
	GL: "US",
	HL: "en",
}
export const configHTML = `<script>ytcfg.set(${JSON.stringify(config)});</script>`

export const createAPI = (...responses: unknown[]) => {
	const api = new YTMusic()
	const client = (api as unknown as { client: AxiosInstance }).client
	let index = 0
	const adapter = mock(async (request: InternalAxiosRequestConfig) => {
		if (index >= responses.length)
			throw new Error(`Unexpected request: ${request.method} ${request.url?.split("?")[0]}`)
		return {
			data: responses[index++],
			status: 200,
			statusText: "OK",
			headers: {},
			config: request,
		}
	})
	client.defaults.adapter = adapter
	return { api, client, adapter }
}

export const setup = async (...responses: unknown[]) => {
	const result = createAPI(configHTML, ...responses)
	await result.api.initialize()
	return result
}
