# Kodac K0/K1 Module Donor Tournament

Date: 2026-08-11
Status: DISCOVERY COMPLETE — architecture candidate; no code import authorized
Branch: `docs/kodac-k0-k1-oss-intake`
Canonical base: `c425dca6e9d5474aca50d288064fa56eb21a1b9e`

## 1. Purpose

This tournament chooses the best upstream implementation or design reference for each Kodac concern. It deliberately does not choose a whole-project winner.

Kodac will own the public contracts. Upstream projects may supply implementation, algorithms, tests, or design evidence behind those contracts.

Allowed classifications:

- `COPY` — direct import after provenance/license gate.
- `ADAPT` — import or port behind a Kodac-owned interface.
- `VENDOR` — consume as an external dependency without copying source.
- `REIMPLEMENT` — preserve behavior/idea, implement natively in Kodac.
- `INTEGRATE` — connect as a backend or optional component.
- `REFERENCE` — use as design/test evidence only.
- `REJECT` — do not use for this concern.

No classification in this document authorizes source import by itself.

## 2. Pinned evidence baseline

| Donor | Pinned SHA | Primary role |
|---|---|---|
| OpenCode | `3a90639cb57619a21e59f544b3e8d23ffed56f48` | Runtime foundation |
| Kilo | `907ed2b28d3ad86a12e34b244951dd75bd8e9998` | Comparative implementation / IDE / indexing / sandbox |
| Codex OSS | `cc2f2620330116b961c87430d9fdaa16d948d3bf` | Trusted execution / patch reference |
| Cline | `ffd6a6b1dbcc89955132ded8348f9842d59cac3b` | Checkpoint / recoverability mechanics |
| Aider | `5dc9490bb35f9729ef2c95d00a19ccd30c26339c` | Repo-map algorithms |
| Tabby | `21b29048d7bcf6b94f9f482f2d0fd05efadfd19f` | Low-latency completion |
| PR-Agent | `20bc0fe8ae7c1494c0be580f7ceb35a1c45e5741` | PR provider/review plumbing |

## 3. Tournament results

### 3.1 Runtime, sessions, providers, tools

**Winner: OpenCode — `ADAPT`**

Candidate upstream areas:

- `packages/opencode/src/acp`
- `packages/opencode/src/agent`
- `packages/opencode/src/bus`
- `packages/opencode/src/config`
- `packages/opencode/src/git`
- `packages/opencode/src/lsp`
- `packages/opencode/src/mcp`
- `packages/opencode/src/patch`
- `packages/opencode/src/permission`
- `packages/opencode/src/plugin`
- `packages/opencode/src/project`
- `packages/opencode/src/provider`
- `packages/opencode/src/server`
- `packages/opencode/src/session`
- `packages/opencode/src/skill`
- `packages/opencode/src/snapshot`
- `packages/opencode/src/storage`
- `packages/opencode/src/tool`
- `packages/opencode/src/worktree`

OpenCode already separates substantial session orchestration, tools, permissions, LSP, providers, MCP/ACP, snapshotting, and worktree concerns. This is the strongest starting substrate for a TypeScript-first runtime.

**Do not adopt as Kodac public contracts.** Upstream session/event/tool shapes remain implementation details behind Kodac-owned versioned protocol types.

**Rejected as default product dependencies:** upstream account/control-plane/cloud-specific sharing/sync/telemetry paths unless separately justified.

Kilo's embedded `packages/opencode` is `REJECT` as a second runtime foundation because it would create duplicate upstream ownership. Kilo remains a comparator and selective donor.

### 3.2 Patch and edit engine

**Primary: OpenCode patch/edit — `ADAPT`**

**Codex apply-patch — `REFERENCE`, with behavioral parity tests**

Evidence:

- OpenCode has a TypeScript patch parser/applicator and tool wrappers.
- Its patch implementation explicitly models the Rust implementation's core types and supports add/delete/update/move, context matching, normalized matching, and unified diff generation.
- Codex has a dedicated Rust `apply-patch` crate split across parser, streaming parser, invocation, file update, sequence matching, text-file handling, and tests.

Decision:

1. K2 uses one canonical Kodac Edit API with a TypeScript implementation adapted from the OpenCode path if the import gate passes.
2. Codex behavior and test cases form an independent parity oracle.
3. Do not ship a second Rust edit engine in K2.
4. A Rust edit backend may be reconsidered only if benchmarks or security requirements justify it.

### 3.3 Checkpoints, snapshots, and recovery

**Canonical Kodac checkpoint API — `REIMPLEMENT`**

**Cline checkpoint semantics — `REFERENCE` / selective `ADAPT`**

**OpenCode snapshot implementation — `REFERENCE` / possible `ADAPT` storage primitive**

Cline demonstrates useful semantics beyond simple filesystem snapshots:

- checkpoint history tied to a run count;
- compare a checkpoint with the current working tree;
- restore/view behavior independent of a live UI session;
- explicit handling of files that were untracked when the snapshot was taken;
- re-probing when Git is initialized after session start.

Kodac should expose one checkpoint abstraction and may use OpenCode snapshot mechanics underneath. It must not expose two competing recovery models.

Required Kodac semantics:

- checkpoint before privileged mutation batches;
- deterministic checkpoint identity linked to `RunId`;
- diff-from-checkpoint;
- restore with explicit policy/approval;
- inclusion semantics for tracked, staged, unstaged, and untracked state documented and tested;
- checkpoint reference attached to execution receipts where relevant.

### 3.4 Repository intelligence

**Winner: Native Kodac Repo Graph — `REIMPLEMENT` as a composite system**

Donor inputs:

- OpenCode LSP layer — `ADAPT` / `INTEGRATE` for language-server facts and diagnostics.
- Aider RepoMap — `REFERENCE` for Tree-sitter def/ref extraction, ranking, caching, token-budgeting, and graph heuristics.
- Kilo core native file search/index — `REFERENCE` / `ADAPT` for fast local search.
- Kilo `kilo-indexing` — `REFERENCE` for semantic/embedding indexing and indexing lifecycle.

Aider's RepoMap demonstrates a practical graph-ranking approach using Tree-sitter definitions/references, fallbacks for missing references, weighted mention heuristics, and PageRank-style ranking under a token budget. That is valuable behavior, but the Python module is not the Kodac architecture.

Kodac Repo Graph must become a durable structured graph, not merely rendered prompt text.

Initial graph facts should support:

- files and directories;
- symbols and definitions;
- references/call relationships where available;
- imports and package dependencies;
- language-server diagnostics;
- Git state and change history links;
- tests and test-to-code relationships where discoverable;
- API/config/schema/ADR relationships;
- evidence provenance for every derived graph edge where practical.

Fast text/file search remains a separate primitive feeding the graph and Context Engine.

### 3.5 Context selection

**Winner: Native Kodac Context Engine — `REIMPLEMENT`**

Inputs may include Repo Graph neighborhoods, recent edits, open files, diagnostics, task requirements, historical outcomes, and evidence catalog records.

Aider and Tabby provide useful context-selection precedents, but Kodac must own context policy because routing, review depth, and evidence requirements depend on it.

### 3.6 Policy and authorization

**Winner: Native Kodac policy contract — `REIMPLEMENT`**

**Codex execpolicy — `REFERENCE` / possible backend `INTEGRATE`**

Useful Codex semantics:

- explicit `allow`, `prompt`, and `forbidden` decisions;
- human-readable justification;
- policy rules with positive/negative examples validated at load time;
- executable identity/path constraints;
- strictest-decision-wins composition.

Kodac must not make Codex's preview policy language its public contract. The Kodac policy result is language-neutral and versioned. A Codex-compatible policy evaluator may later be an adapter/backend.

### 3.7 Sandbox and trusted execution

**Security semantics leader: Codex OSS — `REFERENCE` / selective `INTEGRATE`**

**TypeScript sandbox abstraction: Kilo — `REFERENCE` / selective `ADAPT`**

Codex separates sandboxing, OS-specific sandbox implementations, process hardening, network proxying, secrets, and execution policy. Kilo exposes a TypeScript sandbox package with backend abstraction, Bubblewrap integration, filesystem controls, mutation worker/protocol, and network relay.

Decision:

- Kodac owns `ExecutionGateway` and `SandboxBackend` interfaces.
- K2 may begin with a local backend, but it cannot bypass `ExecutionGateway`.
- OS-specific hardening may integrate Codex-derived/compatible Rust components after path-level license and dependency review.
- Kilo sandbox patterns are useful for the TypeScript control plane and backend abstraction.
- No donor controls authorization by itself; policy evaluation remains a Kodac Trust Kernel responsibility.

### 3.8 Autocomplete / next edit

**Winner: Tabby behavior — `REFERENCE`, then selective `ADAPT` after path-level license review**

Tabby demonstrates:

- prefix/suffix completion context;
- Git/workspace-relative paths;
- declaration snippets;
- recently changed/opened context;
- deduplication and configurable context limits;
- LRU/TTL completion caching;
- forwarding cached results as the user types;
- next-edit suggestion work using edit history.

Autocomplete should be architecturally isolated from long-running agent execution. It has a different latency budget and should not require the full orchestration loop.

`ee/` is excluded from import consideration.

### 3.9 IDE surfaces

**Kilo VS Code and JetBrains — `REFERENCE` / later selective `ADAPT`**

Kilo has dedicated packages for VS Code and JetBrains plus client/protocol/SDK surfaces. These are valuable once the Kodac runtime protocol stabilizes.

Do not allow IDE-specific state to become the canonical runtime state.

### 3.10 PR integration and review plumbing

**PR-Agent — `ADAPT` selectively**

Useful areas include:

- Git provider abstraction;
- PR diff/context plumbing;
- PR description and suggestion workflows;
- configuration and provider integration patterns.

**Native Kodac only:** Proof Review, evidence-qualified findings, duplicate/conflict arbitration, Judge, Done Gate, and outcome learning.

A model-generated comment is not a Kodac blocking finding unless it carries the required evidence and passes Judge policy.

### 3.11 Evidence catalog

**Existing Kodac/Kernux evidence work — `ADAPT` into Native Kodac Evidence Catalog**

Preserve and evolve the current schema/evidence machinery rather than deleting it. Existing concepts such as content digests, verification methods, freshness, and claim states (`verified`, `vendor-reported`, `unknown`, `disputed`) are directly useful for an Evidence Router and donor/model/tool catalog.

Runtime and catalog must be separate subsystems with explicit interfaces.

## 4. Canonical architecture after tournament

```text
Surfaces: CLI / TUI / IDE / CI
            |
            v
Kodac Canonical Protocol
  Session / Event / Tool / Artifact / Receipt
            |
            v
Orchestrator
  Spec -> Plan -> Route -> Execute -> Review
     |                 |
     |                 +--> Evidence Router
     |                 +--> Context Engine
     |                 +--> Repo Graph
     |
     v
ExecutionGateway
     |
     v
Trust Kernel
 Capability -> Policy -> Approval -> Sandbox -> Execute -> Verify -> Receipt
     |
     +--> SandboxBackend(s)

Review Pipeline
 Findings -> Proof Review -> Judge -> Done Gate

Learning Plane
 Receipts + outcomes + benchmark results -> Evidence Catalog / Router
```

## 5. Anti-Frankenstein rules

1. One canonical Kodac interface per concern.
2. At most one default implementation per concern.
3. Multiple backends are allowed only behind a stable interface and only when the alternative provides measurable value.
4. Donor-native public protocols do not leak through Kodac APIs.
5. Every import must identify exact upstream repository, SHA, source path, license posture, target path, modification status, tests, and sync strategy.
6. No import based on popularity alone; donor behavior must be benchmarked or independently justified.
7. Strategic layers remain Native Kodac even when donor algorithms inform them.

## 6. Immediate implementation order after ADR acceptance

1. Define canonical protocol types and schemas.
2. Define mandatory ExecutionGateway/Trust Kernel hook.
3. Establish selective OpenCode substrate import plan at exact paths.
4. Build a minimal local `kodac solve` vertical slice behind the new contracts.
5. Add patch parity fixtures informed by Codex.
6. Add checkpoint contract fixtures informed by Cline.
7. Start Repo Graph v0 with file/symbol/search/LSP facts.
8. Add execution receipt and Done Gate skeleton before broad tool expansion.

## 7. Gate decision

`PASS_FOR_ARCHITECTURE_REVIEW`

The module tournament is complete enough to draft ADR-0002, ADR-0004, ADR-0005, and ADR-0006.

It does **not** authorize source import, branch merge, or runtime reconstitution by itself.
