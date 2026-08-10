import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { fileURLToPath } from "node:url"
import test from "node:test"

const binPath = fileURLToPath(new URL("../bin/kodac.mjs", import.meta.url))

test("kodac binary wrapper reaches the canonical apply-patch runtime", async () => {
  const root = await mkdtemp(join(tmpdir(), "kodac-bin-"))
  const workspace = join(root, "workspace")
  const evidence = join(root, "evidence")
  const patchFile = join(root, "task.patch")
  await mkdir(workspace, { recursive: true })
  await writeFile(
    patchFile,
    [
      "*** Begin Patch",
      "*** Add File: binary.txt",
      "+binary path works",
      "*** End Patch",
      "",
    ].join("\n"),
    "utf8",
  )

  const result = spawnSync(
    process.execPath,
    [binPath, "apply-patch", patchFile, "--workspace", workspace, "--evidence-dir", evidence],
    { encoding: "utf8" },
  )

  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /PROVEN READY/)
  assert.equal(await readFile(join(workspace, "binary.txt"), "utf8"), "binary path works")
})
