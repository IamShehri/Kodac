import type { RuntimeSession } from "../session/session.ts"

export type VerificationCategory = "agent" | "workspace" | "diff" | "receipts" | "policy" | "syntax" | "types" | "tests" | "custom"
export type VerificationStatus = "pass" | "fail"

export interface VerificationEvidenceRef {
  kind: "receipt" | "artifact" | "event" | "workspace"
  ref: string
  digest?: string
}

export interface VerificationCheckResult {
  id: string
  category: VerificationCategory
  status: VerificationStatus
  summary: string
  evidence: VerificationEvidenceRef[]
}

export interface VerificationReport {
  protocol: "kodac.verification"
  version: 1
  sessionId: string
  startedAt: string
  completedAt: string
  passed: boolean
  checks: VerificationCheckResult[]
}

export interface VerificationCommandSpec {
  id: string
  category: "syntax" | "types" | "tests" | "custom"
  executable: "node"
  args: string[]
  timeoutMs?: number
  maxOutputBytes?: number
}

export interface VerificationContext {
  workspace: string
  sessionId: string
  receiptPath: string
  session: RuntimeSession
  agentCompleted: boolean
  approveVerification: boolean
  commands: VerificationCommandSpec[]
}

export interface Verifier {
  readonly id: string
  run(context: VerificationContext): Promise<VerificationCheckResult>
}

export class VerifierRegistry {
  private readonly verifiers = new Map<string, Verifier>()

  register(verifier: Verifier): void {
    if (!verifier.id) throw new Error("Verifier id must not be empty")
    if (this.verifiers.has(verifier.id)) throw new Error(`Verifier already registered: ${verifier.id}`)
    this.verifiers.set(verifier.id, verifier)
  }

  async runAll(context: VerificationContext): Promise<VerificationCheckResult[]> {
    const results: VerificationCheckResult[] = []
    for (const verifier of this.verifiers.values()) {
      const result = await verifier.run(context)
      results.push(result)
      await context.session.emit("verification.check.completed", {
        id: result.id,
        category: result.category,
        status: result.status,
        summary: result.summary,
        evidenceCount: result.evidence.length,
      })
    }
    return results
  }
}
