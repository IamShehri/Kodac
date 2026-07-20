# Initial Agent Set — Kernux Index (V1, ratified)

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Phase 1 implemented locally; independent acceptance pending.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

## V1 launch set (exactly ten)

The v1 launch profiles are **exactly** the following ten. Earlier candidate lists are superseded by this set.

| # | Slug | Product | Notes |
|---|------|---------|-------|
| 1 | `openai-codex` | OpenAI Codex | |
| 2 | `claude-code` | Anthropic Claude Code | |
| 3 | `gemini-cli` | Google Gemini CLI | |
| 4 | `github-copilot` | GitHub Copilot | |
| 5 | `cursor` | Cursor | |
| 6 | `windsurf` | Windsurf | |
| 7 | `opencode` | OpenCode | **Pinned** — see below. |
| 8 | `aider` | Aider | |
| 9 | `cline` | Cline | |
| 10 | `openhands` | OpenHands | |

## OpenCode pinning (ratified)

`opencode` is pinned to:

- **Canonical:** https://github.com/anomalyco/opencode

It must be explicitly distinguished from the **archived** repository:

- **Archived (not the profiled project):** https://github.com/opencode-ai/opencode

The profile must record both URLs and clearly mark which is the canonical source and which is the archived repository to avoid confusion.

## Excluded from v1

- **Devin** is excluded from v1. It may be reconsidered later as a **vendor-profiled entry** when sufficient **independently checkable** evidence is available. This exclusion is recorded in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md).

## Product tracks (ratified)

Each profile declares membership in one or more tracks. Tracks scope comparisons and never collapse into an overall ranking. The proposed initial track assignments (to be confirmed during sourcing) are illustrative:

| Agent | Likely tracks (illustrative, to be verified) |
|-------|-----------------------------------------------|
| OpenAI Codex | terminal-agents; cloud-or-async-agents |
| Claude Code | terminal-agents; cloud-or-async-agents |
| Gemini CLI | terminal-agents; privacy-first-or-local-capable-agents |
| GitHub Copilot | ide-integrated-agents |
| Cursor | ide-integrated-agents |
| Windsurf | ide-integrated-agents |
| OpenCode | terminal-agents; open-source-agent-scaffolds |
| Aider | terminal-agents; open-source-agent-scaffolds; privacy-first-or-local-capable-agents |
| Cline | ide-integrated-agents; open-source-agent-scaffolds |
| OpenHands | open-source-agent-scaffolds; cloud-or-async-agents |

These assignments are **not facts** until verified with sources during the (separately authorized) profile-authoring pass. An agent may belong to multiple tracks.

## No overall score

The v1 set is **not** ranked. Comparisons are decision-oriented (best-documented free option, privacy characteristics, local-model capability, terminal support, headless/CI support, permission/sandbox controls, model-provider flexibility, independently reproduced controlled-task results). See [PRODUCT_POSITIONING.md](PRODUCT_POSITIONING.md).

## Sourcing requirement (carried from policy)

No factual field is populated in this document. Each profile is created only when every non-`unknown` field has an authoritative primary source and a verification date, per [EDITORIAL_AND_EVIDENCE_POLICY.md](EDITORIAL_AND_EVIDENCE_POLICY.md) and [AGENT_PROFILE_SCHEMA.md](AGENT_PROFILE_SCHEMA.md). Use `unknown` when evidence is unavailable; never guess.

## What is explicitly NOT done in this document

- No factual field is populated.
- No `verified` date is set to a real source check.
- No claim is made about capability, pricing, or licensing for any agent.
- No profile file is created by this document. The OpenCode profile (`agents/opencode/profile.yaml`) exists from the separately authorized Phase 1 vertical slice; the other nine profiles are not yet authored.

## Implementation authorization

**Phase 1 implemented locally.** Independent acceptance pending. Phase 2 remains unauthorized. This document records the v1 set; the OpenCode profile YAML (`agents/opencode/profile.yaml`) is implemented in Phase 1. The remaining nine profiles await Phase 2.
