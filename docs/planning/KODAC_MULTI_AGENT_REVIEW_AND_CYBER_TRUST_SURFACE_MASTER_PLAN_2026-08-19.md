# Kodac Multi-Agent Review and Cyber Trust Surface — Master Architecture Plan

Status: **CANONICAL_REVIEW_CANDIDATE / PLANNING ONLY / NO IMPLEMENTATION AUTHORIZATION**  
Date: 2026-08-19  
Canonical base commit: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Canonical base tree: `fc6ab0bb978918a3ad07070f79eaee4f3f4417a4`  
Repository: `TheHalfMoon/Kodac`

## 0. Authority and scope

This document reconciles:

- live Kodac repository truth at the exact base above;
- the independent Claude architecture report **The Kodac Trust Surface**;
- the independent GLM **Kodac Cyber Mesh** architecture review;
- current research on multi-agent review, code intelligence, program analysis, sandboxing, vulnerability discovery, falsification, fuzzing, evidence interchange, and review benchmarks.

Repository truth and accepted ADRs override both model reports. External projects are evidence and donor candidates, not authority.

This document does **not**:

- start H4-R3G-F or any later H4 task;
- modify runtime behavior, K2, KRI, Done Gate, policy, sandboxing, or CI semantics;
- authorize source-code intake from any donor;
- authorize a Review Pack ecosystem;
- authorize a Cyber implementation;
- authorize a blocking review gate;
- authorize a merge of this planning candidate.

Every implementation phase below requires a separate authorization, exact-base verification, bounded change surface, tests, evidence, and normal repository governance.

A standing repository hazard is confirmed: `docs/architecture/ARCHITECTURE.md` still describes legacy Kernux architecture. Phase 0 must retire or replace that content before implementation work relies on the path. This planning PR does not repair it.

---

# 1. Executive decision

Kodac should make the multi-agent review shift, but **multi-agent review is not the moat**.

The market already contains specialist reviewers, repository graphs, repository-local rules, feedback memory, static-analyzer ensembles, and AI-assisted fixes. Those capabilities are required for competitive discovery, but none is sufficient differentiation.

Kodac's defensible position is:

> **Kodac is the trust surface between a software change and permission to ship it.**

The product should combine:

1. a wide, replaceable, model-agnostic discovery surface;
2. a narrow, closed technical-validation surface;
3. bounded execution under K2 authority;
4. append-only, exact-head-bound evidence and adjudication;
5. class-specific review policy;
6. a machine-consumable verdict that CI, merge queues, auditors, IDEs, and other coding agents can consume.

The compact architecture principle is:

```text
Agents discover.
Tools establish technical facts.
Falsifiers try to destroy weak claims.
Validators independently verify artifacts.
Kodac adjudicates.
K2 controls authority and execution.
Done Gate emits the applicable verdict.
```

This preserves ADR-0001:

```text
DONE != model assertion
DONE = evidence-backed completion
```

and ADR-0010: no superiority claim without reproducible evidence.

---

# 2. Reconciliation: Claude × GLM × live Kodac

## 2.1 Accepted

The following conclusions are accepted:

- discovery should be widely extensible;
- validation, adjudication, blocking policy, and Done Gate authority must remain closed;
- models, agents, packs, MCP servers, context providers, and analyzers never grant themselves authority;
- repository content is untrusted data, including PR titles, descriptions, commit messages, comments, `AGENTS.md`, model instruction files, build files, tests, tool metadata, and generated artifacts;
- review policy and instruction-bearing configuration must resolve from the trusted base revision or trusted organization configuration, never from attacker-controlled PR-head content;
- findings remain exact-head-bound and become stale when the reviewed head moves;
- Review Director routing should be deterministic or deterministically explainable and replayable;
- context must be specialty-scoped rather than dumping the whole repository into every model;
- model confidence is never proof;
- no majority vote or confidence aggregation may raise technical evidence;
- external review and cyber benchmarks are mandatory before public superiority claims;
- the existing K2/H4 confinement stack is an architectural asset and must be exploited rather than bypassed.

## 2.2 Modified: technical evidence vs corroboration

The Claude proposal included `CORROBORATED` in a technical-evidence ladder while also stating that only deterministic validators may raise evidence. Those ideas conflict.

This plan separates them.

### Technical evidence level

```text
UNVALIDATED
→ ANALYZED
→ REACHABLE
→ REPRODUCED
```

Only a closed trusted validator may advance this field, and every transition requires a digest-bound artifact or analyzer result plus execution/provenance identity where applicable.

Semantics:

- `UNVALIDATED`: a candidate claim exists, but no trusted technical validation has established it.
- `ANALYZED`: deterministic or independently checkable analysis supports the claim.
- `REACHABLE`: an independently checkable path establishes that the relevant source/state can reach the claimed security-sensitive behavior under the modeled assumptions.
- `REPRODUCED`: the claimed vulnerable behavior was deterministically demonstrated against the exact reviewed software state under bounded execution and successfully replayed by an independent validator.

### Corroboration

Corroboration is recorded separately:

```text
NONE
SAME_MODEL
DIFFERENT_MODEL
DIFFERENT_FAMILY
DIFFERENT_PROVIDER
DIFFERENT_METHOD
```

A second model agreeing with a finding may improve triage confidence, but **does not advance `technicalEvidenceLevel`**.

`DIFFERENT_METHOD` is generally stronger than additional model agreement. Example:

```text
GLM hypothesis
+ SCIP symbol confirmation
+ Joern source→sink path
+ bounded regression reproducer
```

is materially stronger than three language models agreeing.

## 2.3 Modified: `REPRODUCED`

`REPRODUCED` is reserved for demonstrated vulnerable behavior. It is not a synonym for “detector matched.”

Therefore:

- an SBOM/advisory version match is not automatically `REPRODUCED`;
- a vulnerable dependency that is present but unreachable is not proven exploitable;
- a secret-pattern match is not automatically a live secret;
- default credential-liveness probing is rejected because it creates network, secret-handling, and side-effect risk;
- a static taint path may reach `REACHABLE`, but does not become `REPRODUCED` until a bounded exact-state reproducer demonstrates the behavior;
- business-logic and authorization findings may never be mechanically reproducible and must not be treated as inferior merely because their evidence ceiling differs.

## 2.4 Modified: Cyber sequencing

Full CPG/fuzzing depth remains late and risk-gated, but Cyber foundations must appear earlier than the original Phase 7-only treatment.

Move earlier:

- malicious-repository/instruction-injection defenses;
- SARIF ingestion;
- deterministic dependency/SBOM checks;
- deterministic secret detection;
- security finding schema and evidence semantics;
- cyber benchmark hooks.

Keep late/risk-gated:

- always expensive CPG analysis;
- targeted fuzzing;
- reproducer minimization;
- distributed sandbox providers;
- broad security pack ecosystem.

---

# 3. Target architecture

```text
SURFACES
CLI / CI / GitHub / GitLab / Bitbucket / IDE / MCP / API / merge queue
        │
        ▼
ReviewRequest { base, head, mode, policyRef, configDigest }
        │
        ▼
REVIEW DIRECTOR — TRUSTED SERVICE, NO TRUTH AUTHORITY
risk classification · routing · budgets · skip records
        │
        ▼
CONTEXT ROUTER / CONTEXT FABRIC
SCIP · Tree-sitter · git · Graphify-style routing signals · optional CPG · memory
provenance and trust preserved per item
        │
        ├─────────────────────────────────────────────┐
        ▼                                             ▼
UNTRUSTED SPECIALIST PROFILES                 DETERMINISTIC ANALYZERS
correctness / cyber / db / API / etc.         SARIF / SBOM / secrets / build
        │                                             │
        ▼                                             │
CANDIDATE FINDING BUS                                │
        │                                             │
        ▼                                             │
UNTRUSTED FALSIFIER                                  │
tries to disprove claim                              │
        │                                             │
        └───────────────────┬─────────────────────────┘
                            ▼
                   VALIDATION REQUESTS
                            │
                            ▼
                  EXECUTION / ANALYSIS BROKER
                            │
                            ▼
                    K2 TRUST KERNEL
Policy → Approval → ExecutionGateway → confinement → receipts
                            │
             ┌──────────────┴──────────────┐
             ▼                             ▼
     STATIC VALIDATORS              DYNAMIC VALIDATORS
     closed trusted set             closed trusted set
             │                             │
             └──────────────┬──────────────┘
                            ▼
               TECHNICAL EVIDENCE TRANSITION
                            │
                            ▼
                  ADJUDICATION CHAIN
append-only · hash-linked · exact-head-bound · replayable
                            │
                            ▼
                REVIEW-AWARE GATE PROFILE
class-specific blocking policy; opt-in; default DoneGate unchanged
                            │
                            ▼
ReviewVerdict { findings, evidence, receipts, mode, independence,
                configDigest, blockingTrace, verdict }
```

The core asymmetry is deliberate:

```text
Discovery can become arbitrarily broad.
Authority must remain narrow.
```

---

# 4. Trust model

| Actor | May | May never |
|---|---|---|
| Model | reason, propose, cite supplied context, request tools | set evidence level, move disposition, choose its own privilege, treat repository text as authority |
| Specialist | request bounded context and analyzer/execution intents | self-validate, write outside an authorized fix flow, bypass policy, see raw credentials |
| Falsifier | challenge assumptions, request counter-analysis | delete a finding by assertion, lower technical evidence, grant clearance |
| Patch proposer | propose remediation | certify its own patch, merge, weaken policy |
| Review Pack | declare profiles, prompts, triggers, tool bindings, context requirements, requested capabilities | execute in-process code, register trusted validators, grant capabilities, change K2/DoneGate/policy |
| Context provider | contribute classed, provenance-bearing context | silently upgrade inference to precise fact, omit provenance |
| Memory provider | provide historical/temporal hints | raise evidence, suppress findings, become blocking truth |
| Analyzer | run confined and emit typed/SARIF results | run unconfined, grant itself egress, become trusted solely because of brand/tool name |
| MCP server | advertise capability and execute after mapping/policy | inherit trust from metadata, receive undeclared secrets, bypass side-effect classification |
| Review Director | route, budget, record skips | decide whether a finding is true |
| Validator | raise technical evidence only from allowed reproducible artifacts | accept model prose as proof, be supplied by an untrusted pack, skip artifact identity |
| Adjudicator | move disposition along legal transitions with evidence references | invent evidence, bypass chain, adjudicate stale findings without re-review |
| K2 | authorize and mediate bounded side effects | delegate authority to untrusted configuration |
| Done Gate / review gate profile | derive machine-consumable verdict from declared checks/policy | pass without evidence, be redefined by a pack or model |

**Architectural invariant:** any design that allows a pluggable component to raise technical evidence, or a model assertion to move an authoritative disposition, breaches this plan.

---

# 5. Context and memory fabric

Kodac should federate context sources rather than crown one graph as truth.

## 5.1 Evidence/provenance classes

Preserve and strengthen the existing repository evidence distinction:

```text
precise-static
parser-derived
git-derived
heuristic-inference
model-hypothesis
```

Repository-originating text additionally carries an explicit untrusted-data trust tag.

## 5.2 Recommended composition

- **SCIP**: preferred language-neutral carrier for precise symbol/reference facts where a qualified index exists.
- **Tree-sitter / ast-grep**: parser-derived structure, scopes, syntax, and change localization.
- **Git**: history, blame, co-change, freshness, exact base/head identity.
- **Graphify**: reference/adapt source for graph diff, communities, path/explain, and routing heuristics. Its inferred edges remain heuristic and never proof.
- **Joern / CPG**: DEEP/PARANOID out-of-process analysis for data flow, taint, control flow, and source→sink reachability.
- **Graphiti-style temporal memory**: concept reference for time-valid engineering memory; optional and never evidence.
- **Embeddings/vector retrieval**: retrieval only; never evidence.

Memory may reorder or prioritize investigation. It must never silently suppress a finding or decide truth.

---

# 6. Finding and evidence protocol

The finding model must keep existing KRI exact-head and adjudication semantics and add technical evidence without collapsing orthogonal concepts.

Recommended additive shape:

```text
FindingV2 {
  findingIdentity
  correlationIdentity        // kernel-computed, cross-reviewer dedup
  claimKey

  review {
    reviewRunId
    reviewerId
    reviewerVersion
    providerIdentity
    routingDecisionRef
    policyIdentity
    canonicalBase
    reviewedHead
    mode
    configDigest
  }

  class
  severity
  confidenceBps              // reviewer self-report; never technical evidence
  summary
  contractClaim

  location {
    path
    range
    affectedSymbols[]
  }

  technicalEvidence {
    level: UNVALIDATED | ANALYZED | REACHABLE | REPRODUCED
    contextRefs[]
    staticRefs[]
    dynamicRefs[]
    reproducerRef?
    testRefs[]
    dependencyRefs[]
    transitionRecords[]
  }

  corroboration {
    status
    participants[]
    independenceLevel
    methodClasses[]
  }

  challenge {
    challengerId
    providerIdentity
    outcome: upheld | refuted | inconclusive | not-attempted
    rebuttalRef?
  }

  freshness              // derived from exact head
  disposition            // existing adjudication authority
}
```

## 6.1 Correlation and deduplication

The kernel computes a stable correlation identity over normalized path, enclosing symbol, finding class, and normalized claim shape. Line numbers are not identity because they move.

Duplicate discoveries are merged, not dropped. Rediscovery remains useful metadata but never becomes technical evidence by vote.

## 6.2 Class-specific blocking

There is no universal “must be REPRODUCED” rule.

Examples:

- secret candidate: deterministic presence + repository policy may justify blocking without external liveness probing;
- dependency advisory: version match alone is presence evidence; reachability/VEX/policy determine blocking severity;
- injection/memory-safety: `REACHABLE` or `REPRODUCED` should normally be required for high-confidence blocking where technically feasible;
- AuthZ/business logic: may block at `ANALYZED` when the claim is grounded in a trusted invariant/spec and survives independent falsification; a mechanical reproducer may not exist;
- performance: never claim deterministic performance harm without measurement evidence;
- architecture/spec findings: trusted rule/invariant plus precise facts may block even though no exploit-style reproducer exists.

Blocking remains a declared policy function over class, severity, technical evidence, challenge outcome, freshness, and applicable trusted requirements.

---

# 7. Cyber Mesh

Kodac should build a **small Cyber Mesh**, not a hardcoded army of agents.

## 7.1 Runtime archetypes

### A. Cyber Director

Trusted service for routing only.

Signals may include:

- auth/authz or permission changes;
- crypto;
- parser/deserializer boundaries;
- network handlers;
- command/process execution;
- filesystem access;
- SQL/query/template generation;
- dependency/lockfile changes;
- Docker/Kubernetes/IaC;
- CI/build scripts;
- serialization;
- concurrency/shared state;
- unsafe/native code;
- externally reachable entry points;
- trust-boundary crossings;
- blast radius from precise graph facts.

The Director decides who runs, context budgets, analyzer set, and review depth. It does not decide truth.

### B. Discovery archetype

One canonical runtime archetype instantiated with data-driven profiles:

- threat model / attack surface;
- AuthN/AuthZ;
- injection;
- memory safety;
- concurrency;
- crypto;
- parser/serialization;
- business logic;
- supply chain;
- secrets;
- container/cloud;
- CI/build;
- Agent/MCP security;
- language/framework profiles.

A profile must justify unique context, tools, routing trigger, characteristic false-positive mode, and evidence ceiling. Agent count itself is not a goal.

### C. Falsifier archetype

Its job is to kill weak findings.

For every candidate it should actively test counter-hypotheses such as:

- input is not attacker-controlled;
- sanitization occurs earlier;
- sink is unreachable;
- framework/type invariants exclude the state;
- authorization exists on another trusted layer;
- dependency is present but unreachable;
- apparent secret is a fixture/example;
- transaction/lifecycle makes race impossible;
- claimed resource leak is bounded;
- protocol assumptions invalidate the exploit path.

A textual disagreement does not clear a finding. Falsification must attach counter-evidence or remain inconclusive.

### D. Patch proposer

Optional later role. Finder, fixer, and patch verifier remain distinct identities/roles.

The patch proposer never certifies its own remediation.

## 7.2 Tools/workers, not autonomous authority

Reproducer generation, minimization, fuzzing, sanitizers, SBOM generation, scanners, and CPG queries are workers/tools behind the gateway, not privileged reviewers.

---

# 8. Static and deterministic analysis fabric

Integrate through canonical adapters and the ExecutionGateway.

Preferred result carrier for external analyzers: **SARIF** where sufficient, with Kodac-native typed records for evidence that SARIF cannot represent.

Candidate integrations:

- SCIP / compiler/LSP indexes;
- Tree-sitter / ast-grep;
- Joern as deep, out-of-process CPG analysis;
- CodeQL via user-provided/entitled execution and SARIF; do not bundle the separately licensed engine merely because the query repository is MIT;
- Semgrep through process/SARIF boundary with license/proprietary-feature separation;
- Infer where its language/analyzer coverage adds measurable value;
- OSV-Scanner;
- Syft;
- Grype;
- Trivy;
- Gitleaks;
- optional OpenSSF Scorecard for repository posture, not direct change proof.

No analyzer result becomes authoritative solely because the tool emitted “high confidence.” The validator checks identity, scope, exact reviewed head, result schema, and applicable evidence semantics.

---

# 9. Dynamic proof fabric

Dynamic proof is the strongest differentiator for reproducible vulnerability classes and must run only through bounded infrastructure.

Candidate methods:

- targeted regression generation;
- property-based testing;
- metamorphic testing;
- differential testing;
- concurrency stress;
- mutation testing where useful for test adequacy;
- libFuzzer / AFL++ / Honggfuzz / Centipede where suitable;
- OSS-Fuzz/ClusterFuzzLite patterns;
- ASan / UBSan / MSan / TSan where applicable;
- reproducer minimization.

## 9.1 Reproducer contract

A valid reproducer record should bind at minimum:

```text
finding identity
canonical base/head
source tree digest
build/dependency identity
environment image digest
sandbox provider/runtime identity
command/tool identity
input artifact digest
expected vulnerable behavior
observed behavior
output/evidence digest
resource limits
network policy
timeout
validator identity
replay result
```

Reproducer state:

```text
VALID
INVALID
FLAKY
STALE
NON_DETERMINISTIC
```

Only `VALID` exact-state replay may advance to `REPRODUCED`.

---

# 10. Sandbox fabric: native K2 first, OpenSandbox optional later

Current K2/H4 confinement remains canonical for initial Cyber execution.

The existing stack already provides the properties that matter most to review proof: controlled execution path, gVisor lifecycle, cgroup-v2 observation/enforcement, TTL lifecycle/recovery, network-boundary enforcement/observation, and aggregate output bounds.

## 10.1 OpenSandbox disposition

**Current disposition: `REFERENCE + ADAPT; OPTIONAL_PROVIDER_CANDIDATE AFTER QUALIFICATION`.**

OpenSandbox is valuable for:

- public sandbox lifecycle/execution contracts;
- Docker/Kubernetes backend abstraction;
- distributed scheduling patterns;
- gVisor/Kata/Firecracker runtime options;
- egress policy plane;
- credential-vault patterns;
- diagnostics;
- SDK/MCP surfaces;
- signed image/provenance practices.

It must not replace K2 authority.

Future shape:

```text
Cyber execution request
→ Kodac Execution Broker
→ K2 Policy / Approval
→ qualified SandboxProvider
   ├── native Kodac gVisor
   └── optional OpenSandbox provider
→ bounded run
→ normalized receipts
→ closed validator
```

Provider admission requires explicit parity/strengthening evidence for:

- process-tree control;
- CPU/memory/process limits;
- TTL and recovery;
- stdout/stderr aggregate bounds;
- network deny/allow and DNS/egress behavior;
- filesystem/mount confinement;
- credential non-disclosure;
- exact runtime/image identity;
- cleanup/recovery;
- cross-tenant isolation where relevant;
- replayable receipts.

Unsupported guarantees must fail loud. An agent may never select a weaker runtime or security downgrade.

---

# 11. DeepSeek Harness disposition

DeepSeek Harness remains a high-value architecture donor/reference for:

- capability seams;
- provider-neutral subagents;
- durable child sessions and continuations;
- typed events;
- model-visible logging discipline;
- scoped registrations;
- tool filtering;
- persona/profile composition;
- structured output;
- cancellation/ownership mechanics.

Reject wholesale:

- “no privileged core” as a Kodac trust rule;
- unrestricted patch/profile overlays capable of replacing policy, sandbox, validation, or approval rows;
- equal trust for all plugins;
- any composition path that bypasses K2.

Safe Kodac principle:

```text
Everything may be extensible.
Not everything is trusted equally.
Composability != authority.
```

The current upstream research snapshot is newer than the historical donor pin already audited in Kodac, so any additional source intake requires a new exact-pin provenance gate rather than silently extending the old authorization.

---

# 12. Review Pack architecture

Preferred architecture:

```text
Cyber discovery = first-party Review Pack / profile set
Cyber validators = closed trusted runtime set
```

Review Packs are declarations, not in-process executable authority.

A pack may declare:

- agent profiles/personas;
- triggers;
- requested context classes and budgets;
- analyzer bindings;
- requested capabilities;
- finding classes;
- falsification recipes;
- verification recipes;
- self-test fixtures;
- model capability tier.

A pack may never:

- register a trusted validator;
- raise technical evidence;
- grant network/filesystem/process capability;
- downgrade sandbox/runtime security;
- alter K2;
- alter Done Gate;
- change blocking policy;
- mutate another pack's findings;
- write into the evidence ledger directly.

Required pack admission properties:

- digest/signature/provenance;
- explicit license/source identity;
- compatibility version;
- capability requests evaluated by trusted policy;
- fail-closed self-tests;
- deterministic resolved pack-set digest (`packs.lock` concept);
- exact revocation semantics;
- no implicit activation from untrusted PR-head changes.

For PR review, `.kodac/` and equivalent instruction-bearing configuration resolve from the trusted base revision. A PR that changes policy is reviewed under the old policy; the policy change itself is reviewed as data/change.

---

# 13. Model and method routing

Kodac remains provider/model agnostic.

Suggested capability tiers:

```text
classify    risk routing / cheap structured triage
reasoning   correctness / architecture / concurrency / intent
security    cyber discovery / threat modeling
adversary   falsification / challenge
none        technical evidence establishment
```

Record model/provider identity for audit and variance measurement.

Independence taxonomy should include both model and method:

```text
same-run
different-run
different-model
different-family
different-provider
different-method
```

DEEP/PARANOID policies may require different-family or different-provider challenge, but **method independence is the stronger objective** for technical findings.

If the configured environment cannot satisfy a declared independence requirement, record the shortfall and fail loud rather than falsely claiming independence.

Kodac may enforce real user-selected resource, time, concurrency, token, and cost budgets. It must remain compatible with local execution, self-hosting, BYOK/BYOM, and interchangeable providers rather than making hosted scarcity a product invariant.

---

# 14. Review modes

Modes are contracts, not marketing labels.

| Mode | Discovery | Validation | Dynamic execution | Independence |
|---|---|---|---|---|
| FAST | deterministic analyzers only | schema/identity + trusted analyzer validation | none | n/a |
| STANDARD | risk-routed specialists + deterministic analyzers | falsification + targeted validation | existing tests where relevant | challenger may share provider unless policy forbids |
| DEEP | graph-wide impact + CPG where triggered | reachability + stronger falsification | targeted new tests/reproducers | different-family preferred/required for blocking high-risk findings |
| PARANOID | independent discovery passes + threat model + supply-chain depth | method-diverse validation | fuzz/property/mutation/hostile regression as applicable | different-provider plus different-method requirements for critical classes where feasible |

FAST must remain model-free unless a future benchmark proves a model adds enough value without unacceptable latency/noise.

PARANOID reports variance; it does not convert agreement into truth.

---

# 15. Surfaces

One core engine; thin adapters only.

Surface adapters may:

1. acquire a change reference;
2. invoke the canonical review engine;
3. render the resulting verdict.

They may not implement independent risk, blocking, or adjudication logic.

Priority order:

1. CLI — `kodac review --base <ref> --head <ref> --mode <mode>`;
2. CI — exit status plus JSON/SARIF artifacts;
3. GitHub — check run, inline findings, evidence drill-down;
4. MCP — `kodac.review` for other coding agents;
5. pre-commit/pre-push FAST mode;
6. IDE;
7. GitLab/Bitbucket;
8. merge queue consumption of review verdict.

The MCP surface is strategically important because Kodac can become the verifier another coding agent calls before asserting that its own work is complete.

---

# 16. Benchmark and acceptance program

Kodac must report at least two separate review numbers:

- **Kodac-Discovery**: all findings, comparable to competing reviewers;
- **Kodac-Gate**: findings that actually block under the selected policy.

Never blend them.

## 16.1 General review benchmark

Use Code Review Bench as a primary external review-quality instrument, supplemented by other reproducible review benchmarks as they mature.

Required metrics:

- precision;
- recall;
- severity-weighted recall;
- critical/high recall;
- false-positive rate;
- duplicate rate;
- time to first valid finding;
- total latency;
- cost/tokens;
- context size;
- developer acceptance where measurable.

## 16.2 Cyber benchmark matrix

Evaluate current, licensable/reproducible suites such as:

- CyberGym / CyberGym-E2E;
- VulnGym;
- BountyBench;
- PatchEval-Verified;
- SEC-bench;
- SecureAgentBench;
- RealVuln;
- AIxCC/CRS artifacts where applicable.

Do not let one benchmark stand for all security behavior.

Measure separately:

### Discovery

- vulnerability recall;
- critical recall;
- precision / false-positive rate;
- duplicate rate.

### Validation

- reachable-path accuracy;
- reproducer success;
- false-reproduction rate;
- falsification rate;
- evidence completeness.

### Patching

- original exploit/reproducer eliminated;
- functional regression rate;
- alternate-path survival;
- patch overbreadth;
- new-vulnerability introduction.

### Robustness

- PR-title/description injection resistance;
- hostile `AGENTS.md` / instruction-file resistance;
- poisoned pack resistance;
- malicious MCP/tool metadata resistance;
- analyzer-output forgery resistance;
- evidence replay rejection;
- exfiltration resistance;
- sandbox/confinement regression tests.

### Longitudinal

The highest-value product metric is post-review escape rate: defects or vulnerabilities that shipped through a passing Kodac verdict.

## 16.3 Hard benchmark rule

Before Kodac introduces a blocking review claim, **Kodac-Discovery must be competitive on external review benchmarks**. A perfect gate around weak discovery is not a strong product.

Before any “best”, “safer”, or “beats X” claim, ADR-0010 fair-comparison evidence is required.

---

# 17. Source admission summary

Research snapshots below are **not source-intake authorization**.

| Source | Snapshot / status | Disposition | Primary value |
|---|---|---|---|
| `deepseek-ai/deepseek-harness` | `99f6f02fecdb7dff40c3fbc9470f5907c29f74ca`, MIT | ADAPT selectively | seams, subagent providers, sessions, events, scoped composition |
| `opensandbox-group/OpenSandbox` | `426300f86a9437fc5a3302f89956dc477595997e`, Apache-2.0 | REFERENCE + ADAPT; optional provider candidate | sandbox protocol/control plane, Docker/K8s, secure runtimes, egress/credential patterns |
| `Graphify-Labs/graphify` | `558df6d57d61cb6ef79c740ec7473c6d953d79a7`, Apache-2.0 | REFERENCE | graph routing/diff/community ideas; inferred edges never proof |
| `capitalone/VulnHunter` | `4042d34609ff85e0029dd55743b9c3f677cc984a`, Apache-2.0 | REFERENCE / ADAPT workflow concepts | attacker-first discovery, falsification, reproduction, independent fix verification |
| `withmartian/code-review-benchmark` | `2b092b670f7d6cae6d429babaaee18948b4bdacb`, MIT | BENCHMARK | independent review precision/recall comparison |
| OpenHands software-agent-sdk | current source must be pinned before intake | REFERENCE | workspace/event/tool decomposition and runtime comparisons |
| Continue | pin required before intake | ADAPT shape | source-controlled checks/configuration |
| SCIP | pin required before intake | INTEGRATE format | precise symbol/reference interchange |
| Tree-sitter | pin required before intake | INTEGRATE dependency | parser-derived structure |
| Joern | pin required before intake | INTEGRATE out-of-process, DEEP+ | CPG, dataflow, taint, reachability |
| Graphiti | pin required before intake | REFERENCE | temporal validity model for non-evidence memory |
| CodeQL | query repo vs engine licensing must remain separated | GUARDED INTEGRATION | user-entitled analysis/SARIF; never silently bundle engine |
| Semgrep | OSS/proprietary/license boundaries must remain explicit | SUBPROCESS INTEGRATION | fast patterns/rules/SARIF |
| OSV / Syft / Grype / Trivy / Gitleaks | pin each before intake | INTEGRATE adapters | supply chain, SBOM, vulnerabilities, secrets |
| OSS-Fuzz / ClusterFuzzLite | pin before intake | REFERENCE / ADAPT | fuzzing, corpus, reproducer/minimization patterns |
| SARIF | standard | INTEGRATE | analyzer result interchange, not Kodac finding authority |
| in-toto attestation | pin/spec version before implementation | ADAPT export later | portable verdict/evidence attestation |
| Cedar | pin before implementation | REFERENCE | policy-model concepts; do not replace K2 |
| OPA/Rego | pin if evaluated | REJECT for kernel; optional outer adapter only | general org-policy integration, not K2 authority |
| Microsoft MDASH | published architecture/reference | REFERENCE | large-scale specialist routing, validate/dedup/prove separation |
| DARPA AIxCC / Atlantis / OSS-CRS | benchmark/research sources | REFERENCE / ADAPT methods | LLM + program analysis + fuzzing + patch validation |
| FuzzingBrain | research/reference | REFERENCE | LLM-guided dynamic verification |
| OpenAI Codex Security | public methodology | REFERENCE | threat-model-first identification/validation/remediation |
| Anthropic security/containment research | public methodology | REFERENCE | hostile repository, prompt injection, environment containment |

Any future `PORT`, `ADAPT`, or production dependency decision requires the repository's normal exact-source provenance and benchmark gate.

---

# 18. Phased migration plan

Do not rewrite Kodac. Integrate what already exists, then add evidence, scale discovery, measure, and only then add authority.

## Phase 0 — Documentation truth and threat baseline

Objective: make repository architecture truth safe for humans and agents.

- retire/replace legacy Kernux `docs/architecture/ARCHITECTURE.md` and stale decision material;
- document base-revision resolution for instruction-bearing review configuration;
- add hostile-repository threat fixtures to planning/acceptance requirements.

Non-goal: runtime review implementation.

Proof: repository architecture entry points resolve only to current Kodac truth.

## Phase 1 — Land the existing reviewer island

Objective: connect existing KRI reviewer intelligence to a non-blocking product path.

- add one review run path/CLI;
- one runtime instance per review run;
- exact-base/head snapshot;
- context bundle provenance;
- findings remain non-blocking;
- stale semantics unchanged.

Proof: every finding cites valid bundle/evidence references and becomes stale when head moves.

## Phase 2 — Technical evidence substrate + early deterministic Cyber

Objective: add the first non-model evidence path.

- `TechnicalEvidenceLevel` additive contract;
- closed validator interface;
- SARIF ingestion;
- analyzer receipt linkage;
- early deterministic SBOM/dependency/secret checks where qualified;
- malicious instruction/configuration fixtures.

Non-goals: CPG, fuzzing, blocking.

Hard invariant: model agreement cannot raise technical evidence.

## Phase 3 — Director and controlled fan-out

Objective: multiple specialists without token-furnace behavior.

- deterministic/replayable Review Director;
- per-specialist context bundles/budgets;
- kernel correlation identity and merge-not-drop dedup;
- begin with a small roster (for example correctness, cyber, database) rather than every conceivable specialty;
- add event causation/run identity required for cross-agent provenance.

Proof: routing is replayable; skipped specialists are explicit; duplicate discoveries merge without converting votes into proof.

## Phase 4 — Falsification and independence

Objective: reduce false positives before adding authority.

- Falsifier archetype;
- provider/method identity;
- challenge records;
- independence shortfall surfaced in verdict;
- method-diversity metrics.

Non-goals: majority voting, consensus scoring, confidence-to-evidence conversion.

Gate: false-positive rate must fall without unacceptable recall loss.

## Phase 5 — External surfaces and measurement

Objective: become externally measurable.

- GitHub review/check adapter;
- JSON/SARIF verdict outputs;
- Code Review Bench integration;
- Cyber benchmark runners/adapters where feasible;
- report Kodac-Discovery and Kodac-Gate separately.

**Hard gate:** if discovery is not competitive, stop and improve discovery. Do not add blocking authority to weak signal.

## Phase 6 — Review-aware authority

Objective: introduce the actual trust-surface product claim.

- separate opt-in review gate profile;
- preserve existing default `DoneGate.REQUIRED_CHECKS` semantics;
- class-specific blocking policy resolved from trusted base;
- verdict records mode, policy/config digest, independence shortfall, and blocking-evaluation trace.

Proof: no finding blocks below its declared class policy; no PR-head policy change can govern its own review; zero blocking findings without evidence references.

Rollback: disable review gate profile and return to advisory behavior.

## Phase 7 — Deep Cyber proof

Objective: reach `REACHABLE` and `REPRODUCED` where the vulnerability class permits.

- Joern/CPG or benchmark-selected alternative for triggered deep analysis;
- targeted hostile regression generation;
- bounded fuzzing/sanitizers/property testing;
- reproducer minimization and independent replay;
- Cyber Execution Broker over existing K2;
- evaluate OpenSandbox as an optional provider only after capability-parity qualification.

Non-goals: always-on CPG; replacing native K2; allowing the Cyber agent to mint evidence.

Gate: critical-vulnerability recall and reproducer quality improve without false-positive regression or confinement weakening.

## Phase 8 — Review Pack ecosystem

Objective: open discovery without opening authority.

- declaration-only Review Pack ABI;
- `.kodac/` trusted-base resolution;
- `packs.lock` resolved digest;
- signature/provenance/license metadata;
- self-tests/fail-closed admission;
- first-party Cyber discovery pack built on the same ABI as third parties;
- trusted validators remain outside packs.

Proof: hostile pack fixtures cannot escalate capabilities, register validators, weaken sandboxing, alter policy, or exceed evidence ceilings.

## Deferred future track

Only after the above earns its gates:

- temporal outcome learning;
- cross-repository organization memory;
- marketplace/registry;
- distributed sandbox fleets;
- signed verdict/attestation exports;
- broader language/domain packs.

Memory must remain advisory/routing input unless separate trusted evidence independently establishes the claim.

---

# 19. Hard stop conditions

Stop or defer progression when any of the following holds:

1. external benchmark discovery is materially below the competitive field;
2. false-positive reduction is achieved only by suppressing recall without disclosure;
3. an implementation requires model agreement to become evidence;
4. a plugin/pack needs in-process authority or validator registration to work;
5. an external sandbox provider cannot prove parity with required K2 guarantees;
6. an analyzer's license/provenance cannot support the proposed integration mode;
7. a review surface starts implementing its own blocking/adjudication logic;
8. repository memory is being used to silence or prove findings;
9. review policy is sourced from attacker-controlled head content;
10. implementation scope outruns benchmark/evidence capacity.

---

# 20. What not to build

Explicitly rejected unless a later evidence-backed architecture decision overturns them:

- majority-vote review;
- consensus/confidence scoring as proof;
- a Kodac-owned graph database merely for feature parity;
- full CPG on every PR;
- executable in-process Review Packs in the initial ecosystem;
- embeddings as evidence;
- chat-learned suppression that silently hides findings;
- auto-fix + self-review + auto-merge closed loop;
- an LLM judge inside the runtime gate;
- cloud-required core review/context/validation;
- model/vendor-specific architecture;
- unrestricted DeepSeek-style profile overlays over trusted policy/sandbox rows;
- external sandbox adoption that weakens existing K2 guarantees;
- secret liveness probing by default;
- artificial Kodac product scarcity as a substitute for real resource controls.

---

# 21. Final product position

Kodac should not try to win by claiming the largest swarm or longest feature list.

The target is:

> **The verification and trust layer between AI-generated or human-generated code and production.**

Competitive discovery is mandatory. The unique product artifact is the warranted verdict:

```text
reproducible
attributable
exact-head-bound
policy-derived
independently checkable
refusable when evidence is insufficient
```

Cursor-class tools answer:

```text
How do I build this?
```

Kodac should become the system that answers:

```text
Can this change safely ship, what evidence supports that decision,
and what remains uncertain?
```

The architectural test for every future feature is therefore:

> Does this widen useful discovery without widening trusted authority, and can its contribution be measured independently?

If the answer is no, it does not belong in the trust surface.

---

# 22. Planning disposition

```text
MULTI_AGENT_REVIEW_SHIFT = RECOMMENDED
CYBER_MESH = RECOMMENDED_SMALL_MESH
DISCOVERY_SURFACE = EXTENSIBLE_UNTRUSTED
TECHNICAL_VALIDATION = CLOSED_TRUSTED
MODEL_CORROBORATION = METADATA_NOT_EVIDENCE
REPRODUCED = EXACT_STATE_BOUNDED_REPLAY_REQUIRED
NATIVE_K2 = CANONICAL_INITIAL_EXECUTION_AUTHORITY
OPENSANDBOX = REFERENCE_ADAPT_OPTIONAL_PROVIDER_CANDIDATE
DEEPSEEK_HARNESS = SELECTIVE_ARCHITECTURE_DONOR_ONLY
GRAPHIFY = ROUTING_CONTEXT_REFERENCE_NOT_PROOF
REVIEW_PACKS = DECLARATION_ONLY_INITIAL_MODEL
BLOCKING_REVIEW = NOT_AUTHORIZED_BY_THIS_DOCUMENT
H4_R3G_F = NOT_STARTED_BY_THIS_DOCUMENT
IMPLEMENTATION = NOT_AUTHORIZED
```
