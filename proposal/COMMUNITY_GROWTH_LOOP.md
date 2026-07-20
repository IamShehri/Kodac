# Community Growth Loop — Kernux Agent Index

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Implementation not authorized.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

Kernux's growth must be **earned by evidence**, not bought. This document describes the proposed flywheel and the guardrails that keep it honest. It does **not** claim Kernux fills a gap no other project covers (see [COMPETITOR_MAP.md](COMPETITOR_MAP.md)).

## The proposed flywheel

```
   1. A contributor profiles a new agent (or corrects one)
                  |
                  v
   2. The profile ships with sources + verification dates
                  |
                  v
3. A reader uses Kernux to decide which agent to try
                  |
                  v
   4. The reader runs a Controlled Evaluation Task and contributes a Run
                  |
                  v
5. The Run becomes new evidence → matrix/reports improve
                  |
                  v
          (back to 1: more agents worth profiling)
```

Each turn of the wheel adds **configuration-specific evidence**, not hype.

## Who the loop serves (audiences)

1. **Deciding developers** — "which agent should I use for X?" → profiles + matrix.
2. **Evaluating teams** — "what's the evidence this agent is safe/private/cheap?" → profiles + Runs.
3. **Agent authors** — "how does my agent compare on a controlled task?" → Controlled Evaluation Tasks + Runs (vendor-neutral by construction).
4. **Researchers** — "where are the reproducible artifacts?" → Runs.

## Contribution friction ladder (low to high)

| Step | Action | Effort | Gate |
|------|--------|--------|------|
| 1 | Read profiles/matrix | none | none |
| 2 | Open an issue (correction, stale source) | low | human review |
| 3 | Add a missing `unknown` field with a source | low | validate_profile passes |
| 4 | Profile a new agent | medium | full schema + sources |
| 5 | Design a new Controlled Evaluation Task | medium-high | deterministic verify |
| 6 | Contribute a Run | medium | validate_run passes + redaction review |

The ladder is deliberately **shallow at the bottom** and **strict at the top**. A Run is not published without verification.

## Vendor submissions (ratified)

Vendor-submitted profiles and runs are allowed, labeled exactly one of:

- `vendor-submitted`
- `independently-unreproduced`
- `independently-reproduced`

Vendor-submitted, independently-unreproduced runs do **not** appear in the primary reproduced-results view. Commercial sponsors may not alter schemas, methodology, inclusion criteria, evidence status, comparisons, or editorial conclusions.

## Honesty guardrails (non-negotiable)

- **No overall "Kernux Score."** The matrix compares fields; it does not rank.
- **No paid ranking. No paid placement. No affiliate ranking. No undisclosed sponsorship. No purchased stars/forks/reviews/activity.** (See [EDITORIAL_AND_EVIDENCE_POLICY.md](EDITORIAL_AND_EVIDENCE_POLICY.md).)
- **Vendor-reported is labeled.** Readers always see which fields are vendor assertions.
- **Stale is visible.** Out-of-date fields are flagged, not hidden.

## Discovery channels (coordinated, non-spam)

A **coordinated, non-spam** launch and ongoing discovery. Channels, in priority order:

1. **Search** for "X vs Y" and "is X open source / private / cheap" — profiles are SEO-friendly Markdown generated from canonical YAML.
2. **The dated monthly report** — a shareable summary derived only from committed evidence.
3. **HN / relevant subreddits / Lobsters / LinkedIn / X** — tailored (not copy-pasted) submissions, used sparingly and only when a report or a notable correction ships.
4. **Direct, transparent notification to maintainers** whose products are profiled.
5. **Word of mouth** among deciding developers and evaluating teams.

We do **not** rely on paid ads, paid placement, or influencer purchases.

## Launch authorization gate (ratified)

**No launch is authorized until** the repository contains:

1. useful sourced data, and
2. at least one complete reproducible evidence path.

Until both are met, no public launch submissions occur.

## Anti-patterns we refuse

- "Top 10 AI coding agents ranked" clickbait.
- Score-based leaderboards with arbitrary weights.
- Inflating the agent count to look comprehensive.
- Publishing a Run that failed verification as if it passed.
- Profiling an agent with mostly `unknown` fields and no sourcing plan.
- Marketing Controlled Evaluation Tasks as a SWE-bench replacement.

## Risks to the loop

- **Contributor burnout** at small scale → mitigate with a tiny, high-quality scope (the ratified ten v1 agents).
- **Vendor pressure** to soften negative findings → mitigate with the public editorial policy and PR-only corrections.
- **Staleness** → mitigate with the 30/90/180-day freshness classes and the dated "what changed" report.
- **Gaming** → a vendor could submit many low-quality Runs; mitigate with run-id determinism, redaction review, submission labels, and the segmentation of the primary reproduced-results view.

## Success signals (observable, not vanity)

- Number of profiles with `evidence_status: verified` (not total profiles).
- Number of Runs with `verification.status: pass` labeled `independently-reproduced`.
- Number of corrections sourced from primary URLs.
- Inbound PRs from agent vendors correcting facts (a sign of being read seriously).

**Non-signals:** GitHub stars alone, agent count, social media impressions.

## Implementation authorization

**Not authorized.** Legacy archival and the Phase 1 vertical-slice kickoff require separate authorization. This document records the growth approach; no tooling, CI, or website is created in this pass.
