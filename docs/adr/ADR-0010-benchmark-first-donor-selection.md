# ADR-0010: Benchmark-First Donor Selection and Superiority Claims

Status: Proposed
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Kodac intends to combine the strongest available OSS components and ultimately compete with leading coding agents and review systems. That creates a predictable failure mode: selecting donors based on popularity, architecture aesthetics, or anecdotal impressions, then later claiming Kodac is better without reproducible evidence.

External benchmarks are valuable but incomplete. They may emphasize one task family, become stale, or be vulnerable to contamination and optimization toward the benchmark rather than real engineering outcomes.

Kodac therefore needs benchmark discipline both for internal architecture choices and public claims.

## Decision

Kodac adopts **benchmark-first selection** for contested components and **evidence-gated superiority claims** for the product.

When multiple implementations can satisfy the same Kodac contract, selection should use reproducible comparison evidence before long-term lock-in whenever practical.

## Evaluation layers

### 1. Component benchmarks

Used for donor/tactical choices such as:

- patch/edit application;
- repository search/indexing;
- autocomplete;
- context selection;
- sandbox startup/overhead;
- checkpoint/restore;
- review finding extraction;
- model/provider routing.

### 2. Vertical-slice benchmarks

Used to evaluate complete flows such as:

```text
issue/task → understand → patch → verify → review → receipt
```

### 3. External benchmark suites

Kodac may integrate reproducible snapshots of recognized suites such as:

- SWE-bench Live;
- Multi-SWE-bench;
- Terminal-Bench;
- other future benchmarks after review.

External benchmark results never replace Kodac-native regression and outcome metrics.

### 4. Kodac Bench

Kodac will build an internal/public benchmark harness covering dimensions not captured well by issue-resolution leaderboards.

## Required dimensions

Depending on component/task, measure relevant subsets of:

### Correctness

- task resolution;
- build/type/lint/test success;
- hidden regression rate;
- deterministic verification outcome.

### Editing quality

- patch apply rate;
- syntax validity;
- minimality/edit distance;
- unintended file changes;
- conflict/retry rate.

### Repository intelligence

- correct file/symbol discovery;
- definition/reference precision;
- impact/blast-radius recall;
- relevant-test recall;
- context token efficiency.

### Review quality

- precision;
- recall;
- false-positive rate;
- duplicate rate;
- evidence/proof rate;
- post-fix verification success.

### Security/trust

- policy adherence;
- unauthorized-action attempts blocked;
- sandbox escape/bypass regression tests;
- secret/network boundary compliance.

### Efficiency

- latency;
- tokens;
- model cost;
- CPU/memory where material;
- number of retries/tool calls.

### Outcome quality

When ethically and operationally available:

- human acceptance;
- PR merged;
- CI pass after submission;
- revert/regression history;
- manual rewrite required.

## Fair-comparison rules

A competitive comparison must document at minimum:

```text
system/version/commit
model/provider/version
configuration
repository/task snapshot
hardware/execution environment
network assumptions
time/token/cost budgets
number of attempts
allowed tools
prompt/instruction policy
scoring method
raw artifacts/logs where distributable
```

When comparing orchestration systems, use the same underlying model where feasible so model quality is not misreported as system quality.

When a system requires a unique model or capability, report that difference explicitly rather than forcing an artificial equivalence.

## Reproducibility

Benchmark runs should produce machine-readable artifacts linked to:

- benchmark definition/version;
- exact Kodac commit;
- configuration digest;
- model identity;
- environment identity;
- patch/output artifacts;
- verification results;
- Execution Receipts where applicable.

Public results should be reproducible by a documented runner when licensing/data constraints allow it.

## Leakage and overfitting

Kodac must not optimize public claims around a single static benchmark.

Benchmark governance should include:

- contamination/leakage awareness;
- time-based or held-out tasks where possible;
- multiple repositories/languages;
- hidden regression cases;
- internal adversarial tests;
- periodic refresh of Kodac-native tasks.

## Donor replacement rule

An existing donor implementation may be replaced when a candidate demonstrates a meaningful improvement in the relevant metrics without violating architecture, provenance, license, or trust constraints.

Popularity or upstream novelty alone is not sufficient reason to replace a working component.

## Public claims

Do not publish claims such as:

- “best coding agent”;
- “beats X”;
- “safer than Y”;
- “lowest cost”;
- “highest review accuracy”;

unless the claim is scoped to a documented benchmark/result and the supporting evidence is available.

Marketing language must not outrun reproducible evidence.

## K2 minimum

The first executable vertical slice must include benchmark hooks from the beginning:

- elapsed time;
- selected model/provider;
- tool/invocation counts;
- patch artifact;
- verification outcome;
- receipt linkage.

This does not require running every external benchmark before K2 begins.

## Rejected alternatives

### Choose donors by GitHub stars

Rejected because popularity does not establish component quality or fitness for Kodac's contract.

### Optimize solely for SWE-bench score

Rejected because it would under-measure trust, review precision, autocomplete, repository intelligence, latency, cost, and long-term engineering outcomes.

### Allow product claims from internal demos

Rejected because demos are useful for communication, not proof of general superiority.

## Gate

Before a donor choice described as `best`, `winner`, or `superior` becomes canonical, the decision record must point to the comparison evidence or explain why a benchmark is not yet feasible and how the temporary choice will be revisited.
