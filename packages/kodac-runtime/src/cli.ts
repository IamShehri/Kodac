import { createHash, randomUUID } from "node:crypto"
import { homedir } from "node:os"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { NodeWorkspaceFileSystem } from "./edit/filesystem.ts"
import { JsonlReceiptLedger } from "./evidence/ledger.ts"
import { ExecutionGateway } from "./execution/gateway.ts"
import { FixtureModelProvider } from "./model/fixture.ts"
import { ProviderRegistry } from "./model/provider.ts"
import { AgentTurnRunner } from "./model/turn.ts"
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

interface CommonArgs {
  workspace: string
  evidenceDir?: string
  json: boolean
}

interface ApplyPatchArgs extends CommonArgs {
  command: "apply-patch"
  patchFile: string
}

interface AskArgs extends CommonArgs {
  command: "ask"
  prompt: string
  provider: string
  model: string
}

type CliArgs = ApplyPatchArgs | AskArgs

type ActivateSession = (session: RuntimeSession) => void

function workspaceKey(workspace: string): string {
  return createHash("sha256").update(resolve(workspace), "utf8").digest("hex").slice(0, 16)
}

function defaultEvidenceRoot(workspace: string): string {
  return join(homedir(), ".kodac", "evidence", workspaceKey(workspace))
}

function parseCommonOptions(argv: string[], startIndex: number, cwd: string, target: CommonArgs & Record<string, unknown>): void {
  for (let index = startIndex; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--json") {
      target.json = true
      continue
    }
    if (token === "--workspace" || token === "--evidence-dir" || token === "--provider" || token === "--model") {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${token}`)
      if (token === "--workspace") target.workspace = resolve(cwd, value)
      else if (token === "--evidence-dir") target.evidenceDir = resolve(cwd, value)
      else if (token === "--provider") target.provider = value
      else target.model = value
      continue
    }
    throw new Error(`Unknown option: ${token}`)
  }
}

function parseCliArgs(argv: string[], cwd: string): CliArgs {
  if (argv[0] === "apply-patch" && argv[1]) {
    const result: ApplyPatchArgs = {
      command: "apply-patch",
      patchFile: resolve(cwd, argv[1]),
      workspace: resolve(cwd),
      json: false,
    }
    parseCommonOptions(argv, 2, cwd, result as ApplyPatchArgs & Record<string, unknown>)
    if ("provider" in result || "model" in result) throw new Error("--provider and --model are only valid with kodac ask")
    return result
  }

  if (argv[0] === "ask" && argv[1]) {
    const result: AskArgs = {
      command: "ask",
      prompt: argv[1],
      workspace: resolve(cwd),
      provider: "fixture",
      model: "fixture/deterministic-v1",
      json: false,
    }
    parseCommonOptions(argv, 2, cwd, result as AskArgs & Record<string, unknown>)
    return result
  }

  throw new Error(
    "Usage: kodac apply-patch <patch-file> [--workspace <dir>] [--evidence-dir <dir>] [--json]\n" +
      "   or: kodac ask <prompt> [--provider fixture] [--model <id>] [--workspace <dir>] [--evidence-dir <dir>] [--json]",
  )
}

function defaultIO(): CliIO {
  return {
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
  }
}

function sessionPaths(args: CommonArgs, sessionId: string): { eventPath: string; receiptPath: string } {
  const evidenceRoot = args.evidenceDir ?? defaultEvidenceRoot(args.workspace)
  const sessionEvidenceDir = join(evidenceRoot, sessionId)
  return {
    eventPath: join(sessionEvidenceDir, "events.jsonl"),
    receiptPath: join(sessionEvidenceDir, "receipts.jsonl"),
  }
}

async function runApplyPatch(args: ApplyPatchArgs, io: CliIO, activateSession: ActivateSession): Promise<number> {
  const patchText = await readFile(args.patchFile, "utf8")
  const sessionId = randomUUID()
  const { eventPath, receiptPath } = sessionPaths(args, sessionId)
  const session = new RuntimeSession(new JsonlEventSink(eventPath), sessionId)
  activateSession(session)
  const receipts = new JsonlReceiptLedger(receiptPath)
  const fs = new NodeWorkspaceFileSystem(args.workspace)
  const gateway = new ExecutionGateway(fs, fixedPolicy("allow", "human-cli-explicit-apply-patch"))
  const registry = new ToolRegistry()
  registry.register(createApplyPatchTool(gateway, receipts))
  const orchestrator = new RuntimeOrchestrator(registry, session)

  await session.start({ workspace: args.workspace, command: "apply-patch", runtimeSlice: "k2-s2" })
  const result = await orchestrator.invoke<ApplyPatchToolInput, ApplyPatchToolOutput>("repo.apply_patch", { patchText })
  await session.complete({ receiptId: result.receipt.receiptId, tool: "repo.apply_patch", mode: "tool" })

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
}

async function runAsk(args: AskArgs, io: CliIO, activateSession: ActivateSession): Promise<number> {
  const sessionId = randomUUID()
  const { eventPath } = sessionPaths(args, sessionId)
  const session = new RuntimeSession(new JsonlEventSink(eventPath), sessionId)
  activateSession(session)
  const tools = new ToolRegistry()
  const orchestrator = new RuntimeOrchestrator(tools, session)
  const providers = new ProviderRegistry()
  providers.register(new FixtureModelProvider())
  const runner = new AgentTurnRunner(providers, tools, orchestrator, session)

  await session.start({ workspace: args.workspace, command: "ask", runtimeSlice: "k2-s3" })
  const result = await runner.run({
    provider: args.provider,
    model: args.model,
    messages: [{ role: "user", content: args.prompt }],
  })
  await session.complete({ mode: "model_turn", provider: args.provider, model: args.model })

  if (args.json) {
    io.stdout(
      JSON.stringify({
        status: "COMPLETE",
        sessionId,
        provider: args.provider,
        model: args.model,
        assistant: result.assistant,
        evidence: { events: eventPath },
      }),
    )
  } else {
    io.stdout(result.assistant)
    io.stdout(`Evidence: ${eventPath}`)
  }
  return 0
}

export async function runCli(argv: string[], io: CliIO = defaultIO(), cwd = process.cwd()): Promise<number> {
  let session: RuntimeSession | undefined
  const activateSession: ActivateSession = (created) => {
    session = created
  }

  try {
    const args = parseCliArgs(argv, cwd)
    return args.command === "apply-patch"
      ? await runApplyPatch(args, io, activateSession)
      : await runAsk(args, io, activateSession)
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
