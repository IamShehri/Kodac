# KODAC KDO H4-R4B-G0 — Trusted gVisor Workload Gate Evidence

Date: 2026-08-21
Repository: `TheHalfMoon/Kodac`
Gate protocol: `kodac-gvisor-workload-gate-v1`

## 1. Scope and authority

This evidence record covers only the focused H4-R4B-G0 native gate source/static-artifact proof.

The proof execution was performed after explicit founder session authority to proceed with the previously blocked G0 proof scope. That session authority was interpreted narrowly: local focused G0 compiler/test/fixture process execution was allowed; Docker, runsc, gVisor sandbox creation, Docker attach mutation, live workload integration, B1-v2, B2A-v2, B2B, TTL arm, model/provider/Agent execution, and GO dispatch over Docker remained prohibited.

This evidence record does not widen canonical repository authority and does not authorize any later integration slice.

Canonical base at proof time:

```text
CANONICAL_MAIN=01081ba9cd6227e4c1e87e73e08c1dcd2cbc62c6
CANONICAL_TREE=2d7e8d6e37c409e119a9774ed19ca9e2fc7db125
PR_142=MERGED_CANONICAL
G0_AUTHORIZATION=CLOSED_CANONICAL
```

G0 implementation source/test head before adding this evidence document:

```text
G0_SOURCE_TEST_HEAD=1adaea324a6af3b9be7fa859f0378836fa537670
G0_BRANCH=feat/kdo-h4-r4b-g0-gvisor-workload-gate
AHEAD_BY=4
BEHIND_BY=0
CHANGED_PATHS_BEFORE_EVIDENCE=2
OUT_OF_SCOPE_PATHS_BEFORE_EVIDENCE=0
```

## 2. Exact source/test identities

The proof host could not resolve GitHub directly, so repository bytes were read through the connected GitHub repository interface at exact head `1adaea324a6af3b9be7fa859f0378836fa537670` and reconstructed in an isolated temporary proof directory.

Before any test execution, local Git blob hashes were calculated and matched the GitHub blob identities exactly.

```text
SOURCE_PATH=packages/kodac-runtime/native/gvisor-workload-gate.c
SOURCE_GIT_BLOB=049aef0417e3673b6467101e2f8e8ba2a5d19287
SOURCE_SHA256=42a8e0739d72141630e22184ec3fb74f1d2bb768d89dc87144e628d60e1c7f74
SOURCE_BYTES=1400

TEST_PATH=packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
TEST_GIT_BLOB=ca837f5b139cabfdb2d6fd163cb9b50e08675bd4
TEST_SHA256=3f22d8e7dcfb3ca3a4c39855c793eee13a86fc9833c8cd53b9b53170705ecc3f
TEST_BYTES=10794

EXACT_GITHUB_BLOB_MATCH=PASS
```

## 3. Proof host observations

```text
HOST_OS=Linux
NODE_VERSION=v22.16.0
CC_VERSION=cc (Debian 14.2.0-19) 14.2.0
READELF_VERSION=GNU readelf (GNU Binutils for Debian) 2.44
SHA256SUM_VERSION=GNU coreutils 9.7
```

The package declares Node `>=24` and the canonical runtime test launcher uses `--experimental-strip-types`. The proof host provides Node 22.16.0 with the same type-stripping flag available.

A first bare invocation using `node --test <test.ts>` failed before test-body execution with `ERR_UNKNOWN_FILE_EXTENSION`. This was an invocation/loader mismatch, not a gate proof failure. No G0 test body executed in that attempt.

The focused test was then run without changing the source or test bytes using:

```text
node --experimental-strip-types --test packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
```

Result:

```text
TESTS=2
PASS=2
FAIL=0
SKIP=0
CANCELLED=0
TODO=0
FOCUSED_TEST_RESULT=PASS
```

## 4. Static gate artifact proof

Exact focused build recipe:

```text
cc -std=c11 -O2 -Wall -Wextra -Werror -static <source> -o <output>
```

Observed proof artifact:

```text
PROOF_BINARY_SHA256=7369647ae08e2a7cd3396ed27f8dd52f472487566120cd105e0fd004f38639aa
PROOF_BINARY_BYTES=754504
ELF_CLASS=ELF64
ELF_MACHINE=Advanced Micro Devices X86-64
STATICALLY_LINKED=YES
PT_INTERP=ABSENT
DT_NEEDED=ABSENT
DYNAMIC_SECTION=ABSENT
STATIC_BINARY_PROOF=PASS
```

This hash identifies only the G0 test-host proof artifact built with the observed compiler above. It is not a production gate artifact, production gate-image identity, or reproducible production release digest.

## 5. Source authority proof

The focused source audit passed with the hardened external-call allowlist.

Allowed external call authority is restricted to purpose-equivalent use of:

```text
_exit
read
close
execv or execve
```

The source audit also rejects direct `asm`, `__asm__`, and `syscall` authority and retains the explicit forbidden-call/output/loader-control checks.

```text
SOURCE_SCOPE_AUDIT=PASS
TCB_AUTHORITY_GROWTH=NOT_OBSERVED
```

## 6. Permit and pre-exec failure matrix

Each hostile or incomplete permit case was executed directly against the exact static proof artifact. EOF was provided after the listed input.

| Case | Exit | Gate/target stdout bytes | Gate/target stderr bytes | Workload exec |
|---|---:|---:|---:|---|
| missing deferred target + `GO\n` | 125 | 0 | 0 | blocked |
| relative deferred target + `GO\n` | 125 | 0 | 0 | blocked |
| EOF with zero permit bytes | 125 | 0 | 0 | blocked |
| `G` + EOF | 125 | 0 | 0 | blocked |
| `GO` + EOF | 125 | 0 | 0 | blocked |
| `NO\n` + EOF | 125 | 0 | 0 | blocked |
| `GO\r` + EOF | 125 | 0 | 0 | blocked |
| `GO\nX` + EOF | 125 | 0 | 0 | blocked |

```text
PERMIT_PROTOCOL_PROOF=PASS
FAIL_CLOSED_EXIT=125
PRE_EXEC_GATE_STDOUT_BYTES=0
PRE_EXEC_GATE_STDERR_BYTES=0
```

## 7. Hostile loader environment proof

The gate was executed before valid GO with hostile values for:

```text
LD_PRELOAD=<proof preload fixture>
LD_LIBRARY_PATH=<proof fixture directory>
```

Pre-GO result with invalid permit:

```text
EXIT=125
STDOUT_BYTES=0
STDERR_BYTES=0
PRELOAD_CONSTRUCTOR_WITNESS_EXISTS=NO
TARGET_ARGV_WITNESS_EXISTS=NO
HOSTILE_LOADER_PRE_GO_PROOF=PASS
```

This demonstrates that the static gate did not execute the hostile preload constructor and did not execute the deferred target before valid release.

## 8. Exact GO + EOF success proof

Successful input was exactly:

```text
0x47 0x4f 0x0a
EOF
```

Deferred target argv supplied to the gate:

```text
<absolute target fixture path>
arg one
--flag=two
$HOME
*
```

Observed target argv witness after gate exec:

```text
[
  "<absolute target fixture path>",
  "arg one",
  "--flag=two",
  "$HOME",
  "*"
]
```

The strings `$HOME` and `*` remained literal; no shell expansion occurred.

The target fixture begins by reading fd 0 and succeeds only if the read fails with `EBADF`. The successful target exit therefore proves the gate closed its control stdin before exec.

Observed success result:

```text
EXIT=0
STDOUT=TARGET_STDOUT
STDERR=TARGET_STDERR
ARGV_PRESERVED_EXACTLY=YES
TARGET_STDIN=EBADF
PRELOAD_WITNESS_AFTER_GO=PREMAIN
```

The success stdout/stderr are emitted by the target fixture after exec. The focused test plus all blocked cases establish that the gate itself contributes zero pre-exec stdout/stderr bytes.

```text
EXACT_ARGV_PROOF=PASS
CLOSED_STDIN_PROOF=PASS
PRE_EXEC_ZERO_OUTPUT_PROOF=PASS
WORKLOAD_ENVIRONMENT_PRESERVED_POST_GO=PASS
HOSTILE_LOADER_ENV_PROOF=PASS
```

## 9. Negative-space attestation for this proof activity

```text
DOCKER_CREATE=0
DOCKER_START=0
DOCKER_ATTACH_MUTATION=0
DOCKER_IMAGE_BUILD=0
DOCKER_IMAGE_LOAD=0
DOCKER_IMAGE_PULL=0
RUNSC_EXECUTION=0
GVISOR_SANDBOX_CREATION=0
GO_DISPATCH_OVER_DOCKER=0
TTL_ARM_BY_B2B=0
AGENT_EXECUTION=0
MODEL_PROVIDER_REQUESTS=0
B1_V2_IMPLEMENTATION=0
B2A_V2_IMPLEMENTATION=0
B2B_IMPLEMENTATION=0
R3G_F_E4=NO
H4_COMPLETE=NO
```

Only the local static G0 proof artifact, local proof fixtures, and direct focused test processes were executed.

## 10. PR/CI safety fence

Opening a pull request against `main` for paths under `packages/kodac-runtime/**` would trigger the existing `k2-runtime` workflow. That workflow performs a three-OS runtime matrix with Node 24, installs typecheck tooling, runs runtime-wide typecheck/tests, and invokes the patch benchmark hook. The unconditional governance workflow also runs provenance validation plus repository pytest/ruff.

Those CI processes are broader than the narrowly granted local G0 proof execution used for this evidence record.

Therefore this evidence commit does not itself authorize opening the implementation PR under the current narrow session execution scope.

```text
EXACT_HEAD_CI=NOT_YET_PROVEN
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=NOT_YET_PROVEN
UNRESOLVED_ACTIONABLE_THREADS=NOT_APPLICABLE_PR_NOT_OPEN
G0_IMPLEMENTATION_PR=NOT_OPENED_BY_THIS_EVIDENCE_STEP
G0_MERGE=BLOCKED
```

## 11. Evidence verdict

The exact source/test byte pair has passed the focused local source/static-artifact/behavioral proof required by G0.

```text
SOURCE_SCOPE_AUDIT=PASS
STATIC_BINARY_PROOF=PASS
PERMIT_PROTOCOL_PROOF=PASS
EXACT_ARGV_PROOF=PASS
CLOSED_STDIN_PROOF=PASS
PRE_EXEC_ZERO_OUTPUT_PROOF=PASS
HOSTILE_LOADER_ENV_PROOF=PASS

G0_FOCUSED_LOCAL_PROOF=PASS
G0_SOURCE_AND_STATIC_TEST_ARTIFACT_PROOF_CANDIDATE=PASS
```

This is not yet merge qualification because exact-head GitHub CI and a fresh independent exact-head review remain unproven.

It must not be interpreted as any of the following:

```text
PRODUCTION_GATE_ARTIFACT_RELEASED
GATE_IMAGE_PROVEN
B1_V2_READY
B2A_V2_READY
B2B_READY
DOCKER_START_AUTHORIZED
WORKLOAD_EXECUTION_AUTHORIZED_OUTSIDE_FOCUSED_G0_PROOF
R3G_F_E4
H4_COMPLETE
```
