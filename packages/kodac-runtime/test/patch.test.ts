import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { NodeWorkspaceFileSystem, WorkspaceBoundaryError } from "../src/edit/filesystem.ts"
import { applyPatch, deriveNewContentsFromChunks, parsePatch, PatchFormatError } from "../src/edit/patch.ts"

async function workspace(): Promise<{ root: string; fs: NodeWorkspaceFileSystem; cleanup: () => Promise<void> }> {
  const root = await mkdtemp(join(tmpdir(), "kodac-k2-"))
  return { root, fs: new NodeWorkspaceFileSystem(root), cleanup: () => rm(root, { recursive: true, force: true }) }
}

test("parses and applies add/update/delete operations", async () => {
  const ws = await workspace()
  try {
    await writeFile(join(ws.root, "edit.txt"), "alpha\nbeta\n", "utf8")
    await writeFile(join(ws.root, "delete.txt"), "obsolete\n", "utf8")
    const patch = `*** Begin Patch
*** Add File: nested/new.txt
+hello
+world
*** Update File: edit.txt
@@
-alpha
+ALPHA
 beta
*** Delete File: delete.txt
*** End Patch`
    const affected = await applyPatch(ws.fs, patch)
    assert.deepEqual(affected, {
      added: ["nested/new.txt"],
      modified: ["edit.txt"],
      deleted: ["delete.txt"],
    })
    assert.equal(await readFile(join(ws.root, "nested/new.txt"), "utf8"), "hello\nworld")
    assert.equal(await readFile(join(ws.root, "edit.txt"), "utf8"), "ALPHA\nbeta\n")
    assert.equal(await ws.fs.exists("delete.txt"), false)
  } finally {
    await ws.cleanup()
  }
})

test("supports move updates without retaining the source", async () => {
  const ws = await workspace()
  try {
    await writeFile(join(ws.root, "old.txt"), "one\ntwo\n", "utf8")
    const patch = `*** Begin Patch
*** Update File: old.txt
*** Move to: moved/new.txt
@@
-one
+ONE
 two
*** End Patch`
    const affected = await applyPatch(ws.fs, patch)
    assert.deepEqual(affected.modified, ["moved/new.txt"])
    assert.equal(await ws.fs.exists("old.txt"), false)
    assert.equal(await readFile(join(ws.root, "moved/new.txt"), "utf8"), "ONE\ntwo\n")
  } finally {
    await ws.cleanup()
  }
})

test("matches normalized Unicode punctuation only after stricter comparisons fail", () => {
  const next = deriveNewContentsFromChunks(
    "quote.txt",
    [{ oldLines: ["She said “hello”."], newLines: ["She said hello." ] }],
    'She said "hello".\n',
  )
  assert.equal(next.content, "She said hello.\n")
})

test("fails when expected update lines are absent", () => {
  assert.throws(
    () => deriveNewContentsFromChunks("a.txt", [{ oldLines: ["missing"], newLines: ["next"] }], "present\n"),
    /Failed to find expected lines/,
  )
})

test("rejects malformed patch directives", () => {
  assert.throws(
    () => parsePatch("*** Begin Patch\n*** Unknown: x\n*** End Patch"),
    PatchFormatError,
  )
})

test("rejects lexical path traversal", async () => {
  const ws = await workspace()
  try {
    await assert.rejects(
      () => applyPatch(ws.fs, "*** Begin Patch\n*** Add File: ../escape.txt\n+x\n*** End Patch"),
      WorkspaceBoundaryError,
    )
  } finally {
    await ws.cleanup()
  }
})

test("rejects writes through a symlink that escapes the workspace", async () => {
  const ws = await workspace()
  const outside = await mkdtemp(join(tmpdir(), "kodac-outside-"))
  try {
    await symlink(outside, join(ws.root, "outside-link"), process.platform === "win32" ? "junction" : "dir")
    await assert.rejects(
      () => applyPatch(ws.fs, "*** Begin Patch\n*** Add File: outside-link/escape.txt\n+x\n*** End Patch"),
      WorkspaceBoundaryError,
    )
  } finally {
    await ws.cleanup()
    await rm(outside, { recursive: true, force: true })
  }
})
