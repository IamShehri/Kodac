# KDO-H4-R3G-A — Root cgroup Controller Semantics Reconciliation

Date: 2026-08-16
Status: RECONCILIATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `fdedf6df3d779eefca2d5ca274486702b38cbe92`

## 1. Purpose

Correct one Linux cgroup-v2 root-interface inconsistency discovered during early pre-ledger R3G-A implementation before any gateway physical-read integration or evidence ledger exists.

The canonical R3G-A authorization correctly requires a target-to-root hierarchy theorem, but its fixed-read wording can be read as requiring controller files at the root cgroup.

Linux v6.12 documents that these files exist only on non-root cgroups:

```text
cgroup.type
cpu.max
cpu.max.burst
memory.max
memory.swap.max
```

Therefore a literal implementation that reads their root forms, such as:

```text
/sys/fs/cgroup/cgroup.type
/sys/fs/cgroup/cpu.max
/sys/fs/cgroup/memory.max
```

would fail on a conforming cgroup-v2 root and would not implement the intended theorem.

## 2. Kernel basis

Pinned Linux v6.12 documentation states:

```text
cgroup.type:
exists on non-root cgroups

cpu.max:
exists on non-root cgroups

cpu.max.burst:
exists on non-root cgroups

memory.max:
exists on non-root cgroups

memory.swap.max:
exists on non-root cgroups
```

This reconciliation uses the already-pinned Linux semantic baseline and introduces no new dependency or donor code.

## 3. Canonical root correction

R3G-A v1 must use these semantics:

```text
NON-ROOT TARGET:
physical controller evidence begins here
cgroup.type must be exactly domain

EVERY NON-ROOT ANCESTOR BETWEEN TARGET AND ROOT:
controller-limit evidence is observed here
cgroup.type must be exactly domain

ROOT CGROUP /:
mount-boundary sentinel only
no cgroup.type read
no cpu.max read
no cpu.max.burst read
no memory.max read
no memory.swap.max read
```

The root sentinel represents the validated cgroup2 mount boundary. It is not a fabricated controller-level observation.

## 4. Exact physical hierarchy for controller limits

The controller hierarchy used for exact physical CPU/memory/swap limit calculation is:

```text
target non-root cgroup
->
zero or more non-root ancestors
->
STOP BEFORE /
```

The validated root mount remains part of the overall cgroup subject identity and path-containment theorem, but it is not a limit-bearing controller level.

Thus effective finite values are computed across all observed non-root controller levels only.

## 5. Exact host-read correction

The authorized fixed read family is reconciled to:

```text
/proc/self/mountinfo
/proc/<R3E-state-pid>/stat
/proc/<R3E-state-pid>/status
/proc/<R3E-state-pid>/cgroup

for target and every non-root ancestor:
  cgroup.type
  cpu.max
  cpu.max.burst
  cpuset.cpus.effective
  memory.max
  memory.swap.max

for target only:
  cgroup.procs
```

No controller file is read from the cgroup-v2 root.

No new host read family is added.

## 6. cpuset semantics

R3G-A may retain `cpuset.cpus.effective` observations on each observed non-root level, but the target value already represents the kernel's effective cpuset after ancestor restrictions.

The implementation may conservatively intersect the non-root observed effective sets as defense in depth, provided the result cannot make a wider set than the target's own `cpuset.cpus.effective`.

The root cpuset file is not required for the R3G-A theorem.

Process-level `Cpus_allowed_list` remains independently intersected with the cgroup cpuset theorem.

## 7. Why non-root ancestors must remain domain

R3G-A v1 deliberately excludes threaded/domain-threaded semantics.

A non-root ancestor in a threaded configuration can change membership/control interpretation and invalidate the simple process-domain hierarchy theorem.

Therefore every observed non-root controller level in the target-to-root chain must remain:

```text
cgroup.type == domain
```

The root has no `cgroup.type` evidence and is accepted only through the canonical cgroup2 mount theorem.

## 8. Normalized representation

A normalized R3G-A controller-level record contains only non-root levels.

The root MUST NOT be inserted into the controller-level array with invented fields such as:

```text
cgroupType: root
cpu.max: max
memory.max: max
```

Instead the root is represented separately by the already-authorized mount identity and by the fact that canonical non-root parent traversal terminates at `/`.

This keeps “absence of root controller files” distinct from “controller value = unlimited.”

## 9. Hierarchy identity

R3G-A hierarchy identity must bind both:

```text
validated cgroup2 mount identity
+
ordered non-root controller-level identities
```

so that the root boundary remains part of the physical theorem without fabricating a root controller observation.

The exact snapshot identity must also bind the normalized target cgroup path.

## 10. Effective CPU correction

The effective cgroup CPU bandwidth ratio is the minimum finite `cpu.max` ratio across the complete ordered set of non-root controller levels.

If no non-root level provides a finite CPU limit:

```text
R3G-A CPU proof = unavailable
```

The absence of a root `cpu.max` is normal and must not itself be treated as an error or as an implicit finite/unlimited controller record.

All observed non-root `cpu.max.burst` values must still be exactly zero.

## 11. Effective memory correction

The effective cgroup memory hard ceiling is the minimum finite `memory.max` across all observed non-root controller levels.

If no non-root level provides a finite memory limit:

```text
R3G-A memory proof = unavailable
```

The absence of root `memory.max` is normal.

## 12. Effective swap correction

The effective cgroup swap hard ceiling is the minimum finite `memory.swap.max` across all observed non-root controller levels.

For the R3G-A no-swap theorem the effective result must still be exactly:

```text
0
```

The absence of root `memory.swap.max` is normal.

## 13. Target-root edge case

R3G-A v1 requires the observed subject to be in a non-root cgroup.

If `/proc/<pid>/cgroup` resolves the exact R3E subject directly to:

```text
0::/
```

there is no non-root controller level on which the authorized CPU/memory/swap hard-limit theorem can be established.

Therefore:

```text
target cgroup path = /
-> fail closed / proof unavailable
```

No host-global capacity value substitutes for the missing cgroup controller theorem.

## 14. Focused hostile coverage

The focused R3G-A test must prove at minimum:

```text
valid non-root target hierarchy succeeds without any root controller file
single non-root target directly below root succeeds when limits are exact
multiple non-root ancestors are incorporated into effective-limit calculation
non-root threaded fails
non-root domain-threaded fails
target path / fails closed
missing non-root controller level fails closed
fixture cannot add a fabricated root controller level
fixture cannot omit a required non-root ancestor
finite/non-finite controller effective calculations remain exact after root removal
```

## 15. Current early implementation consequence

Current early pre-ledger PR #102 contains only the new pure R3G-A module and no gateway physical reads.

Its current implementation includes `/` as a synthetic controller level and requires `cgroup.type=domain` plus CPU/memory/swap files there.

That behavior is not accepted as final implementation behavior.

After this reconciliation is canonical, PR #102 must correct the pure module so that:

```text
controller levels = non-root target through non-root ancestors only
root = mount/path boundary only
```

before gateway integration and before final pre-ledger certification.

No evidence ledger may be created from any pre-reconciliation head.

## 16. Existing authorization otherwise unchanged

This reconciliation does not change:

- Linux/cgroup-v2-only platform floor;
- canonical `/sys/fs/cgroup` mount theorem;
- exact PID/startTicks binding;
- fair scheduler restriction;
- exact rational CPU equality;
- zero CPU burst;
- cpuset/process-affinity theorem;
- exact memory hard ceiling;
- zero swap allowance;
- pre/post physical snapshot stability;
- durable R3E then R3G-A commit ordering;
- E3-only output class;
- prohibition on R3B final observation/evidence minting;
- prohibition on Docker/cgroup mutation;
- 13-path pre-ledger implementation allowlist;
- reserved evidence ledger lifecycle.

## 17. Exact reconciliation scope

This reconciliation PR may add exactly one path:

```text
docs/planning/KODAC_KDO_H4_R3G_A_ROOT_CGROUP_TYPE_RECONCILIATION_2026-08-16.md
```

Production/test/schema/workflow/dependency delta:

```text
0
```

## 18. Review gate

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

## 19. Bounded reconciliation claim

If this document becomes canonical:

```text
KODAC_R3G_A_ROOT_CONTROLLER_SEMANTICS_RECONCILED
```

means only:

> R3G-A computes exact cgroup-v2 CPU, memory and swap controller limits across the complete non-root target/ancestor chain, while the cgroup-v2 root remains a validated mount boundary and never receives fabricated or nonexistent root controller-file observations.
