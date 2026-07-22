# Founder Decisions — Kernux S0-C Ratification

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Phase 1 governance-closed (2026-07-22); Phase 2 unauthorized.*

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

> **Current status (2026-07-22): Phase 1 governance-closed.** Phase 2 and everything outside the completed Phase 1 boundary remain unauthorized.

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

### Phase 1-R2B — Canonical Repository and Schema Closure (authorized 2026-07-21)

Phase 1-R2A was implemented locally. Independent acceptance found two remaining contract gaps:

1. Canonical `source_repository` validation can be bypassed: malformed GitHub repository identities (`.git` suffix, extra path segments, query strings, fragments, explicit ports) do not produce a direct validation error on `identity.source_repository.value`; they merely disable downstream GitHub authority checks.
2. The JSON Schema dispute contract is incomplete: `notes.disputes` entries do not structurally require `field`, `sources` (minItems: 2, uniqueItems), and `note` (non-empty) with `additionalProperties: false`.

Phase 1-R2B is authorized only for this narrow local correction. Phase 1 acceptance remains pending. Phase 2 remains unauthorized. No remote publication is authorized.

### Phase 1-R2C — Parser Safety and Canonicalization Closure (authorized 2026-07-21)

Phase 1-R2B was implemented locally. Independent review did not accept it. The dispute JSON Schema closure passed. However, four URL/parser defects remain:

1. Invalid-port crash: `https://github.com:notaport/owner/repo` raises `ValueError` instead of producing a deterministic `ValidationError`.
2. Percent-encoded unreserved path bypass: `https://github.com/owner/%72epo` is accepted.
3. Percent-encoded `.git` bypass: `https://github.com/owner/repo%2Egit` is accepted.
4. Noncanonical host casing: `https://GitHub.com/owner/repo` is accepted.

Phase 1-R2C is authorized only for parser safety, exact canonicalization, tests, necessary methodology reconciliation, and clean review packaging. Phase 1 acceptance remains pending. Phase 2 remains unauthorized. No remote publication is authorized.

### Phase 1-R2D — Generic URL Validation and Review-Evidence Closure (authorized 2026-07-21)

Phase 1-R2C was implemented locally. Independent review confirmed the four R2B defects were closed (nonnumeric GitHub port, percent-encoded unreserved path, percent-encoded `.git`, noncanonical GitHub host casing) and that the dispute schema remained closed and unchanged. However, R2C was not accepted.

The remaining blocking defect is generic non-GitHub identity URL validation. Malformed values on `identity.source_repository.value` (e.g., `https://gitlab.com:notaport/o/r`, `https://gitlab.com:99999/o/r`, `https://gitlab.com:/o/r`, `https:///o/r`, trailing space, NUL) and on `identity.official_url.value` returned no direct field error. R2C did not consistently reject parse failure, invalid/empty ports, missing hostname, whitespace, or control characters, and a malformed non-GitHub IPv6/netloc input could be mislabeled with the GitHub canonical message.

R2C review packaging also exposed two defects: the review metadata directory was left as an untracked path inside the implementation worktree while claiming the worktree was clean, and a review file contained a local absolute Windows path despite the archive prohibition.

Phase 1-R2D is authorized only for: total generic identity URL validation; field-specific deterministic errors; correct separation of generic and GitHub error messages; focused tests; narrowly necessary methodology reconciliation; and clean, privacy-preserving review packaging. Phase 1 acceptance remains pending. Phase 2 remains unauthorized. No remote publication is authorized.

### Phase 1-R2E — Evidence Integrity Recovery (authorized 2026-07-21)

Phase 1-R2D closed the generic identity URL validation defect technically at commit `58ecf783`. However, the R2D report was not accepted for final ZIP review.

R2D preflight found ten unexpected untracked `_review/` files inside the implementation worktree (a packaging residue carried over from R2C, since R2C's task wording asked for `_review/` inside the worktree whereas R2D prohibited it). Those files were removed and execution continued. No exact independent user authorization for overriding the original R2D stop condition ("stop without editing if any unexpected untracked path exists") could be proven under a strict standard: the only instruction was a selection from a constrained, executor-authored option set, not a free-text user authorization message. The purported clean baseline was therefore captured *after* deletion, and the R2D report's later claim that `_review/` "never existed in a Git worktree" is false and is retracted here. The external R2D staging directory was also retained, contrary to the cleanup intent.

The R2D commits (`f3cdd305`, `58ecf783`) and the R2D review ZIP are preserved unchanged; they remain valid historical and technical evidence, but are procedurally insufficient for final acceptance on their own.

Phase 1-R2E is authorized only to: record this procedural truth; clean the external R2D staging residue safely; freshly verify the immutable R2D implementation; reconstruct its commit chain; and issue a clean, privacy-safe, independently verifiable R2E review package. R2E authorizes no code, test, schema, profile, matrix, dispute-file, or nexusmcp change. Phase 1 acceptance remains pending. Phase 2 remains unauthorized. No remote publication is authorized.

### Phase 1-R2F — Evidence Recovery (authorized 2026-07-21)

Phase 1-R2D technically fixed the generic identity URL validation defect but failed its execution boundary (untracked `_review/` deleted during preflight without strictly proven authorization). Phase 1-R2E correctly preserved that failure and attempted evidence recovery, but the R2E review archive was rejected because its `_review/SOURCE-INVENTORY.txt` recorded 12 review entries while the ZIP mechanically contains 14, its `_review/VALIDATION-RESULTS.txt` recorded a failed command and did not individually record all nine detached commands, its `_review/RECONSTRUCTION-RESULTS.txt` incorrectly described an LF-normalized comparison as byte-for-byte, and its `_review/INDEPENDENT-PROBE-RESULTS.txt` omitted a distinct private-IPv6 case.

A later read-only reconciliation report also contained contradictory inventory claims (asserting both ten and nine preflight status lines and supplying a blank tenth inventory row), four purported SHA-256 values with filler-like repeated tails that must not be reused, no retained external-staging inventory, a mislabeling of the failed `uv run --project` wrapper invocation as canonical `uv sync --locked`, an insufficient NUL-only textual/binary classification, and an unproven assertion that every ZIP entry had been subjected to a privacy scan.

Historically accurate statement of the unresolved R2D pre-deletion inventory: the R2D report claimed ten unexpected untracked `_review/` paths/files; a later reconciliation asserted nine and contradicted its own stated source; no surviving contemporaneous pre-deletion porcelain capture has been proven; therefore the exact original pre-deletion inventory and count (nine versus ten) remain unresolved. Paths and hashes derived from immutable ZIPs are ZIP-derived and are not proof of the original on-disk pre-deletion state.

The R2C, R2D, and R2E commits and ZIPs remain immutable historical evidence; none is erased, repaired in place, or accepted.

Phase 1-R2F is authorized only for: governance truth; fresh verification; exact reconstruction (proven via Git object equality, not LF-normalized file comparison); and a new independently verifiable R2F evidence package. R2F authorizes no code, schema, profile, matrix, test, tool, nexusmcp, lockfile, dependency, or methodology change. Phase 1 acceptance remains pending independent review. Phase 2 and remote publication remain unauthorized.

### Phase 1-R2G — Evidence Recovery (authorized 2026-07-21)

Phase 1-R2F correctly preserved earlier failures and produced a technically correct repository state, but R2F independent acceptance failed because `_review/TEST-COLLECTION.txt` in the R2F archive falsely recorded `TOTAL COLLECTED: 0` and `TOTAL PASSED: 0`, left the per-file section empty, and omitted the required 105 R2D focused-test names. The independently recomputed truth at the same repository state was 367 collected, 367 passed, nine per-file counts (19, 24, 15, 32, 23, 34, 83, 105, 32), and 105 R2D node IDs. The defect was an evidence-generation failure (the collection command was run through an unsuitable wrapper/location and empty stdout was accepted as valid evidence), not a newly detected product-code defect. The separate "131 total, before MANIFEST add" phrase was found only in the executor's user-facing report and not in the immutable R2F ZIP; it is recorded as a report-only defect.

The R2F commit and ZIP remain immutable historical evidence; R2G preserves rather than repairs R2F.

Phase 1-R2G is authorized only for: governance truth; fresh validation; fail-closed test-evidence generation (making the R2F failure mode impossible by aborting unless collection stdout is non-empty and the parsed total equals the mechanically observed count); exact reconstruction (proven via Git object equality); and a new independently verifiable R2G evidence package. R2G authorizes no code, test, schema, profile, matrix, tool, nexusmcp, lockfile, dependency, or methodology change. Phase 1 acceptance remains pending independent review. Phase 2 and remote publication remain unauthorized.

### Phase 1 post-merge truth-closeout (recorded 2026-07-22)

This section supersedes only the **current-state** acceptance, publication, and authorization statements in the historical Phase 1-R through Phase 1-R2G sections above. Those sections remain accurate snapshots of what was known and authorized when their commits were created; they are not rewritten as if later events had already occurred.

#### Independent acceptance and accepted archive

Phase 1-R2G independent acceptance passed. The accepted archive identity was:

- Name: `Kernux-Phase1R2G-Review.zip`
- Size: `339021` bytes
- SHA-256: `1ee6ed1de3147f024da9ecb5ba8b709fa767dbf7d674929bd7a84558944867f8`

#### Remote publication and normal merge

The accepted head `68b392bb5819fdb3b5e9447b548deff35f8ce993` was published through [PR #1](https://github.com/IamShehri/kernux/pull/1). PR #1 was merged using a normal merge commit on `2026-07-21T23:59:51Z`:

- Merge commit: `a6978f4659a866d81b3ff7fd92ab1af4e2c64ac2`
- Ordered parent 1: `60df880f34e343d15da4864e7e1eee201d7c9de3`
- Ordered parent 2: `68b392bb5819fdb3b5e9447b548deff35f8ce993`
- Merge tree: `960d7ec924296d09e833c9691a8bdf63ab7a3f1c`

#### Post-merge verification

Read-only post-merge verification passed and established that:

- `main` resolves exactly to merge commit `a6978f4659a866d81b3ff7fd92ab1af4e2c64ac2`;
- the merge tree equals the accepted Phase 1-R2G tree `960d7ec924296d09e833c9691a8bdf63ab7a3f1c`;
- all 17 accepted commits remain in ancestry;
- the merge introduced no content beyond the accepted head;
- the repository contains exactly 116 tracked entries; and
- no committed `_review/` paths, symlinks, or submodules exist.

No GitHub Actions workflows or commit statuses were configured. Their absence is **not** a passing or green CI result.

#### Governance closeout and authorization boundary

Phase 1 is independently accepted, remotely published, normally merged, post-merge verified, and governance-closed. Phase 2 remains unauthorized. Controlled Evaluation Tasks, Runs, the remaining nine profiles, website, CI, API, database, product launch, and all other post-Phase-1 implementation remain unauthorized pending separate founder authorization.

## Unresolved items

- (Resolved 2026-07-20) The S0-C package is ratified.
- (Resolved 2026-07-20) Legacy archival completed locally on `archive/trust-kernel-s0b` and `archive/omnibridge-pre-reboot`; trust-kernel/OmniBridge material preserved, not mixed into the new product identity.
- (Resolved 2026-07-20) Phase 1 (one OpenCode profile vertical slice) authorized.
- (Resolved 2026-07-21) Phase 1-R evidence contract correction authorized and applied locally.
- (Resolved 2026-07-21) Phase 1-R2 evidence contract closure authorized and applied locally.
- (Resolved 2026-07-21) Phase 1-R2 independent acceptance **not granted**; Phase 1-R2A authorized to fix remaining defects.
- (Resolved 2026-07-21) Phase 1-R2A implemented locally; independent acceptance found remaining canonical-repository and schema-contract defects.
- (Resolved 2026-07-21) Phase 1-R2B implemented locally; independent review did not accept; four URL/parser defects remain.
- (Resolved 2026-07-21) Phase 1-R2C implemented locally; independent review confirmed the four R2B defects closed and the dispute schema unchanged, but did not accept — generic non-GitHub identity URL validation remained incomplete.
- (Resolved 2026-07-21) Phase 1-R2D implemented locally; the generic URL validation defect was closed technically at commit `58ecf783`, but the R2D execution boundary was breached (untracked `_review/` deleted during preflight without strict proven user authorization) and the report was not accepted.
- (Resolved 2026-07-21) Phase 1-R2E implemented locally; preserved the R2D failure and produced a recovery archive, but the R2E archive was rejected for source-inventory, validation, reconstruction-wording, and probe-coverage defects.
- (Resolved 2026-07-21) Phase 1-R2F implemented locally; preserved earlier failures and produced a technically correct repository state, but the R2F archive was rejected because `_review/TEST-COLLECTION.txt` falsely recorded zero counts and omitted mandatory collection evidence.
- (Resolved 2026-07-22) Phase 1-R2G independent acceptance passed for `Kernux-Phase1R2G-Review.zip` (`339021` bytes; SHA-256 `1ee6ed1de3147f024da9ecb5ba8b709fa767dbf7d674929bd7a84558944867f8`).
- (Resolved 2026-07-22) The accepted head was published through PR #1, normally merged as `a6978f4659a866d81b3ff7fd92ab1af4e2c64ac2`, and post-merge verified against accepted tree `960d7ec924296d09e833c9691a8bdf63ab7a3f1c`.
- (Resolved 2026-07-22) Phase 1 governance closeout recorded; Phase 1 is closed.
- Per-agent sourcing feasibility for the remaining nine launch profiles — to be confirmed under a separately authorized Phase 2.
- Controlled Evaluation Tasks, Runs, and benchmark execution — remain unauthorized.
- Website, CI, API, database, and all other post-Phase-1 implementation — remain unauthorized.
- Concrete launch date and product launch — remain unauthorized and contingent on the "useful sourced data + at least one complete reproducible evidence path" gate.
