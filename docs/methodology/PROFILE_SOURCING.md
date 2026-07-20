# Profile Sourcing Methodology

*How Kernux sources, verifies, and labels agent-profile facts.*

> This document is normative for Phase 1. It implements the editorial policy
> defined in [`proposal/EDITORIAL_AND_EVIDENCE_POLICY.md`](../../proposal/EDITORIAL_AND_EVIDENCE_POLICY.md)
> and the ratified decisions in [`proposal/FOUNDER_DECISIONS.md`](../../proposal/FOUNDER_DECISIONS.md).

## 1. Primary-source requirement

Every factual profile field must be sourced from a **primary** source. A primary
source is one controlled by the agent's vendor or maintainers:

- the vendor's official website;
- the vendor's official documentation;
- the canonical public source repository;
- the official LICENSE file;
- official release or repository metadata (tags, releases, package metadata);
- official privacy, security, or pricing documentation.

The following are **not** acceptable as the sole source for a factual field:

- search-result snippets;
- Wikipedia;
- third-party comparison sites;
- blog summaries not controlled by the agent's vendor;
- social-media claims;
- star count (not product-quality evidence);
- remembered facts without a source.

Secondary sources may appear only for non-factual context and must be marked
`authority: secondary`.

## 2. Source-authority levels

Each evidence record carries an `authority` field drawn from this controlled
vocabulary:

| Authority            | Meaning                                                                |
|----------------------|------------------------------------------------------------------------|
| `official`           | The vendor's official website or marketing surface.                    |
| `official-repo`      | The canonical public source repository (files, API metadata).          |
| `official-docs`      | The vendor's official documentation.                                   |
| `official-release`   | Official release metadata (tags, GitHub releases, package registry).   |
| `secondary`          | Independent reputable source (press, conference); context only.        |
| `tertiary`           | Blogs, social media, forums; context only, never the sole source.      |

A field whose `claim_status` is `verified` must be backed by an `official*`
authority. A `vendor-reported` field is also normally backed by an `official*`
authority but is not independently confirmed.

## 3. Evidence record format

Each profile carries an `evidence.records` list. Every record has:

- `id` — stable evidence identifier referenced by `field.source`;
- `title` — human-readable description of the source;
- `url` — exact URL (never `none` for an evidence record);
- `authority` — one of the levels above;
- `date_accessed` — ISO date a human accessed the URL;
- `fields_supported` — dotted field paths this source supports;
- `revision_or_commit` — optional immutable commit SHA when the source is a repo file.

## 4. Field-to-evidence mapping

Every factual field references its source by the evidence `id`:

```yaml
identity:
  official_url:
    value: "https://opencode.ai"
    source: opencode-repo-readme      # <- evidence id
    verified: 2026-07-21
    claim_status: verified
    freshness_class: 3
```

A field whose `value` is `unknown` must have `source: none` and no evidence id.

## 5. `unknown` vs `unsupported` vs `stale`

These are three distinct states; conflating them is a validation error.

| State          | Meaning                                                                 |
|----------------|-------------------------------------------------------------------------|
| `unknown`      | No primary source could be established. `value: unknown`, `source: none`. |
| `unsupported`  | A capability explicitly documented as **not** supported (`value: unsupported`). |
| `stale`        | A previously-verified source is past its freshness window. **Derived**, surfaced in the matrix as `(STALE)`, never written as a value. |

A field is stale when `today - verified` exceeds its freshness-class window
(see §7). Staleness is computed by the tooling, not authored by hand.

## 6. `claim_status`

Every factual field carries a `claim_status`:

- `verified` — established through a directly inspectable dispositive artifact (repository identity, LICENSE artifact, immutable release metadata) or an authorized independent execution. It does **not** mean that a contributor merely read vendor documentation. Phase 1 contains no independent execution or Run evidence; artifact-verified fields are limited to identity, openness, and release-metadata facts.
- `vendor-reported` — a direct claim from official documentation, vendor website, or marketing; not independently reproduced or established from a dispositive artifact.
- `unknown` — no acceptable direct source exists, or only absence of documentation was observed. Absence of documentation is an assessment limitation, not a vendor claim.
- `disputed` — acceptable sources conflict; documented in `notes.disputes`.

### Source authority vs verification method (distinct concepts)

- **Source authority** (`official`, `official-repo`, `official-docs`, `official-release`, `secondary`, `tertiary`) classifies the source surface.
- **Verification method** (`repository-artifact`, `repository-metadata`, `release-metadata`, `official-documentation`, `vendor-marketing`, `independent-execution`, `secondary-context`) classifies how the evidence was obtained.

These are mechanically enforced through centralized compatibility rules (see `tools/compatibility.py`):

- **Authority → method compatibility:** each authority maps to exactly its allowed methods. For example, `official-docs` → `official-documentation` only; `official-repo` → `repository-artifact` or `repository-metadata` only; `secondary`/`tertiary` → `secondary-context` only.
- **Claim → method compatibility:** `verified` requires `repository-artifact`, `repository-metadata`, `release-metadata`, or `independent-execution`; `vendor-reported` requires `official-documentation` or `vendor-marketing`.
- **Field → method compatibility (Phase 1):** behavioral fields (compatibility, protocols, security, privacy, cost, capabilities) may **not** be `verified` via artifact methods. Only `identity.*`, `openness.*`, and `model_and_tier.current_versions` may be artifact-verified.
- `secondary-context` may never be the sole source of a non-unknown factual field.

"Verified" does **not** mean independently reproduced unless the verification method is `independent-execution`.

### Evidence record fields

Every evidence record carries:

- `id` — stable identifier referenced by field `source`;
- `title` — exact description of the URL it stores;
- `url` — HTTPS-only exact source URL;
- `authority` — source surface classification;
- `verification_method` — how the evidence was obtained;
- `date_accessed` — ISO date the source was accessed;
- `content_sha256` — 64-character lowercase hex SHA-256 digest of the actual retrieved response bytes;
- `fields_supported` — dotted field paths this source supports (must match the field-to-source mapping exactly);
- `immutable` — `true` only for commit-pinned raw GitHub content; `false` for all dynamic endpoints;
- `revision_or_commit` — the 40-character commit SHA, required and must match the URL SHA for raw GitHub URLs.

### Immutable vs point-in-time dynamic evidence

- **Immutable:** commit-pinned `raw.githubusercontent.com` URLs (40-hex SHA in the path). `immutable: true` required. A digest makes the evidence reproducible at that commit.
- **Dynamic:** GitHub API responses (`api.github.com`), vendor homepages, documentation subdomains, `github.com/blob/` or `/tree/` web pages. `immutable: false` required. A **digest alone does not make a dynamic URL immutable**; the content may drift between fetches.
- `github.com/blob/` and `/tree/` URLs are rejected as repository artifacts; commit-pinned `raw.githubusercontent.com` content is required instead.
- `/releases/latest` cannot support `current_versions`; use `/releases/tags/<exact-tag>`.

### Exact bidirectional evidence mapping

Every non-unknown factual field must resolve to acceptable evidence. Every evidence record must appear in at least one field's complete source set. The `fields_supported` list must match the reverse-reference mapping exactly.

For disputed fields, the **complete source set** is `{field.source}` UNION `{notes.disputes.sources}`. Alternative dispute sources are legitimate reverse references, not orphan records.

`allow_unused_records` is not permitted; evidence mapping must be exact.

### Dispute contract

Every disputed field must have **exactly one** matching `notes.disputes` entry. The entry must name the exact dotted field path, contain at least two unique evidence IDs, include the field's primary source, resolve every source ID, use acceptable primary sources (not secondary-context), declare the field in each source's `fields_supported`, and contain a non-empty neutral note.

Duplicate dispute entries for the same field are rejected.

### Derived evidence summaries

`evidence_status` and `last_verified` are **not authored** — they are derived mechanically by tooling from field-level claim statuses. The validator rejects profiles that attempt to author these fields.

## 7. 30 / 90 / 180-day freshness policy (field-specific, mechanically enforced)

| Class | Window  | Fields                                                                                  |
|-------|---------|-----------------------------------------------------------------------------------------|
| 1     | 30 days | cost.*; privacy.data_retention; model_and_tier.* (current_versions, available_models, subscription_or_api_tiers). |
| 2     | 90 days | compatibility.*; protocols.*; security.*; privacy.telemetry_behavior; privacy.opt_out; capabilities.*. |
| 3     | 180 days | identity.*; openness.*.                                                                |

The freshness class is **field-specific and mechanically enforced** — the
validator rejects a profile that assigns the wrong class to a field. The matrix
generator computes staleness against an explicit evaluation date and renders
`STALE` next to any value past its window.

## 8. Vendor-submitted evidence labeling

Vendor-submitted profiles and runs carry one of:

- `vendor-submitted` — supplied by the vendor;
- `independently-unreproduced` — submitted by a non-vendor contributor but not yet independently reproduced;
- `independently-reproduced` — reproduced by Kernux or a trusted second party.

Phase 1 has **no Runs** and **no independent reproduction**. The Phase 1
OpenCode profile is `community-submitted`, not vendor-submitted.

## 9. Correction process

Corrections are made via pull request:

1. The contributor updates the field's `value` and/or `source`, sets `verified`
   to the actual check date, and adds a `notes.changes` entry.
2. `uv run python -m tools.validate_profiles` must pass.
3. `uv run python -m tools.generate_matrix --check` must detect the drift;
   the contributor regenerates the matrix and commits both changes.
4. Reviewers confirm the new source is primary and the freshness class is correct.

## 10. Conflict resolution

If two primary sources disagree, the field is set to `claim_status: disputed`,
both sources are listed in `notes.disputes`, and the more conservative
interpretation is used in any generated view.

## 11. Prohibitions

- No paid ranking. No paid placement. No affiliate ranking. No undisclosed sponsorship.
- No overall "Kernux Score" or league table.
- No "production-ready," "enterprise-ready," "fully secure," or compliance-certification claims that Kernux cannot source.
- No AI-generated factual fields; AI may assist prose only.

## 12. Configuration-specific nature of future runs

Any future Run evidence binds to a complete configuration tuple (agent version,
model, tier, mode, OS, hardware, task revision, fixture commit, execution date,
cost methodology, evidence-bundle digest). A configuration-specific result is
**never** attributed to an agent universally. Phase 1 contains no Runs.

## 13. Phase 1 limitation

Phase 1 contains **one profile (OpenCode)** and **no evaluations, Runs, or
Controlled Evaluation Tasks**. This methodology is exercised on a single
vertical slice; it will be stress-tested as more profiles are added under
separately authorized phases.

Do not claim independent reproduction has occurred. It has not.
