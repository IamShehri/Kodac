# KODAC KDO H4-R2B — Linux Landlock Launcher / Backend Primitive Evidence

Date: 2026-08-14
Status: POST-PRE-LEDGER EVIDENCE CAPTURE
Repository: `TheHalfMoon/Kodac`
PR: `#58`

## 1. Claim boundary

This ledger supports only the H4-R2B claim:

`KODAC_LINUX_LANDLOCK_LAUNCHER_AND_BACKEND_PRIMITIVE_PROVEN`

The claim is not valid until this ledger-bearing exact head independently passes the required post-ledger CI/review gates and is merged to canonical `main`.

The local enforcement claim set is:

`kodac-linux-landlock-fs-v1`

Within H4-R2B, `full` means complete support for this declared filesystem claim set only. It does not mean all modern Landlock capabilities, all filesystem operations, read confidentiality, network isolation, IPC/process isolation, or universal sandboxing.

## 2. Canonical authorization

H4-R2B authorization became canonical through PR #57.

Implementation authorization merge/base:

`22181506f841b2cec010780bd1fbd6b538d39909`

Implementation authorization base tree:

`7358272cc2da86ff47d601f25e5f74568b4a5a8a`

Authorization document:

`docs/planning/KODAC_KDO_H4_R2B_LINUX_LANDLOCK_BACKEND_AUTHORIZATION_2026-08-14.md`

Authorization document blob:

`b400e2f2d1f0acc53ec98bbf19e644ac8c370e99`

The authorization document itself records its docs-review predecessor base as:

`874ac75f98a891503c3cbd56e7ee1c14193ee946`

## 3. Exact pre-ledger candidate

Accepted pre-ledger head:

`c346f98fd4eb661d3dbc19c66d90b72776e990d6`

Accepted pre-ledger tree:

`c439c1379c40e134c1749b8d28a210606a582d4a`

Pre-ledger changed paths were exactly five authorized implementation paths:

1. `packages/kodac-runtime/native/landlock-run.c`
2. `packages/kodac-runtime/src/trust/confinement-linux-landlock.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts`
5. `packages/kodac-runtime/THIRD_PARTY_NOTICES.md`

This evidence ledger path was absent during pre-ledger certification.

## 4. Donor provenance and license

Primary donor:

- repository: `deepseek-ai/deepseek-harness`
- pinned commit: `47f943859bef60e4160492346772ded9b24f765a`

Pinned native launcher source:

- path: `native/landlock-run/packages/entry/src/main.c`
- blob: `af0cc2a988b219a699f35aeb911dbd66f1946fd9`

Pinned profile reference:

- path: `packages/sandbox/sandbox-local/src/profiles.ts`
- blob: `5b76390319c9b0729cb64f3213e714ff2df702d7`

Pinned donor subproject license:

- path: `native/landlock-run/LICENSE`
- blob: `8187059c9a2f14902c3eb5ab18d207906794f3b3`
- license: BSD 3-Clause
- copyright: `Copyright (c) 2026, node-addon-landlock-run contributors`

Kodac's third-party notice preserves the BSD-3-Clause attribution rather than misclassifying this donor surface as MIT.

## 5. Exact implementation blobs at pre-ledger head

Native source:

- path: `packages/kodac-runtime/native/landlock-run.c`
- blob: `d39cbeeb1715dfec07e95235f8647ba9fb1e5b46`

TypeScript adapter:

- path: `packages/kodac-runtime/src/trust/confinement-linux-landlock.ts`
- blob: `94b325f73246514f31b950ba4fed38023e3e3cfc`

Runtime export:

- path: `packages/kodac-runtime/src/index.ts`
- blob: `e856a172af82a998ecfa249ac46dcf7a1b8dc14f`

Focused proof:

- path: `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts`
- blob: `c54695965089e72e51ce7c8114161aafca2cfe91`

Third-party notices:

- path: `packages/kodac-runtime/THIRD_PARTY_NOTICES.md`
- blob: `d6f39bc1711714a8a186a69de69cffe666a8f304`

## 6. Native primitive properties proven by source/test

The accepted pre-ledger implementation proves these bounded primitive properties:

- Linux-only C source; no checked-in compiled binary.
- Raw Landlock UAPI/syscalls with libc only.
- `PR_SET_NO_NEW_PRIVS` is set before `landlock_restrict_self`.
- Landlock rules are installed before target execution.
- `--ro <path>`, `--rw <path>`, `--`, and functional `--probe` are supported.
- Launcher setup failures use exit code `125` and fail before target execution.
- Target executable must be an absolute path.
- Target launch uses `execv`, not `execvp`, so the launcher does not perform PATH resolution.
- The launcher exposes the local `kodac-linux-landlock-fs-v1` claim set and treats ABI >= 5 as `full` only for that local claim set.
- No Landlock network/scope, seccomp, namespace, mount, or cgroup claim is introduced.

## 7. TypeScript adapter properties proven

The accepted pre-ledger adapter:

- imports only `node:crypto`, `node:path`, `node:util`, and `./confinement.ts`;
- does not import or invoke `node:child_process`;
- does not read `process.env`;
- does not read or write the filesystem;
- does not resolve PATH;
- does not invoke the native launcher;
- exposes a deterministic Linux Landlock backend descriptor supporting only `read-only` and `workspace-write`;
- rejects `danger-full-access` as an R2B confinement mode;
- requires absolute canonical launcher and target executable paths;
- constructs deterministic immutable launch plans;
- validates serialized launch plans with exact keys/version/claim-set/identity and re-derived launcher argv;
- rejects proxy structural hooks before invoking traps;
- materializes only validated `{ file, args }` structural invocation data;
- parses bounded exact machine-readable probe output;
- never upgrades contradictory or malformed probe evidence to `full` or `partial`.

## 8. Exact Linux functional proof

Pre-ledger Ubuntu job:

- workflow: `k2-runtime`
- workflow run: `31824645683`
- job: `runtime (ubuntu-latest)`
- job id: `94845803822`
- runner OS observed in log: Ubuntu `24.04.4` LTS
- Node observed in log: `v24.19.0`
- npm observed in log: `11.17.0`
- compiler invocation used by the focused test: `cc -std=c11 -O2 -Wall -Wextra -Werror ...`
- an exact compiler version string was not emitted by the workflow log, so this ledger does not invent one.

Functional probe evidence emitted by the accepted pre-ledger focused test:

`H4_R2B_LANDLOCK_PROBE {"abi":7,"enforcement":"full","claimSet":"kodac-linux-landlock-fs-v1"}`

Observed Landlock ABI:

`7`

Observed H4-R2B claim-set classification:

`full`

Meaning:

The Ubuntu runner proved usable Landlock enforcement for every access class in Kodac's declared ABI-through-5 `kodac-linux-landlock-fs-v1` claim set. ABI 7 is not interpreted as a claim that H4-R2B supports every ABI-7 capability.

## 9. Exact behavioral enforcement proofs

The accepted pre-ledger Linux focused test proved:

1. the checked-in C source compiles successfully into a temporary artifact;
2. a relative target executable is rejected with launcher failure code `125` and the target does not execute;
3. functional `--probe` succeeds and yields attributable machine-readable ABI/classification evidence;
4. a read-only file-effect profile with host `/` read/execute can read an ordinary host file;
5. the same read-only profile denies a test write;
6. a workspace-write profile permits a write under its explicit granted root;
7. a sibling non-granted write remains denied;
8. a missing/invalid writable grant fails launcher setup with `125` and the target never executes;
9. temporary compiled/test artifacts are cleaned after the focused proof.

The test does not claim host filesystem read confidentiality because the H4-R2B profile intentionally grants host `/` read/execute for executable/library operation.

## 10. Runtime test and benchmark evidence

Accepted pre-ledger Ubuntu runtime suite:

- tests: `426`
- pass: `425`
- fail: `0`
- cancelled: `0`
- skipped: `1`
- todo: `0`

The single skip is the pre-existing K3-R4 exact Linux ast-grep identity test. The H4-R2B Linux native proof did not skip on Ubuntu.

Accepted pre-ledger Ubuntu patch benchmark:

- benchmark: `patch-parse-v1`
- iterations: `10000`
- elapsedMs: `18.103914000000003`
- operationsPerSecond: `552366.7423519576`

The benchmark is recorded as regression evidence only; it is not part of the Landlock security claim.

## 11. Exact-head CI matrix at pre-ledger candidate

All results below are for exact head:

`c346f98fd4eb661d3dbc19c66d90b72776e990d6`

### Governance

- workflow: `governance`
- run id: `31824645678`
- conclusion: `success`

### K3-R4

- workflow: `k3-r4-adapter`
- run id: `31824645620`
- conclusion: `success`

### K3-R5

- workflow: `k3-r5-context-engine`
- run id: `31824645648`
- conclusion: `success`

### K2 runtime

- workflow: `k2-runtime`
- run id: `31824645683`
- conclusion: `success`

K2 jobs:

- runtime-change-classifier — job `94845763688` — `success`
- runtime (windows-latest) — job `94845803779` — `success`
- runtime (ubuntu-latest) — job `94845803822` — `success`
- runtime (macos-latest) — job `94845803932` — `success`
- k2-runtime-gate — job `94845984169` — `success`

TypeScript typecheck, full runtime tests, and patch benchmark passed on Ubuntu, Windows, and macOS where applicable.

## 12. Review evidence

At accepted pre-ledger head:

- CodeRabbit combined status: `success`
- unresolved GitHub review thread count: `0`
- submitted GitHub review objects observed: `0`
- PR state: `OPEN / DRAFT / NOT MERGED`
- PR mergeability: `true`

No actionable reviewer finding remained open at evidence-capture time.

## 13. Protected authority surfaces

The focused H4-R2B proof re-hashed the protected current surfaces and required exact equality with the authorization baseline:

- `packages/kodac-runtime/src/execution/gateway.ts` — `8b481c226276d0b06fabc8d614c1295cd0881a6a`
- `packages/kodac-runtime/src/trust/confinement.ts` — `873f235120645c0a12f10a5bff7e9591db6bb341`
- `packages/kodac-runtime/src/trust/policy.ts` — `b4134e430204123bebe053ffc9105f05fca611c9`
- `packages/kodac-runtime/src/trust/approval.ts` — `d36a604cb1957bc65dac3978c626ba48a9b299fb`
- `packages/kodac-runtime/src/evidence/receipt.ts` — `bc11267496f8c8a2ca1dac713baccf88ec962b19`
- `packages/kodac-runtime/src/verification/done-gate.ts` — `067e147569fa52cc2b04c5df26fbe20a01e958e9`
- `packages/kodac-runtime/src/agent/loop.ts` — `a5b7c2bbb2a5f7658f683e7baf45655b41b775f8`
- `packages/kodac-runtime/src/tools/registry.ts` — `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `packages/kodac-runtime/package.json` — `af4c20a3dae387c15cc5fb2eb28d415c8f115b95`
- `packages/kodac-runtime/scripts/run-tests.mjs` — `9a0bcde0e565168c78eb7fe4d3cf08236d24baa7`

No H4-R2B authority was granted to those paths.

## 14. Manual hardening findings closed before evidence capture

The pre-ledger sequence deliberately invalidated earlier heads when real or proof-quality findings appeared.

Closed findings included:

1. purity proof initially used a substring regex that could self-match `RegExp.exec`; it was replaced with an exact import-surface assertion plus explicit process-authority prohibitions;
2. the native launcher originally used `execvp`; it was hardened to reject non-absolute targets and use `execv`, eliminating launcher PATH resolution;
3. invocation materialization originally assumed a typed in-memory plan; it was hardened with strict serialized-plan validation, identity verification, canonical launcher-argv re-derivation, and proxy-hook rejection before materialization.

The accepted pre-ledger head includes regression proofs for all three closures.

## 15. Explicit non-claims

This ledger does NOT claim:

- K2 invokes the Landlock launcher;
- any production Kodac command is currently routed through Landlock;
- external-process `ask` is enabled;
- executable identity/pinning is solved;
- PATH resolution is authorized;
- a compiled launcher is packaged or distributed;
- Landlock is available on every Linux host;
- `full` means all current/future Landlock capabilities;
- every filesystem operation is constrainable by Landlock;
- host filesystem read confidentiality;
- network isolation;
- signal/IPC/process isolation;
- seccomp, namespaces, mounts, cgroups, containers, or VM isolation;
- macOS confinement;
- Windows confinement;
- Done Gate proof for arbitrary sandboxed execution;
- H4 completion;
- universal Kodac sandboxing.

## 16. Sequencing after this ledger

Adding this ledger invalidates all pre-ledger CI as current-head certification.

The ledger-bearing exact head must independently pass:

- governance;
- K3-R4;
- K3-R5;
- K2 runtime classifier;
- Ubuntu runtime and H4-R2B native proof;
- macOS runtime;
- Windows runtime;
- patch benchmark;
- K2 final gate;
- CodeRabbit/reviewer gate;
- unresolved review threads = 0.

Only after those post-ledger gates pass may PR #58 be considered for Ready/merge.

The expected next architectural slice after successful H4-R2B merge is a separately authorized H4-R2C integration slice. H4-R2C is not authorized by this ledger.

## 17. Evidence-capture decision

Pre-ledger decision:

`PRE_LEDGER_CANDIDATE_ACCEPTED_FOR_EVIDENCE_CAPTURE`

Post-ledger completion claim:

`PENDING_EXACT_HEAD_POST_LEDGER_CERTIFICATION`
