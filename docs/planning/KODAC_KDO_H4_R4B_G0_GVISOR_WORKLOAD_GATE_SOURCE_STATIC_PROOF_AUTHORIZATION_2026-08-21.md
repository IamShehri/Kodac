# KODAC KDO H4-R4B-G0 — gVisor Workload Gate Source + Static Proof Authorization

Date: 2026-08-21
Status: **AUTHORIZATION CANDIDATE — DOCS ONLY — NO LIVE EXECUTION AUTHORITY**
Repository: `TheHalfMoon/Kodac`

## 1. Purpose

Authorize one isolated future implementation slice for the minimal trusted pre-workload gate selected by canonical H4-R4B-B2B architecture decisions.

This authorization is intentionally narrower than B1-v2, B2A-v2, or B2B.

Its only product-facing objective is to make one tiny auditable native gate source and its focused proof surface exist so that a later artifact-release theorem can pin concrete bytes before any gated Docker integration is considered.

The intended safety property is:

```text
NO_EXACT_GO_PLUS_STDIN_EOF
=>
NO_WORKLOAD_EXEC
```

and the future B2B composition target remains:

```text
WORKLOAD_PROCESS_OCCURRENCES_BEFORE_DURABLE_ARM=0
```

This document does not itself implement the gate.

---

## 2. Exact canonical base

```text
repository=TheHalfMoon/Kodac
canonical_main=64ff51346c7f631ea96f9e8f08c0cf97ac8ed13e
canonical_tree=45248594eeb7d53d5bc76fdffb07b07dd3dd4ddb
PR_141=MERGED_CANONICAL
```

PR #141 canonically selected:

```text
PREFERRED_TRUSTED_GATE_DELIVERY=
LOCAL DIGEST-PINNED DEDICATED GATE IMAGE
+ API_V1_48_TYPE_IMAGE_MOUNT
+ EXACT_LOCAL_IMAGE_PREFLIGHT
+ EXACT_RESOLVED_IMAGE_ID_SOURCE
+ SAFE_FIXED_SUBPATH
+ READ_ONLY_MOUNT
+ STATIC_DEDICATED_GATE
```

and declared the next safe gate:

```text
G0 DEDICATED TRUSTED GVISOR WORKLOAD GATE SOURCE + STATIC ARTIFACT PROOF AUTHORIZATION
```

No B1-v2/B2A-v2/B2B implementation authority exists at this base.

---

## 3. Pinned Docker attach evidence used to close the permit-framing blocker

Pinned Moby source remains:

```text
MOBY_COMMIT=d430e1c2c7e53611d16d19d2ffb8c6fecae5dae3
MOBY_API_VERSION=1.48
```

Pinned Engine API and server/client code establish all of the following:

1. `POST /containers/{id}/attach` is a hijacked bidirectional stream.
2. `stdin`, `stdout`, and `stderr` may share that hijacked connection.
3. Docker's client `HijackedResponse` exposes a distinct `Reader` for output.
4. Docker's client explicitly exposes `CloseWrite()` to close only the client-to-daemon write direction when the underlying connection supports it.
5. Docker server attach plumbing treats the same connection as stdin read-side plus stdout/stderr write-side.
6. Kodac B2A currently retains the upgraded Node `Socket` itself as the one live prestart continuity anchor.

Therefore the future B2A-v2 transport may preserve output continuity while terminating gate stdin by a write-half-close rather than by closing the whole hijacked socket.

This authorization does not implement that B2A-v2 transport.

---

## 4. G0 permit protocol is now pinned

G0 pins exactly one protocol version:

```text
GATE_PROTOCOL_VERSION=kodac-gvisor-workload-gate-v1
```

The only valid release payload is exactly the three ASCII bytes:

```text
GO\n
```

followed by EOF on gate stdin.

Normative grammar:

```text
VALID_PERMIT_BYTES = 0x47 0x4f 0x0a
VALID_PERMIT_LENGTH = 3
EOF_AFTER_VALID_PERMIT = REQUIRED
```

No other framing is valid.

The gate must reject without workload exec:

```text
EOF before any bytes
EOF after 1 byte
EOF after 2 bytes
wrong 3-byte payload
4 or more bytes before EOF
correct GO\n followed by any extra byte before EOF
read error
```

The gate must not infer a valid permit from a prefix.

The gate must not release merely after receiving three bytes; it must observe EOF and prove that no fourth byte exists.

---

## 5. Future B2A-v2 transport consequence

This G0 grammar requires the future B2A-v2 owner to perform purpose-equivalent behavior only after all later authorization gates are satisfied:

```text
write exactly GO\n
-> verify exact write settlement
-> write-half-close the retained hijacked socket
-> preserve the same socket read half
-> continue one-reader stdout/stderr ownership
```

Forbidden future substitutions include:

```text
full socket close as release
second attach connection as permit writer
new TCP/Unix socket control channel
Docker exec as permit transport
signal-based release
file-based release
polling filesystem release
fixed-length release without EOF validation
```

No B2A-v2 change is authorized by G0.

---

## 6. G0 gate responsibility

The gate must do exactly this conceptual work and no more:

```text
1. validate invocation contains a deferred target;
2. require deferred target path to be absolute;
3. treat argv[1] as the exact deferred target executable;
4. treat argv[2..] as the exact original target arguments;
5. read gate-control stdin under a hard four-byte bound;
6. require exact GO\n plus EOF;
7. close stdin before target exec;
8. exec the exact deferred target path with exact deferred argv;
9. on any pre-exec failure, exit without executing target.
```

The gate must not parse workload options.

The gate must not rewrite target argv.

The gate must not search `PATH`.

The gate must inherit the already-admitted environment and working directory without reading environment variables as gate configuration.

---

## 7. Exact target argv theorem

Future B1-v2 composition is expected to be purpose-equivalent to:

```text
Docker Entrypoint = [fixed trusted gate executable]
Docker Cmd = [workloadExecutable, ...workloadArgs]
```

The gate's process argv therefore has the purpose-equivalent shape:

```text
argv[0] = fixed gate path
argv[1] = exact absolute workloadExecutable
argv[2..] = exact workloadArgs
```

After permit validation, target exec argv must be exactly:

```text
[argv[1], argv[2], ...]
```

No synthetic flag may be inserted.

No argument may be removed, normalized, shell-quoted, decoded, expanded, or reordered.

---

## 8. Control stdin must not become workload stdin

Before target exec, the gate must close file descriptor 0.

Required theorem:

```text
GATE_CONTROL_STDIN=OPEN_ONLY_DURING_PRE_RELEASE_GATE
WORKLOAD_STDIN=NOT_INHERITED_FROM_GATE_CONTROL_CHANNEL
```

The gate must not duplicate stdin to another descriptor.

The gate must not reopen stdin.

The gate must not forward permit bytes.

The gate must not expose an interactive stdin path to the workload.

---

## 9. No gate output before target exec

The gate itself must emit no stdout or stderr bytes before target exec.

This keeps B2A's existing prestart invariant compatible with the future architecture:

```text
PRESTART_ACCEPTED_RAW_PAYLOAD_BYTES=0
```

Failure before target exec should therefore be represented only by the gate process exit status and later lifecycle evidence, not by gate diagnostic text on stdout/stderr.

Required G0 source behavior:

```text
PRE_EXEC_GATE_STDOUT_BYTES=0
PRE_EXEC_GATE_STDERR_BYTES=0
```

---

## 10. Minimal native implementation boundary

G0 may add exactly one dedicated native source file:

```text
packages/kodac-runtime/native/gvisor-workload-gate.c
```

The implementation must be dedicated to this gate only.

It must not modify or reuse `landlock-run.c` directly.

It may use ordinary POSIX/Linux process primitives required for:

```text
read
close
execv/execve
_exit
```

No broader native authority is granted.

---

## 11. Forbidden gate source features

The G0 source must not contain or invoke purpose-equivalent functionality for:

```text
socket
connect
bind
listen
accept
send
recv
HTTP
Docker API
gVisor RPC
Landlock
seccomp setup
mount
namespace operations
cgroup operations
process enumeration
fork
clone
posix_spawn
shell execution
system
popen
PATH lookup
configuration files
plugin/module loading
locale loading by application logic
credential access
filesystem policy
signal-based release
sleep/retry polling
randomness
clock/deadline ownership
workload stdin forwarding
stdout/stderr diagnostics before target exec
```

The source is not a policy engine and is not a runtime controller.

---

## 12. Static/self-contained proof requirement

G0 must define and test one build recipe proving a test artifact no weaker than:

```text
cc
-std=c11
-O2
-Wall
-Wextra
-Werror
-static
```

plus only the exact source/output arguments needed by the focused test.

The proof artifact must satisfy:

```text
ELF executable
no PT_INTERP
no DT_NEEDED
no runtime shared-library dependency
no script/shebang interpreter
```

A dynamic executable is a hard failure.

A fallback from `-static` to dynamic linking is forbidden.

A host where the required static toolchain is unavailable must fail/skip according to the focused test's explicit platform policy; it must never silently weaken the theorem.

This G0 test build is not the final production gate artifact release.

Concrete production toolchain identity, reproducible image build, gate image manifest digest, and final gate binary SHA-256 remain later artifact-release work.

---

## 13. Hostile loader environment proof

The focused proof must show that hostile loader-control environment variables cannot execute code in the gate before permit release.

At minimum test with purpose-equivalent hostile values for:

```text
LD_PRELOAD
LD_LIBRARY_PATH
```

The proof must distinguish:

```text
pre-GO gate execution
```

from permitted post-GO workload behavior.

The gate itself must not consult or sanitize workload environment values because future B1-v2 must preserve the admitted workload environment semantics.

The static/no-loader theorem is what prevents those variables from changing gate execution before GO.

---

## 14. Focused hostile protocol proof

The future G0 focused test must cover at least:

```text
missing deferred target => no exec
relative deferred target => no exec
EOF with zero bytes => no exec
G + EOF => no exec
GO + EOF => no exec
NO\n + EOF => no exec
GO\r + EOF => no exec
GO\nX + EOF => no exec
GO\n + EOF => exact target exec
```

The successful fixture must prove exact target argv preservation.

The fixture must also prove target stdin is closed after release.

The fixture must distinguish gate output from target output and prove the gate contributes zero bytes before exec.

---

## 15. Static source audit proof

The focused test should additionally pin a simple source-level denylist sufficient to catch accidental authority growth.

At minimum reject the source if it introduces purpose-equivalent references to forbidden APIs from Section 11.

The denylist is defense-in-depth only.

It does not replace behavioral tests or binary inspection.

---

## 16. Artifact identities produced by G0

A completed G0 evidence record may report concrete values for the test-built artifact, including:

```text
source Git blob SHA
source SHA-256
source byte size
focused test Git blob SHA
build recipe text/identity
test-host compiler version observation
test binary SHA-256
test binary byte size
ELF machine/class observation
PT_INTERP=ABSENT
DT_NEEDED=ABSENT
```

These observations must be labeled as G0 proof-artifact evidence, not yet as the final production gate-image artifact identity.

G0 does not pin:

```text
production gate image manifest digest
production local Docker image ID
production reproducible-build toolchain digest
production gate mount subpath
production gate executable container path
production image payload release
```

Those belong to a later separately authorized artifact-release/integration step.

---

## 17. Exact implementation allowlist after this authorization becomes canonical

Only after this authorization PR is merged and canonical, G0 implementation may modify exactly these three paths:

```text
1. packages/kodac-runtime/native/gvisor-workload-gate.c
2. packages/kodac-runtime/test/kdo-h4-r4b-g0-gvisor-workload-gate.test.ts
3. docs/planning/KODAC_KDO_H4_R4B_G0_GVISOR_WORKLOAD_GATE_EVIDENCE_2026-08-21.md
```

No other path is authorized.

In particular, G0 must not modify:

```text
packages/kodac-runtime/src/execution/gateway-gvisor-docker-dormant-create-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-docker-prestart-output-runtime.ts
packages/kodac-runtime/src/execution/gateway-gvisor-output-channel-internal.ts
packages/kodac-runtime/src/trust/sandbox-lifecycle-gvisor-ttl.ts
packages/kodac-runtime/src/trust/sandbox-output-gvisor.ts
packages/kodac-runtime/src/index.ts
package.json
lockfiles
Dockerfiles
GitHub workflows
```

No package-root export is needed for G0.

---

## 18. Execution authority remains separately constrained

This authorization grants repository mutation scope only after it becomes canonical.

It does not override any founder/current-session prohibition on executing workloads or processes.

Therefore, while such a prohibition remains active:

```text
G0_SOURCE_MUTATION_AFTER_CANONICAL_AUTH=MAY_BE_ALLOWED
G0_TEST_PROCESS_EXECUTION=NOT_GRANTED_BY_THIS_DOCS_PR
DOCKER_EXECUTION=NO
GVISOR_EXECUTION=NO
WORKLOAD_EXECUTION=NO
```

A future implementation PR must obey the live founder execution constraint even if that means its behavioral proof cannot yet be run.

No repository document authored by the implementation may silently supersede that external execution constraint.

---

## 19. No Docker/image work in G0

G0 must not:

```text
start Docker
call Docker create
call Docker start
call Docker attach
build a Docker image
load a Docker image
pull a Docker image
push a Docker image
inspect live Docker state
run runsc
create a gVisor sandbox
ARM R3G-D
write GO to a Docker attach socket
execute an admitted workload
```

The dedicated gate image selected by PR #141 remains conceptual until a later artifact-release slice.

---

## 20. Relationship to R2C donor

`packages/kodac-runtime/native/landlock-run.c` remains a design donor only.

G0 may reproduce only generic protocol/security ideas that are already part of Kodac's own canonical design, such as:

```text
hard bounded permit read
exact GO grammar
EOF validation
close control descriptor before target exec
absolute target path
fail closed before target exec
```

G0 must not import Landlock-specific code or authority.

G0 must not modify R2C source/tests/contracts.

---

## 21. Required evidence verdict

A completed G0 evidence document must not claim more than the proof actually establishes.

Maximum successful G0 verdict:

```text
G0_SOURCE_AND_STATIC_TEST_ARTIFACT_PROVEN
```

It must not claim:

```text
PRODUCTION_GATE_ARTIFACT_RELEASED
GATE_IMAGE_PROVEN
B1_V2_READY
B2A_V2_READY
B2B_READY
DOCKER_START_AUTHORIZED
WORKLOAD_EXECUTION_AUTHORIZED
H4_COMPLETE
```

---

## 22. Merge gate for the future G0 implementation PR

A future G0 implementation PR may merge only if all applicable gates are proven on its exact head:

```text
CHANGED_PATHS=EXACTLY_3_ALLOWLISTED_PATHS_OR_FEWER
NO_OUT_OF_SCOPE_PATHS=PASS
SOURCE_SCOPE_AUDIT=PASS
STATIC_BINARY_PROOF=PASS
PERMIT_PROTOCOL_PROOF=PASS
EXACT_ARGV_PROOF=PASS
CLOSED_STDIN_PROOF=PASS
PRE_EXEC_ZERO_OUTPUT_PROOF=PASS
HOSTILE_LOADER_ENV_PROOF=PASS
EXACT_HEAD_CI=PASS
FRESH_INDEPENDENT_EXACT_HEAD_REVIEW=PASS
UNRESOLVED_ACTIONABLE_THREADS=0
FINAL_MAIN_HEAD_DIFF_FENCE=PASS
EXPECTED_HEAD_SHA_MERGE_FENCE=PASS
```

If current founder execution constraints prevent process-based focused proofs, the implementation PR must remain unmerged rather than weakening or waiving those gates.

---

## 23. Explicit non-grants

Nothing in this authorization grants:

```text
G0 implementation before this authorization becomes canonical
process execution contrary to founder constraints
Docker start/create/attach mutation
Docker image build/load/pull/push
runsc execution
gVisor sandbox creation
workload execution
B1-v2 implementation
B2A-v2 implementation
B2B implementation
live qualification
live measurement
TTL ARM by B2B
GO dispatch over Docker
Docker kill/stop/remove/restart
runsc kill
host PID kill
R3G-D/E/F widening
R3G-F E4
H4 completion
H6
K3-R6+
```

---

## 24. Authorization verdict

If and only if this exact-head docs-only authorization becomes canonical:

```text
R4B_G0_SOURCE_STATIC_PROOF_IMPLEMENTATION=AUTHORIZED_WITHIN_EXACT_ALLOWLIST
R4B_G0_LIVE_OR_DOCKER_EXECUTION=NOT_AUTHORIZED
R4B_G0_MAX_RESULT=G0_SOURCE_AND_STATIC_TEST_ARTIFACT_PROVEN

GATE_PROTOCOL_VERSION=kodac-gvisor-workload-gate-v1
GATE_PERMIT_BYTES=GO\n
GATE_PERMIT_LENGTH=3
GATE_PERMIT_REQUIRES_EOF=YES
GATE_CONTROL_STDIN_CLOSED_BEFORE_TARGET_EXEC=YES

B1_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2A_V2_IMPLEMENTATION=NOT_AUTHORIZED
B2B_IMPLEMENTATION=NOT_AUTHORIZED
DOCKER_START=NO
WORKLOAD_EXECUTION=NO
TTL_ARM_BY_B2B=NO
R3G_F_E4=NO
H4_COMPLETE=NO
```

The purpose of G0 is to isolate and prove the smallest possible trusted pre-workload gate before any Docker/gVisor integration is allowed to consume it.