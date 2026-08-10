# Kodac K0/K1 — OSS Intake & Architecture Gate

**Date:** 2026-08-11  
**Status:** DRAFT — founder review required before code import  
**Repository:** `IamShehri/Kodac`  
**Canonical base at branch creation:** `c425dca6e9d5474aca50d288064fa56eb21a1b9e`  
**Working branch:** `docs/kodac-k0-k1-oss-intake`

## 1. Decision

```text
DISCOVERY IN PROGRESS — ARCHITECTURE DIRECTION ESTABLISHED
NO THIRD-PARTY CODE IMPORT AUTHORIZED BY THIS DOCUMENT
```

Kodac will be rebuilt as an **open, model-agnostic agentic software-engineering platform**, not as a rebrand of Continue, OpenCode, Kilo, Cline, or any single upstream.

Product loop:

```text
UNDERSTAND → SPECIFY → PLAN → ROUTE → BUILD → TEST → SECURE → REVIEW
→ FIX → PROVE → DONE GATE → PR → OUTCOME → LEARN
```

Core positioning:

> Kodac should reuse mature open-source plumbing aggressively, while concentrating original engineering on repository intelligence, evidence-backed routing, trusted execution, proof-oriented review, verification, and outcome learning.

## 2. Repository Reconstitution Rule

The existing repository history is preserved. The current Python evidence/index implementation is **not deleted** and is not treated as failed work.

It contains strategically useful foundations for the future Kodac Evidence Catalog, including sourced agent profiles, claim states, content digests, verification methods, freshness semantics, and deterministic validation.

Reconstitution must therefore separate two concerns:

1. **Kodac Runtime Platform** — the new coding/engineering runtime.
2. **Kodac Evidence Catalog** — the existing evidence-backed agent/model capability data, evolved into a Router/benchmark input.

No destructive rewrite of `main` is authorized during K0/K1.

## 3. Initial Upstream Baselines

The first donor tranche is pinned to exact upstream commits for reproducibility.

| Upstream | Baseline | Intended Kodac role | Intake decision |
|---|---|---|---|
| `anomalyco/opencode` | `3a90639cb57619a21e59f544b3e8d23ffed56f48` | Core runtime substrate | **FOUNDATION — selective extraction/adaptation** |
| `Kilo-Org/kilocode` | `907ed2b28d3ad86a12e34b244951dd75bd8e9998` | IDE/surface comparative implementation | **SELECTIVE DONOR / REFERENCE** |
| `openai/codex` | `cc2f2620330116b961c87430d9fdaa16d948d3bf` | Trusted execution, sandbox, approvals, protocol | **SELECTIVE DONOR / REFERENCE** |
| `cline/cline` | `ffd6a6b1dbcc89955132ded8348f9842d59cac3b` | Checkpoints, session UX, parallel/worktree mechanics | **MECHANICS DONOR / REFERENCE** |
| `Aider-AI/aider` | `5dc9490bb35f9729ef2c95d00a19ccd30c26339c` | Repo-map, edit reliability, lint/Git loop | **ALGORITHM DONOR / REIMPLEMENT/PORT** |
| `TabbyML/tabby` | `21b29048d7bcf6b94f9f482f2d0fd05efadfd19f` | Autocomplete research/donor | **SELECTIVE DONOR — non-`ee/` only** |
| `The-PR-Agent/pr-agent` | `20bc0fe8ae7c1494c0be580f7ceb35a1c45e5741` | PR review bootstrap | **SELECTIVE DONOR / ADAPT** |

These pins are discovery baselines, not permanent vendor locks. Future updates require explicit re-evaluation and a provenance record.

## 4. Foundation Decision

### 4.1 OpenCode — runtime foundation

Kodac should use OpenCode as the **primary runtime substrate**, but must not import the entire monorepo blindly.

High-value runtime areas identified in `packages/opencode/src` include:

- `acp/`
- `agent/`
- `bus/`
- `config/`
- `git/`
- `ide/`
- `lsp/`
- `mcp/`
- `patch/`
- `permission/`
- `plugin/`
- `project/`
- `provider/`
- `server/`
- `session/`
- `skill/`
- `snapshot/`
- `storage/`
- `tool/`
- `worktree/`

Default K0/K1 posture is to exclude or isolate cloud/account/control-plane concerns until dependencies prove them necessary:

- account/cloud identity
- hosted control plane
- sharing/sync tied to upstream services
- upstream telemetry/business-specific services

**Rule:** Kodac owns canonical interfaces; OpenCode adapts to them. Kodac must not become an unmaintainable deep fork.

### 4.2 Kilo — comparative implementation, not the root

Kilo currently exposes a broad monorepo including areas such as:

- `core`
- `client`
- `extensions`
- `kilo-vscode`
- `kilo-jetbrains`
- `kilo-indexing`
- `kilo-memory`
- `kilo-sandbox`
- `protocol`
- `sdk`
- `server`

This makes Kilo an excellent implementation comparator for an OpenCode-backed multi-surface product.

Kodac should compare Kilo and OpenCode component-by-component before importing anything. Do **not** combine duplicate runtimes.

Primary Kilo review targets:

1. VS Code thin-client architecture.
2. JetBrains integration.
3. Client/protocol boundaries.
4. Indexing and memory design.
5. Sandbox abstractions.

### 4.3 Codex OSS — trusted-execution donor

Codex is not the Kodac foundation. It is a high-value donor/reference for security-sensitive execution architecture.

Priority review targets in `codex-rs`:

- `app-server*`
- `exec`
- `execpolicy`
- `sandboxing`
- `linux-sandbox`
- `windows-sandbox-rs`
- `process-hardening`
- `network-proxy`
- `secrets`
- `protocol`
- `apply-patch`
- `rollout-trace`
- `otel`
- `skills`

Kodac should reuse or adapt only where the component boundary and license/provenance are clean. Product/cloud-specific coupling should remain excluded.

### 4.4 Cline — agent reliability/mechanics donor

Primary review targets:

- checkpoints and restore semantics
- Plan/Act interaction model
- shared agent-core concepts across CLI/IDE surfaces
- long-running session recovery
- worktree/parallel task mechanics
- rules/skills/MCP UX

Before porting a Cline feature, benchmark it against OpenCode's current `snapshot`, `worktree`, `session`, and permission mechanisms to avoid duplicate implementations.

### 4.5 Aider — algorithm donor

Primary review targets:

- `repomap.py`
- `repo.py`
- `diffs.py`
- coder/edit-format implementations
- `linter.py`
- Tree-sitter queries
- Git safety behavior

Prefer a Kodac-native TypeScript implementation of proven algorithms/behavior unless direct reuse is clearly superior. Preserve upstream provenance and create behavioral regression tests.

Target Kodac editing strategy:

```text
AST/symbol edit
→ precise patch
→ unified diff
→ structured search/replace
→ whole-file fallback
→ parse/build/test verification
```

### 4.6 Tabby — autocomplete donor with license boundary

Tabby's repository root license explicitly separates `ee/`; non-enterprise code outside separately licensed components is available under Apache-2.0.

Rules:

- do not import `ee/`
- inventory third-party licenses before reuse
- compare Tabby completion context/ranking against Continue/Kilo/OpenCode approaches
- keep autocomplete latency architecture isolated from long-running agent orchestration

### 4.7 PR-Agent — review bootstrap only

PR-Agent is suitable for bootstrapping:

- Git provider adapters
- PR/diff parsing
- review request flow
- comment/update mechanics
- review prompt/config patterns

The following remain **Native Kodac**:

- Proof Review
- multi-reviewer evidence aggregation
- Kodac Judge
- finding deduplication/ranking
- evidence/reproduction requirements
- merge-confidence calibration

## 5. Anti-Frankenstein Architecture Rules

Kodac may learn from many upstreams, but production has exactly one canonical implementation for each system concern unless an A/B benchmark is intentionally active.

Mandatory canonical contracts:

1. **Session model**
2. **Event schema**
3. **Provider interface**
4. **Tool/capability interface**
5. **Execution gateway**
6. **Policy decision interface**
7. **Evidence/receipt interface**
8. **Repository-intelligence API**
9. **Verification result schema**
10. **Review finding schema**

Donor code must adapt inward to these boundaries. Kodac architecture must not bend differently for every donor.

## 6. Native Kodac IP — Do Not Outsource

The following are the strategic core and should not simply be inherited from an upstream:

### 6.1 Kodac Repo Graph

Unified graph across:

- syntax
- symbols
- definitions/references
- imports/dependencies
- tests
- Git history
- specs/ADRs
- APIs/schemas
- runtime/CI evidence
- cross-repository relationships

Expected underlying OSS primitives may include Tree-sitter, SCIP/LSP, ast-grep, and targeted semantic retrieval.

### 6.2 Kodac Context Engine

Select the minimum high-value context required for the current task, rather than indiscriminately stuffing chunks into a model context window.

### 6.3 Kodac Evidence Router

Route an **execution strategy**, not only a model:

```text
model + agent + skills + tools + context strategy + sandbox
+ review depth + verification budget + parallelism
```

Routing decisions must be explainable and linked to benchmark/historical evidence.

### 6.4 Kodac Trust Kernel

Every state-changing side effect passes through:

```text
Intent → Capability Check → Policy → Approval → Execution → Evidence
```

The interface exists from the first runtime slice even if K2 initially uses permissive/no-op policy implementations.

### 6.5 Kodac Execution Receipt

A canonical execution record should be designed around fields such as:

- receipt/session/agent/model identity
- intent
- capability
- tool and argument digest
- workspace/pre-state
- policy and approval
- sandbox/execution target
- result/post-state
- verification evidence
- parent receipt
- timestamp/signature strategy

### 6.6 Kodac Proof Review + Judge

Default blocking findings require evidence. The Judge should merge/deduplicate reviewers, reject unsupported noise, calibrate severity/confidence, and prefer reproducible findings.

### 6.7 Kodac Done Gate

`done` is not a model statement. It is a verified state.

Potential gates:

- requirement/spec satisfied
- patch valid
- build/types/lint pass where applicable
- tests/regression pass
- security pass
- architecture/spec compliance
- review pass
- evidence complete
- policy satisfied
- execution receipt emitted

### 6.8 Kodac Outcome Learning

Privacy-preserving learning from outcomes such as test/CI/merge/revert/acceptance, cost, latency, and strategy performance. Raw private code must not become training/evaluation data by default.

### 6.9 Kodac Bench

A reproducible benchmark suite covering build, edit, context, review, security, routing, cost, latency, and long-horizon outcomes, alongside external suites such as SWE-bench Live and Multi-SWE-bench.

## 7. Target Repository Architecture

Proposed direction after reconstitution approval:

```text
kodac/
├─ apps/
│  ├─ cli/
│  ├─ tui/
│  ├─ vscode/
│  ├─ jetbrains/
│  └─ web/                 # later
├─ packages/
│  ├─ runtime/
│  ├─ protocol/
│  ├─ sdk/
│  ├─ orchestrator/
│  ├─ providers/
│  ├─ sessions/
│  ├─ repo-graph/
│  ├─ context/
│  ├─ predict/
│  ├─ edit/
│  ├─ worktrees/
│  ├─ workflows/
│  ├─ skills/
│  ├─ mcp/
│  ├─ acp/
│  ├─ trust/
│  ├─ execution/
│  ├─ evidence/
│  ├─ verification/
│  ├─ review/
│  ├─ security/
│  └─ benchmarks/
├─ crates/
│  ├─ sandbox/             # only if Rust boundary is justified
│  └─ evidence-core/       # optional security-critical canonicalization/signing
├─ research/
│  └─ evidence-catalog/    # evolution of current Kernux evidence/index work
├─ provenance/
│  ├─ upstreams.yaml
│  └─ imports/
├─ third_party/
│  └─ notices/
├─ benchmarks/
├─ docs/
│  ├─ adr/
│  ├─ planning/
│  └─ threat-model/
└─ tests/
```

## 8. Language Direction

Initial recommendation:

- **TypeScript/Node/Bun-compatible runtime** for velocity and OpenCode/Kilo compatibility.
- **Rust only for isolated security/performance boundaries** where evidence justifies the cost: sandbox workers, process hardening, receipt canonicalization/signing, or other trusted primitives.
- **Language-neutral canonical protocols** using versioned schemas/generated types.

Do not recreate the whole orchestration layer in Rust at K2.

## 9. Provenance / License Intake Policy

Engineering intake policy, subject to legal review where appropriate:

### Default allow after per-component inspection

- MIT
- Apache-2.0
- BSD
- ISC

### Require explicit review/isolation

- MPL
- LGPL
- mixed-license repositories
- repositories with separately licensed enterprise directories

### No direct core copy without explicit founder/legal decision

- GPL
- AGPL
- SSPL
- BSL/source-available restrictions
- proprietary source
- unclear/no license

Every imported component must record:

```text
upstream repository
exact commit SHA
license
original path(s)
Kodac destination
copyright/NOTICE requirements
modifications
behavioral tests
reason for import
```

Generate SBOM and third-party notices before public release.

## 10. Immediate Architecture ADR Queue

Before K2 code import, create and review:

1. ADR-0001 — Kodac Product Constitution: `Done means proven`
2. ADR-0002 — OpenCode as selective runtime substrate
3. ADR-0003 — Upstream synchronization policy
4. ADR-0004 — OSS provenance and license gate
5. ADR-0005 — Canonical session/event/tool protocol
6. ADR-0006 — Mandatory trust hook for all side effects
7. ADR-0007 — Native MCP / ACP / Agent Skills compatibility
8. ADR-0008 — TypeScript runtime with optional Rust trusted workers
9. ADR-0009 — Kodac Repo Graph architecture
10. ADR-0010 — Benchmark-first donor selection

## 11. K0/K1 Exit Gate

K0/K1 is complete only when:

- [ ] Kodac naming/trademark risk has been reviewed separately.
- [ ] `main` protection strategy is ratified before reconstitution merges.
- [ ] all donor repositories are pinned to exact commits.
- [ ] licenses and mixed-license subtrees are recorded.
- [ ] import classifications are complete at package/module level.
- [ ] provenance schema exists and validates.
- [ ] architecture ADR queue is reviewed/accepted.
- [ ] canonical Kodac protocol/trust seams are defined.
- [ ] existing evidence-index work has a preservation/migration decision.
- [ ] no third-party code exists without a provenance record.

## 12. First Vertical Slice After Gate Approval

The first K2 build should intentionally be small:

```text
kodac solve <local-task>
  ↓
open session
  ↓
inspect/read repository
  ↓
plan
  ↓
propose/apply one patch
  ↓
run one verification command
  ↓
all side effects pass ExecutionGateway/PolicyGate
  ↓
emit EvidenceSink record / execution receipt
  ↓
show proven result
```

Required properties:

- provider-agnostic
- no mandatory cloud account
- local-first
- Linux/macOS/Windows design compatibility
- no direct side effects bypassing the execution gateway
- deterministic provenance for imported code
- benchmark hooks from the beginning

## 13. What K0/K1 Explicitly Does Not Authorize

This gate does **not** authorize:

- replacing `main`
- deleting historical Kernux/Kodac evidence work
- wholesale forking Kilo, Continue, Cline, Codex, or Aider
- importing third-party source without provenance
- shipping cloud telemetry by default
- collecting private source code for learning
- claiming benchmark superiority before reproducible evidence
- launch, marketplace publication, or acquisition claims

---

**Recommended next action:** finish module-level donor mapping for OpenCode, Kilo, Codex, Cline, Aider, Tabby, and PR-Agent; create `provenance/upstreams.yaml`; then produce ADR-0002/0004/0005/0006 before the first runtime import.