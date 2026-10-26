import assert from "node:assert/strict"
import { readFileSync } from "node:fs"

const report = readFileSync(
	process.argv[2] ?? new URL("../coverage/lcov.info", import.meta.url),
	"utf8",
)
const counts = { LF: 0, LH: 0, FNF: 0, FNH: 0 }
for (const line of report.split("\n")) {
	const [key, value] = line.split(":")
	if (Object.hasOwn(counts, key)) counts[key] += Number(value)
}
assert(counts.LF > 0 && counts.FNF > 0, "Coverage report contains no source lines or functions")
const lines = counts.LH / counts.LF
const functions = counts.FNH / counts.FNF
console.log(
	`Coverage: ${(lines * 100).toFixed(2)}% lines, ${(functions * 100).toFixed(2)}% functions`,
)
assert(lines >= 0.95, "Line coverage is below 95%")
assert(functions >= 0.9, "Function coverage is below 90%")
