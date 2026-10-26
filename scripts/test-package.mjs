import assert from "node:assert/strict"
import { createRequire } from "node:module"
import YTMusic, { PlayerError } from "ytmusic-api"

const require = createRequire(import.meta.url)
const CommonJS = require("ytmusic-api")
assert.equal(typeof YTMusic, "function")
assert.equal(typeof CommonJS, "function")
assert.equal(typeof CommonJS.PlayerError, "function")
for (const Client of [YTMusic, CommonJS]) {
	const api = new Client()
	assert.equal(typeof api.initialize, "function")
	assert.equal(typeof api.getUpNexts, "function")
}
const error = new PlayerError("mGsOHanQwxk", "LOGIN_REQUIRED", "Sign in required")
assert(error instanceof Error)
assert.equal(error.status, "LOGIN_REQUIRED")
console.log("CommonJS and ES module package exports passed")
