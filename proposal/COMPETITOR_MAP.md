# Competitor Map — Kernux Agent Index

*Status: Ratified — S0-C Founder Ratification (2026-07-20).*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

## Purpose of this map

This map records what existing projects/pages already **own**, so Kernux can position itself rather than duplicate. It does **not** claim Kernux fills a gap no one else covers. Differentiation is a **positioning choice**, argued below, not a claim of unique ownership.

## Canonical SWE-bench positioning (permanent)

> Kernux is complementary to SWE-bench and other academic benchmarks. SWE-bench measures performance on real GitHub issues under its methodology. Kernux focuses on product capabilities, operating conditions, provenance, configuration-specific evidence, decision support, and controlled tasks. Kernux must not market its controlled tasks as a SWE-bench replacement.

## Competitor categories

| # | Category | Representative examples |
|---|----------|------------------------|
| 1 | Official vendor comparison pages | Provider "X vs Y" landing pages |
| 2 | Academic benchmarks | SWE-bench, SWE-bench Verified, HumanEval, AgentBench-style suites |
| 3 | Agent directories / lists | Community-maintained agent directories and "tools for X" sites |
| 4 | Generic awesome lists | `awesome-ai-coding`, `awesome-llm-agents` |
| 5 | Skills / plugin registries | Agent Skills marketplaces, MCP server directories |
| 6 | Courses & roadmaps | "Become an AI engineer" courses, learning tracks |

---

### 1. Official vendor comparison pages
- **What they own:** the vendor's own product, its pricing, and curated head-to-head pages that are, by construction, biased toward the vendor.
- **What Kernux must NOT copy:** vendor-authored framing, "we beat X by N%" claims, marketing screenshots.
- **Positioning choice for Kernux:** independent, source-cited profiles; vendor claims explicitly labeled `vendor-reported`; side-by-side fields the vendor will not publish (telemetry behavior, data retention, sandbox model).
- **Risk:** if vendors publish honest, machine-readable spec sheets, the independent layer shrinks to a re-publisher.

### 2. SWE-bench (and SWE-bench Verified)
- **What it owns:** a large, rigorous, peer-reviewed benchmark for resolving real GitHub issues in Python repos, with a public leaderboard.
- **What Kernux must NOT copy:** the SWE-bench dataset, leaderboard branding, or its scoring methodology.
- **Positioning choice for Kernux:** SWE-bench measures **one dimension** (issue resolution on curated Python repos) for systems that run it; Kernux's Controlled Evaluation Tasks are intentionally **small, configuration-specific, multi-task-type, and multi-agent**, with every run published as an evidence bundle rather than a single score. Kernux is explicitly **complementary**, never a replacement.
- **Risk:** if the community converges on SWE-bench Verified as *the* comparison standard, a smaller controlled-task set may be seen as redundant. This is the largest positioning risk.

### 3. AgentBench-style projects
- **What they own:** broad agent-capability evaluation suites across many task types.
- **What Kernux must NOT copy:** their task taxonomies or evaluation harnesses.
- **Positioning choice for Kernux:** these suites evaluate **general agent capability** and are research artifacts; Kernux indexes **product fitness and configuration-specific evidence**.
- **Risk:** moderate — different audiences, limited direct collision.

### 4. AI coding agent directories
- **What they own:** browsable catalogs of agents with short descriptions and links.
- **What Kernux must NOT copy:** link-directory UX, uncited descriptions, SEO-driven "top 50" lists.
- **Positioning choice for Kernux:** depth-first and source-cited, with verification dates, evidence status, and configuration-specific run results.
- **Risk:** if users only want "a list of what exists," directories win on breadth.

### 5. Generic awesome lists (`awesome-*`)
- **What they own:** community-curated link lists.
- **What Kernux must NOT copy:** the awesome-list format (one line per item, no schema).
- **Positioning choice for Kernux:** structured, sourced comparison along a fixed schema.
- **Risk:** low — they optimize for discovery, not decision.

### 6. Skills registries / MCP server directories
- **What they own:** catalogs of skills/plugins/servers, not agents-as-products.
- **What Kernux must NOT copy:** plugin/skill metadata; the MCP server catalog itself.
- **Positioning choice for Kernux:** index **agents** and record *whether* an agent supports MCP/Skills — not the catalogs themselves.
- **Risk:** low — different object class.

### 7. Courses & roadmaps
- **What they own:** learning paths.
- **What Kernux must NOT copy:** pedagogy, curriculum, certification.
- **Positioning choice for Kernux:** help decide **what to use**, not how to learn it.
- **Risk:** low.

## Positioning summary (what Kernux chooses to focus on)

1. **Source-cited schema** for agent profiles; every factual field has a primary source + verification date.
2. **Configuration-specific evidence bundles**, not scores — reproducible runs with the full configuration tuple.
3. **Vendor-reported vs independently-reproduced** labeling as a first-class concept.
4. **Zero-install usefulness** — the repository is the product; no build step for the reader.
5. **Explicit non-commercial posture** — no affiliate links, no paid placement, no overall score.

These are focus choices. They are **not** a claim that no one else does any of these.

## Honest risk register

- **Highest risk:** SWE-bench (and similar) already own "rigorous coding benchmark." Kernux Controlled Evaluation Tasks are explicitly **complementary**, not a replacement.
- **Second risk:** vendor comparison pages could improve.
- **Third risk:** accuracy at scale is expensive; profiles may decay toward staleness.
- **Fourth risk:** legal redistribution of task fixtures — mitigated by all-original fixtures (see INITIAL_TASK_SET.md).

## Implementation authorization

**Not authorized.** Legacy archival and the Phase 1 vertical-slice kickoff require separate authorization. This document is positioning/risk analysis; it creates no product.
