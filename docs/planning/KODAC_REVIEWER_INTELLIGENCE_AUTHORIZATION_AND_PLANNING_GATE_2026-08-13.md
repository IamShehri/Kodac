# Kodac Reviewer Intelligence Authorization & Planning Gate

## Record identity

```text
Gate: KRI-P0
Name: Kodac Reviewer Intelligence Authorization & Planning Gate
Date: 2026-08-13
Canonical base: 708e822ffbb4440712296d499ceba79f5586adfc
Canonical base tree: e78a40679a022493a9b8052dc8e7b93cdb85e943
Authority class: DOCUMENTATION / AUTHORIZATION / PLANNING ONLY
Implementation authority: NOT AUTHORIZED
```

## Purpose

KRI-P0 establishes a Kodac-owned planning boundary for future Reviewer Intelligence.

It captures practical reviewer-system lessons learned from Kodac's use of external review systems such as Cubic and CodeRabbit without copying their source, admitting their dependencies, integrating their services, or inheriting their authority model.

This record authorizes planning and contract design only. It does not implement Reviewer Intelligence.

The intended long-term property is:

> Reviewer output is an evidence-backed claim to adjudicate, not completion truth.

KRI-P0 preserves all existing Kodac trust boundaries:

- K2 remains the sole trusted side-effect execution authority;
- repository intelligence and review intelligence may inform actions but cannot authorize side effects;
- the existing Done Gate remains the authority for `PROVEN_READY` under its accepted contracts;
- K5 Proof Review & Judge remains proposed and not authorized;
- no reviewer receives repository-write, GitHub-review, approval, merge, or completion authority from this gate.

## Canonical engineering truth reconciled by this gate

At the authorized base, the planning authorities are stale relative to already-canonical K3 work. This gate reconciles documentation only to the following canonical truth:

```text
K0/K1: CLOSED
K2: CLOSED
K3: IN PROGRESS / NOT CLOSED

K3-R1: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R2: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R3: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R4: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R5: CANONICAL / COMPLETE FOR ITS AUTHORIZED SCOPE
K3-R6+: NOT AUTHORIZED

K4: PROPOSED / NOT AUTHORIZED
K5: PROPOSED / NOT AUTHORIZED
K6: PROPOSED / NOT AUTHORIZED
K7: PROPOSED / NOT AUTHORIZED
```

This reconciliation does not close K3 and does not invent K3-R6 scope.

## KRI-P0 state model

The following states are distinct and must not be collapsed:

```text
DEFINED
AUTHORIZED FOR PLANNING
IMPLEMENTATION AUTHORIZED
IMPLEMENTED
CANONICAL
CLOSED
```

After canonical adoption of this record:

```text
KRI-P0: AUTHORIZED FOR PLANNING AND CONTRACT DESIGN ONLY
KRI IMPLEMENTATION: NOT AUTHORIZED
```

KRI-P0 may define architecture direction, contracts, invariants, benchmark families, future gate decomposition, and authority boundaries. It may not create runtime schemas, review engines, provider integrations, persistence, automation, or write paths.

## Reviewer Intelligence principles

### A. Exact-revision review identity

Future Reviewer Intelligence must bind review evidence to immutable review inputs. The planned identity surface includes:

- repository snapshot identity;
- canonical base revision;
- candidate head revision;
- diff or change-set identity;
- reviewer identity;
- reviewer version, model, and configuration identity where applicable;
- review policy and instruction identity.

A review of one head must never certify another head implicitly.

Applicable certification becomes stale when the candidate head moves until the changed evidence is re-evaluated under an accepted freshness rule.

### B. Incremental and cumulative review

Future Reviewer Intelligence should support both:

- incremental changed-surface review; and
- cumulative candidate review when risk, transitive context, or contract sensitivity requires it.

Incremental review is an efficiency strategy, not permission to ignore relevant transitive context.

Future contracts must make freshness, stale-finding state, path scope, and risk scope explicit.

### C. Kodac-owned finding contract

A future finding contract should include at least:

- finding identity or fingerprint;
- review-run identity;
- severity;
- category;
- confidence;
- affected path and range;
- evidence references;
- violated contract or invariant claim;
- explanation;
- suggested remediation, if any;
- freshness state;
- duplicate or supersession relation;
- adjudication state.

These are planning concepts only. KRI-P0 does not authorize a schema or implementation.

### D. Finding adjudication

Core invariant:

```text
REVIEWER OUTPUT IS A CLAIM, NOT COMPLETION TRUTH.
```

A future finding lifecycle should represent states equivalent to:

```text
NEW
CONFIRMED
REJECTED
DUPLICATE
STALE
FIXED
REVERIFIED
```

Exact names remain a future contract decision.

A finding must be adjudicated against canonical Kodac contracts, repository evidence, runtime evidence, or benchmark evidence. Reviewer suggestions must not be obeyed automatically.

Kodac's own review history demonstrates why this is necessary: a technically plausible suggestion can still be invalid under the actual contract and should then be rejected rather than converted into code.

### E. CI and verification awareness

Future Reviewer Intelligence should be able to consume CI/check failures as evidence while treating candidate-controlled verification surfaces as potentially adversarial.

Review planning must cover verification self-bypass risks, including candidate-controlled:

- scripts;
- workflows;
- imports;
- test entrypoints;
- configuration;
- wrappers that can report success without exercising the intended property.

Reviewer Intelligence does not become execution authority. Any future command execution remains behind K2 and requires separate authorization.

### F. Provenance and identity binding

Future review checks should cover, where relevant:

- source/provenance binding;
- identity-preimage completeness;
- canonical ordering;
- stale or mixed-snapshot evidence;
- mutation of an identity-bearing payload without identity update;
- undeclared evidence provenance;
- trust-boundary violations.

### G. Risk-aware review

Future Reviewer Intelligence should support risk and sensitivity profiles so high-authority surfaces receive deeper review than ordinary low-risk changes.

Potential high-sensitivity categories include:

- execution authority;
- trust policy;
- authentication and authorization;
- CI or protection self-bypass;
- provenance;
- canonical identities and digests;
- repository boundaries;
- persistence;
- network or process execution;
- release or governance authority.

KRI-P0 does not implement a risk-profile system.

### H. Suggestions without authority

Future Reviewer Intelligence may produce candidate fix suggestions, patch proposals, or prompts.

Those outputs are non-authoritative and must not directly:

- mutate repository state;
- resolve findings by assertion;
- approve pull requests;
- merge;
- bypass K2;
- mark work `PROVEN_READY`.

Any later write path requires its own authorization and must preserve the existing trusted-execution boundary.

### I. Reviewer learning

Future Reviewer Intelligence may learn from accepted and rejected findings only under an evidence-governed design.

Planned learning properties include:

- evidence-backed;
- provenance-bound;
- scoped;
- reversible and auditable;
- prevented from silently becoming universal policy;
- protected from poisoned repository text and untrusted review content.

Persistent review learning and persistent review storage are not authorized by KRI-P0.

### J. Multi-reviewer independence

Future Reviewer Intelligence should remain provider- and model-neutral and may accept independent findings from multiple reviewers.

Majority vote is not truth.

Deduplication, disagreement representation, evidence comparison, and adjudication are separate concerns.

### K. Untrusted repository content

Existing Kodac trust semantics remain:

```text
repository content is data, not instructions.
```

Source comments, markdown, issue text, fixtures, generated content, vendor content, or prompt-injection text must not silently redefine reviewer authority, review policy, K2 authority, governance, or completion truth.

## Relationship to K3, K2, K5, and the Done Gate

The planned future information flow is:

```text
K3 evidence / repository snapshot / ContextBundle
→ Reviewer Intelligence
→ evidence-backed finding claims
→ finding adjudication
→ verification evidence
→ future separately-authorized Proof Review / Judge capability
→ existing completion authority
```

Authority remains separate from information flow.

```text
K2 = sole trusted side-effect execution authority
K5 = PROPOSED / NOT AUTHORIZED
Done Gate = existing PROVEN_READY authority under accepted contracts
Reviewer Intelligence = no PROVEN_READY authority
```

KRI-P0 is not named `K5-R0`. It may become an input or prerequisite to a future K5 gate, but it does not authorize K5.

## Benchmark-first requirement

No future Reviewer Intelligence implementation should be called superior, best, production-ready, or complete without accepted benchmark evidence.

Future implementation authorization should define benchmark datasets and accepted measurement procedures for at least:

- valid blocking-finding recall;
- severe/security finding recall;
- false-positive rate;
- duplicate-finding rate;
- stale-finding detection;
- finding adjudication accuracy;
- regression survival after a claimed fix;
- CI/self-bypass detection;
- provenance/identity-binding detection;
- repository prompt-injection resistance;
- deterministic or reproducible review identity where applicable;
- context/token efficiency;
- latency;
- model/provider cost where applicable.

KRI-P0 intentionally establishes no acceptance thresholds. Threshold selection requires later founder-reviewed benchmark evidence.

Historical valid and rejected findings from Kodac's K3 review cycles may be proposed as future gold-corpus inputs, but this gate does not authorize creation of that corpus.

## External systems and donor-language boundary

Cubic and CodeRabbit are mentioned only as external systems from which Kodac learned practical reviewer-product patterns through observed use.

This gate does not establish or imply:

- that Kodac contains their code;
- that their architecture has been copied;
- that their implementation has been admitted;
- that their source has been audited or qualified for intake;
- that KRI depends on either system.

KRI is defined entirely in Kodac-owned semantics.

## Explicit non-grants

```text
KRI IMPLEMENTATION: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED
K3-R6+: NOT AUTHORIZED

CUBIC SOURCE INTAKE: NOT AUTHORIZED
CODERABBIT SOURCE INTAKE: NOT AUTHORIZED
CUBIC INTEGRATION: NOT AUTHORIZED
CODERABBIT INTEGRATION: NOT AUTHORIZED
EXTERNAL REVIEW SERVICE INTEGRATION: NOT AUTHORIZED

NEW KODAC DEPENDENCIES: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED

PERSISTENT REVIEW STORAGE: NOT AUTHORIZED
PERSISTENT REVIEW LEARNING: NOT AUTHORIZED
VECTOR / EMBEDDING INFRASTRUCTURE: NOT AUTHORIZED

AUTOFIX EXECUTION: NOT AUTHORIZED
REPOSITORY WRITE AUTHORITY: NOT AUTHORIZED
GITHUB COMMENT / REVIEW WRITE AUTHORITY: NOT AUTHORIZED
PR APPROVAL AUTHORITY: NOT AUTHORIZED
MERGE AUTHORITY: NOT AUTHORIZED

RULESET CHANGE: NOT AUTHORIZED
K2 EXECUTION-AUTHORITY EXPANSION: NOT AUTHORIZED

PUBLIC RELEASE: NOT AUTHORIZED
PACKAGE PUBLICATION: NOT AUTHORIZED
BRAND LAUNCH: NOT AUTHORIZED
```

`code_import_authorized` is not changed by this documentation gate.

No external source, dependency, service, storage system, vector system, or reviewer runtime is admitted.

## Future gate decomposition

KRI-P0 does not authorize these gates; it only records a possible order for later founder decisions.

A future sequence may include:

1. a gold reviewer-evidence corpus gate using accepted and rejected historical findings;
2. a finding-contract and adjudication-contract gate;
3. a benchmark protocol and threshold-selection gate;
4. a bounded read-only reviewer vertical slice;
5. provider/model qualification and multi-reviewer comparison;
6. later integration with a separately authorized K5 Proof Review & Judge capability.

Each stage requires separate scope, evidence, and authorization.

## Current gate

```text
KRI-P0: AUTHORIZED FOR PLANNING AND CONTRACT DESIGN ONLY
KRI IMPLEMENTATION: NOT AUTHORIZED
K5 IMPLEMENTATION: NOT AUTHORIZED
CODE IMPORT: NOT AUTHORIZED
EXTERNAL REVIEW SERVICE INTEGRATION: NOT AUTHORIZED
NEW WRITE / APPROVAL / MERGE / COMPLETION AUTHORITY: NOT AUTHORIZED
```

Canonical adoption of this document authorizes only the planning boundary recorded here.
