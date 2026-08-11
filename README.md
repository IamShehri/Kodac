# Kodac

> Done means proven.

Kodac is an open, model-agnostic agentic software-engineering platform focused
on trusted execution, verification, evidence, and proof-oriented completion.

## Current status

The following status applies to the isolated K2 work on
`feat/kodac-k2-runtime-spine`; it does not imply that K2 has merged into
canonical `main` or that a public release is authorized.

| Area | Status |
|---|---|
| K2 isolated runtime technical proof | **PASS** |
| Real OpenAI provider qualification | **PASS — 9/9** |
| First controlled real-model solve | **PROVEN_READY** |
| Canonical `main` merge | **NOT YET AUTHORIZED** |
| Public brand launch | **NOT AUTHORIZED** |
| Name clearance | **NOT ESTABLISHED** |

See the [K2 final technical closure](docs/planning/KODAC_K2_FINAL_TECHNICAL_CLOSURE_2026-08-11.md)
for the verified evidence identities, technical scope, and continuing
authorization boundaries.

## Kodac Evidence Catalog

Kodac preserves the earlier Kernux evidence-backed guide to AI coding agents as
the **Kodac Evidence Catalog**: an independent, source-cited subsystem that
normalizes fragmented evidence (vendor documentation, academic benchmarks,
community comparisons, and marketing claims) into sourced profiles and
decision-oriented comparisons.

> **Original evidence-catalog Phase 1 status.** This subsystem currently
> contains one profiled agent ([OpenCode](agents/opencode/profile.yaml)), the
> agent-profile schema and validator, a deterministic comparison matrix, and
> tests. The other nine launch profiles, Controlled Evaluation Tasks, Runs,
> reports, and any hosted website remain unimplemented within that original
> catalog roadmap.

## What you can do right now (zero-install)

- Read the [**Agent Matrix**](matrix/AGENT_MATRIX.md) — a generated, no-overall-score
  comparison of profiled agents.
- Read the [**OpenCode profile**](agents/opencode/profile.yaml) — every factual
  field cites a primary source and a verification date.
- Read the [**Profile Sourcing Methodology**](docs/methodology/PROFILE_SOURCING.md)
  for how facts are sourced, labeled, and kept fresh.

## How the Kodac Evidence Catalog works

- **Canonical format:** profiles are YAML (`agents/<id>/profile.yaml`), validated
  by a [strict JSON Schema](schema/agent-profile.schema.json) plus a custom
  evidence-policy layer. Markdown is a generated view, not the source of truth.
- **Evidence before claims:** every non-`unknown` factual field carries a source
  with a content digest (`content_sha256`) and a verification date. Immutable
  sources are pinned where technically possible (raw GitHub URLs pinned to exact
  commit SHAs); dynamic sources (GitHub API, vendor homepages) carry a
  point-in-time digest and may drift. A digest alone does not make a dynamic
  URL immutable.
  Vendor-reported facts are labeled `vendor-reported`; artifact-verified facts
  (repository identity, LICENSE, release metadata) are labeled `verified`.
- **Claim status is mechanical, not prose.** Each evidence record carries a
  `verification_method` that must be compatible with its `claim_status`:
  `verified` requires `repository-artifact`, `repository-metadata`,
  `release-metadata`, or (future) `independent-execution`;
  `vendor-reported` requires `official-documentation` or `vendor-marketing`.
- **Derived evidence summaries:** `evidence_status` and `last_verified` are
  computed by tooling from field-level claim statuses, never authored by hand.
- **`unknown` and `stale` are different states.** `unknown` means no source was
  found (absence of documentation is not a vendor claim); `stale` means a
  previously-verified source is past its freshness window.
- **Freshness windows (field-specific):** 30 days (price/versions/models/retention),
  90 days (capabilities/integrations/protocols/modes/sandbox),
  180 days (identity/openness). Expired values are visibly marked `STALE`.

## Claim status and evidence semantics

A factual field is one of:

| State             | Meaning                                                                                       |
|-------------------|-----------------------------------------------------------------------------------------------|
| `verified`        | Established from a directly inspectable artifact (repository identity, LICENSE, release metadata) or independent execution. Does **not** mean "a contributor read a vendor documentation page." |
| `vendor-reported` | A direct claim from official documentation, vendor website, or marketing; not independently reproduced. |
| `unknown`         | No acceptable direct source found. Absence of documentation is **not** a vendor claim — it is an assessment limitation. |
| `disputed`        | Acceptable sources conflict; the dispute is documented in the profile.                        |

The original evidence-catalog Phase 1 slice has **no Run evidence** and **no
independent behavioral reproduction**. Within that slice, reading a vendor's
documentation does not independently verify product behavior; behavioral,
capability, protocol, pricing, and privacy fields are `vendor-reported`. Only
repository identity, license, and release metadata are `verified` through
artifact evidence.

## Complementary to SWE-bench

The Kodac Evidence Catalog is **complementary to SWE-bench** and other academic
benchmarks. SWE-bench measures performance on real GitHub issues under its
methodology. The catalog focuses on product capabilities, operating conditions,
provenance, and decision support. It does **not** market its future Controlled
Evaluation Tasks as a SWE-bench replacement.

## No overall score

The Kodac Evidence Catalog does **not** publish a universal overall score or
league table. Comparisons are decision-oriented (privacy characteristics,
local-model capability, terminal support, headless/CI support,
permission/sandbox controls, model-provider flexibility) and are never
universal winner declarations.

## Original evidence-catalog roadmap status

The following remain unimplemented in the original evidence-catalog Phase 1
roadmap:

- the other nine launch profiles (Claude Code, Gemini CLI, GitHub Copilot,
  Cursor, Windsurf, Aider, Cline, OpenHands, OpenAI Codex);
- Controlled Evaluation Tasks;
- Run evidence bundles and benchmark execution;
- dated analytical reports;
- a hosted website, CI beyond the local toolchain, and any launch activity.

## Evidence-catalog tooling (for contributors)

```bash
uv sync                                       # install Python deps from uv.lock
uv run python -m tools.validate_profiles      # validate all profiles
uv run python -m tools.generate_matrix        # regenerate the matrix
uv run python -m tools.generate_matrix --check # fail if matrix is out of date
uv run pytest -q                              # run the test suite
uv run ruff check .                           # lint
uv run ruff format --check .                  # format check (optional)
```

No network access is required to validate profiles, generate the matrix, or run
tests. Python 3.11+ and [uv](https://github.com/astral-sh/uv) are the only
toolchain requirements.

## Relationship to earlier work

Kodac preserves the earlier Kernux evidence catalog, its sourced profiles, and
its methodology as evidence and history rather than destructively deleting
them. Kodac is not merely a rebrand: it was reconstituted around a new
runtime/platform architecture focused on trusted execution, verification,
evidence, and proof-oriented completion. Legacy Kernux planning and decision
material remains historical input unless explicitly referenced by a current
accepted Kodac record.

Before Kernux, this repository hosted a different direction (a "trust kernel" /
`nexusmcp` OmniBridge prototype). That material remains preserved on local
archive branches (`archive/trust-kernel-s0b`,
`archive/omnibridge-pre-reboot`) as history and is not current Kodac
architecture.

## Current governance authority

Current Kodac architecture, governance, and planning truth lives primarily in
the accepted records under [`docs/adr/`](docs/adr/),
[`docs/governance/`](docs/governance/), and
[`docs/planning/`](docs/planning/). Content under
[`proposal/`](proposal/) and legacy Kernux planning and decision material is
preserved as historical input unless explicitly referenced by a current
accepted Kodac record.

## License

Apache-2.0. See [LICENSE](LICENSE).

---

*No canonical `main` merge or public brand launch is authorized by this README.
The evidence catalog computes no universal overall score. Kodac makes no
compliance, certification, security, or production-readiness claim beyond what
is explicitly established by accepted governance records and cited evidence.*
