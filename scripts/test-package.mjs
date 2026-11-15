import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from "node:fs"
import { createRequire } from "node:module"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import YTMusic, { PlayerError, RequestError } from "ytmusic-api"

const require = createRequire(import.meta.url)
const CommonJS = require("ytmusic-api")
assert.equal(typeof YTMusic, "function")
assert.equal(typeof CommonJS, "function")
assert.equal(typeof CommonJS.PlayerError, "function")
assert.equal(typeof CommonJS.RequestError, "function")
assert.equal(typeof RequestError, "function")
for (const Client of [YTMusic, CommonJS]) {
	const api = new Client()
	assert.equal(typeof api.initialize, "function")
	assert.equal(typeof api.getUpNexts, "function")
}
const error = new PlayerError("mGsOHanQwxk", "LOGIN_REQUIRED", "Sign in required")
assert(error instanceof Error)
assert.equal(error.status, "LOGIN_REQUIRED")

// Each module system must resolve to declarations written for it
const directory = mkdtempSync(join(tmpdir(), "ytmusic-package-"))
try {
	mkdirSync(join(directory, "node_modules"))
	symlinkSync(
		fileURLToPath(new URL("../", import.meta.url)),
		join(directory, "node_modules", "ytmusic-api"),
		process.platform === "win32" ? "junction" : "dir",
	)
	const files = ["consumer.mts", "consumer.cts"].map(name => join(directory, name))
	for (const file of files) {
		writeFileSync(
			file,
			'import YTMusic from "ytmusic-api"\nconst api = new YTMusic()\nvoid api.initialize()\n',
		)
	}
	execFileSync(
		process.execPath,
		[
			require.resolve("typescript/bin/tsc"),
			"--noEmit",
			"--strict",
			"--skipLibCheck",
			"--module",
			"NodeNext",
			"--moduleResolution",
			"NodeNext",
			"--target",
			"ES2022",
			...files,
		],
		{ stdio: "inherit" },
	)
} finally {
	rmSync(directory, { recursive: true, force: true })
}
console.log("CommonJS and ES module package imports and TypeScript consumers passed")
