# KDO-H4-R3G-A — Initial cgroup Namespace Reconciliation

Date: 2026-08-16
Status: RECONCILIATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `4dc2bb5d46ff785e8cc9e1893393fe3a396c7afb`

## 1. Purpose

Close one physical-proof visibility gap discovered during pre-ledger R3G-A implementation before any R3G-A evidence ledger exists.

Linux v6.12 documents that `/proc/<pid>/cgroup` paths are displayed relative to the cgroup namespace root of the caller reading procfs.

Therefore this inference is invalid without an additional trust condition:

```text
/proc/<subject-pid>/cgroup path
+
/sys/fs/cgroup mounted with root=/
=
complete global cgroup hierarchy visible
```

If K2 itself runs inside a non-initial cgroup namespace, ancestors above the namespace root may be hidden. Hidden ancestors may impose stricter CPU/memory/swap controls, which would make the R3G-A exact-effective-limit theorem incomplete.

R3G-A must fail closed rather than silently ignore hidden ancestors.

## 2. Linux basis

Pinned Linux baseline remains:

```text
tag: v6.12
commit: adc218676eef25575469234709c2d87185ca223a
```

The cgroup-v2 documentation states that proc cgroup paths are relative to the cgroup namespace root of the caller.

Linux nsfs exposes generic namespace ioctls including `NS_GET_PARENT`, but the pinned cgroup namespace implementation does not provide a `get_parent` operation in `cgroupns_operations`.

Therefore R3G-A v1 cannot discover a cgroup-namespace parent chain through `NS_GET_PARENT` and must not pretend that ioctl supplies an initial-namespace proof.

Additional pinned files for this reconciliation:

```text
include/uapi/linux/nsfs.h
blob 3c80d0f49e58be81f7b51bf25464f8250047ae79

fs/nsfs.c
blob 6b68e71b0ea01d5db37cd2b51fed72d1f128b90a

kernel/cgroup/namespace.c
blob 144a464e45c66447235b3b265efcd1092f32c2a2
```

No Linux implementation code is copied.

## 3. Canonical correction

R3G-A v1 may succeed only when the K2 process proves that its current cgroup namespace matches one exact trusted namespace identity provisioned as the deployment's initial/full-host cgroup namespace.

Purpose-equivalent trusted identity:

```text
InitialCgroupNamespaceIdentity {
  device: canonical unsigned decimal string
  inode: canonical unsigned decimal string
}
```

The identity is established outside the untrusted/model/plugin request path by trusted host bootstrap/deployment configuration.

The runtime observer does not infer that an arbitrary namespace is initial merely because it has a syntactically valid inode.

## 4. Trust-root meaning

The configured namespace identity is a Trust-Kernel deployment root, analogous in role to other expected trusted artifact/config identities.

The deployment theorem is:

```text
trusted host bootstrap provisions the identity of the intended initial/full-host cgroup namespace
+
K2 verifies its current /proc/self/ns/cgroup object has the exact configured dev+ino
+
K2 verifies canonical cgroup2 mount root=/ at /sys/fs/cgroup
=
R3G-A may treat the visible target-to-root cgroup hierarchy as the complete hierarchy admitted by v1
```

If the configured identity is absent, malformed, or does not match current K2 namespace identity:

```text
R3G-A physical proof = unavailable / fail closed
```

No Docker E2 data substitutes for this failure.

## 5. Runtime config reconciliation

Canonical R3G-A authorization originally allowed only a narrow runtime configuration centered on the durable resource commit callback.

It is reconciled to require exactly:

```text
version
initialCgroupNamespaceIdentity
commitResourceEvidence
```

No other field is admitted.

`initialCgroupNamespaceIdentity` is inert expected identity data. It does not grant caller-selected path, filesystem-reader, command, executable, mountpoint, or helper authority.

The runtime config still MUST NOT contain:

```text
procRoot
cgroupRoot
mountpoint
arbitrary read callback
arbitrary filesystem interface
helper executable
shell
command template
```

## 6. Fixed additional host observation

R3G-A may additionally open exactly:

```text
/proc/self/ns/cgroup
```

and obtain its namespace object metadata using an already-open file descriptor and `fstat`/equivalent Node file-handle stat with exact integer discipline.

The implementation must derive namespace identity from the namespace object itself, not from caller text.

No `/proc/<subject>/ns/*` authority is added.

No namespace mutation, `setns`, `unshare`, ioctl, helper, or namespace traversal is authorized.

## 7. BigInt/integer discipline

Namespace device/inode values are 64-bit kernel metadata and must not be silently rounded through JavaScript floating-point representation.

Production validation must use exact canonical decimal strings and BigInt-capable stat handling where available.

Purpose-equivalent comparison:

```text
observed device decimal == configured device decimal
observed inode decimal == configured inode decimal
```

No Number coercion may turn unequal namespace identities into equality.

## 8. Pre/post namespace bracket

The K2 namespace identity must be checked at least:

```text
before first R3G-A physical cgroup/proc read
and
after final R3G-A physical snapshot read before successful durable resource commit
```

Both observations must exactly equal the trusted configured initial namespace identity.

If the namespace identity changes or cannot be revalidated, no successful R3G-A resource record may be returned or committed.

A retained namespace FD may be held during the observation for identity continuity, but fresh current-process namespace observation is still required to detect a calling-thread namespace change before success.

## 9. Hierarchy completeness consequence

Only after the namespace check succeeds may R3G-A interpret:

```text
/proc/<subject-pid>/cgroup
```

as a path relative to the full admitted cgroup-v2 root and map it to:

```text
/sys/fs/cgroup/<path>
```

under the already-canonical root-controller reconciliation.

Without initial namespace identity proof, effective CPU/memory/swap equality is not established because hidden ancestors remain possible.

## 10. No target namespace equality requirement

R3G-A still does NOT require the gVisor target process to share K2's cgroup namespace.

The physical resource theorem is based on the trusted K2 host view of the exact subject.

When K2 is in the trusted initial/full-host cgroup namespace, `/proc/<subject>/cgroup` exposes the full path needed for host cgroup enforcement observation even if the target itself has a nested cgroup namespace.

No guest-visible cgroup path is accepted as authority.

## 11. Focused hostile coverage

The R3G-A focused suite must additionally prove:

```text
missing initial namespace identity -> fail
malformed decimal device/inode -> fail
Number/float identity input -> fail
current namespace dev mismatch -> fail
current namespace inode mismatch -> fail
namespace mismatch before physical reads -> no physical success
namespace drift between pre/post checks -> no physical success
namespace identity remains stable -> normal theorem may continue
caller cannot inject /proc/self/ns/cgroup path
caller cannot replace namespace reader
```

## 12. Production implementation consequence

Current early PR #102 already contains gateway physical reads but remains pre-ledger and currently lacks this namespace visibility proof.

That current gateway head is therefore NOT eligible for R3G-A evidence-ledger creation.

After this reconciliation is canonical, #102 must:

1. extend only the canonical R3G-A runtime config with trusted namespace dev+ino strings;
2. verify `/proc/self/ns/cgroup` through fixed gateway-owned observation before/after physical cgroup reads;
3. bind the observed/configured namespace identity into the physical snapshot/hierarchy/resource evidence identity;
4. preserve all existing R3E/R3F contracts;
5. keep the same canonical 13-path pre-ledger allowlist.

No evidence ledger may be created from a pre-reconciliation head.

## 13. Generic capability spoofing clarification

The new dedicated capability:

```text
runtime.observe.gvisor.cgroup-v2
```

is Trust-Kernel-owned.

Generic `ExecutionGateway.runCommand(...)` MUST reject this exact capability name so an arbitrary executable cannot emit a receipt under the same capability identity as the dedicated physical observer.

This is a required consequence of the already-canonical dedicated-capability theorem, not authorization for broad `runtime.*` reservation or unrelated generic-command behavior changes.

Focused tests must prove the exact new capability cannot be used through generic `runCommand`.

## 14. Existing authorization otherwise unchanged

This reconciliation does not change:

- Linux/cgroup-v2-only platform floor;
- root controller semantics reconciliation;
- exact R3E subject lineage;
- fixed physical read families other than `/proc/self/ns/cgroup` metadata observation;
- exact rational CPU equality;
- zero CPU burst;
- fair scheduler restriction;
- cpuset/process-affinity theorem;
- exact memory hard ceiling;
- zero swap allowance;
- pre/post physical snapshot stability;
- durable R3E then R3G-A commit ordering;
- E3-only output class;
- prohibition on R3B final observation/evidence minting;
- prohibition on Docker/cgroup/namespace mutation;
- no native helper;
- canonical 13-path pre-ledger implementation allowlist;
- reserved evidence ledger lifecycle.

## 15. Exact reconciliation scope

This reconciliation PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_A_INITIAL_CGROUP_NAMESPACE_RECONCILIATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

## 16. Review gate

Before canonical merge, exact head must prove:

```text
base = 4dc2bb5d46ff785e8cc9e1893393fe3a396c7afb
changed paths = exactly this reconciliation document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2 regression gate = PASS where triggered
available external review = no unresolved actionable finding
reviewer status recorded accurately
manual Linux namespace/trust review = PASS
0 unresolved actionable review threads
```

## 17. Bounded reconciliation claim

If this document becomes canonical:

```text
KODAC_R3G_A_INITIAL_CGROUP_NAMESPACE_VISIBILITY_RECONCILED
```

means only:

> R3G-A may claim exact hierarchy-effective CPU/memory/swap state only when K2's current cgroup namespace object matches one trusted deployment-pinned initial/full-host namespace identity before and after observation; otherwise hidden cgroup ancestors are treated as possible and physical proof fails closed.
