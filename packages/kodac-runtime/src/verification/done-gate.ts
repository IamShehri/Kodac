import type { VerificationEvidenceRef, VerificationReport } from "./types.ts"

export interface DoneGateResult {
  status: "PROVEN_READY" | "NOT_READY"
  reasons: string[]
  evidence: VerificationEvidenceRef[]
}

const REQUIRED_CHECKS = [
  "agent.completed",
  "workspace.integrity",
  "git.diff",
  "evidence.receipts",
  "evidence.policy",
  "verification.commands",
] as const

export class DoneGate {
  evaluate(report: VerificationReport): DoneGateResult {
    const reasons: string[] = []
    const evidence: VerificationEvidenceRef[] = []
    for (const id of REQUIRED_CHECKS) {
      const check = report.checks.find((candidate) => candidate.id === id)
      if (!check) {
        reasons.push(`missing required verification check: ${id}`)
        continue
      }
      if (check.status !== "pass") reasons.push(`${id}: ${check.summary}`)
      if (check.status === "pass" && check.evidence.length === 0) reasons.push(`${id}: passing check has no evidence reference`)
      evidence.push(...check.evidence)
    }

    for (const check of report.checks) {
      if (check.id.startsWith("command.") && check.status !== "pass") reasons.push(`${check.id}: ${check.summary}`)
    }

    const uniqueEvidence = [...new Map(evidence.map((item) => [`${item.kind}:${item.ref}`, item])).values()]
    return {
      status: reasons.length === 0 ? "PROVEN_READY" : "NOT_READY",
      reasons,
      evidence: uniqueEvidence,
    }
  }
}
