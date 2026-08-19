# KDO-H4-R3G-F — R3B Physical Proof Conjunction / Minting Authorization

Date: 2026-08-20
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY / NO PRODUCT IMPLEMENTATION**
Repository: `TheHalfMoon/Kodac`
Canonical base: `7bd79a8633187a088c07a0d2525921f34de68a70`
Canonical base tree: `1d79d9a8ba37f91bcff31750a5694cc49016212c`
Predecessors: canonical H4-R3G-A/B/C/D/E physical-observation and enforcement slices

---

## 1. Decision

```text
GATE:
KDO-H4-R3G-F

NAME:
R3B PHYSICAL PROOF CONJUNCTION / MINTING

CHANGE CLASS:
DOCS ONLY / AUTHORIZATION / NO EXECUTION

R3G-A:
CANONICAL / PROVEN

R3G-B:
CANONICAL / PROVEN

R3G-C:
CANONICAL / PROVEN

R3G-D:
CANONICAL / PROVEN

R3G-E:
CANONICAL / PROVEN

R3G-F PRODUCT CODE:
NOT AUTHORIZED UNTIL THIS DOCUMENT IS CANONICAL

TARGET PLATFORM:
LINUX + DOCKER ENGINE + gVISOR

TARGET AUTHORITY:
TRUST-KERNEL-OWNED FINAL CONJUNCTION OF ALREADY-PROVEN R3G E3 FACTS

R3B BACKEND CAPABILITY MINTING:
AUTHORIZED ONLY AFTER THIS DOCUMENT IS CANONICAL AND ONLY BY R3G-F IMPLEMENTATION

R3B BACKEND OBSERVATION MINTING:
AUTHORIZED ONLY AFTER THIS DOCUMENT IS CANONICAL AND ONLY AFTER EXACT CONJUNCTION PASSES

R3B EXECUTION EVIDENCE MINTING:
AUTHORIZED ONLY AFTER THIS DOCUMENT IS CANONICAL AND ONLY AFTER EXACT CONJUNCTION PASSES

NEW PHYSICAL POLICY CLAIMS:
FORBIDDEN

NEW PRIVILEGED HOST READ SURFACES:
FORBIDDEN

NEW LIFECYCLE MUTATION AUTHORITY:
FORBIDDEN

EXTERNAL-PROCESS ASK:
REMAINS BLOCKED

H4 COMPLETE:
NO — NOT BY AUTHORIZATION ALONE

H6 AUTHORIZED:
NO

NEXT AFTER CANONICAL AUTHORIZATION:
R3G-F IMPLEMENTATION ONLY
```

R3G-F is the first slice permitted to transform the independently proven R3G-A/B/C/D/E facts into the canonical R3B all-or-nothing physical observation/evidence contract.

It MUST NOT manufacture any missing fact, reinterpret an E2 record as E3/E4, weaken exact-v1 equality, or treat structurally valid caller-provided records as trusted provenance.

---

## 2. Canonical base and predecessor truth

Canonical `main` at R3G-F entry:

```text
7bd79a8633187a088c07a0d2525921f34de68a70
```

Canonical tree:

```text
1d79d9a8ba37f91bcff31750a5694cc49016212c
```

The canonical R3G split already reserves the final slice as:

```text
R3G-F — R3B physical proof conjunction / minting
```

and requires that the final slice revalidate exact-subject lineage and race boundaries instead of merely concatenating old records.

Canonical split document:

```text
docs/planning/KODAC_KDO_H4_R3G_LINUX_DOCKER_GVISOR_PHYSICAL_POLICY_CONJUNCTION_SPLIT_2026-08-16.md
blob 21e94791fb3f4255def4cc19c9dd8dcbf274d500
```

R3G-F MUST preserve that boundary.

---

## 3. Governing evidence ladder

The canonical evidence ladder remains:

```text
E0 = untrusted workload/guest claim
E1 = desired/declarative configuration
E2 = trusted host control-plane observation
E3 = trusted host physical/runtime state candidate
E4 = accepted Kodac physical proof after exact conjunction
```

R3G-F is the only R3G slice authorized to produce E4.

The following remain invalid substitutions:

```text
artifact != observation
self-report != proof
declared limit != enforced limit
backend existence != backend attribution
control-plane response != workload conformance
validated shape != trusted provenance
same field values != same execution subject
same historical subject != live coherent subject
```

---

## 4. Canonical R3B final contract is unchanged

Canonical source:

```text
packages/kodac-runtime/src/trust/sandbox-backend-evidence.ts
blob b9242c5cecc18fd43b2b80aeffd974ef5311fded
```

R3G-F MUST use the existing R3B v1 contract without widening or weakening it.

The final capability declaration requires all of the following to be true:

```text
supportsImmutableImageDigestObservation
supportsDenyAllNetworkObservation
supportsCpuBudgetObservation
supportsMemoryLimitObservation
supportsTtlObservation
supportsOutputLimitObservation
```

The final `SandboxBackendObservation` must contain one complete observed resource policy and one exact source/network/runtime theorem.

The final `SandboxExecutionEvidence` requires exact agreement across:

```text
requirementIdentity
workloadIdentity
capabilityIdentity
observedSourceDigest
observedSemanticRuntimeClass
observedNetworkPolicy
observedResourcePolicy
observedCredentialBindingIdentity = null
downgradeOccurred = false
```

R3G-F MUST NOT alter `SandboxBackendCapabilityDeclaration`, `SandboxExecutionRequirement`, `SandboxBackendObservation`, or `SandboxExecutionEvidence` schemas merely to make conjunction easier.

---

## 5. Authorized canonical E3 inputs

R3G-F may consume only trusted, durably committed, canonical R3G evidence derived from the same admitted execution attempt.

### R3G-A — physical CPU/memory candidate

Canonical implementation:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts
blob c0c455cd4ba363153222e5fa398b3523aeb71413
```

Required record family:

```text
GvisorCgroupV2ResourceRecord
evidenceClass = e3-physical-resource-candidate
```

Required durable companion:

```text
GvisorCgroupV2ResourceCommit
```

### R3G-B — immutable source/rootfs physical lineage

Canonical implementation:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-source-lineage.ts
blob 2421da43286bdeb254a86ab2e8b4f02fce0afb6c
```

Required record family:

```text
GvisorSourceLineageRecord
evidenceClass = e3-physical-source-candidate
```

Required durable companion:

```text
GvisorSourceLineageCommit
```

### R3G-C — physical deny-all network candidate

Canonical implementation:

```text
packages/kodac-runtime/src/trust/sandbox-observer-gvisor-network.ts
blob 54724d0b3877838bc866e592ad47bb9ced823160
```

Required record family:

```text
GvisorPhysicalNetworkRecord
evidenceClass = e3-physical-network-candidate
```

Required durable companion:

```text
GvisorPhysicalNetworkCommit
```

### R3G-D — TTL/lifecycle enforcement

Canonical implementation:

```text
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
blob de0de7a8c9ec1cf4911e60658b82aecda6aa17ae
```

Required record families:

```text
GvisorTtlArmRecord
evidenceClass = e3-ttl-lifecycle-arm

GvisorTtlTerminalRecord
evidenceClass = e3-ttl-lifecycle-terminal
```

Required durable evidence commits must prove the accepted arm and terminal facts for the same operation/lease/subject.

### R3G-E — aggregate output-bound enforcement

Canonical implementation:

```text
packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
blob 6d1227c6f545194c644ec5b9bc7d07135fc789e2
```

Required record family:

```text
GvisorOutputBoundRecord
evidenceClass = e3-output-bound-candidate
```

Required durable companion:

```text
GvisorOutputBoundCommit
```

No other record family may substitute for these inputs in R3G-F v1.

---

## 6. Exact R3G-F v1 theorem

A positive R3G-F result may claim only:

```text
For one exact admitted SandboxExecutionRequirement and one exact K2-created
execution attempt, the trusted Kodac execution path proves that:

1. the exact running gVisor subject is bound to the required immutable source;
2. the exact same subject is under the required deny-all network theorem;
3. the exact same subject is under the required CPU and memory/swap theorem;
4. the exact same execution attempt is governed by the required TTL theorem;
5. every Kodac-accepted stdout/stderr byte for that attempt is governed by the
   required aggregate output theorem;
6. every required E3 record and commit is valid, trusted-path-originated,
   durably committed, mutually coherent, and still admissible at conjunction;
7. no runtime downgrade occurred and credential binding remains null;
8. the conjunction is revalidated against the canonical R3B requirement;
9. only then may Kodac mint the canonical R3B capability, backend observation,
   and SandboxExecutionEvidence for this exact subject.
```

This theorem does not add a new sandbox backend, new runtime class, new network policy, new resource-policy semantics, new credential mode, or new downgrade mode.

---

## 7. Conjunction is not record concatenation

The following is forbidden:

```text
validate(A)
validate(B)
validate(C)
validate(D)
validate(E)
=> mint E4
```

R3G-F MUST additionally prove cross-record coherence.

At minimum all applicable records MUST agree on:

```text
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
```

Where a predecessor record does not carry one of these exact fields directly, R3G-F MUST verify its canonical identity chain back to the same trusted R3E/R3F subject rather than infer equality from nearby values.

No caller-selected PID, container ID, socket path, runtime root, cgroup path, source path, output channel, or historical record ID may become conjunction authority.

---

## 8. Trusted provenance is mandatory

Structural validation proves shape and deterministic identity only. It does not prove trusted origin.

R3G-F MUST NOT accept arbitrary caller/model/plugin/MCP-provided E3 objects and upgrade them into E4 solely because validators pass.

Every accepted predecessor input MUST be resolved through Trust-Kernel-owned durable evidence provenance or an equivalently trusted internal closure that proves:

```text
record identity
commit identity
record/commit correspondence
trusted producer identity
exact execution-attempt ownership
immutable or create-once durable settlement
```

If provenance is unavailable, ambiguous, replayed from another attempt, or only caller-asserted, conjunction MUST fail closed.

---

## 9. Freshness and race boundary

R3G-F MUST perform a final exact-subject coherence bracket immediately before positive minting.

The authorization does not require re-running every expensive predecessor observation from scratch. It does require proving that the final conjunction still refers to the exact same admitted subject and that no accepted predecessor theorem has become impossible, replaced, terminally contradicted, or detached from the current evidence chain.

The implementation must define a race-resistant pattern purpose-equivalent to:

```text
resolve trusted exact execution-attempt evidence bundle
-> validate requirement and all durable predecessor records/commits
-> revalidate exact subject / runtime lineage coherence
-> verify lifecycle/output terminal consistency
-> construct complete observed facts from proven inputs only
-> mint capability + observation + execution evidence
-> durably commit R3G-F conjunction result
```

The following is forbidden:

```text
read old records
-> perform unrelated asynchronous work with an unbounded race window
-> mint E4 without final coherence revalidation
```

If exact-subject coherence cannot be re-established, fail closed.

---

## 10. Resource-policy mapping must be exact

Canonical R3B v1 requires exact observed resource-policy equality.

R3G-F MUST map only proven predecessor facts:

```text
cpuMillis       <- exact R3G-A proven effective CPU theorem
memoryBytes     <- exact R3G-A proven effective memory theorem
ttlMs           <- exact R3G-D armed/terminal TTL theorem
maxOutputBytes  <- exact R3G-E output-bound theorem
```

The reconstructed `SandboxResourcePolicy` MUST equal the original requirement's canonical policy identity and values.

The following are forbidden:

```text
stricter-but-different value => silently copy requested value
missing value => fill from requirement
configuration value => treat as observation
E2 Docker field => treat as physical enforcement
```

Any mismatch fails closed.

---

## 11. Source mapping must be exact

R3G-F MUST derive:

```text
observedSourceDigest
```

only from the accepted R3G-B physical source lineage and MUST prove exact equality with:

```text
requirement.workload.source.digest
```

Docker tag/name strings, image inspect labels, path strings, or caller-provided digests are not substitutes.

Any source-lineage mismatch or missing durable provenance fails closed.

---

## 12. Network mapping must be exact

R3G-F MUST derive the final observed network policy from the accepted R3G-C physical network theorem.

For v1, only the canonical deny-all theorem admitted by R3G-C may satisfy R3B network observation.

Docker `NetworkMode=none` or zero attachment count alone remain E2 and MUST NOT satisfy R3G-F without the R3G-C physical candidate and trusted provenance.

Any network theorem ambiguity fails closed.

---

## 13. Runtime class and downgrade semantics

R3G-F v1 is limited to:

```text
observedSemanticRuntimeClass = gvisor
downgradeOccurred = false
```

The final runtime identity MUST derive from the exact canonical gVisor runtime lineage already bound through the predecessor evidence chain.

A Docker container that exists without the accepted gVisor lineage is insufficient.

Any runtime replacement, fallback, semantic downgrade, or inability to prove the exact gVisor subject fails closed.

---

## 14. Credential semantics remain null-only

Canonical R3B v1 requires:

```text
observedCredentialBindingIdentity = null
requirement.workload.credentialBindingIdentity = null
```

R3G-F MUST NOT introduce credential injection or infer a credential-binding proof from environment variables, files, sockets, provider configuration, or process state.

Any non-null credential binding remains outside this authorization.

---

## 15. Final capability declaration

R3G-F may mint a canonical `SandboxBackendCapabilityDeclaration` only after it has proven that the R3G-F implementation is actually capable of obtaining and conjoining all required physical evidence families on the admitted v1 path.

The declaration must use:

```text
backendFamily = oci-container
semanticRuntimeClasses = [gvisor]
credentialMode = none
downgradePolicy = forbid
```

and all six physical-observation support booleans must be true.

The capability `implementationIdentity` MUST bind the R3G-F implementation theorem and the exact admitted predecessor contract versions so that a materially different conjunction implementation cannot reuse the same capability identity silently.

No provider ID is authorized by this document as a caller-selected field. The implementation authorization must choose one fixed canonical Kodac-owned provider ID for the gVisor physical-proof path.

---

## 16. Final observer identity

`SandboxBackendObservation.observerIdentity` MUST identify the exact R3G-F trusted conjunction implementation, not any individual R3G-A/B/C/D/E observer in isolation.

The observer identity should bind, at minimum, canonical version identities for:

```text
R3B final contract
R3G-A resource contract
R3G-B source contract
R3G-C network contract
R3G-D TTL contract
R3G-E output contract
R3G-F conjunction implementation version
```

This prevents a changed conjunction theorem from inheriting an old observer identity.

---

## 17. Final execution-instance identity

`SandboxBackendObservation.executionInstanceIdentity` MUST identify the exact physical execution subject proven by the conjunction.

It MUST be deterministically derived from trusted subject lineage and MUST NOT be chosen by the caller.

The identity must bind the same exact subject material proven across the predecessor chain, including the canonical execution-attempt and runtime-instance identity family.

A plain container ID, PID, path, or caller nonce is insufficient.

---

## 18. Lifecycle/output consistency is mandatory

R3G-E already requires positive output E3 only after exact R3G-D terminal evidence.

R3G-F MUST independently verify that:

```text
R3G-E.terminalEvidenceIdentity
```

resolves to the accepted R3G-D terminal record for the same exact runtime/attempt and that the terminal outcome is admissible under the final theorem.

An output record linked to a different terminal record, different TTL lease, different runtime instance, or indeterminate/failed lifecycle settlement MUST NOT produce E4.

R3G-F MUST NOT reinterpret an R3G-D failure or R3G-E overflow/failure into success.

---

## 19. Durable final conjunction record

Positive R3G-F minting MUST itself be durably evidenced.

The implementation must define a bounded, deterministic record purpose-equivalent to:

```text
GvisorPhysicalConjunctionRecord
```

that binds at minimum:

```text
version
evidenceClass = e4-accepted-physical-proof
executionAttemptIdentity
requirementIdentity
workloadIdentity
containerBindingIdentity
containerId
runtimeInstanceIdentity
r3gARecordIdentity
r3gACommitIdentity
r3gBRecordIdentity
r3gBCommitIdentity
r3gCRecordIdentity
r3gCCommitIdentity
r3gDArmRecordIdentity
r3gDTerminalRecordIdentity
r3gDCommitIdentity family
r3gERecordIdentity
r3gECommitIdentity
capabilityIdentity
observationIdentity
executionEvidenceIdentity
conjunctionObserverIdentity
recordIdentity
```

A companion create-once durable commit identity is required.

The exact field names may be refined during implementation only if the same information and theorem are preserved and the change does not widen authority.

---

## 20. Mint ordering

Positive result ordering MUST be purpose-equivalent to:

```text
1. validate exact requirement
2. resolve trusted predecessor durable evidence
3. revalidate cross-record and subject coherence
4. construct and validate canonical capability
5. construct and validate canonical backend observation
6. construct and validate canonical SandboxExecutionEvidence
7. construct deterministic R3G-F conjunction record
8. durably commit the R3G-F record
9. only after durable success, return positive final evidence
```

A positive `SandboxExecutionEvidence` object MUST NOT escape to a caller before the durable R3G-F conjunction commit has succeeded.

If durable commit fails or is ambiguous, return no positive evidence.

---

## 21. Replay and idempotency

R3G-F must be create-once or equivalent for one exact execution-attempt/evidence-bundle identity.

A duplicate exact request may only:

```text
return/reconcile the same immutable committed conjunction
```

It MUST NOT:

- mint a second logically different E4 record for the same exact bundle;
- accept a changed predecessor record under the same attempt;
- replace a failed/ambiguous conjunction with success without a newly authorized evidence lineage;
- use retry to erase prior terminal or output failure.

Conflicting durable state fails closed.

---

## 22. Fail-closed matrix

R3G-F MUST fail closed on at least:

- missing predecessor record or commit;
- invalid predecessor schema/version/identity;
- untrusted or caller-constructed provenance;
- requirement identity mismatch;
- workload identity mismatch;
- execution-attempt mismatch;
- container-binding or container-ID mismatch;
- runtime-instance mismatch;
- source digest mismatch;
- network-policy mismatch;
- CPU/memory theorem mismatch;
- TTL theorem mismatch;
- output-bound theorem mismatch;
- R3G-E terminal linkage mismatch;
- runtime downgrade;
- non-null credential binding;
- stale/replaced subject whose final coherence cannot be re-established;
- failed, ambiguous, or replay-conflicting durable state;
- final capability/observation/evidence validation failure;
- final conjunction commit failure or timeout.

There is no ASK bypass for these failures.

---

## 23. Authority minimization

R3G-F is an evidence-conjunction and minting slice.

It MUST NOT add:

```text
new Docker socket methods
new runsc RPC methods
new /proc reads
new /sys/fs/cgroup reads
new containerd reads
new source/rootfs reads
new network probing
new host PID kill
new Docker kill/start/stop/remove
new output transport
new watchdog command
new credential access
new arbitrary command execution
```

If implementation discovers that a new physical read or lifecycle mutation is necessary, R3G-F implementation MUST stop and return to a new docs-only authorization rather than widening this tranche.

---

## 24. Public authority surface

R3G-F MUST remain Trust-Kernel-owned.

Public/model/plugin/MCP callers MUST NOT be allowed to provide or select:

```text
predecessor record objects
predecessor commit objects
containerId
PID
runtime root
cgroup path
Docker socket
source path
network endpoint
TTL lease identity
output channel identity
provider implementation identity
observer implementation identity
capability support booleans
```

The public caller may provide only the already-admitted high-level sandbox request/requirement path. Trusted K2 composition resolves physical evidence internally.

No new package-root export may expose raw mutable-host-locator factories solely for R3G-F.

---

## 25. Bounded resource semantics

R3G-F conjunction processing must be bounded independently of hostile record input.

The implementation must define fixed limits for:

- serialized durable record size;
- evidence bundle size;
- record count;
- validation depth/shape where applicable;
- durable resolution time;
- final coherence validation time;
- final commit time;
- error/receipt serialization.

No unbounded retry, recursion, record scan, or history traversal is authorized.

---

## 26. Required hostile tests

R3G-F implementation is incomplete until hostile tests prove at least:

1. exact positive A+B+C+D+E conjunction mints one valid R3B evidence object;
2. every required capability boolean is true only on the admitted full path;
3. missing A/B/C/D/E individually fails closed;
4. forged structurally valid predecessor records fail trusted-provenance checks;
5. wrong durable commit for an otherwise valid record fails;
6. same values but different executionAttemptIdentity fails;
7. same attempt but different runtimeInstanceIdentity fails;
8. container replacement fails;
9. source digest mismatch fails;
10. network theorem mismatch fails;
11. CPU mismatch fails;
12. memory mismatch fails;
13. TTL mismatch fails;
14. output limit mismatch fails;
15. output terminalEvidenceIdentity bound to the wrong R3G-D terminal fails;
16. indeterminate/failed lifecycle evidence cannot become positive E4;
17. output overflow/failure cannot become positive E4;
18. non-null credential binding fails;
19. runtime downgrade fails;
20. capability implementation identity changes when conjunction theorem version changes;
21. final observer identity is R3G-F-specific;
22. positive evidence cannot escape before durable final commit;
23. durable commit failure produces no positive evidence;
24. exact replay reconciles the same immutable result;
25. conflicting replay fails closed;
26. ASK never bypasses a physical-proof failure;
27. public/package-root surfaces do not expose raw predecessor injection or mutable host locators;
28. no R3G-F implementation path performs new privileged reads or lifecycle mutation.

---

## 27. Required exact-head gates before implementation merge

A future R3G-F implementation PR must not merge until all of the following are satisfied on one exact head:

```text
governance = PASS
k2-runtime = PASS
all other required repository workflows = PASS
manual architecture/trust/security review = PASS
fresh independent exact-head review = PASS
unresolved actionable review findings = 0
evidence ledger / exact identities = complete
```

Any source mutation after review or certification invalidates the corresponding exact-head gate and requires fresh recertification.

---

## 28. Allowed implementation scope after this authorization is canonical

After this authorization document itself is merged canonically, one bounded R3G-F implementation PR may:

- add a dedicated Trust-Kernel-owned R3G-F conjunction module;
- add the minimum K2 orchestration needed to resolve trusted canonical predecessor evidence;
- call the existing R3B constructors/validators to mint the final capability/observation/evidence;
- add deterministic R3G-F durable conjunction record/commit types and identity helpers;
- add focused hostile tests;
- make only the minimum package-root export changes required for the trusted final API.

It may not modify predecessor theorems merely to make them easier to conjoin.

If an existing predecessor contract lacks a fact that R3G-F genuinely requires, implementation must stop and produce a separate reconciliation/authorization rather than silently changing A/B/C/D/E.

---

## 29. Explicit nonclaims

This authorization does **not** claim or authorize:

```text
R3G-F implementation already exists
R3G-F implementation is proven
H4 is complete
H6 is authorized
external-process ASK is authorized
non-gVisor runtime proof
Kata/Firecracker/QEMU proof
Windows or macOS physical sandbox proof
credential binding
network modes other than the admitted deny-all theorem
resource-policy monotonic-equivalence changes
new sandbox product quotas
new donor code intake
Cyber implementation
blocking multi-agent review
```

It also does not authorize merging any future implementation PR without its own exact-head CI, evidence, and review gates.

---

## 30. Authorization summary

```text
CANONICAL_BASE=7bd79a8633187a088c07a0d2525921f34de68a70
CANONICAL_BASE_TREE=1d79d9a8ba37f91bcff31750a5694cc49016212c

R3G_F_AUTHORIZATION_CLASS=DOCS_ONLY
R3G_F_IMPLEMENTATION_NOW=NOT_AUTHORIZED_UNTIL_DOC_IS_CANONICAL
R3G_F_TARGET=R3B_PHYSICAL_PROOF_CONJUNCTION_AND_MINTING
R3G_F_E4_AUTHORITY=ONLY_AFTER_EXACT_TRUSTED_CONJUNCTION
NEW_PHYSICAL_READ_AUTHORITY=NONE
NEW_LIFECYCLE_MUTATION_AUTHORITY=NONE
CALLER_EVIDENCE_INJECTION=FORBIDDEN
TRUSTED_DURABLE_PREDECESSOR_PROVENANCE=MANDATORY
EXACT_SUBJECT_COHERENCE_REVALIDATION=MANDATORY
FINAL_DURABLE_CONJUNCTION_COMMIT=MANDATORY
R3B_SCHEMA_CHANGE=NONE
ASK_BYPASS=FORBIDDEN
H4_COMPLETE=NO
H6_AUTHORIZED=NO
NEXT_AFTER_CANONICAL_AUTHORIZATION=R3G_F_IMPLEMENTATION_ONLY
```

The purpose of R3G-F is narrow: convert already-proven, same-subject physical facts into the existing canonical R3B final evidence contract without inventing, weakening, or widening any theorem.
