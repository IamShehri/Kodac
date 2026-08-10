export type PolicyDecision = "allow" | "ask" | "deny"

export interface ExecutionIntent {
  capability: string
  paths: string[]
  inputDigest: string
}

export interface PolicyResult {
  decision: PolicyDecision
  reason: string
}

export interface PolicyEngine {
  evaluate(intent: ExecutionIntent): Promise<PolicyResult> | PolicyResult
}

export function fixedPolicy(decision: PolicyDecision, reason = `fixed:${decision}`): PolicyEngine {
  return {
    evaluate: () => ({ decision, reason }),
  }
}
