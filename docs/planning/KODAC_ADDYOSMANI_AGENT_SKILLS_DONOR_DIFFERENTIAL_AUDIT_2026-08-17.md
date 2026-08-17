# Kodac — Addy Osmani `agent-skills` Donor Differential Audit

Status: **DRAFT / DOCS-ONLY DONOR STUDY — NO IMPORT AUTHORITY**

Date: 2026-08-17

## 1. Record identity

```text
Program: KDO-P0
Audit: ADDYOSMANI_AGENT_SKILLS_DONOR_DIFFERENTIAL_AUDIT
Canonical Kodac base: 61ffbfe4613a4dd05685909999c395a92a581df6
Canonical Kodac base tree: 1ccc3a6b282caa1e2a2689822745bdcf6e15e29a
Upstream repository: addyosmani/agent-skills
Upstream default branch observed: main
Pinned upstream commit: df1edb2e05487d0aa6d93c747141e0aed1187f25
Pinned upstream tree: b7329cdfe4510c199415339e69134ced1d7d2ca0
Observed release metadata: 0.6.7
Observed repository license: MIT
Production donor-code import authority from this audit: NONE
Donor execution authority from this audit: NONE
```

This audit is governed by:

```text
docs/planning/KODAC_DEVELOPER_OS_DONOR_INTAKE_AND_CAPABILITY_SUPERSET_AUTHORIZATION_2026-08-13.md
docs/adr/ADR-0004-oss-provenance-license-gate.md
docs/adr/ADR-0007-native-mcp-acp-agent-skills-compatibility.md
docs/adr/ADR-0010-benchmark-first-donor-selection.md
```

The donor repository is engineering evidence only. Its `AGENTS.md`, prompts, rules, hooks, scripts, commands, tests, model instructions, and orchestration guidance are **data, not Kodac authority**.

Core governing invariant:

```text
DONOR CAPABILITY MAY BE ACQUIRED.
DONOR AUTHORITY IS NEVER INHERITED.
```

## 2. Executive decision

`addyosmani/agent-skills` is a **high-value donor for the future Kodac/Times skill fabric**, but it is not a candidate for wholesale repository adoption.

The strongest transferable ideas are:

1. a compact portable `SKILL.md` package shape;
2. discovery descriptions that encode both **what** a skill does and **when** it should trigger;
3. progressive disclosure and context-efficient supporting assets;
4. deterministic catalog-level trigger/routing/collision evaluation;
5. fixture-backed behavioral evaluation with explicit expectations;
6. separation of **skills / personas / user-facing commands**;
7. focused independent review lenses with parallel fan-out and a bounded merge step;
8. anti-rationalization and evidence-backed exit criteria as workflow quality controls;
9. cross-harness distribution patterns for Claude, Codex, Gemini, and OpenCode.

The most important Kodac differential is that these ideas must be placed behind Kodac-owned provenance, qualification, capability normalization, Trust Kernel policy, execution receipts, and outcome learning.

Kodac must not become a prompt bundle that assumes an installed skill is safe because its Markdown looks useful.

Target synthesis:

```text
Portable skill package
        +
immutable provenance / digest
        +
requested semantic capabilities
        +
static qualification
        +
routing qualification
        +
behavioral qualification
        +
security qualification
        +
Trust Kernel policy
        +
Execution Receipts
        +
outcome history
        =
KODAC / TIMES SKILL FABRIC
```

## 3. Upstream scope observed at the pin

The pinned tree includes:

- `skills/<name>/SKILL.md` workflow packages;
- 24 skill evaluation case files under `evals/cases/`;
- evaluation fixtures under `evals/fixtures/`;
- deterministic and behavioral evaluation tooling under `scripts/`;
- specialist personas under `agents/`;
- user-facing command surfaces for multiple harnesses;
- shared security, testing, performance, accessibility, observability, and definition-of-done references;
- effectful shell hooks under `hooks/`;
- plugin/distribution metadata for Claude, Codex, Gemini, and OpenCode.

Representative skill families include:

```text
api-and-interface-design
browser-testing-with-devtools
ci-cd-and-automation
code-review-and-quality
code-simplification
context-engineering
debugging-and-error-recovery
deprecation-and-migration
documentation-and-adrs
doubt-driven-development
frontend-ui-engineering
git-workflow-and-versioning
idea-refine
incremental-implementation
interview-me
observability-and-instrumentation
performance-optimization
planning-and-task-breakdown
security-and-hardening
shipping-and-launch
source-driven-development
spec-driven-development
test-driven-development
using-agent-skills
```

Observed specialist personas include:

```text
code-reviewer
security-auditor
test-engineer
web-performance-auditor
```

## 4. Rights and provenance

The pinned repository root contains an MIT License with copyright notice for Addy Osmani.

Preliminary repository-level rights state:

```text
REPOSITORY LICENSE SIGNAL: MIT
SOURCE PIN: RECORDED
TREE PIN: RECORDED
WHOLE-REPOSITORY SOURCE COPY AUTHORITY: NOT GRANTED BY THIS AUDIT
COMPONENT-LEVEL THIRD-PARTY / EMBEDDED RIGHTS REVIEW: REQUIRED BEFORE DIRECT SOURCE INTAKE
```

MIT permission does not establish trust, runtime safety, architectural fitness, or qualification.

Any future copied or adapted expression must preserve applicable copyright/license notices and enter Kodac through the existing provenance/import authorization process.

## 5. Skill package anatomy

### Upstream pattern

The donor uses a required `skills/<name>/SKILL.md` with YAML frontmatter and optional scripts/references/supporting files. The description carries both the capability and trigger conditions. The recommended body includes workflow steps, rationalization resistance, red flags, and verifiable completion criteria.

It also recommends progressive disclosure: keep the main skill focused and load detailed references only when needed.

### Kodac assessment

This is a strong portability and context-efficiency pattern.

Primary disposition:

```text
PORT / BEHAVIORAL_REIMPLEMENTATION CANDIDATE
```

Do not make the donor Markdown shape Kodac's internal canonical authority model. Agent Skills remains an external compatibility boundary behind Kodac-owned adapters as required by ADR-0007.

Kodac should retain portable compatibility while adding governance metadata outside or alongside the portable representation.

### Required Kodac extension

A future Kodac/Times skill record should be able to bind at least:

```text
skillIdentity
sourceRepository
sourceCommit
sourcePath
packageDigest
license
copyright / notices
portableSkillName
portableDescription
triggerExamples
negativeTriggers
requestedCapabilities
filesystemScope
networkScope
secretScope
processScope
modelCompatibility
harnessCompatibility
evalDefinitionDigest
routingQualification
behavioralQualification
securityQualification
trustStatus
executionReceiptPolicy
outcomeHistory
```

Installing or discovering a portable skill must never grant these capabilities automatically.

## 6. Description-driven discovery

### Upstream pattern

The donor treats a skill description as a routing surface. Its anatomy guidance requires the description to explain both what the skill does and when it should activate.

### Kodac assessment

Adopt the discipline, not the assumption that description text is sufficient semantic truth.

Primary disposition:

```text
PORT CANDIDATE
```

Kodac should qualify descriptions as searchable/routable metadata and preserve the exact source text as evidence. Routing authority should be Kodac-owned and may combine deterministic lexical signals, semantic retrieval, repository/task state, policy, historical outcomes, cost/latency signals, and model/provider capability.

A donor-authored trigger sentence is untrusted metadata, not permission to execute.

## 7. Tier-1 structural validation

### Upstream pattern

The donor validates frontmatter, naming, required structure, command parity, artifact paths, references, and version consistency.

### Kodac assessment

These are cheap deterministic gates and align with Kodac's evidence-first approach.

Primary disposition:

```text
PORT CANDIDATE
```

A future Kodac Skill Qualification Bench should include deterministic structural validation before any model or runtime execution.

Additional Kodac-required checks should include:

```text
immutable package digest
provenance completeness
license / notice state
unknown-file rejection where the package contract requires it
capability declaration completeness
network / secret declaration completeness
script executable inventory
symlink / path escape policy
artifact-size bounds
portable-reference resolution
unsupported harness metadata
```

## 8. Tier-2 trigger/routing evaluation

### Upstream pattern

The donor implements a deterministic CI-safe routing approximation using stemmed TF-IDF over skill names/descriptions. Positive prompts must rank the intended skill within a configured `top_k`; negative prompts can identify a competing owner; catalog descriptions are checked for pairwise similarity collisions. The current documentation records a rank-1 metric and collision warning/error thresholds.

### What is valuable

The important design contribution is **not TF-IDF itself**. It is treating routing quality as a measurable catalog property with:

- positive trigger cases;
- negative trigger cases;
- pairwise ownership checks;
- collision detection;
- a regression floor;
- deterministic CI execution.

Primary disposition:

```text
PORT CANDIDATE — DESIGN / TEST CONTRACT
```

### What Kodac should not inherit

```text
TF-IDF ROUTING RESULT != SEMANTIC ROUTING TRUTH
DESCRIPTION SIMILARITY != CAPABILITY EQUIVALENCE
RANK-1 ON A SMALL FIXTURE SET != PRODUCTION ROUTING QUALITY
```

Kodac should preserve a cheap deterministic tier while adding stronger qualification layers such as held-out natural prompts, multilingual prompts when supported, adversarial near-neighbor skills, model/provider variance, task-context routing, repository-state routing, and outcome-linked routing quality.

The deterministic tier should remain useful even when no model provider is available.

## 9. Tier-3 behavioral evaluation

### Upstream pattern

The donor defines behavioral cases with prompt, expected output, fixture inputs, and `expectations[]`. Execution evaluations operate in throwaway repositories and grade an execution trace; dialogue evaluations grade conversational output.

### Kodac assessment

The schema idea is strong because it moves skill quality from prose review toward observable behavior.

Primary disposition:

```text
PORT / BEHAVIORAL_REIMPLEMENTATION CANDIDATE
```

Kodac should provider-neutralize the executor and grader.

A future behavioral result should bind:

```text
skill package digest
eval definition digest
fixture digest
exact Kodac commit
model/provider/version
system/tool policy digest
sandbox/confinement identity
network policy
secret policy
execution start/end identity
raw trace digest
artifact digest
expectation-level verdicts
cost / token / latency data
Execution Receipt identity
```

No behavioral runner may bypass K2 merely because an upstream runner grants broad tool access.

## 10. Headless-Claude behavioral executor

### Upstream pattern

The donor's opt-in behavioral runner invokes headless `claude`, enables an edit-oriented permission mode, exposes a selected tool list, materializes fixtures, and sends execution traces to a grader.

### Kodac differential

This implementation is useful as a reference for test mechanics but is provider-specific and assumes a trust/permission model that Kodac must not inherit.

Primary disposition:

```text
STUDY_ONLY / BEHAVIORAL_REIMPLEMENTATION
DIRECT_IMPORT: REJECTED AT THIS STAGE
```

Reasons:

- provider-specific executable dependency;
- provider-specific permission semantics;
- untrusted fixture execution concerns;
- shell/process/network capability concerns;
- no right for an upstream skill evaluator to bypass K2;
- Kodac requires provider neutrality, receipts, confinement, and reproducible qualification evidence.

A future Kodac runner may reproduce the useful behavior while routing all effects through Kodac-owned execution policy.

## 11. Skills / personas / commands separation

### Upstream pattern

The donor frames:

```text
Skills   = how
Personas = who
Commands = when / user-facing orchestration entry points
```

### Kodac assessment

This separation is useful because it prevents workflow logic, reviewer perspective, and invocation surface from collapsing into one opaque prompt.

Primary disposition:

```text
REFERENCE_ONLY / ADAPT
```

Kodac should generalize it into its existing canonical protocol and capability registry rather than adopting the donor object model verbatim.

Likely Kodac mapping:

```text
Portable Skill
  -> workflow/capability package

Reviewer / Worker Profile
  -> role, model constraints, tools, qualification, memory/policy

Workflow / Route
  -> orchestration graph with explicit authority and evidence edges

Command / UI action / API request
  -> invocation surface only
```

## 12. Parallel fan-out with merge

### Upstream pattern

The donor recommends independent specialist personas working concurrently on the same artifact, followed by a small synthesis step. Its `/ship` example fans out to code-review, security, and test perspectives.

### Kodac assessment

The independence principle is directly relevant to Kodac Reviewer Intelligence and future Times reviewer swarms.

Primary disposition:

```text
REFERENCE_ONLY / BEHAVIORAL_REIMPLEMENTATION
```

Preserve:

- distinct reviewer lenses;
- parallel execution when tasks are independent;
- separate context windows;
- explicit synthesis/adjudication;
- cost visibility;
- no hidden deep coordinator chain.

Do **not** adopt as a universal Kodac rule the donor's stronger claim that the user or slash command must always be the only orchestrator.

Kodac/Times is expected to support safe machine orchestration, dynamic routing, multiple interchangeable models, parallel workers, distributed execution, and future learned scheduling. Those capabilities can coexist with explicit human authority checkpoints.

The stronger Kodac invariant is:

```text
ORCHESTRATION MAY BE AUTOMATED.
AUTHORITY MUST REMAIN EXPLICIT.
EVIDENCE MUST REMAIN ATTRIBUTABLE.
SIDE EFFECTS MUST REMAIN POLICY-GATED.
```

## 13. Sequential lifecycle and human checkpoints

### Upstream pattern

The donor prefers a user-driven DEFINE -> PLAN -> BUILD -> VERIFY -> REVIEW -> SHIP sequence and warns that a generic sequential orchestrator can add paraphrasing drift, cost, and loss of human checkpoints.

### Kodac assessment

The failure-mode analysis is valuable, but the implementation policy is too restrictive to become a universal Times invariant.

Primary disposition:

```text
REFERENCE_ONLY
```

Times may automate safe, reversible, bounded, and fully evidenced transitions. Human approval remains required where canonical policy demands it, not merely because an upstream workflow chooses manual command invocation.

## 14. Competing-hypothesis investigation

The donor distinguishes independent fan-out used for verdicts from collaboration/debate used to investigate competing hypotheses.

This is highly relevant to future Times debugging, security analysis, incident investigation, and review adjudication.

Primary disposition:

```text
REFERENCE_ONLY / FUTURE BENCHMARK CANDIDATE
```

Times should benchmark whether debate actually improves calibrated correctness versus independent sampling + adjudication for a given task. More agents must not be assumed to mean better results.

## 15. Individual engineering skills

The donor contains useful engineering workflows for TDD, code review, security, context engineering, debugging, planning, CI/CD, performance, API design, and related work.

Primary disposition for the catalog as a whole:

```text
WHOLE CATALOG DIRECT IMPORT: REJECTED
SELECTIVE SKILL PORT / BEHAVIORAL REIMPLEMENTATION: CANDIDATE
```

Before any individual skill becomes a Kodac-distributed or Kodac-native capability, perform at minimum:

1. overlap check against existing Kodac capabilities and governance;
2. exact source pin and rights record;
3. requested-capability derivation;
4. prompt-injection / unsafe-instruction review;
5. deterministic trigger qualification;
6. behavioral qualification;
7. security qualification;
8. benchmark against existing/native alternatives;
9. provider/harness compatibility review;
10. separate import/admission authorization when source expression is copied or effectful behavior is activated.

## 16. Anti-rationalization / red-flags / verification sections

These sections are one of the donor's stronger skill-authoring patterns because they encode common workflow failures and make exit conditions inspectable.

Primary disposition:

```text
ADAPT AS SKILL-QUALITY GUIDANCE
```

Kodac should strengthen the idea by distinguishing:

```text
instructional verification checklist
from
machine-observed evidence
from
trusted completion authority
```

A skill may instruct an agent to run tests; only verified artifacts and canonical Kodac gates may establish the corresponding completion claim.

## 17. Shared references and portability weakness

The donor intentionally stores references shared by multiple skills at repository root. Its own anatomy documentation records the portability tradeoff: copying an individual skill directory can leave root-relative shared references unresolved.

Kodac should avoid silently broken package semantics.

Primary disposition:

```text
REFERENCE_ONLY — DO NOT COPY THIS PACKAGING WEAKNESS
```

Preferred Times direction:

```text
self-contained skill bundle
or
explicit pack manifest with digest-addressed dependencies
```

Every referenced asset should resolve through the package manifest and be included in the package/evaluation digest.

## 18. Shell hooks and session scripts

The donor includes executable shell hooks for session/cache/simplification behavior.

Under KDO-P0 these files are inert donor data.

Primary disposition:

```text
STUDY_ONLY
DIRECT_IMPORT / EXECUTION: REJECTED WITHOUT SEPARATE AUTHORITY
```

Any future hook-like capability must declare and qualify:

- process execution;
- filesystem reads/writes;
- environment access;
- network access;
- secret access;
- time/output/resource limits;
- trigger semantics;
- failure semantics;
- receipt requirements.

No hook runs merely because a skill package contains it.

## 19. Upstream `AGENTS.md`, prompts, rules, and command instructions

Primary disposition:

```text
STUDY_ONLY AS DONOR DATA
AUTHORITY ADOPTION: REJECTED
```

Their useful ideas may inform bounded Kodac-native contracts, but they cannot redefine:

- K2 side-effect authority;
- Done Gate truth;
- founder authorization;
- provenance requirements;
- review/adjudication truth;
- branch/merge rules;
- capability grants.

## 20. Cross-harness distribution

The donor carries packaging and command surfaces for multiple agent environments.

Primary disposition:

```text
PORT / ADAPT CANDIDATE
```

This is strategically aligned with ADR-0007: Kodac should meet developers in existing ecosystems without making any external harness its internal canonical model.

Times should eventually be able to materialize a qualified capability into compatible surfaces for supported environments while preserving one Kodac-owned identity and policy record.

Conceptually:

```text
Qualified Times Skill
        |
        +--> Agent Skills-compatible package
        +--> Claude-compatible surface
        +--> Codex-compatible surface
        +--> Gemini-compatible surface
        +--> OpenCode-compatible surface
        +--> future adapters
```

Materialization must not change the capability grant.

## 21. Comparison with current Kodac architecture

Kodac already has architectural pieces that should make a future skill system materially stronger than the donor repository alone:

```text
Agent Skills compatibility boundary
Extension/capability registry
semantic capability identifiers
ExecutionGateway
Trust Kernel policy
confinement / sandbox evidence
provider-neutral model contracts
reviewer qualification
benchmark/evidence protocol
Execution Receipts
provenance import records
repository/context intelligence
```

Therefore the correct strategy is not:

```text
copy agent-skills into Kodac
```

It is:

```text
use agent-skills as one donor for a qualified, evidence-producing, provider-neutral skill fabric
```

## 22. Proposed Times Skill Qualification Stack

A future qualification pipeline should be staged and fail closed:

```text
S0  package parse / schema / path safety
S1  provenance + license + digest
S2  capability request derivation
S3  static instruction/script risk analysis
S4  trigger positives / negatives / collision checks
S5  semantic routing held-out evaluation
S6  provider/harness compatibility
S7  sandboxed behavioral evaluation
S8  security/adversarial evaluation
S9  cost / latency / token / tool-call metrics
S10 benchmark against incumbent/native skill
S11 policy admission decision
S12 signed/immutable qualification record
S13 runtime Execution Receipts
S14 outcome learning / regression monitoring
```

No stage should silently convert qualification into authority.

## 23. Proposed routing metrics beyond the donor

Retain cheap catalog routing metrics and add:

```text
rank-1 accuracy
MRR / top-k recall
negative-owner outranking accuracy
near-neighbor confusion matrix
false activation rate
missed activation rate
abstention calibration
cross-model variance
cross-provider variance
repository-context sensitivity
multilingual trigger quality where supported
latency
token cost
tool-call cost
human correction rate
post-task outcome utility
```

Historical production outcomes should be kept separate from synthetic evaluation scores but may inform later routing policy.

## 24. Proposed reviewer-swarm application

The donor's parallel-review pattern maps naturally into Times, but Times should make every reviewer output attributable and adjudicable.

```text
PR / patch / repository state
        |
        +--> correctness reviewer
        +--> security reviewer
        +--> test reviewer
        +--> architecture reviewer
        +--> performance reviewer
        +--> domain-specific reviewer(s)
                    |
                    v
          evidence normalization
                    |
                    v
          deduplication / conflict graph
                    |
                    v
             adjudication
                    |
                    v
          verification / receipts
```

The scheduler may choose fewer or more lanes based on evidence, task risk, provider availability, user policy, and compute—not an arbitrary Kodac-imposed quota.

## 25. No-artificial-limit compatibility

Nothing in this donor audit authorizes product-imposed daily, PR, file, or agent quotas.

A future Times skill/reviewer fabric should support:

- local-first execution;
- self-hosting;
- BYOK / BYOM;
- interchangeable providers;
- local models;
- parallel workers;
- distributed workers;
- work stealing;
- content-addressed caching;
- incremental evaluation;
- progressive findings;
- graceful degradation when compute/provider capacity is unavailable.

Qualification may limit unsafe capability scope. It must not become an artificial commercial review-exhaustion mechanism.

## 26. Donor disposition matrix

| Donor surface | Primary disposition | Rationale | Separate production/import gate required? |
|---|---|---|---|
| Whole repository | `STUDY_ONLY` | Useful reference; wholesale adoption would inherit unnecessary policy/harness coupling | Yes |
| `SKILL.md` anatomy / package pattern | `PORT` | Strong portable workflow representation; extend with Kodac governance metadata | Yes for copied source expression or runtime admission |
| Description `what + when` discipline | `PORT` | Improves discovery/routing metadata | Yes for implementation admission |
| Structural validators | `PORT` | Cheap deterministic qualification layer | Yes |
| Tier-2 positive/negative routing cases | `PORT` | Excellent catalog regression concept | Yes |
| TF-IDF implementation | `STUDY_ONLY` / selective `PORT` candidate | Useful cheap baseline, not semantic truth | Yes |
| Collision thresholds | `REFERENCE_ONLY` | Donor-specific values require Kodac benchmarks | Yes before canonical thresholds |
| Behavioral eval schema / fixtures / expectations | `PORT` | Strong evidence-oriented contract | Yes |
| Headless-Claude executor/grader | `BEHAVIORAL_REIMPLEMENTATION` | Provider-specific and permission-model-specific | Yes |
| Specialist personas | `BEHAVIORAL_REIMPLEMENTATION` | Useful lens definitions; must enter reviewer qualification | Yes |
| Parallel fan-out + merge | `REFERENCE_ONLY` | Valuable orchestration pattern, not universal architecture law | Yes for runtime orchestration feature |
| User-only sequential orchestration rule | `STUDY_ONLY` | Too restrictive for Times automation/swarm goals | N/A |
| Shared checklists | `REFERENCE_ONLY` | Useful eval corpus; not completion authority | Yes if copied/distributed |
| Root shared-reference packaging | `STUDY_ONLY` | Known per-skill portability weakness | N/A |
| Cross-harness packaging | `PORT` | Strategically useful compatibility/materialization pattern | Yes |
| Shell hooks / executable scripts | `STUDY_ONLY` | Effectful, must be capability-scoped and sandboxed | Explicit execution gate required |
| Donor `AGENTS.md` / rules | `STUDY_ONLY` | Inert donor data under KDO-P0 | N/A |

## 27. Risks

### R1 — Prompt package treated as trusted code

Mitigation: package discovery and installation never grants capability authority.

### R2 — Routing benchmark overfitting

Mitigation: deterministic tier + held-out semantic tier + production outcome tracking.

### R3 — Provider lock-in through evaluator

Mitigation: provider-neutral behavioral executor and grader contracts.

### R4 — Agent swarm becomes an expensive echo chamber

Mitigation: reviewer diversity, qualification, conflict/adjudication evidence, dynamic scheduler, and value-per-compute metrics.

### R5 — Portable skill silently depends on missing shared assets

Mitigation: explicit bundle/pack manifest and digest-addressed dependencies.

### R6 — Skill scripts bypass Trust Kernel

Mitigation: normalize requested effects into Kodac semantic capabilities; route every effect through mandatory K2 policy.

### R7 — Workflow checklist becomes completion authority

Mitigation: keep instruction, evidence, verification, and Done Gate truth distinct.

### R8 — Bulk-copy catalog creates duplicate/contradictory Kodac skills

Mitigation: overlap/collision review and per-skill qualification before admission.

## 28. Recommended follow-on components

No follow-on component is authorized by this audit. If Founder authorization is later given, the highest-value candidates are:

```text
A. KDO Skill Package + Provenance Contract
B. KDO Skill Structural Qualification Gate
C. KDO Skill Trigger/Collision Qualification Bench
D. KDO Provider-Neutral Behavioral Skill Eval Contract
E. KDO Skill Requested-Capability Derivation + Trust Admission
F. KDO Cross-Harness Skill Materializer
G. KDO Reviewer-Swarm Skill Adapter
H. KDO Skill Outcome / Regression Ledger
```

These should be sequenced behind active H4 work rather than disrupting the current R3G-B proof.

## 29. Benchmark requirement before a canonical winner claim

This audit does not claim that the donor's skill system is the best available implementation.

Before Kodac calls any routing/evaluation/materialization implementation a winner, benchmark it against relevant alternatives under ADR-0010 with exact pins, equal model/provider conditions where feasible, controlled tool permissions, cost/latency reporting, and raw artifacts.

Candidate comparison families may include other Agent Skills implementations, harness-native skill systems, internal Kodac-native baselines, and future community standards after separate source pinning.

## 30. Final decision

```text
DONOR: addyosmani/agent-skills
PIN: df1edb2e05487d0aa6d93c747141e0aed1187f25
TREE: b7329cdfe4510c199415339e69134ced1d7d2ca0
LICENSE SIGNAL: MIT
WHOLE-REPO DISPOSITION: STUDY_ONLY
PRODUCTION IMPORT AUTHORITY: NONE
DONOR EXECUTION AUTHORITY: NONE

HIGH-VALUE PORT / ADAPT CANDIDATES:
- portable skill anatomy
- structural qualification
- trigger positive/negative cases
- routing collision regression
- behavioral eval schema
- evidence-backed verification discipline
- cross-harness packaging patterns

REFERENCE / BEHAVIORAL REIMPLEMENTATION CANDIDATES:
- specialist personas
- parallel fan-out + adjudication patterns
- competing-hypothesis investigation patterns

REJECT DIRECT AUTHORITY ADOPTION:
- donor AGENTS/rules as Kodac governance
- installed skill == permission
- headless-Claude permission model as Kodac runtime authority
- executable hooks without explicit K2 qualification
- user-only orchestration as universal Times invariant

NEXT STEP:
PRESERVE THIS AS DONOR EVIDENCE ONLY.
DO NOT IMPORT OR EXECUTE DONOR CODE UNDER THIS AUDIT.
FINISH THE ACTIVE H4-R3G-B GATE BEFORE ANY SKILL-FABRIC IMPLEMENTATION TRACK.
```
