# KODAC KDO H4-R4B Founder Process-Authority Trust-Root Establishment Authorization

Date: 2026-08-21
Status: AUTHORIZATION_CANDIDATE / DOCS_ONLY / NO_KEY_MATERIAL / NO_PROCESS_EXECUTION

## 1. Purpose

Authorize the smallest safe predecessor required by the canonical H4-R4B offline-artifact authorization before any offline artifact build/test/package process may execute.

This document authorizes a later, separate trust-root establishment slice only. It does **not** establish a trust root itself, generate or receive a private key, sign an authority record, or authorize the offline artifact proof.

Maximum result of this docs-only PR if merged:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT_AUTHORIZATION=CANONICAL
```

It is not equivalent to:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=ESTABLISHED
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=PASS
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN
B1_V2_IMPLEMENTATION=AUTHORIZED
H4_COMPLETE=YES
```

---

## 2. Canonical predecessor

```text
MAIN_COMMIT=13559f7397561d62078af94b4717b5f887033369
MAIN_TREE=aa0d94a6b54de92b12d232c1a2b8a086cc9d8a2c
PR_144=MERGED_CANONICAL
PR_144_REVIEWED_HEAD=0a85084b24a7f3c238872b1c4c00f442aca0e94d
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_AUTHORIZATION=CANONICAL
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN=NO
```

Canonical PR #144 requires a separately canonical predecessor that establishes an external founder-authentication trust root and verification mechanism before any build/test/package process executes.

---

## 3. Why this slice exists

The canonical artifact authorization rejects process authority derived from:

```text
self-authored candidate records
hashes without authentication
candidate-controlled trust roots
candidate-controlled verifier replacement
unauthenticated current-session text
```

Therefore the next safe action is not artifact implementation or process execution. It is a dedicated public verification root whose private half remains outside the repository, CI, agents, and ChatGPT, plus a verifier frozen before any artifact candidate exists.

---

## 4. Selected trust mechanism

```text
TRUST_ROOT_SCHEME=kodac-founder-process-authority-ed25519-v1
SIGNATURE_ALGORITHM=Ed25519
VERIFICATION_RUNTIME=Node.js built-in node:crypto
PUBLIC_KEY_CONTAINER=RFC8410 SubjectPublicKeyInfo DER
PUBLIC_KEY_TEXT_ENCODING=lowercase hexadecimal
PRIVATE_KEY_IN_REPOSITORY=FORBIDDEN
PRIVATE_KEY_IN_GITHUB_ACTIONS=FORBIDDEN
PRIVATE_KEY_IN_CHATGPT_OR_AGENT_CONTEXT=FORBIDDEN
NEW_RUNTIME_DEPENDENCY=FORBIDDEN
NETWORK_VERIFICATION=FORBIDDEN
```

`packages/kodac-runtime/package.json` already requires Node.js `>=24`, and the selected verifier uses only the built-in cryptographic API. No alternative algorithm may be substituted without a new authorization.

---

## 5. Exact Ed25519 public-key encoding

The canonical public key must be an Ed25519 RFC 8410 SubjectPublicKeyInfo DER object exactly 44 bytes long:

```text
302a300506032b6570032100 || RAW_ED25519_PUBLIC_KEY_32_BYTES
```

Requirements:

```text
SPKI_DER_BYTES=44
SPKI_ALGORITHM_OID=1.3.101.112
SPKI_PARAMETERS=ABSENT
RAW_PUBLIC_KEY_BYTES=32
PUBLIC_KEY_HEX_CHARS=88
PUBLIC_KEY_HEX_CASE=LOWERCASE
PUBLIC_KEY_HEX_PREFIX=FORBIDDEN
WHITESPACE_IN_KEY_HEX=FORBIDDEN
```

The verifier must import the exact bytes as DER/SPKI, confirm `asymmetricKeyType=ed25519`, re-export DER/SPKI, and require byte-for-byte equality. Malformed DER, algorithm substitution, unexpected parameters, non-canonical re-encoding, or length mismatch fails closed.

---

## 6. Trust-root identity

```text
TRUST_ROOT_ID_DOMAIN=kodac-founder-process-authority-trust-root-id-v1
TRUST_ROOT_ID_PREIMAGE=
  UTF8(TRUST_ROOT_ID_DOMAIN)
  || 0x00
  || SPKI_DER_BYTES
TRUST_ROOT_ID_SHA256=sha256(TRUST_ROOT_ID_PREIMAGE)
```

`TRUST_ROOT_ID_SHA256` is exactly 64 lowercase hexadecimal characters.

The ID proves content identity only. Founder binding comes from the one-time bootstrap theorem plus private-key possession proof.

---

## 7. One-time founder bootstrap theorem

There is no earlier Kodac founder signing key that can authenticate the first trust root without circularity. The bootstrap exception is therefore explicit and one-time:

```text
BOOTSTRAP_AUTHORITY=FOUNDER_EXPLICIT_CANONICAL_APPROVAL
BOOTSTRAP_FOUNDER_GITHUB_LOGIN=TheHalfMoon
BOOTSTRAP_PRIVATE_KEY_POSSESSION_PROOF=REQUIRED
BOOTSTRAP_APPROVAL_RECORD=REQUIRED
BOOTSTRAP_APPROVAL_RECORD_BINDS_EXACT_HEAD=YES
BOOTSTRAP_APPROVAL_RECORD_BINDS_TRUST_ROOT_ID=YES
BOOTSTRAP_APPROVAL_RECORD_BINDS_SPKI_SHA256=YES
BOOTSTRAP_APPROVAL_RECORD_BINDS_ESTABLISHMENT_PREIMAGE_SHA256=YES
BOOTSTRAP_REPOSITORY=TheHalfMoon/Kodac
BOOTSTRAP_PREDECESSOR_COMMIT=13559f7397561d62078af94b4717b5f887033369
```

The future trust-root establishment PR must satisfy all of the following:

1. cryptographic proof of possession of the private key corresponding to the committed public key;
2. exact-head CI and independent review on the trust-root candidate;
3. after the candidate head is frozen, a top-level PR comment authored by GitHub login `TheHalfMoon` containing exactly these binding lines:

```text
FOUNDER_TRUST_ROOT_BOOTSTRAP_APPROVAL=EXPLICIT
REPOSITORY=TheHalfMoon/Kodac
EXACT_HEAD=<exact reviewed trust-root candidate head SHA>
TRUST_ROOT_ID_SHA256=<64 lowercase hex chars>
PUBLIC_KEY_SPKI_DER_SHA256=<64 lowercase hex chars>
ESTABLISHMENT_PREIMAGE_SHA256=<64 lowercase hex chars>
```

4. evidence that the comment author login, comment ID/URL, timestamp, exact head, trust-root ID, SPKI digest, and establishment-preimage digest all match the candidate; and
5. expected-head fenced canonical merge of that exact candidate.

The approval comment is the one-time governance bootstrap binding of the public key to founder authority. It does not replace the Ed25519 signature or prove later process authority.

After the trust root becomes canonical, GitHub authorship, comments, PR ownership, hashes, or merge status alone are never sufficient for process authority; later authority records must verify under the canonical Ed25519 key.

This bootstrap exception may not be reused for artifact execution or trust-root rotation.

---

## 8. Establishment possession-proof preimage

The future trust-root record must contain a public possession proof signed out of band with the corresponding private key.

The establishment object contains exactly **nine** string fields:

```text
schemaVersion
repository
authorizationCommit
trustRootScheme
signatureAlgorithm
publicKeySpkiDerHex
trustRootIdSha256
challengeNonceHex
issuedAtUtc
```

Fixed values:

```text
schemaVersion=kodac-founder-process-authority-trust-root-record-v1
repository=TheHalfMoon/Kodac
authorizationCommit=<canonical merge commit of this authorization PR>
trustRootScheme=kodac-founder-process-authority-ed25519-v1
signatureAlgorithm=Ed25519
```

`challengeNonceHex` is exactly 64 lowercase hexadecimal characters generated out of band for this establishment attempt.

The establishment nonce lifecycle is fail-closed and single-use:

```text
ESTABLISHMENT_NONCE_SINGLE_USE=REQUIRED
ESTABLISHMENT_NONCE_SCOPE=ONE_EXACT_ESTABLISHMENT_PREIMAGE_ONLY
ESTABLISHMENT_NONCE_CONSUMED_AT=FIRST_ESTABLISHMENT_SIGNATURE_CREATION
ESTABLISHMENT_NONCE_REUSE_WITH_DIFFERENT_PREIMAGE=FORBIDDEN
ABANDONED_OR_FAILED_ESTABLISHMENT_NONCE_REUSE=FORBIDDEN
CANONICALIZED_ESTABLISHMENT_NONCE_REUSE=FORBIDDEN
```

A consumed nonce may remain attached to the exact same signed establishment preimage while an otherwise unrelated candidate-head repair is reviewed, but it may never authenticate a different establishment preimage. If the trust-root record's signed `establishment` object changes for any reason, a fresh nonce and fresh Ed25519 signature are required. If an establishment attempt is abandoned or fails before canonical merge, its nonce is retired permanently.

`issuedAtUtc` is RFC 3339 UTC with `Z` and second precision.

Normative preimage:

```text
ESTABLISHMENT_SIGNATURE_DOMAIN=kodac-founder-process-authority-trust-root-establishment-v1
ESTABLISHMENT_OBJECT=<strict object containing exactly the nine fields above>
ESTABLISHMENT_JCS=UTF8(RFC8785_JCS(ESTABLISHMENT_OBJECT))
ESTABLISHMENT_PREIMAGE=
  UTF8(ESTABLISHMENT_SIGNATURE_DOMAIN)
  || 0x00
  || ESTABLISHMENT_JCS
ESTABLISHMENT_PREIMAGE_SHA256=sha256(ESTABLISHMENT_PREIMAGE)
```

Detached signature:

```text
ESTABLISHMENT_SIGNATURE_ALGORITHM=Ed25519
ESTABLISHMENT_SIGNATURE_BYTES=64
ESTABLISHMENT_SIGNATURE_HEX_CHARS=128
ESTABLISHMENT_SIGNATURE_HEX_CASE=LOWERCASE
```

The Ed25519 signature authenticates the exact `ESTABLISHMENT_PREIMAGE` bytes, not an alternate serialization or only its digest.

---

## 9. Canonical trust-root record

The future committed trust-root JSON must contain exactly:

```json
{
  "establishment": {
    "authorizationCommit": "<canonical authorization merge SHA>",
    "challengeNonceHex": "<64 lowercase hex chars>",
    "issuedAtUtc": "<RFC3339 UTC Z second precision>",
    "publicKeySpkiDerHex": "<88 lowercase hex chars>",
    "repository": "TheHalfMoon/Kodac",
    "schemaVersion": "kodac-founder-process-authority-trust-root-record-v1",
    "signatureAlgorithm": "Ed25519",
    "trustRootIdSha256": "<64 lowercase hex chars>",
    "trustRootScheme": "kodac-founder-process-authority-ed25519-v1"
  },
  "establishmentPreimageSha256": "<64 lowercase hex chars>",
  "establishmentSignatureHex": "<128 lowercase hex chars>"
}
```

Unknown fields are forbidden. The digest and signature remain detached from the signed `establishment` object, preventing self-reference.

---

## 10. Future verifier contract

The verifier created by the establishment slice is test-support code only and must not change product/runtime behavior.

Required functions:

```text
verifyTrustRootRecord(...)
verifyProcessAuthorityEnvelope(...)
```

For every JSON trust record or authority envelope arriving from repository/file/evidence bytes, the authoritative verifier input is the **original UTF-8 JSON byte sequence**, not an ordinary pre-parsed JavaScript object. Duplicate-member detection must occur while parsing those source bytes and before any object materialization is trusted for schema validation or canonicalization.

Required input theorem:

```text
RAW_UTF8_JSON_INPUT_REQUIRED=YES
UTF8_VALIDITY_PROOF=PASS
DUPLICATE_MEMBER_REJECTION_BEFORE_CANONICALIZATION=REQUIRED
DUPLICATE_MEMBER_REJECTION_AT_EVERY_OBJECT_DEPTH=REQUIRED
ORDINARY_PREPARSED_OBJECT_INPUT=FORBIDDEN
```

An internal parsed object may be passed between verifier helpers only as an opaque value produced by the same duplicate-rejecting parser together with its bound source-byte digest/provenance. Callers may not supply a plain object and assert that duplicates were absent. `JSON.parse` alone is insufficient because duplicate members are already lost before schema validation.

`verifyTrustRootRecord` must prove:

```text
TRUST_ROOT_SCHEMA_PROOF=PASS
TRUST_ROOT_UNKNOWN_FIELDS_ZERO_PROOF=PASS
TRUST_ROOT_PUBLIC_KEY_DER_PROOF=PASS
TRUST_ROOT_ED25519_ALGORITHM_PROOF=PASS
TRUST_ROOT_ID_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_JCS_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_PREIMAGE_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_SIGNATURE_PROOF=PASS
TRUST_ROOT_PRIVATE_MATERIAL_ABSENCE_PROOF=PASS
```

`verifyProcessAuthorityEnvelope` must implement canonical PR #144 without widening it. It must at minimum:

1. accept the canonical trust-root record as immutable raw UTF-8 JSON bytes and verify it through the duplicate-rejecting input path;
2. accept the authority envelope as original raw UTF-8 JSON bytes and reject duplicate members before semantic extraction;
3. reconstruct the exact `kodac-offline-artifact-process-authority-v1` preimage;
4. require the exact authority field set from canonical PR #144;
5. validate repository, exact head, scope, trust-root ID/commit, session ID, nonce, timestamps, and command-manifest digest syntax;
6. verify the detached Ed25519 signature using the canonical public key;
7. reject unknown fields and alternate semantic field sets;
8. expose no signing/private-key API; and
9. perform no network, Docker, registry, subprocess, shell, or filesystem discovery.

The verifier consumes explicitly supplied bytes only at its external trust boundaries. Internal helper objects are permitted only when they carry provenance from the duplicate-rejecting parser for those exact source bytes.

---

## 11. Restricted RFC 8785 profile

No new JSON-canonicalization dependency is authorized. The verifier may implement only the exact RFC 8785 subset required by these contracts.

The outer trust-root record may contain the single nested `establishment` object defined in Section 9. Duplicate-member rejection applies recursively to the complete raw JSON input before any nested object is trusted.

For each **signed flat object** (`establishment` and the canonical PR #144 authority object):

```text
JSON_OBJECT_ONLY=YES
NESTING_IN_SIGNED_OBJECT=NO
VALUE_TYPES=STRING_ONLY
DUPLICATE_KEYS=FORBIDDEN
UNKNOWN_KEYS=FORBIDDEN
NON_ASCII_FIELD_NAMES=FORBIDDEN
NUMBER_VALUES=FORBIDDEN
BOOLEAN_VALUES=FORBIDDEN
NULL_VALUES=FORBIDDEN
ARRAY_VALUES=FORBIDDEN
OBJECT_VALUES=FORBIDDEN
```

RFC 8785 property-name ordering is normative: sort property names by the raw, unescaped **UTF-16 code units** of the names. The current signed field-name allowlists are ASCII-only, so their observed ordering is the same, but implementations must not replace the RFC 8785 rule with a Unicode-code-point comparator. String serialization/escaping must follow RFC 8785's ECMAScript-compatible JSON string serialization rules without Unicode normalization.

Adversarial tests must prove reordered keys produce the same canonical preimage while duplicate, unknown, wrong-type, or malformed raw JSON inputs fail closed.

---

## 12. Private-key boundary

Only public trust-root and public possession-proof material may enter the future establishment PR.

```text
PRIVATE_KEY_FILE_IN_REPO=0
PRIVATE_KEY_BYTES_IN_REPO=0
PRIVATE_KEY_SEED_IN_REPO=0
PRIVATE_KEY_ENVIRONMENT_VARIABLE=0
PRIVATE_KEY_GITHUB_SECRET=0
PRIVATE_KEY_ACTIONS_SECRET=0
PRIVATE_KEY_LOG_OUTPUT=0
PRIVATE_KEY_TEST_FIXTURE=0
PRIVATE_KEY_CHAT_OR_AGENT_CONTEXT=0
PRIVATE_KEY_GENERATION_BY_CI=0
PRIVATE_KEY_GENERATION_BY_CHATGPT=0
PRIVATE_KEY_GENERATION_BY_AGENT=0
SIGNING_BY_CI=0
SIGNING_BY_CHATGPT=0
SIGNING_BY_AGENT=0
```

The founder generates and retains the private key out of band using a trusted local/hardware process. Only the public SPKI DER and public signature may enter the future PR.

Loss or suspected compromise requires a separately authorized rotation/revocation slice. Silent replacement is forbidden.

---

## 13. Exact future establishment path allowlist

If this authorization becomes canonical, the later establishment candidate must change exactly these four paths:

```text
1. provenance/kdo-h4-r4b-founder-process-authority-trust-root-v1.json
2. packages/kodac-runtime/test/helpers/kdo-h4-r4b-founder-process-authority-verifier.ts
3. packages/kodac-runtime/test/kdo-h4-r4b-founder-process-authority-trust-root.test.ts
4. docs/planning/KODAC_KDO_H4_R4B_FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_EVIDENCE_2026-08-21.md
```

Required path theorem:

```text
REQUIRED_FUTURE_PATHS_PRESENT=PASS
CHANGED_PATHS=EXACTLY_4_ALLOWLISTED_PATHS
NO_UNEXPECTED_PATHS=PASS
REQUIRED_FUTURE_PATH_OBJECT_TYPES=REGULAR_BLOBS
REQUIRED_FUTURE_PATH_GIT_MODE=100644
REQUIRED_FUTURE_PATH_SYMLINKS=0
REQUIRED_FUTURE_PATH_GITLINKS=0
REQUIRED_FUTURE_PATH_RESOLUTION_PROOF=PASS
```

A subset is insufficient.

---

## 14. Forbidden mutations in the establishment slice

The later trust-root establishment slice may not modify:

```text
packages/kodac-runtime/src/**
packages/kodac-runtime/native/**
packages/kodac-runtime/package.json
packages/kodac-runtime/tsconfig.json
package-manager manifests or lockfiles
pyproject.toml
uv.lock
.github/**
schema/**
Dockerfiles or container configuration
canonical G0 source
canonical G0 test
PR #144 canonical authorization document
the three artifact-proof paths authorized by PR #144
```

Frozen G0 inputs remain:

```text
packages/kodac-runtime/native/gvisor-workload-gate.c
packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
```

---

## 15. Required establishment tests

The future test must cover at least:

```text
valid canonical trust-root record -> PASS
one-bit public-key mutation -> FAIL
wrong DER prefix/OID -> FAIL
unexpected SPKI parameters -> FAIL
wrong key length -> FAIL
uppercase or malformed hex -> FAIL
trust-root ID mismatch -> FAIL
establishment preimage digest mismatch -> FAIL
establishment signature mutation -> FAIL
wrong establishment domain -> FAIL
wrong repository -> FAIL
wrong authorization commit -> FAIL
unknown root JSON field -> FAIL
unknown establishment field -> FAIL
duplicate root JSON member in raw UTF-8 bytes -> FAIL
duplicate establishment JSON member in raw UTF-8 bytes -> FAIL
duplicate process-authority JSON member in raw UTF-8 bytes -> FAIL
plain pre-parsed object without duplicate-rejecting-parser provenance -> FAIL
wrong JSON value type -> FAIL
alternate key ordering -> SAME_CANONICAL_PREIMAGE
RFC8785 UTF-16 property ordering test vector -> PASS
private-key-shaped field present -> FAIL
same establishment nonce + exact same establishment preimage -> SAME_SIGNED_RECORD_ONLY
same establishment nonce + different establishment preimage -> FAIL
retired/abandoned establishment nonce reused -> FAIL
process-authority signature valid under wrong key -> FAIL
process-authority signature mutation -> FAIL
process-authority wrong repository -> FAIL
process-authority wrong trust-root ID -> FAIL
process-authority unknown field -> FAIL
process-authority alternate key ordering -> SAME_CANONICAL_PREIMAGE
```

Tests use public values only. No fixture may contain founder private-key material.

---

## 16. Evidence requirements

The future evidence document must retain at least:

```text
canonical predecessor main SHA/tree
trust-root candidate exact head SHA/tree
all four changed-path identities
trust-root JSON Git blob SHA/SHA-256/bytes
verifier Git blob SHA/SHA-256/bytes
test Git blob SHA/SHA-256/bytes
public SPKI DER hex
public SPKI DER SHA-256
trustRootIdSha256
establishment challenge nonce hex
establishment nonce single-use/retirement disposition
establishment preimage SHA-256
establishment signature hex
founder bootstrap approval comment author login
founder bootstrap approval comment ID/URL/timestamp
founder bootstrap approval exact-head binding
founder bootstrap approval trust-root-ID binding
founder bootstrap approval SPKI-digest binding
founder bootstrap approval establishment-preimage binding
Node version used for verification
focused trust-root test result
full required runtime test result
exact-head CI result
fresh independent exact-head review result
unresolved actionable thread count
final main/head diff fence
expected-head SHA merge fence
```

The evidence must state that the public key/signature are public verification artifacts and that repository tooling accessed no private key.

---

## 17. Future establishment verdict

The later trust-root candidate may emit:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=CANONICAL_PROVEN
```

only when all predicates pass on the exact reviewed head:

```text
REQUIRED_FUTURE_PATHS_PRESENT=PASS
CHANGED_PATHS=EXACTLY_4_ALLOWLISTED_PATHS
NO_UNEXPECTED_PATHS=PASS
REQUIRED_FUTURE_PATH_RESOLUTION_PROOF=PASS
TRUST_ROOT_SCHEMA_PROOF=PASS
TRUST_ROOT_UNKNOWN_FIELDS_ZERO_PROOF=PASS
TRUST_ROOT_PUBLIC_KEY_DER_PROOF=PASS
TRUST_ROOT_ED25519_ALGORITHM_PROOF=PASS
TRUST_ROOT_ID_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_JCS_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_PREIMAGE_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_SIGNATURE_PROOF=PASS
TRUST_ROOT_PRIVATE_MATERIAL_ABSENCE_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_NONCE_SINGLE_USE_PROOF=PASS
PROCESS_AUTHORITY_VERIFIER_CONTRACT_TESTS=PASS
FOUNDER_BOOTSTRAP_APPROVAL_PROOF=PASS
FOCUSED_LOCAL_TESTS=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

`PROCESS_AUTHORITY_VERIFIER_CONTRACT_TESTS=PASS` additionally requires the raw-UTF-8 duplicate-rejecting input theorem and the RFC 8785 UTF-16 ordering test vector to pass; it may not be used to hide or substitute for any explicit trust-root predicate listed above.

If any predicate is absent or fails:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

---

## 18. Authority after establishment

Even after the trust root is canonical, artifact execution is not automatically authorized.

A later artifact candidate requires a fresh single-use founder-signed authority envelope bound to:

```text
repository=TheHalfMoon/Kodac
exact artifact candidate head SHA
OFFLINE_ARTIFACT_BUILD_TEST_PACKAGE_ONLY scope
fresh session ID
fresh nonce
issued/expiry timestamps
exact command-manifest SHA-256
canonical trust-root ID
canonical trust-root commit
```

The canonical verifier validates that envelope before the first process launch. Post-execution process-tree conformance remains required exactly as canonical PR #144 defines it.

---

## 19. Explicit non-grants in this docs-only PR

```text
TRUST_ROOT_KEY_GENERATION=NO
TRUST_ROOT_PRIVATE_KEY_ACCESS=NO
TRUST_ROOT_SIGNING=NO
TRUST_ROOT_ESTABLISHMENT_IMPLEMENTATION=NOT_IN_THIS_PR
CURRENT_SESSION_PROCESS_AUTHORITY=NOT_GRANTED
OFFLINE_ARTIFACT_BUILD_EXECUTION=NO
OFFLINE_ARTIFACT_TEST_EXECUTION=NO
OFFLINE_ARTIFACT_PACKAGE_EXECUTION=NO
DOCKER_BUILD=NO
DOCKER_LOAD=NO
DOCKER_PULL=NO
DOCKER_PUSH=NO
DOCKER_CREATE=NO
DOCKER_START=NO
DOCKER_ATTACH=NO
DOCKER_EXEC=NO
RUNSC_EXECUTION=NO
GVISOR_SANDBOX_CREATION=NO
GO_DISPATCH_OVER_DOCKER=NO
WORKLOAD_EXECUTION=NO
TTL_ARM_BY_B2B=NO
R3G_F_E4=NO
B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED
H4_COMPLETE=NO
```

---

## 20. Merge gate for this authorization PR

This docs-only authorization may merge only if:

```text
CHANGED_PATHS=EXACTLY_1_DOC
RUNTIME_CHANGES=0
TEST_CHANGES=0
NATIVE_CHANGES=0
SCHEMA_CHANGES=0
WORKFLOW_CHANGES=0
DEPENDENCY_CHANGES=0
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If `main` moves, stop and reconcile the exact predecessor. No positive trust-root establishment claim may be made from this authorization alone.

---

## 21. Final authorization statement

If and only if this document becomes canonical, the next bounded slice may establish a dedicated Ed25519 founder process-authority trust root and dependency-free offline verifier under the exact four-path allowlist above.

The private key remains exclusively out of band and outside all repository/CI/agent/ChatGPT authority.

Until the later establishment slice is exact-head reviewed, proven, founder-bootstrap approved, and canonically merged:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=FAIL
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN=NO
```