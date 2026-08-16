# Kodac Future Intelligence Research — 2026-08-16

> Status: research / future-direction record only.
>
> This document does **not** authorize implementation, change H4 scope, mint evidence, weaken trust boundaries, or permit merge. Active canonical authorization documents and live GitHub state remain authoritative for execution.

## 1. Founder direction preserved

The product name remains **Kodac**. `Times` / `TimesCode` is not the active rename.

Kodac should not become merely a better PR-review bot. The long-term target is a self-improving software-engineering intelligence system that can understand a repository, predict consequences of engineering actions, execute through specialized agents and tools, verify reality against prediction, remember outcomes, and improve from experience.

A concise long-term description is:

> **Kodac understands the repository, predicts the consequences of engineering actions, executes with specialized agents, verifies reality against prediction, remembers outcomes, and improves from experience.**

This future direction must not derail the active H4 sequence.

## 2. Product invariant: unlimited-by-design

Preserve the founder product invariant:

`NO_KODAC_IMPOSED_ARTIFICIAL_LIMITS`

Kodac should not impose arbitrary vendor-style review quotas, daily caps, file caps, waiting periods, trial exhaustion, or equivalent artificial restrictions.

This does **not** mean ignoring physical or safety constraints. The intended distinction is:

- artificial Kodac product limits: forbidden as a design principle;
- actual user compute limits: observable and schedulable;
- external provider quotas/rate limits: detectable and escapable through provider interchangeability/failover where possible;
- user-configured safety/resource budgets: permitted;
- trust/security/provenance/evidence constraints: must remain fail-closed and cannot be weakened for throughput.

Long-term architecture families associated with this invariant:

- local-first and static-first analysis lanes;
- self-hosted scheduler/runtime;
- BYOK/BYOM provider abstraction;
- provider health checks, circuit breakers, and failover;
- local inference;
- parallel review workers / swarms;
- work stealing;
- distributed worker pools;
- incremental review;
- content-addressed caching;
- progressive finding emission;
- deterministic static/compiler/symbolic/security/test lanes independent of LLMs;
- graceful degradation from multi-agent -> single-agent -> local-model -> static-only rather than arbitrary refusal;
- provenance and evidence attached to every lane and finding;
- weighted scheduling/backpressure based on real compute and task value rather than arbitrary product quotas.

CodeRabbit, Qodo, Cubic, Greptile, Graphite, Semgrep, CodeQL, Sonar, Snyk, and similar systems are competitors/references/donors where licensing and rights permit; they are not mandatory Kodac runtime dependencies.

## 3. Research reference: Training AI Scientists to Replicate Research / Faraday / Replica

Primary references:

- https://arxiv.org/abs/2608.13331
- https://arxiv.org/pdf/2608.13331
- https://www.alphaxiv.org/pdf/2608.13331v1
- https://inherentlabs.ai/research/training-to-replicate

Paper title: **Training AI Scientists to Replicate Research**.

Key paper facts captured from the paper reviewed on 2026-08-16:

- The authors introduce **Replica**, a task space of 310 paper-replication tasks from 100 ML and AI-for-science papers spanning 1990–2026.
- Each task redacts a results figure and asks an agent to reproduce the experiment under time/compute limits rather than merely copy the figure.
- The reward system uses auto-generated per-task rubrics and a coding-agent judge, with multiple judge samples to reduce variance.
- The rubric covers visual fidelity, reproduction of the scientific claim, implementation fidelity, use of compute budget, and scientific integrity.
- They post-train a 27B policy named **Faraday** using a modified GRPO recipe with turn-level credit assignment.
- Faraday uses a frontier coding agent as a tool (CAT: coding agent as a tool) rather than trying to replace the coding agent.
- The harness is deliberately simple: a small tool set, a container, a linear append-only conversation, parallel tool calls, and optional multiple coding-agent invocations.
- The reported result is that the trained policy can outperform stronger frontier coding-agent baselines on held-out replication tasks, suggesting that a learned higher-level policy can improve how a much larger coding agent is directed.
- The paper reports that prompt optimization alone does not recover the same gain, supporting the idea that post-training can teach transferable problem-solving behavior that prompt engineering does not fully reproduce.
- Qualitatively, Faraday more often implements the mechanism an experiment is supposed to test instead of hard-coding expected outcomes or taking shortcuts that flatter results.

### Implication for Kodac

The important pattern is not “build an AI scientist.” It is:

```text
high-level learned engineering policy
             |
             v
    frontier coding agents as tools
             |
             v
       real repository actions
             |
             v
   evidence + outcome evaluation
```

A future Kodac policy should be able to decide:

- which coding agent/model/tool to invoke;
- whether to run one agent or several in parallel;
- what to ask each worker to investigate;
- when to reset context or resume a prior worker;
- when to stop exploring and verify;
- when a result is an implementation shortcut rather than a faithful solution;
- how much compute is justified by expected value;
- how to learn from outcome data without weakening trust gates.

The strategic concept to preserve is **a learned engineer above coding agents**, not a fixed hand-authored orchestration graph forever.

## 4. Research reference: Agent Memory

Primary reference:

- https://arxiv.org/abs/2602.06052

Preserve the architectural interpretation that agent memory is not merely RAG or a vector database. Long-term Kodac memory should distinguish at least:

### Repository semantic memory

What the codebase means:

- architecture;
- modules;
- invariants;
- APIs;
- domain semantics;
- dependency relationships.

### Repository episodic memory

What happened:

- PR histories;
- failed and successful fixes;
- regressions;
- review trajectories;
- CI failures;
- security incidents;
- accepted/rejected findings;
- model/tool outcomes.

### Procedural memory

How this repository prefers work to be done:

- migration patterns;
- review procedures;
- proof strategies;
- testing conventions;
- security review methods;
- repository-specific skills.

### Agent-private memory

Specialized memories for security, correctness, testing, architecture, performance, and other agents.

### Shared evidence memory

A common evidence workspace with explicit read/write authority, provenance, conflict handling, deduplication, and deterministic identifiers where appropriate.

### Founder/team memory

Accepted decisions, rejected designs, product invariants, scope boundaries, and non-negotiable trust requirements.

Long-term research should also evaluate **learned memory policies**: what to store, retrieve, summarize, expire, deduplicate, or promote based on measured downstream utility.

## 5. Research reference: Foundation Agents

Primary reference:

- https://arxiv.org/pdf/2504.01990

Preserve this as a broad architectural checklist around:

- modular agent architecture;
- self-enhancement / continual evolution;
- multi-agent collective intelligence;
- robustness and safety.

Kodac should avoid becoming a brittle hand-designed collection of narrow agents whose restrictive interfaces limit exploration. Specialization is useful, but coordination should remain adaptable and evidence-driven.

A possible future conceptual stack:

```text
Repository -> perception/indexing/graph -> world model
                                      |
             +------------------------+------------------------+
             |                        |                        |
         Security                 Correctness              Architecture
           agent                     agent                    agent
             |                        |                        |
             +-------------------- shared evidence ------------+
                                      |
                                debate / judge
                                      |
                                 verification
                                      |
                                  provenance
                                      |
                                    memory
                                      |
                              self-improvement
```

## 6. Research direction: Inherent Labs and recursive collective self-improvement

Reference:

- https://inherentlabs.ai/research/training-to-replicate

Preserve the distinction:

> **self-improving != self-authorizing**

Kodac may eventually discover, propose, benchmark, and learn better strategies, prompts, routing policies, memory policies, tools, and agent compositions.

It must **not** silently grant itself new capabilities, expand a trust boundary, change governance, or mint stronger evidence claims merely because a learned policy prefers it.

A safe high-level loop is:

```text
Kodac performs work
      |
records outcome and evidence
      |
evaluates reviewer/agent strategy
      |
discovers weak strategies
      |
proposes alternatives
      |
benchmarks under controlled gates
      |
promotes only proven improvements
```

Self-improvement remains subordinate to explicit trust, provenance, evidence, and authorization rules.

## 7. Research reference: mHC

Primary reference:

- https://arxiv.org/pdf/2512.24880

This work is relevant primarily if Kodac eventually trains its own foundation or specialist models. Do not cargo-cult neural-network architectural ideas into agent orchestration.

Preserve as a future model-training research reference rather than a present product architecture requirement.

Potential future comparison set for learned encoders/models may include techniques such as:

- JEPA-style objectives;
- SIGReg and related anti-collapse regularization;
- VICReg;
- Barlow Twins;
- contrastive objectives;
- masked code modeling;
- graph prediction;
- next-state prediction.

Benchmark evidence, not aesthetic similarity, should decide adoption.

## 8. Research reference: LeWorldModel

Primary references:

- https://arxiv.org/abs/2603.19312
- https://arxiv.org/pdf/2603.19312

Paper: **LeWorldModel: Stable End-to-End Joint-Embedding Predictive Architecture from Pixels**.

The direct implementation domain is visual control, not software engineering, so Kodac should **import the abstraction, not copy the implementation**.

The important abstraction is:

```text
current latent state + action -> predicted next latent state
```

### Kodac Repository World Model

A future Kodac analogue could represent repository state from structured software signals rather than pixels:

```text
Source
- AST
- symbols
- types
- imports
- dependency graph
- call graph

Behavior
- tests
- coverage
- runtime traces
- benchmarks
- build outputs
- failure signatures

History
- commits
- PRs
- previous fixes
- regressions
- review findings

Trust
- provenance
- security boundaries
- permissions
- sandbox evidence
- policy invariants

Intent
- specs
- issues
- acceptance criteria
- architectural decisions
```

A hybrid state encoder could combine graph structure, code embeddings, deterministic facts, and runtime state into a compact repository-state representation.

Then a dynamics predictor could approximate:

```text
z(repository_t) + z(engineering_action_t)
                 ->
z(repository_t+1)
```

This would enable future **counterfactual engineering**: evaluate likely consequences of candidate patches/refactors/test strategies before expensive or destructive execution.

## 9. Kodac Engineering Surprise

A particularly valuable world-model-derived signal is **violation of expectation / surprise**.

Concept:

```text
expected next state
        vs
observed next state
        |
        v
engineering surprise score
```

Examples:

- a small authentication refactor unexpectedly affects billing, database, serialization, and network-policy surfaces;
- a symbol rename causes a much larger blast radius than predicted;
- an agent modifies dozens of unrelated files;
- tests pass but runtime or dependency behavior diverges sharply from expected consequences;
- a security-sensitive change has an anomalous trajectory even though conventional checks remain green.

High surprise should not automatically mean “bug.” It should be a routing/calibration signal that can trigger:

- deeper verification;
- an independent reviewer;
- an alternate plan;
- static-analysis escalation;
- additional runtime evidence;
- human review when required.

This is a possible future source of advantage over review systems that only inspect the final diff.

## 10. Kodac Counterfactual Engineering

Preserve this future research concept:

Before executing an expensive or risky engineering action, Kodac may simulate or predict candidate consequences:

```text
candidate plan A -> predicted state A
candidate plan B -> predicted state B
candidate plan C -> predicted state C
                         |
                         v
                compare / calibrate
                         |
                         v
                 execute best plan
```

Possible predicted properties:

- affected files;
- dependency changes;
- likely tests/failures;
- security-boundary changes;
- compatibility impact;
- blast radius;
- latency/compute cost;
- probability of success;
- confidence/calibration uncertainty.

The predictor need not be perfect to be valuable, but its outputs must be calibrated and treated as predictions, never as evidence of what actually happened.

## 11. Kodac Experience Network

Do not store only final findings. Preserve complete engineering trajectories where governance and privacy permit.

A future experience record may contain:

```text
problem
context
repository state
agent/model/tool identities
strategy
hypotheses
commands/actions
observations
evidence gathered
finding
confidence
reviewer disagreement
developer action
tests
merge outcome
future regression
final utility
```

The long-term learning loop becomes:

```text
PR / task
   -> trajectory
   -> outcome
   -> calibrated utility
   -> memory
   -> policy / routing / skill improvement
```

Signals may include whether a finding was accepted, rejected, fixed, later confirmed by a regression/incident, or shown to be noisy.

## 12. Adaptive compute, not artificial quotas

Unlimited-by-design should be paired with intelligent scheduling rather than wasteful scheduling.

Kodac should eventually learn or estimate:

- which agents are useful for which surfaces;
- which files deserve deep analysis;
- where disagreement has value;
- when deterministic/static analysis is enough;
- when a second model is worth the cost;
- when a swarm is beneficial;
- what can be served from verified memory/cache;
- when local models are sufficient;
- when provider failover is needed.

A useful design phrase is:

> **Unlimited by policy. Adaptive by intelligence. Bounded only by real compute, user policy, and trust/safety requirements.**

## 13. Proposed future research track

Do not create these packages or milestones merely because this document exists. They are a research queue to be authorized later.

Suggested umbrella: **Kodac Learned Intelligence (KLI)**

- `KLI-1` Repository State Representation
- `KLI-2` Engineering Action Representation
- `KLI-3` Repository Dynamics Model
- `KLI-4` Counterfactual Planning
- `KLI-5` Engineering Surprise
- `KLI-6` Trajectory Anomaly Detection
- `KLI-7` Outcome-Calibrated World Model
- `KLI-8` Learned Engineering Policy Above Coding Agents
- `KLI-9` Experience Replay / Continual Improvement
- `KLI-10` Small Local Intelligence Models
- `KLI-11` Learned Routing and Adaptive Compute
- `KLI-12` Learned Memory Policies
- `KLI-13` Multi-Agent Private/Shared Memory
- `KLI-14` Continuous Evaluation and Strategy Promotion
- `KLI-15` Distributed Worker / Swarm Scheduling

Every KLI item should require an explicit benchmark and promotion gate before becoming production authority.

## 14. Non-goals for the active H4 sequence

This research document does **not** authorize any of the following during the current H4 work:

- creating a world-model package;
- training Kodac models;
- adding a self-improvement loop;
- expanding runtime privileges;
- changing the R3G-A authorization;
- creating the R3G-A evidence ledger early;
- weakening deterministic evidence/provenance;
- adding a mandatory third-party SaaS dependency;
- merging an active PR without its canonical gate.

The correct sequencing remains: finish the currently authorized H4 work first, then reconcile future architecture into canonical planning through explicit founder authorization and normal repository governance.
