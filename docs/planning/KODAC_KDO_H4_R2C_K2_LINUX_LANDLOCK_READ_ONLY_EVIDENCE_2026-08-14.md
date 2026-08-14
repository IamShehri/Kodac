# KODAC KDO H4-R2C — K2 Linux Landlock Read-Only Execution Evidence

Date: 2026-08-14
Captured through: 2026-08-15 Asia/Riyadh
Status: EVIDENCE LEDGER ADDED AFTER PRE-LEDGER GATE — POST-LEDGER CERTIFICATION REQUIRED
Repository: `TheHalfMoon/Kodac`
PR: `#60`

## 1. Evidence purpose

This ledger records the accepted **pre-ledger** H4-R2C evidence for one K2-owned Linux Landlock read-only execution path.

The central proven ordering under test is:

`requested policy prepared -> verified same-FD launcher -> Landlock active -> READY -> durable confinement evidence acknowledgment -> GO -> target exec`

This file is path #10 in the canonical H4-R2C implementation allowlist. Its addition does **not** itself complete H4-R2C. Every pre-ledger CI result below becomes historical after this commit and a fresh exact-head post-ledger matrix is required before merge.

## 2. Canonical authorization identity

Authorization PR:

`#59 — docs(kdo): authorize H4-R2C K2 Landlock read-only integration`

Authorization source base:

`909734906e2f1bb3bf4d136232986b2f8972b605`

Authorization source base tree:

`44261a7178341cf1f4cf396f5f95fcf3234dfda4`

Authorization accepted head:

`cb1fc7aa139d8be593455ff31cc34fc0d71506ea`

Authorization merge commit / canonical implementation base:

`4194f26e4b633b469534507f79e7491190260962`

Authorization merge tree:

`629917f8f36d6d078f05dd1d6f0e83a0f4ab6167`

Authorization document blob:

`32002eead941ce408418a26008b9b5b03226a3d4`

Authorization document:

`docs/planning/KODAC_KDO_H4_R2C_K2_LINUX_LANDLOCK_READ_ONLY_INTEGRATION_AUTHORIZATION_2026-08-14.md`

## 3. Predecessor identities

### H4-R2A — provider-neutral confinement contract

Implementation PR:

`#56 — feat(kdo): implement H4-R2A confinement contracts`

Post-ledger implementation head:

`35b1d3cdd59a0cfe93fa02453862a502ae44eb06`

Canonical merge commit:

`874ac75f98a891503c3cbd56e7ee1c14193ee946`

Limited predecessor claim:

`KODAC_PROVIDER_NEUTRAL_CONFINEMENT_CONTRACT_BOUND`

### H4-R2B — Linux Landlock primitive/backend

Implementation PR:

`#58 — feat(kdo): prove H4-R2B Linux Landlock primitive`

Post-ledger implementation head:

`86a97d5c4c02e45cd89eff60020f089db779a14c`

Canonical merge commit:

`909734906e2f1bb3bf4d136232986b2f8972b605`

Limited predecessor claim:

`KODAC_LINUX_LANDLOCK_LAUNCHER_AND_BACKEND_PRIMITIVE_PROVEN`

## 4. Accepted pre-ledger candidate identity

Accepted pre-ledger head:

`6bb3ae155aa134397a3cad4960a73aea7da41755`

Accepted pre-ledger tree:

`b446d8092b37a3fdde2e4f790ace7cd683fb4014`

Base:

`4194f26e4b633b469534507f79e7491190260962`

Changed paths at the accepted pre-ledger head were exactly these eight authorized paths:

1. `packages/kodac-runtime/native/landlock-run.c`
2. `packages/kodac-runtime/src/evidence/receipt.ts`
3. `packages/kodac-runtime/src/execution/gateway.ts`
4. `packages/kodac-runtime/src/index.ts`
5. `packages/kodac-runtime/src/trust/confinement-runtime.ts`
6. `packages/kodac-runtime/test/kdo-h4-r2a-confinement-contract.test.ts`
7. `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts`
8. `packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts`

`packages/kodac-runtime/src/trust/confinement-linux-landlock.ts` remained unchanged and no path outside the authorization allowlist changed.

The evidence-ledger path was confirmed absent at this pre-ledger head.

## 5. Pre-ledger modified-path blobs

| Path | Git blob SHA-1 |
|---|---|
| `packages/kodac-runtime/native/landlock-run.c` | `d7a3e47c31e80df0ac3eddf1969a5fecb48c5de0` |
| `packages/kodac-runtime/src/evidence/receipt.ts` | `214403398751c9d22bf695786c7fd7c6fd7e35e1` |
| `packages/kodac-runtime/src/execution/gateway.ts` | `ecf9cc9d3eda6a2280a280ed2f9a2e472f397560` |
| `packages/kodac-runtime/src/index.ts` | `07f2d5bb2c83c89e5c1c2e7e3dddea65d8fa9e45` |
| `packages/kodac-runtime/src/trust/confinement-runtime.ts` | `1ca0313fb25c62e549445ebcf1aef029b18e6b86` |
| `packages/kodac-runtime/test/kdo-h4-r2a-confinement-contract.test.ts` | `56b52dca2bb2387dad70f9ba83f4ea8f2aba067d` |
| `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts` | `9ed410e6388afeb27be5e617f0f103f7666c4371` |
| `packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts` | `4ce7cc199daec32eac0e78f3a3dfbdc081d5d541` |

## 6. Launcher same-FD identity proof

The Linux integration compiles the authorized native launcher in CI, moves that trusted fixture behind the required root-owned write-protection boundary, hashes the retained open launcher descriptor, and executes the launcher through:

`/proc/self/fd/3`

The accepted Ubuntu proof observed:

Expected launcher SHA-256:

`bad9a2ae107b64654df7c3016c2d50c5b921caacd3c44f18a8f87a63ac54f911`

Observed retained-FD launcher SHA-256:

`bad9a2ae107b64654df7c3016c2d50c5b921caacd3c44f18a8f87a63ac54f911`

Write-protection observation:

```text
policy = root-owned-unprivileged-read-exec-v1
ownerUid = 0
ownerGid = 0
permissions = 493 decimal = 0755 octal
linkCount = 1
```

Adversarial focused proofs also establish:

- replacing the configured pathname after an FD is retained does not replace the bytes seen through the retained FD;
- same-inode in-place mutation is observable as a distinct threat;
- an untrusted/user-owned launcher is rejected before launcher spawn/evidence commit;
- pre-Landlock loader-control environment such as `LD_PRELOAD` is rejected before launcher open/spawn.

This is a **trusted-host launcher artifact** proof, not a claim against a compromised root/privileged host.

## 7. Controlled READY / GO protocol proof

The accepted fixed child descriptor map is:

```text
fd 3 = verified launcher artifact
fd 4 = launcher -> K2 READY
fd 5 = K2 -> launcher GO permit
```

The launcher enforces effective one-way child semantics, descriptor distinctness, `FD_CLOEXEC` / closure before target exec, and exact bounded protocol records.

READY format:

`kodac-landlock-ready-v1 abi=<N> claim-set=kodac-linux-landlock-fs-v1 enforcement=<full|partial>\n`

READY maximum:

`128 bytes including LF`

Permit payload:

`GO\n`

Permit read maximum:

`4 bytes`

The target is not executed on malformed READY, oversized READY, EOF/malformed permit, invalid descriptor directionality, invalid descriptor aliasing, partial enforcement, evidence-commit failure, malformed durable acknowledgment, cancellation before GO, or setup failure.

## 8. Observed Landlock evidence

Ubuntu observed Landlock ABI:

`7`

Claim set:

`kodac-linux-landlock-fs-v1`

Observed enforcement classification:

`full`

`full` is local only to the authorized `kodac-linux-landlock-fs-v1` filesystem-effect claim set. It is not a claim that all current or future Landlock capabilities are enforced.

## 9. Durable evidence-before-GO proof

The focused Linux integration proves that observing READY is insufficient to launch the target.

Positive ordering proof:

1. launcher applies Landlock;
2. launcher sends READY;
3. K2 constructs the observed H4-R2A enforcement evidence;
4. K2 builds the deterministic durable R2C record;
5. trusted evidence sink returns an exact durable acknowledgment;
6. K2 validates the acknowledgment;
7. only then K2 writes exact `GO\n`;
8. target executes.

The ordering fixture persists `COMMITTED` from the evidence sink and the target can observe that marker only after GO, proving durable commit completed before target execution.

Negative proofs show:

- commit failure -> no GO / no target;
- never-resolving commit plus timeout -> no GO / no target;
- malformed commit acknowledgment -> no GO / no target;
- cancellation while commit is pending -> no GO / no target;
- `partial` may be recorded but never receives GO;
- target filesystem write outside `/dev/null` fails;
- target read can succeed without creating a read-confidentiality claim.

The confined process lifetime is hard-bounded: the controlled child uses `SIGKILL` for timeout/forced cleanup, and a target that installs a `SIGTERM` handler is still forcibly terminated under the focused proof.

## 10. Receipt / execution-intent lineage

R2C receipts bind the executed result back to the durable confinement lineage.

`ConfinementReceiptBinding` includes the exact execution intent identity and `createReceipt` rejects a confinement binding when:

`confinement.executionIntentIdentity != receipt.inputDigest`

The accepted Linux proof emits this sample lineage:

```text
workspaceIdentity = fd6cb70d6eb58b9583b66d09e20b405606b73b323c2281eb7298b939fc2138a1
executionIntentIdentity = 1dda653b40c6393a993ccb0312f3d57c7a02fa5ddb66aa51cfae1e6d80924156
requestIdentity = 1e87b34306290dee30a43e2b69fcbd1819d354346bfc484ef114f0ccbebe188f
executionAttemptIdentity = 403a0cb895670029829cee9ce890bdbde904908b579bf7275a8e07d8a6689058
backendIdentity = 6c3cbc8cefd39dba109f1546eb17d2447be5cb66ebf54187b3e33fab6b6ccc11
enforcementEvidenceIdentity = 9930ba1cd62840e346d2738117c249af1a841b76c9015291c2e3edc4fa6f3ba6
durableRecordIdentity = 42bbd64e05b06bec99f5d9530e302de7ee0a550e5e8f5a50bb1ca05c43dd3c02
durableCommitAcknowledgmentIdentity = fc001110cd21c963e76637baa8178480d6a57c567b873a12bd603a03d43e1795
receiptBindingIdentity = 66e35b8e467916051597af701fd6b6dc57938ab85a9f8589d8a247e5853e40cf
```

These are fixture proof identities, not a production credential or secret.

## 11. Accepted pre-ledger test evidence

Exact Ubuntu runtime suite:

```text
tests = 431
pass = 430
fail = 0
skipped = 1
cancelled = 0
todo = 0
```

The one skip is the unrelated exact-Linux ast-grep integration identity subtest. The H4-R2C Linux integration itself executed and passed; it was not skipped.

H4-R2B probe in the same Ubuntu job:

```text
abi = 7
enforcement = full
claimSet = kodac-linux-landlock-fs-v1
```

Patch benchmark in the same job:

```text
benchmark = patch-parse-v1
iterations = 10000
operationsPerSecond = 434353.4674697918
```

## 12. Accepted pre-ledger CI matrix

All entries below are tied to accepted pre-ledger head:

`6bb3ae155aa134397a3cad4960a73aea7da41755`

### K2 runtime

Workflow run:

`31839498119 — PASS`

Jobs:

- `94893078947` — runtime-change-classifier — PASS
- `94893103104` — runtime (ubuntu-latest) — PASS
  - TypeScript typecheck — PASS
  - full runtime suite — PASS
  - H4-R2C Linux integration — PASS / NOT SKIPPED
  - patch benchmark — PASS
- `94893103118` — runtime (windows-latest) — PASS
- `94893103135` — runtime (macos-latest) — PASS
- `94893294865` — k2-runtime-gate — PASS

### Governance

Workflow run:

`31839497876 — PASS`

Jobs:

- `94893078055` — legacy-tests — PASS
  - pytest — PASS
  - ruff — PASS
- `94893078116` — provenance — PASS
  - `uv run python tools/validate_provenance.py` — PASS

### K3 gates

- `31839497999` — k3-r4-adapter — PASS
- `31839497882` — k3-r5-context-engine — PASS

## 13. Review and security status at the accepted pre-ledger head

Known reviewer findings were adjudicated before this ledger was added.

Resolved review-thread count:

`3`

Unresolved review-thread count:

`0`

CodeRabbit exact-head status:

```text
state = success
description = Review rate limited
```

This is an explicit terminal service limitation, **not** a fresh clean-review assertion. The last actionable CodeRabbit findings were corrected and their threads are resolved/outdated as applicable.

Independent exact-head security re-review:

`PRE_LEDGER_SECURITY_GATE_PASS_AT_6BB3AE1`

PR review ID:

`4941256451`

Historical security blockers SEC-1 / SEC-2 / SEC-3 remain closed, and the fresh timeout / receipt-intent / root-host false-pass findings are closed at this head.

## 14. Protected blobs

The following protected authority surfaces remain byte-identical to the authorization base:

| Protected path | Git blob SHA-1 |
|---|---|
| `packages/kodac-runtime/src/trust/confinement.ts` | `873f235120645c0a12f10a5bff7e9591db6bb341` |
| `packages/kodac-runtime/src/trust/policy.ts` | `b4134e430204123bebe053ffc9105f05fca611c9` |
| `packages/kodac-runtime/src/trust/approval.ts` | `d36a604cb1957bc65dac3978c626ba48a9b299fb` |
| `packages/kodac-runtime/src/verification/done-gate.ts` | `067e147569fa52cc2b04c5df26fbe20a01e958e9` |
| `packages/kodac-runtime/src/agent/loop.ts` | `a5b7c2bbb2a5f7658f683e7baf45655b41b775f8` |
| `packages/kodac-runtime/src/tools/registry.ts` | `0bdf5cfd02efda7cab0c81976c7735bc7b46081b` |
| `packages/kodac-runtime/package.json` | `af4c20a3dae387c15cc5fb2eb28d415c8f115b95` |
| `packages/kodac-runtime/scripts/run-tests.mjs` | `9a0bcde0e565168c78eb7fe4d3cf08236d24baa7` |
| `packages/kodac-runtime/THIRD_PARTY_NOTICES.md` | `d6f39bc1711714a8a186a69de69cffe666a8f304` |

No `.github/workflows/*`, model/session/provider surface, policy, approval, Done Gate, agent loop, tool registry, package configuration, test script, or third-party-notice authority was modified by H4-R2C.

## 15. Explicit non-claims

This ledger does **not** claim any of the following:

- external-process `ask` is re-enabled;
- target executable bytes are pinned or identity-proven;
- target PATH resolution is authorized;
- `workspace-write` is integrated into K2;
- `danger-full-access` is authorized;
- generic `runCommand` behavior is widened;
- Git/repository built-ins are automatically confined;
- read confidentiality exists;
- network isolation exists;
- process isolation exists;
- IPC isolation exists;
- seccomp, namespace, mount, cgroup, container, or VM isolation exists;
- the native launcher is packaged or distributed;
- checked-in compiled launcher binaries are authorized;
- macOS confinement exists;
- Windows confinement exists;
- H4 is complete;
- Kodac is universally sandboxed.

The trusted-host launcher write-protection proof is not a defense against a compromised privileged/root host.

## 16. Post-ledger requirement

The creation of this ledger changes the PR head and invalidates every pre-ledger CI result as current-head evidence.

Before merge, the new exact post-ledger head must again satisfy:

- changed paths are exactly the authorized implementation set plus this ledger;
- protected blobs unchanged;
- TypeScript typecheck PASS;
- full runtime suite PASS;
- Ubuntu PASS with H4-R2C integration not skipped;
- macOS PASS;
- Windows PASS;
- patch benchmark PASS;
- governance PASS;
- runtime classifier PASS;
- K2 final gate PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- reviewer findings adjudicated;
- unresolved review threads = 0;
- fresh security review of any post-ledger delta;
- no scope expansion.

Only after that full post-ledger gate passes may PR #60 merge and claim:

`KODAC_K2_LINUX_LANDLOCK_READ_ONLY_EXECUTION_BINDING_PROVEN`
