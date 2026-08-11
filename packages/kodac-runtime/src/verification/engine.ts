import { createHash } from "node:crypto"
import { realpath, stat } from "node:fs/promises"
import { NodeWorkspaceFileSystem } from "../edit/filesystem.ts"
import { JsonlReceiptLedger, readReceiptLedger } from "../evidence/ledger.ts"
import type { ExecutionReceipt } from "../evidence/receipt.ts"
import { ExecutionFailedError, ExecutionGateway, type ExecutionObserver } from "../execution/gateway.ts"
import { fixedPolicy } from "../trust/policy.ts"
import {
  VerifierRegistry,
  type VerificationCheckResult,
  type VerificationCommandSpec,
  type VerificationContext,
  type VerificationEvidenceRef,
  type VerificationExecutable,
  type VerificationReport,
  type Verifier,
} from "./types.ts"

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function receiptRef(receipt: ExecutionReceipt): VerificationEvidenceRef {
  return { kind: "receipt", ref: receipt.receiptId }
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function sanitizedVerificationEnv(): NodeJS.ProcessEnv {
  const keys = ["PATH", "Path", "SYSTEMROOT", "SystemRoot", "HOME", "USERPROFILE", "TMP", "TEMP", "TMPDIR"]
  const env: NodeJS.ProcessEnv = { NODE_ENV: "test", KODAC_VERIFICATION: "1", NO_COLOR: "1" }
  for (const key of keys) if (process.env[key] !== undefined) env[key] = process.env[key]
  return env
}

function resolveVerificationExecutable(executable: VerificationExecutable): string {
  if (executable === "node") return process.execPath
  if (executable === "python") return process.platform === "win32" ? "python.exe" : "python3"
  if (executable === "cargo") return process.platform === "win32" ? "cargo.exe" : "cargo"
  return process.platform === "win32" ? "go.exe" : "go"
}

function observer(context: VerificationContext, ledger: JsonlReceiptLedger): ExecutionObserver {
  return {
    async onIntent(intent) {
      await context.session.emit("intent.created", { intent, source: "verification" })
    },
    async onPolicy(intent, policy) {
      await context.session.emit("policy.evaluated", { intent, policy, source: "verification" })
    },
    async onReceipt(receipt) {
      await ledger.append(receipt)
      await context.session.emit("receipt.recorded", {
        receiptId: receipt.receiptId,
        result: receipt.result.status,
        source: "verification",
      })
    },
  }
}

function agentVerifier(): Verifier {
  return {
    id: "agent.completed",
    async run(context) {
      return {
        id: "agent.completed",
        category: "agent",
        status: context.agentCompleted ? "pass" : "fail",
        summary: context.agentCompleted ? "Bounded agent loop completed normally." : "Bounded agent loop did not complete normally.",
        evidence: context.agentCompleted ? [{ kind: "event", ref: `session:${context.sessionId}:agent.loop.completed` }] : [],
      }
    },
  }
}

function workspaceVerifier(): Verifier {
  return {
    id: "workspace.integrity",
    async run(context) {
      try {
        const root = await realpath(context.workspace)
        const rootStat = await stat(root)
        const gitStat = await stat(`${root}/.git`)
        if (!rootStat.isDirectory()) throw new Error("workspace root is not a directory")
        if (!gitStat.isDirectory() && !gitStat.isFile()) throw new Error(".git is not a file or directory")
        const digest = sha256(root)
        return {
          id: "workspace.integrity",
          category: "workspace",
          status: "pass",
          summary: "Workspace root and Git metadata are present.",
          evidence: [{ kind: "workspace", ref: root, digest }],
        }
      } catch (error) {
        return {
          id: "workspace.integrity",
          category: "workspace",
          status: "fail",
          summary: `Workspace integrity failed: ${errorMessage(error)}`,
          evidence: [],
        }
      }
    },
  }
}

function changeEvidenceVerifier(gateway: ExecutionGateway, ledger: JsonlReceiptLedger): Verifier {
  return {
    id: "git.diff",
    async run(context) {
      const evidence: VerificationEvidenceRef[] = []
      try {
        const obs = observer(context, ledger)
        const diff = await gateway.gitDiff([], obs, { maxOutputBytes: 512 * 1024, timeoutMs: 10_000 })
        evidence.push(receiptRef(diff.receipt))
        const status = await gateway.gitStatus(obs, { maxOutputBytes: 256 * 1024, timeoutMs: 10_000 })
        evidence.push(receiptRef(status.receipt))
        const changed = diff.diff.trim().length > 0 || status.status.trim().length > 0
        return {
          id: "git.diff",
          category: "diff",
          status: changed ? "pass" : "fail",
          summary: changed
            ? `Workspace changes are evidenced (diffBytes=${Buffer.byteLength(diff.diff, "utf8")}, statusBytes=${Buffer.byteLength(status.status, "utf8")}).`
            : "No workspace change is visible to git diff or git status.",
          evidence,
        }
      } catch (error) {
        if (error instanceof ExecutionFailedError) evidence.push(receiptRef(error.receipt))
        return {
          id: "git.diff",
          category: "diff",
          status: "fail",
          summary: `Git change evidence failed: ${errorMessage(error)}`,
          evidence,
        }
      }
    },
  }
}

function commandVerifier(spec: VerificationCommandSpec, gateway: ExecutionGateway, ledger: JsonlReceiptLedger): Verifier {
  return {
    id: `command.${spec.id}`,
    async run(context) {
      if (!context.approveVerification) {
        return {
          id: `command.${spec.id}`,
          category: spec.category,
          status: "fail",
          summary: `Verification command ${spec.id} requires explicit --approve-verification authorization.`,
          evidence: [],
        }
      }
      try {
        const result = await gateway.runCommand(
          `verification.command.${spec.id}`,
          resolveVerificationExecutable(spec.executable),
          spec.args,
          observer(context, ledger),
          {
            timeoutMs: spec.timeoutMs ?? 30_000,
            maxOutputBytes: spec.maxOutputBytes ?? 512 * 1024,
            env: sanitizedVerificationEnv(),
          },
        )
        return {
          id: `command.${spec.id}`,
          category: spec.category,
          status: "pass",
          summary: `Verification command ${spec.id} passed.`,
          evidence: [receiptRef(result.receipt)],
        }
      } catch (error) {
        const evidence = error instanceof ExecutionFailedError ? [receiptRef(error.receipt)] : []
        return {
          id: `command.${spec.id}`,
          category: spec.category,
          status: "fail",
          summary: `Verification command ${spec.id} failed: ${errorMessage(error)}`,
          evidence,
        }
      }
    },
  }
}

function receiptsVerifier(): Verifier {
  return {
    id: "evidence.receipts",
    async run(context) {
      try {
        const receipts = await readReceiptLedger(context.receiptPath)
        const mutation = receipts.find((receipt) => receipt.capability === "repo.apply_patch" && receipt.result.status === "success")
        const allSuccess = receipts.length > 0 && receipts.every((receipt) => receipt.result.status === "success")
        const mutationHasPostState = Boolean(
          mutation && mutation.result.status === "success" && "postStateDigest" in mutation.result && /^[0-9a-f]{64}$/.test(mutation.result.postStateDigest),
        )
        const validDigests = receipts.every((receipt) => /^[0-9a-f]{64}$/.test(receipt.inputDigest))
        const passed = Boolean(mutation && mutationHasPostState && allSuccess && validDigests)
        return {
          id: "evidence.receipts",
          category: "receipts",
          status: passed ? "pass" : "fail",
          summary: passed
            ? `${receipts.length} execution receipt(s) are successful and mutation post-state is attested.`
            : "Receipt evidence is missing a successful attested mutation, contains a non-success result, or has an invalid digest.",
          evidence: receipts.map(receiptRef),
        }
      } catch (error) {
        return {
          id: "evidence.receipts",
          category: "receipts",
          status: "fail",
          summary: `Receipt evidence could not be validated: ${errorMessage(error)}`,
          evidence: [],
        }
      }
    },
  }
}

function policyVerifier(): Verifier {
  return {
    id: "evidence.policy",
    async run(context) {
      try {
        const receipts = await readReceiptLedger(context.receiptPath)
        const passed = receipts.length > 0 && receipts.every((receipt) => receipt.policy.decision === "allow")
        return {
          id: "evidence.policy",
          category: "policy",
          status: passed ? "pass" : "fail",
          summary: passed ? "Every persisted execution receipt was authorized by policy." : "One or more receipts are missing or were not policy-allowed.",
          evidence: receipts.map(receiptRef),
        }
      } catch (error) {
        return {
          id: "evidence.policy",
          category: "policy",
          status: "fail",
          summary: `Policy evidence could not be validated: ${errorMessage(error)}`,
          evidence: [],
        }
      }
    },
  }
}

function commandAggregateVerifier(specs: VerificationCommandSpec[]): Verifier {
  return {
    id: "verification.commands",
    async run(context) {
      const receipts = await readReceiptLedger(context.receiptPath)
      const commandReceipts = receipts.filter((receipt) => receipt.capability.startsWith("verification.command."))
      const hasTests = specs.some((spec) => spec.category === "tests")
      const allExpected = specs.length > 0 && specs.every((spec) =>
        commandReceipts.some((receipt) => receipt.capability === `verification.command.${spec.id}` && receipt.result.status === "success"),
      )
      const passed = context.approveVerification && hasTests && allExpected
      return {
        id: "verification.commands",
        category: "tests",
        status: passed ? "pass" : "fail",
        summary: passed
          ? `All ${specs.length} approved verification command(s) passed, including test evidence.`
          : "Done Gate requires explicit verification approval, at least one tests-category command, and success receipts for every requested command.",
        evidence: commandReceipts.map(receiptRef),
      }
    },
  }
}

export async function runVerificationEngine(input: VerificationContext): Promise<VerificationReport> {
  const startedAt = new Date().toISOString()
  await input.session.emit("verification.started", {
    commands: input.commands.map((command) => ({ id: command.id, category: command.category, executable: command.executable })),
    approveVerification: input.approveVerification,
  })

  const fs = new NodeWorkspaceFileSystem(input.workspace)
  const ledger = new JsonlReceiptLedger(input.receiptPath)
  const readGateway = new ExecutionGateway(fs, fixedPolicy("allow", "K2-S7 verification read-only evidence"))
  const commandGateway = new ExecutionGateway(
    fs,
    fixedPolicy(input.approveVerification ? "allow" : "ask", input.approveVerification ? "explicit --approve-verification authorization" : "verification process authorization required"),
  )
  const registry = new VerifierRegistry()
  registry.register(agentVerifier())
  registry.register(workspaceVerifier())
  registry.register(changeEvidenceVerifier(readGateway, ledger))
  for (const spec of input.commands) registry.register(commandVerifier(spec, commandGateway, ledger))
  registry.register(receiptsVerifier())
  registry.register(policyVerifier())
  registry.register(commandAggregateVerifier(input.commands))

  const checks = await registry.runAll(input)
  const report: VerificationReport = {
    protocol: "kodac.verification",
    version: 1,
    sessionId: input.sessionId,
    startedAt,
    completedAt: new Date().toISOString(),
    passed: checks.every((check) => check.status === "pass"),
    checks,
  }
  await input.session.emit("verification.completed", {
    passed: report.passed,
    checks: checks.length,
    failed: checks.filter((check) => check.status === "fail").map((check) => check.id),
  })
  return report
}
