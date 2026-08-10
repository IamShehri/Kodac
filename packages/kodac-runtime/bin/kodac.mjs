#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const cliPath = fileURLToPath(new URL("../src/cli.ts", import.meta.url))
const result = spawnSync(process.execPath, ["--experimental-strip-types", cliPath, ...process.argv.slice(2)], {
  stdio: "inherit",
})

if (result.error) {
  process.stderr.write(`${result.error.message}\n`)
  process.exitCode = 1
} else {
  process.exitCode = result.status ?? 1
}
