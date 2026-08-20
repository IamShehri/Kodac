# KDO-H4-R4B — Active One-Shot Approval / Exact Sandbox Admission Authorization

Date: 2026-08-20
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY / NO PRODUCT IMPLEMENTATION**
Repository: `TheHalfMoon/Kodac`
Canonical base: `52539d8ba455d0e1a35167d9b45d94e143edfd20`
Canonical base tree: `654b34377d0e6a6070599ef797abfdb93e0f25c1`
Predecessors: canonical H4-R1 one-shot approval, H4-R3A/R3B exact sandbox workload/requirement, H4-R3G-F bounded E4 physical proof, post-R3G-F H4 closure-gap audit, and canonical H4-R4A exact sandbox approval binding

---

## 1. Decision

```text
GATE:
KDO-H4-R4B

NAME:
ACTIVE ONE-SHOT APPROVAL / EXACT SANDBOX ADMISSION INTEGRATION

CHANGE CLASS:
DOCS ONLY / AUTHORIZATION / NO EXECUTION

R4A:
CANONICAL / PROVEN

DECISIVE H4 SEAM:
ONE-SHOT PRE-EXECUTION APPROVAL MUST BECOME A NON-REUSABLE ADMISSION AUTHORITY FOR EXACTLY ONE CANONICAL SANDBOX REQUIREMENT OCCURRENCE BEFORE ANY WORKLOAD SIDE EFFECT

DIRECT R3G-F ASK ENABLEMENT:
FORBIDDEN

GENERIC EXTERNAL runCommand ASK:
REMAINS BLOCKED

R4B IMPLEMENTATION STRATEGY:
STAGED

R4B-A:
ONE-SHOT APPROVAL -> DURABLE EXACT SANDBOX ADMISSION PERMIT / CONSUMPTION CONTRACT

R4B-A PRODUCT IMPLEMENTATION:
AUTHORIZED ONLY AFTER THIS DOCUMENT IS CANONICAL

R4B-B:
EXACT LINUX + DOCKER + gVISOR CREATE/START ADMISSION AND DOWNSTREAM E4 CONTINUITY

R4B-B PRODUCT IMPLEMENTATION:
NOT AUTHORIZED BY THIS DOCUMENT

NEW DOCKER MUTATION AUTHORITY:
NONE IN R4B-A

NEW PROCESS EXECUTION AUTHORITY:
NONE IN R4B-A

H4 COMPLETE:
NO — NOT UNTIL ACTIVE ADMISSION AND E4 CONTINUITY ARE PROVEN

H4-SPECIFIC H6 BLOCKER:
NOT CLEARED BY R4B-A ALONE

H6 AUTHORIZED:
NO
```

This authorization intentionally does **not** jump directly from the now-proven R4A structural binding to Docker/process launch authority.

The next safe step is to make the one-shot approval occurrence itself durable, exact, non-reusable admission authority before any future active sandbox side effect exists.

---

## 2. Canonical base and exact sources inspected

Canonical main:

```text
52539d8ba455d0e1a35167d9b45d94e143edfd20
```

Canonical tree:

```text
654b34377d0e6a6070599ef797abfdb93e0f25c1
```

Canonical R4A merge:

```text
PR #126
feat(kdo): implement H4-R4A exact sandbox approval binding

reviewed exact head:
7396733f506c38aa85c7549316ec4833e338b950

merge commit:
52539d8ba455d0e1a35167d9b45d94e143edfd20

ordered parents:
1. 2f9e8f3be7231a92cbfd4afdd03538c57007fa1b
2. 7396733f506c38aa85c7549316ec4833e338b950

merge verification:
verified=true
reason=valid
```

Exact-head R4A acceptance before merge:

```text
governance #1778 = PASS
k3-r4-adapter #418 = PASS
k3-r5-context-engine #391 = PASS
k2-runtime #764 = PASS

Ubuntu runtime suite:
tests 765
pass 761
fail 0
skipped 4

CodeRabbit exact-head status:
SUCCESS

review threads:
1 total
0 unresolved
```

Inspected canonical source identities:

```text
packages/kodac-runtime/src/trust/approval.ts
blob d36a604cb1957bc65dac3978c626ba48a9b299fb

packages/kodac-runtime/src/trust/sandbox-execution-approval-binding.ts
blob 103a36d4b34f7c5a5a80800b885b107537228108

packages/kodac-runtime/src/execution/gateway.ts
blob 1732dae059fc878c04e6b1bb6a117385efe9ed6a

packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
blob 4e094b54cbe2c301deff5ecb64634199fca2c425
```

---

## 3. What R4A proved — and what it deliberately did not prove

R4A canonically proves a pure theorem:

```text
one exact H4-R1 ApprovalRequest occurrence
<->
one exact canonical H4-R3B SandboxExecutionRequirement
```

with:

```text
capability = runtime.execute.sandbox
paths = []
inputDigest = domain-separated exact requirement theorem digest
requestIdentity = canonical H4-R1 request identity
requestInstanceId = exact one-shot occurrence identity
```

R4A does not prove:

```text
asked evidence was durably persisted
approval service was invoked
decision outcome was allowed-once
decided evidence was durably persisted
a grant was consumed
a workload was admitted or launched
E4 physical proof was produced
```

R4B exists to begin closing those active-ordering statements without weakening the R4A theorem.

---

## 4. Existing H4-R1 active approval ordering is authoritative

Canonical `ExecutionGateway.authorize(...)` already establishes the general one-shot ordering:

```text
policy == ask
-> create ApprovalRequest
-> create asked ApprovalEvidence
-> durable asked-evidence commit
-> ApprovalService.decide(request)
-> validate exact decision against request identity + request instance
-> create decided ApprovalEvidence
-> durable decided-evidence commit
-> require outcome == allowed-once
-> return approval receipt binding
```

R4B must preserve this ordering.

R4B MUST NOT invent a parallel decision vocabulary or a weaker persistence model.

Canonical outcomes remain exactly:

```text
allowed-once
rejected
cancelled
unavailable
```

---

## 5. Why direct R3G-F ASK enablement is invalid

Canonical R3G-F currently evaluates its own proof intent and requires:

```text
policy.decision == allow
```

For `ask`, it explicitly blocks:

```text
R3G-F physical proof conjunction does not permit ASK
```

That is correct because R3G-F is a downstream physical-proof/conjunction surface over an already existing admitted execution subject.

The following repair is forbidden:

```text
subject already exists
-> R3G-F sees ASK
-> ask user
-> call that pre-execution approval
```

That would be temporally false.

Likewise forbidden:

```text
ASK
-> obtain allowed-once
-> replace policy result with synthetic ALLOW
-> enter arbitrary existing execution path
```

Approval is a distinct authority fact. It must remain inspectable and bound to one exact requirement occurrence; it must not rewrite K2 policy history.

---

## 6. Current admission-surface finding

The inspected canonical H4 runtime contains trusted observation, enforcement and proof surfaces for an existing Linux + Docker + gVisor subject, including R3E/R3F/R3G-A..F.

No canonical H4 product surface inspected here provides the required exact **Docker create/start admission primitive** for a new R3B requirement.

Therefore this document MUST NOT authorize a hidden or ad-hoc launch path merely to finish H4 quickly.

The safe decomposition is:

```text
R4B-A = prove one-shot approval -> exact durable non-reusable admission permit
R4B-B = separately authorize exact create/start admission that atomically consumes that permit
```

This is not scope reduction of the H4 theorem. It is preservation of approval-before-side-effect ordering.

---

## 7. R4B-A theorem

A valid R4B-A positive result may claim only:

```text
For one exact canonical SandboxExecutionRequirement and one exact R4A-bound
H4-R1 ApprovalRequest occurrence, K2 durably persisted asked evidence, obtained
and validated the exact allowed-once decision, durably persisted decided
evidence, and durably created a non-reusable admission permit bound to that
exact requirement/request occurrence. No workload side effect has occurred.
```

R4B-A may not claim:

```text
workload launched
container created
container started
network configured
resource enforcement physically proven
TTL armed
output capture attached
R3G-F E4 produced
H4 complete
H6 ready
```

---

## 8. Required R4B-A ordering

Positive permit creation MUST preserve this exact semantic order:

```text
1. validate canonical SandboxExecutionRequirement
2. derive canonical R4A sandbox approval intent
3. create canonical H4-R1 ApprovalRequest occurrence
4. create and validate R4A SandboxExecutionApprovalBinding
5. durably commit exact asked ApprovalEvidence
6. invoke the configured trusted ApprovalService with that exact request
7. validate the returned ApprovalDecision against requestIdentity + requestInstanceId
8. durably commit exact decided ApprovalEvidence
9. require outcome == allowed-once
10. revalidate the R4A binding and exact requirement after decision persistence
11. create exact admission-permit record
12. durably commit the admission-permit record
13. return only the durable permit/commit pair
```

No positive admission permit may become caller-visible before step 12 succeeds.

No process, Docker, network or filesystem mutation may occur anywhere in R4B-A.

---

## 9. Exact admission-permit identity

R4B-A shall define an immutable record purpose-equivalent to:

```text
SandboxAdmissionPermit
```

It MUST bind at minimum:

```text
R4B contract version
R4A binding identity
R3B requirement identity
R3A workload identity
source identity
source digest
entrypoint identity
resource policy identity
network policy identity
confinement request identity
workspace identity
execution intent identity
required semantic runtime class
downgrade policy
credential binding identity
approval request identity
approval request instance id
asked evidence identity
asked evidence durable commit identity
decided evidence identity
decided evidence durable commit identity
outcome = allowed-once
permit identity
```

The permit MUST be structurally incapable of representing:

```text
allow-always
remembered grant
wildcard requirement
multiple attempts
multiple containers
multiple launches
arbitrary executable
arbitrary Docker API operation
```

---

## 10. Durable permit commit

A positive permit is not proven by an in-memory object or callback invocation.

R4B-A requires a trusted durable boundary purpose-equivalent to:

```text
commitAdmissionPermit(permit) -> SandboxAdmissionPermitCommit
```

The acknowledgment MUST bind:

```text
permitIdentity
durability = durable
```

and must be validated before permit release.

Exact replay of identical canonical permit bytes may be idempotent.

A conflicting payload for the same one-shot request occurrence MUST fail closed.

---

## 11. Consumption theorem required for future R4B-B

The central invariant is:

```text
ONE ALLOWED-ONCE DECISION
=>
AT MOST ONE EXACT SANDBOX ADMISSION ATTEMPT
```

R4B-A must therefore define the future consumption authority explicitly rather than leave it to caller convention.

A purpose-equivalent trusted operation may be defined as:

```text
reserveAdmissionPermitConsumption(permitIdentity, attemptIdentity)
```

but R4B-A MUST NOT call it to launch anything.

The reservation contract must support future proof of:

```text
unused -> reserved(exact attempt)
```

and prohibit:

```text
unused -> reserved(A) -> reserved(B)
consumed(A) -> reused(A)
consumed(A) -> consumed(B)
unknown mutation outcome -> treat as unused
```

If durable reservation outcome is unknown, future admission MUST fail closed rather than retry the side effect with the same one-shot permit.

---

## 12. Future R4B-B required ordering — NOT authorized yet

A later R4B-B authorization must prove a purpose-equivalent ordering:

```text
validate exact durable R4B-A permit
-> revalidate exact R4A/R3B requirement theorem
-> durably reserve permit for one fresh executionAttemptIdentity
-> acquire exact trusted Docker/gVisor admission authority
-> create/admit only the exact requirement
-> establish enforcement before workload execution where required
-> start at most one exact workload occurrence
-> preserve permit/attempt/requirement lineage through R3E/R3G evidence
-> require final R3G-F E4
-> durably mark permit consumed by that exact attempt
-> return positive proven execution truth
```

R4B-B must separately resolve ordering for create-vs-start, TTL arming, output reservation/attachment, deny-all networking, resource controls, abort, cleanup and crash recovery before it receives implementation authority.

---

## 13. Cancellation and abort semantics

R4B-A must preserve H4-R1 cancellation semantics.

Required behavior:

```text
pre-aborted -> cancelled or blocked before approval service
abort while approval pending -> late allowed-once cannot create permit
abort after decision but before decided-evidence durable commit -> no permit
abort after decided-evidence commit but before permit durable commit -> no caller-visible permit
permit commit outcome unknown -> fail closed; do not invent a reusable grant
```

Once a trusted durable mutation begins, K2 must not detach it into background uncertainty. It must wait for authoritative settlement or fail in a state that future recovery can classify without reusing the approval.

---

## 14. Drift and substitution matrix

R4B-A MUST fail closed if any exact approved theorem term changes between R4A binding creation and durable permit creation, including:

```text
OCI repository
OCI digest
source identity
entrypoint executable
entrypoint args
entrypoint identity
CPU limit
memory limit
TTL
max output bytes
resource policy identity
network policy
confinement request
workspace identity
execution intent identity
semantic runtime class
downgrade policy
credential binding
approval capability
approval input digest
approval request identity
approval request instance id
asked evidence identity/commit
decided evidence identity/commit
approval outcome
```

Recomputing an outer permit identity MUST NOT rescue inconsistent inner provenance.

---

## 15. Caller-injection boundary

Caller-provided objects MUST NOT become proof simply because they are structurally valid.

Trusted runtime composition owns:

```text
ApprovalService
ApprovalEvidenceSink
admission-permit durable store / acknowledgment
one-shot consumption store / acknowledgment
```

A public caller may provide the exact canonical `SandboxExecutionRequirement` value and cancellation signal only where already authorized.

A caller MUST NOT inject:

```text
prebuilt allowed-once decision
asked evidence commit
decided evidence commit
positive permit commit
consumption reservation
synthetic approval runtime
synthetic durable store acknowledgment
```

---

## 16. Generic external command ASK remains blocked

R4B is sandbox-specific.

It MUST NOT change the behavior of generic:

```text
ExecutionGateway.runCommand(...)
```

for arbitrary external processes.

The R4A namespace remains:

```text
runtime.execute.sandbox
```

and is not an alias for generic process execution.

No `repo.*`, `git.*`, arbitrary executable, shell, PATH resolution, or caller-selected command surface gains new authority from R4B-A.

---

## 17. No policy bypass

R4B-A must evaluate the canonical sandbox execution intent through K2 policy before approval.

Semantics:

```text
policy=deny -> blocked; approval service not consulted
policy=ask -> R4B-A one-shot flow may run
policy=allow -> no synthetic approval permit may be fabricated from an absent one-shot decision
```

R4B-A is specifically the `ask` bridge. It does not reinterpret an existing `allow` as human approval.

Physical proof likewise cannot retroactively create approval authority.

---

## 18. R4B-A authorized implementation surface

After this authorization is canonical, the first R4B-A product PR may change only purpose-equivalent paths within this narrow set:

```text
A packages/kodac-runtime/src/trust/sandbox-admission-permit.ts
A packages/kodac-runtime/src/execution/sandbox-admission-approval-runtime.ts
M packages/kodac-runtime/src/index.ts
A schema/kdo-h4-r4b-sandbox-admission-permit.schema.json
A packages/kodac-runtime/test/kdo-h4-r4b-active-one-shot-sandbox-admission.test.ts
```

A later evidence-ledger commit may additionally add:

```text
A docs/planning/KODAC_KDO_H4_R4B_ACTIVE_ONE_SHOT_APPROVAL_EXACT_SANDBOX_ADMISSION_EVIDENCE_2026-08-20.md
```

No Docker mutation file, native helper, workflow, dependency or generic gateway mutation is authorized by R4B-A.

---

## 19. Protected surfaces during R4B-A

R4B-A MUST preserve unless a separate correction explicitly authorizes otherwise:

```text
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/trust/policy.ts
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/sandbox-execution-approval-binding.ts
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-network.ts
packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
all R3G-A/B/C/D/E/F trust contracts
Done Gate surfaces
```

This protection is deliberate: first prove the permit theorem without modifying the existing execution/physical-proof machinery.

---

## 20. R4B-A required tests

The product implementation must include focused tests proving at minimum:

```text
exact allowed-once flow yields one durable permit
asked evidence persists before approval service invocation
asked persistence failure prevents approval service invocation
decision identity mismatch fails closed
decision request-instance mismatch fails closed
rejected/cancelled/unavailable never yield permit
decided evidence persists before positive permit commit
decided persistence failure never yields permit
permit commit failure never yields permit
unknown/late permit settlement cannot become positive result after abort
same exact input is deterministic except canonical one-shot occurrence identity
another requestInstanceId produces another permit identity
requirement/workload/source/entrypoint/resource/network/confinement/runtime drift fails closed
repository-only source drift changes authority
approval binding substitution fails closed
caller cannot inject decision or commit authority
hostile Proxy/accessor/symbol/hidden/undefined structures fail closed where serialized records are accepted
permit schema is closed
no approval outcome other than allowed-once can exist in positive permit
production source has no child_process/fs/net/Docker mutation surface
generic gateway and R3G-F gateway remain byte-identical
```

Tests MUST pin fixed structural identity vectors after the implementation compiles successfully.

---

## 21. R4B-A merge gate

Before an R4B-A product PR may merge:

```text
exact authorized changed paths only
focused R4B-A tests PASS
full runtime suite PASS on Ubuntu
cross-platform non-Linux contract tests PASS
governance PASS
k2-runtime PASS
k3-r4-adapter PASS
k3-r5-context-engine PASS
schema parity PASS
production purity PASS
protected authority surfaces byte-identical
fixed vectors pinned
fresh independent exact-head review PASS
unresolved actionable review threads = 0
expected-head merge fence required
```

No test may claim Docker/gVisor admission or H4 closure in R4B-A.

---

## 22. R4B-B entry gate

R4B-B may be considered only after R4B-A is canonical and independently proven.

Before authorizing R4B-B, a separate readiness review must identify and pin:

```text
exact Docker API admission operations needed
exact daemon/socket trust anchor
create-vs-start ordering
runtime=gVisor enforcement at create/start
immutable source admission semantics
CPU/memory/network configuration before start
TTL watchdog arm ordering
aggregate output reservation/attach ordering
container identity binding
one-shot permit reservation/consumption transaction
abort and kill/cleanup semantics
crash recovery semantics
unknown mutation outcome handling
final R3G-F E4 continuity
```

R4B-B MUST NOT be inferred from this document.

---

## 23. H4/H6 relationship

Current H4 status after canonical R4A:

```text
EXACT APPROVAL BINDING CONTRACT:
CLOSED

ACTIVE ONE-SHOT ADMISSION PERMIT:
OPEN

EXACT SANDBOX CREATE/START ADMISSION:
OPEN

POST-ADMISSION E4 PHYSICAL PROOF:
CLOSED FOR BOUNDED LINUX + DOCKER + gVISOR PATH

H4 COMPLETE:
NO

H4-SPECIFIC H6 BLOCKER:
NOT CLEARED

H6 AUTHORIZED:
NO
```

The intended path is now:

```text
R4B-A permit theorem
-> R4B-B exact admission theorem
-> H4 final closure review
-> only then reconsider H6 readiness
```

---

## 24. Explicit non-authorizations

This document does **not** authorize:

- generic external `runCommand` ASK;
- shell execution;
- arbitrary executable launch;
- Docker create/start/exec/kill/remove;
- Docker SDK introduction;
- new native helper;
- caller-selected Docker endpoint;
- caller-selected runtime root;
- credential broker/injection;
- remembered/session/repository-wide approvals;
- model/provider-authored approval;
- background approval;
- detached durable mutation;
- R3G-F policy rewrite;
- weakening R3B/R3G proof requirements;
- macOS/Windows sandbox execution claims;
- H6 implementation;
- H7 implementation;
- Cyber implementation;
- donor code intake.

---

## 25. Final authorization statement

```text
R4A:
CANONICAL / PROVEN

R4B AUTHORIZATION:
BOUNDED STAGED AUTHORIZATION ACCEPTED

R4B-A PRODUCT IMPLEMENTATION AFTER THIS DOC IS CANONICAL:
AUTHORIZED

R4B-B DOCKER/gVISOR ACTIVE ADMISSION:
NOT AUTHORIZED

GENERIC EXTERNAL runCommand ASK:
BLOCKED

H4 COMPLETE:
NO

H4-SPECIFIC H6 BLOCKER:
NOT CLEARED

H6:
NOT AUTHORIZED

NEXT AFTER R4B-A PROOF:
SEPARATE R4B-B EXACT DOCKER/gVISOR ADMISSION READINESS / AUTHORIZATION
```

This is the smallest active step that preserves the original H4 security theorem: approval must become exact, durable, one-shot and non-reusable **before** any future workload side effect is permitted.