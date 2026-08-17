import { readdirSync } from "node:fs"
import { spawnSync } from "node:child_process"
import { join } from "node:path"

const allTests = readdirSync("test")
  .filter((name) => name.endsWith(".test.ts"))
  .sort()
  .map((name) => join("test", name))

// TEMPORARY R3G-C DIAGNOSTIC: isolate the hanging Linux integration worker.
// Remove this branch immediately after the exact hang phase is identified.
const diagnostic = process.platform === "linux" && process.env.GITHUB_ACTIONS === "true"
const tests = diagnostic
  ? [join("test", "kdo-h4-r3g-c-runtime.test.ts")]
  : allTests

if (tests.length === 0) {
  console.error("No Kodac runtime tests found")
  process.exitCode = 1
} else {
  const result = spawnSync(
    process.execPath,
    ["--experimental-strip-types", "--test", ...tests],
    {
      stdio: "inherit",
      ...(diagnostic ? { timeout: 30_000, killSignal: "SIGKILL" } : {}),
    },
  )
  if (diagnostic && result.signal === "SIGKILL") {
    console.error("R3G-C Linux diagnostic test runner exceeded 30000ms and was killed")
  }
  process.exitCode = result.status ?? 1
}
