import { NodeWorkspaceFileSystem } from "../edit/filesystem.ts"
import type { ReceiptLedger } from "../evidence/ledger.ts"
import { ExecutionGateway } from "../execution/gateway.ts"
import { workspaceAgentPolicy, type PolicyEngine } from "../trust/policy.ts"
import { createApplyPatchTool } from "./apply-patch.ts"
import { createGitDiffTool } from "./git-diff.ts"
import type { ToolRegistry } from "./registry.ts"
import { createRepoListTool, createRepoReadTool, createRepoSearchTool } from "./workspace-read.ts"

export interface WorkspaceToolSurfaceOptions {
  workspace: string
  receipts: ReceiptLedger
  approveWrites?: boolean
}

export interface WorkspaceToolSurface {
  fs: NodeWorkspaceFileSystem
  gateway: ExecutionGateway
  policy: PolicyEngine
}

export function registerWorkspaceToolSurface(
  registry: ToolRegistry,
  options: WorkspaceToolSurfaceOptions,
): WorkspaceToolSurface {
  const fs = new NodeWorkspaceFileSystem(options.workspace)
  const policy = workspaceAgentPolicy(options.approveWrites ?? false)
  const gateway = new ExecutionGateway(fs, policy)

  registry.register(createRepoReadTool(fs, policy))
  registry.register(createRepoListTool(fs, policy))
  registry.register(createRepoSearchTool(fs, policy))
  registry.register(createApplyPatchTool(gateway, options.receipts))
  registry.register(createGitDiffTool(gateway, options.receipts))

  return { fs, gateway, policy }
}
