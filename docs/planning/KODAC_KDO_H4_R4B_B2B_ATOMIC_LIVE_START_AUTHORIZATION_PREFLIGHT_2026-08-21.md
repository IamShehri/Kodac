# KODAC KDO H4-R4B-B2B — Atomic Live Start Authorization Preflight

Date: 2026-08-21
Status: **PREFLIGHT CANDIDATE — DOCS ONLY — R4B-B2B REMAINS NOT AUTHORIZED**

## 1. Decision

This document is a **post-B2A authorization preflight only**.

It does not authorize product implementation, Docker start, workload execution, TTL ARM, termination mutation, R3G-F E4 production, permit-consumption completion, H4 completion, H6, or K3-R6+.

The live next gate remains:

```text
KDO-H4-R4B-B2B
ATOMIC LIVE START
+ ACTIVE FAIL-CLOSED CONTINUITY OWNER
+ RUNNING-SUBJECT TTL ARM
+ CONTINUOUS SINGLE-READER OUTPUT
+ TERMINAL FAILURE/CONTAINMENT
+ FINAL R3G-F E4 CONTINUITY
```

but the implementation is still blocked.

Canonical preflight verdict:

```text
R4B_B2A=CLOSED_CANONICAL
R4B_B2B_IMPLEMENTATION=NOT_AUTHORIZED
DOCKER_START=NO
WORKLOAD_EXECUTION=NO
TTL_ARM_BY_B2B=NO
EXACT_SUBJECT_TERMINATION_MUTATION=NO
R3G_F_E4_BY_B2B=NO
H4_COMPLETE=NO
```

The blocking reason is now narrower than the original R4B-B2 readiness audit:

```text
1. no defensible exact numeric full START -> durable ARM bound is yet proven;
2. no separately authorized exact-subject fail-safe containment owner exists for the pre-ARM interval.
```

---

## 2. Exact canonical base

Repository:

```text
TheHalfMoon/Kodac
```

Canonical main at preflight start:

```text
319128860af93582be70353901af3362a66b0018
```

Canonical tree:

```text
3dccd72bcae91be1b337add097a8c37159c8077e
```

Latest canonical merge:

```text
PR #137
feat(kdo): implement H4-R4B-B2A prestart output readiness
merge=319128860af93582be70353901af3362a66b0018
reviewed_head=da32eed6f84c4f99a87427b06adc507641b38c19
```

Canonical R4B-B2 readiness audit:

```text
docs/planning/KODAC_KDO_H4_R4B_B2_START_TTL_OUTPUT_CONTINUITY_READINESS_AUDIT_2026-08-20.md
blob=14991c3b512a49e0ab6c78c5ccbecee732c1e15c
```

Canonical B2A authorization:

```text
docs/planning/KODAC_KDO_H4_R4B_B2A_PRESTART_OUTPUT_OWNERSHIP_START_PREPARATION_AUTHORIZATION_2026-08-20.md
blob=418c73cdac786625dc706f32281791958223449c
```

Canonical B2A runtime:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-prestart-output-runtime.ts
blob=12d7785eb857799d11c6ca07c5fb797efa3b5895
```

Canonical R3G-D trust contract:

```text
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
blob=de0de7a8c9ec1cf4911e60658b82aecda6aa17ae
```

---

## 3. What B2A now proves — and what it still does not prove

Canonical B2A may reach only:

```text
PRESTART_READY
```

The exact live process-local readiness owner binds one exact dormant B1 subject to one pre-opened Docker attach channel and one trusted bounded multiplex reader.

Canonical B2A still proves the absolute negative space:

```text
DOCKER_START_CALLS=0
WORKLOAD_PROCESS_OCCURRENCES=0
RUNNING_SUBJECTS_CREATED_BY_B2A=0
TTL_ARM_ATTEMPTS=0
R3G_F_E4=NO
```

Therefore B2A creates the correct predecessor for B2B but grants no live mutation authority.

A later B2B must consume the exact live `PRESTART_READY` capability without closing, serializing, reconstructing, or reopening the underlying output reader/accumulator.

---

## 4. Canonical R3G-D timing facts inspected

Canonical R3G-D already pins:

```text
KDO_H4_R3G_D_CLOCK_NAME=CLOCK_BOOTTIME
KDO_H4_R3G_D_LIMITS.armAckTimeoutMs=5000
KDO_H4_R3G_D_LIMITS.evidenceCommitTimeoutMs=3000
KDO_H4_R3G_D_LIMITS.ownerLockTimeoutMs=3000
```

The R3G-D physical ARM theorem binds to an already-resolved exact live gVisor subject, including runtime/process/control-endpoint identity.

This distinction is decisive.

The existing `armAckTimeoutMs=5000` bounds only the ARM-acknowledgement sub-operation **after the exact live subject required by R3G-D is available**.

It does not include all future B2B phases:

```text
Docker start dispatch
-> start outcome settlement/reconciliation
-> exact running container observation
-> exact gVisor runtime/process subject resolution
-> exact runtime lineage/control endpoint validation
-> physical watchdog preparation/claim
-> physical ARM acknowledgement
-> durable ARM evidence settlement
```

Therefore:

```text
R3G_D_ARM_ACK_TIMEOUT_MS=5000
DOES_NOT_IMPLY
MAX_START_TO_ARM_INTERVAL_MS=5000
```

Reusing 5000 ms as the full B2B bound without exact-path evidence would violate the canonical readiness audit's prohibition on false precision.

---

## 5. Trusted clock preflight conclusion

The canonical R4B-B2 readiness audit requires an exact trusted clock for the full start-to-ARM interval.

Canonical R3G-D already uses:

```text
CLOCK_BOOTTIME
```

for physical lifecycle lease timing.

This preflight therefore records the only currently compatible B2B clock direction as:

```text
START_TO_ARM_CLOCK_CANDIDATE=CLOCK_BOOTTIME
```

A future B2B authorization should use one clock domain continuously from immediately before the one-shot start dispatch linearization through authoritative durable ARM proof. It must not combine caller timestamps, wall clock, serialized deadlines, `Date.now()`, environment timestamps, or unrelated process-local clocks as authority.

This preflight does **not** itself grant implementation authority for that clock integration.

---

## 6. Deadline-owner preflight conclusion

The canonical readiness theorem forbids:

```text
STARTED + NO ACTIVE OWNER
```

The deadline owner therefore cannot be a new post-start helper discovered after dispatch.

It must be the same exact trusted continuity ownership lineage that already owns the pre-opened output reader before start.

Canonical direction:

```text
PRESTART_READY exact live owner
-> atomic internal B2B ownership transition
-> same logical owner controls:
   - the sole output reader/accumulator
   - one-shot start dispatch
   - full start-to-ARM deadline
   - running-subject resolution
   - TTL ARM
   - failure settlement
   - containment invocation
   - terminal output drain
   - R3G-D/E/F evidence continuity
```

No caller-provided controller, serialized capability, reconstructed capability, second reader, second owner, or background detached task may satisfy this theorem.

This is an architectural constraint only; B2B remains unauthorized.

---

## 7. Numeric full start-to-ARM bound remains unresolved

The canonical readiness audit explicitly refused to invent:

```text
MAX_START_TO_ARM_INTERVAL_MS
```

because no measured exact future B2B path existed.

That remains true after B2A implementation.

No canonical repository evidence reviewed by this preflight supplies measured end-to-end latency for:

```text
start dispatch linearization
-> exact running-subject resolution
-> exact R3G-D physical ARM
-> durable ARM proof
```

Therefore:

```text
MAX_START_TO_ARM_INTERVAL_MS=UNRESOLVED
B2B_NUMERIC_DEADLINE_GATE=BLOCKED
```

A later authorization must not substitute any of the following as the missing evidence:

```text
B2A owner-to-ready timeout
R3F request timeout
R3G-D arm acknowledgement timeout
Docker HTTP request timeout
an arbitrary round number
a developer-machine timing anecdote
one successful CI run
```

The full interval must be justified by separately reviewed evidence for the exact authorized future path and host/runtime theorem.

---

## 8. Measurement remains a separate authority question

Obtaining exact future-path latency empirically would itself require crossing the first live-start boundary.

This preflight authorizes **no such measurement execution**.

```text
DOCKER_START_FOR_MEASUREMENT=NO
WORKLOAD_EXECUTION_FOR_MEASUREMENT=NO
TTL_ARM_FOR_MEASUREMENT=NO
```

Before empirical qualification is ever performed, a separate founder-reviewed authorization must define at least:

```text
exact subject/workload fixture
exact Docker/start path
exact gVisor/runtime pin
exact host/platform scope
exact clock domain
exact measurement interval endpoints
exact sample/qualification method
exact safety margin derivation
exact no-retry/unknown-outcome behavior
exact containment active during every live sample
exact evidence artifact and digest requirements
```

No empirical run may be inferred from this document.

---

## 9. Pre-ARM fail-safe containment remains the second hard blocker

Canonical R3G-D watchdog enforcement protects an exact subject after its physical ARM theorem succeeds.

The future B2B hazard interval is precisely the interval in which:

```text
container may already be running
AND
R3G-D ARM is not yet proven
```

Therefore the existing post-ARM watchdog is not, by itself, sufficient evidence for the required pre-ARM fail-safe consequence.

The canonical readiness audit requires an exact response to:

```text
container started
+
TTL ARM cannot be established before deadline
```

No such new authority is granted here.

Current disposition:

```text
PRE_ARM_FAIL_SAFE_ACTION=UNRESOLVED
PRE_ARM_CONTAINMENT_OWNER=UNRESOLVED
DOCKER_STOP=NO
DOCKER_KILL=NO
DOCKER_REMOVE=NO
DOCKER_RESTART=NO
GENERIC_DOCKER_MUTATION=NO
```

A future solution must be scoped only to the exact admitted occurrence and must not create a generic Docker control surface.

---

## 10. Containment authorization requirements

Before B2B may be authorized, a separate reviewed theorem must pin one exact fail-safe mechanism with all of these properties:

```text
exact admitted container/runtime occurrence only
non-caller-selectable target
non-transferable authority
active before start dispatch
usable on start-to-ARM deadline miss
usable on ARM establishment failure
usable on post-start output-reader loss before safe terminal proof
no generic container selector
no generic Docker path/method
no shell fallback
no Docker CLI fallback
no broad stop/kill/remove surface
bounded acknowledgement
fail-closed uncertainty classification
durable terminal failure evidence
no successful E4 after containment-triggering failure
```

If the fail-safe action itself has unknown outcome, the execution remains failed/indeterminate and non-reusable; it cannot be converted into success.

---

## 11. Continuous output ownership remains mandatory

B2B must preserve the exact B2A reader and accumulator continuously across start.

Required future theorem:

```text
ONE_OUTPUT_OPERATION_IDENTITY
ONE_MAX_OUTPUT_BYTES_BUDGET
ONE_ORDERED_FRAME_PARSER
ONE_SHARED_STDOUT_STDERR_RAW_PAYLOAD_COUNTER
ONE_LOGICAL_READER_OWNER
NO_REOPEN_AFTER_START
NO_SECOND_READER
NO_HISTORY_RECONSTRUCTION
NO_BYTE_GAP
NO_DUPLICATE_BYTE_ACCEPTANCE
NO_REORDERED_EVIDENCE
```

`logs=1` is not an authorized workaround.

If the reader/transport fails after start, B2B must fail terminally and invoke the separately authorized exact-subject containment path; it must not report bounded-output success.

---

## 12. One-shot start theorem remains required

A future B2B authorization must still pin a durable one-shot mutation state machine purpose-equivalent to:

```text
PRESTART_READY (live, sealed)
+ START_PREPARED (historical durable metadata)
-> CONTINUITY_OWNER_ACTIVE
-> START_DISPATCH_CLAIM
-> at most one exact POST /v1.48/containers/{exactId}/start
-> START_DISPATCHED_OR_RECONCILED
```

Rules remain:

```text
PRESTART_READY absent -> NO START
continuity owner inactive -> NO START
numeric deadline unproven -> NO START
containment owner inactive -> NO START
existing start dispatch claim -> inspect/reconcile only
unknown start transport outcome -> never blind retry
caller-selected container ID -> forbidden
caller-selected socket/path/method -> forbidden
```

---

## 13. Permit and final E4 settlement remains post-terminal

A future positive B2B result cannot be defined as merely "Docker start returned success" or "TTL ARM succeeded".

Permit consumption must remain tied to the same exact execution occurrence through terminal evidence.

A future positive chain must remain purpose-equivalent to:

```text
exact B1 admission
-> exact B2A PRESTART_READY owner
-> one-shot B2B start
-> exact running subject
-> exact R3G-D ARM
-> exact R3G-D terminal evidence
-> exact bounded continuous output evidence
-> exact R3G-F A/B/C/D/E conjunction
-> final E4
-> exact permit consumed-by-this-attempt settlement
```

Failure, containment, unknown start outcome, output loss, ARM failure, terminal evidence failure, or E4 failure cannot be promoted to successful permit consumption.

---

## 14. Threat-model additions for later authorization

A later B2B authorization and implementation review must explicitly defend against at least:

- a start sent before the exact B2A reader/owner is live;
- reuse of a stale or forged `PRESTART_READY` shape;
- second start after timeout/disconnect/retry;
- start-to-ARM timing measured from the wrong event;
- use of the 5000 ms R3G-D ARM-ack timeout as an unjustified full interval;
- owner process loss after start but before ARM;
- output reader loss after start;
- container/socket/runtime replacement between B2A readiness and start;
- TTL ARM bound to another process generation;
- deadline expiry with no containment consequence;
- containment against the wrong container/runtime occurrence;
- containment authority escaping into a generic Docker mutation API;
- late ARM success reviving an already-failed/contained execution;
- unknown start outcome causing a blind second start;
- output budget reset/reopen/history reconstruction;
- E4 produced without exact terminal continuity;
- permit reusable after a may-have-started mutation.

---

## 15. Future implementation path allowlist is intentionally not authorized yet

This preflight deliberately does not authorize changes to any runtime/test/schema/package-root path.

In particular, it does not pre-authorize modification of:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-prestart-output-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-ttl-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-output-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-physical-proof-runtime.ts
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
packages/kodac-runtime/src/index.ts
```

The later B2B authorization must pin the smallest exact path allowlist only after the numeric deadline and containment theorem are resolved.

---

## 16. Current blocker matrix

```text
B2A_CANONICAL_PRESTART_READY=YES
SINGLE_PREOPENED_READER=YES_FOR_B2A_SCOPE
B2A_ZERO_START_PROOF=YES

START_TO_ARM_CLOCK_DIRECTION=CLOCK_BOOTTIME_CANDIDATE
FULL_START_TO_ARM_NUMERIC_BOUND=UNRESOLVED
FULL_PATH_MEASUREMENT_EVIDENCE=ABSENT
PRE_ARM_FAIL_SAFE_CONTAINMENT=UNRESOLVED
CONTAINMENT_AUTHORITY=NOT_AUTHORIZED
B2B_IMPLEMENTATION_PATH_ALLOWLIST=NOT_AUTHORIZED

R4B_B2B_AUTHORIZATION=BLOCKED
DOCKER_START=NO
WORKLOAD_EXECUTION=NO
TTL_ARM_BY_B2B=NO
H4_COMPLETE=NO
```

---

## 17. What this docs-only preflight may establish if canonical

If this document becomes canonical, it establishes only these governance facts:

```text
1. B2A is the canonical no-start predecessor for B2B.
2. R3G-D's existing 5000 ms ARM-ack timeout is not the missing full START->ARM bound.
3. CLOCK_BOOTTIME is the compatible canonical clock direction for future B2B review.
4. the same pre-start continuity ownership lineage must own start, deadline, output, ARM and failure handling.
5. existing post-ARM watchdog authority does not solve the pre-ARM containment requirement.
6. numeric bound evidence and exact containment remain hard blockers.
7. no B2B implementation or live qualification authority is granted.
```

Nothing else is inferred.

---

## 18. Merge gate for this preflight PR

This preflight PR may merge only if:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
DOCKER_START_CALLS_INTRODUCED=0
B2B_IMPLEMENTATION=0
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If canonical main moves, the exact base and every conclusion that depends on current B2A/R3G-D code must be reconciled before merge.

---

## 19. Explicit non-grants

Nothing in this document grants:

```text
R4B-B2B product implementation
Docker start
Docker exec
Docker stop
Docker kill
Docker remove
Docker restart
workload/process execution
live qualification execution
TTL ARM authority change
R3G-D authority change
R3G-E authority change
R3G-F authority change
R3G-F ASK
external runCommand ASK
new Docker endpoint authority
new native helper authority
new dependency authority
new daemon/IPC authority
output-history reconstruction
generic containment authority
permit-consumption completion
H4 completion
H6 implementation/readiness
K3-R6+
```

The next live-start authorization remains blocked until both the exact numeric full start-to-ARM bound and the exact pre-ARM fail-safe containment theorem are separately evidenced, pinned, and independently reviewed.
