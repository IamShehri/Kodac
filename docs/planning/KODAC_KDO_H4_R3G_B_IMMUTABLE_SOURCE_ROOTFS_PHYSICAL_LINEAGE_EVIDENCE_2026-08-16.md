# KDO-H4-R3G-B — Immutable OCI Image Base Physical Lineage Evidence

Date: 2026-08-17

Status: **POST-LEDGER CERTIFICATION PENDING**

Repository: `TheHalfMoon/Kodac`

PR: `#109`

---

## 1. Evidence decision

```text
GATE:
H4-R3G-B PRE-LEDGER IMPLEMENTATION GATE

PRE-LEDGER DECISION:
PASS

CANONICAL BASE:
61ffbfe4613a4dd05685909999c395a92a581df6

CANONICAL BASE TREE:
1ccc3a6b282caa1e2a2689822745bdcf6e15e29a

ACCEPTED PRE-LEDGER HEAD:
bfb0aba84767e0b16cb8663d1f195a73b549f37f

ACCEPTED PRE-LEDGER TREE:
4c77aec207dee041e5f9838f9c2df1f5e3c65fd3

BOUNDED TARGET:
KDO-H4-R3G-B Linux gVisor immutable OCI image-base physical lineage only
```

This ledger records the accepted **pre-ledger** implementation evidence for R3G-B only.

It does **not** close R3G-B by itself. This ledger transition must remain ledger-only. A fresh complete post-ledger exact-head certification is mandatory before any completion claim, Ready transition, merge decision, or canonical implementation claim.

Repository canonical authorization remains authoritative over this ledger if a conflict is discovered.

---

## 2. Governing canonical artifacts

The accepted implementation was reviewed against the conjunction of these canonical documents at canonical main `61ffbfe4613a4dd05685909999c395a92a581df6`:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_AUTHORIZATION_2026-08-16.md

docs/planning/KODAC_KDO_H4_R3G_B_R3G_A_R3F_PROTECTED_BLOB_PIN_ALLOWLIST_CORRECTION_2026-08-16.md

docs/planning/KODAC_KDO_H4_R3G_B_REPLAY_SAFE_DURABLE_PUT_FRESH_OBSERVATION_SEMANTICS_CORRECTION_2026-08-16.md
```

The replay correction is canonical through merged PR `#111`:

```text
merge commit:
61ffbfe4613a4dd05685909999c395a92a581df6
```

The accepted semantics separate:

```text
same immutable record + same canonical bytes
=> trusted-store idempotency

same recordIdentity + different canonical bytes
=> integrity failure

lost acknowledgment
=> current invocation remains FAILURE / UNPROVEN
=> no blind same-invocation retry

later recovery
=> fresh full observation
=> fresh executionAttemptIdentity
=> normally distinct recordIdentity
=> success only after its own exact durable acknowledgment
```

---

## 3. Exact accepted pre-ledger scope

The live PR diff at accepted head contains exactly these 14 changed paths:

```text
packages/kodac-runtime/src/execution/gateway.ts
packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-source-lineage.ts
packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts
packages/kodac-runtime/test/kdo-h4-r3b-sandbox-backend-evidence.test.ts
packages/kodac-runtime/test/kdo-h4-r3d-gvisor-observer.test.ts
packages/kodac-runtime/test/kdo-h4-r3f-docker-read-only-control-plane.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
packages/kodac-runtime/test/kdo-h4-r3g-b-gvisor-source-lineage.test.ts
packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts
packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts
packages/kodac-runtime/test/kdo-h5-r3a-monotonic-guarded-tool-pipeline.test.ts
packages/kodac-runtime/test/kdo-h5-r3b-active-guarded-tool-pipeline.test.ts
packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts
```

These are within the canonical implementation allowlist as amended by the R3G-A/R3F protected-blob-pin correction.

The additional R3G-A test-path authority was used only for its canonically authorized R3F predecessor-pin reconciliation. It was **not** used for the final R3G-B gateway-pin reconciliation and did not receive semantic R3G-A changes.

The reserved ledger path was verified absent at accepted pre-ledger head before this transition:

```text
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md
```

No dependency, schema, workflow, generated-code, donor-import, generic policy, K3 policy, or unrelated product-surface change is admitted by this ledger.

---

## 4. Accepted implementation identities

Primary accepted blobs at pre-ledger head:

```text
packages/kodac-runtime/src/execution/gateway.ts
1732dae059fc878c04e6b1bb6a117385efe9ed6a

packages/kodac-runtime/src/trust/sandbox-observer-docker-control-plane.ts
f9e2dda11fe26d481e2e6c328c37cd37a6260106

packages/kodac-runtime/src/trust/sandbox-observer-gvisor-source-lineage.ts
2421da43286bdeb254a86ab2e8b4f02fce0afb6c

packages/kodac-runtime/test/kdo-h4-r3g-b-gvisor-source-lineage.test.ts
c37aba5c1a217a2ba5d367258d1aa7443639cf48

packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
cb452b625d8f637df1ff799ac1385d19eaab1eaf
```

Final protected predecessor gateway-pin reconciliation:

```text
commit:
bfb0aba84767e0b16cb8663d1f195a73b549f37f

old gateway blob:
8de6063a929381d0c889a0638507a41f5fbdc645

final gateway blob:
1732dae059fc878c04e6b1bb6a117385efe9ed6a

reconciled predecessor tests:
9

per-file delta:
+1 / -1

semantic delta:
protected gateway blob pin only
```

No production file changed in the final protected-pin reconciliation commit.

---

## 5. Bounded theorem proven by the accepted implementation

Within the authorized R3G-B scope, the accepted implementation establishes a fail-closed **E3 immutable OCI image-base physical-lineage record** for one exact trusted Linux gVisor execution subject under these bounded conditions:

1. Linux only.
2. The dedicated R3G-B capability remains policy-gated.
3. `deny` blocks.
4. `ask` blocks; R3G-B introduces no new approval authority.
5. The canonical R3E gVisor runtime and R3F Docker resolver are required.
6. Every observation invocation mints a fresh nonce-bound `executionAttemptIdentity` internally; the caller cannot supply it.
7. Docker source proof is bound to the exact required digest-qualified local image; mutable name/tag is not identity.
8. Docker `Descriptor.digest` must equal the required source digest.
9. OCI DiffIDs are preserved in exact order and deterministically derive the expected ChainID.
10. Unsupported Docker storage topology fails closed; the bounded proof admits the canonical Linux `overlayfs`/Moby/containerd topology only.
11. DockerRootDir and containerd address are observed through the canonical R3F read-only control plane and must match the trusted R3G-B runtime boundary.
12. The trusted `ctr` executable has protected root-owned/non-writable parent authority, is opened with no-follow semantics, retained by descriptor, SHA-256 checked, repeatedly identity-revalidated, and rehashed before success.
13. `ctr` execution uses the retained descriptor rather than a later pathname lookup.
14. `ctr` commands are fixed, bounded read commands for the exact `moby` namespace and `overlayfs` snapshotter.
15. The containerd endpoint must be an exact non-symlink Unix socket with protected parent-path authority and trusted uid/gid/mode; it is re-observed during the proof.
16. Moby rootfs path authority is derived from the observed DockerRootDir plus exact container ID, not from caller input or an R3E bundle string.
17. Every protected rootfs parent component must be a root-owned/non-group/world-writable non-symlink directory.
18. The final rootfs target must be an exact non-symlink directory and is retained by descriptor; path, parent authority, descriptor device/inode, and mount identity are revalidated.
19. Stored OCI `Spec.root.path` must equal the exact derived Moby rootfs mount path.
20. `Container.SnapshotKey` is not used as Moby image-base lineage authority.
21. Snapshot ancestry admits only the two canonical bounded shapes: direct active-container -> image ChainID, or active-container -> canonical `<containerId>-init` -> image ChainID.
22. Arbitrary intermediate ancestry fails closed.
23. Exact kernel mountinfo must expose one unambiguous overlay mount at the retained rootfs target; directory existence alone is insufficient.
24. The mount observation is repeated and identity-stable before record creation.
25. R3E state/process subject identity is bracketed and must remain stable.
26. R3F container binding is re-observed and must remain stable.
27. Docker endpoint/storage/image-rootfs identities are re-observed and must remain stable.
28. Container spec, snapshot ancestry, ctr artifact, containerd endpoint, rootfs parent authority, retained rootfs object, and mount identity are stable through the final gate.
29. One monotonic total observation deadline governs the complete proof.
30. Every bounded callback/operation is capped by the lesser of its per-operation bound and remaining global budget.
31. `ctr` timeout/cancellation/deadline failure performs TERM, bounded grace, KILL if still live, and mandatory child reap before failure returns.
32. Late/partial ctr output after failure is discarded and cannot become evidence.
33. The canonical source record binds all identity-bearing physical facts and is deterministically serialized.
34. The durable source-lineage acknowledgment is identity-validated before successful return.
35. A post-ack global-deadline check runs before the success receipt.
36. Lost acknowledgment cannot create a same-invocation retry or retroactively upgrade failure.
37. A later recovery invocation performs a fresh complete observation and normally yields a distinct occurrence-bound record identity.
38. Exact same-record/same-bytes trusted-store put is idempotent; same identity with conflicting canonical bytes fails closed.
39. R3G-B does not mint final `SandboxBackendObservation` / `SandboxExecutionEvidence`; its record remains the authorized bounded E3 source-lineage evidence only.
40. Generic workspace/K3 policy surfaces gain no R3G-B capability or completion authority.

The theorem proves **immutable OCI image-base lineage**, not immutability of the entire live writable rootfs. A writable overlay upper layer may exist and is explicitly outside the final claim.

---

## 6. Focused hostile and replay proof

The focused R3G-B proof covers, among other cases:

- domain-separated canonical hashing;
- exact ordered DiffID/ChainID semantics including duplicate preservation;
- hostile Proxy/accessor structural rejection before hooks execute;
- root-owned/non-writable ordered path authority;
- ctr and containerd trusted-shape validation;
- wrong ctr uid/gid/mode/hash/identity rejection;
- exact Docker storage/image-rootfs identity re-derivation;
- unsupported storage/image-rootfs topology rejection;
- exact digest-qualified local-image behavior with no remote fallback;
- exact Moby rootfs derivation;
- stored `Spec.root.path` equality;
- malformed/duplicate/invalid-UTF8 ctr JSON rejection;
- exact active/committed snapshot-node parsing;
- bounded direct or canonical-init ancestry only;
- exact overlay mountinfo target, escaping, and ambiguity rejection;
- fixed ctr argv, namespace, snapshotter, container ID, and snapshot-name materialization;
- production gateway success against a root-owned synthetic Linux host with a real Unix socket and real overlay mount;
- exact same-record durable-put idempotency and conflicting-byte rejection;
- lost acknowledgment remains terminal failure;
- no blind same-invocation retry;
- late acknowledgment cannot upgrade the failed invocation;
- later recovery repeats full R3E/R3F/ctr/containerd/rootfs/mount observation;
- fresh `executionAttemptIdentity`, container binding, runtime lineage, and record identity on later recovery;
- stable physical facts remain equal across the two independent observations;
- ctr timeout -> TERM -> child reaped;
- ctr ignores TERM -> KILL -> child reaped;
- cancellation during ctr -> child reaped;
- late partial stdout after timeout -> discarded, no evidence;
- global-deadline expiry during ctr -> child reaped.

---

## 7. Exact pre-ledger CI evidence

Required workflow truth at accepted pre-ledger head `bfb0aba84767e0b16cb8663d1f195a73b549f37f`:

```text
governance
run: 31987035586
conclusion: success

k2-runtime
run: 31987035588
conclusion: success

k3-r4-adapter
run: 31987035605
conclusion: success
```

The K2 runtime workflow completed successfully for:

```text
runtime-change-classifier: PASS
Ubuntu Typecheck: PASS
Ubuntu full Test: PASS
Ubuntu benchmark hook: PASS
macOS Typecheck: PASS
macOS full Test: PASS
macOS benchmark hook: PASS
Windows Typecheck: PASS
Windows full Test: PASS
Windows benchmark hook: PASS
k2-runtime-gate: PASS
```

Ubuntu exact-head runtime summary:

```text
tests: 624
pass: 621
fail: 0
skipped: 3
cancelled: 0
todo: 0
```

The exact Ubuntu log explicitly records PASS for:

```text
H4-R3G-B Linux production gateway proves one exact physical source lineage on a root-owned synthetic host
H4-R3G-B trusted store exact same-record put is idempotent and conflicting bytes fail closed
H4-R3G-B lost acknowledgment remains failed and later invocation performs fresh full observation
H4-R3G-B ctr timeout sends TERM and returns only after the child is reaped
H4-R3G-B ctr that survives TERM is killed and reaped before failure returns
H4-R3G-B cancellation during ctr reaps the child before returning failure
H4-R3G-B late partial ctr stdout after timeout is discarded and cannot become evidence
H4-R3G-B global deadline expiry during ctr reaps the child before returning failure
```

### K3-R5 regression truth

The standalone `k3-r5-context-engine` workflow is path-filtered to K3-R5/context-engine, repository-contract, repository-intelligence, `src/index.ts`, its own test, or workflow changes. None of those paths changes in the accepted R3G-B diff, so a standalone K3-R5 workflow run is not expected for this head.

The canonical K3-R5 workflow's regression command is the same full runtime test suite (`test/*.test.ts`) including `test/k3-r5-context-engine.test.ts`. Those K3-R5 tests are present in and passed by the accepted full runtime suites. This is recorded as a path-filtered non-trigger plus passing in-suite regression, not as an invented standalone workflow PASS.

No failing required workflow remained at the accepted pre-ledger head.

---

## 8. External review and review-thread truth

A fresh CodeRabbit review was explicitly requested while PR `#109` remained Draft.

Exact review range:

```text
base:
61ffbfe4613a4dd05685909999c395a92a581df6

head:
bfb0aba84767e0b16cb8663d1f195a73b549f37f

CodeRabbit status:
SUCCESS
```

CodeRabbit produced one actionable inline thread. It identified a diagnostic-label casing mismatch in two error strings (`Spec.Root.Path` text while the parser correctly consumes `Spec.root.path`). The finding was independently verified as valid **diagnostic wording only**:

```text
parser behavior change: 0
authority change: 0
identity change: 0
evidence change: 0
fail-closed change: 0
success-path change: 0
```

The finding was adjudicated:

```text
VALID / NON-BLOCKING / DEFERRED DIAGNOSTIC CLEANUP
```

Changing production source for wording only would have created a new unreviewed source head after CodeRabbit reported zero additional reviews available in the rolling hour. The reviewed source head was therefore intentionally preserved. The thread was resolved after the adjudication was recorded.

Immediately before ledger transition:

```text
CodeRabbit exact-head status: SUCCESS
unresolved actionable review threads: 0
```

Four CodeRabbit nitpicks were not treated as blocking findings. In particular, wording/constant/typing/test-completeness suggestions were not allowed to churn the protected gateway or widen the authorized theorem without a substantive correctness/security reason.

---

## 9. Manual architecture / trust / security review (§68)

Result:

```text
PASS
```

Every unsafe possibility in canonical §68 was answered **NO**:

```text
NO — caller chooses ctr/containerd/DockerRootDir/snapshot/rootfs authority
NO — mutable name/tag establishes source proof
NO — Container.SnapshotKey establishes Moby lineage
NO — R3E bundle/rootfs becomes Moby rootfs authority
NO — writable/symlink rootfs parent can redirect path
NO — final mount target can be replaced while retained fd remains trusted
NO — ctr bytes can change after hash under modeled attacker without detection
NO — ctr child can outlive timeout/cancellation boundary
NO — complete observation can run without a finite deadline
NO — containerd socket can be swapped by modeled non-root actor without detection
NO — bare socket stat substitutes for protected path authority
NO — arbitrary snapshot ancestry passes
NO — directory existence substitutes for a kernel mount
NO — writable upper layer is mislabeled immutable
NO — mount invisibility downgrades to metadata-only success
NO — identity encoding can vary for the same canonical facts
NO — distinct identity-bearing security facts can reuse one valid recordIdentity
NO — lost acknowledgment can cause a duplicate logical same-invocation record
NO — same recordIdentity can map to different canonical bytes at the trusted-store proof boundary
NO — late completion can upgrade a terminal failed invocation
NO — R3G-B mints final R3B backend observation/evidence
NO — generic workspace/K3 policy gains the R3G-B capability
NO — unsupported storage silently falls back
```

### Manual-review evidence highlights

- authority paths are derived, lstat'd component-by-component, reject symlinks, and are converted to root-owned/non-writable canonical identities;
- `ctr` is opened `O_RDONLY|O_NOFOLLOW`, descriptor/path stat identity is compared, retained bytes are hashed, authority is revalidated, and retained bytes are rehashed before success;
- `ctr` is spawned through a retained descriptor (`/proc/self/fd/3`) rather than a later mutable path lookup;
- rootfs final target is opened `O_RDONLY|O_DIRECTORY|O_NOFOLLOW`, descriptor/path device+inode is bound, and protected parent + object identity are revalidated;
- the containerd socket requires protected parent authority plus exact socket identity/policy and is repeatedly re-observed;
- exact mountinfo evidence is required for one unambiguous `overlay` mount; missing/ambiguous/wrong-fstype mount evidence fails closed;
- R3E subject, R3F binding, Docker source, ctr/containerd, rootfs, spec, ancestry, and mount facts are bracketed/re-observed before record creation;
- the complete operation has one monotonic global deadline and bounded subordinate operations;
- source commit acknowledgment is validated before success and followed by a final deadline check;
- replay proofs preserve occurrence identity and do not use stale attempts to force deduplication.

No manual-review defect remained that invalidates the bounded pre-ledger theorem.

---

## 10. Explicit nonclaims

This evidence does **not** claim:

- the complete live rootfs is immutable or globally read-only;
- an overlay writable upper layer is absent;
- full filesystem byte reconstruction;
- registry, Sigstore, transparency-log, SBOM, or source-code provenance;
- legacy graphdriver lineage;
- host-root compromise resistance;
- physical deny-all network enforcement;
- TTL or output-limit physical enforcement;
- R3G-B creates final R3B physical backend observation/evidence;
- R3G-B proves all sandbox dimensions;
- macOS or Windows physical R3G-B host lineage;
- H4 is complete;
- R3G-C or later H4 slices are authorized;
- PR `#109` is Ready or mergeable solely because this ledger exists;
- the final canonical R3G-B claim is available before ledger-head certification, canonical merge, and post-merge quality.

The only eventual bounded claim authorized by canonical §69 after every remaining gate is:

```text
KODAC_LINUX_GVISOR_IMMUTABLE_OCI_IMAGE_BASE_LINEAGE_PROVEN
```

This ledger does not assert that claim yet.

---

## 11. Ledger transition rule

Canonical §66 permits this ledger only after exact-head pre-ledger PASS and requires it to be the **sole additional path** in one ledger-only commit.

Therefore the transition from accepted pre-ledger head must satisfy:

```text
parent:
bfb0aba84767e0b16cb8663d1f195a73b549f37f

added path only:
docs/planning/KODAC_KDO_H4_R3G_B_IMMUTABLE_SOURCE_ROOTFS_PHYSICAL_LINEAGE_EVIDENCE_2026-08-16.md

production delta:
0

test delta:
0

schema/workflow/dependency delta:
0
```

After this transition, the complete required certification suite must run again on the exact ledger head. If a required workflow is path-filtered and does not automatically run for the docs-only transition, its absence must be recorded truthfully and the canonical repository mechanism must be used where fresh execution is required. A pending, rate-limited, unavailable, stale, or absent external review must never be represented as PASS.

Until fresh post-ledger certification is complete, the only valid state remains:

```text
POST-LEDGER CERTIFICATION PENDING
```
