import { createHash, randomUUID } from "node:crypto"
import { homedir } from "node:os"
import { readFile } from "node:fs/promises"
import { join, resolve } from "node:path"
import { pathToFileURL } from "node:url"
import { BoundedAgentLoop, DEFAULT_AGENT_LOOP_LIMITS, type AgentLoopLimits } from "./agent/loop.ts"
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

interface SolveArgs extends CommonArgs {
  command: "solve"
  prompt: string
  provider: string
  model: string
  limits: AgentLoopLimits
}

type CliArgs = ApplyPatchArgs | AskArgs | SolveArgs

type ActivateSession = (session: RuntimeSession) => void

function workspaceKey(workspace: string): string {
  return createHash("sha256").update(resolve(workspace), "utf8").digest("hex").slice(0, 16)
}

function defaultEvidenceRoot(workspace: string): string {
  return join(homedir(), ".kodac", "evidence", workspaceKey(workspace))
}

function parsePositiveInteger(option: string, value: string): number {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${option} must be a positive integer`)
  return parsed
}

function parseCommonOptions(argv: string[], startIndex: number, cwd: string, target: CommonArgs & Record<string, unknown>): void {
  for (let index = startIndex; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--json") {
      target.json = true
      continue
    }
    if (
      token === "--workspace" || token === "--evidence-dir" || token === "--provider" || token === "--model" ||
      token === "--max-turns" || token === "--max-tool-calls" || token === "--max-elapsed-ms" || token === "--max-failures"
    ) {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${token}`)
      if (token === "--workspace") target.workspace = resolve(cwd, value)
      else if (token === "--evidence-dir") target.evidenceDir = resolve(cwd, value)
      else if (token === "--provider") target.provider = value
      else if (token === "--model") target.model = value
      else if (token === "--max-turns") target.maxTurns = parsePositiveInteger(token, value)
      else if (token === "--max-tool-calls") target.maxToolCalls = parsePositiveInteger(token, value)
      else if (token === "--max-elapsed-ms") target.maxElapsedMs = parsePositiveInteger(token, value)
      else target.maxFailures = parsePositiveInteger(token, value)
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
    if ("provider" in result || "model" in result || "maxTurns" in result || "maxToolCalls" in result || "maxElapsedMs" in result || "maxFailures" in result) {
      throw new Error("Model and agent-loop options are not valid with kodac apply-patch")
    }
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
    if ("maxTurns" in result || "maxToolCalls" in result || "maxElapsedMs" in result || "maxFailures" in result) {
      throw new Error("Agent-loop limits are only valid with kodac solve")
    }
    return result
  }

  if (argv[0] === "solve" && argv[1]) {
    const mutable = {
      command: "solve" as const,
      prompt: argv[1],
      workspace: resolve(cwd),
      provider: "fixture",
      model: "fixture/deterministic-v1",
      json: false,
      maxTurns: DEFAULT_AGENT_LOOP_LIMITS.maxTurns,
      maxToolCalls: DEFAULT_AGENT_LOOP_LIMITS.maxToolCalls,
      maxElapsedMs: DEFAULT_AGENT_LOOP_LIMITS.maxElapsedMs,
      maxFailures: DEFAULT_AGENT_LOOP_LIMITS.maxFailures,
    }
    parseCommonOptions(argv, 2, cwd, mutable)
    return {
      command: "solve",
      prompt: mutable.prompt,
      workspace: mutable.workspace,
      evidenceDir: mutable.evidenceDir as string | undefined,
      provider: mutable.provider,
      model: mutable.model,
      json: mutable.json,
      limits: {
        ...DEFAULT_AGENT_LOOP_LIMITS,
        maxTurns: mutable.maxTurns,
        maxToolCalls: mutable.maxToolCalls,
        maxElapsedMs: mutable.maxElapsedMs,
        maxFailures: mutable.maxFailures,
      },
    }
  }

  throw new Error(
    "Usage: kodac apply-patch <patch-file> [--workspace <dir>] [--evidence-dir <dir>] [--json]\n" +
      "   or: kodac ask <prompt> [--provider fixture] [--model <id>] [--workspace <dir>] [--evidence-dir <dir>] [--json]\n" +
      "   or: kodac solve <task> [--provider fixture] [--model <id>] [--max-turns <n>] [--max-tool-calls <n>] " +
      "[--max-elapsed-ms <n>] [--max-failures <n>] [--workspace <dir>] [--evidence-dir <dir>] [--json]",
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

function modelRuntime(session: RuntimeSession): {
  tools: ToolRegistry
  orchestrator: RuntimeOrchestrator
  providers: ProviderRegistry
  runner: AgentTurnRunner
} {
  const tools = new ToolRegistry()
  const orchestrator = new RuntimeOrchestrator(tools, session)
  const providers = new ProviderRegistry()
  providers.register(new FixtureModelProvider())
  return { tools, orchestrator, providers, runner: new AgentTurnRunner(providers, tools, orchestrator, session) }
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
    io.stdout(JSON.stringify({
      status: "PROVEN_READY",
      sessionId,
      affected: result.affected,
      receiptId: result.receipt.receiptId,
      evidence: { events: eventPath, receipts: receiptPath },
    }))
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
  const { runner } = modelRuntime(session)

  await session.start({ workspace: args.workspace, command: "ask", runtimeSlice: "k2-s3" })
  const result = await runner.run({
    provider: args.provider,
    model: args.model,
    messages: [{ role: "user", content: args.prompt }],
  })
  await session.complete({ mode: "model_turn", provider: args.provider, model: args.model })

  if (args.json) {
    io.stdout(JSON.stringify({
      status: "COMPLETE",
      sessionId,
      provider: args.provider,
      model: args.model,
      assistant: result.assistant,
      evidence: { events: eventPath },
    }))
  } else {
    io.stdout(result.assistant)
    io.stdout(`Evidence: ${eventPath}`)
  }
  return 0
}

async function runSolve(args: SolveArgs, io: CliIO, activateSession: ActivateSession): Promise<number> {
  const sessionId = randomUUID()
  const { eventPath } = sessionPaths(args, sessionId)
  const session = new RuntimeSession(new JsonlEventSink(eventPath), sessionId)
  activateSession(session)
  const { runner } = modelRuntime(session)
  const loop = new BoundedAgentLoop(runner, session)

  await session.start({ workspace: args.workspace, command: "solve", runtimeSlice: "k2-s4" })
  const result = await loop.run({
    provider: args.provider,
    model: args.model,
    messages: [{ role: "user", content: args.prompt }],
    limits: args.limits,
  })

  if (result.status === "stopped") {
    await session.fail(new Error(`Agent loop stopped: ${result.reason}`))
    if (args.json) {
      io.stdout(JSON.stringify({ status: "STOPPED", sessionId, reason: result.reason, budget: result.budget, evidence: { events: eventPath } }))
    } else {
      io.stderr(`Agent loop stopped: ${result.reason}`)
      io.stderr(`Evidence: ${eventPath}`)
    }
    return 2
  }

  await session.complete({ mode: "agent_loop", provider: args.provider, model: args.model })
  if (args.json) {
    io.stdout(JSON.stringify({
      status: "AGENT_COMPLETE",
      proven: false,
      sessionId,
      provider: args.provider,
      model: args.model,
      assistant: result.assistant,
      budget: result.budget,
      evidence: { events: eventPath },
    }))
  } else {
    if (result.assistant) io.stdout(result.assistant)
    io.stdout(`Agent loop complete: ${result.budget.turnsUsed} turn(s), ${result.budget.toolCallsUsed} tool call(s)`)
    io.stdout(`Evidence: ${eventPath}`)
    io.stdout("NOT PROVEN READY — verification and Done Gate have not run")
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
    if (args.command === "apply-patch") return await runApplyPatch(args, io, activateSession)
    if (args.command === "ask") return await runAsk(args, io, activateSession)
    return await runSolve(args, io, activateSession)
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
