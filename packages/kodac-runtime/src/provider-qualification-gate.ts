import { createHash } from "node:crypto"
import { readFile } from "node:fs/promises"
import { isAbsolute, relative, resolve, sep } from "node:path"

export const REQUIRED_PROVIDER_QUALIFICATION_CHECK_IDS = [
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

const MAX_REPORT_BYTES = 2 * 1024 * 1024
const DEFAULT_MAX_AGE_MS = 24 * 60 * 60 * 1000
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000

export interface QualifiedProviderAuthorization {
  provider: string
  model: string
  workspaceDigest: string
  qualificationSessionId: string
  qualificationReportDigest: string
  qualificationCompletedAt: string
  qualificationReportPath: string
  authorizationDigest: string
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value)
}

function pathIsInside(parent: string, candidate: string): boolean {
  const rel = relative(resolve(parent), resolve(candidate))
  return rel === "" || (rel !== ".." && !rel.startsWith(`..${sep}`) && !isAbsolute(rel))
}

function parseTimestamp(name: string, value: unknown): number {
  if (typeof value !== "string" || !value) throw new Error(`Qualification report ${name} must be an ISO timestamp.`)
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed)) throw new Error(`Qualification report ${name} is invalid.`)
  return parsed
}

function requiredString(record: Record<string, unknown>, name: string): string {
  const value = record[name]
  if (typeof value !== "string" || !value) throw new Error(`Qualification report ${name} must be a non-empty string.`)
  return value
}

export function computeProviderQualificationReportDigest(reportWithoutDigest: unknown): string {
  return sha256(stableJson(reportWithoutDigest))
}

export async function verifyProviderQualificationReport(input: {
  reportPath: string
  provider: string
  model: string
  workspace: string
  nowMs?: number
  maxAgeMs?: number
}): Promise<QualifiedProviderAuthorization> {
  const reportPath = resolve(input.reportPath)
  const workspace = resolve(input.workspace)
  if (pathIsInside(workspace, reportPath)) {
    throw new Error("Qualification report must be outside the target workspace.")
  }

  const text = await readFile(reportPath, "utf8")
  if (Buffer.byteLength(text, "utf8") > MAX_REPORT_BYTES) throw new Error("Qualification report exceeds the 2 MiB verification limit.")

  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch (error) {
    throw new Error("Qualification report is not valid JSON.", { cause: error })
  }
  if (!isRecord(parsed)) throw new Error("Qualification report must be a JSON object.")

  if (parsed.protocol !== "kodac.provider-qualification" || parsed.version !== 1) {
    throw new Error("Qualification report protocol/version is not supported.")
  }
  if (parsed.status !== "PASS") throw new Error("Qualification report must have status PASS before controlled live solve.")

  const provider = requiredString(parsed, "provider")
  const model = requiredString(parsed, "model")
  const sessionId = requiredString(parsed, "sessionId")
  const workspaceDigest = requiredString(parsed, "workspaceDigest")
  const reportDigest = requiredString(parsed, "reportDigest")
  const startedAt = requiredString(parsed, "startedAt")
  const completedAt = requiredString(parsed, "completedAt")

  if (provider !== input.provider) throw new Error(`Qualification provider mismatch: expected ${input.provider}, report has ${provider}.`)
  if (model !== input.model) throw new Error(`Qualification model mismatch: expected ${input.model}, report has ${model}.`)
  const expectedWorkspaceDigest = sha256(workspace)
  if (workspaceDigest !== expectedWorkspaceDigest) throw new Error("Qualification report was produced for a different workspace.")
  if (!/^[0-9a-f]{64}$/.test(reportDigest)) throw new Error("Qualification report digest must be a lowercase SHA-256 hex string.")

  const { reportDigest: omittedDigest, ...withoutDigest } = parsed
  void omittedDigest
  const computedDigest = computeProviderQualificationReportDigest(withoutDigest)
  if (computedDigest !== reportDigest) throw new Error("Qualification report digest does not match report contents.")

  const now = input.nowMs ?? Date.now()
  const maxAge = input.maxAgeMs ?? DEFAULT_MAX_AGE_MS
  if (!Number.isFinite(now) || now < 0) throw new Error("Qualification verification clock is invalid.")
  if (!Number.isFinite(maxAge) || maxAge <= 0) throw new Error("Qualification max age must be positive.")
  const startedMs = parseTimestamp("startedAt", startedAt)
  const completedMs = parseTimestamp("completedAt", completedAt)
  if (startedMs > completedMs) throw new Error("Qualification report startedAt is after completedAt.")
  if (completedMs > now + MAX_FUTURE_SKEW_MS) throw new Error("Qualification report completedAt is unacceptably far in the future.")
  if (now - completedMs > maxAge) throw new Error("Qualification report is stale; run provider-qualify again.")

  if (!Array.isArray(parsed.checks)) throw new Error("Qualification report checks must be an array.")
  const checks = new Map<string, Record<string, unknown>>()
  for (const item of parsed.checks) {
    if (!isRecord(item)) throw new Error("Qualification report contains an invalid check record.")
    const id = requiredString(item, "id")
    if (checks.has(id)) throw new Error(`Qualification report contains duplicate check id: ${id}`)
    if (item.status !== "PASS") throw new Error(`Qualification check ${id} is not PASS.`)
    checks.set(id, item)
  }
  for (const id of REQUIRED_PROVIDER_QUALIFICATION_CHECK_IDS) {
    if (!checks.has(id)) throw new Error(`Qualification report is missing required check: ${id}`)
  }

  const credential = checks.get("credential.preflight")!
  const credentialEvidence = isRecord(credential.evidence) ? credential.evidence : undefined
  if (credentialEvidence?.secretPersisted !== false) {
    throw new Error("Qualification credential evidence does not prove secretPersisted=false.")
  }

  const noWrite = checks.get("workspace.no_write")!
  const noWriteEvidence = isRecord(noWrite.evidence) ? noWrite.evidence : undefined
  if (!noWriteEvidence) throw new Error("Qualification no-write evidence is missing.")
  if (noWriteEvidence.beforeStatusDigest !== noWriteEvidence.afterStatusDigest || noWriteEvidence.beforeStatusLength !== noWriteEvidence.afterStatusLength) {
    throw new Error("Qualification no-write evidence does not prove an unchanged Git status snapshot.")
  }
  if (!Array.isArray(noWriteEvidence.blockedToolRequests) || noWriteEvidence.blockedToolRequests.length !== 0) {
    throw new Error("Qualification no-write evidence contains blocked/non-read-only tool requests.")
  }

  const authorizationCore = {
    provider,
    model,
    workspaceDigest,
    qualificationSessionId: sessionId,
    qualificationReportDigest: reportDigest,
    qualificationCompletedAt: completedAt,
    qualificationReportPath: reportPath,
  }
  return {
    ...authorizationCore,
    authorizationDigest: sha256(stableJson(authorizationCore)),
  }
}
