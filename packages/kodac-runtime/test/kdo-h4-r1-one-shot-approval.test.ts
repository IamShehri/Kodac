import assert from "node:assert/strict"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { NodeWorkspaceFileSystem } from "../src/edit/filesystem.ts"
import { InMemoryReceiptLedger } from "../src/evidence/ledger.ts"
import {
  ExecutionBlockedError,
  ExecutionGateway,
  ExecutionUnprovenError,
  type ExecutionObserver,
} from "../src/execution/gateway.ts"
import { InMemoryEventSink } from "../src/protocol/event.ts"
import { RuntimeSession } from "../src/session/session.ts"
import { createApplyPatchTool } from "../src/tools/apply-patch.ts"
import {
  KDO_H4_R1_APPROVAL_VERSION,
  KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
  type ApprovalEvidence,
  type ApprovalOutcome,
  type ApprovalRuntime,
} from "../src/trust/approval.ts"
import { fixedPolicy } from "../src/trust/policy.ts"

const patch = "*** Begin Patch\n*** Add File: proof.txt\n+proven\n*** End Patch"

async function root(): Promise<string> {
  return mkdtemp(join(tmpdir(), "kodac-h4-r1-"))
}

function durableCommit(record: ApprovalEvidence) {
  return {
    version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
    evidenceIdentity: record.evidenceIdentity,
    durability: "durable" as const,
  }
}

function recordingEvidence(evidence: ApprovalEvidence[]) {
  return {
    commit(record: ApprovalEvidence) {
      evidence.push(record)
      return durableCommit(record)
    },
  }
}

function decisionRuntime(
  outcome: ApprovalOutcome,
  evidence: ApprovalEvidence[],
  calls: { count: number },
): ApprovalRuntime {
  return {
    evidence: recordingEvidence(evidence),
    service: {
      decide(request) {
        calls.count += 1
        return {
          version: KDO_H4_R1_APPROVAL_VERSION,
          requestIdentity: request.requestIdentity,
          requestInstanceId: request.requestInstanceId,
          outcome,
        }
      },
    },
  }
}

test("allow policy executes without consulting approval", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  const calls = { count: 0 }
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow"), decisionRuntime("rejected", evidence, calls))
    const result = await gateway.applyPatch(patch)
    assert.equal(await readFile(join(dir, "proof.txt"), "utf8"), "proven")
    assert.equal(calls.count, 0)
    assert.deepEqual(evidence, [])
    assert.equal(result.receipt.approval, undefined)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("deny policy blocks without consulting approval", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  const calls = { count: 0 }
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("deny", "fixture deny"), decisionRuntime("allowed-once", evidence, calls))
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(await fs.exists("proof.txt"), false)
    assert.equal(calls.count, 0)
    assert.deepEqual(evidence, [])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("ask without an approval runtime preserves the fail-closed default", async () => {
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

for (const outcome of ["rejected", "cancelled", "unavailable"] as const) {
  test(`ask with ${outcome} remains blocked with asked/decided evidence`, async () => {
    const dir = await root()
    const evidence: ApprovalEvidence[] = []
    const calls = { count: 0 }
    try {
      const fs = new NodeWorkspaceFileSystem(dir)
      const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), decisionRuntime(outcome, evidence, calls))
      await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
      assert.equal(await fs.exists("proof.txt"), false)
      assert.equal(calls.count, 1)
      assert.deepEqual(evidence.map((record) => [record.phase, record.outcome]), [
        ["asked", undefined],
        ["decided", outcome],
      ])
      assert.equal(evidence[0]?.requestInstanceId, evidence[1]?.requestInstanceId)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
}

test("approval service failure becomes unavailable and remains blocked", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: recordingEvidence(evidence),
      service: { decide: () => { throw new Error("answerer offline") } },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(await fs.exists("proof.txt"), false)
    assert.equal(evidence[1]?.outcome, "unavailable")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("malformed or mismatched decisions fail closed as unavailable", async () => {
  for (const mode of ["malformed", "mismatch"] as const) {
    const dir = await root()
    const evidence: ApprovalEvidence[] = []
    try {
      const fs = new NodeWorkspaceFileSystem(dir)
      const runtime: ApprovalRuntime = {
        evidence: recordingEvidence(evidence),
        service: {
          decide(request) {
            if (mode === "malformed") return { outcome: "allowed-once" }
            return {
              version: KDO_H4_R1_APPROVAL_VERSION,
              requestIdentity: "0".repeat(64),
              requestInstanceId: request.requestInstanceId,
              outcome: "allowed-once",
            }
          },
        },
      }
      const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
      await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
      assert.equal(await fs.exists("proof.txt"), false)
      assert.equal(evidence[1]?.outcome, "unavailable")
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }
})

test("allowed-once durably commits decided evidence before mutation and binds the K2 receipt", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  const calls = { count: 0 }
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime = decisionRuntime("allowed-once", evidence, calls)
    const originalCommit = runtime.evidence.commit.bind(runtime.evidence)
    runtime.evidence.commit = async (record) => {
      if (record.phase === "decided") assert.equal(await fs.exists("proof.txt"), false)
      return originalCommit(record)
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    const result = await gateway.applyPatch(patch)
    assert.equal(await readFile(join(dir, "proof.txt"), "utf8"), "proven")
    assert.equal(calls.count, 1)
    assert.deepEqual(evidence.map((record) => record.phase), ["asked", "decided"])
    const decided = evidence[1]
    assert.equal(decided?.outcome, "allowed-once")
    assert.equal(result.receipt.policy.decision, "ask")
    assert.equal(result.receipt.approval?.requestIdentity, decided?.requestIdentity)
    assert.equal(result.receipt.approval?.requestInstanceId, decided?.requestInstanceId)
    assert.equal(result.receipt.approval?.decisionEvidenceIdentity, decided?.evidenceIdentity)
    assert.equal(result.receipt.approval?.outcome, "allowed-once")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("allowed-once is consumed by one invocation and cannot authorize the next identical ask", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  let call = 0
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: recordingEvidence(evidence),
      service: {
        decide(request) {
          call += 1
          return {
            version: KDO_H4_R1_APPROVAL_VERSION,
            requestIdentity: request.requestIdentity,
            requestInstanceId: request.requestInstanceId,
            outcome: call === 1 ? "allowed-once" : "rejected",
          }
        },
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await gateway.applyPatch(patch)
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(call, 2)
    const asks = evidence.filter((record) => record.phase === "asked")
    assert.equal(asks.length, 2)
    assert.equal(asks[0]?.requestIdentity, asks[1]?.requestIdentity)
    assert.notEqual(asks[0]?.requestInstanceId, asks[1]?.requestInstanceId)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("concurrent identical asks receive distinct one-shot request instances", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  const instanceIds: string[] = []
  const requestIdentities: string[] = []
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: recordingEvidence(evidence),
      service: {
        async decide(request) {
          instanceIds.push(request.requestInstanceId)
          requestIdentities.push(request.requestIdentity)
          await new Promise((resolve) => setTimeout(resolve, 5))
          return {
            version: KDO_H4_R1_APPROVAL_VERSION,
            requestIdentity: request.requestIdentity,
            requestInstanceId: request.requestInstanceId,
            outcome: "rejected",
          }
        },
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await Promise.all([
      assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError),
      assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError),
    ])
    assert.equal(new Set(instanceIds).size, 2)
    assert.equal(new Set(requestIdentities).size, 1)
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("callback-only asked evidence observation is not durable proof", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  let calls = 0
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: {
        commit(record) {
          evidence.push(record)
          return undefined
        },
      },
      service: { decide: () => { calls += 1; return null } },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(calls, 0)
    assert.deepEqual(evidence.map((record) => record.phase), ["asked"])
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("invalid asked evidence commit acknowledgment blocks before the approval service", async () => {
  for (const mode of ["identity", "durability"] as const) {
    const dir = await root()
    let calls = 0
    try {
      const fs = new NodeWorkspaceFileSystem(dir)
      const runtime: ApprovalRuntime = {
        evidence: {
          commit(record) {
            return mode === "identity"
              ? {
                  version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
                  evidenceIdentity: "0".repeat(64),
                  durability: "durable",
                }
              : {
                  version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
                  evidenceIdentity: record.evidenceIdentity,
                  durability: "memory-only",
                }
          },
        },
        service: { decide: () => { calls += 1; return null } },
      }
      const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
      await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
      assert.equal(calls, 0)
      assert.equal(await fs.exists("proof.txt"), false)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  }
})

test("asked evidence persistence failure blocks before the approval service is consulted", async () => {
  const dir = await root()
  let calls = 0
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: { commit: () => { throw new Error("ledger unavailable") } },
      service: { decide: () => { calls += 1; return null } },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(calls, 0)
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("decided evidence persistence failure blocks allowed-once before side effects", async () => {
  const dir = await root()
  let evidenceWrites = 0
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: {
        commit(record) {
          evidenceWrites += 1
          if (evidenceWrites === 2) throw new Error("decision ledger unavailable")
          return durableCommit(record)
        },
      },
      service: {
        decide(request) {
          return {
            version: KDO_H4_R1_APPROVAL_VERSION,
            requestIdentity: request.requestIdentity,
            requestInstanceId: request.requestInstanceId,
            outcome: "allowed-once",
          }
        },
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("invalid decided evidence commit acknowledgment blocks allowed-once before side effects", async () => {
  const dir = await root()
  let evidenceWrites = 0
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: {
        commit(record) {
          evidenceWrites += 1
          if (evidenceWrites === 1) return durableCommit(record)
          return {
            version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
            evidenceIdentity: record.evidenceIdentity,
            durability: "memory-only",
          }
        },
      },
      service: {
        decide(request) {
          return {
            version: KDO_H4_R1_APPROVAL_VERSION,
            requestIdentity: request.requestIdentity,
            requestInstanceId: request.requestInstanceId,
            outcome: "allowed-once",
          }
        },
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await assert.rejects(() => gateway.applyPatch(patch), ExecutionBlockedError)
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("external executable ask fails closed before approval service or process execution", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  const calls = { count: 0 }
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), decisionRuntime("allowed-once", evidence, calls))
    let caught: unknown
    try {
      await gateway.runCommand(
        "fixture.approval-read",
        process.execPath,
        ["-e", "require('node:fs').writeFileSync('executed.txt','ran')"],
      )
    } catch (error) {
      caught = error
    }
    assert.ok(caught instanceof ExecutionBlockedError)
    assert.match(caught.message, /H4-R2 confinement/)
    assert.equal(calls.count, 0)
    assert.deepEqual(evidence, [])
    assert.equal(await fs.exists("executed.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("an already-aborted applyPatch approval is durably cancelled before mutation", async () => {
  const dir = await root()
  const controller = new AbortController()
  controller.abort(new Error("cancelled by caller"))
  const evidence: ApprovalEvidence[] = []
  let calls = 0
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: recordingEvidence(evidence),
      service: { decide: () => { calls += 1; return null } },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    await assert.rejects(
      () => gateway.applyPatch(patch, undefined, { signal: controller.signal }),
      ExecutionBlockedError,
    )
    assert.equal(calls, 0)
    assert.equal(evidence[1]?.outcome, "cancelled")
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("repo.apply_patch propagates cancellation during pending approval and late allowed-once cannot mutate", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  let decisionStartedResolve!: () => void
  let decisionReleaseResolve!: () => void
  const decisionStarted = new Promise<void>((resolve) => { decisionStartedResolve = resolve })
  const decisionRelease = new Promise<void>((resolve) => { decisionReleaseResolve = resolve })
  let serviceReturnedAllowedOnce = false
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: recordingEvidence(evidence),
      service: {
        async decide(request) {
          decisionStartedResolve()
          await decisionRelease
          serviceReturnedAllowedOnce = true
          return {
            version: KDO_H4_R1_APPROVAL_VERSION,
            requestIdentity: request.requestIdentity,
            requestInstanceId: request.requestInstanceId,
            outcome: "allowed-once",
          }
        },
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)
    const ledger = new InMemoryReceiptLedger()
    const session = new RuntimeSession(new InMemoryEventSink(), "h4-r1-apply-patch-abort")
    const tool = createApplyPatchTool(gateway, ledger)
    const controller = new AbortController()

    const execution = tool.execute(
      { patchText: patch },
      { session, signal: controller.signal },
    )

    await decisionStarted
    controller.abort(new Error("cancelled while approval was pending"))
    decisionReleaseResolve()

    await assert.rejects(execution, ExecutionBlockedError)
    assert.equal(serviceReturnedAllowedOnce, true)
    assert.equal(await fs.exists("proof.txt"), false)
    assert.deepEqual(evidence.map((record) => [record.phase, record.outcome]), [
      ["asked", undefined],
      ["decided", "cancelled"],
    ])
    assert.equal(ledger.receipts.length, 1)
    assert.equal(ledger.receipts[0]?.result.status, "blocked")
    assert.equal(ledger.receipts.some((receipt) => receipt.result.status === "success"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("applyPatch rechecks cancellation after approval resolution and before mutation", async () => {
  const dir = await root()
  const controller = new AbortController()
  const evidence: ApprovalEvidence[] = []
  let scheduledAbort = false
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const runtime: ApprovalRuntime = {
      evidence: {
        commit(record) {
          evidence.push(record)
          if (record.phase === "asked") return durableCommit(record)
          const acknowledgment: Record<string, unknown> = {
            version: KDO_H4_R1_EVIDENCE_COMMIT_VERSION,
            evidenceIdentity: record.evidenceIdentity,
          }
          Object.defineProperty(acknowledgment, "durability", {
            enumerable: true,
            get() {
              if (!scheduledAbort) {
                scheduledAbort = true
                queueMicrotask(() => controller.abort(new Error("cancelled before patch mutation")))
              }
              return "durable"
            },
          })
          return acknowledgment
        },
      },
      service: {
        decide(request) {
          return {
            version: KDO_H4_R1_APPROVAL_VERSION,
            requestIdentity: request.requestIdentity,
            requestInstanceId: request.requestInstanceId,
            outcome: "allowed-once",
          }
        },
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), runtime)

    await assert.rejects(
      () => gateway.applyPatch(patch, undefined, { signal: controller.signal }),
      ExecutionBlockedError,
    )

    assert.equal(scheduledAbort, true)
    assert.equal(controller.signal.aborted, true)
    assert.deepEqual(evidence.map((record) => [record.phase, record.outcome]), [
      ["asked", undefined],
      ["decided", "allowed-once"],
    ])
    assert.equal(await fs.exists("proof.txt"), false)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("K2 execution receipt persistence failure remains ExecutionUnprovenError after allowed-once", async () => {
  const dir = await root()
  const evidence: ApprovalEvidence[] = []
  const calls = { count: 0 }
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("ask"), decisionRuntime("allowed-once", evidence, calls))
    const observer: ExecutionObserver = {
      onReceipt() {
        throw new Error("receipt ledger unavailable")
      },
    }
    await assert.rejects(() => gateway.applyPatch(patch, observer), ExecutionUnprovenError)
    assert.equal(await readFile(join(dir, "proof.txt"), "utf8"), "proven")
    assert.equal(evidence[1]?.outcome, "allowed-once")
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("generic command K2 input identity binds environment and execution bounds without approval", async () => {
  const dir = await root()
  const inputDigests: string[] = []
  const baseEnv = { ...process.env }
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow"))
    const observer: ExecutionObserver = {
      onIntent(intent) {
        inputDigests.push(intent.inputDigest)
      },
    }
    const command = (envValue: string, timeoutMs: number) => gateway.runCommand(
      "fixture.approval-read",
      process.execPath,
      ["-e", "process.stdout.write('ok')"],
      observer,
      {
        env: { ...baseEnv, KODAC_APPROVAL_FIXTURE: envValue },
        timeoutMs,
        maxOutputBytes: 4096,
        allowedExitCodes: [0],
      },
    )

    assert.equal((await command("A", 1000)).stdout, "ok")
    assert.equal((await command("B", 1000)).stdout, "ok")
    assert.equal((await command("A", 2000)).stdout, "ok")
    assert.equal(inputDigests.length, 3)
    assert.notEqual(inputDigests[0], inputDigests[1])
    assert.notEqual(inputDigests[0], inputDigests[2])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test("ambient environment is snapshotted before K2 allow execution and cannot drift before launch", async () => {
  const dir = await root()
  const key = "KODAC_H4_R1_AMBIENT_FIXTURE"
  const original = process.env[key]
  process.env[key] = "before"
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const observer: ExecutionObserver = {
      onPolicy() {
        process.env[key] = "after"
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow"))
    const result = await gateway.runCommand(
      "fixture.approval-read",
      process.execPath,
      ["-e", `process.stdout.write(process.env.${key} ?? '')`],
      observer,
    )
    assert.equal(result.stdout, "before")
  } finally {
    if (original === undefined) delete process.env[key]
    else process.env[key] = original
    await rm(dir, { recursive: true, force: true })
  }
})

test("command arguments are snapshotted before K2 allow execution and cannot drift before launch", async () => {
  const dir = await root()
  let intentDigest = ""
  try {
    const fs = new NodeWorkspaceFileSystem(dir)
    const args = ["-e", "process.stdout.write(process.argv.slice(1).join('|'))", "approved"]
    const observer: ExecutionObserver = {
      onIntent(intent) {
        intentDigest = intent.inputDigest
      },
      onPolicy() {
        args[2] = "mutated"
        args.push("extra")
      },
    }
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow"))
    const result = await gateway.runCommand(
      "fixture.approval-read",
      process.execPath,
      args,
      observer,
    )

    assert.equal(result.stdout, "approved")
    assert.equal(result.receipt.inputDigest, intentDigest)
    assert.deepEqual(args, ["-e", "process.stdout.write(process.argv.slice(1).join('|'))", "mutated", "extra"])
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
