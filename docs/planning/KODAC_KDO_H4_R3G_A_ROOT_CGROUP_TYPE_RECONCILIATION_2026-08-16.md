# KDO-H4-R3G-A — Root cgroup.type Reconciliation

Date: 2026-08-16
Status: RECONCILIATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `fdedf6df3d779eefca2d5ca274486702b38cbe92`

## 1. Purpose

Correct one Linux cgroup-v2 interface inconsistency discovered during early pre-ledger R3G-A implementation before any gateway physical-read integration or evidence ledger exists.

The canonical R3G-A authorization contains both of these ideas:

```text
read cgroup.type across target/ancestor hierarchy
```

and later:

```text
target cgroup must be a domain cgroup
```

Linux v6.12 documentation makes the root distinction explicit:

```text
cgroup.type exists on non-root cgroups
```

Therefore a literal attempt to read:

```text
/sys/fs/cgroup/cgroup.type
```

at the canonical root is invalid on a conforming cgroup-v2 filesystem.

## 2. Canonical correction

R3G-A v1 must use these semantics:

```text
TARGET NON-ROOT CGROUP:
cgroup.type must be exactly domain

EVERY NON-ROOT ANCESTOR BETWEEN TARGET AND ROOT:
cgroup.type must be exactly domain

ROOT CGROUP /:
no cgroup.type read
root is represented by an internal canonical root sentinel only
```

The root sentinel is structural metadata, not kernel evidence pretending that a missing `cgroup.type` file returned `domain`.

## 3. Exact host-read correction

The authorized fixed read family becomes:

```text
/proc/self/mountinfo
/proc/<R3E-state-pid>/stat
/proc/<R3E-state-pid>/status
/proc/<R3E-state-pid>/cgroup

for target and every non-root ancestor:
  cgroup.type

for target and every ancestor INCLUDING root:
  cpu.max
  cpu.max.burst
  cpuset.cpus.effective
  memory.max
  memory.swap.max

for target only:
  cgroup.procs
```

No new read family is added.

## 4. Why non-root ancestors must also be domain

R3G-A v1 deliberately excludes threaded/domain-threaded semantics. A non-root ancestor in a threaded configuration can change membership/control interpretation and invalidate the simple domain hierarchy theorem.

Therefore every observed non-root level in the target-to-root chain must remain:

```text
cgroup.type == domain
```

The root has no `cgroup.type` file and is accepted only through the already-authorized canonical cgroup2 mount theorem.

## 5. Pure-record representation

A normalized R3G-A hierarchy level may represent the root with a fixed internal discriminator purpose-equivalent to:

```text
cgroupType: root
```

and non-root levels only as:

```text
cgroupType: domain
```

This discriminator must be derived from canonical path equality with `/`; callers cannot choose it independently.

It must not be interpreted as raw kernel file content for root.

## 6. Focused hostile coverage

The focused R3G-A test must additionally prove:

```text
root snapshot succeeds without a root cgroup.type read
non-root domain succeeds
non-root threaded fails
non-root domain-threaded fails
caller/raw fixture cannot mark a non-root level as root
caller/raw fixture cannot mark root as domain file evidence when the production reader never reads that file
```

## 7. Existing authorization otherwise unchanged

This reconciliation does not change:

- Linux/cgroup-v2-only platform floor;
- canonical `/sys/fs/cgroup` mount root theorem;
- exact PID/startTicks binding;
- CPU effective-ratio theorem;
- zero CPU burst;
- fair scheduler restriction;
- cpuset/process-affinity theorem;
- exact memory hard ceiling;
- zero swap allowance;
- pre/post snapshot stability;
- durable R3E then durable R3G-A commit ordering;
- E3-only output class;
- prohibition on R3B final observation/evidence minting;
- prohibition on Docker/cgroup mutation;
- 13-path pre-ledger implementation allowlist;
- reserved evidence ledger lifecycle.

## 8. Current early implementation consequence

The current early pre-ledger PR #102 already contains only the new pure R3G-A module and no gateway physical reads.

Its current parser requiring `cgroup.type=domain` at the root is not accepted as final implementation behavior.

After this reconciliation is canonical, PR #102 must incorporate the correction within its already-authorized new pure module before any final pre-ledger certification.

No evidence ledger may be created from the pre-reconciliation implementation head.

## 9. Exact reconciliation scope

This reconciliation PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_A_ROOT_CGROUP_TYPE_RECONCILIATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

## 10. Review gate

Before canonical merge, exact head must prove:

```text
base = fdedf6df3d779eefca2d5ca274486702b38cbe92
changed paths = exactly this reconciliation document
production/test/schema/workflow/dependency delta = 0
governance/provenance/legacy = PASS where triggered
K2 regression gate = PASS where triggered
available external review = no unresolved actionable finding
reviewer status recorded accurately
manual kernel/trust review = PASS
0 unresolved actionable review threads
```

## 11. Bounded reconciliation claim

If this document becomes canonical:

```text
KODAC_R3G_A_ROOT_CGROUP_TYPE_SEMANTICS_RECONCILED
```

means only:

> R3G-A's domain-cgroup theorem applies to every non-root cgroup in the exact target hierarchy, while the cgroup-v2 root is validated through the canonical mount theorem and never requires a nonexistent root `cgroup.type` file.
