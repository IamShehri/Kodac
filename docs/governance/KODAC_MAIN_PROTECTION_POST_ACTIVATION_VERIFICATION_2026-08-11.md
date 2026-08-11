# Kodac Main Protection Post-Activation Verification — 2026-08-11

## Decision

```text
PASS — CANONICAL MAIN PROTECTION ACTIVE AND INDEPENDENTLY VERIFIED
```

Repository:

```text
IamShehri/Kodac
```

Ruleset:

```text
Kodac canonical main protection v1
```

Ruleset ID:

```text
20707483
```

## Previous state

Before platform activation:

```text
repository rulesets:
none

main:
c425dca6e9d5474aca50d288064fa56eb21a1b9e

K2:
02ee7e3dc5427866b72a3b21ea260efc43ab07dc
```

The governing strategy record is:

```text
docs/governance/KODAC_MAIN_PROTECTION_STRATEGY_2026-08-11.md
```

At its historical checkpoint, that record correctly stated:

```text
RATIFIED — IMPLEMENTATION PENDING PLATFORM RULESET WRITE
```

This post-activation record supersedes only that implementation-status truth.
It does not alter, replace, or rewrite the strategy record's historical content,
required posture, or merge policy.

## Active ruleset identity

```text
name:
Kodac canonical main protection v1

id:
20707483

target type:
branch

target:
refs/heads/main

excluded refs:
none

enforcement:
active

source type:
Repository

source:
IamShehri/Kodac

bypass actors:
none

current_user_can_bypass:
never
```

The repository ruleset listing returned exactly one repository ruleset: ruleset
`20707483`, named `Kodac canonical main protection v1`, with active
enforcement.

## Effective protection

```text
pull request required:
yes

required review-thread resolution:
yes

required approving review count:
0

dismiss stale reviews on push:
no

code-owner review required:
no

last-push approval required:
no

force/non-fast-forward push:
blocked

branch deletion:
blocked
```

Allowed merge methods:

```text
merge
squash
rebase
```

Zero required approving reviews does not remove the pull-request requirement.
The `pull_request` rule requires changes to reach `refs/heads/main` through the
pull-request path. The configured merge methods describe permitted PR merge
mechanisms; they do not authorize any particular PR or merge.

## Required checks

The exact required checks are:

| Check | Source | Integration ID |
|---|---|---:|
| `provenance` | GitHub Actions | `15368` |
| `legacy-tests` | GitHub Actions | `15368` |

```text
strict required status checks:
enabled

enforce on branch creation:
yes

do_not_enforce_on_create:
false
```

## Effective-rules verification

The authoritative effective-rules query:

```text
GET /repos/IamShehri/Kodac/rules/branches/main
```

returned exactly these four effective rule types:

```text
deletion
non_fast_forward
pull_request
required_status_checks
```

All four originated from:

```text
ruleset_id:
20707483

ruleset_source_type:
Repository

ruleset_source:
IamShehri/Kodac
```

This verification relies on the effective-rules result, not on a legacy
branch-protection subobject.

## Ref immutability

During the platform-only activation operation:

```text
main before:
c425dca6e9d5474aca50d288064fa56eb21a1b9e

main after:
c425dca6e9d5474aca50d288064fa56eb21a1b9e

K2 before:
02ee7e3dc5427866b72a3b21ea260efc43ab07dc

K2 after:
02ee7e3dc5427866b72a3b21ea260efc43ab07dc
```

```text
repository file mutations during activation:
none

commits during activation:
none

pushes during activation:
none

PRs during activation:
none
```

No push or repository mutation was used as an enforcement test. Creation of
this post-activation record is a separate, subsequently authorized
documentation-only mutation.

## Governance conclusion

```text
main protection strategy:
IMPLEMENTED

main ruleset:
ACTIVE

main protection verification:
PASS

K2 technical closure:
PASS

K2 merge-readiness:
NOT YET REVIEWED

K2 merge to main:
NOT AUTHORIZED BY THIS RECORD

public brand launch:
NOT AUTHORIZED

Kodac name clearance:
NOT ESTABLISHED
```

Active protection does not establish K2 merge-readiness and does not itself
authorize opening or merging a pull request.

## Next gate

```text
Dedicated K2 merge-readiness review.
```

This record does not authorize opening, merging, or auto-merging a K2 PR. It
does not define K3.
