import { afterEach, describe, expect, it, mock, spyOn } from "bun:test"
import { createHash } from "node:crypto"
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios"
import YTMusic from "../../YTMusic"
import { RequestError } from "../../index"
import { timedLyrics } from "../fixtures/responses"
import real from "../fixtures/youtube-music.json"
import { config, configHTML, createAPI, setup } from "./client"

afterEach(() => mock.restore())

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

	it("sends __Secure- prefixed cookies", async () => {
		const { api, adapter } = createAPI(configHTML, {})
		await api.initialize({ cookies: "__Secure-3PSID=secure-session; plain=value" })
		await api.getSearchSuggestions("query")
		for (const [request] of adapter.mock.calls) {
			expect(request.headers.get("cookie")).toContain("__Secure-3PSID=secure-session")
			expect(request.headers.get("cookie")).toContain("plain=value")
		}
	})

	it("keeps going when a response sets a cookie for another domain", async () => {
		const { api, adapter } = createAPI()
		adapter.mockImplementationOnce(async request => ({
			data: configHTML,
			status: 200,
			statusText: "OK",
			headers: {
				"set-cookie": ["foreign=1; Domain=www.youtube.com; Path=/", "kept=2; Path=/"],
			},
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
		expect(adapter.mock.calls[1]![0].headers.get("cookie")).toBe("kept=2")
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

describe("Authentication", () => {
	const time = 1_700_000_000
	const hash = (sapisid: string) =>
		createHash("sha1").update(`${time} ${sapisid} https://music.youtube.com`).digest("hex")

	it.each(["SAPISID", "__Secure-3PAPISID"])(
		"signs requests with the hash of the session's %s cookie",
		async name => {
			spyOn(Date, "now").mockReturnValue(time * 1000 + 500)
			const { api, adapter } = createAPI(configHTML, {})
			await api.initialize({ cookies: `other=1; ${name}=session-secret` })
			await api.getSearchSuggestions("query")
			const [html, request] = adapter.mock.calls.map(([request]) => request.headers)
			expect(request!.get("Authorization")).toBe(
				`SAPISIDHASH ${time}_${hash("session-secret")}`,
			)
			expect(request!.get("X-Goog-AuthUser")).toBe("0")
			expect(html!.get("Authorization")).toBeUndefined()
		},
	)

	it("tells YouTube which signed-in account the session uses", async () => {
		const html = `<script>ytcfg.set(${JSON.stringify({ ...config, SESSION_INDEX: "2" })});</script>`
		const { api, adapter } = createAPI(html, {})
		await api.initialize({ cookies: "SAPISID=session-secret" })
		await api.getSearchSuggestions("query")
		expect(adapter.mock.calls[1]![0].headers.get("X-Goog-AuthUser")).toBe("2")
	})

	it.each([undefined, "plain=1; SID=not-the-hash-cookie"])(
		"sends no authorization without a SAPISID cookie (%p)",
		async cookies => {
			const { api, adapter } = createAPI(configHTML, {})
			await api.initialize(cookies ? { cookies } : {})
			await api.getSearchSuggestions("query")
			const request = adapter.mock.calls[1]![0]
			expect(request.headers.get("Authorization")).toBeUndefined()
			expect(request.headers.get("X-Goog-AuthUser")).toBeUndefined()
		},
	)

	it("keeps the mobile-client request signed out even when signed in", async () => {
		const { api, adapter } = createAPI(configHTML, real.next, timedLyrics(["Line", 0, 1]))
		await api.initialize({ cookies: "SAPISID=session-secret; plain=1" })
		await api.getTimedLyrics("3QZOazpGIQc")
		const [, web, mobile] = adapter.mock.calls.map(([request]) => request.headers)
		expect(web!.get("cookie")).toContain("SAPISID=session-secret")
		expect(web!.get("Authorization")).toMatch(/^SAPISIDHASH \d+_[0-9a-f]{40}$/)
		expect(mobile!.get("cookie")).toBeUndefined()
		expect(mobile!.get("Authorization")).toBeUndefined()
		expect(mobile!.get("X-Goog-AuthUser")).toBeUndefined()
	})

	it("sends the music origin with every API request", async () => {
		const { api, adapter } = await setup({})
		await api.getSearchSuggestions("query")
		const headers = adapter.mock.calls[1]![0].headers
		expect(headers.get("Origin")).toBe("https://music.youtube.com")
		expect(headers.get("X-Origin")).toBe("https://music.youtube.com")
	})

	it("leaves the global axios defaults alone", () => {
		const before = JSON.stringify(axios.defaults)
		const api = new YTMusic()
		expect(JSON.stringify(axios.defaults)).toBe(before)
		expect(axios.defaults.baseURL).toBeUndefined()
		expect(axios.defaults.withCredentials).toBeFalsy()
		expect(axios.defaults.headers.common).not.toHaveProperty("User-Agent")
		expect(api).toBeInstanceOf(YTMusic)
	})
})

describe("Session safety", () => {
	it("removes the session from errors before they reach the caller", async () => {
		const { api, adapter } = createAPI(configHTML)
		await api.initialize({ cookies: "SAPISID=fixture-sapisid" })
		adapter.mockImplementationOnce(async request => {
			throw Object.assign(new Error("Bad Request"), { config: request })
		})
		const error = await api.searchSongs("query").catch(error => error)
		expect(error.message).toBe("Bad Request")
		expect(error.config.headers.get("cookie")).toBeUndefined()
		expect(error.config.headers.get("Authorization")).toBeUndefined()
	})

	it("replaces a supplied cookie when YouTube renews it for the whole site", async () => {
		const { api, adapter } = createAPI()
		adapter.mockImplementationOnce(async request => ({
			data: configHTML,
			status: 200,
			statusText: "OK",
			headers: { "set-cookie": ["SAPISID=renewed; Domain=.youtube.com; Path=/; Secure"] },
			config: request,
		}))
		adapter.mockImplementationOnce(async request => ({
			data: {},
			status: 200,
			statusText: "OK",
			headers: {},
			config: request,
		}))
		await api.initialize({ cookies: "SAPISID=supplied" })
		await api.getSearchSuggestions("query")
		expect(adapter.mock.calls[1]![0].headers.get("cookie")).toBe("SAPISID=renewed")
	})
})

describe("Retries and request errors", () => {
	const failure =
		(status?: number, data?: unknown) => async (config: InternalAxiosRequestConfig) => {
			const response = status
				? { status, statusText: "", headers: {}, config, data }
				: undefined
			throw new AxiosError("Request failed", "ERR", config, null, response)
		}

	it.each([[429], [503], [undefined]])("retries a failure with status %p", async status => {
		const { api, adapter } = createAPI(configHTML, { suggestions: [{ query: "example" }] })
		await api.initialize({ retry: { delay: 0 } })
		adapter.mockImplementationOnce(failure(status)).mockImplementationOnce(failure(status))
		expect(await api.getSearchSuggestions("ex")).toEqual(["example"])
		expect(adapter).toHaveBeenCalledTimes(4)
	})

	it("gives up after the configured retries with a typed error", async () => {
		const { api, adapter } = createAPI(configHTML)
		await api.initialize({
			cookies: "SAPISID=fixture-sapisid",
			retry: { retries: 1, delay: 0 },
		})
		adapter.mockImplementation(failure(503))
		const error = await api.searchSongs("query").catch(error => error)
		expect(error).toBeInstanceOf(RequestError)
		expect(error).toMatchObject({ endpoint: "search", status: 503, reason: "Request failed" })
		expect(error.cause.config.headers.get("cookie")).toBeUndefined()
		expect(adapter).toHaveBeenCalledTimes(3)
	})

	it("does not retry a rejected request and reports YouTube's reason", async () => {
		const { api, adapter } = await setup()
		adapter.mockImplementationOnce(
			failure(400, { error: { message: "Request contains an invalid argument." } }),
		)
		const error = await api.getAlbum("invalid").catch(error => error)
		expect(error.message).toBe(
			"Request to browse failed: 400: Request contains an invalid argument.",
		)
		expect(adapter).toHaveBeenCalledTimes(2)
	})

	it("reports an unreachable server and retries the first page load too", async () => {
		const { api, adapter } = createAPI(configHTML)
		adapter.mockImplementationOnce(failure())
		await api.initialize({ retry: { delay: 0 } })
		adapter.mockImplementation(failure())
		const error = await api.initialize({ retry: { retries: 0 } }).catch(error => error)
		expect(error).toMatchObject({ endpoint: "/", status: null })
		expect(adapter).toHaveBeenCalledTimes(3)
	})
})

describe("Response cache", () => {
	const suggestions = (query: string) => ({ suggestions: [{ query }] })

	it("does not reuse responses unless asked to", async () => {
		const { api } = await setup(suggestions("first"), suggestions("second"))
		expect(await api.getSearchSuggestions("q")).toEqual(["first"])
		expect(await api.getSearchSuggestions("q")).toEqual(["second"])
	})

	it("reuses a response for the same request until it expires or is cleared", async () => {
		const { api, adapter } = createAPI(
			configHTML,
			suggestions("first"),
			suggestions("other"),
			suggestions("second"),
			configHTML,
			suggestions("third"),
			suggestions("fourth"),
		)
		await api.initialize({ cache: { ttl: 60000 } })
		expect(await api.getSearchSuggestions("q")).toEqual(["first"])
		expect(await api.getSearchSuggestions("q")).toEqual(["first"])
		expect(await api.getSearchSuggestions("different")).toEqual(["other"])
		api.clearCache()
		expect(await api.getSearchSuggestions("q")).toEqual(["second"])
		await api.initialize({ cache: { ttl: -1 } })
		expect(await api.getSearchSuggestions("q")).toEqual(["third"])
		expect(await api.getSearchSuggestions("q")).toEqual(["fourth"])
		expect(adapter).toHaveBeenCalledTimes(7)
	})
})

describe("Request options", () => {
	it("waits 30 seconds for a response unless told otherwise", async () => {
		const { api, adapter } = createAPI(configHTML, {}, configHTML, {})
		await api.initialize()
		await api.getSearchSuggestions("query")
		expect(adapter.mock.calls[1]![0].timeout).toBe(30000)
		await api.initialize({ timeout: 0 })
		await api.getSearchSuggestions("query")
		expect(adapter.mock.calls[3]![0].timeout).toBe(0)
	})

	it("waits as long as YouTube asks before a retry", async () => {
		const { api, adapter } = createAPI(configHTML, {})
		await api.initialize({ retry: { delay: 0 } })
		adapter.mockImplementationOnce(async config => {
			const response = {
				status: 429,
				statusText: "",
				headers: { "retry-after": "0.05" },
				config,
			}
			throw new AxiosError("Too many requests", "ERR", config, null, response as never)
		})
		const start = performance.now()
		await api.getSearchSuggestions("query")
		expect(performance.now() - start).toBeGreaterThanOrEqual(45)
	})

	it("drops the oldest cached response beyond the size", async () => {
		const suggestions = (query: string) => ({ suggestions: [{ query }] })
		const { api } = createAPI(configHTML, suggestions("a"), suggestions("b"), suggestions("c"))
		await api.initialize({ cache: { ttl: 60000, size: 1 } })
		expect(await api.getSearchSuggestions("first")).toEqual(["a"])
		expect(await api.getSearchSuggestions("second")).toEqual(["b"])
		expect(await api.getSearchSuggestions("second")).toEqual(["b"])
		expect(await api.getSearchSuggestions("first")).toEqual(["c"])
	})

	it("leaves an undefined query value out of the URL", async () => {
		const { api, adapter } = await setup({})
		const request = (api as any).constructRequest("browse", {}, { continuation: undefined })
		await request
		expect(adapter.mock.calls[1]![0].url).not.toContain("continuation")
	})
})
