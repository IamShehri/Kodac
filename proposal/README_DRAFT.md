# Kernux — The open, evidence-backed guide to AI coding agents

> Compare AI coding agents using evidence, not marketing.

**Status: Proposal.** This README is a draft for founder review. It is not published yet.

> Authoritative decisions live in [`proposal/FOUNDER_DECISIONS.md`](proposal/FOUNDER_DECISIONS.md). On conflict, that file wins.

## What Kernux is

Kernux is an **open evidence and decision layer for AI coding agents.** It normalizes fragmented evidence — vendor documentation, academic benchmarks, community comparisons, and marketing claims — into **sourced profiles, reproducible configuration-specific runs, and decision-oriented comparisons**, with a source and a verification date on every factual field.

Kernux is **not** an agent, a framework, a skills marketplace, an awesome list, a generic course, an overall ranking service, or a pay-to-rank directory.

## SWE-bench positioning (permanent)

Kernux is **complementary to SWE-bench** and other academic benchmarks. SWE-bench measures performance on real GitHub issues under its methodology. Kernux focuses on product capabilities, operating conditions, provenance, configuration-specific evidence, decision support, and controlled tasks. **Kernux does not market its tasks as a SWE-bench replacement.**

## What's inside

- **Kernux Index** — source-cited agent profiles (`agents/<id>/profile.yaml`). One profile (OpenCode) is implemented in Phase 1; the remaining nine are future.
- **Kernux Matrix** — generated comparison tables across capabilities, platforms, pricing, privacy, licensing, sandboxing, telemetry, MCP, skills, automation, and CI (`matrix/`, generated from `agents/`).
- **Kernux Lab** — **Controlled Evaluation Tasks** with deterministic acceptance criteria (future; `tasks/` is not yet implemented).
- **Kernux Runs** — configuration-specific evidence bundles: config, versions, timestamps, logs, artifacts, cost, duration, verification results (future; `runs/` is not yet implemented).
- **Kernux Reports** — dated analytical reports based only on documented evidence (`reports/`).
- **Kernux Proof** — a future evidence schema and verification utility. **Not built in v1** (`proof/`).

## No overall score

Kernux **does not** publish an overall "Kernux Score" or league table. Comparisons are decision-oriented (e.g., best-documented free option; privacy characteristics; local-model capability; terminal support; headless/CI support; permission/sandbox controls; model-provider flexibility; independently reproduced controlled-task results). None are universal winner declarations.

## How to use it (zero-install)

1. Read a profile in `agents/<id>/profile.yaml` (rendered as Markdown). Every factual field cites a source and a verification date.
2. Open `matrix/` to compare agents side by side.
3. Open `runs/` (future) to see exactly how a specific configuration performed on a Controlled Evaluation Task — what it cost, how long it took, and whether it passed.
4. Open `reports/` for a dated, defensible summary, with every claim cited.

You do **not** need to install anything to read any of the above.

## Canonical data format

- **YAML** is the canonical representation for profiles and run metadata.
- **JSON Schema** validates it.
- **Markdown** profiles/tables are **generated views**.
- **Python** is the only repository tooling language for v1.
- **No database** in v1.

## Run identity

Every result is bound to a complete configuration tuple (agent name, version, model, tier, mode, configuration, permissions, OS, hardware, task-set revision, fixture commit, date, cost methodology, evidence-bundle digest). A configuration-specific result is **never** attributed to an agent universally.

## V1 agent set (ten)

OpenAI Codex, Anthropic Claude Code, Google Gemini CLI, GitHub Copilot, Cursor, Windsurf, OpenCode, Aider, Cline, OpenHands.

> **OpenCode note:** profiled at https://github.com/anomalyco/opencode, distinct from the archived https://github.com/opencode-ai/opencode.
> **Devin:** excluded from v1; may be reconsidered later as a vendor-profiled entry when sufficient independently checkable evidence is available.

## What Kernux will not do

- No overall score or league table.
- No paid ranking, paid placement, affiliate ranking, or undisclosed sponsorship.
- No "production-ready," "enterprise-ready," or "fully secure" claims.
- No AI-generated factual fields.
- No redistribution of upstream code we are not licensed to redistribute.
- No marketing of Controlled Evaluation Tasks as a SWE-bench replacement.

## Editorial stance

- **Evidence before claims.** Official sources before secondary sources.
- **Verified facts are separated from vendor-reported claims** (every such field is labeled `vendor-reported`).
- **`unknown` and `stale` are different, first-class states.**
- Freshness windows: 30 days (price/tier/versions/models/retention), 90 days (capabilities/integrations/protocols/modes/sandbox), 180 days (low-volatility fields). Expired fields are visibly marked **STALE**.
- See [`proposal/EDITORIAL_AND_EVIDENCE_POLICY.md`](proposal/EDITORIAL_AND_EVIDENCE_POLICY.md) for the full policy.

## Vendor submissions

Vendor-submitted profiles and runs are allowed and labeled `vendor-submitted`, `independently-unreproduced`, or `independently-reproduced`. Vendor-submitted, independently-unreproduced runs do **not** appear in the primary reproduced-results view.

## Contributing

At launch, Kernux welcomes sourced corrections, new `unknown` fields filled in with a primary source, new agent profiles (full schema + sources), new Controlled Evaluation Tasks (deterministic verify required), and new Runs (redaction-reviewed). See `CONTRIBUTING.md` at launch.

## Relationship to earlier work

This repository previously hosted a different direction (a "trust kernel" / `nexusmcp` prototype). That material is preserved as **historical** and is **not** part of this product. It will be archived via a separately authorized Git operation; this pass moves, copies, deletes, commits, or pushes none of it.

## License

Apache-2.0. See [`LICENSE`](LICENSE).

## Status and caveats

- This is a **proposal**. No factual agent profile field is populated yet; real profiles are created only when every non-`unknown` field has an authoritative source.
- **Launch is not authorized** until the repository contains useful sourced data and at least one complete reproducible evidence path.
- Kernux makes **no** compliance, certification, security, or production-readiness claim about itself or any agent it profiles beyond what is explicitly sourced and labeled.

---

*Draft for founder review. Do not promote until the proposal is approved and the launch exit criteria in [`proposal/30_DAY_LAUNCH_PLAN.md`](proposal/30_DAY_LAUNCH_PLAN.md) are met.*
