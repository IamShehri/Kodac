# Run Evidence Schema — Kernux Runs

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Phase 1 implemented locally; independent acceptance pending. Runs are not part of Phase 1 — this schema describes the future Phase 2 run-evidence contract.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

A **Run** is a single execution of one agent on one Controlled Evaluation Task, captured as an immutable evidence bundle. **YAML is the canonical representation** (`runs/<agent-slug>/<task-slug>/<run-id>/RUN.yml`, future), validated by **JSON Schema** (`schema/run.schema.json`, future). Markdown summaries are a **generated view**. Runs and `schema/run.schema.json` are not implemented in Phase 1.

`run-id` is `<YYYYMMDD>-<short-hash>` where the short hash is derived from the canonical Run YAML, so two identical runs share an id. A Run is **never edited after publication**; corrections are a new Run that supersedes it via `supersedes:`.

## Directory contents of a Run

```
runs/<agent-slug>/<task-slug>/<run-id>/     # future — not implemented in Phase 1
├── RUN.yml            # Canonical record (validated by run.schema.json)
├── logs/              # Truncated, redacted agent output
├── artifacts/         # Diff/patch, generated files (license-permitting)
└── VERIFY.md          # Generated verification result view (pass/fail + output)
```

## Run identity (ratified)

Every Run is bound to a **complete configuration tuple** — a result is never attributed to an agent universally:

- agent name
- agent version
- underlying model
- model version when available
- subscription, API, or service tier
- execution mode
- configuration
- permissions
- operating system
- hardware or relevant runtime environment
- task-set revision
- fixture commit or digest
- execution date
- cost methodology
- evidence-bundle digest

## Canonical RUN.yml shape (v1)

```yaml
schema_version: 1
run_id: <YYYYMMDD>-<short-hash>
submission: community-submitted | vendor-submitted | independently-unreproduced | independently-reproduced

agent:
  slug: <agent-slug>
  version: <exact agent version>

task:
  slug: <task-slug>
  task_set_revision: <repo commit-sha of tasks/<task-slug> at run time>
  fixture_commit: <commit-sha or digest>

environment:
  os: <os name and version>
  arch: <arch>
  hardware_or_runtime: <str>
  runner: human | ci | container
  runner_info: <str>

model:
  provider: <provider>
  model_id: <exact model id>
  model_version: <when available, else unknown>
  subscription_or_api_tier: <str>

execution:
  mode: <terminal | ide | web | async | headless | ci>
  configuration_ref: <path/inline ref to exact config used>
  permissions: <str>

timing:
  started_at:  <ISO 8601 UTC>
  finished_at: <ISO 8601 UTC>
  duration_s:  <int>

cost:
  currency: <str>
  input_tokens:  <int>
  output_tokens: <int>
  estimated_cost: <float>
  cost_basis: vendor-reported | computed-from-public-price
  cost_methodology: <str, e.g. price-source URL or "vendor-reported">

verification:
  status: pass | fail | error
  criteria: <exact text of acceptance criteria from the Task>
  script: tasks/<task-slug>/VERIFY.<ext>
  output_hash: <sha256 of normalized verification output>

evidence:
  artifacts: [artifacts/<file>, ...]
  logs:      [logs/<file>, ...]
  bundle_digest: <sha256 of the canonical RUN.yml + referenced artifacts>

provenance:
  fixture_source: <url or commit pointer>
  fixture_license: <SPDX | "see upstream" | "redistribution-not-permitted-link-only">
  agent_invocation: <exact command or config file reference>

redaction:
  applied: true | false
  policy: policy/EDIT.md

supersedes: <run-id | none>

notes: <optional free text>
```

## Submission labels (ratified)

Every Run carries a `submission` label:

- `vendor-submitted` — supplied by the agent's vendor.
- `independently-unreproduced` — submitted by someone other than the vendor but not yet independently reproduced by Kernux.
- `independently-reproduced` — reproduced by Kernux or a trusted second party.

**Vendor-submitted, independently-unreproduced runs must NOT appear in the primary reproduced-results view.** Generated views segment runs by this label.

## Required invariants

1. **Reproducible pointer.** `task.task_set_revision` pins the exact Task definition, and `provenance.fixture_source` pins the exact fixture/commit. Anyone can re-run the Task at the same commit.
2. **Verification is mandatory.** A Run without `verification.status` is not publishable. `error` (agent crashed, harness failed) is allowed and is itself valid evidence.
3. **Cost is labeled with methodology.** `cost_basis` says whether cost is `vendor-reported` or `computed-from-public-price`; `cost_methodology` cites the price source.
4. **Full configuration tuple is present.** All fields in the ratified run-identity list are required (use `unknown` only where truly unavailable, e.g., model version).
5. **No secrets.** Logs/artifacts are redacted per `policy/EDIT.md`. If a log cannot be safely redacted, it is omitted and `redaction.applied: true` is recorded with a note.
6. **No claim of determinism for live model calls.** A Run records what happened on a specific date with a specific configuration; it is **evidence**, not a guarantee of future behavior.
7. **No universal attribution.** A configuration-specific result is never generalized to "agent X is better than agent Y."

## VERIFY.md (generated view)

```markdown
# Verification — <agent-slug>/<task-slug>/<run-id>

- Status: pass | fail | error
- Script: <relative path>
- Output hash (sha256, normalized): <hash>
- Submission label: <submission>
- Key output excerpt:
  ```
  <truncated, deterministic excerpt, e.g. test summary>
  ```
- Notes: <any caveats>
```

## Redaction rules (summary; full policy in policy/EDIT.md at launch)

- Strip API keys, bearer tokens, cookies, credentials, private keys.
- Strip file paths revealing private infrastructure.
- Strip PII by default.
- Never redact the verification output hash or acceptance criteria.

## Licensing of artifacts

- Commit only artifacts the upstream license permits us to redistribute.
- If a Task fixture is from a repo whose license forbids redistribution, the Run **links** to the pinned commit and includes only the produced diff/patch, and only if its license allows.
- If model-provider content policy restricts redistribution, the Run omits raw output and records the omission.

## Supersession

To correct a Run, publish a new Run with `supersedes: <old-run-id>` and a note. Do not edit the old Run.

## Non-goals

- No in-repo verification runtime for v1 (Kernux Proof is reserved).
- No statistical representativeness claim; each Run is a single dated, configuration-specific observation.
- No "agent score" computed from Runs.
- No overall ranking.

## Implementation authorization

**Phase 1 implemented locally.** Independent acceptance pending. Phase 2 remains unauthorized. This document specifies the future run schema; no `schema/run.schema.json` file is created yet, and no Runs are implemented in Phase 1.
