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

const READ_ONLY_AGENT_CAPABILITIES = new Set(["repo.read", "repo.list", "repo.search", "git.diff"])
const K3_R2_READ_ONLY_CAPABILITIES = new Set(["git.head", "git.status", "git.hash-object"])

export function workspaceAgentPolicy(approveWrites: boolean): PolicyEngine {
  return {
    evaluate(intent) {
      if (READ_ONLY_AGENT_CAPABILITIES.has(intent.capability)) {
        return { decision: "allow", reason: `bounded read-only capability: ${intent.capability}` }
      }
      if (intent.capability === "repo.apply_patch") {
        return approveWrites
          ? { decision: "allow", reason: "explicit --approve-writes authorization" }
          : { decision: "ask", reason: "agent workspace mutation requires explicit --approve-writes authorization" }
      }
      return { decision: "deny", reason: `capability not authorized for K2-S5 agent workspace: ${intent.capability}` }
    },
  }
}

export function repositoryIntelligenceReadPolicy(): PolicyEngine {
  return {
    evaluate(intent) {
      if (K3_R2_READ_ONLY_CAPABILITIES.has(intent.capability)) {
        return { decision: "allow", reason: `K3-R2 bounded repository-intelligence read: ${intent.capability}` }
      }
      return { decision: "deny", reason: `capability not authorized for K3-R2 repository intelligence: ${intent.capability}` }
    },
  }
}
