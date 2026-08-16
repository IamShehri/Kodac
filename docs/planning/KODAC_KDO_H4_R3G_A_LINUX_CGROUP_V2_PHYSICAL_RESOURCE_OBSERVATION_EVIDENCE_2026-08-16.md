# KDO-H4-R3G-A — Linux cgroup-v2 Physical Resource Observation Evidence

Date: 2026-08-16

Status: **POST-LEDGER CERTIFICATION PENDING**

Repository: `TheHalfMoon/Kodac`

PR: `#102`

---

## 1. Evidence decision

```text
GATE:
H4-R3G-A PRE-LEDGER IMPLEMENTATION GATE

PRE-LEDGER DECISION:
PASS

CANONICAL BASE:
6441a3083c6cd94cfbc73369079916050c56248a

CANONICAL BASE TREE:
47b83a99119dfbfc4882ce05e54b209aadc3e4e1

ACCEPTED PRE-LEDGER HEAD:
5ace1a51a7e1df086b20a7761fcd28cbe451d258

ACCEPTED PRE-LEDGER TREE:
65c708723e1cde183cc544d377f0970df3ca9308

BOUNDED TARGET:
KDO-H4-R3G-A Linux gVisor cgroup-v2 physical resource observation only
```

This ledger records the accepted pre-ledger implementation evidence only.

It does **not** close R3G-A by itself. The ledger transition must remain ledger-only and the complete post-ledger exact-head certification gate must pass before any final completion claim is permitted.

---

## 2. Governing canonical artifacts

The accepted implementation was reviewed against these canonical documents on the canonical base:

```text
docs/planning/KODAC_KDO_H4_R3G_A_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_AUTHORIZATION_2026-08-16.md
blob: 85dd141ebf69bbcefa3f45aadacd232a9a2aa5db

docs/planning/KODAC_KDO_H4_R3G_A_INITIAL_CGROUP_NAMESPACE_RECONCILIATION_2026-08-16.md
blob: 1eb28dd10a963066bb2473ccf583371079ab6861
```

The reconciliation requires a trusted deployment-pinned initial/full-host cgroup namespace identity before R3G-A may make the bounded hierarchy-effective CPU/memory/swap observation claim.

Repository canonical documents remain authoritative over this ledger if a conflict is discovered.

---

## 3. Exact pre-ledger scope

The canonical pre-ledger allowlist contains exactly 13 paths, and the live PR diff at accepted head `5ace1a51a7e1df086b20a7761fcd28cbe451d258` matched that allowlist exactly:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/index.ts
packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

No path outside this allowlist was admitted before the ledger transition.

The reserved evidence-ledger path was confirmed absent at the accepted pre-ledger head before this transition:

```text
docs/planning/KODAC_KDO_H4_R3G_A_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_EVIDENCE_2026-08-16.md
```

---

## 4. Accepted implementation identities

Primary accepted blobs at pre-ledger head:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
c0c455cd4ba363153222e5fa398b3523aeb71413

packages/kodac-runtime/src/execution/gateway.ts
5e4c3cea9982d7c774d0c18beb40f2fcbfde4e64

packages/kodac-runtime/src/index.ts
4e21757d7c140a702ee6a4268a776a2f32383755

packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
7b9ef48c03acdfd95ba73e310a34be2108f0b4ca
```

Protected predecessor implementation blobs retained by the focused proof:

```text
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
b9242c5cecc18fd43b2b80aeffd974ef5311fded

packages/kodac-runtime/src/trust/sandbox-observer-gvisor.ts
47c792ba01c9ba4b2db94d7558f282cdbd218660

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-runtime.ts
1d02a5dbc1dc4071636c24327e7faf9906370ef5

packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
452bd955cb0ef84f2090aa646dfdc70ad610a8d9
```

---

## 5. Bounded theorem proven by the implementation

Within the authorized R3G-A scope, the accepted implementation establishes a fail-closed E3 physical-resource observation candidate for the exact trusted gVisor workload subject under the following bounded conditions:

1. Linux only.
2. The dedicated R3G-A capability remains policy-gated.
3. `deny` blocks.
4. `ask` blocks; R3G-A does not introduce new ASK authority.
5. The trusted R3E gVisor runtime is required.
6. The trusted R3G-A runtime configuration is exact and narrow.
7. The deployment-pinned initial/full-host cgroup namespace device/inode identity is required.
8. The cgroup namespace is re-observed and checked through the physical observation/commit bracket.
9. Exactly one cgroup-v2 mount is admitted at `/sys/fs/cgroup` with mount root `/`.
10. Truncated or malformed cgroup2 mountinfo records fail closed.
11. The exact R3E PID/start-time subject is preserved.
12. The target must be a non-root cgroup.
13. The target PID must appear in target `cgroup.procs`.
14. Every admitted non-root target/ancestor level is `cgroup.type=domain`.
15. CPU proof is hierarchy-effective and exact as a rational value against required `cpuMillis`.
16. `cpu.max.burst` must be exactly zero.
17. Scheduler posture is restricted to `SCHED_OTHER` / policy `0` with `rt_priority=0`.
18. Effective cpuset plus process affinity cannot narrow available CPU below the requirement.
19. Memory proof is hierarchy-effective and exactly equals required `memoryBytes`.
20. Effective swap must be exactly zero.
21. Pre/post physical snapshots must remain stable and identity-equal.
22. R3E durable lineage evidence is committed and validated before the R3G-A resource evidence commit.
23. R3G-A resource commit acknowledgment is identity-validated before successful return.
24. Timeout, abort, callback failure, or wrong acknowledgment prevents successful return.
25. A late callback completion after timeout/abort cannot upgrade the already-failed invocation to success.
26. The production API exposes no arbitrary caller-selected PID, host path, cgroup root, reader, or helper authority.
27. The production R3G-A module cannot mint `SandboxBackendObservation` or `SandboxExecutionEvidence`.
28. Serialized resource evidence is bounded before acceptance.
29. Protected predecessor trust surfaces remain pinned by the focused proof.

The timeout theorem above is an invocation/proof theorem. It does **not** claim that an external durable store rolled back or could not eventually perform a write after the caller stopped waiting. R3G-A v1 intentionally does not widen its exact runtime contract with a status-query or idempotency API.

---

## 6. Focused hostile-case proof

The focused R3G-A test at the accepted head covers, among other cases:

- canonical constants, bounds, namespace trust, root rejection, and hierarchy;
- exact CPU/memory/no-swap success;
- root fabrication and incomplete/reordered hierarchy rejection;
- wrong and truncated cgroup2 mountinfo rejection;
- CPU wider/stricter/unlimited/malformed/missing controls;
- non-zero CPU burst rejection;
- non-fair scheduler and RT-priority rejection;
- process-affinity/cpuset narrowing rejection;
- memory wider/stricter/unlimited/malformed/missing controls;
- positive/unlimited/malformed swap rejection;
- missing target PID and wrong process start-time rejection;
- ambiguous cgroup and CPU-list grammar rejection;
- re-derivation of normalized hierarchy/CPU/memory evidence;
- hostile Proxy-array rejection before traps execute;
- full synthetic R3E lineage binding;
- resource-record and resource-commit identity validation;
- stale physical snapshot rejection;
- wrong R3E and R3G-A durable acknowledgment rejection;
- failed, timed-out, pre-cancelled, during-cancelled, and late-completing commit callbacks;
- test-only fixed-surface read cancellation with late result unable to become success;
- non-Linux production fail-closed behavior on non-Linux runners;
- pre-aborted Linux production path before trusted resolver/physical-read activity;
- runtime-config rejection of caller-selected reader/root/PID/helper authority;
- gateway fixed-surface structural boundary;
- production module purity and protected predecessor blob pins.

---

## 7. Exact pre-ledger CI evidence

All required workflows associated with accepted pre-ledger head `5ace1a51a7e1df086b20a7761fcd28cbe451d258` completed successfully:

```text
governance
run: 31950089950
conclusion: success

k3-r4-adapter
run: 31950089956
conclusion: success

k3-r5-context-engine
run: 31950089942
conclusion: success

k2-runtime
run: 31950089953
conclusion: success
```

The K2 runtime workflow included successful:

```text
runtime-change-classifier
job: 95172118853

runtime (ubuntu-latest)
job: 95172138152
Typecheck: PASS
Full test: PASS
Benchmark hook: PASS

runtime (macos-latest)
job: 95172138158
Typecheck: PASS
Full test: PASS
Benchmark hook: PASS

runtime (windows-latest)
job: 95172138210
Typecheck: PASS
Full test: PASS
Benchmark hook: PASS

k2-runtime-gate
job: 95172235446
PASS
```

No failing required workflow remained on the accepted pre-ledger head.

---

## 8. Review and manual trust/security gate

### Review threads

Immediately before the ledger transition:

```text
UNRESOLVED ACTIONABLE REVIEW THREADS:
0
```

Earlier CodeRabbit and Qodo findings were either fixed or adjudicated against the canonical contract and resolved. In particular:

- the timeout/late-completion concern was reconciled to the canonical invocation-success theorem; CodeRabbit subsequently withdrew that finding;
- the proposal to authorize the R3G-A capability in generic workspace/K3 policy surfaces was rejected as an unauthorized authority expansion; CodeRabbit subsequently withdrew that finding.

### External reviewer status

Truth recorded without upgrading unavailable/stale evidence:

```text
CodeRabbit exact accepted-head commit status:
SUCCESS

Qodo fresh exact accepted-head review submission:
NOT OBSERVED / NOT COUNTED AS PASS

Cubic fresh exact accepted-head review submission:
NOT COUNTED AS PASS
```

An older Qodo review remains useful historical evidence but is not represented as an exact-head PASS.

### Manual architecture / trust / security review

Result:

```text
PASS
```

The manual review checked the strict parser boundary, host-read authority, namespace binding, PID/start-time binding, hierarchy derivation, CPU/memory/swap theorem, cancellation/timeout behavior, durable acknowledgment order, E3-only claim boundary, and protected predecessor surfaces.

The manual review found and corrected one final fail-closed parser issue before acceptance: a cgroup2 mountinfo record lacking the required post-separator super-options field could previously survive the field-count guard. The accepted head rejects that truncated record, and the focused hostile fixture proves the rejection.

---

## 9. Explicit nonclaims

This evidence does **not** claim:

- R3G-A creates final R3B physical sandbox evidence;
- R3G-A alone proves complete sandbox security;
- arbitrary container runtimes are supported;
- arbitrary cgroup mounts, cgroup namespaces, PIDs, roots, readers, paths, or helper binaries are authorized;
- cgroup mutation or Docker mutation is authorized;
- network/process/IPC/read-confidentiality confinement is newly proven by R3G-A;
- macOS or Windows physical cgroup enforcement exists;
- an external durable store necessarily rolls back a commit after observer timeout;
- generic workspace or K3 policy surfaces may invoke the R3G-A capability;
- any future learned-intelligence or self-improvement architecture is authorized here;
- H4 is complete;
- PR #102 is ready to merge solely because this ledger exists.

---

## 10. Ledger transition rule

The only authorized transition after the accepted pre-ledger head is this evidence-ledger addition.

The resulting ledger commit must be proven to contain no implementation or test change beyond adding this exact reserved ledger path.

After that transition, the complete required certification suite must be run again on the exact ledger head. If required workflows do not automatically run for the docs-only transition, they must be explicitly re-run through the repository's canonical workflow mechanism; absence of a fresh run must never be represented as PASS.

Until that post-ledger exact-head certification is complete, the only valid state is:

```text
POST-LEDGER CERTIFICATION PENDING
```
