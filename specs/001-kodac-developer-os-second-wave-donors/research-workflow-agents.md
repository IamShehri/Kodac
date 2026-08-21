# Research — Spec Workflow and Harness Agent Slices

## Boundary

```text
source inspection only
no donor execution
no production import
```

## KDO-S4 — Specification-Driven Agent Workflow

Donor: `github/spec-kit@e79fa25f3f465b1ce779f570ccacef7b379e9166`.

Pinned command sources:

```text
templates/commands/specify.md        54151e8b423026a356e228eb04d1a6aa368c385c
templates/commands/plan.md           664f4281142ada0d1e678d46976c4b36df7d68d0
templates/commands/tasks.md          64146a35aacbef8f607be9dc4e376b191af8cd4e
templates/commands/implement.md      742c45e185c917c3055bb51ef6427658148e6ae2
templates/commands/analyze.md        2cd83bd7c031e01af1f3e5745168982d9085a3aa
templates/commands/converge.md       eadb96ee5822b70d0b5669e6d4a32134af0e2598
docs/reference/extensions.md         919617a087a40b2e5fedabc234a39ff3b5a2fe72
```

Useful donor pattern:

```text
constitution
-> specify
-> clarify/checklist where needed
-> plan
-> tasks
-> analyze
-> implement
-> converge
```

Extension catalogs, project configuration, local overrides, environment overrides, and before/after hooks make the workflow extensible.

Kodac divergence:

- workflow phase names are not authority;
- an installed extension is not trusted merely because it is registered;
- a mandatory hook declaration cannot auto-authorize execution;
- extension catalog precedence cannot override Kodac capability policy;
- every repository mutation remains K2-mediated;
- every model-visible artifact should bind to S1 lineage identities;
- analysis and convergence remain separate from KRI adjudication and Done Gate.

Proposed Kodac workflow state:

```text
INTENT_CAPTURED
SPECIFIED
PLANNED
TASKED
ANALYZED
IMPLEMENTATION_IN_PROGRESS
SPEC_CONVERGED
VERIFICATION_PENDING
VERIFIED
PROVEN_READY
```

Only the final state remains owned by Done Gate.

Disposition:

```text
BEHAVIORAL_REIMPLEMENTATION_PLUS_SELECTIVE_PORT
priority: HIGH
recommended_gate: KDO-S4
```

## KDO-H5 — Agent Turn / Step / Cancellation Lifecycle

Donor: `deepseek-ai/deepseek-harness@47f943859bef60e4160492346772ded9b24f765a`.

Pinned sources:

```text
packages/core/agent-loop/src/agent.ts            668ef6582657ed0e1e4420777696ee50251371ad
packages/core/agent-loop/src/index.ts            371154a7c9e849a444a4806268e4b2d861b8f22b
packages/core/agent-loop/src/invariant.ts        80fdfba8f900a471b8d9c7d65d99b5eeedd2841b
packages/core/agent-loop/src/runtime-context.ts  63b353ebaee1ff214ab483b187201e8c5e53fc34
packages/core/agent-loop/src/tool-calls.ts       3acfe7140df536f179baed2cb387b19a141ce42a
```

Useful donor concepts:

- explicit lifecycle ownership for live agents and startup work;
- teardown abort signal shared across lifecycle operations;
- creation/resume work races against teardown instead of hanging;
- late values arriving after cancellation can be explicitly released;
- tool parallelism is bounded and validated;
- configured session identity is launcher-owned rather than silently replaced by patchable model configuration.

Kodac target should bind:

```text
AgentRunIdentity
SessionIdentity
TurnIdentity
StepIdentity
ModelAttemptIdentity
ToolBatchIdentity
CancellationIdentity
StopReason
ParentEvidenceIdentity
RepositoryHead
ContextBundleIdentity
```

Kodac should preserve separate budgets for turns, tool calls, elapsed time, provider failures, concurrency, and cancellation. Lifecycle state must not grant side-effect authority; tool execution still routes through K2.

Disposition:

```text
PORT
priority: HIGH
recommended_gate: KDO-H5
```

## KDO-H6 — Subagents + Background Jobs

Pinned subagent sources:

```text
packages/subagent/subagent/src/index.ts          fe270f1b4c0b2e2afe38aba805fed449a116ca10
packages/subagent/subagent/src/child-agent.ts    7582338858f470909494ef8640e06c4b09b81561
packages/subagent/subagent/src/continuation.ts   d826efbfdb4695913fb536e90cbb58500bb25c61
packages/subagent/subagent/src/depth.ts          d9fabab86094a79be4f4f35c44efcea89c00bde0
packages/subagent/subagent/src/descriptor.ts     6d9dedee75b70fcbb2eec44a897645c7b8a21e39
```

Pinned jobs sources:

```text
packages/jobs/jobs/src/index.ts                  7d46dfa342a4a3980dc77c88ba39875facbef35e
packages/jobs/jobs/src/invariant.ts              5963179c00efbb6a6d08c878bce26b96c28a4755
packages/jobs/jobs/src/types.ts                  2842f6a3a57988895e0a7627c2a97476148fbd40
```

Useful donor concepts:

- persisted delegation depth is authoritative and runtime input may deepen but never lower it;
- jobs have registry-owned identity/lifecycle while producers own execution resources;
- owner session fences access and owner disposal cancels/awaits jobs;
- cancellation is distinct from proof that underlying work actually stopped;
- job projections are snapshots, not mutable live registry state.

Kodac strengthening:

```text
max child depth
max child count per parent
max total descendants per root task
max concurrent child agents
max total model/tool budget
max elapsed child budget
default no authority inheritance
explicit capability delegation receipt
parent/child evidence links
repository/context freshness per child
```

A child agent must never inherit repository-write, credential, network, or merge authority merely because the parent has it. Delegation is explicit and narrowing by default.

Disposition:

```text
PORT
priority: HIGH
recommended_gate: KDO-H6
```

## KDO-H7 — LSP / Terminal / Workflow Capability Seams

Pinned LSP sources:

```text
packages/lsp/lsp/src/index.ts                    05e2cd36436874d57424d29187b512af99e58399
packages/lsp/lsp/src/invariant.ts                512775798b01a068a6e82a62a34e5719f93c233a
packages/lsp/lsp/src/types.ts                    2e61d019cac937ae1e21382663b23d211852b4a5
```

Pinned terminal sources:

```text
packages/terminal/terminal/src/index.ts          d9e54444651ae1adcaaf80b653dca68472258a48
packages/terminal/terminal/src/invariant.ts      c264a1c3245d5c5a47f67569913811feacff3e90
packages/terminal/terminal/src/types.ts          cbdd08d8a882ea0ce95a061e97afb8735f6aa136
```

Pinned workflow sources:

```text
packages/workflow/workflow/src/index.ts          e345ab55d4c028a793b66b0cf6b2d414b178f9c0
packages/workflow/workflow/src/invariant.ts      47dc82d0bf9affab359841ca142990402b4c0ba9
packages/workflow/workflow/src/runtime-types.ts  2e3525f9c320be65ff112a9d5e7db0289a272ab3
packages/workflow/workflow/src/types.ts          52a0bac78560d12688d9b1e22745b39ac819f278
```

The Harness LSP seam is especially useful: it exposes a closed semantic-query vocabulary (`goToDefinition`, `findReferences`, `goToImplementation`, `hover`) and deliberately exposes no generic JSON-RPC escape hatch. Provider registration atomically reserves identity/extension mappings and returns a disposer.

Kodac decision:

- LSP should feed/validate the C1/C2 semantic graph; LSP results are derived evidence, not canonical source truth by themselves;
- navigation/read queries remain distinct from refactoring/edit authority;
- terminal/process execution always remains K2-mediated;
- persistent terminal identity and output can be modeled separately from permission to create/write/kill processes;
- workflow scripts may orchestrate authorized capabilities but can never bypass K2, child-agent bounds, policy, KRI, or Done Gate.

Disposition:

```text
PORT
priority: HIGH_AFTER_C1_C2_AND_H1
recommended_gate: KDO-H7
```

## Broad-audit result

Every planned second-wave component now has an initial source-backed disposition:

```text
S1 PORT
S2 PORT_OR_REIMPLEMENT
S3 PORT
S4 REIMPLEMENT_PLUS_SELECTIVE_PORT
H1 PORT
H2 PORT
H3 STUDY_PLUS_TARGETED_PORT
H4 PORT
H5 PORT
H6 PORT
H7 PORT
```

No production intake is authorized by these dispositions.