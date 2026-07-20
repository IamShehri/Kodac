# Editorial and Evidence Policy — Kernux Agent Index

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Normative for all contributed content.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

This is the single source of truth for what counts as acceptable evidence, how claims are labeled, how sources are cited, and what we refuse to publish.

## Core principles

- **Evidence before claims.** No factual statement without a source.
- **Official sources before secondary sources.** Vendor docs and public source repos outrank blog posts and social media.
- **Every factual profile field has a source and a verification date.**
- **Verified facts are separated from vendor-reported claims.**
- **No affiliate links. No paid ranking. No paid placement. No undisclosed sponsorship.**
- **No overall "Kernux Score."**
- **No "production-ready," "fully secure," or similar unsupported claims.**
- **No AI-generated factual fields.** AI may assist prose only.
- **Small and accurate is better than large and shallow.**
- **English is canonical for launch.**
- **The repository must be useful without installing software.**

## Source hierarchy (highest to lowest)

1. **Primary official:** vendor's official site/docs, official public source repo, official changelog/release notes, official security advisory.
2. **Primary non-official:** the agent's own public repo if community-maintained, with maintainer attribution.
3. **Secondary:** reputable technical press, conference talks with slides/transcripts.
4. **Tertiary (context only):** blog posts, tweets, HN/Reddit threads. Allowed only for non-factual context; never the sole source for a factual field.

A field sourced only at tier 3 or below is **not publishable** as a factual field.

## Claim labeling

Every field that could be mistaken for a verified fact carries `claim_status`:

| Value | Meaning |
|-------|---------|
| `verified` | Independently confirmed by a Kernux contributor (ideally with a reproducing Run). |
| `vendor-reported` | Sourced only from the vendor; not independently confirmed. |
| `unknown` | No acceptable source found. |
| `disputed` | Sources conflict; documented in the profile notes. |

## Vendor-submission labels (ratified)

Vendor-submitted profiles and runs carry a `submission` label, exactly one of:

- `vendor-submitted`
- `independently-unreproduced`
- `independently-reproduced`

**Vendor-submitted, independently-unreproduced runs must NOT appear in the primary reproduced-results view.** Commercial sponsors may not alter schemas, methodology, inclusion criteria, evidence status, comparisons, or editorial conclusions.

## Freshness policy (ratified)

Three freshness classes:

| Class | Window | Fields |
|-------|--------|--------|
| 1 | **30 days** | price; subscription tiers; current versions; available models; documented data retention. |
| 2 | **90 days** | capabilities; integrations; MCP and skills support; execution modes; sandbox and permission behavior. |
| 3 | **180 days** | lower-volatility historical and organizational fields. |

Every factual field records its freshness class. **Expired fields are visibly marked STALE** in generated views.

**`unknown` and `stale` are different states:**
- `unknown` = no source found.
- `stale` = a previously-verified source is past its freshness window.

Both are first-class; `stale` is a **derived** state computed from `verified` + `freshness_class`.

## Unsupported-phrase policy

The following are **forbidden** as positive claims (allowed only inside explicit non-claims, e.g., "Kernux is not production-ready"):

- "production-ready", "production ready"
- "enterprise-ready", "enterprise ready"
- "fully secure", "fully-safe"
- "HIPAA-ready", "HIPAA-compliant", "SOC 2 certified" (unless the vendor publishes the actual cert and we link it; even then label `vendor-reported`)
- "guaranteed", "unbreakable", "zero-trust" (as a Kernux claim)
- any compliance/certification claim Kernux itself cannot back

`validate_profile.py` fails on any occurrence as a positive claim.

## SWE-bench positioning discipline (permanent)

Kernux is complementary to SWE-bench and other academic benchmarks. Controlled Evaluation Tasks must **never** be marketed as a SWE-bench replacement, as real-world benchmark tasks, as representative of all software engineering, or as proof of production performance.

## No overall score (permanent)

Kernux does not publish an overall "Kernux Score" or league table. Comparisons are decision-oriented (best-documented free option; privacy characteristics; local-model capability; terminal support; headless/CI support; permission/sandbox controls; model-provider flexibility; independently reproduced controlled-task results). These are never universal winner declarations.

## Sourcing and dating

- `source` is a URL (or `none` for `unknown`).
- `verified` is the ISO date a **human** last checked the source.
- A field is `stale` when `today - verified` exceeds its freshness-class window.

## AI assistance policy

- AI may draft prose, summarize, or restructure.
- AI **must not** populate factual fields; a human must find and cite the source.
- AI-generated text must be reviewed and edited before merge.
- Commit messages must not imply AI verified a fact.

## Redaction policy (Runs)

- API keys, bearer tokens, cookies, credentials, private keys are always removed.
- File paths revealing private infrastructure are removed.
- PII is removed by default.
- The verification output hash and acceptance criteria are **never** redacted.
- Full policy in `policy/EDIT.md` at launch.

## Conflict and correction policy

- If two sources conflict, mark the field `disputed`, document both sources, and prefer the more conservative interpretation in any summary.
- Corrections are made via PR with a dated entry in the profile's `notes.changes`.
- Run corrections use the supersession mechanism (see [RUN_EVIDENCE_SCHEMA.md](RUN_EVIDENCE_SCHEMA.md)); old Runs are never edited.

## Commercial integrity (permanent prohibitions)

- No paid ranking.
- No paid placement inside comparative results.
- No affiliate ranking.
- No undisclosed sponsorship.
- No purchasing of stars, forks, reviews, or community activity.

Infrastructure and report sponsorship may be considered later only with clear disclosure and editorial independence.

## Licensing of contributed content

- All Kernux-authored prose and fixtures are Apache-2.0.
- Agent names, logos, and trademarks belong to their owners; we use names for identification only, nominatively, and never imply endorsement.
- We do not redistribute upstream code we are not licensed to redistribute (see [INITIAL_TASK_SET.md](INITIAL_TASK_SET.md)).

## What we refuse to publish

- Profiles whose factual fields are mostly `unknown` with no sourcing plan.
- Runs whose logs cannot be safely redacted.
- Any content containing secrets or credentials.
- Any ranking that reduces an agent to a single "score."
- Any compliance/certification claim we cannot source.

## Enforcement

- `validate_profile.py` and `validate_run.py` enforce machine-checkable rules in CI (added before launch, under separately authorized implementation).
- A human editor (initially the founder) is the final authority on disputes.

## Implementation authorization

**Not authorized.** Legacy archival and the Phase 1 vertical-slice kickoff require separate authorization. This document records policy; no validators or CI are created in this pass.
