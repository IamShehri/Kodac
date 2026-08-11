import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import test from "node:test"

import { runCli } from "../src/cli.ts"
import type { ModelProvider, ModelProviderRequest, ModelProviderResponse } from "../src/model/provider.ts"
import { planVerification } from "../src/verification/planner.ts"

class ScriptedPlannerProvider implements ModelProvider {
  readonly name = "fixture"
  private readonly responses: ModelProviderResponse[]

  constructor(responses: ModelProviderResponse[]) {
    this.responses = responses
  }

  async generate(_request: ModelProviderRequest): Promise<ModelProviderResponse> {
    const response = this.responses.shift()
    if (!response) throw new Error("No scripted planner response remains")
    return response
  }
}

function capture(): { out: string[]; err: string[]; io: { stdout(line: string): void; stderr(line: string): void } } {
  const out: string[] = []
  const err: string[] = []
  return { out, err, io: { stdout(line) { out.push(line) }, stderr(line) { err.push(line) } } }
}

test("Verification Planner detects manifests, classifies risk, and refuses shell-backed package scripts", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "kodac-s7-plan-"))
  try {
    await writeFile(
      join(workspace, "package.json"),
      JSON.stringify({
        type: "module",
        packageManager: "npm@11.0.0",
        scripts: {
          test: "node --test verify.test.js",
          lint: "eslint .",
        },
      }),
      "utf8",
    )
    await writeFile(join(workspace, "verify.test.js"), "import test from 'node:test'; test('ok', () => {});\n", "utf8")

    const plan = await planVerification({ workspace, changedPaths: ["src/auth/session.ts"] })
    assert.equal(plan.protocol, "kodac.verification-plan")
    assert.equal(plan.version, 1)
    assert.equal(plan.risk, "high")
    assert.match(plan.planDigest, /^[0-9a-f]{64}$/)
    assert.ok(plan.signals.some((signal) => signal.includes("package.json:javascript:npm")))
    assert.ok(plan.commands.some((command) => command.category === "tests" && command.executable === "node"))
    assert.equal(plan.commands.some((command) => command.category === "lint"), false)
    assert.ok(plan.warnings.some((warning) => warning.includes("refused auto-execution")))
  } finally {
    await rm(workspace, { recursive: true, force: true })
  }
})

test("kodac solve reaches PROVEN READY from an automatic verification plan without --verify-command", async () => {
  const workspace = await mkdtemp(join(tmpdir(), "kodac-s7-ready-workspace-"))
  const evidence = await mkdtemp(join(tmpdir(), "kodac-s7-ready-evidence-"))
  try {
    execFileSync("git", ["init", "-q"], { cwd: workspace })
    execFileSync("git", ["config", "user.email", "kodac-test@example.com"], { cwd: workspace })
    execFileSync("git", ["config", "user.name", "Kodac Test"], { cwd: workspace })
    await writeFile(join(workspace, "note.txt"), "alpha\n", "utf8")
    await writeFile(
      join(workspace, "verify.test.js"),
      "import assert from 'node:assert/strict'; import { readFile } from 'node:fs/promises'; import test from 'node:test'; test('note', async () => assert.equal(await readFile('note.txt','utf8'), 'ALPHA\\n'));\n",
      "utf8",
    )
    await writeFile(
      join(workspace, "package.json"),
      JSON.stringify({ type: "module", scripts: { test: "node --test verify.test.js" } }),
      "utf8",
    )
    execFileSync("git", ["add", "note.txt", "verify.test.js", "package.json"], { cwd: workspace })
    execFileSync("git", ["commit", "-qm", "fixture"], { cwd: workspace })

    const patchText = "*** Begin Patch\n*** Update File: note.txt\n@@\n-alpha\n+ALPHA\n*** End Patch"
    const provider = new ScriptedPlannerProvider([
      { assistant: "", finishReason: "tool_calls", toolCalls: [{ id: "patch-1", name: "repo.apply_patch", input: { patchText } }] },
      { assistant: "done", finishReason: "stop", toolCalls: [] },
    ])
    const captured = capture()
    const code = await runCli(
      ["solve", "update note", "--workspace", workspace, "--evidence-dir", evidence, "--approve-writes", "--approve-verification"],
      captured.io,
      workspace,
      { modelProvider: provider },
    )

    assert.equal(code, 0, captured.err.join("\n"))
    assert.ok(captured.out.includes("PROVEN READY"))
    const planLine = captured.out.find((line) => line.startsWith("Plan: "))
    const proofLine = captured.out.find((line) => line.startsWith("Proof: "))
    assert.ok(planLine)
    assert.ok(proofLine)

    const plan = JSON.parse(await readFile(planLine.slice("Plan: ".length), "utf8")) as {
      protocol: string
      risk: string
      commands: Array<{ category: string; executable: string; args: string[] }>
      changedPaths: string[]
    }
    assert.equal(plan.protocol, "kodac.verification-plan")
    assert.equal(plan.risk, "low")
    assert.deepEqual(plan.changedPaths, ["note.txt"])
    assert.ok(plan.commands.some((command) => command.category === "tests" && command.executable === "node"))

    const proof = JSON.parse(await readFile(proofLine.slice("Proof: ".length), "utf8")) as {
      verificationPlan: { planDigest: string }
      doneGate: { status: string }
    }
    assert.match(proof.verificationPlan.planDigest, /^[0-9a-f]{64}$/)
    assert.equal(proof.doneGate.status, "PROVEN_READY")
  } finally {
    await rm(workspace, { recursive: true, force: true })
    await rm(evidence, { recursive: true, force: true })
  }
})
