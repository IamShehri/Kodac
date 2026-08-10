import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { InMemoryReceiptLedger, JsonlReceiptLedger } from "../src/evidence/ledger.ts"
import { ExecutionGateway } from "../src/execution/gateway.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { fixedPolicy } from "../src/trust/policy.ts"
import { DoneGate } from "../src/verification/done-gate.ts"
import { runVerificationEngine } from "../src/verification/engine.ts"

async function gitWorkspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), "kodac-s6-core-"))
  execFileSync("git", ["init", "-q"], { cwd: root })
  execFileSync("git", ["config", "user.email", "kodac-test@example.com"], { cwd: root })
  execFileSync("git", ["config", "user.name", "Kodac Test"], { cwd: root })
  await writeFile(join(root, "note.txt"), "alpha\n", "utf8")
  await writeFile(join(root, "verify.test.js"), "import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises'; import test from 'node:test'; test('note', async () => assert.equal(await readFile('note.txt','utf8'), 'ALPHA\\n'));\n", "utf8")
  execFileSync("git", ["add", "note.txt", "verify.test.js"], { cwd: root })
  execFileSync("git", ["commit", "-qm", "fixture"], { cwd: root })
  return root
}

test("DoneGate refuses a report with missing evidence", () => {
  const gate = new DoneGate().evaluate({
    protocol: "kodac.verification",
    version: 1,
    sessionId: "s",
    startedAt: new Date(0).toISOString(),
    completedAt: new Date(0).toISOString(),
    passed: false,
    checks: [],
  })
  assert.equal(gate.status, "NOT_READY")
  assert.ok(gate.reasons.some((reason) => reason.includes("missing required verification check")))
})

test("verification engine can prove an attested mutation with explicit tests", async () => {
  const workspace = await gitWorkspace()
  const evidence = await mkdtemp(join(tmpdir(), "kodac-s6-evidence-"))
  try {
    const receiptsPath = join(evidence, "receipts.jsonl")
    const fs = new NodeWorkspaceFileSystem(workspace)
    const mutationLedger = new JsonlReceiptLedger(receiptsPath)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture write approval"))
    await gateway.applyPatch(
      "*** Begin Patch\n*** Update File: note.txt\n@@\n-alpha\n+ALPHA\n*** End Patch",
      { onReceipt: (receipt) => mutationLedger.append(receipt) },
    )
    const sink = new InMemoryEventSink()
    const session = new RuntimeSession(sink, "s6-session")
    await session.start({ command: "solve", workspace })
    await session.emit("agent.loop.completed", { fixture: true })
    const report = await runVerificationEngine({
      workspace,
      sessionId: "s6-session",
      receiptPath: receiptsPath,
      session,
      agentCompleted: true,
      approveVerification: true,
      commands: [{ id: "tests", category: "tests", executable: "node", args: ["--test", "verify.test.js"] }],
    })
    const gate = new DoneGate().evaluate(report)
    assert.equal(report.passed, true)
    assert.equal(gate.status, "PROVEN_READY")
    assert.ok(gate.evidence.length > 0)
    const receipts = new InMemoryReceiptLedger()
    assert.equal(receipts.receipts.length, 0)
  } finally {
    await rm(workspace, { recursive: true, force: true })
    await rm(evidence, { recursive: true, force: true })
  }
})
