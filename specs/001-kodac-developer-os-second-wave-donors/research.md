# Research — Second-Wave Donor Decisions

## Boundary

```text
SOURCE INSPECTION ONLY
NO DONOR EXECUTION
NO PRODUCTION IMPORT
```

## KDO-S1 — Specification Artifact & Lineage Contracts

Donor: `github/spec-kit` at `e79fa25f3f465b1ce779f570ccacef7b379e9166`.

Pinned sources:

```text
docs/reference/core.md                        fdf0b80e7ffcc6dd52a677bd418bf27c76df39a5
scripts/python/common.py                      db958dc1cbdcfef48fbcf2b1495569d5f9937377
scripts/python/create_new_feature.py          f36064afbb7488a99fd67d1e95a7982171fa20ea
templates/constitution-template.md            a4670ff46919b276a4c9663b4ca51830108fcfc0
templates/spec-template.md                    ceb28776215a098e977650ac090c785dcbf53651
templates/plan-template.md                    36f2eab16880bac670fe43cbe7ef2b9bc8c3aa2f
templates/tasks-template.md                   7fff087cc5a3c51a889d865fd9126607a032d233
```

Finding: Spec Kit cleanly separates project selection from active-feature selection and reconstructs `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`, and `contracts/` from the chosen feature directory.

Kodac divergence: active-feature state is navigation, not execution truth. KDO-S1 should add immutable identities for constitution/spec/plan/tasks plus exact repository head and repository-content identity.

Disposition:

```text
PORT
PRIORITY VERY_HIGH
RECOMMENDED_GATE KDO-S1
```

## KDO-S2 — Constitution + Cross-Artifact Analysis

Pinned source:

```text
templates/commands/analyze.md                 2cd83bd7c031e01af1f3e5745168982d9085a3aa
```

Finding: the donor analysis is explicitly read-only, analyzes spec/plan/tasks consistency, treats constitution constraints as higher priority, and classifies duplication, ambiguity, underspecification, coverage gaps, and inconsistency.

Kodac divergence: analysis findings should be typed and bound to artifact identities and evidence. Extension hooks must not gain execution rights merely by being declared.

Disposition:

```text
PORT_OR_REIMPLEMENT
PRIORITY HIGH
RECOMMENDED_GATE KDO-S2
```

## KDO-S3 — Convergence Planner

Pinned source:

```text
templates/commands/converge.md                eadb96ee5822b70d0b5669e6d4a32134af0e2598
```

Finding: convergence compares the current implementation with spec/plan/tasks and appends remaining work instead of rewriting prior task history.

Kodac divergence:

```text
SPEC_CONVERGED != VERIFIED != PROVEN_READY
```

KDO-S3 should bind convergence to the exact evaluated repository state and return remaining-work evidence without becoming an execution or completion authority.

Disposition:

```text
PORT
PRIORITY HIGH
RECOMMENDED_GATE KDO-S3
```

## KDO-H1 — Plugin / Capability Seam Contract

Donor: `deepseek-ai/deepseek-harness` at `47f943859bef60e4160492346772ded9b24f765a`.

Pinned sources:

```text
docs/cordis-primer.md                         2a3afe180623d89b006dfa3e73aba5567c15bbe9
vendor/cordis/src/context.ts                  0488423088e4da284d28c2d2cef887a5c69ed0f5
vendor/cordis/src/fiber.ts                    38a3197e293ca3dafa6d9d924a2eafbd2231bd94
vendor/cordis/src/registry.ts                 478cf036cb2339fcd6c092ee0cb6f2babc500014
vendor/cordis/src/service.ts                  dc5742f8c22d338e6aee874b5bca51b3e3031165
```

The Harness vendored Cordis snapshot records upstream Cordis commit `56b3d4f725681cf4556c1a8695a709cc3b6eed74` plus documented local lifecycle and configuration changes.

Finding: Context, Registry, Service, and Fiber provide mature scoped service resolution, declared dependency injection, plugin runtime records, lifecycle states, and owner-bound reversible effects.

Kodac divergence:

> Everything may be extensible except authority.

Service/plugin registration may contribute capabilities but must not itself create trusted authority. Kodac should port reversible lifecycle and capability-seam concepts while keeping its trusted kernel distinct.

Disposition:

```text
PORT
WHOLE_FRAMEWORK_ADOPTION NO
PRIORITY VERY_HIGH
RECOMMENDED_GATE KDO-H1
```

## Interim dependency order

```text
1. KDO-S1
2. KDO-H1
3. KDO-H2 / KDO-S2 dependency review
4. remaining S/H gates after source audit
```

S1 provides exact artifact/repository lineage for later work. H1 provides typed extensibility without changing Kodac authority boundaries.