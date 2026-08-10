import { createHash, randomUUID } from "node:crypto"
import { homedir } from "node:os"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { NodeWorkspaceFileSystem } from "./edit/filesystem.ts"
import { JsonlReceiptLedger } from "./evidence/ledger.ts"
import { ExecutionGateway } from "./execution/gateway.ts"
import { JsonlEventSink } from "./protocol/event.ts"
import { RuntimeOrchestrator } from "./runtime/orchestrator.ts"
import { RuntimeSession } from "./session/session.ts"
import { createApplyPatchTool, type ApplyPatchToolInput, type ApplyPatchToolOutput } from "./tools/apply-patch.ts"
import { ToolRegistry } from "./tools/registry.ts"
import { fixedPolicy } from "./trust/policy.ts"

export interface CliIO {
  stdout(line: string): void
  stderr(line: string): void
}

interface ApplyPatchArgs {
  patchFile: string
  workspace: string
  evidenceDir?: string
  json: boolean
}

function workspaceKey(workspace: string): string {
  return createHash("sha256").update(resolve(workspace), "utf8").digest("hex").slice(0, 16)
}

function defaultEvidenceRoot(workspace: string): string {
  return join(homedir(), ".kodac", "evidence", workspaceKey(workspace))
}

function parseApplyPatchArgs(argv: string[], cwd: string): ApplyPatchArgs {
  if (argv[0] !== "apply-patch" || !argv[1]) {
    throw new Error("Usage: kodac apply-patch <patch-file> [--workspace <dir>] [--evidence-dir <dir>] [--json]")
  }

  const result: ApplyPatchArgs = {
    patchFile: resolve(cwd, argv[1]),
    workspace: resolve(cwd),
    json: false,
  }

  for (let index = 2; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--json") {
      result.json = true
      continue
    }
    if (token === "--workspace" || token === "--evidence-dir") {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${token}`)
      if (token === "--workspace") result.workspace = resolve(cwd, value)
      else result.evidenceDir = resolve(cwd, value)
      continue
    }
    throw new Error(`Unknown option: ${token}`)
  }

  return result
}

function defaultIO(): CliIO {
  return {
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
  }
}

export async function runCli(argv: string[], io: CliIO = defaultIO(), cwd = process.cwd()): Promise<number> {
  let session: RuntimeSession | undefined

  try {
    const args = parseApplyPatchArgs(argv, cwd)
    const patchText = await readFile(args.patchFile, "utf8")
    const sessionId = randomUUID()
    const evidenceRoot = args.evidenceDir ?? defaultEvidenceRoot(args.workspace)
    const sessionEvidenceDir = join(evidenceRoot, sessionId)
    const eventPath = join(sessionEvidenceDir, "events.jsonl")
    const receiptPath = join(sessionEvidenceDir, "receipts.jsonl")

    session = new RuntimeSession(new JsonlEventSink(eventPath), sessionId)
    const receipts = new JsonlReceiptLedger(receiptPath)
    const fs = new NodeWorkspaceFileSystem(args.workspace)
    const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "human-cli-explicit-apply-patch"))
    const registry = new ToolRegistry()
    registry.register(createApplyPatchTool(gateway, receipts))
    const orchestrator = new RuntimeOrchestrator(registry, session)

    await session.start({ workspace: args.workspace, command: "apply-patch" })
    const result = await orchestrator.invoke<ApplyPatchToolInput, ApplyPatchToolOutput>("repo.apply_patch", { patchText })
    await session.complete({ receiptId: result.receipt.receiptId, tool: "repo.apply_patch" })

    if (args.json) {
      io.stdout(
        JSON.stringify({
          status: "PROVEN_READY",
          sessionId,
          affected: result.affected,
          receiptId: result.receipt.receiptId,
          evidence: { events: eventPath, receipts: receiptPath },
        }),
      )
    } else {
      io.stdout(`Session: ${sessionId}`)
      io.stdout("✓ intent created")
      io.stdout("✓ policy evaluated")
      io.stdout("✓ workspace boundary verified")
      io.stdout("✓ patch applied")
      io.stdout(`✓ receipt written: ${receiptPath}`)
      io.stdout("PROVEN READY")
    }
    return 0
  } catch (error) {
    if (session) {
      try {
        await session.fail(error)
      } catch {
        // The original failure remains authoritative if evidence persistence is also unavailable.
      }
    }
    io.stderr(error instanceof Error ? error.message : String(error))
    return 1
  }
}

const isDirectInvocation = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href
if (isDirectInvocation) {
  process.exitCode = await runCli(process.argv.slice(2))
}
