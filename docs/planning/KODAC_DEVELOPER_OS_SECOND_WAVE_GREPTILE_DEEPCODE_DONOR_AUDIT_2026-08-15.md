# Kodac Developer OS — Second-Wave Greptile + DeepCode Donor Audit

Date: 2026-08-15
Status: AUDIT CANDIDATE — DOCS ONLY

## 1. Decision

```text
DECISION:
SECOND_WAVE_GREPTILE_DEEPCODE_AUDIT_READY_FOR_CANONICAL_REVIEW

CANONICAL KODAC BASE:
353d019735e5d18527a3aa187907327ba826fa3e

CANONICAL KODAC BASE TREE:
34055bd8668a5bf14ef3a96bf57533823a30e9b5

PROGRAM AUTHORITY:
KDO-P0 — Developer OS Donor Intake & Capability Superset Authorization

PRODUCTION DONOR IMPORT:
NOT AUTHORIZED BY THIS AUDIT

DONOR EXECUTION:
NOT PERFORMED

DONOR INSTALL / BUILD / TEST:
NOT PERFORMED
```

This audit extends the canonical Developer OS donor program with two different donor classes:

1. **Greptile** — primarily a product-behavior / reviewer-architecture donor for repository-graph review, review memory, scoped rules, cross-repository context, and conversational PR review;
2. **HKUDS/DeepCode** — an MIT source donor for long-horizon agent harness engineering, context-pressure control, subagent orchestration, isolated worktree workers, and persistent local memory patterns.

The governing invariant remains:

```text
DONOR CAPABILITY MAY BE ACQUIRED.
DONOR AUTHORITY IS NEVER INHERITED.
```

This audit does not authorize either donor to execute inside Kodac production, mutate a workspace, approve an action, merge Git state, access credentials, redefine K2 policy, alter KRI adjudication, or assert `PROVEN_READY`.

---

## 2. Relationship to current canonical Kodac

At this base Kodac already has stronger authority/evidence foundations than either donor should be allowed to replace:

```text
K2
  sole trusted side-effect execution authority

H2
  exact model-visible request/history reconstruction boundary

H4-R1
  one-shot approval evidence binding

H4-R2A/B/C
  provider-neutral confinement evidence + Linux Landlock read-only execution binding

K3
  repository/context evidence with provenance and freshness

KRI-R2/R3/R4
  finding lifecycle + provider-neutral reviewer execution + reviewer qualification

Done Gate
  sole current PROVEN_READY authority
```

The current bounded H4-R2C completion claim is:

```text
KODAC_K2_LINUX_LANDLOCK_READ_ONLY_EXECUTION_BINDING_PROVEN
```

This is not H4 completion. Workspace-write confinement remains separate work.

The first-wave donor program has also already established/implemented important prerequisites including:

- language-neutral semantic contracts (`KDO-C1`);
- universal model capability contracts (`KDO-C6`);
- context connector contracts (`KDO-C11`);
- incremental context index state-machine work (`KDO-C12`).

Therefore the second wave should extend these canonical primitives rather than build parallel donor-specific stacks.

---

## 3. Audit method and safety boundary

This audit used source/document inspection only.

```text
NO donor package installation
NO donor dependency installation
NO donor test execution
NO donor build execution
NO donor CLI execution
NO donor desktop execution
NO donor agent execution
NO donor subprocess execution
NO donor network client execution
NO donor MCP execution
NO donor credentials
NO donor-generated patch execution
```

All donor source, documentation, comments, prompts, agent definitions, rules, configuration, and examples are treated as untrusted engineering evidence.

In particular:

```text
DONOR AGENT INSTRUCTIONS != KODAC GOVERNANCE
DONOR REVIEW RULES != KODAC POLICY
DONOR MEMORY != KODAC TRUTH
DONOR FINDING != ADJUDICATED FINDING
DONOR SANDBOX LABEL != OBSERVED CONFINEMENT PROOF
DONOR WORKTREE MERGE != K2 WRITE AUTHORITY
```

---

# Part I — Greptile

## 4. Greptile evidence boundary

### 4.1 Hosted reviewer behavior

Greptile's current hosted reviewer was inspected through its public product documentation, observed on 2026-08-15.

Primary behavior references:

```text
https://www.greptile.com/docs/introduction
https://www.greptile.com/docs/how-greptile-works/graph-based-codebase-context
https://www.greptile.com/docs/how-greptile-works/memory-and-learning
https://www.greptile.com/docs/code-review/key-features
https://www.greptile.com/docs/code-review/greptile-config
https://www.greptile.com/docs/code-review/greptile-config-reference
https://www.greptile.com/docs/developer-quick-reference
https://www.greptile.com/changelog
```

These are **mutable product-behavior references**, not immutable source-code pins. No claim is made that Kodac knows or reproduces Greptile's private implementation.

Primary observed product concepts:

- repository-wide graph context;
- code entities such as files/functions/classes and relationships such as calls/imports/dependencies;
- review of ripple effects outside the changed diff;
- pattern comparison against related code;
- team-feedback learning from review interaction;
- conversational PR follow-up;
- directory-scoped/cascading `.greptile/` review configuration;
- structured rules with IDs/scopes/severity and inherited-rule disablement;
- repository files explicitly admitted as reviewer context;
- related-repository context / repo clusters.

### 4.2 Public Greptile VS Code source

A public Greptile VS Code integration repository was also inspected as a separate source artifact:

```text
Repository:
greptileai/greptile-vscode

Pinned commit:
72fc0c5a68ff966e64c2b182a2e6bf5912410821

Pinned tree:
01b11188fb3e89378c98af1756158dfcc2e9a6ed

package.json blob:
f33ba47800fc7eb94338dd853f9318086a3488a6

LICENSE blob:
7387056d467b28c0f447e355f494b4be06999f47

Repository/package license signal:
MIT
```

The pinned extension describes itself as a VS Code surface to search and understand repositories in plain English. Its pinned main revision is from 2024 and is not treated as evidence for the current hosted review backend.

Disposition:

```text
CURRENT HOSTED REVIEWER:
BEHAVIORAL_REIMPLEMENTATION / STUDY_ONLY

PUBLIC VS CODE EXTENSION:
STUDY_ONLY / HOST-BRIDGE REFERENCE
```

---

## 5. Greptile finding G1 — repository graph-aware review

Greptile's highest-value architectural lesson is not "use a bigger prompt." It is:

```text
DIFF
  + repository graph
  + impacted relationships
  + local patterns
  + bounded supporting context
  -> reviewer request
```

This is directly relevant to Kodac because KRI-R3 already provides provider-neutral reviewer execution, while K3/C1/C11/C12 provide increasingly mature repository/context primitives.

Kodac should not build a second proprietary review graph disconnected from those systems.

Target composition:

```text
KDO-C1 semantic identities
        +
K3 repository snapshot / provenance
        +
C11/C12 context source + incremental state
        +
new bounded relationship/impact projection
        ↓
KRI reviewer context evidence
        ↓
KRI-R3 reviewer execution
        ↓
KRI-R2 adjudication lifecycle
```

Required invariants:

- graph nodes/edges bind to an exact repository/content identity;
- context completeness/truncation is explicit;
- stale graph state cannot silently review a newer head;
- graph retrieval is evidence, not truth;
- the model cannot invent an edge and have Kodac treat it as canonical graph evidence;
- cross-file/ripple-effect context must cite its provenance;
- reviewer findings remain claims until KRI adjudication;
- no graph-retrieval component gains write authority.

Disposition:

```text
PRIMARY:
BEHAVIORAL_REIMPLEMENTATION + PORT PRODUCT ARCHITECTURE

PRIORITY:
VERY HIGH

PROPOSED FOLLOW-ON GATE:
KRI-R5 — GRAPH-AWARE REPOSITORY REVIEW CONTEXT
```

---

## 6. Greptile finding G2 — reviewer memory and team learning

Greptile publicly describes learning from team comments and feedback so later reviews better match team preferences.

This capability is valuable, but Kodac must make a stronger distinction than a product recommender normally needs:

```text
TEAM PREFERENCE != CORRECTNESS
COMMENT ACCEPTED != FINDING TRUE
THUMBS-UP != SECURITY PROOF
REPEATED STYLE != POLICY AUTHORITY
```

Kodac should permit learned state to affect only bounded reviewer behavior such as:

- prioritization/ranking;
- likely-noise suppression;
- preferred explanation style;
- team-specific pattern retrieval;
- reviewer strictness recommendations;
- candidate rule suggestions requiring explicit adoption.

Learned state must not silently change:

- K2 allow/ask/deny;
- approval authority;
- confinement requirements;
- finding lifecycle state;
- qualification thresholds;
- Done Gate requirements;
- merge/publish authority.

Every learned preference record should bind:

```text
scope
source interaction identity
repository/team identity
created/updated time
confidence/support count
applicability
revocation/disable state
provenance
```

and should remain inspectable and removable.

Disposition:

```text
PRIMARY:
BEHAVIORAL_REIMPLEMENTATION

PRIORITY:
HIGH

PROPOSED FOLLOW-ON GATE:
KRI-R6 — REVIEWER PREFERENCE MEMORY & FEEDBACK ADAPTATION
```

---

## 7. Greptile finding G3 — cascading review configuration

The `.greptile/` approach demonstrates a mature monorepo configuration pattern:

```text
root defaults
  ↓ inherited
subtree configuration
  ↓ override/narrow
file-scoped effective review profile
```

Kodac should port the **scoping model**, not import Greptile's configuration as authority.

Potential Kodac form:

```text
ReviewProfile
ReviewRule
RuleScope
RuleSeverity
RuleSource
InheritedRuleState
EffectiveReviewContext
```

Critical Kodac difference:

Repository-owned `rules.md`, `AGENTS.md`, `.greptile/*`, or equivalent files are **untrusted repository context**. They may inform the model/reviewer, but they cannot redefine Kodac governance or K2/KRI/Done Gate authority.

A future configuration plane should therefore expose both:

```text
model-visible repository guidance
AND
non-overridable Kodac authority policy
```

as separate layers.

Disposition:

```text
PORT BEHAVIOR / CONFIGURATION MODEL
PRIORITY: HIGH
DEPENDENCY: KRI-R5 context evidence model
```

---

## 8. Greptile finding G4 — cross-repository review context

Related-repository context is strategically important for:

- SDK + service changes;
- schema + generated client changes;
- monorepo-adjacent systems;
- shared packages;
- API producer/consumer compatibility;
- infrastructure/application coupling.

Kodac should support cross-repository review only with explicit source identity and bounded read-only context.

A review must be able to say:

```text
PRIMARY REPOSITORY:
exact reviewed head/content identity

RELATED CONTEXT REPOSITORIES:
exact source/revision/content identities

RELATIONSHIP:
explicit configured/derived reason

FRESHNESS:
current | stale | unknown

COMPLETENESS:
complete | bounded/truncated
```

Cross-repo context cannot widen K2 filesystem or credential authority.

Disposition:

```text
PORT / BEHAVIORAL_REIMPLEMENTATION
PRIORITY: HIGH AFTER KRI-R5 CORE
```

---

## 9. Greptile finding G5 — conversational review and fix handoff

Conversational follow-up on a PR is valuable and maps naturally to KRI's existing provider-neutral review records.

Kodac target:

```text
finding
  -> follow-up question
  -> bounded evidence refresh
  -> reviewer answer
  -> optional proposed correction
```

But the final handoff must preserve authority separation:

```text
REVIEWER CAN PROPOSE A FIX
REVIEWER CANNOT GAIN WRITE AUTHORITY

FIX REQUEST
  -> K2 policy/approval/confinement
  -> mutation evidence
  -> verification
  -> KRI re-review
  -> Done Gate
```

Disposition:

```text
PORT PRODUCT WORKFLOW
PRIORITY: MEDIUM/HIGH
```

---

## 10. Greptile whole-product decision

```text
WHOLE PRODUCT CLONE/FORK:
NOT APPLICABLE / REJECTED

CURRENT BACKEND SOURCE EQUIVALENCE CLAIM:
NOT AVAILABLE FROM THIS AUDIT

TARGET:
REIMPLEMENT THE HIGH-VALUE REVIEW ARCHITECTURE ON KODAC'S
K3 + C1/C12 + KRI + K2 + DONE-GATE FOUNDATIONS
```

The goal is not to make "Kodac's Greptile mode." The goal is to make Kodac's reviewer materially stronger because graph context, learned preferences, scoped rules, and cross-repo evidence become native KRI inputs.

---

# Part II — HKUDS/DeepCode

## 11. DeepCode source pin and rights signal

```text
Repository:
HKUDS/DeepCode

Pinned branch:
main

Pinned commit:
287510fbf6820147a48adf79f7fd86b0ed1afe92

Pinned tree:
7f44b320f86d04d4315242fabc74f1b325829be8

Repository language signal:
Python

Root LICENSE blob:
b3ba37ce442298d5bdec96e2e52a8a812a25f123

Root license:
MIT

Copyright signal:
2025 Data Intelligence Lab@HKU
```

Representative inspected source at the pinned revision:

```text
core/agent_runtime/pruner.py
  blob dae72f4439d79a2e8a31a85de69908ef87114ec9

core/agent_runtime/repeat_guard.py
  blob 37c24894cdbe7e647bdcbe45d055a1fd48b30777

core/agent_runtime/runner.py
  blob 645ab82f768214cce0794984c4bc9b92b099ce5a

core/harness/tools/spawn_agent.py
  blob 816db9e2deff8b85e309b94fbf934c2a48a92762

core/team/worktree.py
  blob 200be160e9c3d9e087ad5de345cfc0921e5c880b

core/harness/memory.py
  blob 52c3be1fc3b66a5d07ecd1407e71bb9704890c90
```

Other harness surfaces observed in the tree include permissions, policy, approval, sandbox, skills, hooks, agents, and collaboration modules. Their presence is not an authorization to port them.

---

## 12. DeepCode finding D1 — model-free tool-result middle pruning

`ToolResultPruner` is a small, high-leverage primitive.

Observed design:

- only oversized tool-result messages qualify;
- keep head + explicit marker + tail;
- validate that the replacement is itself under threshold;
- therefore a second pass converges/no-ops;
- no LLM call is needed;
- no hidden state is needed;
- the input collection is not mutated when producing a changed result;
- it is intended to run only under context pressure before model-based summarization.

This is especially attractive for Kodac because it can be ported as a pure deterministic transformation and tested exhaustively before any broader tool-pipeline changes.

Kodac-specific requirements:

- pruning must never mutate canonical H2 evidence in place;
- the model-visible next request must be reconstructable from canonical evidence;
- the original tool-result evidence should remain separately attributable if Kodac needs audit reconstruction;
- pruning markers/limits must be versioned and identity-bearing;
- secrets policy must run before deciding what historical content remains model-visible;
- no model call and no side effect is permitted in the pure pruning primitive.

Disposition:

```text
PRIMARY:
PORT

DIRECT PYTHON IMPORT:
NO — KODAC RUNTIME IS TYPESCRIPT AND THE PRIMITIVE IS SMALLER TO PORT CLEANLY

PRIORITY:
VERY HIGH

PROPOSED FOLLOW-ON GATE:
KDO-H5-R1 — MODEL-FREE TOOL-RESULT CONTEXT PRUNING
```

This is the recommended **first DeepCode-derived implementation slice**.

---

## 13. DeepCode finding D2 — repeat-call advisory loop breaker

`RepeatCallTracker` tracks consecutive identical tool calls by tool name + canonicalized arguments and emits escalating reminders at configured thresholds.

Important design strengths:

- advisory rather than hidden authority;
- deterministic canonicalization;
- repeated failed/denied calls still count;
- bounded model-visible argument preview while the full canonical value remains the identity key;
- a different call resets the chain.

Kodac should port the mechanism with one critical H2 requirement:

```text
IF THE MODEL SEES THE REMINDER,
THE REMINDER MUST EXIST IN CANONICAL MODEL-VISIBLE SESSION EVIDENCE.
```

The reminder must not be an invisible loop-local prompt that breaks replay/reconstruction.

It also must not become a policy gate. K2 remains responsible for authority; the repeat guard is an agent-efficiency signal.

Disposition:

```text
PRIMARY:
PORT

PRIORITY:
VERY HIGH AFTER H5-R1

PROPOSED FOLLOW-ON GATE:
KDO-H5-R2 — ADVISORY REPEAT-CALL LOOP GUARD
```

---

## 14. DeepCode finding D3 — runner/tool-pipeline composition

DeepCode's runner exposes mature compositional seams around an agent turn, including concepts such as:

- model/tool iteration limits;
- concurrent tool option;
- dynamic tool filtering;
- permission check/approval callback;
- pre/post tool hooks;
- permission-request hook;
- compaction hooks;
- model-free tool-result pruning;
- repeat-call reminders;
- stop hooks;
- context/injection handling;
- context-pressure summarization.

This validates the H3 conclusion that Kodac still benefits from a mature H5 turn/step + guarded-tool-pipeline plane.

However, DeepCode's generic Python callback/hook architecture must not be copied as a new authority layer.

Kodac H5 must enforce:

```text
HOOKS MAY OBSERVE OR NARROW.
HOOKS MAY NOT WIDEN K2 AUTHORITY.

TOOL REGISTRATION != EXECUTION GRANT
PRE-HOOK != POLICY OVERRIDE
POST-HOOK != EVIDENCE REWRITE
STOP-HOOK != DONE-GATE AUTHORITY
```

Any input rewrite must create a new/updated execution identity before K2 evaluates the resulting action.

Evidence-critical persistence failure must follow Kodac's stricter fail-closed rules rather than blindly inheriting a donor's best-effort logging choice.

Disposition:

```text
PRIMARY:
PORT SELECTED ARCHITECTURE / STUDY RUNNER AS A DESIGN MINE

WHOLE RUNNER IMPORT:
REJECT

PROPOSED FOLLOW-ON GATE:
KDO-H5-R3 — MONOTONIC GUARDED TOOL PIPELINE
```

---

## 15. DeepCode finding D4 — non-blocking subagent control

`spawn_agent.py` provides a mature orchestration surface:

```text
spawn_agent
wait_agent
list_agents
interrupt_agent
send_message
```

Observed valuable behavior includes:

- non-blocking child launch so multiple tasks can run concurrently;
- default isolated execution;
- optional inheritance of none/all/N prior turns;
- native child persona;
- tool allowlist that can narrow but not add capabilities;
- validation that named allowlist tools actually exist;
- optional object-root JSON Schema result contract;
- child status/list/wait controls;
- follow-up/redirect messages;
- prevention of recursive spawn-tool inheritance for spawned children;
- optional external Codex/Claude Code backends.

Kodac should adopt the **contract ideas**, not DeepCode's execution authority.

A Kodac subagent must bind:

```text
ParentSessionIdentity
ParentTurn/TaskIdentity
ChildAgentIdentity
AgentAttemptIdentity
ModelProfileIdentity
InheritedContextIdentity
ToolCapabilitySetIdentity
RepositorySnapshotIdentity
Workspace/WorktreeIdentity
Budget
Cancellation/Deadline
OutputSchemaIdentity
ChildEvidenceRoot
ResultIdentity
```

Tool inheritance must be monotonic:

```text
CHILD TOOLS ⊆ PARENT/EXPLICITLY AUTHORIZED TOOLS
```

and child side effects still route through K2.

Disposition:

```text
PRIMARY:
PORT

PRIORITY:
VERY HIGH

PROPOSED FOLLOW-ON GATE:
KDO-H6-R1 — SUBAGENT LIFECYCLE & EVIDENCE CONTRACT

SEQUENCING:
AFTER H5 CORE, NOT BEFORE
```

---

## 16. DeepCode finding D5 — isolated worktree workers and conflict-aware merge

`core/team/worktree.py` uses one real Git worktree/branch per worker, commits the worker independently, and merges back with Git's 3-way merge so overlapping changes surface as conflicts rather than silently clobbering another worker.

This is an excellent **team-agent isolation pattern**.

But the donor implementation calls Git through subprocess and directly mutates worktree/Git state. That authority model is not admissible as-is in Kodac.

Kodac target should preserve the architecture while routing every mutation through explicit K2 intents:

```text
create worktree
create/reset worker branch
stage bounded paths
commit worker result
merge worker branch
abort merge
remove worktree
remove branch
```

Future evidence should bind:

- base repository identity;
- worker base head;
- worktree identity/path scope;
- worker branch identity;
- changed-path set;
- commit identity;
- merge-base identity;
- merge result;
- conflict paths when present;
- cleanup result.

No worker should be able to modify another worker's worktree or the base by ambient filesystem/process authority.

Disposition:

```text
PRIMARY:
PORT

DIRECT IMPORT:
REJECT — DIRECT SUBPROCESS/GIT MUTATION BYPASSES K2

PROPOSED FOLLOW-ON GATE:
KDO-H6-R2 — ISOLATED WORKTREE WORKER & MERGE EVIDENCE

HARD DEPENDENCY:
K2 WORKSPACE-WRITE / GIT-MUTATION AUTHORITY MUST BE SEPARATELY PROVEN
```

Therefore H4-R2D or another explicit workspace-write confinement slice remains independent prerequisite work; DeepCode does not replace it.

---

## 17. DeepCode finding D6 — project instructions and persistent Markdown memory

DeepCode implements two useful ideas:

1. hierarchical project instruction discovery (`AGENTS.md`, `DEEPCODE.md`, `CLAUDE.md`) from repository root toward the active workspace plus user-level instruction files;
2. persistent Markdown memory under a workspace-local memory directory, with a small index file and read/write/list/append/delete operations.

The **read/context architecture** is useful to Kodac.

The **authority interpretation** must be different.

Kodac invariant:

```text
REPOSITORY INSTRUCTION FILE = UNTRUSTED MODEL CONTEXT
NOT GOVERNANCE
NOT POLICY
NOT APPROVAL
NOT K2 AUTHORITY
NOT DONE-GATE AUTHORITY
```

A future read-only context layer should:

- discover instruction/memory sources deterministically;
- bind each source to path + repository/content identity;
- cap injected bytes/tokens;
- make precedence explicit;
- label the source as user / repository / generated / learned;
- surface staleness;
- preserve prompt-injection boundaries;
- keep authority instructions in a separate non-overridable plane.

Writable memory is a different capability:

```text
MEMORY WRITE = SIDE EFFECT
```

and must route through K2 with workspace-write authorization/confinement.

Disposition:

```text
READ-ONLY INSTRUCTION/MEMORY DISCOVERY:
PORT

WRITABLE MEMORY TOOL:
DEFER UNTIL K2 WORKSPACE-WRITE BOUNDARY

PROPOSED LATER GATE:
KDO-C14 — PROVENANCE-BOUND PROJECT CONTEXT & MEMORY READER
```

---

## 18. DeepCode finding D7 — model-based context compaction

DeepCode's runner uses a two-stage context-pressure strategy:

```text
1. cheap deterministic tool-result pruning
2. only if still necessary: model-based semantic compaction
```

This ordering is strong and should be preserved.

Model-based compaction, however, is much higher risk than pure pruning because a summary can omit or distort previous context.

Kodac must never replace canonical H2 history with a summary as if the summary were historical truth.

The correct split is:

```text
CANONICAL SESSION EVIDENCE:
lossless/reconstructable authoritative model-visible history records

MODEL WORKING CONTEXT:
may use a derived compacted projection with explicit provenance
```

Any compacted projection should bind:

- source history interval identity;
- compaction algorithm/model identity;
- compaction request identity;
- resulting summary identity;
- retained verbatim context identity;
- token/byte reduction;
- reason/trigger;
- validation that compaction actually reduced context.

Disposition:

```text
PURE PRUNER:
H5-R1 FIRST

MODEL-BASED COMPACTION:
PORT LATER / SEPARATE AUTHORIZATION
```

---

## 19. DeepCode finding D8 — external Codex / Claude Code subagents

DeepCode supports external agent backends such as Codex CLI and Claude Code CLI.

This is strategically interesting but **not** an immediate Kodac import candidate.

Current Kodac H4-R2C does not prove all properties required for arbitrary external coding-agent execution, including at least:

- target executable byte identity/pinning;
- workspace-write confinement;
- credential isolation;
- network policy/isolation;
- child-agent write scope;
- external-agent protocol/result evidence;
- external-session lineage;
- safe merge authority.

Disposition:

```text
STUDY_ONLY / DEFER

DO NOT USE AS H6-R1 IMPLEMENTATION SHORTCUT
```

External agents may become backend adapters only after Kodac's own H6 contract and execution boundaries are proven.

---

## 20. DeepCode finding D9 — permissions / approval / sandbox stack

DeepCode contains its own permissions, approval, policy, and sandbox modules.

Kodac should **not** import those as its trust core.

Reason:

```text
KODAC K2/H4 IS ALREADY CANONICAL AUTHORITY.
```

Useful UX concepts or validation patterns may be studied, but no donor permission result may override K2 and no donor sandbox mode may count as observed enforcement evidence.

Disposition:

```text
DIRECT TRUST-STACK IMPORT:
REJECT

DESIGN STUDY FOR NON-AUTHORITY UX/ERGONOMICS:
ALLOWED UNDER KDO-P0
```

---

## 21. DeepCode whole-repository decision

```text
WHOLE REPOSITORY FORK INTO KODAC:
REJECTED AS CURRENT STRATEGY
```

Why:

- Python/runtime architecture differs from Kodac's TypeScript K2 runtime;
- substantial overlap with Kodac's already-canonical model/session/trust/reviewer systems;
- direct inheritance would create competing authority planes;
- the highest-value donor parts are small, separable primitives or subsystem architecture;
- Kodac should acquire the leverage without becoming a DeepCode derivative runtime.

Correct strategy:

```text
PORT SMALL PURE PRIMITIVES
PORT ORCHESTRATION CONTRACTS
REWRITE ALL SIDE-EFFECT PATHS THROUGH K2
PRESERVE H2/K3/KRI/DONE-GATE EVIDENCE MODEL
```

---

# Part III — Combined architecture and sequence

## 22. Capability synthesis

Greptile and DeepCode solve different halves of the Developer OS problem.

```text
GREPTILE
repository understanding
impact-aware review
review preferences
review configuration
cross-repo review context
PR conversation

DEEPCODE
long-horizon loop control
context pressure
subagents
parallel workers
worktree isolation
memory/instructions
agent composition
```

Kodac should normalize them into its existing architecture:

```text
                   ┌────────────────────────────┐
                   │       Kodac Surfaces       │
                   │ CLI / IDE / PR / Desktop   │
                   └─────────────┬──────────────┘
                                 │
                   ┌─────────────▼──────────────┐
                   │     H6 Agent Mesh          │
                   │ parent/child/workers/jobs  │
                   └─────────────┬──────────────┘
                                 │
                   ┌─────────────▼──────────────┐
                   │       H5 Agent Loop        │
                   │ prune / guard / pipeline   │
                   └─────────────┬──────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │                 KRI Reviewer Plane              │
        │ graph context / feedback memory / adjudication  │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │                   K3 Context                    │
        │ semantic graph / index / connectors / evidence  │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │              H2 Canonical Session               │
        │ exact model-visible reconstructability          │
        └────────────────────────┬────────────────────────┘
                                 │
        ┌────────────────────────▼────────────────────────┐
        │                K2 / H4 Trust                    │
        │ policy / approval / confinement / receipts      │
        └────────────────────────┬────────────────────────┘
                                 │
                   ┌─────────────▼──────────────┐
                   │         Done Gate          │
                   │       PROVEN_READY         │
                   └────────────────────────────┘
```

---

## 23. Proposed follow-on gate map

### Reviewer intelligence track

```text
KRI-R5
GRAPH-AWARE REPOSITORY REVIEW CONTEXT
Donor inspiration: Greptile product architecture
Authority: read-only context/evidence only

KRI-R6
REVIEWER PREFERENCE MEMORY & FEEDBACK ADAPTATION
Donor inspiration: Greptile memory/learning
Authority: ranking/preferences only; never adjudication/policy truth
```

### Agent harness track

```text
KDO-H5-R1
MODEL-FREE TOOL-RESULT CONTEXT PRUNING
Donor source: HKUDS/DeepCode core/agent_runtime/pruner.py
Pure deterministic port

KDO-H5-R2
ADVISORY REPEAT-CALL LOOP GUARD
Donor source: HKUDS/DeepCode core/agent_runtime/repeat_guard.py
Model-visible reminder must be canonical H2 evidence

KDO-H5-R3
MONOTONIC GUARDED TOOL PIPELINE
Donor sources/design: DeepCode runner + prior H3 donor evidence
No hook may widen K2 authority

KDO-H6-R1
SUBAGENT LIFECYCLE & EVIDENCE CONTRACT
Donor source: DeepCode spawn-agent control architecture
No workspace writes required for contract-first slice

KDO-H6-R2
ISOLATED WORKTREE WORKER & MERGE EVIDENCE
Donor source: DeepCode team/worktree architecture
Requires separately proven K2 workspace-write/Git authority
```

### Context/memory track

```text
KDO-C14
PROVENANCE-BOUND PROJECT CONTEXT & MEMORY READER
Donor inspiration: DeepCode memory/instruction discovery
Read-only first; no memory write authority
```

---

## 24. Required sequencing

The preferred sequence is:

```text
1. H5-R1  pure context pruning
2. H5-R2  advisory repeat-call loop guard
3. KRI-R5 graph-aware review context        [may proceed in parallel planning]
4. H5-R3  monotonic guarded tool pipeline
5. KRI-R6 reviewer preference memory
6. H6-R1  subagent lifecycle/evidence contract
7. H4 workspace-write/Git mutation proof as separately authorized work
8. H6-R2  isolated worktree workers + merge
9. model-based compaction / writable memory / external-agent backends later
```

Why H5 before H6:

- child agents amplify loop defects;
- child agents amplify tool/policy defects;
- parent/child evidence depends on canonical turn/tool semantics;
- Kodac's H3 roadmap already identified H5 as the prerequisite for H6.

Why H4 workspace-write remains separate:

- worktree creation/commit/merge is side-effect authority;
- writable memory is side-effect authority;
- child coding agents require scoped mutation authority;
- a donor orchestration feature cannot grant that authority itself.

---

## 25. What Kodac can become better at than both donors

The combined target is not feature parity.

Kodac can make these capabilities stronger by composing them with evidence/authority guarantees the donors are not being treated as providing:

```text
GREPTILE-LIKE GRAPH REVIEW
+
exact repository/content provenance
+
KRI claim/adjudication separation
+
reviewer qualification

DEEPCODE-LIKE SUBAGENTS
+
H2 reconstructable model-visible history
+
monotonic child capability inheritance
+
K2 side-effect authority
+
H4 observed confinement evidence
+
Done Gate completion proof
```

The target product property is:

```text
MORE CONTEXT
MORE AUTONOMY
MORE PARALLELISM
WITHOUT LESS TRUTH OR LESS CONTROL
```

---

## 26. Explicit rejections / non-grants

This audit does **not** authorize:

- copying Greptile's hosted backend or claiming source equivalence;
- executing Greptile or DeepCode donor code;
- importing DeepCode wholesale;
- replacing K2 policy/approval/confinement with DeepCode's stack;
- treating repository instructions as trusted governance;
- treating learned reviewer preferences as correctness truth;
- treating a reviewer finding as adjudicated truth;
- adding hidden model-visible prompts outside H2 canonical evidence;
- model-based compaction that destroys canonical history;
- subagents before an H6 authorization;
- background agent execution before H6 authorization;
- direct Git/worktree subprocess mutation outside K2;
- workspace-write authority from this audit;
- external Codex/Claude Code agent execution from this audit;
- credential/network isolation claims;
- H4 completion;
- H5 completion;
- H6 completion;
- universal sandbox claims;
- Done Gate replacement.

---

## 27. Immediate recommendation

The best immediate DeepCode-derived production authorization candidate is:

```text
KDO-H5-R1 — MODEL-FREE TOOL-RESULT CONTEXT PRUNING
```

Reason:

- pure;
- deterministic;
- small;
- no dependency required;
- no network/process/filesystem authority;
- improves long-session economics immediately;
- creates a safe first H5 slice before guarded pipelines/subagents.

In parallel, the best Greptile-derived design authorization candidate is:

```text
KRI-R5 — GRAPH-AWARE REPOSITORY REVIEW CONTEXT
```

It should be contract/evidence-first and read-only, using Kodac's canonical semantic/index/context systems rather than creating a second review database.

---

## 28. Audit closure truth

```text
GREPTILE HOSTED PRODUCT BEHAVIOR:
AUDITED AS PUBLIC BEHAVIOR/DOCUMENTATION
NO SOURCE-EQUIVALENCE CLAIM

GREPTILE PUBLIC VS CODE SOURCE:
PINNED / MIT / STUDY_ONLY

HKUDS/DEEPCODE SOURCE:
PINNED AT 287510fbf6820147a48adf79f7fd86b0ed1afe92
MIT RIGHTS SIGNAL OBSERVED

DEEPCODE HIGH-VALUE COMPONENTS:
CLASSIFIED

WHOLE-REPOSITORY IMPORT:
REJECTED

DONOR EXECUTION:
NONE

KODAC PRODUCTION SOURCE IMPORT:
NONE

PROPOSED NEXT IMPLEMENTATION GATE:
KDO-H5-R1

PROPOSED PARALLEL REVIEW-INTELLIGENCE GATE:
KRI-R5

STATUS:
SECOND_WAVE_GREPTILE_DEEPCODE_AUDIT_READY_FOR_CANONICAL_REVIEW
```
