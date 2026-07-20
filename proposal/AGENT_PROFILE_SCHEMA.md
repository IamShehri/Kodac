# Agent Profile Schema — Kernux Index

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Implementation not authorized.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

This defines the canonical shape of a Kernux agent profile. **YAML is the canonical representation** (`data/profiles/<agent-slug>.yml`), validated by **JSON Schema** (`data/schema/profile.schema.json`). Markdown profiles are a **generated view**. This document specifies the schema; it does **not** create the JSON Schema file in this pass.

## Slug rules

- Lowercase, ASCII, hyphen-separated. Example: `claude-code`, `github-copilot`, `aider`, `opencode`.
- One file per agent. Variants ("Pro", "Enterprise") are fields within the same profile unless they are genuinely separate products.

## Sourcing and labeling

- Prefer **primary** sources: the vendor's official site, official docs, public source repo, official changelog.
- Secondary sources are allowed only for non-factual context and must be marked `secondary: true`.
- Every factual field carries `source` (URL or `none`) and `verified` (ISO date a human last checked).
- Every field that could be mistaken for a verified fact carries `claim_status`:
  - `verified` — independently confirmed (ideally with a reproducing Run).
  - `vendor-reported` — sourced only from the vendor.
  - `unknown` — no acceptable source found.
  - `disputed` — sources conflict; the conflict is documented in the profile notes.
- Vendor-submitted profiles/runs additionally carry a `submission` label: `vendor-submitted`, `independently-unreproduced`, or `independently-reproduced`.

## Freshness classes (ratified)

| Class | Window | Example fields |
|-------|--------|----------------|
| 1 | 30 days | price; subscription tiers; current versions; available models; documented data retention. |
| 2 | 90 days | capabilities; integrations; MCP and skills support; execution modes; sandbox and permission behavior. |
| 3 | 180 days | lower-volatility historical and organizational fields. |

Each field records its freshness class. Expired fields are visibly marked **STALE** in generated views. **`unknown` and `stale` are different states** — `unknown` means no source; `stale` means a previously-verified source is past its window.

## Product tracks (ratified)

Each profile declares membership in one or more tracks:

- `terminal-agents`
- `ide-integrated-agents`
- `cloud-or-async-agents`
- `open-source-agent-scaffolds`
- `privacy-first-or-local-capable-agents`

An agent may belong to multiple tracks. Tracks are used to scope comparisons; they never collapse into one overall ranking.

## Canonical YAML shape (v1)

```yaml
schema_version: 1
slug: <agent-slug>
name: <display name>
updated: <ISO date this profile was last edited>
submission: community-submitted | vendor-submitted | independently-reproduced   # default community-submitted

tracks: [terminal-agents, ide-integrated-agents, ...]

identity:
  vendor_or_maintainer: { value, source, verified, claim_status, freshness_class }
  official_url:         { value, source, verified, claim_status, freshness_class }
  source_repository:    { value, source, verified, claim_status, freshness_class }

openness:
  open_source:          { value, source, verified, freshness_class }
  license:              { value, source, verified, freshness_class }

compatibility:
  operating_systems:    { value: [...], source, verified, freshness_class }
  modes:                { value: [terminal|ide|web|async], source, verified, freshness_class }
  supported_providers:  { value: [...], source, verified, freshness_class }
  local_model_support:  { value: true|false|partial, source, verified, freshness_class }
  ide_integrations:     { value: [...], source, verified, freshness_class }

cost:
  pricing_model: { value, source, verified, claim_status, freshness_class }   # 30-day
  free_tier:     { value, source, verified, claim_status, freshness_class }   # 30-day

protocols:
  mcp_support:          { value: true|false|partial, source, verified, freshness_class }
  agent_skills_support: { value: true|false|partial, source, verified, freshness_class }
  headless_or_ci:       { value: true|false|partial, source, verified, freshness_class }

security:
  sandboxing_model:    { value, source, verified, claim_status, freshness_class }
  permission_controls: { value, source, verified, freshness_class }

privacy:
  telemetry_behavior: { value, source, verified, freshness_class }
  data_retention:     { value, source, verified, freshness_class }   # 30-day
  opt_out:            { value, source, verified, freshness_class }

capabilities:
  repo_scale_context:  { value, source, verified, freshness_class }
  session_persistence: { value, source, verified, freshness_class }
  subagent_support:    { value, source, verified, freshness_class }

model_and_tier:
  current_versions: { value: [...], source, verified, freshness_class }      # 30-day
  available_models: { value: [...], source, verified, freshness_class }      # 30-day
  subscription_or_api_tiers: { value: [...], source, verified, claim_status, freshness_class }

evidence:
  official_benchmarks: { value: <url or none>, source, verified, freshness_class }
  kernux_runs: [data/runs/<agent-slug>/<task-slug>/<run-id>/RUN.yml, ...]    # generator-curated
  evidence_status: verified | partial | vendor-reported-only | unknown
  last_verified: <ISO date>

notes:
  summary: <neutral 3–6 sentence summary>
  disputes: [ { field, sources: [...], note } ]
  changes:  [ { date, change } ]
```

## Field semantics

- `claim_status` is **required** on any field that could be mistaken for a verified fact; default to `vendor-reported` when sourced only from the vendor.
- `freshness_class` is **required** on every factual field and must match one of the three classes above.
- `verified` is the date a human last checked the source.
- `unknown` is a first-class value; `stale` is a **derived** state computed from `verified` + `freshness_class`, surfaced in generated views.
- `kernux_runs` is generator-curated; humans should not hand-edit it.

## No overall score

The schema deliberately contains **no** field for an overall score, ranking, or "Kernux grade." Comparisons are decision-oriented (see [PRODUCT_POSITIONING.md](PRODUCT_POSITIONING.md)).

## Validation contract

`data/schema/profile.schema.json` (to be created under a separately authorized implementation pass) enforces:
1. `schema_version: 1`.
2. Every non-`unknown` field has `source` and `verified`.
3. `verified` is a valid ISO date.
4. `claim_status` is present on all fields where the schema requires it.
5. `freshness_class` is one of `1`, `2`, `3`.
6. Slug matches filename.
7. No unsupported phrase appears as a positive claim (see [EDITORIAL_AND_EVIDENCE_POLICY.md](EDITORIAL_AND_EVIDENCE_POLICY.md)).

## Unsupported-phrase policy (carried from editorial policy)

Forbidden as positive claims: "production-ready," "enterprise-ready," "fully secure," "HIPAA-ready," "HIPAA-compliant," "SOC 2 certified" (unless the vendor publishes the actual cert and we link it, still labeled `vendor-reported`), "guaranteed," "unbreakable." `validate_profile.py` fails on any occurrence as a positive claim.

## Example (stub only — NOT a populated profile)

```yaml
schema_version: 1
slug: aider
name: Aider
updated: 2026-07-20
submission: community-submitted
tracks: []
identity:
  vendor_or_maintainer: { value: unknown, source: none, verified: 2026-07-20, claim_status: unknown, freshness_class: 3 }
  official_url:         { value: unknown, source: none, verified: 2026-07-20, claim_status: unknown, freshness_class: 3 }
  source_repository:    { value: unknown, source: none, verified: 2026-07-20, claim_status: unknown, freshness_class: 3 }
# ... remaining fields set to unknown until sourced ...
evidence:
  evidence_status: unknown
  last_verified: 1970-01-01
notes:
  summary: "Illustrative stub. No factual field is populated."
  disputes: []
  changes:
    - { date: 2026-07-20, change: "Profile stub created from schema; all fields unknown." }
```

The above is a **stub**. Per the founder-review package, no factual field is populated without an authoritative source.

## Non-goals

- No scoring of agents.
- No "overall rating" or "Kernux grade."
- No credentials, API keys, or vendor-confidential material.
- No auto-fetching of vendor pages to overwrite human-curated fields.

## Implementation authorization

**Not authorized.** Legacy archival and the Phase 1 vertical-slice kickoff require separate authorization. This document specifies the schema; no `data/schema/profile.schema.json` file is created in this pass.
