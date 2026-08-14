# KODAC KDO H4-R2B — Linux Landlock Launcher / Backend Primitive Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `874ac75f98a891503c3cbd56e7ee1c14193ee946`
Canonical base tree: `ed612d4feee6ac4f5cd794c27d004a1e0b7bee7b`
Predecessor: H4-R2A provider-neutral confinement contract/evidence plane

## 1. Purpose

Authorize one narrow H4-R2B implementation slice that proves a Linux Landlock filesystem-effect confinement launcher/backend primitive without integrating it into the Kodac K2 execution path.

This slice exists to answer one question only:

> Can Kodac own and test a small, auditable Linux Landlock launcher primitive whose observed filesystem-effect enforcement can be classified honestly, while K2 remains the sole production side-effect authority?

The answer must be evidence-backed before any later K2 wiring is authorized.

## 2. Canonical predecessor state

H4-R2A is canonical at the base above and establishes:

`requested confinement policy != observed confinement enforcement`

The canonical R2A module already defines provider-neutral confinement requests, backend descriptors, and enforcement evidence with closed modes:

- `read-only`
- `workspace-write`
- `danger-full-access`

and observed enforcement results:

- `full`
- `partial`
- `unavailable`

H4-R2A did not grant any platform sandbox backend, process launch, ExecutionGateway integration, external-executable approval, PATH resolution, executable identity, or Done Gate authority.

## 3. Current blocker this slice addresses

Canonical `packages/kodac-runtime/src/execution/gateway.ts` still fails closed for external executable `ask` before approval or process execution because external executable identity requires H4-R2 confinement.

H4-R2B does **not** remove that blocker.

Instead, H4-R2B proves the first concrete platform confinement primitive needed before a later integration slice may even consider changing that behavior.

## 4. Architecture boundary

K2 remains the sole trusted production side-effect execution authority.

Therefore H4-R2B MUST NOT introduce a second TypeScript production executor, process runner, shell runner, or ambient process-launch service.

The native launcher may contain its intrinsic `restrict-self-then-exec` behavior because that behavior is the sandbox primitive under test. However:

- no Kodac production TypeScript path may invoke it in H4-R2B;
- no existing production command path may be redirected through it in H4-R2B;
- only the focused H4-R2B test may compile and execute the native launcher to produce enforcement proof;
- product/runtime integration is deferred to a separately authorized H4-R2C slice.

## 5. Donor provenance

Primary donor:

- repository: `deepseek-ai/deepseek-harness`
- pinned commit: `47f943859bef60e4160492346772ded9b24f765a`

Pinned native launcher source:

- path: `native/landlock-run/packages/entry/src/main.c`
- blob: `af0cc2a988b219a699f35aeb911dbd66f1946fd9`

Pinned local profile mapping source:

- path: `packages/sandbox/sandbox-local/src/profiles.ts`
- blob: `5b76390319c9b0729cb64f3213e714ff2df702d7`

Pinned subproject license:

- path: `native/landlock-run/LICENSE`
- blob: `8187059c9a2f14902c3eb5ab18d207906794f3b3`
- license: BSD 3-Clause
- copyright line: `Copyright (c) 2026, node-addon-landlock-run contributors`

Any adapted source must preserve the required BSD-3-Clause notice obligations in Kodac's third-party notices. The donor license is not to be rewritten as MIT.

## 6. External standards grounding

The implementation must be reconciled against the current Linux kernel Landlock userspace API documentation, not only the donor's older known-ABI ceiling.

Important consequence:

The donor launcher knows filesystem access rights through Landlock ABI 5. Current Landlock contains later capabilities. Therefore H4-R2B MUST NOT use `full` to mean "all Landlock capabilities", "all filesystem operations", "network isolation", "IPC isolation", or "complete sandboxing".

## 7. H4-R2B filesystem claim set

H4-R2B defines one explicit local claim set:

`kodac-linux-landlock-fs-v1`

Its governed access classes are exactly the Landlock filesystem rights introduced through ABI 5 that the launcher handles:

1. execute
2. write file
3. read file
4. read directory
5. remove directory
6. remove file
7. make character device
8. make directory
9. make regular file
10. make socket node
11. make FIFO
12. make block device
13. make symlink
14. refer / cross-directory link-or-rename semantics
15. truncate
16. device ioctl

This claim set explicitly excludes:

- TCP or UDP policy;
- abstract UNIX-socket scope;
- signal scope;
- Landlock logging policy;
- TSYNC claims;
- pathname UNIX-socket resolution rights introduced after the donor's filesystem claim set;
- process visibility or process-tree isolation;
- seccomp;
- namespaces, mounts, cgroups, containers, VM isolation, or privilege virtualization;
- file-related operations that Landlock itself does not govern;
- read-confidentiality claims over the host filesystem.

## 8. Meaning of `full`, `partial`, and `unavailable` in this slice

For H4-R2B only:

### `full`

Means the running Linux kernel successfully enforces the complete `kodac-linux-landlock-fs-v1` claim set required by this launcher primitive.

A kernel reporting Landlock ABI >= 5 may satisfy this local claim set, subject to a successful functional probe.

`full` MUST NOT imply support for later Landlock capabilities that are outside this claim set.

### `partial`

Means Landlock is enforced but the running kernel ABI cannot govern every access class in `kodac-linux-landlock-fs-v1`.

For example, an ABI below 5 cannot provide the complete declared v1 claim set.

Partial enforcement must remain observable and must never be upgraded silently to full.

### `unavailable`

Means the launcher cannot prove usable Landlock enforcement on the running host.

Unsupported/disabled Landlock, probe failure, malformed output, launcher failure, or an unprovable result must map to unavailable/fail-closed behavior.

## 9. File-effect profile semantics

The donor's Linux Landlock profile grants host `/` read/execute access so dynamically linked executables and libraries can run, while write access is allow-listed separately.

H4-R2B preserves that **file-effect** model and does not mislabel it as read confidentiality.

The focused proof must cover at least:

### read-only file-effect profile

- host `/` is granted read/execute;
- no general workspace write grant is present;
- writes outside explicitly writable test roots are denied by Landlock;
- ordinary reads may remain available and are not claimed confidential.

### workspace-write file-effect profile

- host `/` remains read/execute;
- an explicitly selected workspace/test root may be granted write access;
- writes inside the granted root succeed;
- writes to a sibling non-granted root are denied;
- `/dev/null` may be writable as an operational exception;
- `/tmp` MUST NOT be granted implicitly by the reusable backend planner unless explicitly supplied by the trusted caller or focused test profile.

The R2A `readPaths`/`writePaths` remain identity-bearing requested scope. H4-R2B does not yet claim that an R2A request is bound to a live K2 execution attempt. That binding belongs to R2C.

## 10. Native launcher requirements

The authorized native source must remain a small Linux-only C launcher adapted from the pinned donor source.

Required properties:

- C source only; no checked-in compiled binary;
- raw Linux Landlock UAPI/syscalls or equally auditable stable kernel interface;
- no third-party native runtime library requirement beyond libc;
- `PR_SET_NO_NEW_PRIVS` before restriction;
- Landlock ruleset installed on the launcher itself before target `exec`;
- restrictions inherited across `exec`/descendants according to the kernel contract;
- no shell insertion by the launcher;
- strict argv parsing;
- `--ro <path>` and `--rw <path>` grants;
- `--` terminator before target argv;
- functional `--probe` path that actually attempts Landlock enforcement rather than version-string inspection;
- unsupported/disabled/unusable enforcement fails closed and never executes the target unconfined;
- deterministic launcher-specific failure code, preserving donor-style `125` unless a documented reason requires otherwise;
- bounded, machine-parseable probe output that includes observed ABI and local claim-set enforcement classification;
- target non-zero exit codes remain distinguishable from launcher failure;
- no network policy claims;
- no credential or environment harvesting;
- no filesystem writes by the launcher itself other than effects performed by the wrapped target under the installed ruleset.

## 11. TypeScript adapter requirements

The new TypeScript module is a non-executing adapter/contract helper only.

It MAY:

- expose the canonical Linux Landlock backend descriptor;
- declare support for `read-only` and `workspace-write` only;
- reject `danger-full-access` as not a confinement mode supplied by this backend primitive;
- build deterministic launcher argv/profile plans from explicit trusted-caller inputs;
- canonicalize and validate absolute launcher/grant roots supplied by the caller;
- preserve target argv order exactly;
- parse and classify machine-readable `--probe` output;
- map valid probe results to the R2A observed vocabulary without overclaiming;
- produce immutable structural plan/classification objects with deterministic identities if such identities are introduced.

It MUST NOT:

- import `node:child_process`;
- call `spawn`, `exec`, `execFile`, shell APIs, Bun/Deno process APIs, or equivalent;
- read `process.env`;
- resolve PATH;
- discover executable locations;
- hash/open the launcher executable;
- read or write the filesystem;
- invoke the native launcher;
- modify K2 policy/approval/receipt authority;
- produce a claim that a particular live K2 execution was confined.

## 12. Test-only native execution authority

The focused test is authorized to compile and execute the native source solely to prove the primitive.

On Linux CI it must:

- compile the checked-in C source into a temporary test artifact outside the repository worktree;
- use a direct compiler invocation without a shell;
- fail the focused Linux proof if compilation is expected but unavailable;
- run `--probe` and validate exact machine-readable semantics;
- distinguish full, partial, and unavailable outcomes honestly;
- use an absolute target executable in behavioral tests rather than relying on PATH;
- prove a read-only profile denies a test write;
- prove a workspace-write profile allows a write under the granted root;
- prove a sibling/non-granted write remains denied;
- prove launcher setup failure does not execute the target;
- prove no repository file is mutated by the test;
- clean temporary compiled artifacts.

On non-Linux hosts the focused native execution subtests may skip explicitly, but structural/TypeScript/provenance tests must still run.

A platform skip is not evidence of Linux enforcement.

## 13. Exact implementation allowlist

After this authorization is canonical, H4-R2B implementation may modify exactly these six paths:

1. `packages/kodac-runtime/native/landlock-run.c`
2. `packages/kodac-runtime/src/trust/confinement-linux-landlock.ts`
3. `packages/kodac-runtime/src/index.ts`
4. `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts`
5. `packages/kodac-runtime/THIRD_PARTY_NOTICES.md`
6. `docs/planning/KODAC_KDO_H4_R2B_LINUX_LANDLOCK_BACKEND_EVIDENCE_2026-08-14.md`

No other path is authorized.

The evidence ledger path (#6) MUST remain absent until the pre-ledger candidate passes the required gates.

## 14. Explicitly protected paths

The following current canonical surfaces are not authorized for modification in H4-R2B:

- `packages/kodac-runtime/src/execution/gateway.ts`
- `packages/kodac-runtime/src/trust/confinement.ts`
- `packages/kodac-runtime/src/trust/policy.ts`
- `packages/kodac-runtime/src/trust/approval.ts`
- `packages/kodac-runtime/src/evidence/receipt.ts`
- `packages/kodac-runtime/src/verification/done-gate.ts`
- `packages/kodac-runtime/src/agent/loop.ts`
- `packages/kodac-runtime/src/tools/registry.ts`
- `packages/kodac-runtime/package.json`
- `packages/kodac-runtime/scripts/run-tests.mjs`
- all `.github/workflows/*`

Protected current blobs at authorization base include:

- `execution/gateway.ts`: `8b481c226276d0b06fabc8d614c1295cd0881a6a`
- `trust/confinement.ts`: `873f235120645c0a12f10a5bff7e9591db6bb341`
- `trust/policy.ts`: `b4134e430204123bebe053ffc9105f05fca611c9`
- `trust/approval.ts`: `d36a604cb1957bc65dac3978c626ba48a9b299fb`
- `evidence/receipt.ts`: `bc11267496f8c8a2ca1dac713baccf88ec962b19`
- `verification/done-gate.ts`: `067e147569fa52cc2b04c5df26fbe20a01e958e9`
- `agent/loop.ts`: `a5b7c2bbb2a5f7658f683e7baf45655b41b775f8`
- `tools/registry.ts`: `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `package.json`: `af4c20a3dae387c15cc5fb2eb28d415c8f115b95`
- `scripts/run-tests.mjs`: `9a0bcde0e565168c78eb7fe4d3cf08236d24baa7`

## 15. Explicit non-grants

H4-R2B does NOT authorize:

- ExecutionGateway integration;
- changing policy decisions;
- changing H4-R1 approval semantics;
- external executable identity resolution or pinning;
- PATH resolution;
- production native-binary packaging or distribution;
- package-manager dependencies;
- checked-in compiled binaries;
- CI workflow changes;
- automatic install/download of a launcher;
- `bwrap` integration;
- macOS Seatbelt integration;
- Windows sandbox/ACL integration;
- network isolation;
- signal/IPC/process isolation;
- read-confidentiality guarantees;
- `danger-full-access` passthrough logic;
- external-process `ask` re-enablement;
- one-shot approval consumption changes;
- K2 receipt shape changes;
- Done Gate changes;
- plugin execution authority;
- agent-loop authority;
- shell execution authority;
- credential management;
- session or model changes.

## 16. Sequencing after H4-R2B

If H4-R2B is proven and merged, the expected next slice is H4-R2C, separately authorized.

R2C may evaluate:

- verified launcher artifact/executable identity;
- binding one validated R2A request to one actual K2 execution attempt;
- K2-owned invocation of the confinement primitive;
- durable observed enforcement evidence before or with execution receipt truth;
- fail-closed behavior if the required confinement level is unavailable.

Only after that proof should a later slice evaluate widening external-process `ask` behavior.

## 17. Pre-ledger acceptance gate

Before the H4-R2B evidence ledger may be added, the implementation candidate must prove at exact head:

- changed paths are a subset of paths 1–5 above;
- evidence ledger path absent;
- donor source and license pins exact;
- BSD-3-Clause notice correctly represented;
- protected blobs unchanged;
- TypeScript typecheck PASS;
- full runtime test suite PASS with no new skip that hides Linux enforcement on Ubuntu;
- patch benchmark PASS;
- governance PASS;
- K2 runtime classifier PASS;
- Ubuntu runtime PASS;
- macOS runtime PASS;
- Windows runtime PASS;
- K2 final gate PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- focused Linux compilation PASS on Ubuntu;
- functional Landlock probe produces an attributable full/partial/unavailable result;
- behavioral write-denial/write-allow tests PASS when Landlock is usable;
- unsupported/unavailable behavior fails closed;
- CodeRabbit/reviewer findings adjudicated;
- unresolved review threads = 0.

If Linux CI cannot prove usable Landlock enforcement, the candidate is BLOCKED for the `...PROVEN` claim; it must not convert the missing proof into a skip and continue to ledger.

## 18. Evidence ledger gate

Only after the exact pre-ledger candidate satisfies Section 17 may this path be added:

`docs/planning/KODAC_KDO_H4_R2B_LINUX_LANDLOCK_BACKEND_EVIDENCE_2026-08-14.md`

The ledger must record at minimum:

- authorization base;
- authorization document identity;
- exact pre-ledger head/tree;
- exact donor commit/path/blob/license pins;
- local claim-set definition;
- native source blob;
- TypeScript adapter blob;
- focused test blob;
- third-party notice blob;
- Linux compiler/runtime observed identity available from CI logs;
- observed Landlock ABI and functional probe classification;
- exact behavioral enforcement proofs;
- full test counts;
- all exact-head CI run/job results;
- review status;
- protected blob verification;
- non-claims.

After adding the ledger, all pre-ledger CI results become historical and the full exact-head post-ledger matrix must run again.

## 19. Completion claim

If and only if implementation, evidence, exact-head CI, review, and merge gates all pass, this slice may claim:

`KODAC_LINUX_LANDLOCK_LAUNCHER_AND_BACKEND_PRIMITIVE_PROVEN`

This claim means only that the isolated Linux Landlock primitive and its structural adapter are proven against the declared H4-R2B claim set.

It does NOT mean:

- K2 is using Landlock;
- arbitrary Kodac commands are sandboxed;
- external-process approvals are enabled;
- all Linux filesystem effects are controllable;
- read confidentiality exists;
- network/process/IPC isolation exists;
- macOS or Windows confinement exists;
- H4 is complete;
- Kodac is universally sandboxed.

## 20. Authorization decision

Decision:

`AUTHORIZED_FOR_DOCS_REVIEW_ONLY`

No implementation may begin from this branch until this authorization document is reviewed, passes its docs/governance gates, is merged to canonical `main`, and the new canonical base is re-established.
