import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { InMemoryReceiptLedger } from "../src/evidence/ledger.ts"
import { ExecutionBlockedError } from "../src/execution/gateway.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeOrchestrator } from "../src/runtime/orchestrator.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { ToolRegistry } from "../src/tools/registry.ts"
import { registerWorkspaceToolSurface } from "../src/tools/workspace-surface.ts"

async function harness(approveWrites = false): Promise<{
  root: string
  receipts: InMemoryReceiptLedger
  orchestrator: RuntimeOrchestrator
  cleanup: () => Promise<void>
}> {
  const root = await mkdtemp(join(tmpdir(), "kodac-workspace-tools-"))
  const receipts = new InMemoryReceiptLedger()
  const sink = new InMemoryEventSink()
  const session = new RuntimeSession(sink, "session-workspace-tools")
  const registry = new ToolRegistry()
  registerWorkspaceToolSurface(registry, { workspace: root, receipts, approveWrites })
  return {
    root,
    receipts,
    orchestrator: new RuntimeOrchestrator(registry, session),
    cleanup: () => rm(root, { recursive: true, force: true }),
  }
}

test("repo read/list/search stay inside the workspace and return bounded results", async () => {
  const h = await harness()
  try {
    await writeFile(join(h.root, "note.txt"), "alpha\nbeta needle\n", "utf8")
    const read = await h.orchestrator.invoke<{ path: string }, { content: string }>("repo.read", { path: "note.txt" })
    assert.equal(read.content, "alpha\nbeta needle\n")

    const listed = await h.orchestrator.invoke<{}, { entries: Array<{ path: string; type: string }> }>("repo.list", {})
    assert.ok(listed.entries.some((entry) => entry.path === "note.txt" && entry.type === "file"))

    const searched = await h.orchestrator.invoke<{ query: string }, { matches: Array<{ path: string; line: number }> }>(
      "repo.search",
      { query: "needle" },
    )
    assert.deepEqual(searched.matches.map((match) => [match.path, match.line]), [["note.txt", 2]])

    await assert.rejects(
      () => h.orchestrator.invoke("repo.read", { path: "../escape.txt" }),
      /Path escapes workspace|Workspace path must be relative/,
    )
  } finally {
    await h.cleanup()
  }
})

test("repo.apply_patch remains ASK by default and records a blocked receipt", async () => {
  const h = await harness(false)
  try {
    const patchText = "*** Begin Patch\n*** Add File: proof.txt\n+blocked\n*** End Patch"
    await assert.rejects(
      () => h.orchestrator.invoke("repo.apply_patch", { patchText }),
      ExecutionBlockedError,
    )
    await assert.rejects(() => readFile(join(h.root, "proof.txt"), "utf8"), /ENOENT/)
    assert.equal(h.receipts.receipts.length, 1)
    assert.equal(h.receipts.receipts[0].capability, "repo.apply_patch")
    assert.equal(h.receipts.receipts[0].policy.decision, "ask")
    assert.equal(h.receipts.receipts[0].result.status, "blocked")
  } finally {
    await h.cleanup()
  }
})

test("git.diff runs through ExecutionGateway without a shell and records output evidence", async () => {
  const h = await harness()
  try {
    execFileSync("git", ["init", "-q"], { cwd: h.root })
    execFileSync("git", ["config", "user.email", "kodac-test@example.com"], { cwd: h.root })
    execFileSync("git", ["config", "user.name", "Kodac Test"], { cwd: h.root })
    await writeFile(join(h.root, "note.txt"), "alpha\n", "utf8")
    execFileSync("git", ["add", "note.txt"], { cwd: h.root })
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: h.root })
    await writeFile(join(h.root, "note.txt"), "beta\n", "utf8")

    const result = await h.orchestrator.invoke<{}, { diff: string }>("git.diff", {})
    assert.match(result.diff, /-alpha/)
    assert.match(result.diff, /\+beta/)
    assert.equal(h.receipts.receipts.length, 1)
    const receipt = h.receipts.receipts[0]
    assert.equal(receipt.capability, "git.diff")
    assert.equal(receipt.result.status, "success")
    if (receipt.result.status === "success" && "outputDigest" in receipt.result) {
      assert.match(receipt.result.outputDigest, /^[0-9a-f]{64}$/)
      assert.ok(receipt.result.outputBytes > 0)
    } else {
      assert.fail("expected git.diff process evidence receipt")
    }
  } finally {
    await h.cleanup()
  }
})
