# KODAC KDO H4-R2C — K2 Linux Landlock Read-Only Execution Integration Authorization

Date: 2026-08-14
Status: AUTHORIZATION CANDIDATE — DOCS ONLY
Repository: `TheHalfMoon/Kodac`
Canonical base: `909734906e2f1bb3bf4d136232986b2f8972b605`
Canonical base tree: `44261a7178341cf1f4cf396f5f95fcf3234dfda4`
Predecessors: H4-R2A provider-neutral confinement contracts + H4-R2B Linux Landlock primitive

## 1. Purpose

Authorize one narrow integration slice proving that Kodac's existing K2 `ExecutionGateway` can own one **read-only Linux Landlock execution path** with:

1. a verified launcher artifact opened and executed through the same file descriptor;
2. an explicit pre-target Landlock readiness handshake;
3. a K2-owned execution-attempt identity;
4. a validated H4-R2A confinement request;
5. durable observed-enforcement evidence committed before target execution is permitted;
6. a K2 execution receipt structurally bound to that durable confinement evidence.

This slice is intentionally read-only. It does not authorize workspace-write confinement and does not re-enable external-process one-shot approval.

## 2. Canonical predecessor truth

H4-R2A established the invariant:

`requested confinement policy != observed confinement enforcement`

H4-R2B then proved the isolated Linux Landlock primitive and adapter against local claim set:

`kodac-linux-landlock-fs-v1`

H4-R2B is canonical at the base above and may claim only:

`KODAC_LINUX_LANDLOCK_LAUNCHER_AND_BACKEND_PRIMITIVE_PROVEN`

H4-R2B did **not** wire the launcher into K2 production execution.

## 3. Current K2 boundary

At this authorization base, `packages/kodac-runtime/src/execution/gateway.ts`:

- owns process execution through Node child-process APIs;
- snapshots args, environment, bounds, and allowed exit codes into the execution intent digest;
- evaluates policy before execution;
- deliberately blocks external executable `ask` before approval because path-based execution cannot prove executable-byte identity;
- persists the final K2 receipt through the existing observer boundary.

The current `ExecutionReceipt` contains policy/approval/result evidence but has no confinement binding.

R2C may change those two surfaces only within the exact boundaries in this authorization.

## 4. R2C authority principle

K2 remains the sole production side-effect execution authority.

R2C MUST NOT create a second production executor or bypass `ExecutionGateway`.

The native launcher is a confinement primitive invoked by K2; it does not become an independent policy or approval authority.

The trusted host configures launcher identity and durable confinement evidence persistence. Untrusted command callers do not choose the launcher digest, evidence sink, or enforcement floor.

## 5. R2C scope is read-only only

R2C integrates exactly one confinement mode:

`read-only`

The H4-R2A request used by R2C must have:

- `mode = read-only`;
- `scope.writePaths = []`;
- no claim that `scope.readPaths` creates read confidentiality.

R2C's Landlock profile may grant:

- host `/` read/execute so the target and dynamic libraries can run;
- `/dev/null` read-write as the only fixed operational write exception.

R2C MUST NOT grant the workspace, `/tmp`, user home, caches, sockets, or arbitrary caller-selected paths read-write.

R2C MUST NOT authorize `workspace-write` or `danger-full-access`.

## 6. No read-confidentiality claim

The R2C profile is a **filesystem-effect confinement profile**, not a secrecy boundary.

Because host `/` is readable/executable, R2C does not claim that the target cannot read files outside a caller-declared scope.

The read-only claim is limited to preventing filesystem writes governed by `kodac-linux-landlock-fs-v1`, except the explicit `/dev/null` operational exception.

## 7. New K2 execution surface

R2C may add one new explicit K2 method for confined read-only execution.

It must be separate from existing generic `runCommand` behavior rather than silently changing all existing commands.

The new surface must:

- reject reserved `git.*` / `repo.*` capability spoofing as current generic execution does;
- require an absolute Linux target executable path;
- snapshot target argv, environment, output bounds, timeout, allowed exit codes, and confinement requirement before policy evaluation;
- bind the confinement requirement into the execution intent digest;
- evaluate existing K2 policy exactly once;
- block `deny` as today;
- block `ask` **before launcher open/spawn and before approval service use** because target executable-byte identity remains outside R2C;
- proceed to confinement only for policy `allow`;
- require the trusted Linux Landlock runtime to be configured;
- fail closed on non-Linux hosts.

Existing generic `runCommand`, Git methods, patch execution, H4-R1 approval behavior, and other K2 methods must preserve their current behavior.

## 8. Trusted Linux Landlock runtime configuration

R2C may define one trusted-host runtime configuration object captured immutably by `ExecutionGateway`.

It may contain exactly the authority needed for this slice, including:

- absolute launcher path;
- expected lowercase SHA-256 launcher artifact digest;
- durable confinement evidence commit interface;
- required enforcement floor fixed to `full` for `kodac-linux-landlock-fs-v1`.

The public command call MUST NOT be able to override:

- launcher path;
- expected launcher digest;
- evidence sink;
- required enforcement floor;
- control FD protocol.

Absence or invalidity of trusted runtime configuration must block confined execution before target launch.

## 9. Launcher artifact identity: same-FD requirement

Path hash followed by path execution is insufficient because the file could be replaced between observation and exec.

R2C therefore requires a Linux same-file-descriptor identity boundary:

1. K2 opens the configured launcher read-only.
2. K2 verifies it is a regular file and enforces a bounded artifact size.
3. K2 hashes bytes from that exact open file descriptor.
4. Observed digest must equal the trusted expected digest.
5. K2 passes that same open file descriptor into the child at a fixed inherited descriptor slot.
6. K2 starts the launcher through `/proc/self/fd/<fixed-fd>` rather than reopening the configured path for exec.
7. If `/proc/self/fd` execution or descriptor inheritance is unavailable, R2C fails closed.

Tests must prove that replacing the configured path after the verified descriptor is opened cannot change the bytes observed through the retained descriptor, and that the actual K2 integration executes through the inherited descriptor path.

R2C does **not** claim target executable-byte identity. The target is required to be an absolute path, but its bytes remain unpinned in this slice. This is why `ask` remains blocked.

## 10. Native pre-exec handshake protocol

The H4-R2B native launcher may be extended with an optional R2C control protocol while preserving its R2B direct/probe behavior.

For R2C controlled execution, K2 supplies two fixed inherited control descriptors:

- one launcher-to-K2 readiness descriptor;
- one K2-to-launcher permit descriptor.

The launcher must accept the controlled mode only when both descriptors are supplied and valid.

After all Landlock rules are installed and `landlock_restrict_self` succeeds, but **before target `execv`**, the launcher writes exactly one bounded machine-readable readiness record:

`kodac-landlock-ready-v1 abi=<N> claim-set=kodac-linux-landlock-fs-v1 enforcement=<full|partial>\n`

The launcher must then block waiting for exactly:

`GO\n`

from K2.

Any EOF, malformed permit, timeout-driven closure, cancellation, or protocol mismatch must exit with launcher failure code `125` without executing the target.

The launcher MUST NOT send the readiness record before Landlock restriction is active.

The launcher MUST NOT execute the target before receiving exact `GO\n`.

## 11. Durable evidence-before-side-effect invariant

The central R2C invariant is:

`Landlock active -> READY observed -> evidence durably committed -> GO -> target exec`

K2 must never send `GO` merely because READY was observed.

K2 must:

1. validate the exact readiness record and bound its size;
2. create a K2 execution-attempt identity;
3. validate/build the H4-R2A confinement request;
4. bind its `executionIntentIdentity` to the exact K2 execution intent digest;
5. bind its workspace identity to a deterministic K2 workspace-root identity that is explicitly documented as a local root identity, not repository-content identity;
6. create the H4-R2A backend descriptor and observed enforcement evidence;
7. build a deterministic durable confinement evidence record containing the full request, enforcement evidence, launcher artifact observation, and attempt identity;
8. send that record to the trusted evidence commit interface;
9. validate an exact commit acknowledgment against the record identity;
10. only if the observed enforcement is `full` for `kodac-linux-landlock-fs-v1` **and** the evidence commit is proven may K2 send `GO\n`.

If durable commit fails or acknowledgment is malformed, K2 must not send GO and the target must not execute.

## 12. Partial / unavailable behavior

R2C requires `full` enforcement for its read-only execution path.

If the controlled launcher reports `partial`:

- K2 should persist the observed partial evidence when the trusted evidence sink is available;
- K2 must not send GO;
- target must not execute;
- the operation must terminate fail-closed.

If launcher setup fails before READY, protocol output is malformed, the launcher artifact digest mismatches, `/proc/self/fd` execution is unavailable, or the runtime is otherwise unprovable:

- target must not execute;
- K2 must classify the operation as unavailable/fail-closed without inventing `full` evidence.

No failure path may silently fall back to unconfined target execution.

## 13. Confinement evidence runtime contract

R2C may add a new pure/structural confinement runtime contract module.

It may define:

- execution-attempt identity contract;
- durable confinement evidence record;
- launcher artifact observation;
- commit acknowledgment;
- strict create/validate helpers;
- deterministic record identity;
- immutable deep snapshots;
- trusted runtime configuration shape.

The module itself MUST NOT launch processes.

Any filesystem-open/hash helper needed for same-FD launcher verification must remain explicitly K2-owned or in a narrowly named Linux artifact helper whose authority is limited to read-only launcher artifact observation. It must not become a general filesystem service.

## 14. K2 receipt binding

R2C may extend `ExecutionReceipt` with one optional confinement binding.

The binding must be immutable and structural and include enough identity to connect the K2 result to the durable R2C evidence record, including at minimum:

- R2C binding version;
- H4-R2A request identity;
- execution-attempt identity;
- backend identity;
- observed enforcement evidence identity;
- durable confinement record identity;
- durable commit acknowledgment identity;
- launcher artifact SHA-256 identity;
- claim set;
- observed enforcement result.

For any target that actually receives GO and executes, the receipt confinement binding must show `full` for `kodac-linux-landlock-fs-v1`.

Target success and target failure after GO must both preserve the same confinement binding.

Unconfined existing execution receipts remain byte/shape compatible except for the optional absent field.

## 15. Target output / timeout / cancellation

R2C must preserve the existing K2 safety properties for command output and lifetime:

- bounded stdout/stderr;
- bounded timeout;
- explicit allowed exit codes;
- snapshotted environment;
- cancellation propagation;
- no shell insertion.

The total controlled execution must have a bounded handshake phase.

Cancellation before evidence commit or before GO must prevent target execution.

Cancellation after GO must terminate/abort the confined child using the existing K2 process-lifetime model.

Late readiness, permit, or target events must not revise a terminal blocked/failure state.

## 16. Legacy test reconciliation required

Two predecessor focused tests deliberately pin `gateway.ts` and/or `receipt.ts` to pre-R2C blobs:

- `packages/kodac-runtime/test/kdo-h4-r2a-confinement-contract.test.ts`
- `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts`

R2C explicitly supersedes only those old gateway/receipt byte pins.

The reconciled tests must continue to prove their original predecessor semantics and must continue to pin every authority surface that R2C does not authorize.

They MUST NOT weaken or remove H4-R2A/H4-R2B behavioral proofs.

The new H4-R2C focused test becomes the owner of the intentional gateway/receipt drift boundary.

## 17. Exact implementation allowlist

After this authorization is canonical, H4-R2C implementation may modify exactly these ten paths:

1. `packages/kodac-runtime/native/landlock-run.c`
2. `packages/kodac-runtime/src/trust/confinement-linux-landlock.ts`
3. `packages/kodac-runtime/src/trust/confinement-runtime.ts`
4. `packages/kodac-runtime/src/execution/gateway.ts`
5. `packages/kodac-runtime/src/evidence/receipt.ts`
6. `packages/kodac-runtime/src/index.ts`
7. `packages/kodac-runtime/test/kdo-h4-r2a-confinement-contract.test.ts`
8. `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts`
9. `packages/kodac-runtime/test/kdo-h4-r2c-k2-linux-landlock-read-only.test.ts`
10. `docs/planning/KODAC_KDO_H4_R2C_K2_LINUX_LANDLOCK_READ_ONLY_EVIDENCE_2026-08-14.md`

No other path is authorized.

The evidence ledger path (#10) MUST remain absent until the pre-ledger candidate satisfies the full R2C gate.

## 18. Authorized predecessor blobs

At authorization base:

- `packages/kodac-runtime/native/landlock-run.c`: `d39cbeeb1715dfec07e95235f8647ba9fb1e5b46`
- `packages/kodac-runtime/src/trust/confinement-linux-landlock.ts`: `94b325f73246514f31b950ba4fed38023e3e3cfc`
- `packages/kodac-runtime/src/execution/gateway.ts`: `8b481c226276d0b06fabc8d614c1295cd0881a6a`
- `packages/kodac-runtime/src/evidence/receipt.ts`: `bc11267496f8c8a2ca1dac713baccf88ec962b19`
- `packages/kodac-runtime/src/index.ts`: `e856a172af82a998ecfa249ac46dcf7a1b8dc14f`
- `packages/kodac-runtime/test/kdo-h4-r2a-confinement-contract.test.ts`: `b76c0beb039fd1c96508c2b61b3dede581ce3f50`
- `packages/kodac-runtime/test/kdo-h4-r2b-linux-landlock-backend.test.ts`: `c54695965089e72e51ce7c8114161aafca2cfe91`

The new `confinement-runtime.ts`, R2C focused test, and R2C evidence ledger do not exist at this base.

## 19. Explicitly protected paths

R2C does NOT authorize modifications to:

- `packages/kodac-runtime/src/trust/confinement.ts`
- `packages/kodac-runtime/src/trust/policy.ts`
- `packages/kodac-runtime/src/trust/approval.ts`
- `packages/kodac-runtime/src/verification/done-gate.ts`
- `packages/kodac-runtime/src/agent/loop.ts`
- `packages/kodac-runtime/src/tools/registry.ts`
- `packages/kodac-runtime/package.json`
- `packages/kodac-runtime/scripts/run-tests.mjs`
- `packages/kodac-runtime/THIRD_PARTY_NOTICES.md`
- any `.github/workflows/*`
- any model/session/provider surface.

Protected current blobs include:

- `trust/confinement.ts`: `873f235120645c0a12f10a5bff7e9591db6bb341`
- `trust/policy.ts`: `b4134e430204123bebe053ffc9105f05fca611c9`
- `trust/approval.ts`: `d36a604cb1957bc65dac3978c626ba48a9b299fb`
- `verification/done-gate.ts`: `067e147569fa52cc2b04c5df26fbe20a01e958e9`
- `agent/loop.ts`: `a5b7c2bbb2a5f7658f683e7baf45655b41b775f8`
- `tools/registry.ts`: `0bdf5cfd02efda7cab0c81976c7735bc7b46081b`
- `package.json`: `af4c20a3dae387c15cc5fb2eb28d415c8f115b95`
- `scripts/run-tests.mjs`: `9a0bcde0e565168c78eb7fe4d3cf08236d24baa7`
- `THIRD_PARTY_NOTICES.md`: `d6f39bc1711714a8a186a69de69cffe666a8f304`

## 20. Explicit non-grants

H4-R2C does NOT authorize:

- `workspace-write` confinement;
- `danger-full-access`;
- external-process `ask` re-enablement;
- any H4-R1 approval semantic change;
- target executable-byte identity/pinning;
- target PATH resolution;
- unconfined fallback;
- generic `runCommand` semantic widening;
- automatic confinement of Git/repository built-ins;
- packaging/distribution/installation of a native launcher;
- checked-in compiled binaries;
- bwrap integration;
- network, signal, IPC, namespace, mount, cgroup, container, VM, or seccomp isolation;
- read confidentiality;
- macOS confinement;
- Windows confinement;
- policy changes;
- Done Gate changes;
- plugin/agent/model/session authority;
- CI workflow changes.

## 21. Required R2C focused proofs

The new R2C focused test must prove at minimum:

### Structural/runtime contract

- trusted runtime config is strict, immutable, bounded, and cannot be supplied by the untrusted command call;
- attempt identities are valid and distinct for repeated executions;
- workspace-root identity is deterministic for the same root and changes for a different root;
- full confinement request/evidence/record/commit lineage validates exactly;
- malformed/unknown/tampered/proxy/accessor inputs fail closed without executing hooks;
- receipt binding is immutable and rejects semantic substitution.

### Launcher artifact identity

- launcher must be absolute and expected SHA-256 must be exact lowercase 64-hex;
- launcher is opened once for the verified execution artifact;
- only a regular bounded file is accepted;
- observed digest is computed from the retained open descriptor;
- digest mismatch blocks before launcher execution;
- retained descriptor bytes stay original even if the configured path is replaced after open;
- controlled invocation executes through `/proc/self/fd/<fixed-fd>` using that inherited descriptor;
- failure to use the descriptor path fails closed rather than reopening the configured path.

### Native handshake

- READY is emitted only after Landlock restriction succeeds;
- no target execution occurs before GO;
- EOF/malformed permit blocks target execution;
- malformed/oversized readiness evidence blocks;
- `partial` never becomes `full`;
- setup failure never executes target.

### Durable evidence sequencing

- full READY alone is insufficient;
- durable evidence commit failure prevents GO and prevents target execution;
- malformed commit acknowledgment prevents GO;
- valid full evidence commit precedes GO;
- target executes only after commit acknowledgment validates;
- partial evidence may be committed but never receives GO;
- cancellation while evidence commit is pending prevents GO;
- late commit resolution after cancellation cannot launch the target.

### K2 integration / receipts

- policy `deny` never opens/spawns the launcher;
- policy `ask` remains blocked before launcher and before approval service;
- policy `allow` with no trusted confinement runtime blocks;
- valid policy `allow` + full durable confinement runs target under the controlled launcher;
- target filesystem write attempt outside `/dev/null` fails;
- a read operation can succeed, without implying read confidentiality;
- target success receipt contains exact confinement binding;
- target non-zero/failure receipt after GO retains the same confinement binding;
- receipt evidence persistence failure remains `ExecutionUnprovenError` semantics;
- existing `runCommand`, Git, patch, approval, and non-confined receipt behavior remain unchanged.

### Cross-platform

- Linux integration proof MUST execute on Ubuntu CI and must not be skipped;
- macOS/Windows may skip only Linux-native integration subtests while all structural tests pass;
- no non-Linux platform may claim Landlock enforcement.

## 22. Pre-ledger acceptance gate

Before the R2C evidence ledger may be added:

- changed paths must be a subset of paths 1–9;
- ledger path absent;
- all protected blobs unchanged;
- legacy R2A/R2B test reconciliation must be limited to superseded gateway/receipt pins and must not weaken predecessor behavior;
- TypeScript typecheck PASS;
- full runtime suite PASS;
- no new Ubuntu skip hiding R2C integration;
- patch benchmark PASS;
- governance PASS;
- runtime classifier PASS;
- Ubuntu PASS;
- macOS PASS;
- Windows PASS;
- K2 final gate PASS;
- K3-R4 PASS;
- K3-R5 PASS;
- Linux launcher same-FD identity proof PASS;
- Linux controlled handshake proof PASS;
- durable evidence-before-GO proof PASS;
- target no-write proof PASS;
- policy ask-still-blocked proof PASS;
- CodeRabbit/reviewer findings adjudicated;
- unresolved review threads = 0.

Any inability to prove same-FD launcher execution, durable evidence-before-GO ordering, or no-target-before-GO is BLOCKING and must not be converted into a skip.

## 23. Evidence ledger gate

Only after Section 22 passes may this path be added:

`docs/planning/KODAC_KDO_H4_R2C_K2_LINUX_LANDLOCK_READ_ONLY_EVIDENCE_2026-08-14.md`

The ledger must record at minimum:

- authorization merge/base and authorization document identity;
- exact pre-ledger head/tree;
- predecessor H4-R2A/H4-R2B identities;
- exact modified-path blobs;
- launcher expected and observed artifact digest used in Linux proof;
- same-FD execution proof;
- observed Landlock ABI and claim-set classification;
- execution-attempt/request/evidence/record/commit/receipt lineage sample identities from fixture proof where safe;
- exact sequencing proof that durable commit precedes GO;
- test counts;
- exact CI run/job results;
- review status;
- protected blobs;
- all non-claims.

After ledger addition, every pre-ledger CI result becomes historical and the full exact-head post-ledger matrix must run again.

## 24. Completion claim

If and only if implementation, pre-ledger proof, evidence capture, post-ledger proof, review, and merge all pass, R2C may claim:

`KODAC_K2_LINUX_LANDLOCK_READ_ONLY_EXECUTION_BINDING_PROVEN`

This claim means only:

- K2 owns one Linux read-only Landlock execution path;
- launcher artifact identity is bound through a verified retained descriptor;
- Landlock readiness is observed before target exec;
- durable confinement evidence is proven before K2 sends GO;
- resulting K2 receipts bind to that evidence.

It does NOT mean:

- external-process approval is enabled;
- target executable bytes are pinned;
- workspace-write is supported;
- all K2 commands are sandboxed;
- read confidentiality exists;
- network/process/IPC isolation exists;
- macOS/Windows confinement exists;
- H4 is complete;
- Kodac is universally sandboxed.

## 25. Expected next slices

After successful R2C merge, later separately authorized work may evaluate:

- H4-R2D: workspace-write mapping and exact write-scope enforcement;
- a later target-executable identity slice;
- only after target identity is solved, a separately authorized external-process one-shot approval re-enable slice;
- non-Linux confinement backends independently.

No later slice is authorized by this document.

## 26. Authorization decision

Decision:

`AUTHORIZED_FOR_DOCS_REVIEW_ONLY`

No R2C implementation may begin until this authorization document passes docs/governance/review gates, is merged to canonical `main`, and the resulting exact canonical base is re-established.
