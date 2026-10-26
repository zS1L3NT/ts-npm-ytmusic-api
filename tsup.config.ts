import { defineConfig } from "tsup"

export default defineConfig({
	target: "esnext",
	format: ["cjs", "esm"],
	splitting: true,
	sourcemap: true,
	clean: true,
	dts: true,
	cjsInterop: true,
	// Keep require("ytmusic-api") callable when named exports are added.
	footer: ({ format }) =>
		format === "cjs"
			? { js: "module.exports = Object.assign(module.exports.default, module.exports)" }
			: {},
})
