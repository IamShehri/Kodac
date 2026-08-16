# KDO-H4-R3F — Subject Snapshot Reconciliation

Date: 2026-08-16
Status: RECONCILIATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `87b064e96958f3780624d893b2c2f5868fb95a88`
Predecessor: canonical H4-R3F authorization + requirement-context reconciliation

## 1. Decision

```text
GATE:
KDO-H4-R3F

CHANGE CLASS:
DOCS-ONLY AUTHORIZATION RECONCILIATION

IMPLEMENTATION:
NOT IN THIS PR

ORIGINAL THREE-PATH IMPLEMENTATION ALLOWLIST:
UNCHANGED

DOCKER API / ENDPOINT ALLOWLIST:
UNCHANGED

DOCKER MUTATION AUTHORITY:
NONE

R3B PHYSICAL EVIDENCE MINTING:
FORBIDDEN
```

This document closes two exact-subject snapshot gaps discovered by manual trust review before any R3F evidence ledger was created.

---

## 2. Gap A — image identity is not command identity

Canonical R3F already requires the exact Docker `ImageManifestDescriptor.Digest` to equal the R3A immutable source digest.

That proves only which image manifest the container was created from at Docker control-plane level.

R3A separately includes an exact entrypoint theorem:

```text
workload.entrypoint.executable
workload.entrypoint.args
```

Pinned Moby `daemon/inspect.go` exposes the effective container command as:

```text
InspectResponse.Path = ctr.Path
InspectResponse.Args = ctr.Args
```

Therefore an R3F snapshot that validates only image digest can otherwise bind a container using the right image while running a different command.

That would violate exact R3A workload subject binding.

---

## 3. Canonical command reconciliation

R3F exact inspect must additionally require:

```text
InspectResponse.Path
== configuredRequirement.workload.entrypoint.executable
```

and exact ordered argument equality:

```text
InspectResponse.Args
== configuredRequirement.workload.entrypoint.args
```

Rules:

- no PATH resolution;
- no shell normalization;
- no basename comparison;
- no prefix/suffix comparison;
- no `Config.Image` or image default command as substitute;
- no argument coercion;
- array length and every string element must match exactly and in order.

Any mismatch fails closed before R3F returns a binding or E2 observation.

The E2 observation record must bind deterministic command identity data so later conjunction cannot silently lose this fact.

Purpose-equivalent added record fields:

```text
executable
argsIdentity
```

where `argsIdentity` deterministically binds the exact ordered validated argument vector.

The record need not expose all arguments if a deterministic identity is used, but the live inspect comparison must use the full exact vector.

---

## 4. Gap B — creation network mode is not current attachment state

Canonical R3F already requires:

```text
HostConfig.NetworkMode == "none"
```

That is necessary but not sufficient even for the current Docker control-plane snapshot.

Pinned Moby source permits a running container to be connected to another network through `ConnectToNetwork(...)` and updates:

```text
ctr.NetworkSettings.Networks
```

Therefore a container can have historical/creation `NetworkMode=none` while its current Docker network attachment map is no longer empty.

R3F must not describe such a subject as having a deny-all E2 control-plane snapshot.

---

## 5. Canonical live network-attachment reconciliation

In addition to:

```text
HostConfig.NetworkMode == "none"
```

R3F exact inspect must require:

```text
NetworkSettings.Networks
is a plain object with exactly zero own string keys
and zero own symbol keys
```

Any live network attachment entry fails closed regardless of its name or reported endpoint details.

R3F must not use a allowlist such as `none`, `bridge`, or loopback inside `NetworkSettings.Networks`; the required current attachment map is exactly empty.

This remains E2 Docker control-plane evidence only and is not physical network-namespace proof.

---

## 6. Pinned Moby evidence

Canonical Moby pin remains:

```text
repository:
moby/moby
commit:
d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
```

Relevant canonical source pins:

```text
daemon/inspect.go
37f442915a524bf833a0f4bc3597513f62b1417a

# getInspectData emits Path, Args and NetworkSettings.Networks


daemon/container_operations.go
7f9d30595de0e34c6f0b0f44d366b4e63821bdb8

# ConnectToNetwork can attach a running container to a network and persists
# the resulting NetworkSettings.Networks state
```

No donor code is copied by this reconciliation.

---

## 7. Request and authority surface remains unchanged

These new checks use fields already returned by the existing exact inspect request:

```text
GET /v1.48/containers/<FULL_64_LOWERHEX_ID>/json?size=0
```

Therefore this reconciliation authorizes:

```text
new Docker endpoints: 0
new HTTP methods: 0
new socket authority: 0
new filesystem authority: 0
new process authority: 0
```

The existing exact two-GET R3F request allowlist remains unchanged.

---

## 8. E2 observation semantics after reconciliation

A successful R3F E2 snapshot must now bind at minimum:

```text
exact full container ID
exact requirement/workload identities
exact image manifest digest
exact executable
exact ordered args identity
Runtime=runsc
HostConfig.NetworkMode=none
zero current NetworkSettings.Networks attachments
exact NanoCpus
exact Memory
exact MemorySwap
non-privileged
running/non-paused/non-restarting/non-dead
first-life + restart-disabled
trusted socket endpoint identity
```

These remain control-plane facts only.

R3F still does not prove physical rootfs, network namespace, cgroup, TTL, output or complete guest execution semantics.

---

## 9. Explicit residual non-authority

Even after this reconciliation, R3F does not claim to prove or normalize unmodeled execution fields such as:

```text
container environment
working directory
user/group
mount topology
Linux capabilities
security options
seccomp profile
AppArmor profile
device mappings
cgroup physical state
network namespace physical state
```

Where those facts matter to a later physical theorem, they require explicit later authorization rather than silent inference.

---

## 10. Additional focused proof required

The future/current R3F focused suite must additionally prove:

1. exact matching Docker `Path` is accepted;
2. changed executable fails closed;
3. exact ordered `Args` are accepted;
4. changed argument value fails closed;
5. changed argument order fails closed;
6. extra/missing argument fails closed;
7. malformed/non-string `Args` fails closed;
8. missing/malformed `NetworkSettings.Networks` fails closed;
9. exactly empty plain `NetworkSettings.Networks` is accepted;
10. any single network attachment entry fails closed;
11. the E2 observation identity changes when executable or ordered args change;
12. these checks introduce no additional Docker request.

All previously authorized focused proofs remain required.

---

## 11. Implementation allowlist remains unchanged

The R3F pre-ledger implementation allowlist remains exactly:

```text
1. packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
2. packages/kodac-runtime/src/index.ts
3. packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
```

No fourth implementation path is authorized.

The reserved evidence ledger remains absent until fresh exact-head pre-ledger PASS:

```text
docs/planning/KODAC_KDO_H4_R3F_DOCKER_READ_ONLY_CONTROL_PLANE_EVIDENCE_2026-08-16.md
```

---

## 12. Exact reconciliation scope

This reconciliation PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3F_SUBJECT_SNAPSHOT_RECONCILIATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta must remain zero.

No evidence ledger is needed because this PR implements no runtime theorem.

---

## 13. Review gate

Before canonical merge, exact PR head must prove:

```text
base = exact canonical main 87b064e96958f3780624d893b2c2f5868fb95a88
changed paths = exactly this one reconciliation document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2 regression gate = PASS where triggered
available automated review = no unresolved actionable finding
unavailable/pending reviewer recorded accurately
manual semantic/security review = PASS
0 unresolved actionable review threads
```

---

## 14. Final reconciled subject theorem

```text
R3F SUBJECT DISCOVERY:
LABELS SELECT A CANDIDATE ONLY

R3F EXACT SUBJECT SNAPSHOT:
FULL ID + REQUIREMENT/WORKLOAD IDENTITIES
+ IMAGE MANIFEST DIGEST
+ EXACT EFFECTIVE PATH/ARGS
+ RUNSC
+ NETWORKMODE NONE
+ ZERO CURRENT NETWORK ATTACHMENTS
+ EXACT CPU/MEMORY/NO-SWAP
+ SAFE LIFECYCLE POSTURE

R3F EVIDENCE CLASS:
E2 DOCKER CONTROL-PLANE ONLY

R3B PHYSICAL EVIDENCE:
NOT MINTED

DOCKER MUTATION:
NONE
```

This reconciliation prevents labels plus image identity from being mistaken for exact workload-command identity and prevents creation-time `NetworkMode=none` from being mistaken for current zero-network attachment state.