# KDO-H4-R3C — Backend Semantics / Trusted Observation Reconciliation

Date: 2026-08-15
Status: RECONCILIATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `13e1f0988d4127e239f3631264222dd506abf062`
Canonical base tree: `9fdc8e2a36286e761a6d636d84907ddb7dac3529`
Predecessor: canonical H4-R3B requirement / capability / supplied-observation / evidence contract

## 1. Decision

```text
GATE:
KDO-H4-R3C

NAME:
BACKEND SEMANTICS / TRUSTED OBSERVATION RECONCILIATION

CHANGE CLASS:
DOCS ONLY / SEMANTIC RECONCILIATION / NO EXECUTION

H4-R3B:
CANONICAL / PROVEN

H4 COMPLETE:
NO

H6 AUTHORIZED:
NO

EXTERNAL-PROCESS ask:
REMAINS BLOCKED

DOCKER / OPENSANDBOX / RUNSC EXECUTION:
NOT AUTHORIZED

DOCKER SOCKET / CONTAINERD SOCKET / RUNTIME ROOT READ:
NOT AUTHORIZED BY THIS DOCUMENT

NEXT IMPLEMENTATION:
NOT AUTHORIZED BY THIS DOCUMENT
```

R3C resolves the semantic and evidence-quality ambiguities that must be closed before Kodac can safely authorize a physical sandbox observer.

The governing theorem is:

```text
REQUIREMENT
!= BACKEND CONFIGURATION
!= CONTROL-PLANE STATUS
!= OBSERVATION SIGNAL
!= TRUSTED PHYSICAL PROOF
```

No layer may be silently promoted to the next.

---

## 2. Canonical predecessor truth

PR #88 merged the certified H4-R3B branch head:

```text
b13d98a7deaddcb536bad6c76cad87d3b8106ffd
```

into canonical `main` as merge commit:

```text
13e1f0988d4127e239f3631264222dd506abf062
```

with tree:

```text
9fdc8e2a36286e761a6d636d84907ddb7dac3529
```

Canonical R3B evidence ledger:

```text
docs/planning/KODAC_KDO_H4_R3B_SANDBOX_BACKEND_CAPABILITY_EXECUTION_EVIDENCE_2026-08-15.md
blob aa96c3142bb12cdf535238639560880e1e3b5677
```

R3B therefore permits the bounded canonical claim:

```text
KODAC_SANDBOX_BACKEND_REQUIREMENT_OBSERVATION_EVIDENCE_CONTRACT_PROVEN
```

Meaning only that Kodac has a deterministic pure contract binding an exact validated R3A workload requirement to a backend capability declaration and a supplied observation while rejecting mismatches under fixed identity encoding.

R3B explicitly did not prove a trusted observer or physical backend enforcement.

---

## 3. Architectural authority remains K2 / ExecutionGateway

Canonical ADR:

```text
docs/adr/ADR-0006-mandatory-trust-hook-side-effects.md
blob 4db464a169628d4d62458b189f1ea36d8af671db
```

requires every privileged or state-affecting operation to pass through the mandatory trust path owned by `ExecutionGateway` and the Trust Kernel.

Canonical H4-R2C additionally establishes:

```text
K2 REMAINS THE SOLE PRODUCTION SIDE-EFFECT EXECUTION AUTHORITY
```

Therefore a later Docker/containerd/runsc observer MUST NOT become an independent executor, hidden helper daemon, direct model tool, MCP bypass, or trust authority.

External reads can themselves be sensitive. Docker socket access, containerd socket access, runtime-root reads, `/proc` inspection, cgroup inspection, namespace inspection, registry access, and host-network inspection require an explicitly registered and bounded K2 capability before production use.

R3C authorizes none of those reads.

---

## 4. Source pins

### 4.1 OpenSandbox

```text
repository:
opensandbox-group/OpenSandbox

commit:
f8ed8734ce1fda69f0979f912160fb933b9bfa0c

tree:
cf033b4f880b7e84b563dcf7f63722582ea48762

license:
Apache-2.0

root license blob:
b09cd7856d58590578ee1a4f3ad45d1310a97f87
```

Primary pinned references:

```text
oseps/0004-secure-container-runtime.md
65d1ec76530b01c7f530a582ba1bbc7deb5c8b35

docs/guides/secure-container.md
769cd247317400ec6fe9859505fbe8fb9161b52d
```

The OpenSandbox upstream `main` was rechecked on 2026-08-15 and still pointed to the existing Kodac pin above. No donor repin is required.

### 4.2 gVisor

```text
repository:
google/gvisor

commit:
50e1502a95d36ad2faf2c7ef33b8bf21fe975293

tree:
12ce7f8c4f8b0481cccb4c28632fff49cb3f50e4

root license:
Apache-2.0 with file-specific additional licenses noted by upstream

root license blob:
f7a006d10464cfe9724b5d687c0013bf982cc66a
```

Primary pinned reference:

```text
g3doc/user_guide/quick_start/docker.md
8d3f8541cdce3990a19689a5dc54fe80da43f2b2
```

### 4.3 Docker documentation

```text
repository:
docker/docs

commit:
3a9d778562f39bcc0be46255b013c6a3ca526244

tree:
2be0c31bf78b2f121043d805f23a64dd94698ec2

license:
Apache-2.0

root license blob:
f8971197c6f5ba9d1c7b9d8f4b6198ec5a885596
```

Primary pinned references:

```text
content/manuals/engine/network/drivers/none.md
d0715b1ff4f388c413b1fc18d85c9d71c67c22b7

content/manuals/engine/containers/resource_constraints.md
76df2f43cdadd39cc5b750fcbac14423a8a3ffa6
```

R3C studies these sources only. It copies no donor implementation code and adds no donor dependency.

---

## 5. OpenSandbox differential: useful mechanism, insufficient proof by itself

Pinned OpenSandbox OSEP-0004 establishes useful backend mechanics:

- secure runtime is server-level configuration;
- Docker mode can select a configured runtime such as `runsc`;
- Kubernetes mode can select a RuntimeClass;
- availability is validated before sandbox creation;
- runtime installation is infrastructure responsibility.

These are useful deployment/control-plane patterns.

They do not satisfy Kodac's full R3B physical-proof boundary because:

1. a server-global configured runtime is not per-execution physical proof;
2. configured runtime availability is not proof that the exact execution instance used it;
3. a sandbox `Running` state proves lifecycle status, not confinement theorem;
4. a provider's own declared secure-runtime label is not an independent observation;
5. OpenSandbox intentionally permits standard `runc` when no secure runtime is configured, while R3B forbids silent downgrade/fallback.

Kodac may reuse the mechanics later only behind stronger lineage and fail-closed evidence.

---

## 6. gVisor differential: guest self-report is explicitly non-authoritative

Pinned gVisor Docker documentation shows the normal deployment path:

```text
Docker -> runtime named runsc -> gVisor
```

It also shows a human diagnostic using guest `dmesg` and explicitly warns that the output is easily replicated by an attacker and must never be used to verify the runtime in a security-sensitive context.

Therefore R3C makes the following rule canonical:

```text
GUEST dmesg / uname / proc text / environment / self-reported runtime string:
UNTRUSTED FOR R3B PHYSICAL RUNTIME PROOF
```

A later observer may capture such values only as non-authoritative diagnostics. They MUST NOT satisfy `observedSemanticRuntimeClass` or any trusted-proof gate.

---

## 7. Evidence-quality classes

R3C defines the following evidence classes for later authorization.

### E0 — untrusted workload/guest claim

Examples:

- guest `dmesg`;
- environment variable claiming `gvisor`;
- workload stdout;
- application self-report.

Authority:

```text
NONE
```

### E1 — desired/declarative configuration

Examples:

- OpenSandbox `secure_runtime.type = gvisor`;
- Docker creation request asking for `Runtime=runsc`;
- desired `NetworkMode=none`;
- requested resource values.

Authority:

```text
REQUIREMENT / CONFIGURATION ONLY
```

### E2 — trusted host control-plane observation

Examples, only when read through a later K2-authorized trusted host observer:

- Docker daemon container inspection showing effective `HostConfig.Runtime`;
- Docker daemon network/resource fields;
- image/container identifiers;
- engine/runtime metadata.

Authority:

```text
OBSERVED CONTROL-PLANE STATE
NOT SUFFICIENT ALONE FOR PHYSICAL ENFORCEMENT PROOF
```

### E3 — trusted host physical/runtime state

Examples, subject to future exact authorization:

- host-owned process/runtime lineage tied to the exact execution instance;
- runtime state rooted in a trusted runsc/containerd/Docker-owned state surface;
- host cgroup state tied to the exact execution instance;
- host network-namespace or equivalent runtime state tied to that instance;
- immutable image digest resolved for the exact container instance.

Authority:

```text
CANDIDATE PHYSICAL OBSERVATION
```

No individual E3 signal is automatically sufficient. The later adapter must define the exact conjunction needed for each R3B fact.

### E4 — accepted Kodac physical proof

E4 exists only when a future canonical implementation:

1. obtains all required facts through authorized trusted-host sources;
2. binds them to one exact execution instance and R3A workload identity;
3. proves the observer implementation identity;
4. proves no downgrade;
5. proves all required R3B capability semantics;
6. passes the future evidence gate and K2 lineage checks.

Only E4 may feed a supplied observation into a completion claim that implies trusted physical backend evidence.

R3C creates no E4 implementation.

---

## 8. Runtime-class observation rule

A later Docker + gVisor adapter MUST NOT set:

```text
observedSemanticRuntimeClass = gvisor
```

from any one of the following alone:

- OpenSandbox secure-runtime config;
- Docker creation request;
- Docker `HostConfig.Runtime` inspection;
- guest `dmesg`;
- container environment;
- container name/label;
- presence of the `runsc` executable on the host.

`HostConfig.Runtime=runsc` is valuable E2 evidence that Docker associated the container with the configured runtime. It is not independently sufficient physical proof that the exact execution instance was isolated by the expected runsc implementation.

A future adapter must additionally bind runtime-specific trusted-host state to the exact container/execution instance and to a pinned observer/runtime identity model.

If that binding cannot be obtained, runtime proof is unavailable and the operation must fail closed rather than emit `gvisor` evidence.

---

## 9. Source-digest observation rule

R3A source authority is the immutable OCI digest:

```text
sha256:<64 lowercase hex>
```

A later observer may not treat a mutable tag, image name, configured pull reference, container label, or request body as proof of the executed content digest.

Physical source proof must bind the exact execution instance to an immutable image/content digest observed from a trusted host/backend surface.

If a backend exposes only a tag or mutable image locator, R3B source observation is unavailable and must fail closed.

Registry resolution is a separate authority surface and remains unauthorized by R3C.

---

## 10. Canonical reconciliation of `cpuMillis`

R3A v1 introduced the field:

```text
cpuMillis
```

with positive-safe-integer validation and ceiling:

```text
cpuMillis <= 256000
```

but did not state the unit semantics needed by a physical backend translator.

That ambiguity must not survive into backend execution.

R3C therefore defines the canonical v1 meaning as:

```text
cpuMillis = milliCPU capacity units
1000 cpuMillis = capacity ceiling of 1 logical CPU
1 cpuMillis = 0.001 logical CPU
256000 cpuMillis = capacity ceiling of 256 logical CPUs
```

This is a semantic clarification of the existing numeric field, not a new field and not a new identity encoding.

All existing R3A/R3B fixed vectors remain byte-identical because no serialized value or key changes.

`cpuMillis` is NOT:

- milliseconds of aggregate CPU time consumed;
- a wall-clock duration;
- a CPU reservation guarantee;
- scheduler priority/weight;
- a promise that the host has the requested capacity.

A backend may support a stricter maximum and fail closed.

---

## 11. Docker CPU translation rule

Pinned Docker documentation defines `--cpus=<value>` as a CFS CPU-capacity ceiling. For example, `--cpus=1.5` is equivalent to a default period of 100000 microseconds with quota 150000 microseconds.

Under the R3C `cpuMillis` clarification, an exact Docker capacity translation may be purpose-equivalent to:

```text
cpus = cpuMillis / 1000
```

or, when using Docker's nano-CPU representation:

```text
NanoCpus = cpuMillis * 1_000_000
```

provided the future implementation proves the selected Engine/API representation and integer bounds exactly.

This translation theorem does NOT by itself prove enforcement.

A Docker request carrying the expected value is E1.

A trusted Docker daemon inspection reporting the expected effective value is E2.

A future `supportsCpuBudgetObservation=true` physical-proof claim requires the additional trusted host/runtime enforcement evidence explicitly authorized by a later slice.

No current R3C code sets that capability flag.

---

## 12. Memory semantics

R3A `memoryBytes` means a maximum memory-capacity bound in bytes for the workload request.

A future adapter must define whether its backend limit includes/excludes swap and which cgroup/runtime field is authoritative.

Docker `Memory` without an explicit swap posture is insufficient for a Kodac theorem if swap could widen the effective memory authority.

Therefore a future Docker authorization must choose and test an exact fail-closed memory+swap mapping rather than checking only one configured number.

R3C authorizes no mapping yet.

---

## 13. TTL semantics

R3A `ttlMs` is a maximum permitted wall-clock execution lifetime for the workload instance.

A later backend must prove both:

1. the timer/deadline is bound to the exact execution instance; and
2. expiry causes fail-closed termination/revocation under K2-owned lifecycle authority.

A provider TTL field, requested timeout, or scheduled cleanup value is configuration until its enforcement lifecycle is proven.

R3C authorizes no timer, kill, remove, or lifecycle side effect.

---

## 14. Output-limit semantics

R3A `maxOutputBytes` is the maximum aggregate output evidence accepted by the Kodac workload execution boundary for the versioned R3A request.

A future adapter must define exact aggregation semantics for stdout/stderr and must stop/cap evidence without unbounded buffering.

A Docker logging configuration is not automatically equivalent to this Kodac bound.

R3C authorizes no log read or output implementation.

---

## 15. Deny-all network semantics

R3A v1 network authority is exactly:

```text
deny-all
```

Pinned Docker documentation states that `--network none` completely isolates the container networking stack except for loopback.

For a later Docker backend, `NetworkMode=none` is therefore a strong candidate configuration mapping for the R3A deny-all intent.

However:

```text
requested --network none = E1
Docker daemon reports NetworkMode=none = E2
```

Neither alone is automatically E4 physical proof.

A future observer must define the trusted host/runtime state that proves the exact execution instance has no non-loopback network authority and that no runtime/provider side channel widens it.

The proof must be runtime-specific where necessary.

Any uncertainty or disagreement between Docker and runtime/network state must fail closed.

---

## 16. No silent downgrade

R3B already requires:

```text
downgradePolicy = forbid
downgradeOccurred = false
```

R3C strengthens the later physical-proof interpretation:

- `runsc` unavailable -> fail closed;
- expected runtime cannot be physically proven -> fail closed;
- Docker reports default/runc -> fail closed;
- Docker reports a different runtime -> fail closed;
- observer lacks required privileges/read surfaces -> fail closed;
- required cgroup/network/runtime lineage cannot be tied to the execution instance -> fail closed;
- provider silently changes runtime after request -> fail closed;
- any required fact is unknown -> fail closed.

No fallback to `runc`, generic Docker, unconfined local execution, or a weaker observer is allowed for an R3B-qualified execution.

---

## 17. Trusted observer identity

R3B carries an `observerIdentity` but does not define a physical observer implementation.

A future observer authorization must define an identity over at least:

- observer contract version;
- Kodac observer implementation blob/build identity;
- provider/backend family and version floor;
- trusted source classes used for each observed fact;
- normalization/translation version;
- required host platform assumptions;
- runtime-specific proof strategy version.

The observer identity must not be caller-selected.

A workload, model, plugin, MCP caller, or provider response must not be able to choose or forge the trusted observer identity.

---

## 18. Execution-instance lineage

Every future physical fact must be tied to one exact R3B `executionInstanceIdentity` and the exact R3A workload identity.

A valid proof cannot combine facts from different containers, different runs, stale inspection snapshots, reused names, or a previous sandbox instance.

The later adapter must define a race-resistant lineage from K2's execution-attempt identity through backend instance creation to all subsequent observations.

Name-only or tag-only correlation is forbidden.

This requirement applies even if every individual observation value appears correct.

---

## 19. Docker socket is not a casual read API

Access to the Docker Engine Unix socket is host-sensitive authority even when a particular HTTP method is read-only.

A future implementation must therefore:

- expose no raw socket/file descriptor to models or plugins;
- expose no caller-controlled Docker endpoint/path;
- allowlist exact read operations and response bounds;
- parse untrusted daemon responses defensively;
- bind every query to the exact K2-owned execution instance;
- keep mutation endpoints unavailable unless separately authorized;
- fail closed on socket/daemon identity ambiguity.

R3C does not authorize `GET`, `POST`, `DELETE`, or any other Docker Engine request. It only records the requirements for a later authorization.

---

## 20. First physical adapter MUST NOT use OpenSandbox as a trust proxy

A later Kodac implementation may study or wrap OpenSandbox mechanics, but it may not replace Kodac evidence with:

```text
OpenSandbox says secure_runtime=gvisor
OpenSandbox says sandbox is Running
therefore physical proof is true
```

If OpenSandbox is introduced later, Kodac must independently bind the underlying backend instance and trusted-host observations to the R3B execution identity.

OpenSandbox remains a donor/provider candidate, not the Kodac Trust Kernel.

---

## 21. Protected canonical surfaces

R3C is docs-only and MUST leave all production/test/schema/workflow/dependency surfaces byte-identical to canonical base `13e1f098...`.

At minimum, no R3C commit may modify:

```text
packages/kodac-runtime/src/trust/sandbox-workload.ts
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
packages/kodac-runtime/src/trust/approval.ts
packages/kodac-runtime/src/trust/confinement.ts
packages/kodac-runtime/src/trust/confinement-linux-landlock.ts
packages/kodac-runtime/src/trust/confinement-runtime.ts
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/evidence/receipt.ts
packages/kodac-runtime/src/verification/done-gate.ts
packages/kodac-runtime/src/agent/loop.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/package.json
packages/kodac-runtime/scripts/run-tests.mjs
packages/kodac-runtime/THIRD_PARTY_NOTICES.md
schema/kdo-h4-r3a-sandbox-workload.schema.json
schema/kdo-h4-r3b-sandbox-backend-evidence.schema.json
.github/workflows/*
```

---

## 22. Exact R3C scope

This reconciliation PR is authorized to change exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3C_BACKEND_SEMANTICS_TRUSTED_OBSERVATION_RECONCILIATION_2026-08-15.md
```

No evidence ledger is needed because R3C implements no runtime theorem. Its canonical merge commit is the governance evidence that the semantic reconciliation became authority.

No skip, test weakening, generated code, dependency update, donor import, or workflow change is authorized.

---

## 23. Review gate

Before R3C merge, the exact PR head must prove:

```text
base = exact canonical main 13e1f0988d4127e239f3631264222dd506abf062
changed paths = exactly 1 authorized docs path
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
existing K2/K3 regression gates = PASS where triggered
CodeRabbit/Qodo/Cubic review = no unresolved actionable finding
manual semantic/security review = PASS
```

Any finding that would require runtime code must not be fixed inside R3C. It must cause the reconciliation to be corrected in docs or deferred to the next authorization.

---

## 24. Next slice after canonical R3C

If R3C becomes canonical, the next allowed action is a new docs-only authorization:

```text
KDO-H4-R3D — LINUX DOCKER/gVisor TRUSTED OBSERVER PRIMITIVE AUTHORIZATION
```

R3D should authorize the smallest implementation that can prove trusted host observations without creating execution authority.

Its initial target should be a K2-owned, read-only Linux observer primitive with a narrow source allowlist and fixture-driven proof.

R3D MUST decide exact implementation paths and APIs before any code is written.

R3D MUST NOT automatically authorize container create/start/exec/kill/remove, image pull, registry access, OpenSandbox server integration, or external-process `ask`.

If a read-only observer cannot prove all required R3B facts, it must expose that incompleteness explicitly rather than minting a complete R3B evidence record.

---

## 25. Explicit non-authority

R3C does not authorize or prove:

- Docker Engine access;
- Docker socket access;
- containerd access;
- runsc invocation;
- runsc state-root inspection;
- `/proc` or cgroup inspection;
- namespace inspection;
- image pull or registry resolution;
- OpenSandbox server/SDK/dependency;
- container create/start/exec/kill/remove;
- physical gVisor confinement;
- physical deny-all network enforcement;
- physical CPU/memory/TTL/output enforcement;
- trusted observer implementation;
- credential brokering;
- K2 gateway mutation;
- approval mutation;
- receipt mutation;
- Done Gate mutation;
- workspace-write integration;
- external-process `ask` re-enable;
- H4 closure;
- H6 authorization.

---

## 26. Maximum claim after R3C canonical merge

If this docs-only reconciliation passes its gate and merges at the expected exact head, the maximum new claim is:

```text
KODAC_SANDBOX_BACKEND_OBSERVATION_SEMANTICS_RECONCILED
```

Meaning only:

```text
Kodac has canonically distinguished configuration, observation and physical
proof; defined R3A cpuMillis as milliCPU capacity units without changing
identity encoding; prohibited guest self-report and single control-plane
signals from being treated as physical runtime proof; and fixed the K2 trust
boundary that a later physical observer must obey.
```

It does not mean any backend has been executed or physically proven.

---

## 27. Final boundary

```text
R3B CONTRACT:
PROVEN / CANONICAL

R3C SEMANTIC RECONCILIATION:
AUTHORIZED ONLY IF THIS DOCUMENT BECOMES CANONICAL

R3D OBSERVER IMPLEMENTATION:
NOT YET AUTHORIZED

PHYSICAL BACKEND PROOF:
NOT YET PROVEN

EXTERNAL-PROCESS ask:
BLOCKED

H4:
OPEN

H6:
NOT AUTHORIZED
```

R3C exists to prevent Kodac from turning a secure-runtime label into a security theorem. The next implementation must earn each physical fact through a trusted, exact-instance, fail-closed observation path.