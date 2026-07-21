# 30-Day Launch Plan — Kernux Agent Index

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Phase 1 implemented locally; independent acceptance pending.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

Dates are relative (D-Day = launch day), not calendar-fixed.

## Goal of the 30 days

Ship a **useful, zero-install, evidence-first** repository with:

- the ratified **ten** source-cited agent profiles,
- **ten** original-fixture Controlled Evaluation Tasks,
- at least one published Run per task on at least one agent,
- a generated comparison matrix (no overall score),
- the first dated monthly report,
- contributor policy + Python-only tooling.

## Launch authorization gate (ratified)

**No launch is authorized** until the repository contains:

1. useful sourced data, **and**
2. at least one complete reproducible evidence path.

If either is missing on D, **delay launch** rather than ship incomplete.

## Canonical format reminder

- **YAML** is canonical for profiles and run metadata.
- **JSON Schema** validates it.
- **Markdown** profiles/tables are generated views.
- **Python** is the only tooling language for v1.
- **No database** in v1.

## Phase plan

### Phase A — Foundation (D − 30 to D − 21)
- Founder approved the S0-C strategy package on 2026-07-20; **Phase 1 (Agent Profile Vertical Slice) was authorized on 2026-07-20** for exactly: one OpenCode profile, agent-profile JSON Schema, validation tooling, deterministic Markdown generation, tests, and root README integration. All other profiles, Controlled Evaluation Tasks, Runs, CI, website, and launch remain unauthorized; Phase 2 requires separate authorization.
- Create `agents/<id>/profile.yaml` (implemented), `matrix/`, `reports/`, `proof/`, `policy/`, `tools/`, `docs/legacy/`. (`data/runs/`, `data/tasks/` remain future/unimplemented until Phase 2.)
- Add `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, `SECURITY.md`, `policy/EDIT.md`.
- Implement `schema/agent-profile.schema.json` (implemented). `schema/run.schema.json` is future (no Runs in Phase 1).
- Implement `tools/validate_profiles.py`, `tools/generate_matrix.py` (implemented). `tools/validate_run.py` is future (no Runs in Phase 1).
- Write the ten Controlled Evaluation Tasks with original fixtures under Apache-2.0; verify each `VERIFY.*` runs green on a known-good solution.

### Phase B — Profiles (D − 21 to D − 10)
- Source and write the ratified **ten** profiles (see [INITIAL_AGENT_SET.md](INITIAL_AGENT_SET.md)).
- Pin `opencode` to https://github.com/anomalyco/opencode, distinct from the archived https://github.com/opencode-ai/opencode.
- Every non-`unknown` field has a primary source + `verified` date + `freshness_class` + `claim_status`.
- Run `validate_profiles.py` on each; fail the PR if any field lacks sourcing or violates freshness/claim rules.

### Phase C — Runs (D − 10 to D − 4)
- For each of the ten Controlled Evaluation Tasks, produce at least one Run on at least one agent (preferably two for contrast).
- Capture the **full configuration tuple** (agent/version/model/tier/mode/config/permissions/OS/hardware/task-revision/fixture-commit/date/cost-methodology/bundle-digest).
- Redact logs; record cost with methodology; record verification status (pass/fail/error).
- Label each Run's submission (`vendor-submitted`, `independently-unreproduced`, or `independently-reproduced`); keep vendor-submitted unreproduced Runs out of the primary reproduced-results view.
- Run `validate_run.py`; ensure every Run has a verification result.

### Phase D — Matrix + Report (D − 4 to D − 1)
- Generate `matrix/*.md` deterministically from `agents/<id>/profile.yaml`. **No overall score.**
- Write `reports/YYYY-MM.md` derived **only** from committed Runs; cite each Run by relative path.
- Include a "what changed / what's still `unknown`" section.

### Phase E — Launch (D)
- Merge `proposal/kernux-agent-index` → `main` only after founder sign-off (**not done in this pass**).
- Publish README (from [README_DRAFT.md](README_DRAFT.md)).
- Coordinated, non-spam launch: tailored (not copy-pasted) submissions for HN, relevant subreddits, Lobsters, LinkedIn, X, and direct transparent notification to maintainers whose products are profiled.
- Open the contribution ladder (issue templates, PR templates).

## "Useful zero-install value" at launch

A reader can, without installing anything:

1. read a source-cited profile of an agent they care about;
2. open the matrix and compare 2–3 agents on concrete fields (no overall score);
3. open a Run and see the full configuration tuple, cost, duration, and pass/fail;
4. open the dated report and read a defensible summary with citations.

## Risk-weighted scope cuts (in order)

If time is short, cut in this order:

1. Reduce Run coverage to one Run per task (drop the second agent per task).
2. Reduce profiles below ten **only if** a profile cannot be sourced above the `unknown` threshold — never below the count that still delivers useful zero-install value.
3. Drop the two hardest Controlled Evaluation Tasks if their `VERIFY.*` cannot be made deterministic in time.
4. **Never cut:** sourcing policy, freshness classes, redaction policy, validation tooling, the no-score rule, the SWE-bench-complementary language.

## Naming discipline (permanent)

Tasks are **"Controlled Evaluation Tasks."** Never call them real-world benchmark tasks, never claim representativeness, never market them as a SWE-bench replacement.

## Exit criteria for D

- [ ] Ten profiles, all validated.
- [ ] Ten Controlled Evaluation Tasks with deterministic `VERIFY.*`.
- [ ] ≥ 10 published Runs (≥ 1 per task), all validated.
- [ ] Matrix generated and committed (no overall score).
- [ ] Dated report committed, every claim cites a Run or profile.
- [ ] Policy + conduct + security docs present.
- [ ] README live.
- [ ] Founder sign-off recorded.

## Implementation authorization

**Phase 1 authorized (2026-07-20)** for exactly: one OpenCode profile, agent-profile JSON Schema, validation tooling, deterministic Markdown generation, tests, and root README integration. **Phase 1-R2 authorized (2026-07-21)** for closing remaining evidence-contract and documentation defects. **Phase 1-R2 independent acceptance was not granted;** seven defects remained. **Phase 1-R2A authorized (2026-07-21)** to fix those defects. **Phase 1-R2A independent acceptance found remaining canonical-repository and schema-contract defects. Phase 1-R2B authorized (2026-07-21)** for canonical repository validation and JSON Schema dispute closure. **Phase 1-R2B independent review did not accept; four URL/parser defects remain. Phase 1-R2C authorized (2026-07-21)** for parser safety, exact canonicalization, tests, and clean review packaging only. **Phase 1-R2C independent review confirmed the four R2B defects closed and the dispute schema unchanged, but did not accept; generic non-GitHub identity URL validation remained incomplete. Phase 1-R2D authorized (2026-07-21)** for total generic identity URL validation, generic/GitHub error-message separation, focused tests, and clean privacy-preserving review packaging only. **Phase 1-R2D closed the generic URL validation defect technically, but its execution boundary was breached (untracked `_review/` deleted during preflight without strictly proven user authorization) and its report was not accepted. Phase 1-R2E authorized (2026-07-21)** for evidence-integrity recovery only: recording the procedural truth, cleaning external staging residue, freshly verifying the immutable R2D implementation, and issuing a clean independently verifiable review package; no code, schema, profile, matrix, dispute-file, or nexusmcp change. **Phase 1-R2E preserved the R2D failure but its own review archive was rejected (defective source-inventory count, validation evidence, reconstruction wording, and probe coverage). Phase 1-R2F authorized (2026-07-21)** for a fresh evidence-recovery chain only: governance truth, fresh verification, exact reconstruction proven via Git object equality, and a new independently verifiable review package; no code, schema, profile, matrix, test, tool, nexusmcp, lockfile, dependency, or methodology change. Everything else in this plan (the remaining nine profiles, Controlled Evaluation Tasks, Runs, CI beyond local tooling, website, launch) remains unauthorized; Phase 2 requires separate founder authorization.
