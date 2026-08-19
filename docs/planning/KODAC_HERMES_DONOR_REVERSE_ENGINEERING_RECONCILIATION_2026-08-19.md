# Kodac Hermes Donor Reverse-Engineering Reconciliation

Status: **CANONICAL_REVIEW_CANDIDATE / DOCS ONLY / NO IMPLEMENTATION AUTHORIZATION**  
Date: 2026-08-19  
Repository: `TheHalfMoon/Kodac`  
Planning PR: `#121`  
Canonical Kodac base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
PR #121 pre-reconciliation head: `4d22b3a8ab51171887472f22f53480f883fa47b2`

---

## 0. Purpose and authority

This document reconciles the founder-supplied Hermes donor reverse-engineering report against:

- live Kodac repository truth;
- the existing PR #121 master architecture plan;
- the PR #121 source-level donor reverse-engineering report;
- the PR #121 Cyber/analyzer supplement;
- canonical H4/K2 trust requirements;
- independently re-read donor source at exact historical research pins where a Hermes claim materially changes the acquisition plan.

The Hermes raw report is useful research input, but it is **not canonical authority**.

Repository source, accepted ADRs, canonical H4/K2 evidence, exact donor source, and exact-head review evidence outrank the raw report.

This document does **not**:

- authorize donor-code intake;
- copy donor code into Kodac;
- add a dependency;
- start H4-R3G-F or later H4;
- start H6;
- implement the Cyber Mesh;
- change K2, KRI, evidence, validator, adjudication, or Done Gate semantics;
- authorize an optional sandbox provider;
- authorize a blocking review gate;
- authorize merge of PR #121.

---

# 1. Executive reconciliation

Hermes added real value, especially by inspecting donor snapshots that had moved after the earlier research pass.

The raw report is nevertheless **partial and not safe to preserve as canonical truth without correction**.

Final disposition:

```text
HERMES_RAW_REPORT
= NON_CANONICAL_PARTIAL_RESEARCH_ARTIFACT

USE
= verified source-level deltas only

DO_NOT_USE
= unverified summaries, incorrect license/provenance entries,
  hypothetical reviewer findings mislabeled as confirmed,
  or incomplete final sections
```

The verified Hermes delta strengthens the existing Kodac architecture rather than replacing it.

The two most useful new implementation observations are:

```text
OpenSandbox
→ fail-closed pre-execution workload identity / release gate

Cline
→ process-generation identity that distinguishes PID existence from
  exact process generation and distinguishes MISSING from PROBE_UNAVAILABLE
```

These yield two new planning invariants:

```text
PRE_EXECUTION_IDENTITY_BEFORE_RELEASE

PROCESS_EXISTENCE != PROCESS_GENERATION_IDENTITY
```

Neither invariant weakens K2 or H4.

---

# 2. Snapshot discipline: Hermes pins are historical research identities

Donor repositories move quickly.

Therefore this reconciliation distinguishes:

```text
HERMES_RESEARCH_PIN
CURRENT_LIVE_HEAD_AT_RECONCILIATION
FUTURE_INTAKE_PIN
```

They are not interchangeable.

## 2.1 Cline

Hermes inspected:

```text
repository = cline/cline
hermesResearchPin = 61b95a62eed64180f56aa443c629741083927d57
```

At reconciliation time, live `main` had already moved beyond that snapshot.

The exact Hermes pin remains useful for source citations and acquisition analysis, but it is classified as:

```text
HISTORICAL_RESEARCH_SNAPSHOT
```

Any future code intake must re-pin selected Cline source and rerun provenance, dependency, test, and trust-boundary checks.

## 2.2 OpenSandbox

Hermes inspected:

```text
repository = opensandbox-group/OpenSandbox
hermesResearchPin = 28984f714f44c934bab90e10827e2bdd3eb77b4a
```

That repository also moved again during reconciliation.

The Hermes pin is therefore classified as:

```text
HISTORICAL_RESEARCH_SNAPSHOT
```

It does not supersede the earlier PR #121 source-pin corrections as a permanent current identity.

The governing source rule remains:

```text
DONOR_NAME != SOURCE_IDENTITY

SOURCE_IDENTITY =
  repository
  + exact commit/tag
  + selected paths/symbols
  + selected file digests
  + dependency/provenance boundary
```

---

# 3. ACCEPT — OpenSandbox fail-closed pre-execution lifecycle pattern

Hermes correctly identified a high-value implementation boundary in:

```text
repository:
opensandbox-group/OpenSandbox

research pin:
28984f714f44c934bab90e10827e2bdd3eb77b4a

path:
components/execd/pkg/isolation/isolator.go
```

The source defines:

```text
Isolator
LifecycleIsolator
WorkloadLifecycle
WorkloadIdentity
WrapOptions
Capabilities
```

`WorkloadIdentity` includes host-visible identity material:

```text
PID
SandboxPID
NetNamespaceID
ProcessStartTimeTicks
```

The source explicitly states that the workload is fully constructed but remains blocked behind a fail-closed ready gate.

`WorkloadLifecycle` exposes:

```text
WaitForIdentity(ctx)
MarkReady()
Abort()
DrainDone()
DrainError()
ExitCode()
Close()
```

Important semantics:

```text
WaitForIdentity
→ authenticate lifecycle/status channel
→ return host-visible workload identity

context cancellation
→ abort startup
→ never release workload

MarkReady
→ release execution only after successful identity observation

Abort
→ permanently deny startup

DrainError after release
→ lifecycle identity / exit accounting is no longer trusted
```

This is a strong donor pattern.

## 3.1 Kodac acquisition decision

Accept conceptually and consider future bounded adaptation for:

```text
SandboxProvider pre-execution admission
```

Recommended future shape:

```text
provider constructs workload
        ↓
workload remains blocked
        ↓
provider returns exact candidate WorkloadIdentity
        ↓
K2 validates exact subject + provider qualification + policy
        ↓
K2 installs required confinement/resource/network/evidence bindings
        ↓
ONLY THEN authorize release
        ↓
provider MarkReady-equivalent
```

This becomes the invariant:

```text
PRE_EXECUTION_IDENTITY_BEFORE_RELEASE
```

## 3.2 What is not accepted

Do **not** transplant OpenSandbox lifecycle semantics as a replacement for canonical H4-R3G-D.

OpenSandbox's workload startup gate is useful, but it does not by itself establish Kodac's complete TTL theorem.

It does not replace requirements such as:

```text
K2-derived stable arm operation identity
durable PREPARED intent before physical arm
durable lifecycle obligation before positive arm ACK
retained exact-instance proof channel
immutable qualified monotonic deadline
restart reconciliation
unknown-commit reconciliation
single-writer terminal winner
positive exact-subject terminal acknowledgement
durable terminal proof record
validated durable commit acknowledgement
```

Therefore:

```text
OpenSandbox WorkloadLifecycle
→ ADAPT_FOR_PROVIDER_PRE_EXECUTION_ADMISSION

OpenSandbox WorkloadLifecycle
→ NOT_H4_AUTHORITY
→ NOT_K2_REPLACEMENT
→ NOT_TTL_PROOF_BY_ITSELF
```

---

# 4. ACCEPT — Cline process-generation identity

Hermes surfaced a valuable implementation at:

```text
repository:
cline/cline

research pin:
61b95a62eed64180f56aa443c629741083927d57

path:
sdk/packages/core/src/runtime/process-start-token.ts
```

The source distinguishes:

```text
found
missing
unavailable
```

instead of collapsing all failed observations into "process is dead".

It separately models process existence:

```text
running
missing
unavailable
```

On Linux the process-generation token binds:

```text
Linux boot ID
+
/proc/<pid>/stat starttime
```

purpose-equivalent to:

```text
linux:<boot-id>:<process-start-time-ticks>
```

The source explicitly documents:

```text
A PID alone is not an identity because the operating system can reuse it
```

It also bounds non-Linux external probes with:

```text
PROCESS_PROBE_TIMEOUT_MS = 2000
PROCESS_PROBE_MAX_BUFFER_BYTES = 4096
```

## 4.1 Kodac acquisition decision

This is a **HIGH_PRIORITY_ADAPT** candidate for a future cross-platform process-generation observation helper.

Potential Kodac role:

```text
ProcessGenerationObservation
```

with semantics such as:

```text
FOUND(identity)
MISSING
UNAVAILABLE
```

The important new invariant is:

```text
PROCESS_EXISTENCE != PROCESS_GENERATION_IDENTITY
```

and additionally:

```text
IDENTITY_PROBE_UNAVAILABLE != SUBJECT_MISSING
```

## 4.2 Authority ceiling

The helper remains observation-only.

It must not replace stronger K2/H4 exact-subject identity when such identity is required.

For example, canonical gVisor R3D/R3E/R3G identity may additionally bind:

```text
PID
start ticks
executable device/inode/size
runsc artifact identity
runtime instance identity
container binding
provider/configuration identity
retained process/channel handles
```

Therefore:

```text
Cline process-start token
→ useful cross-platform generation signal

NOT
→ sufficient positive K2 proof for every runtime theorem
```

---

# 5. ACCEPT — Cline child-session lifecycle remains a top donor

Hermes reinforces the earlier PR #121 conclusion that Cline contains a strong practical persisted child-session/team lifecycle.

High-value concepts remain:

```text
rootSessionId
parentSessionId
parentAgentId
agentId
conversationId
child session status
persisted messages/history
provider/model identity
workspace identity
progress/lifecycle state
```

Recommended synthesis remains:

```text
Cline practical lifecycle
+
DeepSeek provider/capability/continuation seams
+
Kodac exact-head identity
+
Kodac default-deny capability semantics
+
K2 authority
```

Future Kodac `ReviewRun` child identity should additionally bind proof-oriented fields unavailable or non-authoritative in ordinary agent systems:

```text
reviewedHead
canonicalBase
inputDigest
contextDigest
capabilityDigest
policyIdentity
providerIdentity
modelIdentity
parentRunIdentity
resultDigest
artifactRefs[]
evidenceRefs[]
```

---

# 6. MODIFY — OpenSandbox target mapping

Hermes ranked OpenSandbox isolation/lifecycle source as a direct high-value transplant candidate.

That is partly correct, but the Kodac target must be narrowed.

Correct target:

```text
SandboxProvider pre-execution identity/admission seam
isolation profile ideas
workspace/env/bind declarations
lifecycle observation hardening
```

Incorrect target:

```text
replace native K2 authority
replace canonical H4-R3G-D lifecycle proof
allow provider self-declared capability to satisfy qualification
allow provider to release workload before K2 admission
```

Future OpenSandbox provider work remains governed by:

```text
KODAC_H4_R3G_D_PARITY_V1
```

for any provider claiming proof-bearing TTL parity.

Capability declaration remains metadata, not proof.

---

# 7. MODIFY — Sentry acquisition framing

Hermes correctly emphasizes Sentry grouping/fingerprinting and code-review preflight patterns.

Retain the existing PR #121 conclusions:

```text
Sentry grouping/fingerprinting
→ HIGH_VALUE_ALGORITHM / IMPLEMENTATION_DONOR_CANDIDATE

Sentry production/source correlation
→ HIGH_VALUE_PRODUCT_AND_INTEGRATION_REFERENCE

Sentry suspect commit
→ ATTRIBUTION HYPOTHESIS
→ NOT PROVEN CAUSATION
```

However, do not inherit donor-wide infrastructure when a narrow algorithm/contract boundary is sufficient.

Preferred initial Kodac strategy:

```text
extract/adapt narrow grouping/fingerprint semantics
+
retain native source artifact/provenance
+
implement Kodac-owned FindingCorrelation contract
```

Sentry output remains untrusted observation/context until Kodac validation establishes stronger evidence.

---

# 8. REJECT — Hermes claim that Kodac lacks runtime tests

The raw report states in its test-architecture section, purpose-equivalent to:

```text
No test files in packages/kodac-runtime/src/
therefore no runtime unit/integration/failure-path tests
```

This inference is invalid.

Kodac tests are not required to live under `src/`.

Canonical Kodac contains runtime tests under paths including:

```text
packages/kodac-runtime/test/
```

and includes extensive H4 tests such as:

```text
kdo-h4-r3g-d-gateway-terminal-timeout.test.ts
```

as well as many other gateway, confinement, sandbox, KRI, and runtime tests.

Therefore:

```text
HERMES_CLAIM_NO_KODAC_RUNTIME_TESTS
= REJECTED_FACTUAL_ERROR
```

This error is also a reviewer/research lesson:

```text
absence in one expected directory
!= repository-wide absence
```

Future reverse-engineering agents must inspect repository test topology before making coverage claims.

---

# 9. REJECT — Hermes license/provenance table as authoritative

The raw report contains license/provenance entries that conflict with exact repository source at the inspected pins.

Examples identified during reconciliation include incorrect or unknown classifications for major donors.

Therefore:

```text
HERMES_LICENSE_TABLE
= REJECTED_AS_PROVENANCE_AUTHORITY
```

No future donor intake may rely on that table.

Every intake must independently persist:

```text
repository
exact commit/tag
selected paths/symbols
selected file digests
permission evidence
public license at the selected pin
third-party/generated-code boundary
transitive dependency licenses
modifications made by Kodac
```

The founder's reported permission expands code-admission eligibility, but it does not eliminate provenance accounting or third-party dependency review.

---

# 10. REJECT — hypothetical reviewer findings labeled `REVIEWER_CONFIRMED`

The Hermes raw report contains a `REVIEWER-ADVERSARIAL FINDINGS` table where the reviewer is explicitly listed as:

```text
hypothetical
```

while several rows are classified:

```text
REVIEWER_CONFIRMED
```

This is semantically invalid for Kodac's reviewer-learning dataset.

A self-generated research hypothesis is not a reviewer finding.

Required distinction:

```text
Hermes/source-analysis hypothesis
→ RESEARCH_HYPOTHESIS

real external reviewer output
→ REVIEWER_CANDIDATE_FINDING

verified against exact source/tests/runtime
→ REVIEWER_CONFIRMED
```

Therefore all hypothetical Hermes reviewer rows must be excluded from the real reviewer benchmark ledger until independently reproduced as actual reviewer outputs or reclassified as research hypotheses.

## 10.1 Reviewer ledger admission contract

A real `REVIEWER_FINDING_LEDGER` entry should bind at minimum:

```text
repository
reviewedHead
reviewerIdentity
reviewerVersion/provider
reviewTimestamp
claim
file/symbol/location
claimedSeverity
rawReviewArtifactDigest
sourceVerificationRefs[]
testEvidenceRefs[]
runtimeEvidenceRefs[]
finalClassification
reconciliationReason
```

Allowed final classifications include:

```text
REVIEWER_CONFIRMED
REVIEWER_PARTIALLY_CORRECT
REVIEWER_FALSE_POSITIVE
REVIEWER_MISSED_IMPORTANT_BEHAVIOR
INCONCLUSIVE
STALE_AFTER_HEAD_MOVE
```

No hypothetical entry may enter this ledger as confirmed reviewer evidence.

---

# 11. REJECT — provider or donor code gaining K2 authority

Nothing in the Hermes report changes the existing trust rule:

```text
COMPOSABILITY != AUTHORITY
```

The following remain forbidden:

```text
OpenSandbox decides proof eligibility
Cline tool policy becomes Kodac authority
DeepSeek plugin/provider raises technical evidence
Zoo mode grants itself capabilities
Sentry preflight becomes execution authorization
an analyzer promotes its own output to PROVEN
CRS/fuzzer writes trusted evidence directly
```

The valid architecture remains:

```text
untrusted/provider discovery
→ typed immutable artifacts
→ Kodac validation request
→ K2-authorized bounded analysis/execution
→ closed validator
→ technical evidence transition
→ adjudication
→ Done Gate
```

---

# 12. INCOMPLETE — raw Hermes final report

The raw artifact terminates during its integration-architecture section and does not contain the complete requested final deliverable set.

The missing/incomplete tail includes the requested material corresponding to:

```text
suggested module boundaries
Review Run contract
Cyber Execution Broker contract
Production Evidence Provider contract
Finding Fingerprint / Dedup contract
isolated work-unit contract
specialist profile contract
Top 25 donor code candidates
Top 20 donor design mistakes
reviewer dataset summary
donor intake sequencing
explicit non-goals
final recommendation
```

The raw artifact also contains interrupted execution/tool-call text rather than a clean final report boundary.

Therefore:

```text
HERMES_REPORT_STATUS
= PARTIAL_RESEARCH_ARTIFACT

NOT
= FINAL_REVERSE_ENGINEERING_REPORT
```

The existing PR #121 documents plus this reconciliation remain the controlled planning set.

---

# 13. New invariant: `PRE_EXECUTION_IDENTITY_BEFORE_RELEASE`

This reconciliation adds the following planning invariant:

```text
PRE_EXECUTION_IDENTITY_BEFORE_RELEASE
```

Meaning:

```text
A proof-sensitive workload must not begin untrusted execution before
Kodac has obtained and validated the identity material needed to bind
confinement, resource, network, lifecycle, and evidence obligations to
that exact workload.
```

Preferred generic ordering:

```text
construct blocked workload
→ obtain candidate exact workload identity
→ validate provider implementation/configuration identity
→ K2 policy/capability admission
→ install required controls
→ persist required pre-execution evidence/intents
→ release workload
```

If required identity or control installation is unavailable or ambiguous:

```text
→ ABORT / FAIL CLOSED
→ do not release workload
```

This is stronger than launching first and attempting to rediscover the workload later.

---

# 14. New invariant: `PROCESS_EXISTENCE != PROCESS_GENERATION_IDENTITY`

This reconciliation adds:

```text
PROCESS_EXISTENCE != PROCESS_GENERATION_IDENTITY
```

A numeric PID only states a locator in one process namespace at one observation time.

It does not by itself establish generation identity because PID reuse is possible.

Where relevant, process-generation observation should use stronger material such as:

```text
PID
+
start-time generation signal
+
boot/domain identity
```

and must distinguish:

```text
SUBJECT_MISSING
```

from:

```text
IDENTITY_PROBE_UNAVAILABLE
```

Failing to read identity state is not positive evidence that the process disappeared.

For stronger proof domains, Kodac may require additional artifact/process/channel identity beyond this generic generation token.

---

# 15. Updated donor synthesis

After reconciliation, the preferred composition is:

```text
DeepSeek Harness
→ provider/capability/continuation seams

Cline
→ persisted child-session/team lifecycle
→ configured specialists
→ process-generation observation

Cline Kanban
→ isolated work units / worktrees / patch recovery

Zoo Code
→ specialist mode/profile UX
→ bounded subprocess hardening patterns

OpenSandbox
→ sandbox provider/protocol fabric
→ fail-closed pre-execution identity/release pattern
→ isolation/workspace/env declaration ideas

Graphify
→ structural routing/context graph with explicit provenance classes

SCIP
→ precise symbol/reference interchange

Joern
→ out-of-process semantic/dataflow/taint evidence provider

Sentry
→ grouping/fingerprinting
→ production/source correlation
→ post-merge feedback architecture

VulnHunter
→ adversarial falsification discipline

Atlantis / OSS-CRS / FuzzingBrain / Vulnhuntr
→ Cyber method-provider, experiment-lifecycle, fuzzing, progressive-context patterns

CodeQL / Semgrep / OSV / Trivy / Syft / Grype / Gitleaks / Scorecard / Infer
→ bounded analyzer/provider fabric with native artifacts retained

Kodac
→ exact-head identity
→ default-deny capability authority
→ K2
→ receipts/evidence
→ closed validation
→ adjudication
→ Done Gate
```

---

# 16. Acquisition-mode corrections

| Donor subsystem | Reconciled disposition | Target | Authority ceiling |
|---|---|---|---|
| OpenSandbox `WorkloadLifecycle` | `HIGH_PRIORITY_ADAPT` | provider pre-execution identity/release seam | cannot authorize release without K2; cannot mint proof |
| OpenSandbox `WorkloadIdentity` | `ADAPT` | provider workload identity carrier | observation only until validated |
| OpenSandbox isolation profiles/options | `SELECTIVE_ADAPT` | provider configuration vocabulary | declaration only |
| Cline process-start token | `HIGH_PRIORITY_ADAPT` | cross-platform process-generation observation | observation only |
| Cline child-session manager | `HIGH_PRIORITY_ADAPT` | ReviewRun child-session lifecycle | no policy/evidence authority |
| DeepSeek agent/provider seams | `HIGH_PRIORITY_ADAPT` | runtime provider/continuation ABI | no K2 authority |
| Sentry grouping/fingerprint algorithms | `ADAPT_AND_REWRITE_BOUNDARY` | Finding correlation/dedup | data-layer only |
| Sentry preflight patterns | `ALGORITHM_ONLY` | eligibility/qualification preflight | not execution authorization |
| Graphify graph normalization | `SELECTIVE_ADAPT` | routing/context | never proof |
| Joern | `OUT_OF_PROCESS_ADAPTER` | deep semantic/dataflow analysis | analyzer only |
| analyzer suite | `PROCESS/LIBRARY_ADAPTER` | typed observations/native artifacts | no evidence self-promotion |

---

# 17. Future source-intake sequencing delta

This document does not authorize execution of the sequence, but updates priority for future bounded intake studies.

Recommended first implementation-intake candidates after separate authorization:

```text
1. Cline process-generation observation helper
2. Cline ReviewRun child-session lifecycle concepts
3. DeepSeek provider/capability/continuation seam
4. OpenSandbox pre-execution WorkloadLifecycle pattern behind K2
5. Sentry finding grouping/fingerprint boundary
```

Why this order:

- first establish identity and run/session lineage;
- then establish replaceable provider orchestration;
- then add optional provider startup/admission hardening;
- then improve finding correlation/dedup;
- preserve K2/evidence authority throughout.

No donor should be imported as a large undifferentiated fork.

Preferred policy:

```text
SMALLEST_TRANSPLANTABLE_BOUNDARY
+
EXACT_PIN
+
IMPORTED_TESTS
+
KODAC_HOSTILE_TESTS
+
AUTHORITY_CEILING
+
ROLLBACK
```

---

# 18. Reverse-engineering quality rules added from Hermes mistakes

The Hermes report itself supplies useful methodology lessons.

## 18.1 Absence claims require repository-wide search

Forbidden inference:

```text
no tests in src/
→ repository has no tests
```

Required:

```text
inspect repository test topology
→ search conventional and non-conventional test roots
→ inspect CI invocations
→ inspect representative tests
→ only then make coverage claim
```

## 18.2 License claims require exact-pin source

Forbidden:

```text
memory / repo reputation / stale README
→ license fact
```

Required:

```text
exact donor pin
→ exact license/provenance files
→ selected path ownership
→ dependency boundary
```

## 18.3 Reviewer claims require real reviewer identity

Forbidden:

```text
analyst-created hypothesis
→ REVIEWER_CONFIRMED
```

Required:

```text
real reviewer artifact
→ exact reviewed head
→ source/test/runtime reconciliation
→ classification
```

## 18.4 Incomplete generated reports cannot be canonicalized silently

A report ending during generation or containing tool-call artifacts must be marked incomplete.

The planning process must not infer that missing requested sections were produced.

---

# 19. Relationship to PR #121 existing documents

This reconciliation is additive.

It does not invalidate the existing PR #121 core decisions:

```text
Agents discover.
Tools establish technical facts.
Falsifiers attack weak claims.
Validators independently verify artifacts.
Kodac adjudicates.
K2 controls authority and execution.
Done Gate emits the applicable verdict.
```

It strengthens them with:

```text
PRE_EXECUTION_IDENTITY_BEFORE_RELEASE
PROCESS_EXISTENCE != PROCESS_GENERATION_IDENTITY
IDENTITY_PROBE_UNAVAILABLE != SUBJECT_MISSING
```

It also records that donor research pins are time-bound historical research identities and must not silently become future intake identities.

Where the raw Hermes report conflicts with this reconciliation on the matters covered here, this reconciliation controls for PR #121 planning purposes.

---

# 20. Explicit final disposition

```text
HERMES_RESEARCH_COMPLETED=PARTIAL
HERMES_RAW_REPORT_CANONICAL=NO
HERMES_VERIFIED_DELTA_ACCEPTED=YES

ACCEPT:
- OpenSandbox fail-closed pre-execution identity/release pattern
- OpenSandbox workload identity carrier as provider observation
- Cline process-generation identity semantics
- Cline child-session lifecycle reinforcement
- best-of-breed donor synthesis behind K2

MODIFY:
- OpenSandbox target is provider pre-execution admission, not H4 authority
- Sentry acquisition stays narrow/lossless rather than donor-wide
- donor pins are historical research snapshots, not permanent current identities

REJECT:
- claim that Kodac has no runtime tests
- raw Hermes license/provenance table as authority
- hypothetical findings labeled REVIEWER_CONFIRMED
- any donor/provider self-granted proof authority
- raw report as final complete deliverable

INCOMPLETE:
- requested sections after the interrupted integration-architecture tail
- complete Top-25 donor acquisition list
- complete Top-20 donor design-mistake list
- complete final reviewer dataset summary
- complete final report recommendation package

RUNTIME_MUTATION=NONE
DONOR_CODE_IMPORTED=NO
H4_R3G_F_STARTED=NO
H6_STARTED=NO
CYBER_IMPLEMENTATION_STARTED=NO
BLOCKING_REVIEW_AUTHORIZED=NO
MERGE_AUTHORIZED=NO
```

The correct next gate after this documentation amendment is fresh exact-head CI and fresh independent exact-head review of PR #121.
