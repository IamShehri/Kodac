# Kodac Donor Reverse Engineering and Code Acquisition Report

Status: **RESEARCH CANDIDATE / SOURCE-LEVEL REVERSE ENGINEERING / NO CODE-INTAKE AUTHORIZATION**  
Date: 2026-08-19  
Kodac canonical base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Kodac canonical tree: `fc6ab0bb978918a3ad07070f79eaee4f3f4417a4`  
Planning PR: `#121`  
Pre-amendment planning head: `c0378a895f336f3fa0e71a366de8d90f013a9500`

## 0. Authority, purpose, and hard boundaries

This report records a source-level reverse-engineering pass over high-value donor systems for the Kodac Multi-Agent Review and Cyber Trust Surface plan. It is intended to turn a feature/source list into an implementation acquisition map.

Repository truth and accepted Kodac ADRs remain authoritative. Donor code, documentation, tests, reviewer comments, and this report are evidence inputs only.

The founder reports that permission has been obtained to use code from the donor sources discussed in this research. That changes the acquisition question from `REFERENCE ONLY` to `CODE-ADMISSION CANDIDATE` where appropriate. It does **not** make every file, bundled dependency, generated artifact, third-party subcomponent, or transitive dependency automatically admissible. Before any source-code intake, Kodac should persist an exact source/provenance/permission record and independently inspect the dependency boundary of the specific code being acquired.

This report does **not**:

- import donor code;
- add a dependency;
- modify Kodac runtime behavior;
- authorize H4-R3G-F or later H4 work;
- authorize H6 implementation;
- authorize the Cyber Mesh implementation;
- change K2, KRI, Done Gate, policy, evidence, sandbox, or CI semantics;
- make PR #121 ready for review;
- authorize merge of PR #121.

Every donor-code intake remains a separate, exact-pin authorization with bounded files, tests, provenance, trust-boundary review, and rollback.

## 1. Executive verdict

The reverse-engineering result is stronger than a simple “best ideas from each project” strategy. The useful boundaries are now concrete enough to recommend a **best-of-breed transplantation architecture**:

```text
DeepSeek Harness
  → provider/capability seam + fail-loud negotiation + continuable-child ownership

Cline
  → practical child-session lifecycle + specialist configuration + team/run state + recovery tests

Cline Kanban
  → isolated detached work-unit mechanics + lock/recovery/patch preservation

Zoo Code
  → mode/capability-profile UX + hardened external command-classifier runner pattern

OpenSandbox
  → public sandbox protocol + provider/runtime boundary + distributed backend candidate

Graphify
  → structural routing/context graph + explicit inferred/ambiguous provenance

Sentry
  → versioned fingerprint/grouping evolution + production evidence/change attribution patterns

VulnHunter
  → adversarial falsification protocol + candidate-manifest completeness + all-callsite/all-writer discipline

Kodac
  → trusted authority, exact-head identity, K2 execution, receipts, validators,
    adjudication, evidence transitions, and Done Gate
```

The recommended composition is therefore:

```text
DONOR IMPLEMENTATION PATTERNS
          │
          ▼
KODAC ADAPTER / NORMALIZATION BOUNDARY
          │
          ▼
CAPABILITY REQUEST
          │
          ▼
K2 / TRUST KERNEL
          │
    ┌─────┴──────────┐
    ▼                ▼
execution         evidence
    │                │
    └─────┬──────────┘
          ▼
closed validators
          ▼
adjudication
          ▼
Done Gate / verdict
```

The strongest current synthesis for future Review Run orchestration is:

> **Cline lifecycle + DeepSeek seams + Kodac authority.**

The strongest current synthesis for isolated agent work is:

> **Cline Kanban mechanics + exact-head Kodac semantics + no shared-untrusted symlink shortcut in proof workspaces by default.**

The strongest current synthesis for finding correlation is:

> **Sentry-style versioned grouping/fingerprint evolution + Kodac kernel-computed identities + evidence kept separate from dedup.**

The strongest current synthesis for Cyber falsification is:

> **VulnHunter gate recipes and completeness discipline + Kodac deterministic re-verification + no consensus clearance.**

## 2. Live Kodac baseline verified before this report

At the pre-mutation checkpoint:

```text
main = 04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e
main tree = fc6ab0bb978918a3ad07070f79eaee4f3f4417a4
PR #121 = OPEN / DRAFT / NOT MERGED
PR #121 head = c0378a895f336f3fa0e71a366de8d90f013a9500
PR #121 changed files = 1 before this report
H4-R3G-F = NOT STARTED
```

The current H4-R3G-E runtime is a useful reference point for donor admission because it demonstrates the stronger Kodac pattern donors must fit behind: canonical provider identity, exact binding identity, bounded input/output parsing, abort fencing, durable positive/failure evidence, and fail-closed validation of trusted callback results.

## 3. Reverse-engineering method

For each Tier-0 donor this pass used:

1. live branch/commit verification;
2. whole-repository path/search inventory around relevant subsystems;
3. targeted source tracing of public contract → runtime implementation → state/recovery boundary;
4. inspection of relevant tests where exposed by the subsystem;
5. comparison against current Kodac trust semantics;
6. explicit acquisition-mode classification.

This is a source-level acquisition pass, not a claim that every file in every donor repository has been manually read. Before actual intake, the selected subsystem receives a narrower exhaustive file/dependency/test audit at its exact pin.

## 4. Donor inventory and exact research pins

| Donor | Research pin | Primary role | Current acquisition disposition |
|---|---|---|---|
| `deepseek-ai/deepseek-harness` | `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca` | subagent/capability orchestration | `ADAPT_AND_REWRITE_BOUNDARY` |
| `cline/cline` | `76ac1c7f55f6b59921ccbc51fda8c9b997a75058` | practical agent/session/team runtime | `HIGH_PRIORITY_ADAPT` |
| `cline/kanban` | `14e371ffcaa8a929b4d4b2d23843f17506ecd2aa` | isolated worktree work units | `ADAPT_AND_REWRITE_BOUNDARY` |
| `Zoo-Code-Org/Zoo-Code` | `dbad4af1058fa2949ff79c81254b6d784b5bb69d` | modes/orchestration/command guard | `SELECTIVE_ADAPT` |
| `RooCodeInc/Roo-Code` | `b867ec9145750d0ae1ff7f02d35406e9bf2a0b16` | historical lineage | `HISTORICAL_REFERENCE` |
| `opensandbox-group/OpenSandbox` | `8f01e935c2cabba778cf37a152033fae062fa0f4` | sandbox protocol/runtime fabric | `OUT_OF_PROCESS_ADAPTER_FIRST` |
| `Graphify-Labs/graphify` | `558df6d57d61cb6ef79c740ec7473c6d953d79a7` | structural code graph/routing | `ADAPT_CONTEXT_ONLY` |
| `getsentry/sentry` | `38e151abd15dff871740b3a9f91a16a9c00591cc` | grouping + production evidence | `ADAPT_AND_INTEGRATE` |
| `capitalone/VulnHunter` | `4042d34609ff85e0029dd55743b9c3f677cc984a` | falsification/security workflow | `ALGORITHM_AND_PROTOCOL_ADAPT` |

### Pin-drift observation

OpenSandbox moved after the pin recorded in the original PR #121 plan. The live research pin is now `8f01e935...`, whose parent is the earlier `426300...` snapshot. This confirms an acquisition invariant:

```text
DONOR NAME != ACQUISITION IDENTITY
ACQUISITION IDENTITY = repository + exact commit/tag + selected paths + file digests
```

No donor should be admitted from an unpinned moving branch.

## 5. DeepSeek Harness — provider seam and continuable-child ownership

### 5.1 High-value implementation

Primary files inspected:

```text
packages/subagent/subagent/src/types.ts
packages/subagent/subagent/src/continuation.ts
```

The public subagent seam distinguishes consumer-facing contracts from internal lifecycle management. `SubagentCapabilities` explicitly declares start-time support for:

```text
outputSchema
depthLimit
toolFilter
persona
```

The service checks requested capabilities before dispatch. Unsupported requests fail loudly rather than being accepted and silently degraded.

`SubagentStartRequest` carries:

```text
parent Agent
AbortSignal
optional output schema
max depth
tool filter
persona
```

The tool-filter semantics are particularly valuable: a restricted tool is removed from child visibility **and** refused at execution, avoiding a split between prompt visibility and actual authority.

### 5.2 Continuable-child state machine

`SubagentContinuationManager` is substantially stronger than a naive spawn-and-await helper. It implements:

```text
stable durable child session id
    ↓
at most one live Activation
    ↓
FIFO child inbox owns turn ordering
    ↓
owned-child graph blocks premature settlement
    ↓
child-first disposal
    ↓
parent settlement notification
    ↓
cold resume from durable session state
```

Notable implementation details:

- live ancestry is retained independently from durable parent identity;
- disposal is memoized as a transaction so converging release paths share teardown;
- accepted-but-not-yet-admitted messages prevent false quiescence;
- a per-child `ChildLock` linearizes delivery, release, and disposal;
- a failed lock operation cannot poison later child operations because the chain tail absorbs rejection;
- provider participation in a continuable child can be reduced to detached creation data; the continuation manager retains lifecycle authority.

### 5.3 Kodac acquisition decision

**Acquire/adapt:**

- `SubagentCapabilities`-style explicit provider capability declaration;
- fail-loud capability mismatch;
- stable child/run identity separation;
- `AbortSignal` propagation contract;
- idempotent disposal contract;
- continuation manager ownership model;
- per-child operation serialization;
- cold-resume and child-first settlement semantics.

**Do not inherit:**

- the general “no privileged core” product philosophy;
- any ability for profile/plugin composition to replace K2 policy, trusted validators, evidence authority, or Done Gate;
- same-process provider trust as a general Kodac assumption.

**Acquisition mode:** `ADAPT_AND_REWRITE_BOUNDARY`.

Kodac should preserve the shape but bind every child to `reviewRunId`, canonical base/head, policy/config digest, capability grant digest, and receipt/evidence namespace.

## 6. Cline — practical Review Run lifecycle and specialist configuration

### 6.1 High-value implementation

Primary paths inspected:

```text
sdk/packages/core/src/extensions/tools/team/
sdk/packages/core/src/session/team/
sdk/packages/core/src/extensions/tools/team/configured-agent-config.ts
sdk/packages/core/src/extensions/tools/team/configured-agent-tool.ts
sdk/packages/core/src/extensions/tools/team/spawn-agent-tool.ts
sdk/packages/core/src/extensions/tools/team/multi-agent.ts
sdk/packages/core/src/extensions/tools/team/multi-agent.lifecycle.test.ts
```

Cline provides two useful layers:

```text
Sub-Agent
  lightweight parent → child delegation

Team
  persistent multi-session coordination
  task state
  mailbox
  mission log
  run lifecycle
```

Its configured-agent schema already demonstrates a practical specialist profile:

```text
name
description
tools
skills
providerId
modelId
maxIterations
systemPrompt
```

This is close to Kodac's future `SpecialistProfile`, but Kodac must replace donor authority semantics with capability requests resolved by trusted policy.

### 6.2 Lifecycle and recovery behavior

`AgentTeamsRuntime` exposes explicit events for:

```text
teammate spawn/shutdown
task start/end/update
mailbox messages
mission-log changes
run queued/started/progress/completed/failed/cancelled/interrupted
outcome fragments
```

The runtime tracks members/tasks/runs/outcomes and supports parallel, sequential, and pipeline execution.

The tests encode useful operational invariants:

- a busy teammate does not emit a false `task_start`;
- intentional abort-like shutdown errors do not corrupt the lifecycle;
- active runs transition to cancelled when shutdown aborts them;
- lifecycle events retain runtime agent id, conversation id, model id, and iteration limits;
- unread mailbox state is surfaced into the routed work.

### 6.3 Kodac acquisition decision

**Acquire/adapt:**

- child-session persistence patterns;
- run/event vocabulary;
- specialist configuration parsing and validation;
- model/provider-per-specialist selection;
- max-iteration budgets;
- explicit cancel/failure state transitions;
- team/task/mailbox concepts where useful for long review runs;
- lifecycle test patterns.

**Rewrite:**

- authority and permission defaults;
- tool visibility/grants;
- plugin/extension execution authority;
- repository/workspace-sourced configured-agent trust.

**Reject:** absent policy meaning enabled/auto-approved. Kodac remains default deny.

**Acquisition mode:** `HIGH_PRIORITY_ADAPT`, with selected direct code candidates only after a bounded dependency audit.

## 7. Cline Kanban — isolated work units, with critical semantic corrections

### 7.1 High-value implementation

Primary file inspected:

```text
src/workspace/task-worktree.ts
```

Useful mechanics include:

- task-id-normalized worktree paths;
- lock around worktree setup using the Git common directory;
- detached worktree creation;
- stale worktree registration pruning;
- base-ref validation;
- binary patch capture for tracked and untracked changes;
- atomic patch persistence before worktree deletion;
- restoration against the original commit where possible;
- cleanup rollback when workspace preparation fails;
- submodule initialization.

These are directly relevant to independent reviewer/fixer/reproducer work units.

### 7.2 Behavior Kodac must not inherit

Kanban intentionally treats an already-existing worktree as authoritative even if the base branch advanced, in order to avoid destroying task progress.

That is sensible for an interactive coding task and **incorrect for an exact-head review/proof run**.

Kodac needs:

```text
reviewedHead moves
→ prior work unit becomes STALE
→ never silently reclassify it as current
→ either preserve as historical artifact or create/rebind a new work unit
```

Kanban also mirrors gitignored paths such as dependency trees into task worktrees with symlinks. This is a useful performance optimization for coding, but a dangerous default for proof workspaces because it weakens environment independence and can create mutable cross-work-unit coupling.

For Kodac proof/reproduction work:

```text
shared ignored-path symlink = DENY BY DEFAULT
```

It may exist only in an explicitly non-proof developer mode with provenance recorded.

### 7.3 Acquisition decision

**Acquire/adapt:** locking, detached worktree lifecycle, patch capture, cleanup/recovery, stale-registration pruning.

**Rewrite:** exact-head staleness semantics, environment/materialization identity, dependency isolation.

**Reject:** permission bypass and unverified auto-commit/auto-PR authority.

**Acquisition mode:** `ADAPT_AND_REWRITE_BOUNDARY` into a Kodac `IsolatedWorkUnit` service.

## 8. Zoo Code — mode profiles and hardened classifier subprocess, not classifier authority

### 8.1 Mode/delegation value

Zoo's mode schema is a useful source for user-facing specialization:

```text
slug
name
roleDefinition
whenToUse
description
customInstructions
groups
allowedMcpServers
```

The orchestrator/new-task path demonstrates explicit delegation into named modes and parent/child task handling.

Kodac can adapt the UX/schema concept into a declaration-only `SpecialistProfile`, but task instructions can never override K2 or trusted policy.

### 8.2 Destructive Command Guard runner

High-value files:

```text
src/services/destructive-command-guard/manager.ts
src/services/destructive-command-guard/runner.ts
src/core/auto-approval/index.ts
```

The DCG managed-binary path has several good supply-chain/runtime patterns:

- HTTPS-domain allowlisting;
- bounded redirect handling;
- archive size cap;
- SHA-256 archive verification;
- managed installation/version marker.

The runner itself is a strong narrow subprocess wrapper:

```text
spawn(..., shell=false)
minimal environment allowlist
stdin ignored
stdout/stderr captured separately
timeout
aggregate output cap
SIGKILL on timeout/overflow
JSON schema-version check
exit-status ↔ decision consistency check
```

This pattern is worth adapting for external deterministic analyzers/classifiers.

### 8.3 Authority flaw for Kodac

Zoo's auto-approval code states that, when DCG is enabled, DCG is the authoritative command policy and Zoo allow/deny lists are bypassed for a command DCG allows.

Kodac must reject that semantics.

Correct Kodac composition:

```text
CommandRiskClassifier says ALLOW
          │
          ▼
       still untrusted
          │
          ▼
        K2 policy
          │
          ▼
allow / ask / deny
```

A classifier can restrict or escalate; it cannot grant K2 authority.

### 8.4 Acquisition decision

- mode schema: `ADAPT`;
- managed-binary + runner hardening: `DIRECT_TRANSPLANT_CANDIDATE` after dependency audit;
- DCG policy authority semantics: `REJECT`.

## 9. Roo Code — historical lineage only

Roo Code is archived. Its architecture is useful for understanding the lineage of modes, orchestration, and task delegation now continued by Zoo Code.

Do not select an archived Roo implementation when Zoo has a maintained equivalent unless the older implementation has a demonstrable property that the successor lost.

**Acquisition mode:** `HISTORICAL_REFERENCE`.

## 10. OpenSandbox — sandbox provider fabric, not K2 replacement

### 10.1 Live architecture

The current architecture separates six surfaces:

```text
client
protocol
lifecycle control plane
runtime backends
sandbox data plane
network/security plane
```

The public protocol covers lifecycle, diagnostics, `execd`, and egress. The lifecycle server selects a runtime service; Docker and Kubernetes remain behind a common `SandboxService` boundary.

The Docker implementation has:

- image/runtime preparation;
- resource limits;
- security options;
- expiration scheduling;
- restoration of existing managed sandboxes;
- secure-runtime resolver;
- network/egress integration;
- volume handling;
- snapshots.

The tests explicitly assert defaults including `no-new-privileges`, dropped capabilities, and PID limits.

### 10.2 Why K2 remains authority

OpenSandbox is a general sandbox platform. Its lifecycle facts are not automatically Kodac proof artifacts. For example, Docker expiration uses service-managed timer state plus persisted metadata/container labels. That can be operationally correct while still differing from Kodac's H4 requirement for exact attempt identity, lifecycle evidence records, recovery evidence, and bounded proof semantics.

OpenSandbox itself also evolves operational control-plane behavior; the current research pin includes a correction to configuration that could otherwise crash-loop a controller. This is normal platform engineering, but reinforces why a provider cannot become its own qualification authority.

### 10.3 Acquisition decision

**Highest-value acquisition targets:**

- protocol/resource model;
- `SandboxService` provider boundary;
- Docker/Kubernetes backend abstraction;
- `execd` protocol/client boundary;
- diagnostics and endpoint abstraction;
- egress-policy integration model.

Recommended sequence:

```text
Phase 1: protocol/adaptor study
Phase 2: out-of-process OpenSandbox provider
Phase 3: capability-parity hostile qualification
Phase 4: only then consider broader code transplantation
```

Every provider must publish a Kodac capability statement and fail loudly on unsupported proof obligations.

**Acquisition mode:** `OUT_OF_PROCESS_ADAPTER_FIRST`.

## 11. Graphify — high-value routing graph with explicitly non-proof edges

### 11.1 Source behavior

Primary files inspected:

```text
graphify/build.py
graphify/analyze.py
```

Graphify builds a NetworkX graph from extraction tiers and has substantial normalization/healing logic around imperfect extractor/model output.

Important source-level properties:

- AST vs semantic tier distinction;
- generic relation suppression when a more specific relation exists;
- cross-language phantom-edge guards;
- alias folding and malformed hyperedge recovery;
- numeric-ID coercion while avoiding fabricated IDs for invalid nonnumeric values;
- repo-relative path normalization;
- explicit provenance/confidence vocabulary including `EXTRACTED`, `INFERRED`, and `AMBIGUOUS`;
- heuristics that surface cross-file/cross-community “surprising connections”;
- defensive suppression of known resolver pollution across language/file-type boundaries.

### 11.2 Kodac interpretation

The implementation is valuable precisely because it makes uncertainty explicit and has accumulated many correctness repairs around graph construction.

But Graphify analysis deliberately treats `INFERRED` and `AMBIGUOUS` edges as useful signals and may rank them highly because uncertainty itself can be interesting for exploration. That is suitable for routing and discovery, not proof.

Correct Kodac use:

```text
Graphify edge
→ context/routing hypothesis
→ preserve provenance/confidence
→ exact symbol/dataflow validator if needed
→ only validator may advance technical evidence
```

### 11.3 Acquisition decision

- graph construction/normalization lessons: `ADAPT`;
- selected graph diff/query/community logic: `DIRECT_TRANSPLANT_CANDIDATE` after dependency audit;
- inferred-edge output as proof: `REJECT`;
- standalone Graphify process/provider is also viable if transplantation coupling is high.

**Acquisition mode:** `ADAPT_CONTEXT_ONLY` initially.

## 12. Sentry — versioned grouping and production evidence

### 12.1 Finding/grouping reverse engineering

Primary file inspected:

```text
src/sentry/grouping/ingest/hashing.py
```

The grouping path is more sophisticated than a static fingerprint:

```text
project grouping config
→ server-side fingerprint rules
→ normalized stack traces
→ hashes + grouping variants
→ GroupHash lookup/creation
→ issue group
```

Critically, Sentry supports a **secondary grouping configuration during transition**. It can calculate legacy hashes under an older config so new grouping behavior can remain compatible with existing groups during algorithm migration.

That is directly useful to Kodac because a finding-correlation algorithm will evolve. A hard-coded immutable correlation hash would either strand old findings or force accidental identity collapse.

Recommended Kodac design:

```text
FindingFingerprintAlgorithm {
  version
  normalized claim inputs
  primary identity
  compatible legacy identities[]
}
```

A migration may compute both current and previous correlation identities for lookup, while the canonical KRI finding identity remains exact-head bound and authoritative.

**Dedup never raises evidence.**

### 12.2 Production/source attribution reverse engineering

Primary file inspected:

```text
src/sentry/integrations/source_code_management/commit_context.py
```

Useful implementation patterns include:

- SCM-provider abstraction;
- source-line + ref + repository + code-mapping data structures;
- blame retrieval with rate-limit/identity/host failure handling;
- merge-commit resolution;
- default-branch checks;
- PR lookup by merge SHA;
- workflow debouncing/locking;
- explicit metrics/lifecycle instrumentation.

This supports a future Kodac `ProductionEvidenceProvider` and `ChangeAttributionGraph`, but Kodac must keep three concepts separate:

```text
OBSERVATION
  production behavior occurred

ATTRIBUTION
  behavior maps to candidate source/revision/change

CAUSATION
  evidence establishes that the change caused the behavior
```

Sentry suspect-commit style attribution is context, not proof of causation.

### 12.3 Acquisition decision

**Acquire/adapt:**

- versioned grouping/fingerprint migration strategy;
- correlation-provider interfaces;
- SCM commit-context abstractions;
- production-event → source/revision attribution patterns;
- review-quality feedback-loop concepts.

**Do not transplant wholesale:** Sentry event/database architecture.

**Authority limit:** Sentry/telemetry data is untrusted data and cannot advance Kodac technical evidence without a qualified validator.

**Acquisition mode:** `ADAPT_AND_INTEGRATE`.

## 13. VulnHunter — falsification protocol and completeness discipline

### 13.1 Source workflow

The repository exposes a concrete security workflow through phase files:

```text
Recon
→ class-specific Hunt
→ phase2b Verify/Disprove
→ Reproduce/Test
→ Fix
→ Sweep
→ independent Fix Verify
```

The most valuable artifact inspected is:

```text
vulnhunt/phases/phase2b_verify.md
```

Its strongest design features are not model prompts in isolation but **verification process constraints**:

- build a Candidate Manifest before verification;
- final verdict table must contain exactly the same number of candidates;
- actively search for upstream defenses and framework guarantees;
- distinguish attacker-controlled input from server-controlled values;
- recheck production reachability;
- read actual library/source documentation for sanitizer/framework behavior;
- search **all sink callsites** before broad downgrade claims;
- trace **all writers** before asserting a value is server-controlled;
- compare sibling authorization paths;
- do not accept comments, names, or prose as proof;
- recalibrate severity after falsification.

This is an excellent source for Kodac's `FalsificationProtocol`.

### 13.2 One rule Kodac must reject

VulnHunter includes a consensus-based shortcut where identical Gate-1 evidence from all partition agents can allow elimination without another source reread.

That conflicts with Kodac's core rule:

```text
model agreement != technical evidence
```

For Kodac, consensus can reduce scheduling priority, but an authoritative rejection/clearance must be grounded in trusted source/analyzer/runtime evidence.

### 13.3 Acquisition decision

- Candidate Manifest completeness contract: `ADAPT`;
- class-specific falsification gates: `ADAPT`;
- all-callsite/all-writer downgrade discipline: `ADAPT`;
- prompt text as trusted validation: `REJECT`;
- consensus clearance: `REJECT`.

**Acquisition mode:** `ALGORITHM_AND_PROTOCOL_ADAPT`.

## 14. Reviewer-adversarial learning from Kodac PR #120

This pass also used a real Kodac reviewer result as a reverse-engineering case rather than treating reviewer prose as authority.

### 14.1 Confirmed high-value reviewer finding: transport provenance

A reviewer identified that an earlier `GvisorDockerOutputTransport` boundary was structural and could be substituted by an in-process caller with a self-consistent fabricated transport, allowing fabricated byte counts/digests to reach durable evidence.

This was a real trust-boundary problem, not a style preference.

The final merged implementation no longer accepts an arbitrary output transport in the gateway configuration. It takes the canonical R3F Docker control-plane provider + trusted socket path and constructs the transport internally after validating provider/workload/requirement/socket identities.

Classification:

```text
REVIEWER_CONFIRMED
class = authority/provenance
lesson = structural typing is not provenance
```

Future benchmark case:

> Can a reviewer detect a structurally valid but unprovenanced in-process evidence provider that can fabricate self-consistent records?

### 14.2 Stale reviewer summary: exact-head freshness matters

The same review stream also retained a high-risk summary stating that the PR head did not compile, attach timeout could interrupt capture, provider provenance was mismatched, and validation targeted a different commit. The PR subsequently moved through fixes and exact-head certification before merge.

The historical comment is useful evidence about the reviewed revision, but not a valid verdict on the later head.

Classification:

```text
REVIEWER_PARTIALLY_CORRECT_AT_OLDER_HEAD
current applicability = STALE
lesson = reviewer finding text must be head-bound
```

This directly validates existing KRI freshness semantics.

### 14.3 Product lesson: external review limits are themselves a bottleneck

The CodeRabbit stream also recorded a review-limit refusal on PR #120. This is not a correctness failure of the reviewer, but it is a product-availability failure mode that reinforces the founder invariant:

```text
NO KODAC-IMPOSED ARTIFICIAL REVIEW LIMITS
```

Kodac may be bounded by compute/provider availability, but its architecture must support local/self-hosted/BYOK/BYOM escape paths.

## 15. Cross-donor capability winners

| Capability | Best source observed | Kodac synthesis |
|---|---|---|
| Provider capability seam | DeepSeek Harness | adapt seam; K2 resolves grants |
| Continuable child ownership | DeepSeek Harness | adapt stable child/Activation/ChildLock model |
| Practical persisted child sessions | Cline | adapt session graph + exact review identity |
| Specialist config | Cline | adapt schema; resolve from trusted base/org config |
| Parallel team lifecycle | Cline | adapt events/state; do not use team vote for truth |
| Worktree isolation mechanics | Cline Kanban | adapt locking/patch recovery; replace stale-head semantics |
| Mode/tool UX | Zoo Code | adapt as declarations only |
| External classifier runner | Zoo Code DCG runner | candidate direct transplant; classifier remains untrusted |
| Sandbox protocol/provider boundary | OpenSandbox | out-of-process provider first |
| Native proof authority | Kodac K2/H4 | keep Kodac |
| Structural routing graph | Graphify | context provider, never proof |
| Finding-grouping evolution | Sentry | versioned fingerprints + compatibility lookup |
| Production/source correlation | Sentry | optional ProductionEvidenceProvider |
| Falsification process | VulnHunter | adapt manifest/gates; deterministic Kodac closure |
| Evidence authority | Kodac | keep closed |
| Exact-head freshness | Kodac KRI | keep; extend to every child/artifact |
| Done verdict | Kodac | keep closed |

## 16. Proposed future Kodac contracts

### 16.1 ReviewRun child-session contract

```text
ReviewChildSession {
  reviewRunId
  childSessionId
  parentSessionId
  canonicalBase
  reviewedHead
  roleProfileDigest
  modelProviderIdentity
  modelIdentity
  capabilityRequestDigest
  grantedCapabilityDigest
  contextManifestDigest
  policyIdentity
  status
  stopReason?
  usage
  createdAt
  settledAt?
}
```

Rules:

- child identity is durable;
- at most one live activation per continuable child;
- follow-up delivery is serialized per child;
- head movement does not mutate child identity into a new review; it stales the review run;
- child output is untrusted regardless of provider;
- child session cannot raise evidence.

### 16.2 Specialist profile contract

```text
SpecialistProfile {
  profileId
  version
  role
  description
  routingTriggers[]
  contextRequirements[]
  requestedTools[]
  requestedAnalyzers[]
  preferredCapabilityTier
  preferredModel?
  maxIterations
  maxContextBytes
  maxCost?
  evidenceCeiling
}
```

The profile requests capability. The trusted host computes actual grants.

### 16.3 IsolatedWorkUnit contract

```text
IsolatedWorkUnit {
  workUnitId
  reviewRunId
  purpose
  canonicalBase
  reviewedHead
  materializationDigest
  dependencyMaterializationDigest
  workspacePath
  sandboxRequirement?
  state
  patchArtifactDigest?
}
```

Proof-mode rules:

- detached exact-commit materialization;
- no implicit rebasing when base moves;
- no mutable shared dependency symlinks by default;
- every recovered patch remains bound to its original base commit;
- stale work units may be retained for audit but never reused as current proof.

### 16.4 SandboxProvider capability contract

```text
SandboxProviderCapabilities {
  providerIdentity
  providerVersion
  isolationClasses[]
  supportsExactImageDigest
  supportsCgroupBounds
  supportsTtl
  supportsTtlRecoveryEvidence
  supportsNetworkDenyAll
  supportsEgressAllowlist
  supportsOutputAggregateBound
  supportsFilesystemScope
  supportsCredentialBroker
  supportsSnapshot
  supportsDiagnostics
}
```

Unsupported capability = fail loud. Provider self-assertion alone is insufficient; qualification tests establish accepted capabilities.

### 16.5 Versioned finding fingerprint contract

```text
FindingFingerprint {
  algorithmVersion
  class
  normalizedPath
  enclosingSymbolIdentity
  normalizedClaimShape
  primaryCorrelationIdentity
  legacyCompatibleIdentities[]
}
```

Correlation is for grouping only and never raises evidence.

### 16.6 ProductionEvidenceProvider contract

```text
ProductionObservation {
  provider
  providerEventIdentity
  observedAt
  releaseIdentity?
  deployIdentity?
  runtimeServiceIdentity?
  traceIdentity?
  stackFrames[]
  candidateSourceMappings[]
  payloadDigest
  trust = UNTRUSTED_EXTERNAL_DATA
}
```

A separate attribution validator decides whether a production observation can be bound to a source/revision/change.

### 16.7 Falsification request contract

```text
FalsificationRequest {
  findingIdentity
  reviewedHead
  candidateManifestIdentity
  claim
  assumptions[]
  requiredCounterChecks[]
  classSpecificGates[]
  allCallsiteCheckRequired
  allWriterCheckRequired
}
```

Final authoritative rejection requires references to trusted validation evidence, not model consensus.

## 17. Top 25 current acquisition candidates

These are candidates for later bounded intake, not authorizations.

| # | Donor / target | Acquisition mode | Why |
|---|---|---|---|
| 1 | DeepSeek `SubagentCapabilities` / start contracts | `ADAPT_AND_REWRITE_BOUNDARY` | fail-loud capability negotiation |
| 2 | DeepSeek continuation stable child/Activation model | `ADAPT_AND_REWRITE_BOUNDARY` | mature lifecycle ownership |
| 3 | DeepSeek per-child `ChildLock` pattern | `DIRECT_TRANSPLANT_CANDIDATE` | small, valuable concurrency primitive |
| 4 | DeepSeek idempotent run disposal semantics | `ADAPT` | prevents orphaned child work |
| 5 | Cline configured-agent schema/parser | `DIRECT_TRANSPLANT_CANDIDATE` | practical specialist config validation |
| 6 | Cline configured-agent tool construction | `ADAPT` | per-specialist model/provider/budget |
| 7 | Cline child-session persistence patterns | `ADAPT` | durable parent/child session graph |
| 8 | Cline team event vocabulary | `ADAPT` | useful ReviewRun lifecycle model |
| 9 | Cline team cancellation/failure tests | `TEST_PATTERN_ADAPT` | operational correctness coverage |
| 10 | Cline mailbox/task state concepts | `ADAPT` | long-running coordinated review work |
| 11 | Kanban worktree setup lock | `DIRECT_TRANSPLANT_CANDIDATE` | protects concurrent worktree creation |
| 12 | Kanban detached worktree creation/recovery | `ADAPT` | isolated work unit mechanics |
| 13 | Kanban binary tracked/untracked patch capture | `ADAPT` | preserves abandoned work safely |
| 14 | Kanban stale registration prune/cleanup | `ADAPT` | recovery after interrupted cleanup |
| 15 | Zoo managed binary download/checksum pattern | `DIRECT_TRANSPLANT_CANDIDATE` | hardened analyzer distribution |
| 16 | Zoo DCG bounded subprocess runner | `DIRECT_TRANSPLANT_CANDIDATE` | shell-free/time/output/schema/exit validation |
| 17 | Zoo mode schema | `ALGORITHM_SCHEMA_ADAPT` | user-facing specialist declarations |
| 18 | OpenSandbox lifecycle protocol | `PROTOCOL_ONLY` initially | broad runtime-neutral sandbox contract |
| 19 | OpenSandbox `SandboxService` provider boundary | `OUT_OF_PROCESS_ADAPTER` | Docker/K8s backend seam |
| 20 | OpenSandbox execd protocol/client | `OUT_OF_PROCESS_ADAPTER` | sandbox-local command/file/PTY/metrics surface |
| 21 | Graphify graph normalization/provenance logic | `ADAPT` | robust structural context ingestion |
| 22 | Graphify graph diff/path/community queries | `ADAPT_OR_PROCESS_PROVIDER` | routing/blast-radius context |
| 23 | Sentry secondary grouping migration pattern | `ALGORITHM_ADAPT` | stable dedup across algorithm versions |
| 24 | Sentry SCM commit-context abstraction | `ADAPT_AND_INTEGRATE` | production/source attribution |
| 25 | VulnHunter candidate-manifest + falsification gates | `PROTOCOL_ADAPT` | systematic false-positive destruction |

Before any item becomes `DIRECT_TRANSPLANT`, the authorization must name exact files/symbols and verify that the code does not import a wider donor authority model through dependencies.

## 18. Donor design mistakes Kodac must not inherit

1. **Default-allow tool policy** when policy is absent.
2. **Executable plugins with ambient host authority**.
3. **Configuration/profile replacement of trusted policy**.
4. **Model consensus used as evidence**.
5. **Consensus-based security clearance without trusted re-check**.
6. **Existing task worktree treated as current after reviewed head moves**.
7. **Mutable shared dependency symlinks inside proof workspaces by default**.
8. **Agent-controlled permission bypass for autonomy**.
9. **Agent-controlled auto-commit/auto-PR before independent validation**.
10. **Command classifier treated as execution authority**.
11. **Sandbox provider self-certification treated as K2 capability proof**.
12. **Operational TTL timer treated as sufficient lifecycle proof**.
13. **Inferred graph relation upgraded to precise fact**.
14. **Graph/model normalization that silently upgrades recovered data to extracted provenance**.
15. **Suspect commit treated as causation**.
16. **Telemetry payload treated as trusted instruction/context**.
17. **Finding dedup treated as evidence corroboration**.
18. **Long-lived reviewer comments treated as current after head movement**.
19. **Hosted reviewer quota made a required product dependency**.
20. **Whole donor framework imported when a narrow protocol/adapter gives the same capability**.

## 19. Reviewer-learning dataset seed

The initial ledger should include at least these PR #120 cases:

### Case R-001 — structural provider provenance

```text
review claim:
  structural GvisorDockerOutputTransport can be replaced by a fabricated
  in-process implementation and feed self-consistent evidence

classification:
  REVIEWER_CONFIRMED

root lesson:
  type/shape validity != provenance

benchmark class:
  authority / confused deputy / evidence-provider spoofing
```

### Case R-002 — moving-head staleness

```text
review claim:
  high-risk summary describes compile/timeout/provenance issues at an older head

classification:
  HISTORICALLY_RELEVANT_BUT_STALE

root lesson:
  reviewer output requires exact-head freshness before adjudication

benchmark class:
  stale-context / review freshness
```

### Case R-003 — external availability bottleneck

```text
observation:
  external reviewer refused a requested review because a plan quota was exhausted

classification:
  PRODUCT_AVAILABILITY_FAILURE

root lesson:
  Kodac cannot require one hosted reviewer to make progress

benchmark class:
  throughput / provider failover / local fallback
```

Future reverse-engineering and live Kodac reviews should append comparable cases with exact reviewer, reviewed SHA, claim, source verification, tests, final classification, and whether Kodac could deterministically prove/disprove the claim.

## 20. Recommended donor-intake sequence

Do not import 25 components at once.

### Acquisition A — ReviewRun substrate

Study/authorize together:

```text
DeepSeek child/provider contracts
+
Cline child session + configured specialist contracts
+
Kodac event/run identity
```

Output should be a new Kodac-native contract, not a foreign runtime fork.

### Acquisition B — IsolatedWorkUnit

Study/authorize:

```text
Cline Kanban lock/worktree/patch recovery mechanics
```

Rewrite exact-head and dependency-isolation semantics before code admission.

### Acquisition C — external analyzer runner

Study/authorize:

```text
Zoo managed-binary + DCG runner hardening
```

Generalize to `BoundedAnalyzerProcess`, leaving K2 as authority.

### Acquisition D — finding correlation evolution

Study/authorize:

```text
Sentry grouping transition ideas
+
Kodac KRI finding identity
```

Do not change canonical KRI identity merely to gain dedup.

### Acquisition E — Cyber falsification protocol

Study/authorize:

```text
VulnHunter Candidate Manifest + class gates
```

Implement as untrusted falsification requests plus closed validator checks.

### Acquisition F — distributed sandbox option

Only after native K2 capability contracts are stable:

```text
OpenSandbox adapter
→ hostile parity suite
→ qualification matrix
→ optional provider
```

### Acquisition G — production evidence

After review verdicts and revision identity are stable:

```text
Sentry integration/provider
→ observation normalization
→ attribution validator
→ escaped-finding feedback loop
```

## 21. Architectural consequence for PR #121

This reverse-engineering pass strengthens, rather than overturns, the master plan.

Recommended amendments to the implementation roadmap are:

1. make `ReviewRun`/child-session design explicitly derive from the best observed combination of Cline lifecycle and DeepSeek capability/continuation seams;
2. add an `IsolatedWorkUnit` contract before parallel fix/reproducer agents;
3. require exact-head invalidation to override donor “preserve task progress” behavior;
4. add a bounded external-analyzer process abstraction based on the hardened Zoo DCG runner pattern, without importing classifier authority;
5. evolve `correlationIdentity` into a **versioned** finding-fingerprint algorithm with compatibility lookup inspired by Sentry grouping transitions;
6. add `ProductionEvidenceProvider` and post-merge escaped-finding learning as a later non-blocking layer;
7. make VulnHunter-style Candidate Manifest completeness and all-callsite/all-writer checks explicit Cyber falsification requirements;
8. record exact donor pins in every source admission record and refresh them only through an explicit review;
9. treat reviewer outputs as exact-head hypotheses and retain real reviewer successes/failures as a benchmark dataset.

## 22. Required source-admission record before code copy

For each later intake persist:

```text
Donor repository
Exact commit/tag
Selected paths
Selected symbols
File digests
Reported permission/provenance evidence
Public license at selected pin
Third-party / generated-code boundary
Dependencies and transitive code ownership
Kodac target module
Acquisition mode
Trust level
Authority ceiling
Network/filesystem/credential requirements
Tests imported/adapted
New hostile tests
Rollback plan
```

No broad statement such as “we have permission to use repository X” should replace per-intake provenance for the exact code that lands.

## 23. Stop condition and final recommendation

The immediate source-level conclusion is:

```text
DO NOT FORK ONE DONOR.
DO NOT BUILD EVERYTHING FROM SCRATCH.
DO NOT IMPORT A DONOR'S AUTHORITY MODEL.

TAKE NARROW PROVEN IMPLEMENTATIONS,
PIN THEM EXACTLY,
WRAP OR REWRITE THEIR AUTHORITY BOUNDARY,
AND MAKE KODAC THE ONLY TRUST SURFACE.
```

Highest-priority future acquisition experiment:

> Build the Kodac-native `ReviewRun` and `ReviewChildSession` contracts by reconciling **Cline's practical persisted lifecycle** with **DeepSeek Harness's fail-loud capability/continuation seam**, while binding every child to Kodac exact-head/policy/context identities and denying all authority not granted by K2.

This report stops at reverse engineering and acquisition planning. No donor code is authorized for intake by this document.
