#!/usr/bin/env node
import { spawnSync } from "node:child_process"
import { fileURLToPath } from "node:url"

const argv = process.argv.slice(2)
const command = argv[0]
const special = command === "provider-smoke" || command === "provider-qualify" || command === "live-solve" || command === "live-fixture"
const target = command === "provider-smoke"
  ? "../src/provider-smoke.ts"
  : command === "provider-qualify"
    ? "../src/provider-qualification.ts"
    : command === "live-solve"
      ? "../src/live-solve.ts"
      : command === "live-fixture"
        ? "../src/live-solve-fixture.ts"
        : "../src/cli.ts"
const targetPath = fileURLToPath(new URL(target, import.meta.url))
const targetArgs = special ? argv.slice(1) : argv
const result = spawnSync(process.execPath, ["--experimental-strip-types", targetPath, ...targetArgs], { stdio: "inherit" })

if (result.error) {
  process.stderr.write(`${result.error.message}\n`)
  process.exitCode = 1
} else process.exitCode = result.status ?? 1
