import { describe, expect, it } from "bun:test"
import { config, configHTML, createAPI, setup } from "./client"

describe("Initialization", () => {
	it("returns the initialized instance and sends configuration headers", async () => {
		const { api, adapter } = createAPI(configHTML, { suggestions: [{ query: "example" }] })
		expect(await api.initialize({ GL: "DE", HL: "de" })).toBe(api)
		expect(await api.getSearchSuggestions("ex")).toEqual(["example"])
		const request = adapter.mock.calls[1]![0]
		const body = JSON.parse(request.data)
		expect(body).toMatchObject({
			input: "ex",
			context: {
				client: {
					clientName: "WEB_REMIX",
					clientVersion: config.INNERTUBE_CLIENT_VERSION,
					gl: "DE",
					hl: "de",
				},
			},
		})
		expect(request.headers.get("X-YouTube-Client-Name")).toBe("67")
		expect(request.headers.get("X-Goog-Visitor-Id")).toBe("fixture-visitor")
		expect(new URL(request.url!, request.baseURL).searchParams.get("key")).toBe("fixture-key")
	})

	it("merges multiple configuration blocks, including multiline JSON", async () => {
		const html = `<script>ytcfg.set(${JSON.stringify(config, null, 2)});ytcfg.set({"HL":"fr","INNERTUBE_CLIENT_VERSION":"updated"});</script>`
		const { api, adapter } = createAPI(html, {})
		await api.initialize()
		await api.getSearchSuggestions("query")
		expect(JSON.parse(adapter.mock.calls[1]![0].data).context.client).toMatchObject({
			hl: "fr",
			clientVersion: "updated",
			clientName: "WEB_REMIX",
		})
	})

	it("ignores malformed configuration blocks when a valid block follows", async () => {
		const { api } = createAPI(`ytcfg.set({bad});ytcfg.set(${JSON.stringify(config)});`)
		expect(await api.initialize()).toBe(api)
	})

	it("rejects a page without usable configuration", async () => {
		const { api } = createAPI("<html>Consent required</html>")
		await expect(api.initialize()).rejects.toThrow("configuration")
	})

	it("requires initialization before API requests", async () => {
		const { api, adapter } = createAPI()
		await expect(api.searchSongs("query")).rejects.toThrow("API not initialized")
		expect(adapter).not.toHaveBeenCalled()
	})

	it("does not mark a failed initialization as successful", async () => {
		const { api, adapter } = createAPI("<html>Consent required</html>")
		await expect(api.initialize()).rejects.toThrow("configuration")
		await expect(api.searchSongs("query")).rejects.toThrow("API not initialized")
		expect(adapter).toHaveBeenCalledTimes(1)
	})

	it("sends supplied cookies to the music host", async () => {
		const { api, adapter } = createAPI(configHTML, {})
		await api.initialize({ cookies: "session=fixture-session; preference=fixture-preference" })
		await api.getSearchSuggestions("query")
		expect(adapter.mock.calls[0]![0].headers.get("cookie")).toContain("session=fixture-session")
		expect(adapter.mock.calls[1]![0].headers.get("cookie")).toContain(
			"preference=fixture-preference",
		)
	})

	it("rejects malformed cookies before starting a request", async () => {
		const { api, adapter } = createAPI(configHTML)
		await expect(api.initialize({ cookies: "not-a-cookie" })).rejects.toThrow("Invalid cookie")
		expect(adapter).not.toHaveBeenCalled()
	})

	it("stores response cookies and sends them on the next request", async () => {
		const { api, adapter } = createAPI()
		adapter.mockImplementationOnce(async request => ({
			data: configHTML,
			status: 200,
			statusText: "OK",
			headers: { "set-cookie": ["session=response-session; Path=/; Secure"] },
			config: request,
		}))
		adapter.mockImplementationOnce(async request => ({
			data: {},
			status: 200,
			statusText: "OK",
			headers: {},
			config: request,
		}))
		await api.initialize()
		await api.getSearchSuggestions("query")
		expect(adapter.mock.calls[1]![0].headers.get("cookie")).toBe("session=response-session")
	})
})

describe("Request failures", () => {
	it("propagates transport failures instead of returning empty results", async () => {
		const { api, adapter } = await setup()
		adapter.mockRejectedValueOnce(new Error("Connection refused"))
		await expect(api.searchSongs("query")).rejects.toThrow("Connection refused")
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("sends endpoint paths and JSON bodies without corrupting query strings", async () => {
		const { api, adapter } = await setup({})
		await api.getSearchSuggestions("a & b + c")
		const request = adapter.mock.calls[1]![0]
		expect(new URL(request.url!, request.baseURL).pathname).toBe(
			"/youtubei/v1/music/get_search_suggestions",
		)
		expect(JSON.parse(request.data).input).toBe("a & b + c")
	})
})
