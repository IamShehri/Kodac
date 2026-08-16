# Kodac Continuity Handoff — 2026-08-16

> Purpose: durable conversation handoff so a new chat can recover founder direction, active work, and the exact next investigation step without relying on chat memory.
>
> **Authority rule:** this is a dated snapshot, not a substitute for live GitHub verification. Before any mutation, re-read repository canonical documents and re-check the live PR/head/checks/reviews. Canonical repository truth outranks this handoff if anything has changed.

## 1. Repository and founder operating rules

Repository:

```text
TheHalfMoon/Kodac
```

Founder communication preference:

- discussion with founder: Arabic;
- ready-to-use technical prompts: English.

Founder execution rules preserved:

- verify live repository/GitHub state before every mutation;
- canonical repository documents outrank chat memory and this dated handoff;
- do not merge unless the canonical gate permits;
- do not start unrelated later-stage work while the active authorized H4 slice is incomplete;
- do not create the R3G-A evidence ledger until the implementation head fully satisfies the pre-ledger gate;
- correctness, security, deterministic evidence, provenance, and fail-closed behavior must not be sacrificed for speed;
- external reviewers/services that are unavailable or rate-limited are recorded as unavailable/neutral, never converted into PASS;
- Kodac remains the active project name. `Times` / `TimesCode` is not the current rename.

No root `AGENTS.md` existed at the verified canonical base used for this snapshot. Do not invent one; verify again in a future session.

## 2. Live canonical main at snapshot time

Verified `main`:

```text
6441a3083c6cd94cfbc73369079916050c56248a
```

Commit subject:

```text
docs(kdo): reconcile H4-R3G-A initial cgroup namespace (#104)
```

The active docs/research preservation branch created for future-direction notes is separate from both `main` and the implementation PR:

```text
docs/kodac-continuity-research-2026-08-16
```

This branch is documentation-only and must not be interpreted as R3G-A implementation authorization.

## 3. Active implementation work: H4-R3G-A / PR #102

PR:

```text
#102
feat(kdo): prove H4-R3G-A cgroup-v2 resource observer
```

Snapshot state:

```text
state: open
draft: false
merged: false
mergeable: true
base: main
base SHA: 6441a3083c6cd94cfbc73369079916050c56248a
head branch: feat/kdo-h4-r3g-a-cgroup-v2-resource-observer
head SHA: 937020b08689c83e1e256f969b12a82cd59c2aae
changed files: 13
```

Relevant canonical authorization document:

```text
docs/planning/KODAC_KDO_H4_R3G_A_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_AUTHORIZATION_2026-08-16.md
```

Reserved evidence ledger path:

```text
docs/planning/KODAC_KDO_H4_R3G_A_LINUX_CGROUP_V2_PHYSICAL_RESOURCE_OBSERVATION_EVIDENCE_2026-08-16.md
```

At the implementation head used for this handoff, the evidence ledger must remain absent. Do not create it before the pre-ledger gate is proven.

## 4. Canonical pre-ledger gate summary

The implementation gate requires, at minimum:

- exact diff within the authorized allowlist;
- full CI/typecheck/tests;
- focused R3G-A proof;
- manual trust/security review;
- zero unresolved actionable review threads;
- no evidence ledger before the gate passes.

After the pre-ledger gate passes, the ledger transition must be ledger-only, followed by full certification again.

Important authorization properties preserved:

- fixed internal host read authority;
- caller must not inject PID/path/reader/helper/cgroup root authority;
- production must not expose arbitrary host reader, shell traversal, or broad host discovery;
- R3G-A is E3 observation only and cannot mint R3B physical evidence;
- hostile cases include malformed/missing cgroup controls, namespace drift, subject drift, commit failure/wrong acknowledgment, cancellation/late completion, and related fail-closed cases;
- the resource record has a fixed maximum serialized byte bound;
- test-only fixed-surface harnesses/readers are permitted where canonical authorization allows them; production arbitrary-reader authority is not;
- symlink language concerns preventing arbitrary path-discovery authority and arbitrary symlink-following authority, not requiring a literal source token such as `O_NOFOLLOW` unless a future canonical document explicitly says so.

## 5. Authorized 13-path pre-ledger surface

The PR changed exactly the authorized 13 paths at the verified snapshot:

1. `packages/kodac-runtime/src/execution/gateway.ts`
2. `packages/kodac-runtime/src/trust/index.ts`
3. `packages/kodac-runtime/src/trust/sandbox-observer-gvisor-cgroup-v2.ts`
4. `packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts`
5. `packages/kodac-runtime/test/kdo-h4-r3a-attested-sandbox-workload.test.ts`
6. `packages/kodac-runtime/test/kdo-h4-r3b-sandbox-runtime-evidence.test.ts`
7. `packages/kodac-runtime/test/kdo-h4-r3d-gvisor-runtime-observer.test.ts`
8. `packages/kodac-runtime/test/kdo-h4-r3f-docker-gvisor-runtime-provider.test.ts`
9. `packages/kodac-runtime/test/kdo-h5-r1a-tool-result-pruning.test.ts`
10. `packages/kodac-runtime/test/kdo-h5-r2a-repeat-call-signal.test.ts`
11. `packages/kodac-runtime/test/kdo-h5-r3a-tool-call-guard-pipeline.test.ts`
12. `packages/kodac-runtime/test/kdo-h5-r3b-tool-call-guard-runtime-integration.test.ts`
13. `packages/kodac-runtime/test/kdo-h5-r4a-agent-step-reconstruction.test.ts`

Do not broaden the R3G-A implementation diff without new canonical authority.

## 6. Implementation-head history preserved

Relevant head progression during R3G-A reconciliation:

```text
8fe3f2ad74b201b2967bee93396184febf514d5b
35bf4659f148537e315ea91fc0de7b80a3923e8c
8eeec30b6091d79e7cdd8307c4c528f118b8e46a
229a22187c4f09a9c597bf67de4a24682bdf9409
e731c44a2ca1441b2848531f5403c328e624fdc1
937020b08689c83e1e256f969b12a82cd59c2aae
```

### 6.1 Gateway-byte pin reconciliation

At the earlier head, R3G-A focused behavior passed but exactly nine predecessor protected-surface tests failed because the authorized gateway change altered the gateway Git blob hash.

Actual new gateway blob hash used for those predecessor pins:

```text
5e4c3cea801997464a2bd972613b473e9ffcba12
```

Old expected hash was:

```text
420df04c5e0a42b371a250d75e580c36bb32f8cb
```

An atomic pin-only reconciliation updated the nine authorized predecessor tests. Gateway production bytes have not subsequently changed in the documented sequence, so do not edit those pin files again unless gateway bytes actually change.

### 6.2 Serialized resource-record bound

Manual canonical review found a real R3G-A contract defect: the authorization required a fixed maximum serialized resource-record byte bound, but the production module initially lacked one.

The correction introduced:

```text
maxRecordSerializedBytes: 64 * 1024
```

and a fail-closed bounded-record validation path used by record creation/validation.

### 6.3 Focused hostile/failure proof expansion

Focused tests were expanded to cover, among other things:

- exact synthetic CPU/memory/no-swap success;
- root cgroup rejection;
- excessive hierarchy depth;
- wrong cgroup2 mount;
- CPU mismatch, burst, scheduler/affinity restrictions, malformed controls;
- memory/swap mismatch and malformed controls;
- PID membership mismatch;
- ambiguous mount/cgroup/CPU-list grammar;
- validator re-derivation and hostile proxy inputs;
- R3E lineage fixture binding;
- R3G-A resource record/commit identity;
- stale post-snapshot rejection;
- forged R3E durable acknowledgment;
- forged R3G-A durable acknowledgment;
- callback failure;
- wrong acknowledgment;
- pre-cancel, during-cancel, and late-completion non-upgrade;
- runtime config rejection of injected reader/cgroupRoot-style authority;
- structural gateway authority assertions;
- protected-surface blob pins.

### 6.4 Structural-test over-coupling corrections already made

Three test corrections were made because structural assertions were testing source-shape details not actually required by the canonical authorization:

1. literal `O_NOFOLLOW` expectation removed; the canonical requirement is the authority boundary, not a token;
2. literal `KDO_H4_R3G_A_CGROUP_ROOT` expectation removed; the gateway may rely on a pure helper that fixes `/sys/fs/cgroup`;
3. `runCommand(` was removed from a regex that accidentally scanned from the R3G-A method start to end-of-file and therefore matched unrelated later methods.

The third correction was incomplete: the source extraction still extends to EOF, causing another false positive described below.

## 7. Exact CI state at head 937020b

Verified GitHub Actions workflow run:

```text
k2-runtime run id: 31927409975
```

Jobs:

```text
runtime-change-classifier: PASS
runtime (windows-latest): FAIL
runtime (macos-latest): FAIL
runtime (ubuntu-latest): FAIL
k2-runtime-gate: FAIL
```

For all three runtime jobs, TypeScript typecheck passed and the `npm test` step failed.

Ubuntu job:

```text
95117021427
```

Exact Ubuntu test summary:

```text
tests 592
pass 589
fail 1
skipped 2
```

The single failing test is:

```text
H4-R3G-A gateway integration remains fixed-surface E3-only fail-closed authority
```

Location:

```text
packages/kodac-runtime/test/kdo-h4-r3g-a-gvisor-cgroup-v2-resource-observer.test.ts
```

The exact failing assertion is:

```text
assert.doesNotMatch(methodSource, /options\.(?:pid|path|reader|helper)/)
```

The Actions log proves `methodSource` contains the complete `observeGvisorCgroupV2Resources(...)` method **and then continues into the subsequent `runCommand(...)` method and later source**, because it was created by slicing from the R3G-A method start to EOF.

The R3G-A method's own caller options are only:

```text
options: { signal?: AbortSignal } = {}
```

Within the R3G-A method, observed `options.*` access is `options.signal`; the false positive comes from unrelated later source captured by the unbounded slice.

Therefore the currently proven defect is a **focused structural-test extraction bug**, not evidence that production R3G-A exposes caller-controlled PID/path/reader/helper authority.

## 8. Exact next action for a future chat

Before any mutation:

1. Re-fetch PR #102 and confirm head remains `937020b08689c83e1e256f969b12a82cd59c2aae` (or inspect and reconcile if it moved).
2. Re-read the canonical R3G-A authorization.
3. Re-confirm the evidence ledger remains absent.
4. Re-confirm the exact failing test/log if Actions have rerun.

If the head and failure remain exactly as captured above, the narrowest justified correction is test-only: delimit `methodSource` to the body of `observeGvisorCgroupV2Resources(...)` instead of slicing to EOF, then keep the strong no-injected-authority regex **inside that bounded method source**.

A robust shape would be conceptually:

```ts
const methodStart = gatewaySource.indexOf("async observeGvisorCgroupV2Resources(")
assert.notEqual(methodStart, -1)

const methodTail = gatewaySource.slice(methodStart)
const nextMethod = methodTail.indexOf("\n  async runCommand(")
assert.notEqual(nextMethod, -1)

const methodSource = methodTail.slice(0, nextMethod)

assert.doesNotMatch(methodSource, /options\.(?:pid|path|reader|helper)/)
```

Do **not** apply this merely from this handoff if live source/head differs. Re-fetch the focused test and gateway first and preserve all unrelated bytes.

After the correction:

- run/observe full Ubuntu/macOS/Windows runtime CI;
- require `k2-runtime-gate` PASS;
- re-run focused R3G-A proof;
- perform manual trust/security review on the exact final implementation head;
- verify zero unresolved actionable review threads;
- establish truthful exact-head reviewer status;
- only then create the ledger as a ledger-only transition if the canonical gate allows it;
- run full certification again after the ledger transition;
- do not merge until canonical governance permits.

## 9. Current production R3G-A boundary preserved

The current gateway path, as reviewed during this snapshot, is intended to:

- accept only `{ signal?: AbortSignal }` as caller options;
- deny ASK;
- require Linux;
- require trusted R3E and R3G-A runtime configuration;
- resolve container binding through a bounded trusted callback;
- observe retained runsc/helper artifacts;
- perform R3E state/process observation #1;
- observe the trusted cgroup namespace;
- take R3G-A physical snapshot #1;
- perform R3E stats/state/process observation #2;
- verify exact R3E subject identity;
- re-check cgroup namespace before the second snapshot;
- take R3G-A physical snapshot #2;
- verify namespace and stable physical snapshot identities;
- reverify retained artifacts;
- create R3E candidate/lineage;
- durably commit and validate R3E lineage evidence;
- re-check namespace before resource commit;
- create R3G-A resource record;
- durably commit and validate R3G-A resource evidence;
- persist success/failure receipt;
- close retained artifact handles in `finally`.

Fixed host-reading helpers use fixed procfs/cgroup2 surfaces and derived cgroup paths. Production must continue to expose no arbitrary caller-selected host reader/cgroup root/path authority.

## 10. Review truth preserved

Reviewer status must always be anchored to the exact current head.

Historical CodeRabbit/Qodo reviews from older heads are not exact-head certification for a later head.

Cubic previously returned a neutral/rate-limit-style state because a trial review limit was reached; such a result is not PASS.

The GitHub combined status API later surfaced `CodeRabbit: success` for head `937020b...`, but this alone does not replace manual review, unresolved-thread checks, exact Actions checks, or any additional reviewer requirements defined by canonical governance.

## 11. Long-term product/research direction preserved elsewhere

Future research and architecture ideas from the same discussion are durably stored in:

```text
docs/research/KODAC_FUTURE_INTELLIGENCE_RESEARCH_2026-08-16.md
```

That document preserves:

- `NO_KODAC_IMPOSED_ARTIFICIAL_LIMITS`;
- local-first/self-hosted/BYOK/BYOM/provider-failover/distributed execution direction;
- Faraday/Replica and the learned-engineer-above-coding-agents idea;
- episodic/semantic/procedural/private/shared agent memory;
- foundation-agent architecture lessons;
- `self-improving != self-authorizing`;
- LeWorldModel-inspired repository world models;
- Kodac Engineering Surprise;
- Kodac Counterfactual Engineering;
- Kodac Experience Network;
- Kodac Learned Intelligence (`KLI-*`) future research track;
- the requirement that these remain research until explicitly authorized and must not derail H4.

## 12. Minimal startup protocol for a new chat

A new assistant/session should begin approximately as follows:

```text
Repository: TheHalfMoon/Kodac

Read repository canonical instructions/docs first.
Read docs/planning/KODAC_CONTINUITY_HANDOFF_2026-08-16.md as a dated snapshot only.
Read docs/research/KODAC_FUTURE_INTELLIGENCE_RESEARCH_2026-08-16.md for future product/research direction.

Then verify live:
- main SHA
- PR #102 state/base/head
- current changed paths
- exact GitHub Actions checks/logs
- review submissions and unresolved threads
- evidence-ledger absence/presence

Do not trust snapshot SHAs if live GitHub has moved.
Do not merge.
Do not create the R3G-A evidence ledger before the canonical pre-ledger gate passes.
Finish R3G-A before starting broader Kodac Learned Intelligence architecture implementation.
```
