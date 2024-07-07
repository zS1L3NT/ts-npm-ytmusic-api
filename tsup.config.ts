import { defineConfig } from "tsup"

export default defineConfig({
	target: "esnext",
	format: ["cjs", "esm"],
	splitting: true,
	sourcemap: true,
	clean: true,
	dts: true,
	cjsInterop: true,
})
