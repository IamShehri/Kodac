# Kodac Main Protection Strategy — 2026-08-11

## Decision

```text
RATIFIED — IMPLEMENTATION PENDING PLATFORM RULESET WRITE
```

Current GitHub repository rulesets query returned an empty list at review time. Canonical `main` is therefore not yet protected by a repository ruleset.

## Required ruleset

Target:

```text
refs/heads/main
```

Required posture:

- enforcement active;
- no routine bypass actor;
- pull request required before merge;
- block branch deletion;
- block force pushes;
- require all configured status checks to pass;
- require conversations to be resolved before merge when review comments exist;
- do not allow direct donor/source-import commits to `main`;
- provenance and governance validation must be a required check once the workflow is present on canonical main.

## Initial required checks

After the governance workflow is merged to canonical main, require at minimum:

```text
governance / provenance
quality / legacy-tests
```

The exact check display names must be verified from the first canonical workflow runs before being entered into the ruleset.

## Merge policy

During K0/K1 and early K2:

- changes merge through reviewed PRs;
- no force-update of reviewed branches after approval without re-review;
- upstream synchronization follows ADR-0003;
- source imports require an authorized provenance import record;
- `main` remains the sole canonical release/integration line.

## Implementation limitation

The connected GitHub control surface used during this gate can read repository rulesets but exposes no ruleset write action. Therefore this document ratifies the exact intended protection but does not claim that GitHub enforcement is active.

## Closure condition

Before the first K2 implementation PR is merged into `main`:

1. create the `main` ruleset;
2. verify it targets only the intended ref;
3. verify force-push/deletion protections;
4. verify required checks use the names emitted by canonical workflows;
5. record the ruleset id, name, enforcement state, and bypass actors in a post-activation verification record.
