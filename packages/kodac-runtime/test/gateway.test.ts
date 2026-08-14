import assert from "node:assert/strict"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { createReceipt } from "../src/evidence/receipt.ts"
import {
  ExecutionBlockedError,
  ExecutionFailedError,
  ExecutionGateway,
  type ExecutionObserver,
} from "../src/execution/gateway.ts"
import { fixedPolicy, type ExecutionIntent, type PolicyEngine, type PolicyResult } from "../src/trust/policy.ts"

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

test("execution observers cannot rewrite intent or policy authority", async () => {
  const dir = await root()
  const rawPolicy: PolicyResult = { decision: "ask", reason: "fixture ask" }
  let evaluatedIntent: ExecutionIntent | undefined
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const policy: PolicyEngine = {
      evaluate(intent) {
        evaluatedIntent = intent
        return rawPolicy
      },
    }
    const observer: ExecutionObserver = {
      onIntent(intent) {
        assert.equal(Object.isFrozen(intent), true)
        assert.equal(Object.isFrozen(intent.paths), true)
        assert.equal(Reflect.set(intent, "capability", "repo.read"), false)
        assert.equal(Reflect.set(intent.paths, 0, "escape.txt"), false)
      },
      onPolicy(_intent, result) {
        assert.equal(Object.isFrozen(result), true)
        assert.equal(Reflect.set(result, "decision", "allow"), false)
        rawPolicy.decision = "allow"
        rawPolicy.reason = "mutated after snapshot"
      },
    }
    const gateway = new ExecutionGateway(fs, policy)
    await assert.rejects(
      () => gateway.applyPatch(patch, observer),
      (error: unknown) => {
        assert.ok(error instanceof ExecutionBlockedError)
        assert.equal(error.receipt.policy.decision, "ask")
        assert.equal(error.receipt.policy.reason, "fixture ask")
        assert.equal(error.receipt.capability, "repo.apply_patch")
        assert.deepEqual(error.receipt.paths, ["proof.txt"])
        return true
      },
    )
    assert.equal(evaluatedIntent?.capability, "repo.apply_patch")
    assert.deepEqual(evaluatedIntent?.paths, ["proof.txt"])
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("receipt observers cannot rewrite blocked execution evidence", async () => {
  const dir = await root()
  let observed = false
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const observer: ExecutionObserver = {
      onReceipt(receipt) {
        observed = true
        assert.equal(Object.isFrozen(receipt), true)
        assert.equal(Object.isFrozen(receipt.paths), true)
        assert.equal(Object.isFrozen(receipt.policy), true)
        assert.equal(Object.isFrozen(receipt.result), true)
        assert.equal(Reflect.set(receipt, "capability", "repo.read"), false)
        assert.equal(Reflect.set(receipt.paths, 0, "escape.txt"), false)
        assert.equal(Reflect.set(receipt.policy, "decision", "allow"), false)
        assert.equal(Reflect.set(receipt.result, "status", "success"), false)
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("deny", "fixture deny"))
    await assert.rejects(
      () => gateway.applyPatch(patch, observer),
      (error: unknown) => {
        assert.ok(error instanceof ExecutionBlockedError)
        assert.equal(error.receipt.capability, "repo.apply_patch")
        assert.deepEqual(error.receipt.paths, ["proof.txt"])
        assert.equal(error.receipt.policy.decision, "deny")
        assert.equal(error.receipt.result.status, "blocked")
        return true
      },
    )
    assert.equal(observed, true)
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("execution receipts defensively copy and deep-freeze nested authority evidence", () => {
  const paths = ["proof.txt"]
  const policy: PolicyResult = { decision: "ask", reason: "fixture ask" }
  const affected = { added: ["proof.txt"], modified: ["old.txt"], deleted: ["gone.txt"] }
  const approval = {
    version: "kodac-h4-r1-one-shot-approval-v1" as const,
    requestIdentity: "1".repeat(64),
    requestInstanceId: "fixture-instance",
    decisionEvidenceIdentity: "2".repeat(64),
    outcome: "allowed-once" as const,
  }
  const receipt = createReceipt({
    capability: "repo.apply_patch",
    inputDigest: "3".repeat(64),
    paths,
    policy,
    approval,
    startedAt: "2026-08-14T00:00:00.000Z",
    completedAt: "2026-08-14T00:00:01.000Z",
    result: { status: "success", affected, postStateDigest: "4".repeat(64) },
  })

  paths[0] = "mutated.txt"
  policy.decision = "allow"
  policy.reason = "mutated"
  approval.requestIdentity = "5".repeat(64)
  affected.added[0] = "mutated.txt"

  assert.equal(Object.isFrozen(receipt), true)
  assert.equal(Object.isFrozen(receipt.paths), true)
  assert.equal(Object.isFrozen(receipt.policy), true)
  assert.equal(Object.isFrozen(receipt.approval), true)
  assert.equal(Object.isFrozen(receipt.result), true)
  assert.equal(receipt.capability, "repo.apply_patch")
  assert.deepEqual(receipt.paths, ["proof.txt"])
  assert.equal(receipt.policy.decision, "ask")
  assert.equal(receipt.policy.reason, "fixture ask")
  assert.equal(receipt.approval?.requestIdentity, "1".repeat(64))
  assert.equal(Reflect.set(receipt.approval!, "outcome", "rejected"), false)

  if (receipt.result.status === "success" && "affected" in receipt.result) {
    assert.equal(Object.isFrozen(receipt.result.affected), true)
    assert.equal(Object.isFrozen(receipt.result.affected.added), true)
    assert.equal(Object.isFrozen(receipt.result.affected.modified), true)
    assert.equal(Object.isFrozen(receipt.result.affected.deleted), true)
    assert.deepEqual(receipt.result.affected, {
      added: ["proof.txt"],
      modified: ["old.txt"],
      deleted: ["gone.txt"],
    })
    assert.equal(Reflect.set(receipt.result.affected.added, 0, "escape.txt"), false)
  } else {
    assert.fail("expected affected-path success receipt")
  }
})

test("generic read command accepts only explicitly authorized non-zero exit codes and records bound paths", async () => {
  const dir = await root()
  try {
    await writeFile(join(dir, "candidate.ts"), "export const candidate = 1\n", "utf8")
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"))
    const result = await gateway.runCommand(
      "fixture.structural-read",
      process.execPath,
      ["-e", "process.stdout.write('[]\\n'); process.exit(1)"],
      undefined,
      { paths: ["candidate.ts"], allowedExitCodes: [0, 1] },
    )
    assert.equal(result.stdout, "[]\n")
    assert.deepEqual(result.receipt.paths, ["candidate.ts"])
    assert.equal(result.receipt.result.status, "success")
    if (result.receipt.result.status === "success" && "exitCode" in result.receipt.result) {
      assert.equal(result.receipt.result.exitCode, 1)
    } else {
      assert.fail("expected command execution receipt")
    }
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("generic read command still rejects non-zero exits by default", async () => {
  const dir = await root()
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"))
    await assert.rejects(
      () => gateway.runCommand("fixture.structural-read", process.execPath, ["-e", "process.exit(1)"]),
      ExecutionFailedError,
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("generic read command enforces timeout bounds through the trusted gateway", async () => {
  const dir = await root()
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "fixture allow"))
    await assert.rejects(
      () => gateway.runCommand(
        "fixture.structural-read",
        process.execPath,
        ["-e", "setTimeout(() => {}, 1000)"],
        undefined,
        { timeoutMs: 10 },
      ),
      ExecutionFailedError,
    )
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})