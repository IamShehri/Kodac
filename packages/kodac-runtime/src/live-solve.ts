import { createHash, randomUUID } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import { homedir } from "node:os"
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path"
import { pathToFileURL } from "node:url"
import { runCli, type CliIO } from "./cli.ts"
import { OpenAICompatibleProvider } from "./model/openai-compatible.ts"
import { OpenAIResponsesProvider } from "./model/openai.ts"
import type { ModelProvider } from "./model/provider.ts"
import { verifyProviderQualificationReport, type QualifiedProviderAuthorization } from "./provider-qualification-gate.ts"

interface LiveSolveArgs {
  task: string
  provider: "openai" | "openai-compatible"
  model: string
  workspace: string
  qualificationReport: string
  evidenceDir?: string
  json: boolean
  approveWrites: boolean
  approveVerification: boolean
  passthrough: string[]
}

export interface ControlledLiveSolveRuntimeOptions {
  modelProvider?: ModelProvider
  now?: () => number
}

export interface ControlledLiveSolveIO extends CliIO {}

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

function defaultIO(): ControlledLiveSolveIO {
  return {
    stdout: (line) => process.stdout.write(`${line}\n`),
    stderr: (line) => process.stderr.write(`${line}\n`),
  }
}

function pathIsInside(parent: string, candidate: string): boolean {
  const rel = relative(resolve(parent), resolve(candidate))
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

function parseArgs(argv: string[], cwd: string): LiveSolveArgs {
  const task = argv[0]
  if (!task) throw new Error("Usage: kodac live-solve <task> --provider <openai|openai-compatible> --model <id> --qualification-report <path> --workspace <dir> --approve-writes --approve-verification [solve options]")

  let provider: LiveSolveArgs["provider"] = "openai"
  let model = ""
  let workspace = resolve(cwd)
  let qualificationReport = ""
  let evidenceDir: string | undefined
  let json = false
  let approveWrites = false
  let approveVerification = false
  const passthrough: string[] = []

  const valuedPassthrough = new Set(["--verify-command", "--max-turns", "--max-tool-calls", "--max-elapsed-ms", "--max-failures"])
  for (let index = 1; index < argv.length; index++) {
    const token = argv[index]
    if (token === "--json") {
      json = true
      continue
    }
    if (token === "--approve-writes") {
      approveWrites = true
      continue
    }
    if (token === "--approve-verification") {
      approveVerification = true
      continue
    }
    if (token === "--provider" || token === "--model" || token === "--workspace" || token === "--qualification-report" || token === "--evidence-dir" || valuedPassthrough.has(token)) {
      const value = argv[++index]
      if (!value) throw new Error(`Missing value for ${token}`)
      if (token === "--provider") {
        if (value !== "openai" && value !== "openai-compatible") throw new Error("--provider must be openai or openai-compatible for controlled live solve")
        provider = value
      } else if (token === "--model") model = value
      else if (token === "--workspace") workspace = resolve(cwd, value)
      else if (token === "--qualification-report") qualificationReport = resolve(cwd, value)
      else if (token === "--evidence-dir") evidenceDir = resolve(cwd, value)
      else passthrough.push(token, value)
      continue
    }
    throw new Error(`Unknown live-solve option: ${token}`)
  }

  if (!model.trim()) throw new Error("Controlled live solve requires --model <id>.")
  if (!qualificationReport) throw new Error("Controlled live solve requires --qualification-report <path> from a PASS provider-qualify run.")
  if (!approveWrites) throw new Error("Controlled live solve requires explicit --approve-writes authorization.")
  if (!approveVerification) throw new Error("Controlled live solve requires explicit --approve-verification authorization.")
  if (evidenceDir && pathIsInside(workspace, evidenceDir)) {
    throw new Error("Controlled live-solve evidence directory must be outside the target workspace.")
  }

  return { task, provider, model, workspace, qualificationReport, evidenceDir, json, approveWrites, approveVerification, passthrough }
}

function providerFromEnv(name: LiveSolveArgs["provider"], env: NodeJS.ProcessEnv): ModelProvider {
  if (name === "openai") return new OpenAIResponsesProvider({ apiKey: env.OPENAI_API_KEY, stream: true })
  return OpenAICompatibleProvider.fromEnv(env, { stream: true })
}

function providerForRun(args: LiveSolveArgs, env: NodeJS.ProcessEnv, injected?: ModelProvider): ModelProvider {
  const provider = injected ?? providerFromEnv(args.provider, env)
  if (provider.name !== args.provider) {
    throw new Error(`Controlled live-solve provider mismatch: requested ${args.provider}, runtime provider is ${provider.name}.`)
  }
  return provider
}

async function writeSecureJson(path: string, value: unknown): Promise<void> {
  await mkdir(dirname(path), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, { encoding: "utf8", mode: 0o600 })
}

function authorizationArtifact(input: QualifiedProviderAuthorization, authorizationId: string, authorizedAt: string): Record<string, unknown> {
  const core = {
    protocol: "kodac.live-solve-authorization",
    version: 1,
    authorizationId,
    provider: input.provider,
    model: input.model,
    workspaceDigest: input.workspaceDigest,
    qualification: {
      sessionId: input.qualificationSessionId,
      reportDigest: input.qualificationReportDigest,
      completedAt: input.qualificationCompletedAt,
      reportPath: input.qualificationReportPath,
      authorizationDigest: input.authorizationDigest,
    },
    approvals: { writes: true, verification: true },
    authorizedAt,
  }
  return { ...core, authorizationDigest: sha256(stableJson(core)) }
}

function parseSolvePayload(lines: string[]): Record<string, unknown> | undefined {
  for (let index = lines.length - 1; index >= 0; index--) {
    try {
      const value = JSON.parse(lines[index])
      if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>
    } catch {
      // Continue searching for the structured solve result.
    }
  }
  return undefined
}

export async function runControlledLiveSolve(
  argv: string[],
  env: NodeJS.ProcessEnv = process.env,
  io: ControlledLiveSolveIO = defaultIO(),
  cwd = process.cwd(),
  runtimeOptions: ControlledLiveSolveRuntimeOptions = {},
): Promise<number> {
  try {
    const args = parseArgs(argv, cwd)
    const nowMs = runtimeOptions.now?.() ?? Date.now()
    const qualification = await verifyProviderQualificationReport({
      reportPath: args.qualificationReport,
      provider: args.provider,
      model: args.model,
      workspace: args.workspace,
      nowMs,
    })
    const modelProvider = providerForRun(args, env, runtimeOptions.modelProvider)

    const authorizationId = randomUUID()
    const root = args.evidenceDir ?? join(homedir(), ".kodac", "live-solve")
    const authorizationDir = join(root, "authorizations", authorizationId)
    const authorizationPath = join(authorizationDir, "authorization.json")
    const controlledReportPath = join(authorizationDir, "controlled-live-solve-report.json")
    const authorizedAt = new Date(nowMs).toISOString()
    const authorization = authorizationArtifact(qualification, authorizationId, authorizedAt)
    await writeSecureJson(authorizationPath, authorization)

    const capturedOut: string[] = []
    const capturedErr: string[] = []
    const solveArgs = [
      "solve",
      args.task,
      "--provider",
      args.provider,
      "--model",
      args.model,
      "--workspace",
      args.workspace,
      "--approve-writes",
      "--approve-verification",
      ...(args.evidenceDir ? ["--evidence-dir", args.evidenceDir] : []),
      ...args.passthrough,
      "--json",
    ]
    const exitCode = await runCli(
      solveArgs,
      {
        stdout(line) { capturedOut.push(line) },
        stderr(line) { capturedErr.push(line) },
      },
      cwd,
      { modelProvider },
    )
    const solve = parseSolvePayload(capturedOut)
    const completedAt = new Date(runtimeOptions.now?.() ?? Date.now()).toISOString()
    const reportCore = {
      protocol: "kodac.controlled-live-solve",
      version: 1,
      authorizationId,
      provider: args.provider,
      model: args.model,
      workspaceDigest: qualification.workspaceDigest,
      qualification: {
        reportDigest: qualification.qualificationReportDigest,
        sessionId: qualification.qualificationSessionId,
        authorizationDigest: qualification.authorizationDigest,
      },
      authorization: {
        path: authorizationPath,
        digest: authorization.authorizationDigest,
      },
      solve: solve ?? {
        status: "ERROR",
        proven: false,
        stderrDigest: sha256(capturedErr.join("\n")),
        stderrLength: capturedErr.join("\n").length,
      },
      exitCode,
      completedAt,
    }
    const controlledReport = { ...reportCore, reportDigest: sha256(stableJson(reportCore)) }
    await writeSecureJson(controlledReportPath, controlledReport)

    if (args.json) {
      io.stdout(JSON.stringify({
        status: solve?.status ?? "ERROR",
        proven: solve?.proven === true,
        provider: args.provider,
        model: args.model,
        qualificationReport: args.qualificationReport,
        qualificationReportDigest: qualification.qualificationReportDigest,
        authorization: authorizationPath,
        controlledReport: controlledReportPath,
        solve,
        exitCode,
      }))
    } else {
      if (typeof solve?.assistant === "string" && solve.assistant) io.stdout(solve.assistant)
      io.stdout(`Controlled live solve: ${String(solve?.status ?? "ERROR")}`)
      io.stdout(`Qualification: ${args.qualificationReport}`)
      io.stdout(`Authorization: ${authorizationPath}`)
      io.stdout(`Controlled report: ${controlledReportPath}`)
      const evidence = solve?.evidence
      if (evidence && typeof evidence === "object" && !Array.isArray(evidence)) {
        const proof = (evidence as Record<string, unknown>).proof
        if (typeof proof === "string") io.stdout(`Proof: ${proof}`)
      }
      for (const line of capturedErr) io.stderr(line)
    }
    return exitCode
  } catch (error) {
    io.stderr(error instanceof Error ? error.message : String(error))
    return 1
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  runControlledLiveSolve(process.argv.slice(2)).then((code) => { process.exitCode = code })
}
