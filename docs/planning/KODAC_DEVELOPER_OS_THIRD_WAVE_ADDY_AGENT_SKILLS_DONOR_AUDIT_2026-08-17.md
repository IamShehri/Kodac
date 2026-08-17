# Kodac Developer OS — Third-Wave Addy Agent Skills Donor Audit

## Record identity

```text
Status: AUDIT CANDIDATE — DOCS ONLY
Date: 2026-08-17
Program authority: KDO-P0 — Developer OS Donor Intake & Capability Superset Authorization
Canonical Kodac base: 61ffbfe4613a4dd05685909999c395a92a581df6
Canonical Kodac base tree: 1ccc3a6b282caa1e2a2689822745bdcf6e15e29a
Production donor-code import authority from this record: NONE
Donor execution authority from this record: NONE
```

This record audits `addyosmani/agent-skills` as a potential donor for Kodac's future Agent Skills compatibility, skill qualification, workflow orchestration, and engineering-discipline layers.

It does **not** authorize copying the repository wholesale, installing the plugin, executing donor scripts, running donor evals, invoking donor hooks, importing donor code into production, changing K2, or widening any existing Kodac authority surface.

Core KDO-P0 invariant remains:

```text
DONOR CAPABILITY MAY BE ACQUIRED.
DONOR AUTHORITY IS NEVER INHERITED.
```

And for this donor specifically:

```text
A SKILL IS PORTABLE WORKFLOW DATA.
A SKILL IS NOT EXECUTION AUTHORITY.
A ROUTER DECISION IS NOT AUTHORIZATION.
A PERSONA IS NOT TRUST.
AN EVAL PASS IS NOT KODAC DONE-GATE PROOF.
```

---

## 1. Why this donor matters

Kodac already has an accepted architectural decision in ADR-0007 to support Agent Skills as a first-class compatibility boundary behind Kodac-owned adapters.

The Addy Agent Skills repository is therefore not merely a collection of prompts. At the pinned revision it exposes a coherent engineering system around portable skills:

- a canonical markdown skill representation;
- lifecycle-oriented workflow decomposition;
- intent-to-skill routing guidance;
- reusable engineering personas;
- orchestration patterns;
- cross-agent packaging surfaces;
- deterministic catalog validation;
- routing and collision evaluation;
- behavioral skill evaluation using fixtures and traces;
- anti-rationalization and verification discipline;
- source-driven and doubt-driven engineering workflows.

The highest-value lesson is not any individual skill body. It is the treatment of **skills as testable engineering artifacts rather than unversioned prompt prose**.

That direction is strongly compatible with Kodac's existing provenance, KRI qualification, Capability Registry, K2, and Done Gate architecture.

---

## 2. Exact upstream source pin

```text
Repository:
https://github.com/addyosmani/agent-skills

Observed default branch:
main

Pinned source commit:
df1edb2e05487d0aa6d93c747141e0aed1187f25

Pinned source tree:
b7329cdfe4510c199415339e69134ced1d7d2ca0

Observed release/plugin version at the pin:
0.6.7

Pinned commit message:
chore(release): bump plugin manifests to 0.6.7

Observed GitHub commit signature verification state:
unsigned
```

The unsigned commit state is recorded as provenance evidence. It does not prevent source study, but the Git commit hash alone must not be misrepresented as an upstream cryptographic author signature.

Representative pinned blobs inspected:

```text
README.md
f31b37f7fc881e76cf9ba9cedd74efad27d4d255

LICENSE
 d67778ada6b9cda6227e9130da182c13e73c8b2e

AGENTS.md
 e97670ed868e90b73753fafbe305cdabc7f55ad3

.codex-plugin/plugin.json
2b699a252f64d9d06a730661f106d3f30049d2d8

skills/using-agent-skills/SKILL.md
b250b29776bbfac94d4a50baabaf962862cab51a

skills/doubt-driven-development/SKILL.md
ea46342cfe6a8145a961260836629c3a3fca01e2

references/orchestration-patterns.md
09cddd31c67b476215c7e07ca3b641343dbe05c2

evals/README.md
d67a025d0b2a1867e37d7f31b39dd5db344df294

scripts/run-evals.js
80138873f953f780fb0821e8e601ae1d7550c446
```

The recursive pinned tree was inspected as source data. No donor code or script was executed under this audit.

---

## 3. Rights and license posture

Repository-level license evidence at the pinned revision is MIT, copyright 2025 Addy Osmani.

Preliminary rights disposition:

```text
REPOSITORY-LEVEL STUDY:
RIGHTS SIGNAL SUFFICIENT FOR AUDIT

DIRECT SOURCE EXPRESSION INTAKE:
NOT AUTHORIZED BY THIS RECORD

FUTURE COMPONENT IMPORT:
REQUIRES COMPONENT-SCOPED RIGHTS / NOTICE / DEPENDENCY REVIEW
```

MIT permits broad reuse subject to its notice conditions, but KDO-P0 explicitly separates license permission from trust and execution authority.

Therefore:

```text
MIT != QUALIFIED
MIT != TRUSTED
MIT != K2 AUTHORITY
MIT != WHOLESALE IMPORT AUTHORIZATION
```

Any later direct source import must bind the exact donor files, source revision, notices, dependency boundary, copied expression, Kodac modifications, and required attribution through a separate component gate.

---

## 4. Audit safety posture

This audit performed source/document inspection only.

Not authorized or performed by this record:

- plugin installation;
- `npx` installation flows;
- package installation;
- donor hook execution;
- donor shell-script execution;
- donor CI execution;
- `scripts/run-evals.js` execution;
- headless Claude execution;
- behavioral evaluator execution;
- network activity initiated by donor code;
- credential discovery;
- modification of Kodac runtime code;
- modification of current H4-R3G-B implementation authority.

All donor `AGENTS.md`, `SKILL.md`, commands, hooks, prompts, and process rules were treated as untrusted data, not instructions to Kodac governance.

---

## 5. Canonical Kodac constraints applied to this audit

### ADR-0007 — Agent Skills compatibility

Kodac already requires the dependency direction:

```text
External Agent Skill
        ↓
Kodac-owned adapter
        ↓
Kodac Canonical Protocol / Capability Registry
        ↓
ExecutionGateway / Trust Kernel when effects occur
```

This donor may improve the external representation, qualification, routing, and workflow layers. It must not invert that dependency direction.

### ADR-0010 — benchmark-first donor selection

Popularity, author reputation, GitHub stars, or apparent workflow quality do not establish donor superiority.

Any future component described as `best`, `winner`, or `superior` must be benchmarked against realistic alternatives or explicitly documented as provisional.

### KDO-P0 — donor authority separation

No donor skill, script, hook, persona, slash command, router, or evaluator receives Kodac side-effect authority by adoption.

---

## 6. Observed donor architecture

The pinned repository organizes three distinct conceptual layers:

```text
Skills
  workflows / process / exit criteria

Personas
  specialist role / perspective / report format

Commands / intent mapping
  orchestration entry point
```

The repository also contains cross-agent packaging and compatibility surfaces, including plugin/manifests or guidance for multiple coding-agent environments.

Observed lifecycle framing:

```text
DEFINE
  ↓
PLAN
  ↓
BUILD
  ↓
VERIFY
  ↓
REVIEW
  ↓
SHIP
```

This decomposition is useful as a product/workflow reference, but Kodac must preserve its own canonical event, evidence, capability, trust, and completion semantics.

---

## 7. Highest-value donor capability: evaluated skills

The donor's evaluation system is the strongest candidate capability identified in this audit.

At the pinned revision its skill evaluation model has three tiers:

```text
Tier 1 — Structural
  frontmatter
  naming
  required sections
  command parity

Tier 2 — Trigger / Routing
  positive trigger prompts
  negative trigger prompts
  pairwise owner outranking
  catalog collision detection
  rank-1 quality floor

Tier 3 — Behavioral
  real fixtures
  throwaway repositories
  execution or dialogue artifacts
  full agent execution traces
  expectation-based grading
```

The deterministic routing lane uses a lightweight lexical approximation based on stemmed TF-IDF and cosine similarity. The donor explicitly does not claim that this is a semantic router.

Observed routing safeguards include:

- positive trigger cases;
- negative trigger cases;
- top-k expectations;
- pairwise owner outranking;
- rank-1 regression floor;
- description collision warnings/errors;
- complete case-file coverage requirements.

Observed behavioral-eval safeguards include:

- fixtures for execution workflows;
- throwaway Git repositories;
- executor and grader timeouts;
- trace grading against explicit expectations;
- JSON grader-output validation;
- untrusted-trace fencing;
- pressure cases for time pressure, sunk cost, and authority pressure.

This provides a compelling model for a Kodac-native **Skill Qualification Engine**, but the donor implementation is not provider-neutral because its behavioral tier invokes headless Claude.

---

## 8. Proposed Kodac-native Skill Fabric

The donor suggests a missing future abstraction that fits directly above Kodac's existing Capability Registry and K2 boundary:

```text
             Portable Skill Source
          SKILL.md / refs / assets
                    │
                    ▼
          Skill Parser + Validator
                    │
                    ▼
          Canonical Skill Identity
      content + provenance + license
                    │
                    ▼
        Trigger / Routing Qualification
                    │
                    ▼
         Behavioral Qualification
     model/provider/config/environment
                    │
                    ▼
          Kodac Capability Registry
                    │
                    ▼
     Evidence-Governed Orchestrator
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
      Agent       Model       Tools
        │           │           │
        └───────────┼───────────┘
                    ▼
             K2 for effects
                    │
                    ▼
          Receipts / KRI / Done Gate
```

The critical semantic separation is:

```text
SKILL SAYS WHAT WORKFLOW IS REQUESTED.
CAPABILITY REGISTRY SAYS WHAT OPERATIONS EXIST.
K2 SAYS WHAT EFFECTS ARE AUTHORIZED.
EVIDENCE SAYS WHAT HAPPENED.
DONE GATE SAYS WHETHER COMPLETION IS PROVEN.
```

A donor skill must never collapse these layers.

---

## 9. Proposed canonical skill identity surface

A future Kodac-native skill record should be stronger than a raw directory of markdown files.

Candidate identity-bearing fields:

```text
skill format version
portable skill name
portable skill description
canonical source bytes / manifest
supporting asset identities
source repository identity
source commit / release identity
license / notice identity
requested semantic capabilities
filesystem scope request
network scope request
secret requirements
compatible model/provider requirements
trigger corpus identity
behavioral fixture corpus identity
qualification policy identity
qualification report identity
```

A useful high-level definition is:

```text
QUALIFIED SKILL
=
WORKFLOW
× CONTRACT
× PROVENANCE
× REQUESTED CAPABILITIES
× EVAL CORPUS
× QUALIFICATION EVIDENCE
```

No field in this record grants execution authority.

---

## 10. Skill routing: what to adapt and what not to copy

### Valuable donor behavior

The donor treats routing quality as something that can regress and therefore should be evaluated.

Kodac should adapt:

- realistic user-intent trigger corpora;
- explicit negative examples;
- pairwise routing ownership;
- collision detection;
- regression floors;
- per-version routing qualification;
- cheap deterministic routing tests in CI.

### What Kodac should not universalize

The donor `AGENTS.md` uses a strong rule equivalent to invoking a skill whenever there is even a small chance that one applies.

Kodac should **not** inherit that as a hard runtime invariant.

Why:

- false-positive skill routing can increase latency and context cost;
- multiple skills may conflict;
- routing itself can become a bottleneck;
- irrelevant workflow injection can degrade model quality;
- a skill may request capabilities the current trust policy cannot admit;
- local/self-hosted users may choose different compute budgets.

Kodac should instead make routing an observable, qualified, revisable decision with fallback behavior.

Candidate rule:

```text
ROUTING IS ADVISORY SELECTION.
AUTHORITY IS SEPARATE.
ROUTING FAILURE MUST DEGRADE GRACEFULLY.
```

---

## 11. Doubt-driven development: high-value behavioral donor

The donor's `doubt-driven-development` skill contains a particularly useful independent-review pattern:

```text
CLAIM
  ↓
EXTRACT ARTIFACT + CONTRACT
  ↓
FRESH ADVERSARIAL REVIEW
  ↓
RECONCILE AGAINST ARTIFACT
  ↓
STOP / ESCALATE
```

The high-value design is that the fresh reviewer can receive the artifact and contract **without the original author's reasoning**, reducing confirmation bias.

Other useful behaviors:

- bias the reviewer toward disproving the current claim;
- keep review bounded rather than recursively spawning review forever;
- treat reviewer output as evidence to reconcile, not final truth;
- require explicit user authorization before cross-model external execution in the donor environment.

This aligns strongly with Kodac's KRI principle:

```text
REVIEWER OUTPUT IS EVIDENCE.
REVIEWER OUTPUT IS NOT COMPLETION AUTHORITY.
```

### Kodac adaptation

Kodac can generalize this into an evidence-governed independent-review primitive:

```text
Author Agent
  produces candidate artifact + claim
        │
        ▼
Evidence Boundary
  strips author rationale when policy requests independence
        │
        ▼
Independent Reviewer(s)
  same or different provider/model
        │
        ▼
KRI Finding / Disagreement Evidence
        │
        ▼
Adjudication / Verification
```

This can later support exact-head CodeRabbit/Qodo/Greptile/Cubic-like independent review, local models, and model swarms without making any reviewer sovereign.

---

## 12. Orchestration patterns: useful taxonomy, platform-specific limits

The donor distinguishes several patterns including:

- direct single-persona invocation;
- command-to-persona delegation;
- parallel fan-out with merge;
- sequential lifecycle orchestration;
- research isolation;
- collaborative hypothesis challenge through compatible team mechanisms.

This taxonomy is useful.

However, the donor also makes platform-specific rules such as:

```text
personas do not invoke personas
user / slash command is the orchestrator
subagents cannot spawn subagents
teams cannot nest
```

These must **not** become universal Kodac/Times architecture constraints.

They describe limitations and deliberate design choices of the donor's supported harnesses, especially Claude-oriented orchestration.

Kodac's future orchestration system should instead support a provider-neutral graph while controlling authority and resource use centrally.

Candidate Kodac rule:

```text
AGENTS MAY REQUEST DELEGATION.
THE ORCHESTRATOR OWNS SCHEDULING.
K2 OWNS EFFECT AUTHORITY.
NO CHILD AGENT INHERITS PARENT AUTHORITY IMPLICITLY.
```

This preserves future swarms without recursive trust inheritance.

---

## 13. Cross-harness packaging: strategically important

The repository demonstrates one canonical skill collection exposed to multiple coding-agent environments through lightweight packaging/manifests and platform-specific entry points.

That is strategically aligned with ADR-0007.

Kodac should avoid maintaining separate semantic copies of the same skill for each client.

Preferred future direction:

```text
Canonical Kodac Skill
        │
        ├── Claude-compatible adapter
        ├── Codex-compatible adapter
        ├── Cursor-compatible adapter
        ├── OpenCode-compatible adapter
        ├── Gemini-compatible adapter
        └── other Agent Skills-compatible surfaces
```

The adapters may transform packaging and invocation metadata, but must not silently alter the skill's identity-bearing workflow or requested capabilities.

---

## 14. Relationship to Kodac's current runtime

Canonical main already contains relevant primitives that reduce the amount of donor code Kodac should import:

- `packages/kodac-runtime/src/extensions/contracts.ts`;
- `packages/kodac-runtime/src/extensions/registry.ts`;
- `packages/kodac-runtime/src/runtime/orchestrator.ts`;
- `packages/kodac-runtime/src/agent/*`;
- `packages/kodac-runtime/src/reviewer-intelligence/*`;
- provider qualification machinery;
- K2 ExecutionGateway;
- evidence receipts;
- verification / Done Gate machinery.

Therefore the donor should not become an alternate runtime spine.

The likely value is to **port selected skill-format, qualification, routing-test, and orchestration ideas into Kodac-owned contracts**.

---

## 15. Component-by-component primary KDO-P0 disposition

Each component receives one primary KDO-P0 intake disposition.

| Component | Primary disposition | Audit rationale |
|---|---|---|
| Repository as a whole | `STUDY_ONLY` | Do not wholesale-fork a workflow catalog into Kodac runtime. |
| Portable `SKILL.md` anatomy and supporting-asset organization | `PORT` | Strong compatibility/reference value; Kodac needs stronger provenance and capability metadata. |
| Structural skill validators | `PORT` | Useful deterministic CI behavior; must target Kodac canonical skill contract. |
| Tier-2 trigger/routing evaluation design | `PORT` | Cheap deterministic regression lane is valuable; implementation/metrics should become Kodac-owned. |
| Routing collision detection | `PORT` | Useful catalog hygiene and measurable failure mode. |
| Behavioral eval schema / expectation model | `PORT` | Strong qualification primitive; must become provider-neutral and evidence-bound. |
| Claude-specific behavioral executor | `STUDY_ONLY` | Provider-specific execution surface conflicts with BYOM/BYOK neutrality. |
| Cross-harness packaging/manifests | `BEHAVIORAL_REIMPLEMENTATION` | Preserve compatibility behavior without making donor packaging canonical internally. |
| `using-agent-skills` routing discipline | `BEHAVIORAL_REIMPLEMENTATION` | Useful intent/process behaviors but donor absolutism should not become hard authority. |
| `doubt-driven-development` workflow | `BEHAVIORAL_REIMPLEMENTATION` | High-value independent-review behavior; Kodac should express it through KRI/evidence. |
| orchestration pattern taxonomy | `STUDY_ONLY` | Valuable vocabulary/reference; platform constraints are not universal. |
| code-reviewer / security-auditor / test-engineer personas | `STUDY_ONLY` | Useful benchmark prompts/personas, but Kodac already owns reviewer contracts and qualification. |
| anti-rationalization pattern | `BEHAVIORAL_REIMPLEMENTATION` | Useful discipline mechanic; should be adapted to policy/evidence rather than copied blindly. |
| generic lifecycle skills | `STUDY_ONLY` | Useful UX/reference library; not automatically core runtime behavior. |
| donor hooks | `STUDY_ONLY` | Hooks are executable/authority-sensitive and require separate gates. |

No row above authorizes production import.

---

## 16. COPY / ADAPT / REFERENCE / REJECT translation

For product planning, the donor can also be summarized in the informal four-way map requested during third-wave discovery.

### COPY candidate — only after separate component authorization

No whole subsystem is approved for literal copying by this audit.

Potential future small direct-expression candidates under MIT may exist in validators or schemas, but they must pass component-specific source/license/dependency/benchmark gates first.

Canonical KDO-P0 equivalent:

```text
DIRECT_IMPORT CANDIDATE — NOT YET AUTHORIZED
```

### ADAPT

Highest-priority adaptation candidates:

- skill anatomy;
- deterministic skill validation;
- trigger/routing eval corpus;
- collision detection;
- behavioral fixture/eval contracts;
- pressure/authority eval cases;
- independent doubt-driven review;
- cross-harness skill packaging;
- explicit orchestration topology selection;
- progressive disclosure for skill context.

### REFERENCE ONLY

- Claude subagent limitations;
- Claude Agent Teams behavior;
- headless `claude` Tier-3 executor;
- donor-specific slash-command UX;
- individual frontend/web-performance heuristics;
- donor's user-as-orchestrator assumption;
- donor-specific persona prompts.

### REJECT as universal Kodac invariant

Kodac should not canonically inherit:

```text
"personas never invoke personas"
"the user is always the orchestrator"
"invoke a skill at even 1% applicability"
"skill selection grants permission"
"plugin installation implies trust"
"one provider-specific evaluator defines qualification"
"a successful workflow narration proves completion"
"copy the entire catalog into the trusted runtime"
```

---

## 17. Proposed future component gates

This audit recommends **no immediate production implementation during active H4-R3G-B**.

After current trust work closes, the strongest follow-on candidates are:

### AS-1 — Portable Skill Contract & Identity

Goal:

```text
parse Agent Skills-compatible packages
bind exact source/provenance/assets
normalize requested capabilities
produce deterministic immutable SkillIdentity
```

No execution.

### AS-2 — Deterministic Skill Structural Validator

Goal:

- schema/frontmatter validation;
- bounded supporting asset inventory;
- path traversal rejection;
- duplicate/ambiguous field rejection;
- canonical serialization/identity;
- no hooks/scripts executed.

### AS-3 — Skill Trigger & Collision Qualification

Goal:

- positive/negative routing corpus;
- deterministic baseline lane;
- rank and collision metrics;
- false-positive/false-negative evidence;
- corpus and policy identities;
- qualification report identity.

### AS-4 — Provider-Neutral Behavioral Skill Qualification

Goal:

- execution/dialogue eval contracts;
- fixture identities;
- sandboxed K2 execution when effects are authorized;
- BYOM/BYOK provider matrix;
- exact provider/model/config identity;
- bounded trace evidence;
- expectation grading;
- disagreement/variance tracking;
- no single model self-authorizes a skill.

### AS-5 — Skill Registry & Cross-Harness Adapters

Goal:

- distribute one canonical skill identity;
- render supported client packaging;
- preserve provenance/license/trust metadata;
- separate compatibility status from trust status.

### AS-6 — Evidence-Governed Multi-Agent Orchestration

Goal:

- parallel fan-out;
- specialist reviewer sets;
- debate/adjudication where useful;
- cost/latency-aware scheduling;
- no implicit authority inheritance;
- K2-mediated side effects;
- KRI/Done Gate integration.

Each of AS-1 through AS-6 requires a separate authorization before production code changes.

---

## 18. Benchmark requirements before canonical component selection

Per ADR-0010, Addy Agent Skills should not be declared the winning source for any contested component without evidence.

Candidate comparisons for future gates:

### Skill representation / packaging

Compare against:

- the underlying Agent Skills specification/ecosystem baseline;
- Anthropic skill tooling where applicable;
- other portable skill registries/formats admitted later.

Measure:

- parse determinism;
- compatibility;
- metadata completeness;
- provenance fidelity;
- capability-request expressiveness;
- portability;
- migration stability.

### Skill routing

Measure:

- rank-1 accuracy;
- top-k recall;
- false-positive rate;
- negative-owner accuracy;
- collision rate;
- latency;
- CPU/memory;
- semantic ambiguity handling;
- cross-language prompt behavior.

A lexical TF-IDF lane should be considered a deterministic guardrail, not necessarily the final router.

### Behavioral qualification

Measure:

- expectation precision/recall;
- grader stability;
- cross-model variance;
- false qualification rate;
- adversarial prompt resistance;
- pressure-case compliance;
- tool-use policy compliance;
- cost/latency;
- reproducibility.

---

## 19. No-Kodac-imposed-artificial-limits compatibility

The donor's skill/eval architecture can be adapted without creating product-imposed review or agent quotas.

A future Kodac skill/orchestration system should preserve:

```text
NO KODAC-IMPOSED ARTIFICIAL LIMITS.
```

Qualification and scheduling may use real compute budgets, explicit user policy, provider constraints, or hardware constraints, but must not introduce arbitrary product scarcity.

For orchestration:

```text
UNLIMITED BY POLICY.
ADAPTIVE BY INTELLIGENCE.
BOUNDED ONLY BY ACTUAL AUTHORIZED COMPUTE / PROVIDER / HARDWARE CONSTRAINTS.
```

The scheduler should learn or estimate when an additional skill/agent/reviewer provides expected value rather than refusing because a vendor quota was invented by Kodac.

---

## 20. Security and trust gaps that Kodac must close

Before executable Agent Skills can enter Kodac, Kodac must provide stronger controls than a markdown-first catalog normally requires.

Required future controls include:

- exact content-addressed skill identity;
- supporting-asset inventory and digest binding;
- path traversal rejection;
- symlink/host escape policy;
- requested capability normalization;
- script/hook execution classification;
- network policy declaration;
- secret-access declaration;
- dependency/source pinning;
- sandbox requirements;
- K2 authorization for every effect;
- immutable execution receipts;
- model-visible skill snapshot evidence;
- skill version migration/deprecation rules;
- compromised/upstream-revoked skill handling;
- qualification expiration or requalification policy after material changes.

A skill update must not silently preserve trust merely because its name is unchanged.

Candidate invariant:

```text
SKILL NAME IS UX.
SKILL IDENTITY IS CONTENT + PROVENANCE + POLICY-RELEVANT METADATA.
```

---

## 21. Product opportunity: Times/Kodac Skill Network

The donor architecture supports a larger product opportunity if implemented through Kodac's stronger trust model.

Possible future surface:

```text
Skill Registry
  ├── community skills
  ├── team-private skills
  ├── repository-local skills
  ├── built-in Kodac skills
  └── imported Agent Skills-compatible packages

Every skill shows:
  source
  version
  digest
  license
  requested capabilities
  qualification matrix
  supported models/providers
  benchmark history
  trust status
  last verified commit
```

A skill could then be portable across multiple AI CLIs while Kodac supplies the qualification, trust, routing, evidence, and orchestration layer.

That is substantially more defensible than merely shipping another prompt directory.

---

## 22. Relationship to active PR #109 / H4-R3G-B

This audit is intentionally independent from current H4-R3G-B work.

It does not authorize any change to:

- `ExecutionGateway`;
- gVisor source-lineage observation;
- ctr/containerd/rootfs trust surfaces;
- H4-R3G-B evidence semantics;
- protected blob pins;
- current pre-ledger path allowlist;
- current evidence-ledger gate.

No Addy Agent Skills production code should be introduced into PR #109.

H4-R3G-B must close under its existing canonical authorization before a new executable Agent Skills slice is considered.

---

## 23. Audit conclusions

### Strong findings

1. `addyosmani/agent-skills` is a **high-priority study/port donor** for Kodac's future Agent Skills layer.
2. Its most strategically valuable subsystem is the **skill evaluation architecture**, especially deterministic routing/collision regression plus fixture-backed behavioral qualification.
3. The repository's markdown-first portability and multi-client packaging align directly with ADR-0007.
4. `doubt-driven-development` provides a useful independent-review pattern that maps naturally onto KRI when adapted rather than blindly copied.
5. The orchestration taxonomy is useful, but its Claude/platform constraints must not become Kodac universal invariants.
6. The donor should not become an alternate runtime, trust kernel, capability registry, reviewer authority, or Done Gate.
7. No production import is justified by this audit alone.

### Recommended canonical disposition

```text
WHOLE REPOSITORY:
STUDY_ONLY

SKILL CONTRACT / VALIDATION / ROUTING-EVAL / BEHAVIORAL-EVAL CONCEPTS:
PORT CANDIDATES

CROSS-HARNESS PACKAGING:
BEHAVIORAL_REIMPLEMENTATION CANDIDATE

DOUBT-DRIVEN REVIEW:
BEHAVIORAL_REIMPLEMENTATION CANDIDATE

CLAUDE-SPECIFIC EXECUTION / TEAM LIMITS:
STUDY_ONLY

PRODUCTION SOURCE IMPORT:
NOT AUTHORIZED
```

### Recommended future theorem

Kodac should aim for:

```text
ANY COMPATIBLE SKILL
× ANY QUALIFIED MODEL
× ANY SUPPORTED CLIENT
× KODAC-OWNED CAPABILITY NORMALIZATION
× K2-CONTROLLED EFFECTS
× EVIDENCE-BOUND EXECUTION
× REPRODUCIBLE QUALIFICATION
=
PORTABLE ENGINEERING INTELLIGENCE WITHOUT INHERITED DONOR AUTHORITY
```

---

## 24. Exit state

```text
ADDY_AGENT_SKILLS_SOURCE_PINNED = YES
ADDY_AGENT_SKILLS_TREE_PINNED = YES
REPOSITORY_LICENSE_SIGNAL = MIT
DONOR_CODE_EXECUTED = NO
DONOR_HOOKS_EXECUTED = NO
KODAC_RUNTIME_CHANGED = NO
PRODUCTION_IMPORT_AUTHORIZED = NO
WHOLE_REPO_DISPOSITION = STUDY_ONLY
SKILL_QUALIFICATION_DESIGN = PORT_CANDIDATE
DOUBT_DRIVEN_REVIEW = BEHAVIORAL_REIMPLEMENTATION_CANDIDATE
CROSS_HARNESS_PACKAGING = BEHAVIORAL_REIMPLEMENTATION_CANDIDATE
H4_R3G_B_SCOPE_CHANGED = NO
```

This record is ready for independent review as a docs-only donor audit. It must not be interpreted as a component-admission gate or implementation authorization.