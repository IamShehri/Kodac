# KDO-H4 Readiness / OpenSandbox Donor Differential Audit

Date: 2026-08-15
Status: AUDIT CANDIDATE — DOCS ONLY

## 1. Decision

```text
GATE:
KDO-H4-READINESS-OPENSANDBOX-DIFFERENTIAL

CANONICAL KODAC BASE:
1aa678e002fe0e17c79eca779cf9510ec154e5ee

CANONICAL KODAC BASE TREE:
2d36e253ad0ff71a2708de2263fed43f2bcbad84

H5:
COMPLETE FOR ITS CANONICALLY AUTHORIZED BOUNDED SCOPE

H4:
NOT COMPLETE

H4-SPECIFIC H6 BLOCKER:
NOT CLEARED

H6:
NOT AUTHORIZED

OPENSANDBOX:
HIGH-VALUE DONOR / STUDY + TARGETED PORT LATER

OPENSANDBOX WHOLESALE RUNTIME IMPORT:
REJECTED

AUTHORIZED RUNTIME CHANGE BY THIS AUDIT:
NONE

RECOMMENDED NEXT SLICE:
H4-R3A — ATTESTED SANDBOX WORKLOAD IDENTITY CONTRACT
```

The central conclusion is narrow:

Kodac already has a strong H4 foundation — one-shot approval evidence, provider-neutral confinement contracts, a proven Linux Landlock filesystem backend primitive, and one K2-bound read-only Landlock execution path — but the H4 program cannot close while external-process `ask` remains deliberately blocked because the exact executable/workload that will execute after the approval boundary is not identity-proven.

OpenSandbox is useful because it demonstrates a mature higher-order sandbox substrate around workload lifecycle, signed/digest-verifiable container artifacts, secure runtime selection, network egress policy, credential brokering, resource/TTL controls, Docker/Kubernetes execution, and stronger gVisor/Kata/Firecracker isolation options.

However, Kodac must not copy OpenSandbox's authority model wholesale. K2 remains the sole trusted side-effect execution authority, confinement remains per-intent and evidence-bound, and a server configuration or sandbox/runtime label is not itself proof that the bound execution attempt received the claimed isolation.

---

## 2. Why this review exists

Canonical H5 closure explicitly states:

```text
H5 COMPLETE:
YES

H5-SPECIFIC H6 BLOCKER:
CLEARED

H4 COMPLETE:
NOT DETERMINED HERE

H6 READY:
NOT DETERMINED HERE

H6 AUTHORIZED:
NO
```

H3 established the required sequencing:

```text
H2 -> H4 -> H5 -> H6 -> H7
```

and identified H4 as the approval + confinement plane that must be fail-closed before broader autonomous orchestration.

This review therefore answers only:

1. what H4 has actually proven;
2. what H4 still explicitly does not prove;
3. whether the new OpenSandbox donor changes the correct architecture;
4. what the smallest next H4 slice should be;
5. whether H6 may begin.

It does not implement sandbox runtime code.

---

## 3. Canonical Kodac state inspected

Repository:

```text
TheHalfMoon/Kodac
```

Canonical `main`:

```text
1aa678e002fe0e17c79eca779cf9510ec154e5ee
```

Canonical tree:

```text
2d36e253ad0ff71a2708de2263fed43f2bcbad84
```

Current H4 authority-relevant source blobs:

```text
packages/kodac-runtime/src/trust/approval.ts
d36a604cb1957bc65dac3978c626ba48a9b299fb

packages/kodac-runtime/src/trust/confinement.ts
873f235120645c0a12f10a5bff7e9591db6bb341

packages/kodac-runtime/src/trust/confinement-linux-landlock.ts
94b325f73246514f31b950ba4fed38023e3e3cfc

packages/kodac-runtime/src/trust/confinement-runtime.ts
1ca0313fb25c62e549445ebcf1aef029b18e6b86

packages/kodac-runtime/src/execution/gateway.ts
ecf9cc9d3eda6a2280a280ed2f9a2e472f397560
```

H5 later evolution has preserved the privileged trust model:

```text
R3B effective call
-> K2 policy / one-shot approval / confinement / gateway
-> execution

Done Gate remains separate completion authority.
```

---

## 4. Canonical H4 evidence chain

### 4.1 H4-R1 — one-shot approval

Canonical evidence:

```text
docs/planning/KODAC_KDO_H4_R1_ONE_SHOT_APPROVAL_EVIDENCE_2026-08-14.md
```

Bounded proven properties include:

- exact closed outcomes: `allowed-once | rejected | cancelled | unavailable`;
- one invocation only — no remembered/wildcard/persistent grant;
- exact request identity + unique request instance id;
- durable `asked` evidence before consulting approval service;
- durable `decided` evidence before an `allowed-once` can enable execution;
- cancellation boundaries before mutation;
- immutable intent/policy/receipt authority snapshots;
- approval cannot replace K2 policy or Done Gate;
- `repo.apply_patch` is approvable because exact intent continuity can be proven.

The same evidence explicitly preserves this boundary:

```text
EXTERNAL-PROCESS K2 POLICY ask:
BLOCKED

reason:
external executable identity requires H4-R2 confinement
```

That boundary is important to the final H4 readiness decision.

### 4.2 H4-R2A — provider-neutral confinement contracts

Canonical evidence:

```text
docs/planning/KODAC_KDO_H4_R2A_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_EVIDENCE_2026-08-14.md
```

R2A proves the structural distinction:

```text
requested confinement policy
!=
observed confinement enforcement
```

with exact requested modes:

```text
read-only
workspace-write
danger-full-access
```

and exact observed results:

```text
full
partial
unavailable
```

The backend descriptor is inert structural data. It does not execute, probe, or manufacture enforcement truth.

### 4.3 H4-R2B — Linux Landlock primitive

Canonical evidence:

```text
docs/planning/KODAC_KDO_H4_R2B_LINUX_LANDLOCK_BACKEND_EVIDENCE_2026-08-14.md
```

Bounded claim:

```text
KODAC_LINUX_LANDLOCK_LAUNCHER_AND_BACKEND_PRIMITIVE_PROVEN
```

R2B proves a Linux filesystem-effect confinement primitive for the local claim set:

```text
kodac-linux-landlock-fs-v1
```

It supports structural `read-only` and `workspace-write` launch plans, but it does not itself bind K2 execution to either mode.

R2B explicitly does not claim:

- network isolation;
- process/IPC isolation;
- seccomp/namespaces/cgroups;
- container/VM isolation;
- target executable byte identity;
- cross-platform confinement;
- H4 completion.

### 4.4 H4-R2C — K2 Linux Landlock read-only integration

Canonical evidence:

```text
docs/planning/KODAC_KDO_H4_R2C_K2_LINUX_LANDLOCK_READ_ONLY_EVIDENCE_2026-08-14.md
```

Bounded claim:

```text
KODAC_K2_LINUX_LANDLOCK_READ_ONLY_EXECUTION_BINDING_PROVEN
```

R2C proves a strong trusted-host ordering:

```text
verified same-FD launcher
-> Landlock active
-> READY
-> durable confinement evidence acknowledgment
-> GO
-> target exec
```

and binds the confinement receipt to the K2 execution intent.

R2C nevertheless explicitly does **not** claim:

```text
external-process ask is re-enabled
target executable bytes are identity-proven
workspace-write is integrated into K2
network isolation exists
process/IPC isolation exists
macOS confinement exists
Windows confinement exists
H4 is complete
Kodac is universally sandboxed
```

These are current canonical non-claims, not hypothetical concerns invented by this audit.

---

## 5. H3 H4 requirements versus current evidence

| H3 H4 seam | Current canonical disposition | Closure status |
|---|---|---|
| Closed one-shot approval outcomes | R1 proven | CLOSED |
| Exact one-shot request identity | R1 proven | CLOSED |
| Durable asked/decided audit before execution | R1 proven | CLOSED |
| Missing/unavailable approval fails closed | R1 proven | CLOSED |
| Approval cannot bypass K2 | R1 proven | CLOSED |
| Approval/confinement are separate semantic planes | R1 + R2A | CLOSED |
| Provider-neutral confinement request contract | R2A proven | CLOSED |
| Requested mode distinct from observed enforcement | R2A proven | CLOSED |
| Backend descriptor cannot self-authorize execution | R2A proven | CLOSED |
| At least one operating-system backend primitive | Linux Landlock R2B | CLOSED for local claim set |
| Fail-closed backend readiness/evidence before execution | R2C proven for Linux read-only | CLOSED for that path |
| K2 receipt lineage to confinement evidence | R2C proven | CLOSED for that path |
| External-process `ask` with exact post-approval workload identity | explicitly blocked | **OPEN** |
| Target executable/workload bytes identity across approval wait | explicitly non-proven | **OPEN** |
| K2 `workspace-write` integration | explicitly non-proven | OPEN |
| Network egress confinement | explicitly non-proven | OPEN |
| Credential isolation/brokering | absent | OPEN / later H4 or H7 security hardening |
| Strong container/microVM isolation option | absent | OPEN / backend expansion |
| macOS/Windows native confinement | absent | OPEN / platform expansion |
| Universal sandboxing | intentionally not claimed | NOT REQUIRED AS A SINGLE H4 THEOREM |

The decisive closure blocker is not that every operating system lacks every sandbox backend.

The decisive blocker is:

```text
H4-R1 says external-process ask cannot proceed until H4 proves exact executable/workload identity under confinement.

H4-R2C still says external-process ask is not re-enabled and target executable bytes are not identity-proven.
```

Therefore H4 is not internally closed yet.

---

## 6. New donor — OpenSandbox exact pin

Donor:

```text
opensandbox-group/OpenSandbox
```

Pinned commit:

```text
f8ed8734ce1fda69f0979f912160fb933b9bfa0c
```

Pinned tree:

```text
cf033b4f880b7e84b563dcf7f63722582ea48762
```

Root license:

```text
Apache-2.0
```

Root license blob:

```text
b09cd7856d58590578ee1a4f3ad45d1310a97f87
```

Primary audited donor surfaces:

```text
README.md
866ef70947619eafcc810d5af84b15d56a665a2d

specs/sandbox-lifecycle.yml
8564db4f8ef50434348b27cefe49bf2d11a9a323

specs/execd-api.yaml
b62ea653ffe357e041e4d0db3cc4d594dad47bd1

specs/egress-api.yaml
08e4885176998e854df62b999914c5eb01855308

oseps/0004-secure-container-runtime.md
65d1ec76530b01c7f530a582ba1bbc7deb5c8b35

docs/guides/secure-container.md
769cd247317400ec6fe9859505fbe8fb9161b52d

docs/guides/credential-vault.md
435b18ed410018b4fc39d7c00933dd67290b6959

docs/community/release-verification.md
13eaae323a8d196eb83b6f2b28a7cde863f7e31d
```

No OpenSandbox code is imported or executed by this audit.

---

## 7. What OpenSandbox contributes

### 7.1 Explicit sandbox lifecycle

OpenSandbox defines a lifecycle covering:

```text
create
running
pause
resume
kill / TTL termination
failed
snapshot / restore
```

The lifecycle request can bind:

- image/source;
- entrypoint;
- timeout/TTL;
- platform;
- resource limits;
- environment;
- metadata;
- network policy.

This is materially richer than treating sandboxing as a single command wrapper.

Kodac should eventually have a bounded lifecycle/evidence model for autonomous child execution and background jobs, but the lifecycle service itself must remain below K2 authority.

### 7.2 Stronger sandbox runtime options

OpenSandbox supports infrastructure-level secure runtime selection including:

```text
gVisor
Kata/QEMU
Kata + Firecracker
```

and validates configured runtime availability at server startup.

These mechanisms are valuable future backend candidates because Landlock intentionally does not claim process, IPC, kernel, or VM isolation.

### 7.3 Signed/digest-verifiable distribution artifacts

OpenSandbox's release process signs image digests using keyless Cosign/Sigstore identities and publishes provenance attestations.

Its own verification guide states the correct operational principle:

```text
verify container images by digest, not mutable tag alone
```

This principle is directly relevant to Kodac's unresolved external executable/workload identity problem.

### 7.4 Network egress plane

OpenSandbox defines a sandbox egress API and network policy with deny/allow rules.

This is a useful donor for future Kodac confinement because current H4 explicitly makes no network-isolation claim.

### 7.5 Credential broker outside workload memory

OpenSandbox Credential Vault keeps real credentials in an egress sidecar rather than placing them in sandbox environment variables, command lines, filesystem, or normal logs.

It can inject credentials only when a scoped outbound request matches a configured binding.

This is a valuable pattern for future Developer OS agents because an untrusted coding workload should not receive the host's reusable secrets directly.

### 7.6 Docker + Kubernetes control plane

OpenSandbox demonstrates one protocol usable over local Docker and distributed Kubernetes execution.

This is particularly useful for future H6/H7 scale-out, but it must not become the first H4 implementation step because authority, artifact identity, and evidence lineage must be defined before a remote sandbox service is trusted.

---

## 8. What Kodac must not copy from OpenSandbox

### 8.1 Server-global secure runtime selection as user-visible proof

OpenSandbox configures one secure runtime at server level and intentionally keeps runtime selection transparent to SDK callers.

Kodac cannot treat that as equivalent to per-intent confinement proof.

Kodac invariant remains:

```text
REQUESTED CONFINEMENT
+
BOUND WORKLOAD IDENTITY
+
OBSERVED BACKEND ENFORCEMENT EVIDENCE
+
DURABLE K2 RECEIPT LINEAGE
```

A server saying `secure_runtime = gvisor` is not enough.

### 8.2 Fallback to ordinary runc when secure runtime is not configured

OpenSandbox correctly allows ordinary runc as its default platform behavior.

Kodac must not silently downgrade an execution intent whose policy requires a stronger confinement class.

For Kodac:

```text
required confinement unavailable
-> blocked/unavailable evidence
-> no execution
```

not:

```text
required secure confinement unavailable
-> run with runc anyway
```

### 8.3 Mutable image tags as workload authority

OpenSandbox lifecycle examples commonly use values such as:

```text
python:3.11
opensandbox/code-interpreter:v1.1.0
```

Those are useful UX identifiers but mutable tags are not sufficient as Kodac execution authority.

An H4 identity contract must require an immutable content digest for any image-backed workload used to close the approval/executable-identity gap.

### 8.4 Runtime-mutated egress policy as a generic authority seam

OpenSandbox intentionally exposes policy patch/delete operations at runtime.

Kodac cannot allow an untrusted model/tool/sandbox process to widen its own K2-authorized network scope.

Any future network-policy mutation must itself be a new K2-bound intent that is monotonic or separately approved/evidenced.

### 8.5 Credential broker as policy authority

Credential Vault can safely carry secrets, but possession of a credential binding must not grant network or tool authority by itself.

The order must remain:

```text
K2 authorizes exact network capability/scope
-> sandbox/egress confinement is proven
-> credential broker may inject only the already-authorized credential
```

### 8.6 Remote service claims as enforcement proof

An OpenSandbox-compatible service response that says a sandbox is `Running` or uses `gvisor`/`kata` cannot automatically become Kodac `full` enforcement evidence.

A future backend must define how the trusted Kodac host validates the backend identity, workload identity, runtime class, and evidence for the exact execution attempt.

---

## 9. OpenSandbox donor disposition matrix

| Donor surface | Kodac disposition | Reason |
|---|---|---|
| Sandbox lifecycle state machine | STUDY / later targeted PORT | useful for H6/H7 jobs; not current authority |
| Lifecycle request resource/TTL fields | PORT principles | bounded execution resource identity |
| OCI image by immutable digest | PORT principle | directly helps unresolved workload identity |
| Signed image/provenance verification model | PORT principle | strong supply-chain evidence pattern |
| Docker backend | STUDY | future local sandbox backend |
| Kubernetes backend | STUDY | future distributed H6/H7 backend |
| gVisor runtime | STUDY / future backend | stronger process/kernel isolation |
| Kata runtime | STUDY / future backend | VM-backed isolation |
| Firecracker via Kata | STUDY / future backend | strong/high-density isolation |
| Server-global runtime configuration | REJECT as K2 authority | not per-intent evidence |
| Default runc fallback | REJECT when stronger isolation is required | violates fail-closed requested mode |
| Egress policy vocabulary | PORT principles later | closes current network-isolation gap |
| Runtime egress widening by sandbox client | REJECT by default | could widen authority after K2 decision |
| Credential Vault architecture | STUDY / later targeted PORT | keeps real secrets outside workload |
| Credential binding grants authority | REJECT | credential != capability grant |
| Snapshot/resume lifecycle | DEFER | complicates workload identity and H6 state |
| Pause/resume | DEFER | H6/H7 lifecycle feature, not H4 closure blocker |
| SDK/CLI/MCP APIs | DEFER | product/adaptor surface after trust contracts |
| Wholesale OpenSandbox server dependency | REJECT for current H4 slice | premature authority/trust expansion |

---

## 10. Why H4 cannot close at current main

Three statements are simultaneously canonical:

### Statement A — H4-R1

```text
external-process ask is blocked because exact executable identity is not proven across approval wait
```

### Statement B — H4-R2C

```text
target executable bytes are not identity-proven
external-process ask is not re-enabled
```

### Statement C — H3 sequencing

```text
H4 must be established before H6 autonomous orchestration
```

Therefore declaring H4 complete now would convert a deliberate fail-closed deferral into an unexplained permanent gap.

The correct result is:

```text
H4 STATUS:
PARTIAL / OPEN

H6 STATUS:
BLOCKED BY INDEPENDENT H4 READINESS
```

---

## 11. Smallest next slice — H4-R3A

Recommended next slice:

```text
KDO-H4-R3A — ATTESTED SANDBOX WORKLOAD IDENTITY CONTRACT
```

R3A should be **pure/inert** first.

It should not create, start, connect to, or execute an OpenSandbox server.

The purpose is to define exactly what workload K2 is willing to approve and later hand to a sandbox backend.

### 11.1 Core theorem

```text
A SANDBOXED EXTERNAL EXECUTION MAY NOT CROSS AN APPROVAL / BACKEND BOUNDARY
UNLESS THE FUTURE EXECUTED WORKLOAD SOURCE IS BOUND TO AN IMMUTABLE CONTENT IDENTITY.
```

### 11.2 Minimum structural vocabulary

A future R3A contract should bind at minimum:

```text
version
workloadIdentity
executionIntentIdentity
sourceKind
sourceDigest
entrypointIdentity
argumentIdentity
workspaceIdentity
requestedConfinementIdentity
resourcePolicyIdentity
networkPolicyIdentity
credentialBindingIdentity-or-none
workloadRequestIdentity
```

Exact naming requires the authorization review; this audit does not freeze TypeScript API names.

### 11.3 Image-backed source rules

For `sourceKind = oci-image`:

- immutable digest required;
- mutable tag alone rejected;
- digest format validated and bounded;
- registry/repository string is structural metadata, not authority on its own;
- optional provenance/attestation evidence must be separate from the requested workload identity;
- an attestation statement cannot overwrite the content digest supplied to execution.

### 11.4 Local executable source rules

If a later contract supports direct local executable workloads:

- path string alone is insufficient;
- byte identity must be bound to the actual opened/executed artifact or the workload must be moved into a digest-bound sandbox image;
- PATH resolution is not workload identity;
- mutable path re-stat after approval is not enough to prove same bytes;
- script/interpreter chains must not create an unbound executable-content hole.

R3A may choose to admit only digest-bound OCI workloads initially and leave direct local executable approval blocked.

### 11.5 Resource identity

The workload request should structurally bind bounded resource policy, such as:

- CPU ceiling;
- memory ceiling;
- wall-clock/TTL;
- process count if supported later;
- output/evidence byte bounds where applicable.

Changing resource ceilings after approval must create a new workload identity.

### 11.6 Network identity

R3A should define a network policy identity even if the first integration supports only:

```text
network = deny-all
```

A deny-all initial profile is preferable to designing a mutable allowlist authority plane prematurely.

Any later egress widening must be a distinct K2 intent and identity.

### 11.7 Credential identity

R3A should not serialize secret values.

If a future sandbox requires credentials, the workload contract may bind only inert credential-binding identities or handles that point to trusted-host secret brokerage.

Secret bytes remain outside model-visible history and outside sandbox configuration evidence wherever possible.

### 11.8 Requested isolation versus observed isolation

R3A must reuse, not replace, the R2A theorem:

```text
requested confinement != observed enforcement
```

A workload digest and a requested secure runtime are still not proof that the backend enforced them.

---

## 12. Expected sequencing after R3A

This audit recommends the following order only; it does not authorize these future slices:

```text
H4-R3A
pure attested workload identity contract

-> H4-R3B
one K2-bound sandbox backend integration using the R3A workload identity

-> H4-R3C if needed
external-process one-shot approval enabled only through the proven workload/sandbox path

-> H4 FINAL CLOSURE REVIEW

-> H6 READINESS / AUTHORIZATION REVIEW
```

A future R3B may be OpenSandbox-compatible, but compatibility is not mandatory.

The backend should be chosen by evidence quality, operational cost, portability, and ability to preserve K2 authority — not because OpenSandbox is popular or feature-rich.

---

## 13. Candidate R3B OpenSandbox-compatible invariant

If a later R3B selects OpenSandbox, the required ordering should be equivalent to:

```text
exact immutable K2 execution intent
-> exact R3A workload request
-> policy decision
-> if ask: exact one-shot approval + durable decision evidence
-> verify chosen sandbox backend/service identity
-> resolve/verify workload content digest
-> provision sandbox with non-widening resource/network policy
-> obtain evidence bound to this exact sandbox/workload/backend attempt
-> durable confinement/workload evidence acknowledgment
-> only then execute the target inside that sandbox
-> durable K2 execution receipt binds workload + backend + confinement evidence
```

The implementation must not allow:

```text
approval for tag A
-> tag mutates to bytes B
-> execute B
```

or:

```text
requested gVisor
-> backend silently uses runc
-> classify as full
```

or:

```text
deny-all network policy
-> untrusted sandbox patches itself to allow-all
```

---

## 14. H4 closure criteria proposed by this audit

H4 does **not** need to prove every future sandbox mechanism on every operating system before H6 can ever exist.

But H4 must close its own admitted trust boundary.

Minimum proposed H4 final closure theorem:

```text
ONE-SHOT APPROVAL IS DURABLE / REPLAY-RESISTANT
AND
REQUESTED CONFINEMENT IS DISTINCT FROM OBSERVED ENFORCEMENT
AND
K2 HAS AT LEAST ONE PROVEN FAIL-CLOSED CONFINED EXTERNAL EXECUTION PATH
AND
THE EXACT FUTURE EXECUTED WORKLOAD IS CONTENT-IDENTITY-BOUND ACROSS APPROVAL
AND
A REQUIRED CONFINEMENT CLASS CANNOT SILENTLY DOWNGRADE
AND
EXECUTION RECEIPTS BIND THE SAME WORKLOAD / INTENT / CONFINEMENT LINEAGE
AND
K2 / APPROVAL / CONFINEMENT / DONE GATE REMAIN SEPARATE AUTHORITIES
```

At current main, the missing term is:

```text
THE EXACT FUTURE EXECUTED WORKLOAD IS CONTENT-IDENTITY-BOUND ACROSS APPROVAL
```

Therefore H4 remains open.

---

## 15. What is not required for the first H4 closure

The first H4 closure does not need to claim:

- universal sandboxing of every Kodac tool;
- every Linux syscall constrained;
- native macOS sandbox implementation;
- native Windows sandbox implementation;
- Firecracker production deployment;
- Kubernetes production deployment;
- persistent sandboxes;
- pause/resume;
- snapshots;
- background jobs;
- subagents;
- writable memory;
- credential-vault production integration;
- general network allowlists;
- MCP sandbox exposure;
- H7 terminal/LSP/workflow services.

Those may be later expansion slices with their own authority review.

---

## 16. TencentDB Agent Memory and LlamaCoder routing

The two other newly supplied donors are valuable but do not change this H4 decision.

### TencentCloud/TencentDB-Agent-Memory

Disposition:

```text
H6/H7 MEMORY / TEAM KNOWLEDGE DONOR
DEFER FROM H4
```

Useful later for:

- layered memory;
- skills as versioned assets;
- Wiki/CodeGraph;
- agent-specific loadouts;
- ownership/ACL semantics;
- cross-agent memory service patterns.

It must not be used to bypass H4 and start persistent agent memory before H6 is authorized.

### Nutlope/llamacoder

Disposition:

```text
PRODUCT / ARTIFACT PREVIEW DONOR
DEFER FROM H4 AUTHORITY
```

Useful later for:

- prompt -> generated app -> preview loop;
- browser-side bundling;
- sandboxed iframe previews;
- iterative artifact UX.

It is not a K2/confinement authority donor.

---

## 17. Security consequences of the audit

The audit strengthens Kodac by rejecting four tempting shortcuts:

1. **sandbox label as proof** — rejected;
2. **mutable image tag as approved workload identity** — rejected;
3. **fallback to weaker runtime when stronger isolation is required** — rejected;
4. **credential availability as capability authority** — rejected.

It also preserves two current strengths OpenSandbox should not replace:

```text
K2 durable execution receipts
Done Gate PROVEN_READY authority
```

---

## 18. Recommended R3A donor intake mode

For H4-R3A:

```text
OpenSandbox source intake:
STUDY + CONCEPTUAL PORT

production code copy:
NOT YET AUTHORIZED

new dependency:
NOT AUTHORIZED

server process:
NOT AUTHORIZED

Docker/Kubernetes calls:
NOT AUTHORIZED

network calls:
NOT AUTHORIZED

credential handling:
NOT AUTHORIZED
```

Primary OpenSandbox concepts to port into the R3A authorization are:

- immutable image digest principle;
- resource/TTL request identity;
- network-policy identity;
- lifecycle source identity;
- signed provenance as separate evidence;
- fail-start when a required secure runtime is unavailable.

---

## 19. Audit merge gate

This audit is docs-only.

Canonical acceptance requires:

```text
BASE:
1aa678e002fe0e17c79eca779cf9510ec154e5ee

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

OPENSANDBOX EXECUTION:
0

OPENSANDBOX DEPENDENCY IMPORT:
0

governance / provenance / legacy:
PASS

unresolved review threads:
0

expected-head merge:
REQUIRED
```

No auto-merge.

---

## 20. Final decision

```text
H4 CURRENT STATE:
OPEN / NOT COMPLETE

CURRENT PROVEN FOUNDATION:
ONE-SHOT APPROVAL
+
PROVIDER-NEUTRAL CONFINEMENT CONTRACT
+
LINUX LANDLOCK FILESYSTEM BACKEND
+
K2 LINUX READ-ONLY LANDLOCK EXECUTION BINDING

DECISIVE OPEN GAP:
CONTENT-IDENTITY-BOUND FUTURE WORKLOAD ACROSS APPROVAL / EXECUTION

OPENSANDBOX VALUE:
HIGH

OPENSANDBOX WHOLESALE ADOPTION:
NO

RECOMMENDED NEXT ACTION:
AUTHORIZE H4-R3A ATTESTED SANDBOX WORKLOAD IDENTITY CONTRACT

H4-SPECIFIC H6 BLOCKER:
REMAINS

H6:
NOT AUTHORIZED
```

Status:

```text
KDO_H4_READINESS_OPENSANDBOX_DIFFERENTIAL_READY_FOR_CANONICAL_REVIEW
```
