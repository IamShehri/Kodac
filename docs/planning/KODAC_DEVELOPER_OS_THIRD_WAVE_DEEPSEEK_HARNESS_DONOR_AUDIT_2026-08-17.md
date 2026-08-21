# Kodac Developer OS — Third-Wave DeepSeek Harness Donor Audit

Date: 2026-08-17
Status: AUDIT CANDIDATE — DOCS ONLY

## 1. Decision

```text
DECISION:
THIRD_WAVE_DEEPSEEK_HARNESS_AUDIT_READY_FOR_CANONICAL_REVIEW

CANONICAL KODAC BASE:
61ffbfe4613a4dd05685909999c395a92a581df6

CANONICAL KODAC BASE TREE:
1ccc3a6b282caa1e2a2689822745bdcf6e15e29a

PROGRAM AUTHORITY:
KDO-P0 — Developer OS Donor Intake & Capability Superset Authorization

PRODUCTION DONOR IMPORT:
NOT AUTHORIZED BY THIS AUDIT

DONOR EXECUTION:
NOT PERFORMED

DONOR INSTALL / BUILD / TEST:
NOT PERFORMED
```

DeepSeek Harness is accepted as a **very-high-value third-wave architecture and component donor for Kodac's future agent-runtime, orchestration, durability, tool-runtime, and deterministic-evaluation layers**.

It is **not** accepted as a replacement for Kodac K2, K3, KRI, the Done Gate, or the current H4 physical evidence architecture.

The governing invariant remains:

```text
DONOR CAPABILITY MAY BE ACQUIRED.
DONOR AUTHORITY IS NEVER INHERITED.
```

The primary disposition is:

```text
WHOLE REPOSITORY:
STUDY_ONLY / DO NOT WHOLESALE-FORK INTO KODAC

SELECTED RUNTIME CONTRACTS AND SUBSYSTEMS:
PORT / BEHAVIORAL_REIMPLEMENTATION / SELECTIVE DIRECT-IMPORT CANDIDATES
SUBJECT TO SEPARATE COMPONENT AUTHORIZATION
```

---

## 2. Immutable upstream pin and rights evidence

```text
Repository:
deepseek-ai/deepseek-harness

Default branch observed:
master

Pinned source commit:
47f943859bef60e4160492346772ded9b24f765a

Pinned source tree:
f904efab9ef435201d6ba4da88a34d6366568272

Pinned release-family root version:
0.1.0-rc.5

Repository/root package license signal:
MIT
```

Representative pinned evidence:

```text
README.md
blob: 8a4bd01332a23ce4144c661784bc549e0ba72d21

LICENSE
blob: c1f7a78e89e4e4dc7b86664c3b3c76eb5eee1785

package.json
blob: 81cedbbb420e824b6d41312c5a7abb8720861e54

docs/architecture.md
blob: 77000ce9d4608d440e1d903eb80a42f2ed6435ef

packages/subagent/README.md
blob: a863ed3f5ef864b6eb6eb9a7a0c1ee2f40f247d6

packages/guard/repeat-tool-reminder/src/index.ts
blob: dc7ad528341d8a4decd0bf4d33991e7bc377ba8d

packages/guard/timeout-policy/src/index.ts
blob: c79ae49ca41315e3c946e350e76e39db20e556b2

packages/util/timeout/src/index.ts
blob: 3fc4d2387bd93a7deaff3da4d6506515e17d6ff2

packages/subprocess/README.md
blob: 72a30775f45a8140935a013c63e9427e9cbd94d6

packages/sandbox/README.md
blob: 61127118c895cce728ab0b4eed387f51054a83f1

packages/session/README.md
blob: 2680bc3c6aea519427da2f31ab2526b5115cac96

packages/session-query/README.md
blob: b955a7f6e19f5a49e48e564523cc343e32816dd2

packages/spill/README.md
blob: 74fd4837cb23767754174df168f2f4ba71c2b938

packages/test-support/README.md
blob: 8f07d08828c2f4d69676487842373b600037e199
```

The upstream README explicitly labels Harness a **developer preview** and warns that compatibility-breaking changes are expected. Therefore no Kodac production interface may bind to mutable Harness package behavior without an exact component pin and compatibility gate.

### 2.1 Third-party boundary

The root repository is MIT, but the workspace contains a mixed dependency and payload closure. Its generated third-party notices distinguish:

- MIT-vendored Cordis/foundation packages with upstream commit tracking;
- Apache-2.0, MIT, BSD, ISC and other runtime dependencies;
- an official Claude Agent SDK / Claude Code payload family carrying its own declared terms;
- `@openai/codex` as a development dependency under Apache-2.0;
- patched dependencies such as `node-pty`;
- separate npm and Python lockfile closures.

Therefore:

```text
ROOT MIT LICENSE
!=
AUTOMATIC COMPONENT IMPORT QUALIFICATION
```

Every proposed direct import must bind its own source subtree, transitive runtime closure, notices, copied expression, and provider-specific terms.

---

## 3. Safety boundary used for this audit

This audit used source/document inspection only.

```text
NO pnpm install
NO npm install
NO postinstall execution
NO build
NO tests
NO dsh CLI execution
NO plugins loaded
NO model calls
NO subagent execution
NO MCP execution
NO Codex execution
NO Claude Code execution
NO sandbox launcher execution
NO donor network client execution
NO credentials
NO donor-generated patch execution
```

Harness AGENTS files, prompts, plugin configuration, workflow definitions, model instructions, hooks, package scripts, and runtime policies were treated as untrusted engineering evidence only.

---

## 4. Architecture finding — reversible capability composition

Harness is built on Cordis and treats the product as a shared context of services, typed events, plugins, and reversible effects. Its architecture states that the model adapter, tool registry, session log, and agent loop are all replaceable plugins rather than a permanently privileged monolith.

The useful lesson for Kodac is not "replace Kodac with Cordis." It is:

```text
CAPABILITY CONTRACT
    ↓
ONE OR MORE PROVIDERS
    ↓
CONSUMERS DEPEND ON THE CONTRACT
    ↓
LIFECYCLE / REGISTRATION IS REVERSIBLE
```

This is strongly aligned with the Founder requirement that Kodac must not become a provider bottleneck.

Disposition:

```text
CORDIS WHOLESALE RUNTIME ADOPTION:
STUDY_ONLY

SERVICE DEFINITION / PROVIDER / CONSUMER SEAMS:
PORT ARCHITECTURAL PATTERN — VERY HIGH PRIORITY

REVERSIBLE PLUGIN EFFECT LIFECYCLE:
PORT / SELECTIVE REIMPLEMENTATION CANDIDATE
```

Required Kodac hardening:

- K2 remains sole side-effect authority;
- providers never inherit execution authority from registration;
- capability registration must be provenance-bound;
- unload/reload must not lose durable evidence truth;
- dynamic plugins cannot mutate governance or completion authority;
- plugin failures must not silently bypass required verification lanes.

---

## 5. Architecture finding — model-visible means reconstructable

Harness's session/event architecture uses an append-only log and treats model-visible state as reconstructable durable history rather than hidden mutable prompt state.

This is one of the strongest donor concepts for Kodac because it composes naturally with H2/K3/KRI evidence requirements.

Target Kodac principle:

```text
IF THE MODEL SAW IT,
KODAC MUST BE ABLE TO RECONSTRUCT WHAT IT SAW,
WHY IT SAW IT,
WHERE IT CAME FROM,
AND WHICH EXACT RUN CONSUMED IT.
```

Disposition:

```text
APPEND-ONLY SESSION / TRAJECTORY FACT LOG:
PORT — VERY HIGH PRIORITY

MODEL-VISIBLE RECONSTRUCTION INVARIANT:
ADOPT AS KODAC-NATIVE EVIDENCE RULE
```

Kodac should extend the idea beyond chat replay to include:

- repository/content identities;
- reviewer/model/provider identities;
- tool-call identities and canonical arguments;
- K2 execution receipts;
- evidence retrieval provenance;
- pruning/spill transformations;
- agent delegation ancestry;
- adjudication outcomes;
- developer accept/reject/fix outcomes;
- later regression evidence.

This becomes a foundation for future reviewer calibration and self-improvement without self-authorization.

---

## 6. Subagent finding — provider-neutral delegation and continuations

Harness's `subagent/` family exposes multiple named child-agent providers through one capability seam, including:

- fresh in-process children;
- forked in-process children;
- ACP children;
- Codex app-server children;
- Claude Code children;
- Harness SDK children.

The high-value contract lessons are:

```text
MULTIPLE PROVIDERS MAY COEXIST
UNSUPPORTED CAPABILITY FAILS BEFORE START
ONE CANCELLATION CHANNEL
EXPLICIT CHILD OWNERSHIP
EXPLICIT REPORT CHANNEL
CONTINUATION IS A DURABLE LIFECYCLE, NOT A PROMPT TRICK
```

Disposition:

```text
SUBAGENT SERVICE SHAPE:
PORT / BEHAVIORAL_REIMPLEMENTATION — VERY HIGH PRIORITY

PROVIDER-SPECIFIC CODEX / CLAUDE ADAPTERS:
PORT OR BEHAVIORAL_REIMPLEMENTATION AFTER COMPONENT RIGHTS + PROTOCOL AUDIT

FRESH-PROCESS-PER-RUN AS PERMANENT TIMES/KODAC ARCHITECTURE:
REJECT
```

Kodac should support provider-neutral agent workers but go further with:

- reusable worker pools;
- local/self-hosted providers;
- BYOK/BYOM;
- distributed workers and work stealing;
- reviewer-specialist swarms;
- structured evidence return, not final text only;
- exact tool/evidence provenance from children;
- deterministic budget and cancellation accounting;
- K2-gated side effects from every child regardless of provider.

---

## 7. Tool-runtime finding — repeat-call signal

Harness's repeat-tool reminder tracks exact consecutive tool+argument repetitions per agent, canonicalizes argument objects, supports configurable thresholds, treats excluded tools as transparent to the chain, resets on user interjection, and emits a bounded model-visible reminder while retaining the full canonical argument identity for detection.

Kodac already has a stronger H5-R2A deterministic repeat-call evidence primitive with:

- JCS-compatible canonicalization behavior;
- explicit call/state/signal identities;
- strict JSON parsing and duplicate-key rejection;
- bounded hostile-input handling;
- evidence-safe advisory signals;
- explicit donor provenance.

Therefore Harness should **not replace H5-R2A**.

Its additional value is as a differential semantics reference for:

- per-agent chain ownership;
- transparent include/exclude policy;
- counting denied calls;
- user-interjection reset semantics;
- logging the reminder as model-visible context rather than mutating hidden state.

Disposition:

```text
REPEAT-CALL CORE:
REFERENCE / DIFFERENTIAL TEST DONOR

MODEL-VISIBLE REMINDER INTEGRATION:
PORT CANDIDATE INTO KODAC H5 PIPELINE
```

---

## 8. Tool-runtime finding — cancellation and timeout taxonomy

Harness's timeout policy does not use a naive `Promise.race()` that abandons work. It derives a deadline signal, delegates the call, waits for the capability to quiesce, then maps the timeout to a structured result only when its own deadline reason won.

Its timeout utility also gives deadlines capability-owned codes so nested timeouts can distinguish:

```text
MY DEADLINE WON
vs
UPSTREAM CANCELLATION WON
vs
A DIFFERENT NESTED DEADLINE WON
```

This is highly relevant to Kodac's current lifecycle work but does **not** supersede H4's stronger physical-process requirements.

Disposition:

```text
SCOPED TIMEOUT-REASON TAXONOMY:
PORT — HIGH PRIORITY

WAIT-FOR-QUIESCENCE BEFORE PUBLIC TIMEOUT RESULT:
ADOPT AS GENERAL RUNTIME RULE

HARNESS TIMEOUT IMPLEMENTATION AS H4 REPLACEMENT:
REJECT
```

Kodac's stronger invariant remains:

```text
TIMEOUT / CANCEL
-> STOP AUTHORIZED WORK
-> TERMINATE IF REQUIRED
-> REAP / JOIN
-> PROVE NO LATE COMPLETION CAN UPGRADE FAILURE
-> ONLY THEN RETURN FINAL OUTCOME
```

---

## 9. Subprocess finding — managed process-tree ownership

Harness centralizes subprocess lifetime in a shared substrate and describes detached process trees, bounded output collection/spill, tree signalling, and terminate-and-join disposal.

This is a useful design reference for future Kodac provider runners and CLI-agent bridges.

Disposition:

```text
PROCESS OWNERSHIP / TREE JOIN CONTRACT:
PORT / TEST-DONOR — HIGH PRIORITY

DIRECT REPLACEMENT OF K2 EXECUTION GATEWAY:
REJECT
```

Every Kodac process provider must still route trusted side effects through K2 and bind process identity/evidence under the applicable H4 theorem.

---

## 10. Sandbox finding — useful implementation reference, wrong authority level

Harness's sandbox family applies per-session same-world process confinement and explicitly separates same-world confinement from fully isolated environments. It provides local backends and shared enforcement vocabulary.

This is valuable implementation evidence, especially for platform coverage and fail-closed policy design.

However:

```text
HARNESS SANDBOX POLICY
!=
KODAC OBSERVED PHYSICAL CONFINEMENT EVIDENCE
```

Disposition:

```text
SANDBOX BACKEND TECHNIQUES:
STUDY_ONLY / SELECTIVE PORT CANDIDATES

SANDBOX SERVICE CONTRACT:
REFERENCE

REPLACE K2/H4 WITH HARNESS SANDBOX:
REJECT
```

K2 remains the only side-effect authority; H4 must continue proving the actual runtime/confinement properties Kodac claims.

---

## 11. Background jobs and workflows

Harness separates background job observation/cancellation from workflow orchestration, and its workflow subsystem can delegate work through subagents.

Useful lessons:

- owner-isolated jobs;
- explicit cancel/wait/completion surfaces;
- background execution should remain observable;
- workflow logic should compose providers rather than hard-code one model;
- worker threads are an execution mechanism, not a security boundary.

Disposition:

```text
JOB REGISTRY / COMPLETION MODEL:
PORT — HIGH PRIORITY

WORKFLOW ENGINE CONTRACT:
PORT / BEHAVIORAL REIMPLEMENTATION

WORKER THREAD AS TRUST BOUNDARY:
REJECT
```

Kodac should eventually extend this to distributed review swarms and work stealing without artificial product-imposed queues or review exhaustion.

---

## 12. Session persistence, query, and future memory

Harness separates live session state, persistence, projection, and session query. Its session-query family supports authorized retrieval over live/durable logs independently of compaction, including SQLite full-text search.

This maps directly to a future Kodac evidence/memory plane.

Disposition:

```text
SESSION PERSISTENCE SEAM:
PORT — HIGH PRIORITY

LOG-DERIVED PROJECTIONS:
PORT — HIGH PRIORITY

AUTHORIZED SESSION QUERY:
PORT — VERY HIGH PRIORITY

SQLITE FTS BACKEND:
SELECTIVE DIRECT-IMPORT / PORT CANDIDATE AFTER COMPONENT AUDIT
```

Kodac should ultimately combine this with repository semantic memory, episodic review memory, procedural memory, and shared evidence memory while keeping canonical repository/evidence identities authoritative over learned summaries.

---

## 13. Spill finding — no artificial limits without context explosion

Harness persists oversized tool output outside the inline result and returns a bounded preview plus retrieval locator.

This is directly compatible with Kodac's requirement to avoid artificial product limits while still protecting model context and runtime memory.

Target principle:

```text
DO NOT DISCARD BECAUSE CONTEXT IS SMALL.
PERSIST THE FULL EVIDENCE.
BOUND ONLY THE MODEL-VISIBLE PROJECTION.
MAKE THE FULL VALUE RETRIEVABLE BY IDENTITY.
```

Kodac H5-R1A already provides deterministic model-visible pruning. Harness spill is complementary rather than substitutive:

```text
H5-R1A
bounded model-visible projection
+
future spill store
full retained evidence + locator
```

Disposition:

```text
SPILL CONTRACT:
PORT — VERY HIGH PRIORITY

LOCAL FILE BACKEND:
PORT / SELECTIVE IMPORT CANDIDATE
```

---

## 14. Human interaction and approvals

Harness provides explicit interaction and approval seams rather than embedding every human decision in the agent loop.

This is a useful UI/runtime separation pattern.

Disposition:

```text
INTERACTION SERVICE SEAM:
PORT / REIMPLEMENT

HARNESS APPROVAL AS K2 AUTHORITY:
REJECT

HARNESS APPROVAL AS DONE-GATE AUTHORITY:
REJECT
```

Kodac may consume human approval as evidence, but existing K2 and Done Gate authority must remain explicit and non-inheritable.

---

## 15. Dynamic extensions — high leverage, high risk

Harness includes extension mechanisms capable of runtime introspection and dynamic plugin mounting, including model-facing dynamic extension behavior.

This is a powerful research direction but conflicts with Kodac's trust boundary if admitted naively.

Kodac principle:

```text
SELF-IMPROVING
!=
SELF-AUTHORIZING
```

Disposition:

```text
MODEL-WRITTEN / MODEL-MOUNTED RUNTIME EXTENSIONS:
STUDY_ONLY

UNSUPERVISED AUTHORITY EXPANSION:
REJECT
```

Any future self-improvement laboratory must generate proposals, tests, benchmarks, or candidate strategies without granting itself new K2 privileges, new trust roots, or the ability to redefine completion criteria.

---

## 16. Test-support finding — deterministic fault and replay infrastructure

Harness's test-support family includes:

- deterministic OpenAI-compatible fault server;
- recorded LLM replay for keyless tests and demos;
- agent-loop testkit;
- runtime invariant checks;
- loader smoke infrastructure.

This is one of the highest-return donor areas because Kodac needs reproducible reviewer/provider evaluation independent of live API nondeterminism.

Disposition:

```text
FAULT SERVER:
PORT / SELECTIVE IMPORT CANDIDATE — VERY HIGH PRIORITY

LLM REPLAY:
PORT — VERY HIGH PRIORITY

AGENT LOOP TESTKIT / RUNTIME INVARIANTS:
PORT / ADAPT
```

Future Kodac evaluation should be able to replay an exact model/provider/tool trajectory while proving which bytes were fixture-derived versus live-provider-derived.

---

## 17. What Kodac already does better

Harness is an excellent general agent-runtime donor. Kodac must not mistake that for product equivalence.

Kodac's differentiating trust layer should remain stronger in at least these areas:

```text
K2
sole trusted side-effect authority

H4
physical runtime/confinement/source/evidence theorems

K3
repository/context provenance and freshness

KRI
reviewer qualification, evidence, finding lifecycle, adjudication

Done Gate
sole PROVEN_READY authority

H5 deterministic evidence primitives
bounded pruning, repeat-call state/signal identity,
reconstruction and guard integration
```

Harness should help Kodac become a stronger runtime for many agents and providers; it must not reduce Kodac to a generic agent harness.

---

## 18. Recommended acquisition matrix

```text
A. Cordis service/provider/consumer pattern
   PORT ARCHITECTURE
   priority: VERY HIGH

B. append-only model-visible session/event reconstruction
   PORT + KODAC-NATIVE HARDENING
   priority: VERY HIGH

C. provider-neutral subagent seam + continuations
   PORT / REIMPLEMENT
   priority: VERY HIGH

D. Codex / Claude / ACP child adapters
   PORT / BEHAVIORAL REIMPLEMENTATION
   priority: HIGH

E. repeat-tool reminder integration semantics
   REFERENCE / DIFFERENTIAL TEST DONOR
   priority: MEDIUM-HIGH

F. scoped timeout reason + quiescence-before-result
   PORT
   priority: HIGH

G. managed process-tree lifecycle
   PORT / TEST DONOR
   priority: HIGH

H. background jobs
   PORT
   priority: HIGH

I. workflow orchestration
   PORT / REIMPLEMENT
   priority: HIGH

J. session persistence + authorized query
   PORT
   priority: VERY HIGH

K. oversized-output spill + retrieval locator
   PORT
   priority: VERY HIGH

L. deterministic LLM fault server + replay
   PORT / SELECTIVE IMPORT
   priority: VERY HIGH

M. same-world sandbox backends
   STUDY / SELECTIVE PORT
   priority: MEDIUM

N. dynamic model-written extensions
   STUDY_ONLY
   priority: DEFER
```

---

## 19. Proposed Kodac-native target composition

```text
                    KODAC / TIMES

Repository / PR / Workspace
          |
          v
  Evidence + Context Plane
  - K3 exact repo truth
  - append-only trajectory log
  - model-visible reconstruction
  - spill + retrieval identities
  - session/evidence query
          |
          v
  Agent Runtime Plane
  - provider registry
  - child ownership forest
  - continuations
  - background jobs
  - workflows / swarms
  - Codex / Claude / local / BYOM providers
          |
          v
  Tool Runtime Plane
  - pre/execute/post guard pipeline
  - H5 pruning
  - H5 repeat-call evidence
  - timeout/cancel reason taxonomy
  - structured outputs
          |
          v
  TRUST PLANE — KODAC NATIVE, NOT DONOR-OWNED
  - K2 side-effect authority
  - H4 confinement/runtime/source evidence
  - KRI reviewer qualification/adjudication
  - Done Gate
          |
          v
  Evaluation + Improvement Plane
  - deterministic fault servers
  - LLM replay
  - trajectory/outcome ledger
  - reviewer calibration
  - strategy evaluation
  - self-improvement proposals
    WITHOUT self-authorization
```

---

## 20. Follow-on gate recommendations

This audit authorizes **no production code import**.

The next admissible work should be separate component gates, not a monolithic Harness integration.

Recommended order:

```text
1. HARNESS TEST-SUPPORT INTAKE GATE
   deterministic fault server + LLM replay

2. HARNESS SPILL / RETRIEVAL GATE
   full evidence retention + bounded model projection

3. HARNESS TIMEOUT / CANCELLATION SEMANTICS GATE
   scoped timeout causes + quiescence invariant

4. PROVIDER-NEUTRAL SUBAGENT CONTRACT GATE
   provider registry + ownership + continuation + report channel

5. CODEX / CLAUDE CHILD PROVIDER GATES
   separately pinned, separately rights-audited

6. SESSION / TRAJECTORY DURABILITY AND QUERY GATE
   append-only facts + authorized retrieval

7. BACKGROUND JOB / WORKFLOW GATE
   after the child-agent contract is stable
```

Each gate must state explicitly:

- exact donor files and blobs;
- intake mode;
- copied versus rewritten expression;
- dependency/rights closure;
- authority boundary;
- fail-closed behavior;
- deterministic tests;
- platform support;
- rollback/removal behavior;
- protected Kodac surfaces that must remain byte-identical where required.

---

## 21. Final decision

```text
DEEPSEEK_HARNESS_DONOR_VALUE:
VERY_HIGH

WHOLESALE_FORK:
REJECTED

PRODUCTION_IMPORT_FROM_THIS AUDIT:
NOT_AUTHORIZED

PRIMARY VALUE:
AGENT RUNTIME + PLUGIN SEAMS + SUBAGENTS +
DURABLE SESSION/EVIDENCE LOG + JOBS + SPILL +
TIMEOUT/CANCELLATION + DETERMINISTIC TEST SUPPORT

MUST NOT REPLACE:
K2 / H4 / K3 / KRI / DONE GATE

NEXT ACTION:
CANONICAL REVIEW OF THIS DOCS-ONLY AUDIT,
THEN SEPARATE COMPONENT IMPORT AUTHORIZATIONS.
```

DeepSeek Harness is one of the strongest current OSS donors for the runtime underneath the Kodac/Times product direction. The correct acquisition strategy is to take its best composability, child-agent, durability, lifecycle, and testability ideas while preserving Kodac's stronger evidence and trust model.
