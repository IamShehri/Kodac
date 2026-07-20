# Controlled Evaluation Tasks — Kernux Lab (V1, ratified)

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Implementation not authorized.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

## Naming (ratified)

These are called **"Controlled Evaluation Tasks."** They are **not** described as:

- real-world benchmark tasks;
- representative of all software engineering;
- proof of production performance.

Kernux is explicitly **complementary to SWE-bench** and other academic benchmarks and must not market these tasks as a SWE-bench replacement (see [COMPETITOR_MAP.md](COMPETITOR_MAP.md)).

## Design constraints

- **Ten all-original fixtures**, one per category below.
- Each task is runnable on a developer laptop or a free CI runner within the stated budget.
- Each task has **deterministic acceptance criteria** that a script can check.
- Fixtures are **pinned to a specific immutable revision** (commit SHA) or are **small original fixtures** we authored and contribute under Apache-2.0.
- We do **not redistribute** upstream fixtures we are not licensed to redistribute; for those we pin a commit and link.

## Required fields for every controlled task (ratified)

Every `data/tasks/<task-slug>/TASK.yml` must contain:

- **provenance** — origin of the fixture (original, or upstream commit + URL).
- **license** — SPDX identifier for the fixture.
- **immutable revision or digest** — the commit SHA or content digest the task is bound to.
- **task prompt** — the exact literal string handed to the agent.
- **acceptance criteria** — binary, deterministic checks.
- **automated verification where possible** — script path + how to run it.
- **time and resource budget** — wall-clock and token/cost ceiling.
- **permitted and prohibited actions** — what the agent may and may not do.
- **expected evidence artifacts** — paths the Run must capture.
- **documented limitations** — known ways this task is narrow or unrepresentative.

## The ten tasks (proposed)

| # | Slug | Category | Fixture model | Budget (wall) | Prohibited shortcut (example) |
|---|------|----------|---------------|---------------|-------------------------------|
| 1 | `fix-off-by-one` | Bug fixing | Original small repo (Apache-2.0), pinned commit | 10 min | Editing the assertion instead of the code |
| 2 | `add-config-flag` | Feature implementation | Original repo, pinned commit | 20 min | Hardcoding output instead of adding a flag |
| 3 | `gen-param-tests` | Test generation | Original module, pinned commit | 15 min | Tests that only assert `true` |
| 4 | `extract-function` | Refactoring | Original module, pinned commit | 15 min | Changing the public API |
| 5 | `explain-call-graph` | Repository understanding | Original repo, pinned commit | 15 min | Copying docstrings verbatim without analysis |
| 6 | `bump-dep-patch` | Dependency upgrade (patch) | Original repo, pinned commit | 15 min | Deleting the dependency to pass |
| 7 | `write-readme-section` | Documentation | Original repo, pinned commit | 15 min | Inventing nonexistent APIs |
| 8 | `spot-obvious-vuln` | Security review | Original repo with a planted obvious issue (Apache-2.0) | 20 min | "Fixing" by disabling the feature |
| 9 | `repair-ci-yaml` | CI repair | Original repo, pinned commit (broken workflow) | 15 min | Disabling the failing job |
| 10 | `multi-file-rename` | Multi-file change | Original repo, pinned commit | 20 min | Renaming in one file only |

> Every "Original repo" above is a small, self-contained project we create and contribute under Apache-2.0, **not** a slice of someone else's code. This avoids the redistribution stop-condition entirely for v1.

## Per-task envelope (abbreviated)

For each task, `TASK.yml` includes the literal prompt, criteria, budget, permitted/prohibited actions, expected artifacts, and documented limitations. The shape below is illustrative; full YAML is generated at task-creation time, after founder approval of the set and under a separately authorized pass.

### 1. `fix-off-by-one`
- **Provenance/license/revision:** original fixture; Apache-2.0; `<commit-sha>`.
- **Prompt (exact):** "In `src/loan.rs`, the `remaining_payments` function returns one fewer payment than expected when the balance divides evenly. Fix the bug without changing the function signature. Run `cargo test` to verify."
- **Acceptance:** `cargo test` passes; `remaining_payments(1000, 100)` returns `10`.
- **Verify:** `VERIFY.sh`.
- **Documented limitations:** single-file, single-bug, Rust-only; not representative of multi-file debugging.

### 2. `add-config-flag`
- **Provenance/license/revision:** original fixture; Apache-2.0; `<commit-sha>`.
- **Prompt (exact):** "Add a `--uppercase` boolean flag to `src/main.ts` that prints the greeting in uppercase. Do not change default behavior when the flag is absent."
- **Acceptance:** `npm test` passes; `node dist/main.js --uppercase world` prints `HELLO, WORLD`.
- **Documented limitations:** trivial scope; tests flag-parsing, not architecture.

### 3. `gen-param-tests`
- **Prompt (exact):** "Add parameterized tests for `parse_date` in `src/parser.ts` covering valid, invalid, boundary, and null inputs."
- **Acceptance:** tests compile/pass; ≥6 cases; ≥2 demonstrate bug-finding.
- **Documented limitations:** measures test generation on one function, not whole-suite quality.

### 4. `extract-function`
- **Prompt (exact):** "Extract the validation logic in `src/checkout.py` into a new function `validate_cart` in the same module without changing the public API."
- **Acceptance:** public API unchanged; existing tests pass.
- **Documented limitations:** mechanical refactor; does not test design judgment.

### 5. `explain-call-graph`
- **Prompt (exact):** "List, in order, the functions called when `POST /order` is handled, from route handler to database write."
- **Acceptance:** output matches the canonical call graph (order-sensitive).
- **Documented limitations:** comprehension of a tiny synthetic server; not a large-codebase navigation test.

### 6. `bump-dep-patch`
- **Prompt (exact):** "Bump `<dep>` to the latest patch version within the same minor. Do not change behavior."
- **Acceptance:** `package.json` bump; `npm ci && npm test` passes; lockfile updated.
- **Documented limitations:** single dependency, patch-level only.

### 7. `write-readme-section`
- **Prompt (exact):** "Add a `## Usage` section to `README.md` documenting only the CLI flags that exist in `src/main.ts`. Do not invent flags."
- **Acceptance:** every documented flag exists in code; no code flag is omitted.
- **Documented limitations:** small CLI; does not test prose quality at scale.

### 8. `spot-obvious-vuln`
- **Prompt (exact):** "Identify the highest-severity security issue in `src/handler.py` and propose a minimal fix. Do not rewrite the handler."
- **Acceptance:** output names the planted issue; proposed fix does not disable the feature.
- **Documented limitations:** one planted, obvious issue; not a realistic audit.

### 9. `repair-ci-yaml`
- **Prompt (exact):** "Repair `.github/workflows/ci.yml` so the `test` job runs on push. Do not delete or skip the job."
- **Acceptance:** workflow passes `actionlint` (or a structural check); the `test` job is still present.
- **Documented limitations:** synthetic broken workflow; not a large pipeline migration.

### 10. `multi-file-rename`
- **Prompt (exact):** "Rename `Widget` to `Component` across all source files and update all references. Do not leave any stale `Widget` identifier in `src/`."
- **Acceptance:** build passes; `grep -r Widget src/` returns nothing.
- **Documented limitations:** rename-only; does not test semantic refactor.

## Why all-original fixtures (and the stop-condition it avoids)

- **Legal redistribution is guaranteed** because we authored the fixtures.
- Tasks remain **small and cheap**.
- We avoid the mission's stop condition: *"a benchmark task cannot be legally redistributed."*
- **Trade-off (explicit):** tasks are narrow and less realistic than slicing a real OSS repo. This is why they are called **Controlled Evaluation Tasks** and why Kernux is **complementary** to SWE-bench, not a replacement.

## No overall score

Controlled-task results are **configuration-specific Run evidence**, never aggregated into an agent score or league table. A Run binds to the full configuration tuple (see [RUN_EVIDENCE_SCHEMA.md](RUN_EVIDENCE_SCHEMA.md)) and is never universally attributed.

## Explicit non-goals

- We do not claim these tasks are representative of all real-world coding.
- We do not aggregate them into a score.
- We do not run them on a schedule for v1; Runs are contributed and curated.
- We do not include tasks whose fixtures we cannot legally pin or contribute.

## Implementation authorization

**Not authorized.** Legacy archival and the Phase 1 vertical-slice kickoff require separate authorization. This document records the controlled-task set; no `data/tasks/` files or fixtures are created in this pass.
