# Kodac Review/Cyber — Analyzer Contract Hardening Correction

Status: **NORMATIVE PLANNING CORRECTION / DOCS ONLY / NO IMPLEMENTATION AUTHORIZATION**  
Date: 2026-08-19  
Repository: `TheHalfMoon/Kodac`  
Planning PR: `#121`  
Canonical Kodac base: `04430d4e9e4d91c15ccb5f3f4dbfc9c59f7afa1e`  
Applies after PR #121 head: `7f0f276e164b08f77a1c239974d65f9c071ade20`

---

## 0. Purpose and precedence

Fresh exact-head review of PR #121 surfaced six valid planning gaps in:

`docs/planning/KODAC_DONOR_REVERSE_ENGINEERING_CYBER_AND_ANALYZER_SUPPLEMENT_2026-08-19.md`

The gaps concern:

1. authority/policy identity binding for Cyber experiments, artifacts, and analyzer replay;
2. bounded progressive-context retrieval by symbols and bytes, not only by round count;
3. deterministic separation of provider artifact type from validator-owned lifecycle stage;
4. recording and validating the **effective** analyzer filesystem/network/runner policy, not only the requested policy;
5. mandatory ruleset/database identity when analyzer behavior can drift independently of its executable;
6. physical workspace containment for analyzer-produced file paths.

All six findings were independently checked against the PR #121 planning text and existing Kodac trust conventions and are accepted.

Where this document conflicts with the earlier Cyber/analyzer supplement on these six topics, **this correction controls** until a later separately authorized consolidation.

This document does **not**:

- authorize Cyber implementation;
- authorize H6;
- start H4-R3G-F or any later H4 task;
- change current K2, KRI, validator, evidence, adjudication, or Done Gate behavior;
- authorize donor-code intake;
- authorize an external analyzer/provider;
- authorize a blocking review gate;
- authorize merge of PR #121.

The limits defined here are **per-execution security, determinism, replay, and resource-safety bounds**. They are not Kodac-imposed daily/PR/file/review quotas and must not be used to create artificial product scarcity.

---

# 1. Shared authority snapshot binding

`reviewedHead` is necessary but not sufficient to replay or validate a Cyber/analyzer result. The same source head may be evaluated under different effective K2, KRI, validator, or blocking policies.

Every proof-relevant Cyber/analyzer contract must therefore bind the applicable authority state.

## 1.1 Authority snapshot contract

Future implementation must provide a trusted immutable reference purpose-equivalent to:

```text
ReviewAuthoritySnapshot {
  authoritySnapshotIdentity
  policyIdentity
  k2CapabilityPolicyIdentity
  kriPolicyIdentity
  validatorRegistryIdentity
  evidenceTransitionPolicyIdentity
  blockingPolicyIdentity
  trustedConfigIdentity
}
```

`authoritySnapshotIdentity` must be deterministically derived from canonical trusted configuration and the applicable identities above. It is not caller-selected metadata.

If an identity is not applicable to a particular execution, that absence must itself be represented canonically rather than omitted ambiguously.

## 1.2 Corrected `CyberExperiment`

```text
CyberExperiment {
  experimentId
  requestedBySessionId
  reviewRunId
  reviewedHead
  authoritySnapshotIdentity
  policyIdentity
  methodProviderIdentity
  objective
  budget
  timeout
  terminationPolicy
  state
  artifactManifest
}
```

## 1.3 Corrected `CyberArtifactEnvelope`

```text
CyberArtifactEnvelope {
  artifactId
  reviewRunId
  experimentId
  reviewedHead
  authoritySnapshotIdentity
  policyIdentity
  providerIdentity
  providerArtifactType
  digest
  nativeMetadataDigest
  createdAt
  trust = UNTRUSTED_PROVIDER_OUTPUT
}
```

Provider-created artifacts may carry the trusted authority snapshot reference supplied by Kodac for the run, but the provider may not choose, replace, or reinterpret it.

## 1.4 Corrected `AnalyzerExecutionManifest`

```text
AnalyzerExecutionManifest {
  analyzerId
  analyzerVersion
  executableOrImageDigest
  invocationArgs
  configurationDigest
  independentlyMutableInputIdentities[]
  reviewedHead
  authoritySnapshotIdentity
  policyIdentity
  materializationDigest
  inputArtifactDigests[]
  requestedPolicyIdentity
  effectivePolicyReceiptIdentity
  environmentIdentity
  resourceBudget
  startedAt
  completedAt
  exitStatus
  stdoutDigest
  stderrDigest
  outputArtifactDigests[]
}
```

## 1.5 Validation rule

Before an experiment result, artifact, analyzer result, validator replay, or evidence transition is accepted:

```text
record.reviewedHead == active reviewed head
AND
record.authoritySnapshotIdentity == effective trusted authority snapshot
AND
record.policyIdentity == effective trusted policy identity
```

Otherwise:

```text
MISMATCH / MISSING / AMBIGUOUS
→ reject for validation/replay/evidence
→ preserve diagnostic record
→ fail loud or fail closed according to the calling boundary
```

A historical artifact may remain stored for audit but may not silently inherit authority from a later policy snapshot.

---

# 2. Progressive context service must be byte- and fan-out-bounded

A seven-round reasoning limit does not bound work if one round can request unbounded symbols or arbitrarily large definitions.

Future progressive-context retrieval must therefore bind a trusted `ContextRetrievalBudget`.

## 2.1 Budget dimensions

Purpose-equivalent contract:

```text
ContextRetrievalBudget {
  maxRounds
  maxSymbolsPerRequest
  maxUniqueSymbolsCumulative
  maxContextBytesPerRequest
  maxContextBytesCumulative
  maxDefinitionBytesPerSymbol
  maxFallbackCandidatesPerSymbol
  maxFallbackFanoutCumulative
  maxFilesTouchedPerRequest?
  maxFilesTouchedCumulative?
}
```

Defaults and hard safety ceilings may be policy/configuration dependent. They must be explicit, deterministic, and included in the run/receipt identity.

## 2.2 Accounting rules

Accounting must occur on canonical UTF-8 bytes or another explicitly versioned byte-accounting rule, not approximate token count alone.

A symbol, definition, fallback candidate, or file that appears repeatedly must not permit budget-reset attacks. The implementation must define whether repeated material is charged again; the rule must be deterministic and receipt-visible.

At minimum the trusted service must record:

```text
roundsUsed
symbolsRequested
uniqueSymbolsResolved
contextBytesReturned
fallbackCandidatesExamined
filesTouched
truncations[]
rejections[]
```

## 2.3 Over-budget behavior

```text
request exceeds hard per-request bound
→ reject that request before expansion

cumulative budget exhausted
→ stop further expansion
→ return bounded explicit budget-exhausted result

partial result due to allowed truncation
→ mark result TRUNCATED
→ record exact truncation reason and accounted bytes/symbols
```

A model/provider may not convert a truncation or budget exhaustion into an implicit complete-context claim.

The execution receipt must preserve the budget identity and the exact accounted result.

## 2.4 Product invariant

These bounds exist to prevent one execution from exhausting memory/context/analyzer resources or creating denial-of-service behavior. They must remain configurable by trusted policy/hardware capability and must not become artificial daily review limits, PR quotas, or vendor scarcity controls.

---

# 3. Provider artifact kind is not validator lifecycle stage

The earlier supplement used one provider-visible artifact `type` field while also describing a lifecycle that includes sanitizer observations, reproducers, and validated reproducers. That permits inconsistent interpretation.

Kodac must separate:

```text
WHAT THE PROVIDER SUBMITTED
from
WHAT A TRUSTED VALIDATOR HAS ESTABLISHED
```

## 3.1 Provider artifact kind

Provider output may declare only a descriptive untrusted kind from an allowlisted schema purpose-equivalent to:

```text
ProviderArtifactType =
  seed
  candidate
  suspicious-point
  source-sink-path
  static-flow
  generated-test
  crash
  sanitizer-observation
  pov
  reproducer
  patch
  report
```

The provider type is claim metadata. It does not establish technical evidence or lifecycle validation.

## 3.2 Validator-owned stage

A separate field is owned exclusively by trusted Kodac runtime/validator state:

```text
ArtifactValidationStage =
  SUBMITTED_UNTRUSTED
  STRUCTURALLY_ACCEPTED
  REPLAY_CANDIDATE
  REPLAY_VALIDATED
  VALIDATED_REPRODUCER
  REJECTED
  STALE
```

The exact implementation enum may be refined later, but the authority split is mandatory.

Provider/model/CRS/analyzer output cannot set or advance `ArtifactValidationStage`.

## 3.3 Initial mapping

All provider submissions begin as:

```text
stage = SUBMITTED_UNTRUSTED
```

regardless of `providerArtifactType`.

Examples:

```text
providerArtifactType = crash
→ may route dynamic validation
→ does not mean replay validated

providerArtifactType = sanitizer-observation
→ may be high-signal candidate material
→ does not mean causal reproduction

providerArtifactType = pov
→ requires independent replay
→ does not mean proof

providerArtifactType = reproducer
→ remains a claimed reproducer
→ VALIDATED_REPRODUCER only after closed validator replay
```

Finding `technicalEvidenceLevel` remains separately derived by the evidence-transition policy.

## 3.4 Invalid stage claims

If provider-native metadata contains terms such as `validated`, `confirmed`, `proven`, or equivalent, they remain untrusted native metadata and must not be mapped automatically to a trusted stage.

---

# 4. Effective analyzer policy must be receipt-bound

A request records intended constraints. Proof requires knowing what constraints were actually enforced.

Future bounded analyzer execution must therefore distinguish:

```text
REQUESTED POLICY
from
EFFECTIVE ENFORCED POLICY
```

## 4.1 Request

Purpose-equivalent request:

```text
BoundedAnalyzerRequest {
  analyzerIdentity
  analyzerVersionOrDigest
  reviewedHead
  authoritySnapshotIdentity
  policyIdentity
  workingSetManifestDigest
  configDigest
  requestedFilesystemScope
  requestedNetworkPolicy
  requestedCredentialPolicy
  timeout
  maxOutputBytes
  maxMemory?
  maxCpu?
}
```

## 4.2 Trusted runner receipt

The trusted runner must emit a durable/immutable receipt purpose-equivalent to:

```text
AnalyzerEffectivePolicyReceipt {
  receiptIdentity
  requestIdentity
  reviewedHead
  authoritySnapshotIdentity
  policyIdentity

  runnerImplementationIdentity
  runnerArtifactDigest
  sandboxProviderIdentity
  sandboxProviderVersionOrDigest
  sandboxQualificationIdentity?

  materializedRepositoryRootIdentity
  effectiveFilesystemMounts[]
  effectiveWritableMounts[]
  effectiveNetworkPolicy
  effectiveEgressPolicy
  effectiveCredentialSurface
  environmentAllowlistDigest

  timeoutApplied
  outputBoundApplied
  memoryBoundApplied?
  cpuBoundApplied?

  startIdentity
  terminalIdentity
  exitStatus
}
```

## 4.3 Admission comparison

The effective policy may be **equal to or stricter than** the requested trusted policy. It may never be broader.

At minimum:

```text
effective readable/writable filesystem
⊆ trusted requested/admitted filesystem scope

effective network/egress authority
⊆ trusted requested/admitted network authority

effective credential surface
⊆ trusted requested/admitted credential surface
```

Missing effective-policy fields when applicable, unverifiable runner identity, or any widening mismatch means the result is not admitted for finding/evidence use.

```text
MISSING / WIDER / UNATTESTED
→ fail closed for proof-bearing use
```

A runner/provider's self-description is not attestation. The receipt identity must be produced/validated by the trusted Kodac execution boundary appropriate to the future implementation.

---

# 5. Independently mutable analyzer inputs are part of execution identity

`rulesetOrDatabaseDigest?` cannot remain freely optional if rules, vulnerability databases, query packs, models, signatures, or other behavior-driving data can change independently of the executable.

## 5.1 Generalized identity

Replace ambiguous optionality with:

```text
IndependentlyMutableAnalyzerInput {
  kind
  logicalName
  version?
  digest
  provenanceIdentity
}

AnalyzerExecutionManifest {
  ...
  independentlyMutableInputIdentities[]
  ...
}
```

Examples include:

```text
vulnerability database
ruleset
query pack
signature bundle
policy pack
language model artifact when technically used by the analyzer
external semantic database
```

## 5.2 Conditional requirement

If analyzer behavior can vary because an input can change independently of `executableOrImageDigest`, that input identity is **mandatory**.

An empty list is permitted only when analyzer qualification establishes that no independently mutable behavior-driving inputs are applicable for that execution mode.

The qualification result must be explicit and versioned.

## 5.3 Missing identity

```text
independently mutable input exists
AND
identity/digest missing
→ manifest incomplete
→ analyzer result may not influence finding/evidence
```

The result may be retained diagnostically but is not replay-equivalent.

`same analyzer version` is never a substitute for independently mutable data identity.

---

# 6. Analyzer result paths require physical containment

Path string normalization alone does not establish that a path resolves inside the reviewed repository materialization.

Any analyzer-produced path that Kodac intends to dereference, read, write, ingest, attach, or use for proof-bearing source location must pass containment validation.

## 6.1 Materialized root

The trusted execution boundary must establish an immutable/materialization-bound repository root identity:

```text
MaterializedRepositoryRoot {
  rootPath
  rootRealPath
  materializationDigest
  reviewedHead
}
```

## 6.2 Physical path validation

Before dereferencing an analyzer result path:

```text
1. reject NUL/malformed/path-encoding ambiguity;
2. interpret relative paths only relative to the trusted materialized root;
3. resolve lexical normalization;
4. resolve symlinks / filesystem real path for existing targets;
5. obtain the final resolved path used for access;
6. verify final path is root itself or a descendant of rootRealPath;
7. reject/quarantine escape, broken-chain ambiguity, or resolution races;
8. bind the accepted normalized repository-relative location to the result record.
```

Prefix-string comparison is insufficient. Containment must use path-component semantics appropriate to the platform and filesystem.

## 6.3 Symlink rule

A repository symlink whose target resolves outside the materialized root cannot be followed for proof-bearing analyzer result consumption merely because the symlink object itself is inside the repository.

If a future workflow intentionally permits external material, that material requires a separately trusted materialization/admission contract and explicit identity. It is not implicitly part of the repository root.

## 6.4 Logical locations that are not dereferenced

Some analyzer results may refer to logical source locations that are absent from the working materialization, for example deleted files in a diff.

Such locations may be retained only as **inert logical metadata** when they can be bound to a trusted Git/tree/change manifest identity. They must not be dereferenced as filesystem paths and must not bypass the physical-containment rule.

## 6.5 Artifact storage paths

Analyzer/provider-selected output paths may never select arbitrary host destinations.

Trusted artifact storage must choose the destination. Provider-supplied names are metadata only and must be sanitized/bounded. Archive extraction additionally requires path traversal and per-entry/aggregate size defenses already identified by the supplement.

---

# 7. Cross-contract replay identity

A proof-relevant analyzer/Cyber result is replay-equivalent only when the applicable identity tuple remains stable.

Purpose-equivalent tuple:

```text
reviewedHead
+ materializationDigest
+ authoritySnapshotIdentity
+ policyIdentity
+ analyzer/provider implementation identity
+ configuration identity
+ independently mutable input identities
+ requested policy identity
+ effective policy receipt identity
+ resource budget identity
+ input artifact digests
+ context retrieval budget/receipt identity when applicable
```

Changing any applicable element invalidates silent reuse of the old replay/proof claim.

A later run may compare results across identities, but it must describe that as a comparison, not the same execution.

---

# 8. Finding reconciliation

The six fresh exact-head review findings are accepted with the following dispositions:

```text
F1 policy/authority identity binding
= ACCEPT
= corrected by Sections 1 and 7

F2 context byte/symbol/fan-out limits
= ACCEPT
= corrected by Section 2

F3 artifact type vs validator stage ambiguity
= ACCEPT
= corrected by Section 3

F4 effective analyzer policy receipt
= ACCEPT
= corrected by Section 4

F5 independently mutable rules/database identity
= ACCEPT
= corrected by Section 5

F6 physical workspace containment
= ACCEPT
= corrected by Section 6
```

A reviewer summary on the same head also stated that there were no new actionable findings while these six inline threads existed. The inline exact-head findings are the controlling review data for reconciliation.

This is retained as a reviewer-learning example:

```text
REVIEWER_SUMMARY_CAN_BE_INCOMPLETE_RELATIVE_TO_INLINE_FINDINGS
```

Future Kodac reviewer ingestion must reconcile summary-level output against structured inline findings before declaring a review clean.

---

# 9. Required future hostile tests

Any later implementation authorization derived from these contracts should require hostile tests covering at least:

1. same reviewed head under different `policyIdentity` is rejected for replay-equivalence;
2. same policy label with different authority snapshot is rejected;
3. one context round requests excessive symbol count;
4. one huge symbol definition exceeds per-symbol/per-request bytes;
5. fallback symbol resolution creates excessive fan-out;
6. cumulative context budget cannot be reset by repeated symbol requests;
7. provider claims `validated reproducer` but trusted stage remains unvalidated;
8. analyzer requested deny-all egress but runner receipt reports broader network authority;
9. effective writable mount exists outside admitted scope;
10. runner identity/attestation is missing;
11. vulnerability database changes without executable change;
12. rules/database identity is omitted when independently mutable;
13. analyzer result uses `../` traversal;
14. in-root symlink resolves outside materialized root;
15. path changes target between validation and dereference and is rejected/fenced;
16. deleted-file logical location remains inert and cannot trigger host file access;
17. provider-controlled artifact filename cannot select host output destination;
18. malformed/ambiguous paths fail loud/closed;
19. truncated context is never represented as complete context;
20. a review summary cannot erase or hide structured actionable findings.

---

# 10. Final corrected invariants

The PR #121 planning set now includes the following additional invariants:

```text
REVIEWED_HEAD_ALONE != REPLAY_IDENTITY

POLICY_REQUEST != EFFECTIVE_ENFORCEMENT_PROOF

PROVIDER_ARTIFACT_TYPE != VALIDATOR_STAGE

ANALYZER_BINARY_IDENTITY != COMPLETE_ANALYZER_IDENTITY
  when rules/database/model/query inputs can drift independently

PATH_CANONICALIZATION != PHYSICAL_CONTAINMENT

ROUND_BOUND != CONTEXT_RESOURCE_BOUND

REVIEWER_SUMMARY != COMPLETE_REVIEW_STATE
```

Together with the existing invariants:

```text
REQUESTER_LIFETIME != EXPERIMENT_LIFETIME
PROVIDER_OUTPUT != VALIDATED_EVIDENCE
NATIVE_ANALYZER_DETAIL_MUST_SURVIVE_NORMALIZATION
PRE_EXECUTION_IDENTITY_BEFORE_RELEASE
PROCESS_EXISTENCE != PROCESS_GENERATION_IDENTITY
IDENTITY_PROBE_UNAVAILABLE != SUBJECT_MISSING
```

these define the controlling planning boundary for future Cyber/analyzer work.

---

# 11. Stop boundary

This correction stops at planning.

```text
RUNTIME_MUTATION = NONE
DONOR_CODE_INTAKE = NONE
ANALYZER_DEPENDENCY_ADDITION = NONE
CYBER_IMPLEMENTATION = NOT_AUTHORIZED
H6 = NOT_STARTED
H4_R3G_F = NOT_STARTED
BLOCKING_REVIEW_GATE = NOT_AUTHORIZED
MERGE_PR_121 = NOT_AUTHORIZED_BY_THIS_DOCUMENT
```
