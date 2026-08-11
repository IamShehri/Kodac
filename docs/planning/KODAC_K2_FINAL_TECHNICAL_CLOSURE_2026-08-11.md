# Kodac K2 Final Technical Closure — 2026-08-11

## Decision

```text
PASS — K2 REAL PROVIDER QUALIFICATION AND CONTROLLED LIVE EXECUTION TECHNICALLY CLOSED
BLOCKED — CANONICAL MAIN MERGE AND PUBLIC BRAND LAUNCH
```

Repository:

```text
IamShehri/Kodac
```

K2 branch:

```text
feat/kodac-k2-runtime-spine
```

Verified K2 HEAD:

```text
fb18b4e252cdb2eb186b03de43f552b85c08578c
```

This is the isolated K2 branch HEAD on which the runtime proof was verified. It
is not canonical `main`, and this record does not imply that K2 has merged to
`main`.

## Closure scope

This record closes the isolated K2 technical runtime proof:

```text
real provider
→ streaming
→ tool calling
→ bounded agent loop
→ trusted exact-scope mutation
→ verification planning
→ verification execution
→ receipts/evidence
→ Done Gate
→ PROVEN_READY
```

The authorization boundaries remain explicit:

```text
K2 technical closure != canonical main merge authorization
K2 technical closure != public release authorization
K2 technical closure != legal name clearance
```

## S8D — Real provider qualification

```text
Provider:
openai

Model:
gpt-5.1

Session:
6f66fe12-76e4-4adf-a5e4-8f602781c23b

Verdict:
PASS — 9/9
```

The nine required checks passed:

```text
credential.preflight
live.text_stream
live.request_metadata
live.repo_list
live.repo_read
live.repo_search
live.tool_result_continuation
agent.bounded_termination
workspace.no_write
```

Real Responses streaming succeeded. Request and response identifiers were
present, and token usage was present.

`repo.list`, `repo.read`, and `repo.search` executed through the real bounded
agent loop. Every read-only tool result was supplied to a subsequent model turn.
The workspace remained unchanged throughout qualification.

Credential evidence established:

```text
secretPersisted=false
```

No API key or other secret is recorded in this closeout.

## S8E — First controlled real-model solve

```text
Provider:
openai

Model:
gpt-5.1

Solve session:
4651b991-83dc-4125-b7d9-c1294ea83d1d

Authorization:
a82cf3bb-1c17-4406-b9f1-d9134c5b1a95

Fixture HEAD:
b8eb47a0ad4fac8ee871dce20fca5ae8bfc6d59e
```

Task:

```text
Fix src/greeting.js so the existing test passes. You may modify only src/greeting.js. Do not create, delete, move, or modify any other file. Keep the change minimal.
```

Exact allowed write scope:

```text
src/greeting.js
```

Actual changed paths:

```text
src/greeting.js
```

Post-solve repository facts:

```text
added files:
none

deleted files:
none

staged changes:
none

untracked files:
none

fixture Git HEAD changed:
no
```

The exact semantic patch was:

```diff
 export function greeting(name) {
-  return `Hello ${name}`
+  return `Hello, ${name}!`
 }
```

## Agent execution

```text
turnsUsed:
4

toolCallsUsed:
4

failuresUsed:
0

elapsedMs:
7613
```

The elapsed value describes this observed run only and is not a performance
guarantee.

## Verification

```text
risk:
medium

commands:
fixture-test
js-root-test-cdb4ee

warnings:
none
```

Verification results:

```text
fixture-test:
PASS

automatic JS verification:
PASS

independent post-solve test:
PASS
```

## Receipts

The successful execution persisted exactly five successful receipt
capabilities:

```text
repo.apply_patch
git.diff
git.status
verification.command.fixture-test
verification.command.js-root-test-cdb4ee
```

The `repo.apply_patch` receipt recorded:

```text
added:
[]

modified:
- src/greeting.js

deleted:
[]
```

## Done Gate

```text
status:
PROVEN_READY

proven:
true

reasons:
[]

Kodac exit code:
0
```

This is the first verified real-model Kodac execution in which a live provider
produced a mutation that reached `PROVEN_READY`.

That statement is limited to this isolated K2 execution. It does not claim
production readiness for the Kodac product as a whole and does not assert
benchmark superiority over any competitor.

## Evidence lifecycle closeout

For the successful controlled solve:

```text
required artifacts:
present

required lifecycle events:
present

failure events:
0

event count:
225

independent final test:
PASS
```

## Artifact inventory

| Artifact | External path | SHA-256 |
|---|---|---|
| Qualification report | `/home/shehri/kodac-evidence/provider-function-call-qualification-20260811-190416/6f66fe12-76e4-4adf-a5e4-8f602781c23b/qualification-report.json` | `b5459ffb776cce775ad9a95ca3ebaa8d6b3f3dfd760b6fe660752ff378516c63` |
| Authorization | `/home/shehri/kodac-evidence/first-controlled-live-solve-retry-20260811-191416/authorizations/a82cf3bb-1c17-4406-b9f1-d9134c5b1a95/authorization.json` | `1a8c4440d522abaf3521a0fa94f568dab8aaa834b42e4548c50504a29b5e1959` |
| Controlled live-solve report | `/home/shehri/kodac-evidence/first-controlled-live-solve-retry-20260811-191416/authorizations/a82cf3bb-1c17-4406-b9f1-d9134c5b1a95/controlled-live-solve-report.json` | `b0e9135efc22f7d234c84adf1a937f7b21947a0145ab54aa80395efcfd5d9fa5` |
| Events | `/home/shehri/kodac-evidence/first-controlled-live-solve-retry-20260811-191416/4651b991-83dc-4125-b7d9-c1294ea83d1d/events.jsonl` | `8476613b93ebd54393d0a067bd7b8ec716a544ea3025f40b4a223f85ec8f9242` |
| Receipts | `/home/shehri/kodac-evidence/first-controlled-live-solve-retry-20260811-191416/4651b991-83dc-4125-b7d9-c1294ea83d1d/receipts.jsonl` | `a56f8d48b5d4d9579c4c828b05f8492c045ed1229f6ac75a279c452eb0083890` |
| Verification plan | `/home/shehri/kodac-evidence/first-controlled-live-solve-retry-20260811-191416/4651b991-83dc-4125-b7d9-c1294ea83d1d/verification-plan.json` | `21d991cb2759125d1a62e9740817005633e85ea1949d59963a08806feba41300` |
| Proof | `/home/shehri/kodac-evidence/first-controlled-live-solve-retry-20260811-191416/4651b991-83dc-4125-b7d9-c1294ea83d1d/proof.json` | `566fa223785cc62975686fd5b3462572a3016f8d895120ab3d91b2959d59ac78` |

Raw evidence remains external to the repository. This tracked closeout records
stable artifact identities and reviewed verdicts; the external evidence is not
copied into Git.

## Failure/provenance history

The successful result does not erase the causal history that preceded it.

### 1. API credit exhaustion

The first real qualification attempt reached upstream OpenAI streaming but
terminated with:

```text
credit_balance_exhausted
insufficient_quota
```

This was an external billing blocker, not proof of a Kodac runtime defect.

### 2. Nested streaming error compatibility

Live OpenAI error events exposed a nested error shape that required bounded
diagnostic compatibility.

The correction preserved fail-closed behavior and preserved the prohibition on
leaking secrets or raw provider payloads. No raw secret-bearing payload is
reproduced in this record.

### 3. Missing streamed function-call name

The live Responses API emitted a `response.function_call_arguments.done` event
without `name`.

Kodac was corrected so that streamed `.done.name` is optional while final
executable authority remains:

```text
response.completed.response.output[]
```

Partial streaming events do not authorize execution.

### 4. First controlled live-solve budget stop

The first controlled solve attempt ended with:

```text
reason:
max_tool_calls

turnsUsed:
3

toolCallsUsed:
4

failuresUsed:
0
```

The tool sequence reached a requested fifth call:

```text
repo.apply_patch
```

The configured `maxToolCalls=4` budget denied that request before execution.

```text
mutation:
none

fixture state:
unchanged

proven:
false
```

This is positive fail-closed evidence: the bounded loop stopped before an
unauthorized-over-budget mutation could execute. The later successful
controlled solve retained a bounded execution budget while allowing a realistic
completion path.

## K2 technical conclusion

```text
K2 isolated runtime technical proof:
CLOSED — PASS

real OpenAI provider qualification:
PASS

real streaming:
PASS

real read-only tool calling:
PASS

tool-result continuation:
PASS

controlled write:
PASS

exact write scope:
PASS

verification:
PASS

execution receipts:
PASS

DoneGate:
PROVEN_READY

canonical main merge:
BLOCKED / NOT AUTHORIZED

main protection ruleset:
RATIFIED BUT NOT ACTIVE

public brand launch:
BLOCKED / NOT AUTHORIZED

Kodac name clearance:
NOT ESTABLISHED

next named milestone:
NOT YET CANONICALLY DEFINED
```

## Next gate

The next documented gate is:

```text
activate and independently verify the ratified canonical main protection ruleset
→ perform a dedicated K2 merge-readiness review
```

This gate is not a K3 definition and does not authorize a merge.
