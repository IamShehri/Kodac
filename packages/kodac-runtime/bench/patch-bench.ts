import { performance } from "node:perf_hooks"
import { parsePatch } from "../src/edit/patch.ts"

const patch = `*** Begin Patch
*** Update File: src/example.ts
@@
-const value = 1
+const value = 2
*** End Patch`
const iterations = 10_000
const started = performance.now()
for (let index = 0; index < iterations; index += 1) parsePatch(patch)
const elapsedMs = performance.now() - started
process.stdout.write(
  `${JSON.stringify({ benchmark: "patch-parse-v1", iterations, elapsedMs, operationsPerSecond: iterations / (elapsedMs / 1000) })}\n`,
)
