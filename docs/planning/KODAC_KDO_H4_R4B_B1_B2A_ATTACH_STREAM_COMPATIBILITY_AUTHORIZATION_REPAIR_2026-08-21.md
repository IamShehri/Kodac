# KODAC KDO H4-R4B-B1/B2A — Attach-Stream Compatibility Authorization Repair

Date: 2026-08-21 (Asia/Riyadh canonical working date; GitHub mutation may appear as 2026-08-20 UTC)
Status: **AUTHORIZATION REPAIR CANDIDATE — DOCS ONLY — B2A IMPLEMENTATION STOPPED**

## 1. Decision

This document records and repairs one load-bearing incompatibility discovered only after canonical H4-R4B-B2A implementation authorization was exercised against live source truth.

The current decision is:

```text
B2A_IMPLEMENTATION=STOPPED
CURRENT_B2A_EXPERIMENTAL_BRANCH=NONCANONICAL_DO_NOT_MERGE
B1_ATTACH_STREAM_COMPATIBILITY_REPAIR=AUTHORIZED_ONLY_AFTER_THIS_DOC_BECOMES_CANONICAL
B2A_RESUME=FORBIDDEN_UNTIL_B1_REPAIR_IS_MERGED_CANONICAL_PROVEN
```

This document does not implement B1 or B2A. It authorizes exactly one narrow subsequent B1 compatibility PR so the already-canonical B2A pristine-lineage theorem can become satisfiable.

No Docker start, workload execution, TTL ARM, output completion, termination mutation, H4 completion, H6, or K3-R6+ authority is granted.

---

## 2. Canonical base

This authorization repair is based on exact live canonical truth:

```text
repository=TheHalfMoon/Kodac
canonical_main=806d584348e4e9ed4204563589c4ed24986e9f9b
canonical_tree=8543d1b97badc3c3855bda94874c56e36a4c9742
PR_134=MERGED_CANONICAL_PROVEN
```

Relevant canonical predecessors:

```text
PR_130=R4B-B1_DORMANT_DOCKER_CREATE_ADMISSION / MERGED_CANONICAL_PROVEN
PR_133=R4B-B2A_PRESTART_OUTPUT_OWNERSHIP_AUTHORIZATION / MERGED_CANONICAL_PROVEN
PR_134=R4B-B2A_POSIX_ACL_AUTHORIZATION_REPAIR / MERGED_CANONICAL_PROVEN
```

Canonical B1 runtime source:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
blob=a917577d154ed14d7fd0528a69242846c53a7af3
```

Canonical B1 test:

```text
packages/kodac-runtime/test/kdo-h4-r4b-b1-dormant-docker-create-admission.test.ts
blob=f3e8cb1203d9dc9705e165bf9347c562afd8cf43
```

Canonical B2A authorization:

```text
docs/planning/KODAC_KDO_H4_R4B_B2A_PRESTART_OUTPUT_OWNERSHIP_START_PREPARATION_AUTHORIZATION_2026-08-20.md
blob=418c73cdac786625dc706f32281791958223449c
```

Docker contracts remain pinned to:

```text
Docker API=1.48
Moby source commit=d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
```

---

## 3. The contradiction

### 3.1 Canonical B2A requirement

Canonical PR #133 Section 5 requires every exact B1 subject admitted into B2A to reobserve, among other pristine-dormant invariants:

```text
attach_stdout=true
attach_stderr=true
attach_stdin=false
open_stdin=false
running=false
pid=0
restart_count=0
```

B2A is explicitly forbidden from repairing drift.

Therefore `AttachStdout=true` and `AttachStderr=true` are mandatory B1/B2A lineage facts, not optional implementation preferences.

### 3.2 Canonical B1 create request

The canonical B1 `dockerCreatePayload(...)` currently sends:

```text
AttachStdin=false
Tty=false
OpenStdin=false
StdinOnce=false
```

but does not send:

```text
AttachStdout
AttachStderr
```

The canonical B1 Docker inspect proof also does not require either field to equal `true` before creating the durable B1 CREATED admission.

### 3.3 Pinned Moby behavior

At pinned Moby commit `d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3`, `postContainersCreate` decodes the body through:

```text
runconfig.DecodeCreateRequest(...)
```

and `daemon/internal/runconfig/config.go::decodeCreateRequest` sets defaults for fields such as:

```text
Config.Volumes
HostConfig
HostConfig.PortBindings
NetworkMode
NetworkingConfig
NetworkingConfig.EndpointsConfig
```

It does not set `Config.AttachStdout` or `Config.AttachStderr`.

Those fields are Go booleans. When omitted from the JSON request they remain the zero value:

```text
AttachStdout=false
AttachStderr=false
```

No canonical repository or pinned-daemon evidence supports treating omission as `true`.

### 3.4 Consequence

The exact positive-path contradiction is therefore:

```text
CANONICAL_B1_CREATE_PAYLOAD_OMITS_ATTACH_STDOUT=YES
CANONICAL_B1_CREATE_PAYLOAD_OMITS_ATTACH_STDERR=YES
PINNED_MOBY_DAEMON_DEFAULTS_ATTACH_STDOUT_TO_TRUE=NO
PINNED_MOBY_DAEMON_DEFAULTS_ATTACH_STDERR_TO_TRUE=NO
CANONICAL_B2A_REQUIRES_ATTACH_STDOUT_TRUE=YES
CANONICAL_B2A_REQUIRES_ATTACH_STDERR_TRUE=YES
B2A_MAY_REPAIR_B1_DRIFT=NO
```

Therefore, without a prerequisite B1 repair:

```text
B2A_POSITIVE_PATH_REACHABLE=NO
PRESTART_READY_PROVABLE=NO
```

Continuing B2A implementation under the existing path set would violate the canonical STOP/return-to-authorization rule.

---

## 4. Why the repair belongs in B1

This repair must not weaken B2A by deleting the two required pristine-lineage checks.

B2A attaches before start specifically so one trusted bounded reader owns both process output streams before any workload byte can exist. The correct upstream contract is therefore that B1 creates the dormant container with both output streams attachable and proves that configuration during its exact inspect admission.

The narrow repair is:

```text
B1_CREATE_REQUEST_ATTACH_STDOUT=true
B1_CREATE_REQUEST_ATTACH_STDERR=true
B1_INSPECT_REQUIRES_ATTACH_STDOUT=true
B1_INSPECT_REQUIRES_ATTACH_STDERR=true
B1_INSPECT_REQUIRES_ATTACH_STDIN=false
B1_INSPECT_REQUIRES_OPEN_STDIN=false
```

This changes no start behavior. The container remains created, never-started, `pid=0`, `restartCount=0`, `tty=false`, `runsc`, `network=none`, and otherwise subject to the full canonical B1 admission theorem.

---

## 5. Exactly authorized subsequent implementation PR

Only after this authorization repair itself is merged and proven canonical, exactly one bounded B1 compatibility implementation PR is authorized.

### 5.1 Authorized path set

The subsequent implementation PR may modify exactly these purpose-equivalent paths and no others:

```text
M packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
M packages/kodac-runtime/test/kdo-h4-r4b-b1-dormant-docker-create-admission.test.ts
```

No B1 trust-contract file, schema, package root, dependency, workflow, policy, permit, R3G-E, R3G-F, TTL, or B2A runtime file is authorized by this repair.

If implementation proves that either additional production path is required, STOP and return to authorization again.

### 5.2 Required production delta

The B1 create payload must explicitly and unconditionally include:

```json
{
  "AttachStdout": true,
  "AttachStderr": true
}
```

These are fixed internal constants. They are not caller arguments, environment settings, serialized authority, or configuration knobs.

The exact B1 post-create/recovery Docker inspect admission must require:

```text
Config.AttachStdout === true
Config.AttachStderr === true
Config.AttachStdin === false
Config.OpenStdin === false
```

A false, absent, malformed, or non-boolean value for either output flag must fail closed and must not produce/recover a positive B1 CREATED admission.

B1 must not mutate an existing incompatible container to repair these flags.

### 5.3 Existing pre-repair B1 subjects

A container or durable B1 record created before the canonical B1 compatibility repair does not become B2A-eligible merely because its lineage identities otherwise match.

Required rule:

```text
PRE_REPAIR_CONTAINER_WITH_ATTACH_STDOUT_FALSE=NOT_B2A_ELIGIBLE
PRE_REPAIR_CONTAINER_WITH_ATTACH_STDERR_FALSE=NOT_B2A_ELIGIBLE
IN_PLACE_CONTAINER_REPAIR=NO
RECREATE_BY_B2A=NO
```

If a future execution reaches a pre-repair incompatible dormant container, it must fail closed according to the existing B1/B2A semantics. This repair grants no cleanup, remove, recreate, start, or takeover authority.

---

## 6. Required tests for the B1 compatibility PR

The subsequent B1 repair PR must prove at minimum:

```text
CREATE_PAYLOAD_ATTACH_STDOUT_TRUE=PASS
CREATE_PAYLOAD_ATTACH_STDERR_TRUE=PASS
CREATE_PAYLOAD_ATTACH_STDIN_FALSE=PASS
CREATE_PAYLOAD_OPEN_STDIN_FALSE=PASS
INSPECT_ATTACH_STDOUT_TRUE=PASS
INSPECT_ATTACH_STDERR_TRUE=PASS
INSPECT_ATTACH_STDIN_FALSE=PASS
INSPECT_OPEN_STDIN_FALSE=PASS
FALSE_ATTACH_STDOUT_REJECTED=PASS
FALSE_ATTACH_STDERR_REJECTED=PASS
MISSING_ATTACH_STDOUT_REJECTED=PASS
MISSING_ATTACH_STDERR_REJECTED=PASS
NON_BOOLEAN_ATTACH_STDOUT_REJECTED=PASS
NON_BOOLEAN_ATTACH_STDERR_REJECTED=PASS
DORMANT_STATE_UNCHANGED=PASS
DOCKER_START_CALLS=0
WORKLOAD_PROCESS_OCCURRENCES=0
TTL_ARM_ATTEMPTS=0
```

The existing B1 tests for exact image identity, runsc, network-none, labels, resources, no unadmitted host authority, reconciliation, crash handling, and durable admission must continue to pass unchanged in meaning.

---

## 7. B2A experimental work discovered during the STOP

A noncanonical exploratory branch was created before this contradiction was proven:

```text
branch=feat/kdo-h4-r4b-b2a-prestart-output-readiness
base=806d584348e4e9ed4204563589c4ed24986e9f9b
```

It contains unreviewed implementation experiments and is not an authorized merge candidate.

Normative status:

```text
EXPERIMENTAL_BRANCH_CANONICAL=NO
EXPERIMENTAL_BRANCH_MERGE_AUTHORITY=NO
EXPERIMENTAL_BRANCH_REUSE_AFTER_B1_REPAIR=NO
EXPERIMENTAL_COMMITS_EVIDENCE_ONLY=YES
```

After the B1 compatibility repair becomes canonical, any B2A implementation must start from the then-current canonical `main` on a fresh branch and re-derive all implementation decisions from live repository truth.

No commit from the experimental branch may be cherry-picked or treated as reviewed implementation evidence without a fresh explicit authorization that says otherwise.

---

## 8. Relationship to PR #133 and PR #134

This document does not supersede the B2A security model.

PR #133 remains normative for B2A except where PR #134 already superseded its ACL clauses.

This document repairs only the missing predecessor property required to make PR #133 Section 5 satisfiable:

```text
B1_CREATE_AND_INSPECT_ATTACH_STDOUT_TRUE
B1_CREATE_AND_INSPECT_ATTACH_STDERR_TRUE
```

It does not weaken or remove any B2A condition.

PR #134 POSIX ACL effective-rights repair remains fully normative and unchanged.

---

## 9. Explicit non-grants

This authorization repair does not grant:

```text
B2A implementation in this docs PR
B2A implementation before the B1 compatibility patch is canonical
reuse or merge of the existing experimental B2A branch
R4B-B2B
Docker start
Docker exec
Docker restart
Docker stop
Docker kill
Docker remove
workload execution
TTL ARM
termination/containment mutation
rootless Docker
0660 root:docker socket support
non-root Docker client
runtime ACL enumeration
runtime ACL mutation
getfacl/setfacl in product runtime
new package dependency
workflow changes
new native helper
liveness/lease/heartbeat
takeover/recovery
R3G-F E4
H4 completion
H6
K3-R6+
```

The absolute negative-space theorem remains:

```text
DOCKER_START_CALLS=0
WORKLOAD_PROCESS_OCCURRENCES=0
RUNNING_SUBJECTS_CREATED_BY_THIS_REPAIR=0
TTL_ARM_ATTEMPTS=0
R3G_F_E4=NO
H4_COMPLETE=NO
```

---

## 10. Merge gate for this authorization-repair document

This docs-only authorization repair may merge only if all are true on one exact final head:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
CANONICAL_MAIN_UNMOVED_OR_EXACTLY_RECONCILED=PASS
CANONICAL_B1_PAYLOAD_REVIEW=PASS
PINNED_MOBY_DECODE_DEFAULTS_REVIEW=PASS
B2A_SECTION_5_CONTRADICTION_REVIEW=PASS
REPAIR_SCOPE_TWO_PATHS_ONLY=PASS
EXPERIMENTAL_B2A_BRANCH_QUARANTINE_REVIEW=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE=PASS
```

If any review finds that explicit B1 `AttachStdout=true` / `AttachStderr=true` is insufficient to establish the required pre-start stream semantics under the pinned Docker API/Moby behavior, this document must not be used to authorize implementation until that finding is reconciled.

---

## 11. State after canonical merge

If and only if this document becomes canonical:

```text
B1_ATTACH_STREAM_COMPATIBILITY_PATCH=AUTHORIZED_TO_START
B2A_IMPLEMENTATION=STILL_STOPPED
```

If and only if the separately authorized B1 compatibility patch later becomes merged/canonical/proven with all required tests:

```text
B1_ATTACH_STREAM_COMPATIBILITY=CANONICAL_PROVEN
B2A_IMPLEMENTATION=MAY_RESTART_FROM_THEN_CURRENT_CANONICAL_MAIN
OLD_EXPERIMENTAL_B2A_BRANCH=NOT_REUSABLE
```

B2A must then begin again from exact live canonical truth. No later-slice authority follows automatically.
