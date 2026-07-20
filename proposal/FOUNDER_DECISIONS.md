# Founder Decisions — Kernux S0-C Ratification

*Status: Ratified — S0-C Founder Ratification (2026-07-20).*

## Decision date

2026-07-20

## Ratification status

**S0-C: Ratified.** The Kernux reboot direction is **approved**. This document records the ratified product boundary, scope, and integrity rules. It does **not** authorize product implementation; see *Implementation authorization status* below.

## Ratified positioning

- **Public positioning:** "Kernux — The open, evidence-backed guide to AI coding agents."
- **Primary tagline:** "Compare AI coding agents using evidence, not marketing."
- **Internal category:** "An open evidence and decision layer for AI coding agents."

### Defensible problem statement (canonical)

> Evidence about AI coding agents is fragmented across vendor documentation, academic benchmarks, community comparisons, and marketing claims. Kernux normalizes that evidence into sourced profiles, reproducible configuration-specific runs, and decision-oriented comparisons.

Kernux does **not** claim to fill a gap that no other project covers.

### SWE-bench positioning (permanent language)

> Kernux is complementary to SWE-bench and other academic benchmarks. SWE-bench measures performance on real GitHub issues under its methodology. Kernux focuses on product capabilities, operating conditions, provenance, configuration-specific evidence, decision support, and controlled tasks. Kernux must not market its controlled tasks as a SWE-bench replacement.

## Exact v1 scope

### Ratified product boundary

Kernux **is**:

- a source-cited agent profile index;
- a normalized comparison matrix;
- a controlled evaluation lab;
- a repository of reproducible run evidence;
- a publisher of dated analytical reports;
- an open community process for challenging and correcting claims.

Kernux **is not**:

- a replacement for SWE-bench;
- a universal coding-agent benchmark;
- another AI coding agent;
- an agent framework;
- a skills marketplace;
- an awesome list;
- a generic AI course;
- an overall ranking service;
- a pay-to-rank directory.

### V1 agent set (exactly ten launch profiles)

1. OpenAI Codex
2. Anthropic Claude Code
3. Google Gemini CLI
4. GitHub Copilot
5. Cursor
6. Windsurf
7. OpenCode — pinned to https://github.com/anomalyco/opencode (distinct from the archived https://github.com/opencode-ai/opencode)
8. Aider
9. Cline
10. OpenHands

### Controlled tasks

Ten all-original fixtures, called **"Controlled Evaluation Tasks."** They are **not** described as real-world benchmark tasks, not representative of all software engineering, and not proof of production performance. Each carries provenance, license, immutable revision/digest, prompt, acceptance criteria, automated verification where possible, time/resource budget, permitted/prohibited actions, expected evidence artifacts, and documented limitations.

## Excluded scope

- **Devin** is excluded from v1. It may be reconsidered later as a vendor-profiled entry when sufficient independently checkable evidence is available.
- **Overall "Kernux Score"**: permanently excluded. Comparisons are decision-oriented (e.g., best-documented free option, privacy characteristics, local-model capability, terminal support, headless/CI support, permission/sandbox controls, model-provider flexibility, independently reproduced controlled-task results). None are universal winner declarations.
- **In-repo executable verification runtime** for v1 (Kernux Proof remains reserved).
- **A hosted website/backend/database** for v1.

## Product tracks

Agents are compared within and across tracks, never flattened into one uniform category. At minimum:

- terminal agents;
- IDE-integrated agents;
- cloud or asynchronous agents;
- open-source agent scaffolds;
- privacy-first or local-capable agents.

An agent may belong to multiple tracks.

## Canonical data format

- **YAML** is the canonical representation for profiles and run metadata.
- **JSON Schema** is used for validation.
- Markdown profiles, README tables, and any website pages are **generated views**.
- Human-readable Markdown is **not** the canonical database.
- **Python** is the only repository tooling language for v1.
- **No database** is introduced in v1.

## Run identity

Every result is bound to a complete configuration tuple:

- agent name;
- agent version;
- underlying model;
- model version when available;
- subscription, API, or service tier;
- execution mode;
- configuration;
- permissions;
- operating system;
- hardware or relevant runtime environment;
- task-set revision;
- fixture commit or digest;
- execution date;
- cost methodology;
- evidence-bundle digest.

A configuration-specific result is **never** attributed to an agent universally.

## Vendor submissions

Vendor-submitted profiles and runs are allowed. They must be labeled exactly one of:

- `vendor-submitted`;
- `independently-unreproduced`;
- `independently-reproduced`.

Vendor-submitted, independently-unreproduced runs must **not** appear in the primary reproduced-results view. Commercial sponsors may **not** alter schemas, methodology, inclusion criteria, evidence status, comparisons, or editorial conclusions.

## Commercial integrity rules (permanent prohibitions)

- No paid ranking.
- No paid placement inside comparative results.
- No affiliate ranking.
- No undisclosed sponsorship.
- No purchasing of stars, forks, reviews, or community activity.

Infrastructure and report sponsorship may be considered later only with clear disclosure and editorial independence.

## Evidence rules

- Evidence before claims; official sources before secondary.
- Every factual profile field carries a source URL and a verification date.
- Verified facts are separated from vendor-reported claims.
- `unknown` and `stale` are different states; both are first-class.
- No unsupported phrases ("production-ready," "fully secure," compliance/certification claims Kernux cannot back).
- No AI-generated factual fields; AI may assist prose only.

### Freshness policy

| Class | Window | Fields |
|-------|--------|--------|
| 1 | 30 days | price; subscription tiers; current versions; available models; documented data retention. |
| 2 | 90 days | capabilities; integrations; MCP and skills support; execution modes; sandbox and permission behavior. |
| 3 | 180 days | lower-volatility historical and organizational fields. |

Expired fields are visibly marked **STALE**.

## Launch strategy

A coordinated, **non-spam** launch. The launch package may include tailored submissions for Hacker News, relevant subreddits, Lobsters, LinkedIn, X, and direct, transparent notification to maintainers whose products are profiled.

**No launch is authorized** until the repository contains useful sourced data **and** at least one complete reproducible evidence path.

## Legacy disposition

- The trust-kernel and OmniBridge proposals are **historical**.
- They will **not** be mixed into the new main product identity.
- They must be preserved through an explicit archival branch or equivalent recoverable Git mechanism **in a later, separately authorized operation**.
- **This ratification pass must not move, copy, delete, commit, or push them.**

## Implementation authorization status

> **Phase 1 authorized (2026-07-20).** Everything outside Phase 1 remains unauthorized.

### Phase 1 — Agent Profile Vertical Slice (authorized 2026-07-20)

Authorized scope:

> One OpenCode profile, agent-profile JSON Schema, validation tooling, deterministic Markdown generation, tests, and root README integration.

Phase 1 produces one complete, deterministic path:

```
official OpenCode sources
→ canonical profile.yaml
→ JSON Schema validation
→ custom evidence-policy validation
→ generated Markdown comparison matrix
→ automated tests
→ updated root README
```

Phase 1 remains bound by the ratified strategy: no overall score, no SWE-bench-replacement language, evidence before claims, `unknown` and `stale` as distinct first-class states, 30/90/180-day freshness policy, and no paid ranking/placement.

### Still unauthorized

- All other agent profiles (the remaining nine of the v1 set).
- Controlled Evaluation Tasks.
- Runs and benchmark execution.
- Website, CI (beyond the local Python toolchain), API, database, registry, badges, and launch.
- Phase 2 requires separate founder authorization.

Legacy archival has been completed locally on `archive/trust-kernel-s0b` (`fd6d805…`) and `archive/omnibridge-pre-reboot` (`60df880…`). The legacy material is preserved and is not mixed into this product identity.

### Phase 1-R — Evidence Contract Correction (authorized 2026-07-21)

Phase 1-R is a correction inside the already authorized Phase 1 scope. It hardens the evidence contract to distinguish evidence from marketing **mechanically**, not merely in prose:

- first-class `unknown` fixed (no overlapping `oneOf` branches);
- `claim_status` required on every factual field type;
- `verification_method` added to every evidence record, with a mechanical claim_status compatibility mapping;
- `content_sha256` required on every evidence record (digest of the actual retrieved response bytes);
- raw GitHub URLs must be pinned to 40-character commit SHAs;
- bidirectional `fields_supported` mapping enforced;
- `evidence_status` and `last_verified` are derived by tooling, not authored;
- field-specific freshness classes enforced;
- behavioral documentation fields are `vendor-reported`, not `verified`;
- absence of documentation produces `unknown`, not a negative vendor claim;
- matrix exposes claim status per cell (a claim-status change changes matrix bytes).

Phase 1-R is complete locally only after the correction commit. **Final independent acceptance remains pending.** Phase 2 remains unauthorized.

### Phase 1-R2 — Evidence Contract Closure (authorized 2026-07-21)

Phase 1-R2 is a narrowly scoped closure inside the already authorized Phase 1 scope. It fixes six independently reproduced evidence-contract defects that allowed adversarial mutations to pass validation:

1. authority/verification_method relabeling could upgrade vendor docs to `verified`;
2. secondary authority could use `official-documentation` and support vendor-reported facts;
3. `claim_status: disputed` passed without a matching `notes.disputes` record;
4. empty list values passed and could render as `unknown · vendor-reported`;
5. `identity.official_url` accepted malformed non-URL strings;
6. dynamic GitHub API endpoints could be marked `immutable: true`.

Phase 1-R2 implements centralized authority/method/field compatibility, a full dispute contract, list/surface invariants, URL-shaped identity fields, a mechanical immutability contract, exact evidence mapping (no `allow_unused_records`), deterministic error ordering, and a document-consistency check. All twelve proposal documents are reconciled to the implemented state.

Phase 1-R2 is complete locally only after the correction commit. **Phase 1-R2 independent acceptance was not granted.** Phase 2 remains unauthorized.

### Phase 1-R2A — Dispute and Immutability Closure (authorized 2026-07-21)

Phase 1-R2 independent acceptance failed because seven defects remained:

1. A structurally valid two-primary-source dispute could not pass full validation.
2. Duplicate dispute entries for one field were silently accepted.
3. A canonical GitHub repository URL with unrelated extra path segments was accepted.
4. Dynamic official documentation could be marked `immutable: true`.
5. A `github.com` blob URL using a moving branch could be marked `immutable: true`.
6. `PROFILE_SOURCING.md` was reported as updated but was not actually changed.
7. The review archive's `PHASE1R2-DIFF.patch` was a combined diff, not the exact implementation-only diff it claimed to be.

Phase 1-R2A is authorized solely to fix these defects. Phase 2 remains unauthorized. Final independent acceptance requires a new independent review archive.

## Unresolved items

- (Resolved 2026-07-20) The S0-C package is ratified.
- (Resolved 2026-07-20) Legacy archival completed locally on `archive/trust-kernel-s0b` and `archive/omnibridge-pre-reboot`; trust-kernel/OmniBridge material preserved, not mixed into the new product identity.
- (Resolved 2026-07-20) Phase 1 (one OpenCode profile vertical slice) authorized.
- (Resolved 2026-07-21) Phase 1-R evidence contract correction authorized and applied locally.
- (Resolved 2026-07-21) Phase 1-R2 evidence contract closure authorized and applied locally.
- (Resolved 2026-07-21) Phase 1-R2 independent acceptance **not granted**; Phase 1-R2A authorized to fix remaining defects.
- Final independent acceptance of Phase 1-R2A — pending review of the Phase 1-R2A review archive.
- Per-agent sourcing feasibility for the remaining nine launch profiles — to be confirmed under a separately authorized Phase 2.
- Controlled Evaluation Tasks, Runs, and benchmark execution — remain unauthorized.
- Concrete launch date, contingent on the "useful sourced data + at least one complete reproducible evidence path" gate.
