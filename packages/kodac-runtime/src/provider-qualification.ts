import { createHash, randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { BoundedAgentLoop, type AgentLoopResult } from "./agent/loop.ts"
import { NodeWorkspaceFileSystem } from "./edit/filesystem.ts"
import { JsonlReceiptLedger } from "./evidence/ledger.ts"
import { ExecutionGateway } from "./execution/gateway.ts"
import { OpenAICompatibleProvider } from "./model/openai-compatible.ts"
import { OpenAIResponsesProvider } from "./model/openai.ts"
import {
  ModelProviderError,
  ProviderRegistry,
  type ModelProvider,
  type ModelProviderRequest,
  type ModelProviderResponse,
  type ModelProviderStreamEvent,
} from "./model/provider.ts"
import { AgentTurnRunner } from "./model/turn.ts"
import { JsonlEventSink } from "./protocol/event.ts"
import { RuntimeOrchestrator } from "./runtime/orchestrator.ts"
import { RuntimeSession } from "./session/session.ts"
import { ToolRegistry } from "./tools/registry.ts"
import { createRepoListTool, createRepoReadTool, createRepoSearchTool } from "./tools/workspace-read.ts"
import { fixedPolicy, workspaceAgentPolicy } from "./trust/policy.ts"

export type QualificationStatus = "PASS" | "FAIL" | "PENDING"

export interface ProviderQualificationCheck {
  id: string
  status: QualificationStatus
  summary: string
  evidence: Record<string, unknown>
}

export interface ProviderQualificationReport {
  protocol: "kodac.provider-qualification"
  version: 1
  sessionId: string
  provider: string
  model: string
  workspaceDigest: string
  startedAt: string
  completedAt: string
  status: QualificationStatus
  checks: ProviderQualificationCheck[]
  artifacts: { events: string; receipts: string }
  reportDigest: string
}

export interface ProviderQualificationIO {
  stdout(line: string): void
  stderr(line: string): void
}

export interface ProviderQualificationRuntimeOptions {
  modelProvider?: ModelProvider
}

interface QualificationArgs {
  provider: "openai" | "openai-compatible"
  model: string
  workspace: string
  evidenceDir?: string
  json: boolean
}

const READ_ONLY_TOOLS = new Set(["repo.list", "repo.read", "repo.search"])
const REQUIRED_CHECK_IDS = [
  "credential.preflight",
  "live.text_stream",
  "live.request_metadata",
  "live.repo_list",
  "live.repo_read",
  "live.repo_search",
  "live.tool_result_continuation",
  "workspace.no_write",
  "agent.bounded_termination",
] as const

const QUALIFICATION_LIMITS = {
  maxTurns: 3,
  maxToolCalls: 2,
  maxElapsedMs: 30_000,
  maxFailures: 1,
  maxIdenticalToolCalls: 1,
  maxRepeatedTurnSignatures: 1,
  maxToolResultChars: 16_000,
}

function sha256(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex")
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (!value || typeof value !== "object") return value
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .filter(([, item]) => item !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, item]) => [key, canonicalize(item)]),
  )
}

function stableJson(value: unknown): string {
  return JSON.stringify(canonicalize(value))
}

function defaultIO(): ProviderQualificationIO {
  return {
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
  }
}

function parseArgs(argv: string[], cwd: string): QualificationArgs {
  let provider: QualificationArgs["provider"] = "openai"
  let model = ""
  let workspace = resolve(cwd)
  let evidenceDir: string | undefined
  let json = false

  for (let index = 0; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--json") {
      json = true
      continue
    }
    if (token === "--provider" || token === "--model" || token === "--workspace" || token === "--evidence-dir") {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${token}`)
      if (token === "--provider") {
        if (value !== "openai" && value !== "openai-compatible") {
          throw new Error("--provider must be openai or openai-compatible")
        }
        provider = value
      } else if (token === "--model") model = value
      else if (token === "--workspace") workspace = resolve(cwd, value)
      else evidenceDir = resolve(cwd, value)
      continue
    }
    throw new Error(`Unknown provider-qualify option: ${token}`)
  }

  if (!model.trim()) {
    throw new Error(
      "Usage: kodac provider-qualify --model <model-id> [--provider openai|openai-compatible] " +
        "[--workspace <dir>] [--evidence-dir <dir>] [--json]",
    )
  }
  return { provider, model, workspace, evidenceDir, json }
}

function pathIsInside(parent: string, candidate: string): boolean {
  const rel = relative(resolve(parent), resolve(candidate))
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

function providerFromEnv(name: QualificationArgs["provider"], env: NodeJS.ProcessEnv): ModelProvider {
  if (name === "openai") return new OpenAIResponsesProvider({ apiKey: env.OPENAI_API_KEY, stream: true })
  return OpenAICompatibleProvider.fromEnv(env, { stream: true })
}

function credentialEvidence(args: QualificationArgs, env: NodeJS.ProcessEnv, injected: boolean): ProviderQualificationCheck {
  if (injected) {
    return {
      id: "credential.preflight",
      status: "PASS",
      summary: "Injected provider accepted for qualification harness testing.",
      evidence: { mode: "injected", secretPersisted: false },
    }
  }

  if (args.provider === "openai") {
    const present = Boolean(env.OPENAI_API_KEY?.trim())
    return {
      id: "credential.preflight",
      status: present ? "PASS" : "FAIL",
      summary: present ? "OPENAI_API_KEY is available in the process environment." : "OPENAI_API_KEY is missing.",
      evidence: { source: "OPENAI_API_KEY", present, secretPersisted: false },
    }
  }

  const source = env.KODAC_OPENAI_COMPATIBLE_API_KEY?.trim()
    ? "KODAC_OPENAI_COMPATIBLE_API_KEY"
    : env.OPENAI_API_KEY?.trim()
      ? "OPENAI_API_KEY"
      : undefined
  const baseRaw = env.KODAC_OPENAI_COMPATIBLE_BASE_URL ?? env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"
  let origin = "invalid"
  let loopback = false
  try {
    const url = new URL(baseRaw)
    origin = url.origin
    loopback = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1"
  } catch {
    return {
      id: "credential.preflight",
      status: "FAIL",
      summary: "OpenAI-compatible base URL is invalid.",
      evidence: { source, present: Boolean(source), origin, loopback, secretPersisted: false },
    }
  }
  const pass = Boolean(source) || loopback
  return {
    id: "credential.preflight",
    status: pass ? "PASS" : "FAIL",
    summary: pass
      ? source
        ? "Compatible-provider credential is available in the process environment."
        : "Loopback-compatible endpoint is allowed without a credential."
      : "Remote compatible-provider qualification requires an environment credential.",
    evidence: { source, present: Boolean(source), origin, loopback, secretPersisted: false },
  }
}

class ReadOnlyQualificationProvider implements ModelProvider {
  readonly name: string
  private readonly delegate: ModelProvider
  private readonly calls: string[] = []
  private readonly blocked: string[] = []

  constructor(delegate: ModelProvider) {
    this.delegate = delegate
    this.name = delegate.name
  }

  mark(): number {
    return this.calls.length
  }

  callsSince(mark: number): string[] {
    return this.calls.slice(mark)
  }

  blockedCalls(): string[] {
    return [...this.blocked]
  }

  async generate(request: ModelProviderRequest): Promise<ModelProviderResponse> {
    const response = await this.delegate.generate(request)
    for (const call of response.toolCalls) {
      this.calls.push(call.name)
      if (!READ_ONLY_TOOLS.has(call.name)) {
        this.blocked.push(call.name)
        throw new ModelProviderError(
          "qualification_non_read_only_tool",
          `Provider requested disallowed tool ${call.name} during read-only qualification.`,
          { retryable: false },
        )
      }
    }
    return response
  }
}

function aggregate(checks: ProviderQualificationCheck[]): QualificationStatus {
  if (checks.some((check) => check.status === "FAIL")) return "FAIL"
  if (checks.some((check) => check.status === "PENDING")) return "PENDING"
  return "PASS"
}

async function writeReport(
  reportPath: string,
  report: Omit<ProviderQualificationReport, "reportDigest">,
): Promise<ProviderQualificationReport> {
  const reportDigest = sha256(stableJson(report))
  const complete = { ...report, reportDigest }
  await mkdir(dirname(reportPath), { recursive: true })
  await writeFile(reportPath, `${JSON.stringify(complete, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
  return complete
}

async function chooseProbe(fs: NodeWorkspaceFileSystem): Promise<{ readPath: string; searchQuery: string }> {
  const preferred = ["README.md", "package.json", "pyproject.toml", "Cargo.toml", "go.mod"]
  const entries = await fs.list(".", { recursive: true, maxEntries: 200, maxDepth: 4 })
  const files = entries.filter((entry) => entry.type === "file").map((entry) => entry.path)
  const candidates = [...preferred.filter((path) => files.includes(path)), ...files.filter((path) => !preferred.includes(path))]
  for (const candidate of candidates) {
    try {
      const content = await fs.readTextBounded(candidate, 64 * 1024)
      if (content.includes("\u0000")) continue
      const token = content.match(/[A-Za-z][A-Za-z0-9_-]{3,}/)?.[0]
      if (token) return { readPath: candidate, searchQuery: token }
    } catch {
      // Try the next bounded text file.
    }
  }
  throw new Error("Provider qualification requires at least one bounded UTF-8 text file in the workspace.")
}

async function gitStatusSnapshot(
  gateway: ExecutionGateway,
  ledger: JsonlReceiptLedger,
  session: RuntimeSession,
): Promise<{ statusDigest: string; statusLength: number; receiptId: string }> {
  const result = await gateway.gitStatus({
    async onIntent(intent) {
      await session.emit("intent.created", { intent })
    },
    async onPolicy(intent, policy) {
      await session.emit("policy.evaluated", { intent, policy })
    },
    async onReceipt(receipt) {
      await ledger.append(receipt)
      await session.emit("receipt.recorded", { receiptId: receipt.receiptId, result: receipt.result.status })
    },
  })
  return {
    statusDigest: sha256(result.status),
    statusLength: result.status.length,
    receiptId: result.receipt.receiptId,
  }
}

function scenarioPrompt(kind: "list" | "read" | "search", probe: { readPath: string; searchQuery: string }): { expected: string; sentinel: string; prompt: string } {
  if (kind === "list") {
    return {
      expected: "repo.list",
      sentinel: "KODAC_LIST_OK",
      prompt:
        "Qualification step. Use the available repository-listing function (Kodac canonical repo.list) to list the workspace root with path '.', recursive false, maxEntries 20, maxDepth 1. " +
        "Do not call any other tool. After receiving the tool result, reply exactly KODAC_LIST_OK.",
    }
  }
  if (kind === "read") {
    return {
      expected: "repo.read",
      sentinel: "KODAC_READ_OK",
      prompt:
        `Qualification step. Use the available bounded repository-read function (Kodac canonical repo.read) to read ${JSON.stringify(probe.readPath)} with maxBytes 65536. ` +
        "Do not call any other tool. After receiving the tool result, reply exactly KODAC_READ_OK.",
    }
  }
  return {
    expected: "repo.search",
    sentinel: "KODAC_SEARCH_OK",
    prompt:
      `Qualification step. Use the available repository-search function (Kodac canonical repo.search) to search for ${JSON.stringify(probe.searchQuery)} from path '.', caseSensitive false, maxResults 5. ` +
      "Do not call any other tool. After receiving the tool result, reply exactly KODAC_SEARCH_OK.",
  }
}

async function runReadOnlyScenario(
  loop: BoundedAgentLoop,
  provider: ReadOnlyQualificationProvider,
  args: QualificationArgs,
  spec: { expected: string; sentinel: string; prompt: string },
): Promise<{ result: AgentLoopResult; calls: string[]; pass: boolean }> {
  const mark = provider.mark()
  const result = await loop.run({
    provider: args.provider,
    model: args.model,
    messages: [{ role: "user", content: spec.prompt }],
    limits: QUALIFICATION_LIMITS,
  })
  const calls = provider.callsSince(mark)
  const pass = result.status === "completed" && calls.includes(spec.expected) && result.assistant.trim() === spec.sentinel
  return { result, calls, pass }
}

export async function runProviderQualification(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
  io: ProviderQualificationIO = defaultIO(),
  cwd = process.cwd(),
  runtimeOptions: ProviderQualificationRuntimeOptions = {},
): Promise<number> {
  let session: RuntimeSession | undefined
  try {
    const args = parseArgs(argv, cwd)
    const evidenceRoot = args.evidenceDir ?? join(homedir(), ".kodac", "provider-qualification")
    if (pathIsInside(args.workspace, evidenceRoot)) {
      throw new Error("Provider qualification evidence directory must be outside the workspace so the no-write assertion remains meaningful.")
    }

    const sessionId = randomUUID()
    const sessionDir = join(evidenceRoot, sessionId)
    const eventPath = join(sessionDir, "events.jsonl")
    const receiptPath = join(sessionDir, "receipts.jsonl")
    const reportPath = join(sessionDir, "qualification-report.json")
    session = new RuntimeSession(new JsonlEventSink(eventPath), sessionId)
    const checks: ProviderQualificationCheck[] = []
    const startedAt = new Date().toISOString()

    await session.start({ workspace: args.workspace, command: "provider-qualify", runtimeSlice: "k2-s8d" })
    await session.emit("provider.qualification.started", {
      provider: args.provider,
      model: args.model,
      workspaceDigest: sha256(resolve(args.workspace)),
    })

    const record = async (check: ProviderQualificationCheck): Promise<void> => {
      checks.push(check)
      await session!.emit("provider.qualification.check.completed", {
        id: check.id,
        status: check.status,
        summary: check.summary,
      })
    }

    const credential = credentialEvidence(args, env, Boolean(runtimeOptions.modelProvider))
    let delegate: ModelProvider | undefined
    if (credential.status === "PASS") {
      try {
        delegate = runtimeOptions.modelProvider ?? providerFromEnv(args.provider, env)
      } catch (error) {
        credential.status = "FAIL"
        credential.summary = "Provider configuration preflight failed."
        credential.evidence = {
          ...credential.evidence,
          configurationError: error instanceof Error ? error.message : String(error),
        }
      }
    }
    await record(credential)

    const finalize = async (): Promise<{ report: ProviderQualificationReport; reportPath: string; eventPath: string; receiptPath: string }> => {
      const seen = new Set(checks.map((check) => check.id))
      for (const id of REQUIRED_CHECK_IDS) {
        if (seen.has(id)) continue
        await record({ id, status: "PENDING", summary: "Qualification step was not executed because an earlier gate blocked progress.", evidence: {} })
      }
      const completedAt = new Date().toISOString()
      const status = aggregate(checks)
      const report = await writeReport(reportPath, {
        protocol: "kodac.provider-qualification",
        version: 1,
        sessionId,
        provider: args.provider,
        model: args.model,
        workspaceDigest: sha256(resolve(args.workspace)),
        startedAt,
        completedAt,
        status,
        checks,
        artifacts: { events: "events.jsonl", receipts: "receipts.jsonl" },
      })
      await session!.emit("provider.qualification.completed", {
        provider: args.provider,
        model: args.model,
        status,
        reportDigest: report.reportDigest,
        checkCount: checks.length,
      })
      await session!.complete({ mode: "agent_loop", provider: args.provider, model: args.model })
      return { report, reportPath, eventPath, receiptPath }
    }

    if (!delegate || credential.status !== "PASS") {
      const final = await finalize()
      if (args.json) {
        io.stdout(JSON.stringify({ status: final.report.status, sessionId, provider: args.provider, model: args.model, report: final.reportPath, evidence: { events: final.eventPath, receipts: final.receiptPath } }))
      } else {
        io.stderr("Provider qualification blocked at credential/configuration preflight.")
        io.stderr(`Report: ${final.reportPath}`)
      }
      return 3
    }

    const guarded = new ReadOnlyQualificationProvider(delegate)
    const providers = new ProviderRegistry()
    providers.register(guarded)

    const noToolRegistry = new ToolRegistry()
    const textRunner = new AgentTurnRunner(providers, noToolRegistry, new RuntimeOrchestrator(noToolRegistry, session), session)
    const streamCounts = new Map<ModelProviderStreamEvent["type"], number>()
    let textResult: Awaited<ReturnType<AgentTurnRunner["run"]>> | undefined
    try {
      textResult = await textRunner.run({
        provider: args.provider,
        model: args.model,
        messages: [{ role: "user", content: "Reply with exactly KODAC_PROVIDER_OK." }],
      }, {
        onStreamEvent(event) {
          streamCounts.set(event.type, (streamCounts.get(event.type) ?? 0) + 1)
        },
      })
      const sentinel = textResult.assistant.trim() === "KODAC_PROVIDER_OK"
      const streamed = (streamCounts.get("started") ?? 0) >= 1 && (streamCounts.get("text_delta") ?? 0) >= 1 && (streamCounts.get("completed") ?? 0) >= 1
      await record({
        id: "live.text_stream",
        status: sentinel && streamed ? "PASS" : "FAIL",
        summary: sentinel && streamed ? "Live provider text streaming returned the qualification sentinel." : "Live provider text streaming did not satisfy the sentinel/stream contract.",
        evidence: {
          assistantDigest: sha256(textResult.assistant),
          assistantLength: textResult.assistant.length,
          streamStartedEvents: streamCounts.get("started") ?? 0,
          streamTextDeltaEvents: streamCounts.get("text_delta") ?? 0,
          streamCompletedEvents: streamCounts.get("completed") ?? 0,
        },
      })
    } catch (error) {
      await record({
        id: "live.text_stream",
        status: "FAIL",
        summary: "Live provider text streaming failed.",
        evidence: { error: error instanceof Error ? error.message : String(error) },
      })
    }

    const usage = textResult?.metadata?.usage
    const metadataPass = Boolean(
      textResult?.metadata?.requestId &&
      textResult?.metadata?.responseId &&
      usage?.inputTokens !== undefined &&
      usage?.outputTokens !== undefined &&
      usage?.totalTokens !== undefined,
    )
    await record({
      id: "live.request_metadata",
      status: metadataPass ? "PASS" : "FAIL",
      summary: metadataPass ? "Live response includes request/response identifiers and token usage." : "Live response is missing required request/response identifiers or usage metadata.",
      evidence: {
        requestIdPresent: Boolean(textResult?.metadata?.requestId),
        responseIdPresent: Boolean(textResult?.metadata?.responseId),
        usage,
        attempts: textResult?.metadata?.attempts,
        latencyMs: textResult?.metadata?.latencyMs,
      },
    })

    const fs = new NodeWorkspaceFileSystem(args.workspace)
    const receiptLedger = new JsonlReceiptLedger(receiptPath)
    const statusGateway = new ExecutionGateway(fs, fixedPolicy("allow", "provider qualification read-only git snapshot"))
    let beforeStatus: Awaited<ReturnType<typeof gitStatusSnapshot>> | undefined
    try {
      beforeStatus = await gitStatusSnapshot(statusGateway, receiptLedger, session)
    } catch (error) {
      await record({
        id: "workspace.no_write",
        status: "FAIL",
        summary: "Unable to establish pre-qualification Git status evidence.",
        evidence: { error: error instanceof Error ? error.message : String(error) },
      })
    }

    const readPolicy = workspaceAgentPolicy(false)
    const readTools = new ToolRegistry()
    readTools.register(createRepoListTool(fs, readPolicy))
    readTools.register(createRepoReadTool(fs, readPolicy))
    readTools.register(createRepoSearchTool(fs, readPolicy))
    const readRunner = new AgentTurnRunner(providers, readTools, new RuntimeOrchestrator(readTools, session), session)
    const loop = new BoundedAgentLoop(readRunner, session)
    const scenarioResults: Array<{ id: string; result?: AgentLoopResult; calls: string[] }> = []

    let probe: { readPath: string; searchQuery: string } | undefined
    try {
      probe = await chooseProbe(fs)
    } catch (error) {
      await record({ id: "live.repo_list", status: "PENDING", summary: "Read-only tool qualification could not start because no bounded text probe was available.", evidence: { error: error instanceof Error ? error.message : String(error) } })
      await record({ id: "live.repo_read", status: "PENDING", summary: "Read qualification was not executed.", evidence: {} })
      await record({ id: "live.repo_search", status: "PENDING", summary: "Search qualification was not executed.", evidence: {} })
    }

    if (probe) {
      const scenarios = [
        { id: "live.repo_list", ...scenarioPrompt("list", probe) },
        { id: "live.repo_read", ...scenarioPrompt("read", probe) },
        { id: "live.repo_search", ...scenarioPrompt("search", probe) },
      ]
      for (const scenario of scenarios) {
        try {
          const outcome = await runReadOnlyScenario(loop, guarded, args, scenario)
          scenarioResults.push({ id: scenario.id, result: outcome.result, calls: outcome.calls })
          await record({
            id: scenario.id,
            status: outcome.pass ? "PASS" : "FAIL",
            summary: outcome.pass ? `${scenario.expected} completed through the bounded agent loop.` : `${scenario.expected} did not satisfy the qualification contract.`,
            evidence: {
              requestedTools: outcome.calls,
              reason: outcome.result.reason,
              budget: outcome.result.budget,
              assistantDigest: sha256(outcome.result.assistant),
              assistantLength: outcome.result.assistant.length,
            },
          })
        } catch (error) {
          scenarioResults.push({ id: scenario.id, calls: [] })
          await record({
            id: scenario.id,
            status: "FAIL",
            summary: `${scenario.expected} qualification failed.`,
            evidence: { error: error instanceof Error ? error.message : String(error) },
          })
        }
      }
    }

    const continuationPass = scenarioResults.length === 3 && scenarioResults.every(({ result }) =>
      result?.status === "completed" && result.budget.turnsUsed >= 2 && result.budget.toolCallsUsed >= 1
    )
    await record({
      id: "live.tool_result_continuation",
      status: continuationPass ? "PASS" : "FAIL",
      summary: continuationPass ? "Each read-only tool result was fed back into a subsequent model turn." : "Tool-result continuation was not proven for every read-only qualification scenario.",
      evidence: {
        scenarios: scenarioResults.map(({ id, result, calls }) => ({ id, calls, status: result?.status, reason: result?.reason, budget: result?.budget })),
      },
    })

    const boundedPass = scenarioResults.length === 3 && scenarioResults.every(({ result }) =>
      result?.status === "completed" &&
      result.budget.turnsUsed <= QUALIFICATION_LIMITS.maxTurns &&
      result.budget.toolCallsUsed <= QUALIFICATION_LIMITS.maxToolCalls &&
      result.budget.failuresUsed <= QUALIFICATION_LIMITS.maxFailures &&
      result.budget.elapsedMs <= QUALIFICATION_LIMITS.maxElapsedMs
    )
    await record({
      id: "agent.bounded_termination",
      status: boundedPass ? "PASS" : "FAIL",
      summary: boundedPass ? "All live read-only scenarios terminated within qualification budgets." : "At least one live read-only scenario failed to terminate within qualification budgets.",
      evidence: { limits: QUALIFICATION_LIMITS },
    })

    if (!checks.some((check) => check.id === "workspace.no_write")) {
      let afterStatus: Awaited<ReturnType<typeof gitStatusSnapshot>> | undefined
      try {
        afterStatus = await gitStatusSnapshot(statusGateway, receiptLedger, session)
      } catch (error) {
        await record({
          id: "workspace.no_write",
          status: "FAIL",
          summary: "Unable to establish post-qualification Git status evidence.",
          evidence: { error: error instanceof Error ? error.message : String(error) },
        })
      }
      if (beforeStatus && afterStatus) {
        const blocked = guarded.blockedCalls()
        const unchanged = beforeStatus.statusDigest === afterStatus.statusDigest && beforeStatus.statusLength === afterStatus.statusLength
        await record({
          id: "workspace.no_write",
          status: unchanged && blocked.length === 0 ? "PASS" : "FAIL",
          summary: unchanged && blocked.length === 0 ? "Read-only qualification left Git workspace status unchanged and requested no non-read-only tools." : "Read-only qualification changed Git status or requested a non-read-only tool.",
          evidence: {
            beforeStatusDigest: beforeStatus.statusDigest,
            afterStatusDigest: afterStatus.statusDigest,
            beforeStatusLength: beforeStatus.statusLength,
            afterStatusLength: afterStatus.statusLength,
            beforeReceiptId: beforeStatus.receiptId,
            afterReceiptId: afterStatus.receiptId,
            blockedToolRequests: blocked,
          },
        })
      }
    }

    const final = await finalize()
    if (args.json) {
      io.stdout(JSON.stringify({ status: final.report.status, sessionId, provider: args.provider, model: args.model, report: final.reportPath, evidence: { events: final.eventPath, receipts: final.receiptPath } }))
    } else {
      io.stdout(`Provider qualification: ${final.report.status}`)
      for (const check of final.report.checks) io.stdout(`${check.status === "PASS" ? "✓" : check.status === "FAIL" ? "✗" : "!"} ${check.id}: ${check.summary}`)
      io.stdout(`Report: ${final.reportPath}`)
      io.stdout(`Events: ${final.eventPath}`)
      io.stdout(`Receipts: ${final.receiptPath}`)
    }
    return final.report.status === "PASS" ? 0 : 3
  } catch (error) {
    if (session) {
      try {
        await session.fail(error)
      } catch {
        // Preserve the original qualification failure if evidence persistence also fails.
      }
    }
    io.stderr(error instanceof Error ? error.message : String(error))
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runProviderQualification(process.argv.slice(2)).then((code) => { process.exitCode = code })
}
