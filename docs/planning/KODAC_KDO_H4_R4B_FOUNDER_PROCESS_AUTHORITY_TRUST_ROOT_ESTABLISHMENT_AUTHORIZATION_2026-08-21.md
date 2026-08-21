# KODAC KDO H4-R4B Founder Process-Authority Trust-Root Establishment Authorization

Date: 2026-08-21
Status: AUTHORIZATION_CANDIDATE / DOCS_ONLY / NO_KEY_MATERIAL / NO_PROCESS_EXECUTION

## 1. Purpose

Authorize the smallest safe predecessor required by the canonical H4-R4B offline-artifact authorization before any offline artifact build/test/package process may execute.

This document authorizes a later, separate trust-root establishment slice only. It does **not** establish a trust root itself, does not generate or receive a private key, does not sign an authority record, and does not authorize the offline artifact proof.

Maximum result of this docs-only PR if merged:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT_AUTHORIZATION=CANONICAL
```

It is **not** equivalent to:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=ESTABLISHED
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=PASS
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN
B1_V2_IMPLEMENTATION=AUTHORIZED
H4_COMPLETE=YES
```

---

## 2. Canonical predecessor

This authorization is based on canonical `main`:

```text
MAIN_COMMIT=13559f7397561d62078af94b4717b5f887033369
MAIN_TREE=aa0d94a6b54de92b12d232c1a2b8a086cc9d8a2c
PR_144=MERGED_CANONICAL
PR_144_REVIEWED_HEAD=0a85084b24a7f3c238872b1c4c00f442aca0e94d
```

Canonical PR #144 established:

```text
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_AUTHORIZATION=CANONICAL
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN=NO
```

Its process-authority theorem requires a separately canonical predecessor that establishes an external founder-authentication trust root and verification mechanism before any build/test/package process executes.

---

## 3. Why this slice exists

The canonical offline-artifact authorization deliberately rejects authority derived from:

```text
self-authored candidate records
hashes without authentication
candidate-controlled trust roots
candidate-controlled verifier replacement
unauthenticated current-session text
```

Therefore the next safe action is **not** artifact implementation and is **not** process execution.

The next safe action is to establish a dedicated public verification root whose private half remains solely outside the repository, CI, agents, and ChatGPT, and to canonically freeze the verifier before any artifact candidate exists.

---

## 4. Selected trust mechanism

The selected mechanism is:

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

Rationale:

1. `packages/kodac-runtime/package.json` already requires Node.js `>=24`.
2. Node's built-in cryptographic API supports Ed25519 public-key import and signature verification.
3. Verification can therefore remain offline and dependency-free.
4. Only public verification material needs to become canonical.
5. The private key never needs to enter the repository or automated execution environment.

No alternative algorithm may be substituted in the establishment slice without a new authorization.

---

## 5. Exact Ed25519 public-key encoding

The canonical public key must be an Ed25519 RFC 8410 SubjectPublicKeyInfo DER object.

The accepted DER encoding is exactly 44 bytes:

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

The verifier must import the exact DER bytes as `format=der`, `type=spki`, confirm the resulting asymmetric key type is Ed25519, re-export the key as DER/SPKI, and require byte-for-byte equality with the committed bytes.

Malformed DER, algorithm substitution, unexpected parameters, non-canonical re-encoding, or any key length mismatch must fail closed.

---

## 6. Trust-root identity

The trust-root identity is content-addressed and domain separated:

```text
TRUST_ROOT_ID_DOMAIN=kodac-founder-process-authority-trust-root-id-v1
TRUST_ROOT_ID_PREIMAGE=
  UTF8(TRUST_ROOT_ID_DOMAIN)
  || 0x00
  || SPKI_DER_BYTES
TRUST_ROOT_ID_SHA256=sha256(TRUST_ROOT_ID_PREIMAGE)
```

`TRUST_ROOT_ID_SHA256` is represented as exactly 64 lowercase hexadecimal characters.

The trust-root ID is an integrity identity only. Founder binding is established by the one-time bootstrap procedure below plus canonical founder approval of the establishment PR.

---

## 7. One-time founder bootstrap theorem

There is intentionally no earlier Kodac founder signing key that can authenticate the first trust root without circularity.

Therefore the one-time bootstrap rule is explicit:

```text
BOOTSTRAP_AUTHORITY=FOUNDER_EXPLICIT_CANONICAL_APPROVAL
BOOTSTRAP_PRIVATE_KEY_POSSESSION_PROOF=REQUIRED
BOOTSTRAP_REPOSITORY=TheHalfMoon/Kodac
BOOTSTRAP_PREDECESSOR_COMMIT=13559f7397561d62078af94b4717b5f887033369
```

The future trust-root establishment PR must satisfy both:

1. cryptographic proof that the publisher possesses the private key corresponding to the committed public key; and
2. explicit founder approval and canonical merge of that exact reviewed trust-root candidate.

After that establishment merge, future process-authority records **must** authenticate through the canonical Ed25519 trust root. GitHub authorship, PR ownership, comments, hashes, or merge status alone are not sufficient substitutes for the Ed25519 authority proof.

This bootstrap exception applies only to initial trust-root establishment. It may not be reused to authorize artifact execution.

---

## 8. Establishment possession-proof preimage

The future trust-root record must contain a public possession proof signed outside the repository with the corresponding private key.

The establishment object contains exactly these string fields:

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

Required fixed values:

```text
schemaVersion=kodac-founder-process-authority-trust-root-record-v1
repository=TheHalfMoon/Kodac
authorizationCommit=<canonical merge commit of this authorization PR>
trustRootScheme=kodac-founder-process-authority-ed25519-v1
signatureAlgorithm=Ed25519
```

`challengeNonceHex` must be exactly 64 lowercase hexadecimal characters generated out of band for this establishment attempt and never reused.

`issuedAtUtc` must be an RFC 3339 UTC timestamp with `Z` and second precision.

The possession-proof preimage is:

```text
ESTABLISHMENT_SIGNATURE_DOMAIN=kodac-founder-process-authority-trust-root-establishment-v1
ESTABLISHMENT_OBJECT=<strict object containing exactly the eight fields above>
ESTABLISHMENT_JCS=UTF8(RFC8785_JCS(ESTABLISHMENT_OBJECT))
ESTABLISHMENT_PREIMAGE=
  UTF8(ESTABLISHMENT_SIGNATURE_DOMAIN)
  || 0x00
  || ESTABLISHMENT_JCS
ESTABLISHMENT_PREIMAGE_SHA256=sha256(ESTABLISHMENT_PREIMAGE)
```

The detached establishment signature is:

```text
ESTABLISHMENT_SIGNATURE_ALGORITHM=Ed25519
ESTABLISHMENT_SIGNATURE_BYTES=64
ESTABLISHMENT_SIGNATURE_HEX_CHARS=128
ESTABLISHMENT_SIGNATURE_HEX_CASE=LOWERCASE
```

The Ed25519 signature authenticates **the exact `ESTABLISHMENT_PREIMAGE` bytes**, not a textual display, alternate JSON serialization, or only the SHA-256 digest.

---

## 9. Canonical trust-root record

The future committed trust-root JSON must use RFC 8785 canonical JSON for validation and must contain exactly:

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

Unknown fields are forbidden.

The signature and preimage digest are detached from the signed `establishment` object, preventing self-reference.

The verifier must recompute both content identities from bytes and reject any mismatch.

---

## 10. Future verifier contract

The canonical verifier created by the establishment slice must be test-support code only. It must not change product/runtime behavior.

It must provide fail-closed verification functions for:

```text
verifyTrustRootRecord(...)
verifyProcessAuthorityEnvelope(...)
```

`verifyTrustRootRecord` must prove at least:

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

`verifyProcessAuthorityEnvelope` must implement the canonical PR #144 process-authority theorem without widening it. At minimum it must:

1. accept the canonical trust-root record as an immutable input;
2. reconstruct the exact `kodac-offline-artifact-process-authority-v1` preimage;
3. require the strict authority object field set from canonical PR #144;
4. verify repository, exact-head, scope, trust-root ID, trust-root commit, session ID, nonce, timestamps, and command-manifest digest syntax;
5. verify the detached Ed25519 signature using the canonical trust-root public key;
6. reject unknown fields and alternate serializations;
7. expose no signing or private-key API;
8. perform no network, Docker, registry, subprocess, shell, or filesystem discovery.

The verifier may consume explicitly supplied bytes/objects only.

---

## 11. Restricted canonicalization profile

To avoid requiring a new JSON-canonicalization dependency, the verifier may implement only the exact RFC 8785 subset needed by these contracts.

All signed authority objects are restricted to:

```text
JSON_OBJECT_ONLY=YES
NESTING_IN_SIGNED_AUTHORITY_OBJECT=NO
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

Canonical field ordering must be Unicode-code-point lexicographic ordering as required by RFC 8785. String escaping must match JSON serialization rules. The implementation must include adversarial tests proving reordered keys canonicalize identically while duplicate/unknown/wrong-type inputs fail closed.

No generic JSON canonicalizer is authorized beyond this bounded contract.

---

## 12. Private-key boundary

The future establishment slice is allowed to commit **public** trust-root and public possession-proof material only.

Strict prohibitions:

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

The founder must generate and retain the private key out of band using a trusted local/hardware process outside this authorization. Only the public SPKI DER and public signature may enter the future PR.

Loss or suspected compromise of the private key requires a separately authorized trust-root rotation/revocation slice. Silent replacement is forbidden.

---

## 13. Exact future establishment path allowlist

If this authorization becomes canonical, the later trust-root establishment candidate must change **exactly these four paths**:

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

No subset is sufficient for a positive establishment verdict.

---

## 14. Explicit non-allowed paths and mutations

The trust-root establishment slice may not modify:

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
```

Specifically frozen canonical G0 inputs remain:

```text
packages/kodac-runtime/native/gvisor-workload-gate.c
packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
```

The three future artifact-proof paths authorized by canonical PR #144 are also **not** part of the trust-root establishment slice and must remain untouched.

---

## 15. Required establishment tests

The future test must exercise at least:

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
duplicate JSON key -> FAIL
wrong JSON value type -> FAIL
alternate key ordering -> SAME_CANONICAL_PREIMAGE
private-key-shaped field present -> FAIL
process-authority signature valid under wrong key -> FAIL
process-authority signature mutation -> FAIL
process-authority wrong repository -> FAIL
process-authority wrong trust-root ID -> FAIL
process-authority unknown field -> FAIL
process-authority alternate serialization -> SAME_CANONICAL_PREIMAGE
```

Tests must use only public values. No test fixture may contain founder private-key material.

---

## 16. Evidence requirements

The future evidence document must retain at least:

```text
canonical predecessor main SHA/tree
trust-root candidate exact head SHA/tree
all four changed-path identities
trust-root JSON Git blob SHA
trust-root JSON SHA-256 and byte size
verifier Git blob SHA
verifier SHA-256 and byte size
test Git blob SHA
test SHA-256 and byte size
evidence Git blob SHA when stable/pre-merge form permits
public SPKI DER hex
public SPKI DER SHA-256
trustRootIdSha256
establishment preimage SHA-256
establishment signature hex
Node version used for verification
focused trust-root test result
full required runtime test result
exact-head CI result
fresh independent exact-head review result
unresolved actionable thread count
final main/head diff fence
expected-head SHA merge fence
```

The evidence document must state clearly that the public key and signature are public verification artifacts and that no private key was accessed or retained by repository tooling.

---

## 17. Establishment verdict

The future trust-root establishment candidate may emit the maximum verdict:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=CANONICAL_PROVEN
```

only when all of the following pass on the exact reviewed head:

```text
REQUIRED_FUTURE_PATHS_PRESENT=PASS
CHANGED_PATHS=EXACTLY_4_ALLOWLISTED_PATHS
NO_UNEXPECTED_PATHS=PASS
REQUIRED_FUTURE_PATH_RESOLUTION_PROOF=PASS
TRUST_ROOT_SCHEMA_PROOF=PASS
TRUST_ROOT_PUBLIC_KEY_DER_PROOF=PASS
TRUST_ROOT_ED25519_ALGORITHM_PROOF=PASS
TRUST_ROOT_ID_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_PREIMAGE_PROOF=PASS
TRUST_ROOT_ESTABLISHMENT_SIGNATURE_PROOF=PASS
TRUST_ROOT_PRIVATE_MATERIAL_ABSENCE_PROOF=PASS
PROCESS_AUTHORITY_VERIFIER_CONTRACT_TESTS=PASS
FOCUSED_LOCAL_TESTS=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If any predicate is absent or fails:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
```

---

## 18. Authority after trust-root establishment

Even after a trust root is canonical, artifact execution does **not** become automatically authorized.

A later artifact candidate still requires a fresh, single-use, founder-signed current-session process-authority envelope bound to:

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

The canonical verifier must validate that envelope before the first process launches. Post-execution process-tree conformance remains separately required exactly as defined by canonical PR #144.

---

## 19. Explicit non-grants in this authorization PR

This docs-only PR grants none of the following:

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

## 20. Merge gate for this docs-only authorization

This authorization PR may merge only if:

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

If `main` moves, stop and reconcile the exact predecessor before merge.

No positive trust-root establishment claim may be made from this docs-only authorization alone.

---

## 21. Final authorization statement

If and only if this document becomes canonical, the next bounded slice may establish a dedicated Ed25519 founder process-authority trust root and dependency-free offline verifier under the exact four-path allowlist above.

The private key remains exclusively out of band and outside all repository/CI/agent/ChatGPT authority.

Until the later establishment slice itself is exact-head reviewed, proven, and canonically merged:

```text
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT=NOT_PROVEN
CURRENT_SESSION_PROCESS_AUTHORITY_PROOF=FAIL
ARTIFACT_PROCESS_EXECUTION=FORBIDDEN
TRUSTED_GATE_OFFLINE_ARTIFACT_PACKAGE_PROVEN=NO
```
