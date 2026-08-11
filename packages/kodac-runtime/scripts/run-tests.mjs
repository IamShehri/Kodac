import { readdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"

const tests = readdirSync("test")
  .filter((name) => name.endsWith(".test.ts"))
  .sort()
  .map((name) => join("test", name))

if (tests.length === 0) {
  console.error("No Kodac runtime tests found")
  process.exitCode = 1
} else {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--test", ...tests],
    { stdio: "inherit" },
  )
  process.exitCode = result.status ?? 1
}
