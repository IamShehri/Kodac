# KODAC KDO H4-R4B Phase-B AG1-A — Source Provenance + Offline Test Evidence Proof

Date: 2026-08-22
Status: **PROOF CANDIDATE — DOCS ONLY — AG1-B NOT AUTHORIZED**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

This proof slice binds the completed AG1-A source-repository implementation to exact immutable source, review, merge, dependency, build-recipe, and offline-test evidence.

It is the separate proof slice required by the canonical AG1-A authorization. It does not create/register/install a GitHub App, access/generate credentials, deploy the service, provision PostgreSQL, mutate Kodac workflows/rulesets/branch protection, qualify a reviewer provider, establish the founder-process trust root, execute Kodac artifacts, or start AG1-B/AG1-C/AG2/B1-v2/B2A-v2/B2B.

Canonical predecessor at proof-branch creation:

```text
KODAC_CANONICAL_MAIN=fdbf5eeb3d0598cb8c9e84e3dd8ce49d5a69f5ae
KODAC_CANONICAL_TREE=6fcd1f6e881e854d70ba0488b4b0da4fcd4a79c5
PHASE_B_AG1A_APP_SOURCE_IMPLEMENTATION_AUTHORIZATION=CANONICAL
```

---

## 2. Exact source repository identity

```text
APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_REPOSITORY_ID=1342309131
APP_SOURCE_OWNER=TheHalfMoon
APP_SOURCE_OWNER_TYPE=User
APP_SOURCE_VISIBILITY=public
APP_SOURCE_DEFAULT_BRANCH=main
APP_SOURCE_REPOSITORY_IS_KODAC=NO
KODAC_REPOSITORY_ID=1297407563
CANDIDATE_INDEPENDENCE_REPOSITORY_ID=PASS
```

The source repository was independently verified empty before its single root implementation commit was published.

Initial root source commit:

```text
APP_SOURCE_INITIAL_ROOT_COMMIT=c287912593c224aedc5c2c47c7914613f225d119
APP_SOURCE_INITIAL_ROOT_TREE=94abe16b4466d04472d9c087c5b725e80ddd95ac
ROOT_COMMIT_PARENT_COUNT=0
```

---

## 3. Independent review and bounded repairs

The initial root candidate failed independent semantic/test-oracle review and was not accepted as canonical proof.

The failed-review record remains separate in Kodac PR #151 and is not used as this successful proof.

Bounded source repair history:

```text
R1_COMMIT=6cb2fa4926eacf234d668456fa6771250cc99e26
R1_TREE=9b71e7dd8baa2e7e3aab7078ac5b7f6e383005ac
R1_PARENT=c287912593c224aedc5c2c47c7914613f225d119

R2_REVIEWED_EXACT_HEAD=c6fd6a5c4a8b31041da40739b64edc2f2f2a641e
R2_REVIEWED_EXACT_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
R2_PARENT=6cb2fa4926eacf234d668456fa6771250cc99e26
```

Cumulative repair delta from the root source commit:

```text
REPAIR_COMMITS_OVER_ROOT=2
CUMULATIVE_REPAIR_CHANGED_FILES=25
AUTHORIZED_REPOSITORY_PATH_COUNT=51
PATHS_OUTSIDE_AUTHORIZED_SOURCE_SURFACE=0
NEW_WORKFLOW_PATHS=0
DOCKERFILE=0
CONTAINERFILE=0
```

Independent findings reconciled on the exact R2 reviewed head:

```text
IR-F01=CLOSED
IR-F02=CLOSED
IR-F03=CLOSED
IR-F04=CLOSED
IR-F05=CLOSED
IR-F06=CLOSED
IR-F07=CLOSED
IR-F08=CLOSED
IR-F09=CLOSED
IR-F10=CLOSED
IR-F11=CLOSED
```

The review specifically rechecked the exact GitHub REST endpoint allowlist, strict recursive duplicate-member rejection, raw-body/signature ordering, RFC8785/JCS-compatible receipt bytes, exact committed receipt vectors, receipt field grammar, append-only transaction collision handling, authority-bearing receipt projection, clean VCS source-revision binding, invalid UTF-16 surrogate rejection before ordinary JSON decoding, and positive Check Run response identity retention.

No remaining material AG1-A source-review finding is known on `c6fd6a5c4a8b31041da40739b64edc2f2f2a641e`.

---

## 4. Source repository canonical merge

Source PR #1 was merged only after exact-head review and independent evidence-byte reconciliation.

```text
SOURCE_PR=TheHalfMoon/kodac-phase-b-gate#1
SOURCE_PR_REVIEWED_HEAD=c6fd6a5c4a8b31041da40739b64edc2f2f2a641e
SOURCE_PR_REVIEWED_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
SOURCE_CANONICAL_MERGE=79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40
SOURCE_CANONICAL_MERGE_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
SOURCE_CANONICAL_MERGE_SIGNATURE_VERIFIED=true
```

Ordered merge parents:

```text
1. c287912593c224aedc5c2c47c7914613f225d119
2. c6fd6a5c4a8b31041da40739b64edc2f2f2a641e
```

The canonical source merge tree is byte-identical to the exact reviewed R2 tree.

---

## 5. Exact implementation/toolchain/dependency provenance

```text
IMPLEMENTATION_LANGUAGE=Go
GO_TOOLCHAIN_EXACT=go1.26.6
GO_MODULE=github.com/TheHalfMoon/kodac-phase-b-gate
CGO_PRODUCTION_BUILD=DISABLED

APP_RUNTIME_MANIFEST_SHA256=381290fbfea115fe93c10e77725de5e84f7639a8a988f26ade8592c97898c028
APP_LOCKFILE_SHA256=61d5207e47bff43ca363100b1e5def5ffdc6673016b08ff38c85ba09fea5d56e
APP_BUILD_RECIPE_SHA256=81d0cf61a4fc416fe15b76d32f5bf16bcc3a04a2ff4df7fc7639cdded6cded40
DIRECT_RUNTIME_DEPENDENCY_SET_CANONICAL=github.com/jackc/pgx/v5@v5.10.0
DIRECT_RUNTIME_DEPENDENCY_SET_SHA256=e630ae668bf8424ae7a4821a34b0348e18560ad4ef9df6d2d9a030031b3ab839
DIRECT_RUNTIME_DEPENDENCY_FAMILIES=1
```

Exact-head GitHub source inspection reconfirmed the module identity, Go/toolchain directives, direct `pgx/v5 v5.10.0` requirement, pinned transitive requirements, and deterministic `build/recipe.json` contract.

No source-repository GitHub Actions workflow is part of AG1-A, and no workflow run is used as the AG1-A test oracle.

---

## 6. Exact offline qualification

The exact R2 candidate was qualified on Windows using:

```text
GO_VERSION=go version go1.26.6 windows/amd64
GOTOOLCHAIN=local
GOPROXY=off
GOFLAGS=-mod=readonly
```

Only the authorized Go command set was executed:

```text
go version
go env GOTOOLCHAIN
go mod verify
go vet ./...
go test -count=1 ./...
go test -shuffle=on -count=20 ./...
```

Results:

```text
GO_VERSION_CHECK=PASS
GOTOOLCHAIN_CHECK=PASS
GO_MOD_VERIFY=PASS
GO_VET=PASS
GO_TEST_COUNT_1=PASS
GO_TEST_SHUFFLE_COUNT_20=PASS
T001_T070_EXACT_CARDINALITY=PASS
```

No test required a real GitHub App, real App private key, real webhook secret, real installation token, real GitHub write, real PostgreSQL instance, Docker, runsc/gVisor, Kodac artifact execution, workload execution, or model/provider call.

---

## 7. Independent evidence-byte reconciliation

The exact R2 evidence archive supplied for independent reconciliation contained exactly two files:

```text
KODAC_AG1A_REPAIR_R2_EXACT_TEST_LOG_2026-08-22.txt
KODAC_AG1A_REPAIR_R2_SOURCE_EVIDENCE_2026-08-22.txt
```

Archive identity:

```text
EVIDENCE_ARCHIVE_SHA256=0b002f942c2060e0c78f0c0e735e8cc247db0ceb80a1148bdfe754aec4ec2ff8
EVIDENCE_ARCHIVE_ENTRY_COUNT=2
```

Independent SHA-256 recomputation from the uploaded exact file bytes produced:

```text
APP_TEST_LOG_SHA256=c60558800cecc2b44889b848a87ad0321dd09793fb9f64385b8efe55af22c2b6
APP_TEST_EVIDENCE_SHA256=c7fcef6088417a052b6c62128ebb37837f4bf8809eaddfbe615f0083f9f4ac1a
```

These values exactly match the hashes emitted by the bounded publisher. The printed hashes were not used as the independent proof oracle.

The test-log file preserves its exact original bytes. Windows PowerShell `Tee-Object` produced mixed text encoding in command-output segments; the file was not normalized or rewritten before hashing. Independent inspection of those exact bytes still proves the six authorized commands and successful outputs, with no `FAIL`, panic, module-network resolution, or unauthorized command recorded.

The source-evidence report independently binds:

```text
APP_SOURCE_REPOSITORY=TheHalfMoon/kodac-phase-b-gate
APP_SOURCE_REPOSITORY_ID=1342309131
SOURCE_MAIN_EXPECTED=c287912593c224aedc5c2c47c7914613f225d119
REPAIR_BASE_COMMIT=6cb2fa4926eacf234d668456fa6771250cc99e26
REPAIR_BASE_TREE=9b71e7dd8baa2e7e3aab7078ac5b7f6e383005ac
REPAIR_EXACT_COMMIT=c6fd6a5c4a8b31041da40739b64edc2f2f2a641e
REPAIR_EXACT_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
REPAIR_PARENT_COUNT=1
REPAIR_PARENT_SHA=6cb2fa4926eacf234d668456fa6771250cc99e26
REPAIR_CHANGED_PATH_COUNT=7
AUTHORIZED_REPOSITORY_PATH_COUNT=51
```

Therefore:

```text
IR-F09=INDEPENDENT_EVIDENCE_BYTES_REHASHED_AND_RECONCILED
IR-F09_RESULT=PASS
```

---

## 8. Security/authority boundary preserved

This proof records source and offline-test completion only.

Still absent/not authorized:

```text
GITHUB_APP_CREATED=NO
GITHUB_APP_REGISTERED=NO
GITHUB_APP_INSTALLED=NO
REAL_APP_PRIVATE_KEY_ACCESS=NO
REAL_WEBHOOK_SECRET_ACCESS=NO
REAL_INSTALLATION_TOKEN_ACCESS=NO
APP_DEPLOYED=NO
POSTGRESQL_PROVISIONED=NO
MIGRATION_EXECUTED=NO
KODAC_WORKFLOW_MUTATION=NO
KODAC_RULESET_MUTATION=NO
KODAC_BRANCH_PROTECTION_MUTATION=NO
REVIEWER_ALLOWLIST=[]
QUALIFIED_REVIEWER_PROVIDERS=0
TRUST_ROOT_ESTABLISHMENT=BLOCKED
B1_V2/B2A_V2/B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
```

Chroma Foundation remains outside the trust/runtime/build/test/secret/database/App-credential path.

---

## 9. Proof verdict

Current proof-candidate verdict:

```text
AG1A_SOURCE_REPOSITORY_CREATION=PASS
AG1A_SOURCE_IMPLEMENTATION=PASS
AG1A_SOURCE_EXACT_PATH_BOUNDARY=PASS
AG1A_EXACT_SOURCE_REVIEW=PASS
AG1A_OFFLINE_TEST_EXECUTION=PASS
AG1A_TEST_EVIDENCE_BYTE_RECONCILIATION=PASS
AG1A_SOURCE_CANONICAL_MERGE=PASS
AG1A_SOURCE_PROVENANCE_PROOF=CANDIDATE
```

If and only if this exact proof document is reviewed and merged canonically into Kodac, the maximum new canonical result is:

```text
PHASE_B_AG1A_SOURCE_PROVENANCE_PROOF=CANONICAL
AG1A_SOURCE_REPOSITORY_CREATED=YES
AG1A_SOURCE_IMPLEMENTATION_CREATED=YES
AG1A_OFFLINE_TEST_EVIDENCE=CANONICAL
AG1A_INDEPENDENT_SOURCE_REVIEW=PASS
APP_SOURCE_REVIEWED_EXACT_HEAD=c6fd6a5c4a8b31041da40739b64edc2f2f2a641e
APP_SOURCE_REVIEWED_EXACT_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
APP_SOURCE_CANONICAL_MERGE=79a5e3a5c3b0f4882e8c9c864e314c0fab3c9a40
APP_SOURCE_CANONICAL_TREE=56350e47a524d5d1a798559259f4f2f4800a513f
```

This proof does **not** implicitly authorize the next slice:

```text
AG1B=BLOCKED_PENDING_SEPARATE_AUTHORIZATION
AG1C=BLOCKED
AG2=BLOCKED
TRUST_ROOT_ESTABLISHMENT=BLOCKED
B1_V2/B2A_V2/B2B=NOT_AUTHORIZED
H4_COMPLETE=NO
```

A separate explicit predecessor is required before AG1-B may start.
