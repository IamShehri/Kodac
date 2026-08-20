# KDO-H4 Post-R3G-F Closure Gap Audit

Date: 2026-08-20
Status: **AUDIT CANDIDATE — DOCS ONLY / NO RUNTIME AUTHORITY**
Repository: `TheHalfMoon/Kodac`
Canonical base: `97ecd3ce3de956443d211213a1fbaccab75ad1a0`
Canonical base tree: `ad27492148471ee6238d8f1aa595859970800ae9`

---

## 1. Decision

```text
GATE:
KDO-H4-POST-R3G-F-CLOSURE-GAP-AUDIT

CHANGE CLASS:
DOCS ONLY / AUDIT / NO EXECUTION

H4-R3G-F:
CANONICAL / MERGED / FINAL E4 PHYSICAL-PROOF CONJUNCTION PROVEN FOR THE BOUNDED LINUX + DOCKER + gVISOR PATH

H4 PROGRAM:
NOT YET COMPLETE

H4-SPECIFIC H6 BLOCKER:
NOT YET CLEARED

H5-SPECIFIC H6 BLOCKER:
CLEARED BY CANONICAL H5 FINAL CLOSURE

H6 IMPLEMENTATION:
NOT AUTHORIZED

RUNTIME AUTHORITY GRANTED BY THIS AUDIT:
NONE

DECISIVE REMAINING H4 SEAM:
ONE-SHOT APPROVAL MUST BE BOUND BEFORE EXECUTION TO THE EXACT CONTENT-ADDRESSED SANDBOX WORKLOAD / REQUIREMENT THAT THE TRUSTED EXECUTION PATH WILL ACTUALLY LAUNCH OR ADMIT

GENERIC EXTERNAL runCommand ASK:
REMAINS BLOCKED

NEXT AUTHORIZATION CANDIDATE:
H4-R4A — EXACT SANDBOX EXECUTION APPROVAL BINDING CONTRACT
```

The final R3G-F merge closes the physical-proof side of the H4 readiness problem for one bounded Linux + Docker + gVisor theorem. It does **not** close the approval-before-execution side.

The current canonical R3G-F gateway intentionally rejects `ask`, and R3G-F is a proof/conjunction surface over an already admitted exact execution subject. Therefore:

```text
R3G-F E4 PROOF
!=
ONE-SHOT PRE-EXECUTION APPROVAL OF THE EXACT WORKLOAD
```

H4 must not be declared complete merely because the post-admission physical theorem is now strong.

---

## 2. Canonical state inspected

Canonical `main`:

```text
97ecd3ce3de956443d211213a1fbaccab75ad1a0
```

Canonical tree:

```text
ad27492148471ee6238d8f1aa595859970800ae9
```

Latest canonical merge:

```text
PR #123
feat(kdo): implement H4-R3G-F physical proof conjunction

reviewed final head:
8dbb9718f59d844e3033bbf24f4eaad377c7c770

merge commit:
97ecd3ce3de956443d211213a1fbaccab75ad1a0

ordered parents:
1. 6164958e2dc450965d172495bd31272ab7f9c9af
2. 8dbb9718f59d844e3033bbf24f4eaad377c7c770

merge verification:
verified=true
reason=valid
```

Exact-head R3G-F acceptance evidence before merge included:

```text
governance #1753 = PASS
k2-runtime #755 = PASS
k3-r4-adapter #412 = PASS
k3-r5-context-engine #385 = PASS

Ubuntu full runtime suite:
tests 756
pass 752
fail 0
skipped 4

fresh CodeRabbit exact-head review:
run 56cfb63e-2c67-4389-bcff-9487cd437cce
NO NEW ACTIONABLE COMMENTS

review threads:
5 total
0 unresolved
```

R3G-F final evidence ledger comment:

```text
PR #123 issue comment 5349735431
```

R3G-F canonical closeout comment:

```text
PR #123 issue comment 5349743468
```

No post-merge workflow PASS is claimed by this audit where no merge-commit workflow run was returned.

---

## 3. Original H4 closure condition remains the governing test

Canonical H4 readiness / OpenSandbox differential:

```text
docs/planning/KODAC_KDO_H4_READINESS_OPENSANDBOX_DONOR_DIFFERENTIAL_AUDIT_2026-08-15.md
```

made the decisive H4 blocker explicit:

```text
H4-R1 says external-process ask cannot proceed until H4 proves exact executable/workload identity under confinement.

H4-R2C still says external-process ask is not re-enabled and target executable bytes are not identity-proven.
```

That audit correctly distinguished the decisive H4 closure seam from optional breadth such as universal cross-platform sandboxing.

Its important rule was not:

```text
H4 complete only after every platform/backend/security feature exists
```

but instead:

```text
pre-execution approval authority must bind to the exact workload that the trusted constrained execution path can prove
```

This audit preserves that rule.

---

## 4. What the canonical R3 program has closed

### 4.1 H4-R3A — content-addressed workload identity

Canonical R3A introduced an inert self-contained workload identity contract with:

```text
immutable OCI SHA-256 source digest
entrypoint identity
resource-policy identity
deny-all network-policy identity
confinement-request lineage
null-only credential binding
bounded TTL/output policy
optional structurally separate attestation reference
```

The workload identity is deterministic and content-addressed. R3A itself intentionally grants no execution authority and kept external-process `ask` blocked.

Therefore R3A closed:

```text
CANONICAL EXACT WORKLOAD IDENTITY EXISTS
```

but did not close:

```text
APPROVAL OF THAT EXACT WORKLOAD BEFORE EXECUTION
```

### 4.2 H4-R3B — all-or-nothing final backend evidence contract

Canonical R3B established strict requirement/capability/observation/execution-evidence contracts and refused partial physical truth masquerading as a complete backend observation.

The final contract requires exact source, runtime, deny-all network, CPU, memory, TTL, output, credential and downgrade semantics.

### 4.3 H4-R3C/R3D/R3E/R3F — trusted observation and exact runtime subject

The canonical sequence established the evidence ladder:

```text
E0 = untrusted workload/guest claim
E1 = desired/declarative configuration
E2 = trusted host control-plane observation
E3 = trusted host physical/runtime state candidate
E4 = accepted Kodac physical proof after exact conjunction
```

It also established a trusted exact gVisor execution-instance lineage rather than allowing caller-selected PID/path/container identifiers to become proof authority.

### 4.4 H4-R3G-A/B/C/D/E — independently proven physical facts

The decomposed R3G program proves separate physical/enforcement families for the same bounded Linux + Docker + gVisor theorem:

```text
R3G-A = CPU + memory/swap physical resource theorem
R3G-B = immutable source/rootfs physical lineage
R3G-C = physical deny-all network theorem
R3G-D = TTL/lifecycle enforcement
R3G-E = aggregate output-bound enforcement
```

The split intentionally prohibited every pre-final slice from minting R3B E4 evidence independently.

### 4.5 H4-R3G-F — final trusted conjunction

R3G-F now canonically:

- validates the canonical R3G-A/B/C/D/E record and durable-commit families;
- binds the same requirement, workload, attempt, container and runtime lineage;
- resolves distinct source-lineage identity through a trusted internal runtime-instance resolution;
- revalidates exact subject coherence before minting;
- reconstructs resource/source/network/runtime facts from proven inputs only;
- mints the existing R3B capability/observation/execution evidence without weakening the R3B schema;
- requires `gvisor`, null credential binding and no downgrade;
- durably commits the conjunction before positive E4 evidence becomes caller-visible;
- fail-closes post-abort durable-commit races;
- keeps the raw predecessor resolver/runtime factory out of the package-root authority surface.

Therefore the following bounded statement is now supportable:

```text
FOR THE CANONICAL LINUX + DOCKER + gVISOR R3G PATH,
KODAC CAN PROVE THE COMPLETE R3B PHYSICAL EXECUTION THEOREM AS E4.
```

---

## 5. What R3G-F still explicitly does not do

Canonical R3G-F authorization states:

```text
EXTERNAL-PROCESS ASK:
REMAINS BLOCKED

H4 COMPLETE:
NO — NOT BY AUTHORIZATION ALONE

H6 AUTHORIZED:
NO
```

The canonical implementation preserves this boundary.

`GvisorPhysicalProofExecutionGateway.proveGvisorPhysicalExecution(...)` evaluates the exact R3G-F intent and then requires:

```text
policy.decision === allow
```

For `ask`, it emits a blocked receipt with the fixed semantic reason:

```text
R3G-F physical proof conjunction does not permit ASK
```

Therefore there is no ambiguity:

```text
CURRENT R3G-F DOES NOT CONSUME H4-R1 ONE-SHOT APPROVAL
```

This is deliberate and correct for R3G-F scope.

---

## 6. Why post-execution physical proof cannot substitute for pre-execution approval

Approval and physical proof answer different authority questions.

One-shot approval answers:

```text
Did an authorized decision-maker approve this exact proposed action/workload instance once, before side effects were permitted?
```

R3G-F answers:

```text
Does the trusted evidence chain prove that this exact admitted execution subject satisfies the complete bounded physical theorem?
```

Neither can replace the other.

The following would be invalid:

```text
launch/admit workload
-> obtain E4 physical proof
-> ask user for approval
```

because approval would no longer be an authorization boundary before the side effect.

Likewise, this is invalid:

```text
approve a generic command label
-> later choose a different executable/image/args/resources/runtime
-> claim the approval covers it
```

The one-shot decision must bind the exact canonical workload/requirement before launch/admission, and that same identity must remain continuous through the later trusted execution/evidence path.

---

## 7. Post-R3G-F H4 closure matrix

| H4 seam | Canonical evidence now | Closure status |
|---|---|---|
| Closed one-shot approval outcomes | H4-R1 | CLOSED |
| Durable asked evidence before approval service | H4-R1 | CLOSED |
| Durable decided evidence before allowed-once authority | H4-R1 | CLOSED |
| One-shot/non-persistent approval semantics | H4-R1 | CLOSED |
| Approval cannot replace K2 | H4-R1 | CLOSED |
| Provider-neutral requested-vs-observed confinement distinction | H4-R2A | CLOSED |
| Linux filesystem confinement primitive | H4-R2B/R2C | CLOSED for bounded Landlock path |
| Canonical content-addressed sandbox workload identity | H4-R3A | CLOSED |
| Strict complete backend execution-evidence contract | H4-R3B | CLOSED |
| Trusted exact gVisor runtime-instance lineage | H4-R3D/R3E/R3F | CLOSED for bounded gVisor path |
| Physical CPU/memory/swap theorem | H4-R3G-A | CLOSED |
| Immutable source/rootfs physical theorem | H4-R3G-B | CLOSED |
| Physical deny-all network theorem | H4-R3G-C | CLOSED |
| TTL/lifecycle theorem | H4-R3G-D | CLOSED |
| Aggregate output-bound theorem | H4-R3G-E | CLOSED |
| Complete E4 conjunction / durable final physical proof | H4-R3G-F | CLOSED |
| Pre-execution one-shot approval bound to exact canonical sandbox workload/requirement | no canonical integration | **OPEN — DECISIVE** |
| Generic external `runCommand` ASK | intentionally blocked | KEEP BLOCKED |
| K2 workspace-write Landlock integration | not proven | DEFERRED / not required for bounded H4 close |
| macOS/Windows native confinement | not proven | DEFERRED / not required for bounded H4 close |
| Credential broker/injection | not proven; R3B/R3G-F null-only | DEFERRED |
| Universal sandboxing | intentionally not claimed | NOT REQUIRED AS A SINGLE H4 THEOREM |

The matrix contains exactly one remaining H4 program seam required by the original sequencing rationale:

```text
ONE-SHOT PRE-EXECUTION APPROVAL
<->
EXACT CONTENT-ADDRESSED SANDBOX EXECUTION REQUIREMENT
```

---

## 8. The next slice must not re-enable generic external command ASK

A dangerous repair would be:

```text
if policy == ask:
  ask once
  then run arbitrary executable/args from generic runCommand
```

This audit rejects that design.

The original H4 blocker was exact workload identity. The safe repair must therefore bind approval to the already-canonical structured sandbox requirement/workload identity, not reopen a generic caller-selected process surface.

Generic `ExecutionGateway.runCommand(...)` ASK remains fail-closed unless separately authorized later with an independently proven exact executable-byte theorem.

---

## 9. Next authorization candidate — H4-R4A

Purpose-equivalent name:

```text
H4-R4A — EXACT SANDBOX EXECUTION APPROVAL BINDING CONTRACT
```

R4A should be a **pure / inert structural contract first**, with no process, Docker, network, filesystem-write, lifecycle or approval-service execution authority.

The minimum contract should bind one exact approval request to canonical immutable identities including at least:

```text
SandboxExecutionRequirement.requirementIdentity
SandboxWorkload.workloadIdentity
workload source digest
entrypoint identity
resource-policy identity
network-policy identity
confinement-request identity
required semantic runtime class
credential-binding identity
K2 execution-intent identity or exact derived intent digest
unique one-shot approval request-instance identity
```

The contract must make these substitutions impossible without identity change:

```text
image digest
entrypoint executable
args
resource limits
TTL
output bound
network policy
confinement request
runtime class
credential binding
execution intent
approval request instance
```

R4A must reuse H4-R1 closed decision vocabulary:

```text
allowed-once
rejected
cancelled
unavailable
```

and must not create:

```text
allow-always
remembered grant
wildcard grant
model-authored authority
background approval
```

R4A must not itself execute or admit the workload.

---

## 10. Expected later active integration — not authorized by this audit

Only after an R4A contract is canonical should a later bounded active slice be considered for the fixed Linux + Docker + gVisor theorem.

That later integration must preserve an ordering purpose-equivalent to:

```text
construct exact canonical SandboxExecutionRequirement
-> create K2-owned exact execution intent
-> persist exact one-shot asked evidence
-> obtain closed approval outcome
-> if allowed-once: persist exact decided evidence
-> revalidate the exact approved requirement/workload identities
-> enter only the trusted fixed sandbox execution/admission path
-> prove exact runtime/physical lineage under the R3 program
-> require final R3G-F E4 evidence before positive proven execution truth
```

Any mutation of the approved workload between decision and trusted execution must invalidate the grant.

The integration must fail closed on:

```text
approval unavailable
approval persistence failure
identity drift
source digest drift
entrypoint/arg drift
resource/network/confinement drift
runtime downgrade
credential-binding drift
subject/provenance ambiguity
physical proof failure
final E4 durable-commit failure
```

The integration must not allow approval to bypass K2 policy and must not allow physical proof to retroactively authorize an unapproved launch.

This audit grants **no** implementation authority for that active integration.

---

## 11. H6 relationship

Canonical H3 sequencing remains:

```text
H2 -> H4 -> H5 -> H6 -> H7
```

Canonical H5 final closure already established:

```text
H5-SPECIFIC H6 BLOCKER:
CLEARED
```

This audit finds that the H4-specific blocker is smaller than before R3A-R3G-F, but it is not zero.

Therefore:

```text
H4-SPECIFIC H6 BLOCKER:
NOT CLEARED

H6 READY:
NO

H6 AUTHORIZED:
NO
```

Subagents/background jobs must not begin while a parent can request broader autonomous execution without a canonical theorem proving how one-shot approval binds to the exact child/admitted workload before side effects.

---

## 12. Non-goals and deferred breadth

This audit does not require H4 to become a universal sandbox platform before H6.

The following remain separately valuable but are not made mandatory for this bounded H4 closure path:

- Windows native sandboxing;
- macOS native sandboxing;
- Landlock `workspace-write` K2 integration;
- Kata/QEMU/Firecracker backends;
- arbitrary Docker/Kubernetes control-plane launch surfaces;
- mutable network-policy APIs;
- credential vault/broker implementation;
- persistent permission grants;
- generic external-command ASK;
- H7 PTY/LSP/workflow features.

These may receive later independent authorizations without weakening the bounded H4 closure theorem.

---

## 13. Merge gate for this audit

Because this PR must be documentation-only:

```text
BASE:
97ecd3ce3de956443d211213a1fbaccab75ad1a0

CHANGED PATHS:
exactly this one documentation path

RUNTIME SOURCE CHANGES:
0

TEST CHANGES:
0

WORKFLOW CHANGES:
0

DEPENDENCY CHANGES:
0

governance / provenance / legacy:
PASS

UNRESOLVED ACTIONABLE REVIEW THREADS:
0

EXPECTED-HEAD MERGE:
REQUIRED
```

A fresh exact-head independent review must verify especially that this audit does not accidentally claim:

```text
H4 complete
H6 authorized
generic external ASK re-enabled
R3G-F launches workloads
E4 substitutes for approval
approval substitutes for physical proof
```

---

## 14. Final decision

```text
R3G-F PHYSICAL-PROOF PROGRAM:
CANONICAL / COMPLETE FOR ITS BOUNDED LINUX + DOCKER + gVISOR E4 THEOREM

H4 PROGRAM:
NOT COMPLETE

REMAINING DECISIVE H4 SEAM:
ONE-SHOT PRE-EXECUTION APPROVAL BOUND TO THE EXACT CANONICAL SANDBOX EXECUTION REQUIREMENT / WORKLOAD

H4-SPECIFIC H6 BLOCKER:
NOT CLEARED

H6:
NOT AUTHORIZED

NEXT AUTHORIZATION CANDIDATE:
H4-R4A — EXACT SANDBOX EXECUTION APPROVAL BINDING CONTRACT
```

Status:

```text
KDO_H4_POST_R3G_F_CLOSURE_GAP_AUDIT_READY_FOR_CANONICAL_REVIEW
```
