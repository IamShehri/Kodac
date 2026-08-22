# KODAC KDO H4-R4B Phase-B AG1-A — Source Provenance + Offline-Test Independent Review

Date: 2026-08-22

Status: **FAIL — REPAIR REQUIRED — NOT CANONICAL — AG1-B BLOCKED**

This document is the separate independent-review slice required after AG1-A source implementation. It reviews the exact source candidate and the reported offline-test evidence. It does **not** authorize or perform GitHub App registration/installation, secret generation/access, deployment, PostgreSQL provisioning, reviewer qualification, protected-main mutation, trust-root establishment, B1-v2/B2A-v2/B2B, or H4 completion.

## 1. Canonical predecessor and exact review candidate

Canonical Kodac predecessor at review start:

```text
KODAC_REPOSITORY=TheHalfMoon/Kodac
KODAC_CANONICAL_MAIN=fdbf5eeb3d0598cb8c9e84e3dd8ce49d5a69f5ae
KODAC_CANONICAL_MAIN_TREE=6fcd1f6e881e854d70ba0488b4b0da4fcd4a79c5
PHASE_B_AG1A_APP_SOURCE_IMPLEMENTATION_AUTHORIZATION=CANONICAL
```

Exact source candidate reviewed:

```text
APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_REPOSITORY_ID=1342309131
APP_SOURCE_OWNER=TheHalfMoon
APP_SOURCE_OWNER_TYPE=User
APP_SOURCE_VISIBILITY=public
APP_SOURCE_FORK=NO
APP_SOURCE_DEFAULT_BRANCH=main
APP_SOURCE_EXACT_COMMIT=c287912593c224aedc5c2c47c7914613f225d119
APP_SOURCE_EXACT_TREE=94abe16b4466d04472d9c087c5b725e80ddd95ac
APP_SOURCE_ROOT_PARENT_COUNT=0
APP_SOURCE_CHANGED_PATH_COUNT=51
```

GitHub live verification confirmed that `main` resolves to the exact commit/tree above and that the commit is a true root commit (`parents=[]`). The exact tree contains the authorized 51-file source surface and no `.github/workflows/**`, Dockerfile, or Containerfile.

## 2. Reported offline qualification evidence

The AG1-A execution session reported the following exact-toolchain gates on the candidate source before publication:

```text
GO_TOOLCHAIN_EXACT=go1.26.6
GOTOOLCHAIN=local
GOPROXY=off
GOFLAGS=-mod=readonly

go version=PASS
go env GOTOOLCHAIN=PASS
go mod verify=PASS
go vet ./...=PASS
go test -count=1 ./...=PASS
go test -shuffle=on -count=20 ./...=PASS
```

Reported provenance digests:

```text
APP_RUNTIME_MANIFEST_SHA256=381290fbfea115fe93c10e77725de5e84f7639a8a988f26ade8592c97898c028
APP_LOCKFILE_SHA256=61d5207e47bff43ca363100b1e5def5ffdc6673016b08ff38c85ba09fea5d56e
APP_BUILD_RECIPE_SHA256=81d0cf61a4fc416fe15b76d32f5bf16bcc3a04a2ff4df7fc7639cdded6cded40
DIRECT_RUNTIME_DEPENDENCY_SET_SHA256=e630ae668bf8424ae7a4821a34b0348e18560ad4ef9df6d2d9a030031b3ab839
APP_TEST_LOG_SHA256=e8e9bb87a8d32ab4a70c679a60941054f043fb5584ba6d4f084d09d226847365
APP_TEST_EVIDENCE_SHA256=813b5f4b662e33af908633f246c33e900bf1c8a7cbb9564d81880401ea867469
```

The test process passing is accepted as execution evidence only. Passing tests do not override semantic gaps in the tests or source contract discovered below.

## 3. Independent review PASS findings

```text
IR-P01_REPOSITORY_IDENTITY=PASS
IR-P02_ROOT_COMMIT_NO_HISTORY=PASS
IR-P03_EXACT_TREE_BINDING=PASS
IR-P04_AUTHORIZED_51_PATH_SURFACE=PASS
IR-P05_NO_WORKFLOW_PATH=PASS
IR-P06_NO_CONTAINERFILE_OR_DOCKERFILE=PASS
IR-P07_GO_MODULE_IDENTITY=PASS
IR-P08_GO_TOOLCHAIN_PIN=PASS
IR-P09_DIRECT_RUNTIME_DEPENDENCY_FAMILY_COUNT=1
IR-P10_DIRECT_RUNTIME_DEPENDENCY=github.com/jackc/pgx/v5@v5.10.0
IR-P11_REVIEWER_ALLOWLIST_EMPTY=PASS
IR-P12_REAL_APP_CREDENTIALS_IN_SOURCE=NO_OBSERVED
IR-P13_DEPLOYMENT_MUTATION=NO
IR-P14_POSTGRESQL_PROVISIONING=NO
IR-P15_KODAC_MAIN_MOVED_DURING_IMPLEMENTATION=NO
```

These PASS findings are necessary but not sufficient for canonical AG1-A proof.

## 4. Material blockers

### IR-F01 — GitHub REST endpoint allowlist is wider than the authorized four operations

**Severity: MATERIAL / SECURITY BOUNDARY**

`internal/githubapi/client.go` uses prefix/suffix matching in `Client.allowed`:

```text
POST + HasPrefix(/app/installations/) + HasSuffix(/access_tokens)
GET  + HasPrefix(/repos/TheHalfMoon/Kodac/pulls/)
```

The GET rule admits unauthorized adjacent paths such as pull reviews/comments/other descendants. The installation-token rule also admits extra path segments between the installation prefix and `/access_tokens`. This violates the exact REST surface contract and means T055 does not prove the required endpoint allowlist theorem.

Required repair:

```text
- accept only POST /app/installations/{positive-decimal-installation-id}/access_tokens
- accept only GET /repos/TheHalfMoon/Kodac/pulls/{positive-decimal-pull-number}
- accept only GET /repos/TheHalfMoon/Kodac/pulls/{positive-decimal-pull-number}/files
- accept only POST /repos/TheHalfMoon/Kodac/check-runs
- reject every adjacent/subpath/suffix variation
- extend T055 with positive and negative exact-path vectors
```

### IR-F02 — Receipt canonicalization is not the authorized UTF-8/RFC8785-compatible string domain

**Severity: MATERIAL / CRYPTOGRAPHIC PREIMAGE**

`internal/receipt/canonical.go::CanonicalObject` rejects every value containing a rune greater than ASCII 127. The authorization requires UTF-8 receipt strings and RFC8785-compatible canonical bytes. Restricting values to ASCII is not an authorized substitute for proving the required canonicalization domain.

The current serializer also relies on Go JSON string encoding for values while avoiding difficult Unicode cases by rejecting them. That does not prove RFC8785-compatible behavior for the authorized UTF-8 domain.

Required repair:

```text
- accept valid UTF-8 strings rather than ASCII-only values
- retain unsigned UTF-16 code-unit ordering for member names
- implement/prove RFC8785-compatible string escaping without adding an unauthorized JCS dependency
- reject invalid UTF-8
- add exact Unicode vectors, including control escapes and U+2028/U+2029 behavior
- preserve byte-for-byte deterministic preimages and SHA-256 digests
```

### IR-F03 — T039/T040 do not prove exact committed canonical receipt vectors

**Severity: MATERIAL / TEST ORACLE**

The mandatory matrix requires:

```text
T039 review receipt exact-field canonical vector -> exact bytes/digest
T040 founder receipt exact-field canonical vector -> exact bytes/digest
```

Current tests do not do that:

- T039 canonicalizes an in-memory map twice and checks only that the two byte slices are equal.
- T040 checks only that canonical founder output is non-empty.
- `testdata/receipts/founder_receipt_vector.json` and `review_receipt_vector.json` are not consumed by the tests and contain placeholder values rather than grammar-valid exact canonical vectors.

Required repair:

```text
- replace placeholder receipt vectors with fixed, valid, synthetic, grammar-conformant vectors
- bind expected canonical object bytes
- bind expected domain-separated preimage bytes
- bind expected SHA-256 digest
- make T039/T040 read the committed vectors and compare byte-for-byte against fixed expected outputs
```

### IR-F04 — Receipt field-specific grammar and schema validation are incomplete

**Severity: MATERIAL / RECEIPT AUTHORITY**

`FounderFromEvent` validates founder login/user ID, head syntax, and exact bootstrap body, but does not comprehensively validate the grammar of every receipt field before canonical receipt creation. Examples include source IDs/node IDs, RFC3339 timestamps, webhook payload digest grammar, positive app/installation identifiers, and other exact string domains.

`ParseReview` accepts any `schemaVersion` string after field-name/type checking; `CanonicalReview` and `CanonicalFounder` do not themselves enforce that the supplied schema version equals the correct receipt domain.

Required repair:

```text
- define field-specific validators for every founder/review receipt field
- require exact schemaVersion/domain on parse and canonicalization
- require 40-lowercase-hex and 64-lowercase-hex fields where specified
- require positive canonical decimal identifiers where specified
- require canonical RFC3339 UTC timestamp form where specified
- add reject tests for malformed values across both receipt schemas
```

### IR-F05 — Webhook authentication implementation does not preserve the canonical operation order

**Severity: MATERIAL / CONTRACT ORDERING**

The canonical order begins with a bounded read of the exact raw request bytes, then requires event/delivery/signature headers, then verifies HMAC before JSON processing.

`internal/webhook/payload.go::ReadAuthenticated` currently calls `ParseHeaders` before the bounded raw-body read. JSON still occurs after signature verification, so T005 passes, but the complete canonical ordering theorem is not implemented as authorized.

Required repair:

```text
1. bound-read exact raw bytes
2. require X-GitHub-Event
3. require X-GitHub-Delivery
4. require X-Hub-Signature-256
5. validate signature syntax
6. HMAC exact raw bytes
7. constant-time compare
8. only then continue to hash/strict JSON/semantic decode
```

Add a structural regression test that fails if header parsing is moved ahead of the bounded body read again.

### IR-F06 — T035 does not prove edited/deleted source-comment non-mutation

**Severity: MATERIAL / TEST ADEQUACY**

T035 currently checks only that `BootstrapBody(...)` is non-empty and relies on a comment that the handler subscribes only to `created`. That is not an executable proof that edited/deleted issue-comment actions cannot reach the processor/store mutation path.

Required repair:

```text
- send validly signed synthetic issue_comment edited/deleted requests through the HTTP handler
- prove the processor/store is not called
- prove no receipt/delivery mutation is attempted for those unsupported actions
```

### IR-F07 — Delivery/receipt transaction theorem is not fully proven for ordering and concurrency

**Severity: MATERIAL / IDEMPOTENCY**

`server.Runtime.Process` performs GitHub pull/file reads and founder semantic/receipt derivation before `store.Process` starts the delivery/receipt transaction. The canonical theorem specifies entering the one delivery/receipt transaction after authenticated repository/installation binding and beginning with delivery GUID lookup before semantic receipt creation.

In addition, `store.Process` uses lookup-before-insert logic without proving concurrent duplicate behavior. Two concurrent deliveries can both observe absence before one loses the database unique-key race; that path currently returns a generic insert error rather than proving the required idempotent-same-body or fatal-conflict classification.

Required repair/proof:

```text
- reconcile transaction entry ordering with the canonical theorem
- prove concurrent duplicate delivery GUID + same raw hash -> idempotent outcome
- prove concurrent duplicate delivery GUID + different raw hash -> fatal security outcome
- prove concurrent receipt/source-key collisions are classified by stored bytes/digest, not generic uniqueness failure
- keep real PostgreSQL execution out of AG1-A; use deterministic transaction fakes/state-machine tests if sufficient, otherwise obtain authorization before any live DB test
```

### IR-F08 — Gate receipt projection discards authority-bearing receipt bindings

**Severity: MATERIAL / GATE AUTHORITY**

`gate.Receipt` contains only `CandidateHeadSHA`. `server.Runtime.Process` reads full stored receipts and projects both founder and independent-review receipts down to only that single field before `gate.Evaluate`.

That means the pure gate evaluator cannot itself distinguish a same-head receipt whose authority-bearing bindings differ, including future review-provider allowlist provenance and App/install identity fields. The independent-review receipt schema carries these bindings specifically so stale/conflicting/unqualified receipts can fail closed.

Required repair:

```text
- validate stored receipt preimage/hash/schema before treating it as authoritative
- project or pass all gate-relevant immutable bindings, not only candidateHeadSha
- for review receipts, bind providerAllowlistSha256/provider identity as required by the later qualified allowlist
- bind App GitHub ID / installation identity where required
- add negative tests showing same-head but stale/conflicting/unqualified receipt -> FAIL
```

### IR-F09 — Independent reviewer cannot recompute the reported local evidence-artifact hashes from available bytes

**Severity: GOVERNANCE / PROVENANCE**

The execution session reported `APP_TEST_LOG_SHA256` and `APP_TEST_EVIDENCE_SHA256`, but the independent review slice does not currently possess the exact bytes of:

```text
KODAC_AG1A_EXACT_TEST_LOG_2026-08-22.txt
KODAC_AG1A_SOURCE_IMPLEMENTATION_EVIDENCE_2026-08-22.txt
```

Therefore this review can record the reported hashes but cannot independently recompute them. Canonical proof must not upgrade a hash-only assertion into independently verified evidence.

Required reconciliation:

```text
- provide the exact two evidence files to the independent reviewer through a non-secret review channel
- scan them for forbidden credential material before any persistence
- recompute SHA-256 from exact bytes
- reconcile their claimed source commit/tree/manifests/test results against the repaired exact source candidate
```

## 5. Test-matrix disposition

The exact source contains test functions named T001 through T070, and the exact Go 1.26.6 execution reported all packages passing. The independent semantic review does **not** accept the presence/pass status of a named test as proof when the body does not establish the required theorem.

Current disposition:

```text
T001-T034=EXECUTION_PASS_WITH_SOURCE_REVIEW_NOTED
T035=SEMANTIC_PROOF_INSUFFICIENT
T036-T038=EXECUTION_PASS
T039=SEMANTIC_PROOF_INSUFFICIENT
T040=SEMANTIC_PROOF_INSUFFICIENT
T041-T054=EXECUTION_PASS_WITH_RECEIPT_CANONICALIZATION_FINDINGS_APPLICABLE
T055=IMPLEMENTATION_ALLOWLIST_DEFECT
T056-T070=EXECUTION_PASS_WITH_TRANSACTION/GATE_BINDING_FINDINGS_APPLICABLE
```

No aggregate `T001_T070=PROVEN` claim is authorized on `c287912593c224aedc5c2c47c7914613f225d119`.

## 6. Independent-review verdict

```text
AG1A_SOURCE_REPOSITORY_CREATION=PASS
AG1A_SOURCE_PATH_PROVENANCE=PASS
AG1A_OFFLINE_COMMAND_EXECUTION_REPORTED=PASS
AG1A_SOURCE_SEMANTIC_REVIEW=FAIL
AG1A_TEST_ORACLE_REVIEW=FAIL
AG1A_TEST_EVIDENCE_BYTES_RECOMPUTED=NO
AG1A_SOURCE_PROVENANCE_CANONICAL=NO
AG1A_REPAIR_REQUIRED=YES

GITHUB_APP_CREATED=NO
GITHUB_APP_REGISTERED=NO
GITHUB_APP_INSTALLED=NO
APP_DEPLOYED=NO
RECEIPT_STORE_PROVISIONED=NO
REVIEWER_ALLOWLIST=[]
QUALIFIED_REVIEWER_PROVIDERS=0
FOUNDER_PROCESS_AUTHORITY_TRUST_ROOT_ESTABLISHMENT=BLOCKED
B1_V2/B2A_V2/B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
AG1B=BLOCKED
```

## 7. Repair boundary

This review document does not mutate `TheHalfMoon/kodac-phase-b-gate` and does not itself authorize an unbounded repair. A subsequent repair must remain within the already selected Go architecture, exact source-repository identity, authorized path surface, dependency budget, offline-test boundary, and all AG1-A stop conditions. If any repair would require a new path, new direct dependency family, real credential, real App, real PostgreSQL, deployment, workflow, or protected-main mutation, stop and obtain a new predecessor first.

After repair, the entire exact-source provenance and T001-T070 review must be repeated against the new exact commit/tree. The old candidate `c287912593c224aedc5c2c47c7914613f225d119` must never be cited as canonical AG1-A source proof.
