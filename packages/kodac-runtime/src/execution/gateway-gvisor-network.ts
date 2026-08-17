import type { WorkspaceFileSystem } from "../edit/filesystem.ts"
import { createHash } from "node:crypto"
import { createReceipt, type ExecutionReceipt } from "../evidence/receipt.ts"
import { ExecutionBlockedError, ExecutionFailedError, ExecutionGateway, ExecutionUnprovenError, type ExecutionObserver } from "./gateway.ts"
import type { ApprovalRuntime } from "../trust/approval.ts"
import type { LinuxLandlockRuntimeConfig } from "../trust/confinement-runtime.ts"
import { validateSandboxExecutionRequirement, type SandboxExecutionRequirement } from "../trust/sandbox-backend-evidence.ts"
import type { DockerControlPlaneBindingProvider } from "../trust/sandbox-observer-docker-control-plane.ts"
import type { GvisorCgroupV2RuntimeConfig } from "../trust/sandbox-observer-gvisor-cgroup-v2.ts"
import type { GvisorObserverRuntimeConfig } from "../trust/sandbox-observer-gvisor-runtime.ts"
import {
  KDO_H4_R3G_C_CAPABILITY,
  validateGvisorNetworkObserverRuntimeConfig,
  type GvisorNetworkObserverRuntimeConfig,
  type GvisorPhysicalNetworkRecord,
} from "../trust/sandbox-observer-gvisor-network.ts"
import { observeGvisorPhysicalNetworkRuntime } from "../trust/sandbox-observer-gvisor-network-runtime.ts"
import type { GvisorSourceLineageRuntimeConfig } from "../trust/sandbox-observer-gvisor-source-lineage.ts"
import type { ExecutionIntent, PolicyEngine, PolicyResult } from "../trust/policy.ts"

export interface GvisorNetworkExecutionGatewayConfig {
  readonly filesystem: WorkspaceFileSystem
  readonly policy: PolicyEngine
  readonly gvisorObserver: GvisorObserverRuntimeConfig
  readonly dockerControlPlane: DockerControlPlaneBindingProvider
  readonly networkObserver: GvisorNetworkObserverRuntimeConfig
  readonly approval?: ApprovalRuntime
  readonly confinement?: LinuxLandlockRuntimeConfig
  readonly cgroupObserver?: GvisorCgroupV2RuntimeConfig
  readonly sourceObserver?: GvisorSourceLineageRuntimeConfig
}

function sha256(value: string): string { return createHash("sha256").update(value, "utf8").digest("hex") }
function immutableIntent(intent: ExecutionIntent): ExecutionIntent { return Object.freeze({ capability: intent.capability, paths: Object.freeze([...intent.paths]) as unknown as string[], inputDigest: intent.inputDigest }) }
function immutablePolicy(value: PolicyResult): PolicyResult {
  if (value.decision !== "allow" && value.decision !== "ask" && value.decision !== "deny") throw new TypeError("policy decision is invalid")
  if (typeof value.reason !== "string") throw new TypeError("policy reason must be a string")
  return Object.freeze({ decision: value.decision, reason: value.reason })
}
async function persist(observer: ExecutionObserver | undefined, receipt: ExecutionReceipt): Promise<void> {
  try { await observer?.onReceipt?.(receipt) } catch (error) { throw new ExecutionUnprovenError("Execution evidence could not be persisted.", receipt, { cause: error }) }
}

export class GvisorNetworkExecutionGateway extends ExecutionGateway {
  private readonly networkPolicy: PolicyEngine
  private readonly networkGvisor: GvisorObserverRuntimeConfig
  private readonly networkDocker: DockerControlPlaneBindingProvider
  private readonly networkRuntime: GvisorNetworkObserverRuntimeConfig

  constructor(config: GvisorNetworkExecutionGatewayConfig) {
    super(config.filesystem, config.policy, config.approval, config.confinement, config.gvisorObserver, config.cgroupObserver, config.sourceObserver)
    this.networkPolicy = config.policy
    this.networkGvisor = config.gvisorObserver
    this.networkDocker = config.dockerControlPlane
    this.networkRuntime = validateGvisorNetworkObserverRuntimeConfig(config.networkObserver)
  }

  async observeGvisorPhysicalNetwork(requirementValue: SandboxExecutionRequirement, observer?: ExecutionObserver, options: { signal?: AbortSignal } = {}): Promise<GvisorPhysicalNetworkRecord> {
    const startedAt = new Date().toISOString(); const requirement = validateSandboxExecutionRequirement(requirementValue)
    if (requirement.requiredSemanticRuntimeClass !== "gvisor") throw new Error("R3G-C observer requires requiredSemanticRuntimeClass=gvisor")
    const intent = immutableIntent({ capability: KDO_H4_R3G_C_CAPABILITY, paths: [], inputDigest: sha256(JSON.stringify({ version: "kodac-h4-r3g-c-intent-v1", requirementIdentity: requirement.requirementIdentity, workloadIdentity: requirement.workload.workloadIdentity, semanticRuntimeClass: "gvisor" })) })
    await observer?.onIntent?.(intent)
    const policy = immutablePolicy(await this.networkPolicy.evaluate(intent)); await observer?.onPolicy?.(intent, policy)
    const block = async (reason: string, message: string): Promise<never> => {
      const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "blocked", reason } }); await persist(observer, receipt); throw new ExecutionBlockedError(message, receipt)
    }
    if (policy.decision === "deny") return block(policy.reason, `Execution denied: ${policy.reason}`)
    if (policy.decision === "ask") return block("R3G-C physical observer approval is not authorized", "Approval unavailable: R3G-C physical observer does not authorize ask")
    if (process.platform !== "linux") return block("R3G-C physical network observer requires Linux", "R3G-C observation unavailable: Linux required")
    if (options.signal?.aborted) return block("R3G-C observation aborted before external reads", "R3G-C observation aborted")
    try {
      const record = await observeGvisorPhysicalNetworkRuntime({ requirement, dependencies: { gvisor: this.networkGvisor, docker: this.networkDocker, network: this.networkRuntime }, signal: options.signal })
      const serialized = JSON.stringify(record); const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "success", outputDigest: sha256(serialized), outputBytes: Buffer.byteLength(serialized, "utf8"), exitCode: 0 } }); await persist(observer, receipt)
      return record
    } catch (error) {
      if (error instanceof ExecutionUnprovenError) throw error
      const message = error instanceof Error ? error.message : String(error); const receipt = createReceipt({ capability: intent.capability, inputDigest: intent.inputDigest, paths: intent.paths, policy, startedAt, completedAt: new Date().toISOString(), result: { status: "failure", error: message } }); await persist(observer, receipt); throw new ExecutionFailedError(`${KDO_H4_R3G_C_CAPABILITY} failed: ${message}`, receipt, { cause: error })
    }
  }
}
