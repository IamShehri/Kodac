# ADR-0001: Kodac Product Constitution — Done Means Proven

Status: Proposed
Date: 2026-08-11
Decision owner: Kodac founder

## Context

Kodac is being reconstituted from an evidence-oriented agent index into an open agentic software-engineering platform. The project intends to reuse mature OSS aggressively while differentiating on repository intelligence, evidence-backed routing, trusted execution, proof-oriented review, and outcome learning.

Without a product constitution, speed can create incompatible local optimizations: more features without coherence, model-specific lock-in, unsafe bypasses, unverifiable claims, or imported code that becomes impossible to maintain.

## Decision

Kodac adopts the following product constitution.

### 1. Done means proven

A model statement such as `done`, `fixed`, or `ready` is never sufficient completion evidence.

A task may be declared complete only when the applicable verification evidence supports the claim. Depending on task scope, that may include build, type checks, lint, tests, security checks, architecture/spec compliance, review, policy compliance, and execution receipts.

### 2. Evidence before claims

Kodac must distinguish:

- observed fact;
- verified result;
- inference;
- model judgment;
- user/vendor claim;
- unknown or disputed state.

Product UI, benchmark reporting, routing decisions, and review findings must not silently collapse these categories.

### 3. Open and model-agnostic by architecture

Kodac must not require a single model vendor, hosted account, IDE, or execution backend to function.

Provider-specific advantages may be used through adapters, but canonical Kodac contracts remain vendor-neutral.

### 4. Local-first, cloud-optional

Core repository understanding and local execution must not require Kodac-hosted cloud services.

Cloud services may improve collaboration, scale, remote execution, or enterprise management, but they are optional product layers rather than hidden runtime dependencies.

### 5. Capability breadth, user simplicity

Kodac may expose a broad capability system—models, agents, skills, MCP servers, tools, workflows, policies, sandboxes, reviewers, and evaluators—without forcing users to manually orchestrate all of them.

The default product should remain understandable through a small set of high-level actions such as Ask, Plan, Build, Review, and Verify.

### 6. Trust is architectural

No privileged or state-changing capability may depend solely on a model promise or UI convention for safety.

ADR-0006 governs the mandatory ExecutionGateway and Trust Kernel path.

### 7. Canonical truth is Kodac-owned

Donor projects may supply implementations, but Kodac owns its public contracts, event/evidence semantics, capability model, repository graph, routing decisions, review evidence, and completion verdicts.

### 8. Reuse commodity infrastructure; build differentiation

Kodac should prefer mature OSS for commodity plumbing when license, provenance, quality, and maintenance economics are acceptable.

Kodac engineering effort should concentrate on:

- Repo Graph;
- Context Engine;
- Evidence Router;
- Trust Kernel;
- Execution Receipts;
- Proof Review;
- Judge;
- Done Gate;
- Outcome Learning;
- Kodac Bench.

### 9. Benchmark before superiority claims

Kodac does not claim to be better than another agent, model, editing engine, review system, or context strategy without reproducible evidence under a documented comparison protocol.

ADR-0010 governs benchmark-first selection and claims.

### 10. Privacy is a product property

Private source code, prompts, secrets, or execution traces are not training or shared-learning data by default.

Any cross-user outcome learning must be explicit, privacy-preserving, and governed separately.

### 11. Interoperability over enclosure

Kodac should implement open interoperability standards where mature enough rather than inventing incompatible equivalents merely to create lock-in.

ADR-0007 governs MCP, ACP, and Agent Skills compatibility.

### 12. Reversibility over premature commitment

Early architectural decisions should preserve the ability to replace models, providers, sandboxes, parsers, indexers, storage engines, and donor implementations behind canonical Kodac boundaries.

## Product promise

The intended user-level promise is:

> Kodac helps software teams understand, plan, build, test, review, secure, and verify changes—and it shows the evidence for what it claims.

The compact internal principle is:

```text
DONE != model assertion
DONE = evidence-backed completion
```

## Non-goals

This constitution does not require Kodac to:

- build its own foundation model;
- own every IDE client;
- implement every scanner or sandbox from scratch;
- collect private code to improve the Router;
- maximize feature count at the expense of coherence;
- support every protocol extension immediately.

## Gate

All later architecture and implementation decisions must identify any intentional exception to this constitution. Silent exceptions are not allowed.
