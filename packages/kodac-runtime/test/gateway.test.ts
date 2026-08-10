import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { ExecutionBlockedError, ExecutionGateway } from "../src/execution/gateway.ts"
import { fixedPolicy } from "../src/trust/policy.ts"

const patch = "*** Begin Patch\n*** Add File: proof.txt\n+proven\n*** End Patch"

async function root(): Promise<string> {
  return mkdtemp(join(tmpdir(), "kodac-gateway-"))
}

test("deny policy blocks before filesystem mutation and emits a blocked receipt", async () => {
  const dir = await root()
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("deny", "fixture deny"))
    await assert.rejects(
      () => gateway.applyPatch(patch),
      (error: unknown) => {
        assert.ok(error instanceof ExecutionBlockedError)
        assert.equal(error.receipt.policy.decision, "deny")
        assert.equal(error.receipt.result.status, "blocked")
        return true
      },
    )
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("ask policy requires approval and does not mutate", async () => {
  const dir = await root()
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask", "human approval required"))
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("allow policy applies patch and returns a success receipt", async () => {
  const dir = await root()
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"))
    const result = await gateway.applyPatch(patch)
    assert.equal(await readFile(join(dir, "proof.txt"), "utf8"), "proven")
    assert.equal(result.receipt.capability, "repo.apply_patch")
    assert.match(result.receipt.inputDigest, /^[0-9a-f]{64}$/)
    assert.equal(result.receipt.result.status, "success")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
