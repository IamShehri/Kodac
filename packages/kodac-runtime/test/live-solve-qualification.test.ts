import assert from "node:assert/strict"
import { createHash } from "node:crypto"
import { access, readFile, mkdir, mkdtemp, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join, resolve } from "node:path"
import test from "node:test"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"
import {
  computeProviderQualificationReportDigest,
  REQUIRED_PROVIDER_QUALIFICATION_CHECK_IDS,
  verifyProviderQualificationReport,
} from "../src/provider-qualification-gate.ts"
import { runControlledLiveSolve } from "../src/live-solve.ts"

const NOW = Date.parse("2026-08-11T01:15:00.000Z")

function hash(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function check(id: string): Record<string, unknown> {
  if (id === "credential.preflight") {
    return { id, status: "PASS", summary: "credential", evidence: { secretPersisted: false } }
  }
  if (id === "workspace.no_write") {
    return {
      id,
      status: "PASS",
      summary: "no write",
      evidence: {
        beforeStatusDigest: "same",
        afterStatusDigest: "same",
        beforeStatusLength: 0,
        afterStatusLength: 0,
        beforeReceiptId: "before",
        afterReceiptId: "after",
        blockedToolRequests: [],
      },
    }
  }
  return { id, status: "PASS", summary: id, evidence: {} }
}

async function writeReport(root: string, workspace: string, overrides: Record<string, unknown> = {}): Promise<string> {
  const directory = join(root, "qualification")
  await mkdir(directory, { recursive: true })
  const path = join(directory, "qualification-report.json")
  const base = {
    protocol: "kodac.provider-qualification",
    version: 1,
    sessionId: "qualification-session",
    provider: "openai",
    model: "gpt-test",
    workspaceDigest: hash(resolve(workspace)),
    startedAt: "2026-08-11T01:10:00.000Z",
    completedAt: "2026-08-11T01:11:00.000Z",
    status: "PASS",
    checks: REQUIRED_PROVIDER_QUALIFICATION_CHECK_IDS.map((id) => check(id)),
    artifacts: { events: "events.jsonl", receipts: "receipts.jsonl" },
    ...overrides,
  }
  const report = { ...base, reportDigest: computeProviderQualificationReportDigest(base) }
  await writeFile(path, `${JSON.stringify(report, null, 2)}\n`, "utf8")
  return path
}

async function fixture(): Promise<{ root: string; workspace: string; evidence: string; report: string }> {
  const root = await mkdtemp(join(tmpdir(), "kodac-live-solve-"))
  const workspace = join(root, "workspace")
  const evidence = join(root, "evidence")
  await mkdir(workspace, { recursive: true })
  await writeFile(join(workspace, "README.md"), "Kodac controlled live solve fixture\n", "utf8")
  const report = await writeReport(root, workspace)
  return { root, workspace, evidence, report }
}

class FailingOpenAIProvider implements ModelProvider {
  readonly name = "openai"
  calls = 0

  async generate(_request: ModelProviderRequest): Promise<ModelProviderResponse> {
    this.calls += 1
    throw new Error("injected controlled-live-solve stop")
  }
}

class UnauthorizedPatchProvider implements ModelProvider {
  readonly name = "openai"
  calls = 0

  async generate(_request: ModelProviderRequest): Promise<ModelProviderResponse> {
    this.calls += 1
    return {
      assistant: "",
      toolCalls: [{
        id: "call-denied",
        name: "repo.apply_patch",
        input: {
          patchText: "*** Begin Patch\n*** Add File: forbidden.txt\n+not authorized\n*** End Patch",
        },
      }],
      finishReason: "tool_calls",
    }
  }
}

test("qualification gate accepts a fresh matching PASS report", async () => {
  const { workspace, report } = await fixture()
  const result = await verifyProviderQualificationReport({
    reportPath: report,
    provider: "openai",
    model: "gpt-test",
    workspace,
    nowMs: NOW,
  })
  assert.equal(result.provider, "openai")
  assert.equal(result.model, "gpt-test")
  assert.match(result.qualificationReportDigest, /^[0-9a-f]{64}$/)
  assert.match(result.authorizationDigest, /^[0-9a-f]{64}$/)
})

test("qualification gate rejects tampered, stale, and mismatched reports", async () => {
  const { root, workspace, report } = await fixture()
  const parsed = JSON.parse(await readFile(report, "utf8")) as Record<string, unknown>
  parsed.model = "tampered-model"
  await writeFile(report, `${JSON.stringify(parsed)}\n`, "utf8")
  await assert.rejects(
    verifyProviderQualificationReport({ reportPath: report, provider: "openai", model: "gpt-test", workspace, nowMs: NOW }),
    /model mismatch|digest does not match/,
  )

  const staleReport = await writeReport(root, workspace, {
    startedAt: "2026-08-09T00:00:00.000Z",
    completedAt: "2026-08-09T00:01:00.000Z",
  })
  await assert.rejects(
    verifyProviderQualificationReport({ reportPath: staleReport, provider: "openai", model: "gpt-test", workspace, nowMs: NOW }),
    /stale/,
  )
})

test("controlled live solve requires explicit write and verification approval before model execution", async () => {
  const { workspace, evidence, report } = await fixture()
  const provider = new FailingOpenAIProvider()
  const errors: string[] = []
  const code = await runControlledLiveSolve(
    ["task", "--provider", "openai", "--model", "gpt-test", "--qualification-report", report, "--workspace", workspace, "--evidence-dir", evidence],
    {},
    { stdout() {}, stderr(line) { errors.push(line) } },
    workspace,
    { modelProvider: provider, now: () => NOW },
  )
  assert.equal(code, 1)
  assert.equal(provider.calls, 0)
  assert.match(errors.join("\n"), /approve-writes/)
})

test("controlled live solve requires an exact write scope before model execution", async () => {
  const { workspace, evidence, report } = await fixture()
  const provider = new FailingOpenAIProvider()
  const errors: string[] = []
  const code = await runControlledLiveSolve(
    [
      "task",
      "--provider", "openai",
      "--model", "gpt-test",
      "--qualification-report", report,
      "--workspace", workspace,
      "--evidence-dir", evidence,
      "--approve-writes",
      "--approve-verification",
    ],
    {},
    { stdout() {}, stderr(line) { errors.push(line) } },
    workspace,
    { modelProvider: provider, now: () => NOW },
  )
  assert.equal(code, 1)
  assert.equal(provider.calls, 0)
  assert.match(errors.join("\n"), /allow-write-path/)
})

test("controlled live solve verifies qualification and records exact write scope before invoking provider", async () => {
  const { workspace, evidence, report } = await fixture()
  const provider = new FailingOpenAIProvider()
  const output: string[] = []
  const errors: string[] = []
  const code = await runControlledLiveSolve(
    [
      "task",
      "--provider", "openai",
      "--model", "gpt-test",
      "--qualification-report", report,
      "--workspace", workspace,
      "--evidence-dir", evidence,
      "--allow-write-path", "README.md",
      "--approve-writes",
      "--approve-verification",
      "--max-failures", "1",
      "--json",
    ],
    {},
    { stdout(line) { output.push(line) }, stderr(line) { errors.push(line) } },
    workspace,
    { modelProvider: provider, now: () => NOW },
  )
  assert.equal(code, 2)
  assert.equal(provider.calls, 1)
  assert.equal(errors.length, 0)
  const result = JSON.parse(output.at(-1) ?? "{}") as Record<string, unknown>
  assert.equal(result.status, "STOPPED")
  assert.deepEqual(result.allowedWritePaths, ["README.md"])
  const authorizationPath = result.authorization
  const controlledReportPath = result.controlledReport
  assert.equal(typeof authorizationPath, "string")
  assert.equal(typeof controlledReportPath, "string")
  const authorization = JSON.parse(await readFile(authorizationPath as string, "utf8")) as Record<string, unknown>
  const controlled = JSON.parse(await readFile(controlledReportPath as string, "utf8")) as Record<string, unknown>
  assert.equal(authorization.protocol, "kodac.live-solve-authorization")
  assert.deepEqual(authorization.writeScope, { mode: "exact_paths", paths: ["README.md"] })
  assert.equal(controlled.protocol, "kodac.controlled-live-solve")
  assert.deepEqual(controlled.writeScope, { mode: "exact_paths", paths: ["README.md"] })
  assert.equal(controlled.exitCode, 2)
})

test("controlled live solve rejects an out-of-scope patch before workspace mutation", async () => {
  const { workspace, evidence, report } = await fixture()
  const provider = new UnauthorizedPatchProvider()
  const output: string[] = []
  const code = await runControlledLiveSolve(
    [
      "task",
      "--provider", "openai",
      "--model", "gpt-test",
      "--qualification-report", report,
      "--workspace", workspace,
      "--evidence-dir", evidence,
      "--allow-write-path", "README.md",
      "--approve-writes",
      "--approve-verification",
      "--max-failures", "1",
      "--json",
    ],
    {},
    { stdout(line) { output.push(line) }, stderr() {} },
    workspace,
    { modelProvider: provider, now: () => NOW },
  )
  assert.equal(code, 2)
  assert.equal(provider.calls, 1)
  await assert.rejects(access(join(workspace, "forbidden.txt")))
  assert.equal(await readFile(join(workspace, "README.md"), "utf8"), "Kodac controlled live solve fixture\n")
  const result = JSON.parse(output.at(-1) ?? "{}") as Record<string, unknown>
  assert.equal(result.status, "STOPPED")
})
