# Repository Architecture — Kernux Agent Index

*Status: Ratified — S0-C Founder Ratification (2026-07-20). Phase 1 implemented locally; independent acceptance pending.*

> Authoritative decisions live in [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md). On conflict, FOUNDER_DECISIONS.md wins.

## Canonical data format (ratified)

- **YAML** is the canonical representation for profiles and run metadata.
- **JSON Schema** is used for validation.
- **Markdown profiles, README tables, and any website pages are generated views**, not the source of truth.
- Human-readable Markdown is **not** the canonical database.
- **Python** is the only repository tooling language for v1.
- **No database** is introduced in v1.

This is a deliberate change from any earlier "Markdown-as-database" sketch: Markdown is rendered **from** YAML so that schema validation, generation, and diff review all operate on a single canonical form.

## Top-level layout (implemented + future)

```
/                         # Repo root
├── README.md             # Public entry point (generated in part; see README_DRAFT.md)
├── LICENSE               # Apache-2.0 (preserved)
├── CODE_OF_CONDUCT.md    # Community conduct (added at launch)
├── CONTRIBUTING.md       # How to add/correct a profile or run (added at launch)
├── SECURITY.md           # Reporting policy + scope (added at launch)
├── agents/               # CANONICAL source data: one directory per agent
│   └── <agent-slug>/     # one profile per agent: agents/<agent-slug>/profile.yaml
├── schema/               # JSON Schema validators
│   └── agent-profile.schema.json   # IMPLEMENTED in Phase 1
│   # run.schema.json                 — future (no Runs in Phase 1)
├── tasks/                # FUTURE — task definitions: tasks/<task-slug>/TASK.yml + fixtures/ (not yet implemented)
├── runs/                 # FUTURE — one YAML per run: runs/<agent-slug>/<task-slug>/<run-id>/RUN.yml (not yet implemented)
├── matrix/               # GENERATED comparison tables (Markdown); do not hand-edit
├── reports/              # DATED analytical reports (Markdown), derived only from committed evidence
│   └── YYYY-MM.md
├── proof/                # RESERVED (Kernux Proof, future); not built in v1
│   └── README.md         # states explicitly: not built in the initial milestone
├── policy/               # Editorial and evidence policy (normative Markdown)
│   ├── EDITORIAL_AND_EVIDENCE_POLICY.md
│   └── SOURCING.md
├── tools/                # Python-only generators/validators (stdlib where possible)
│   ├── validate_profiles.py     # IMPLEMENTED
│   ├── profile_io.py            # IMPLEMENTED (shared profile IO)
│   ├── compatibility.py         # IMPLEMENTED (centralized compatibility checks)
│   ├── generate_matrix.py       # IMPLEMENTED
│   └── validate_run.py          # FUTURE (not yet implemented)
└── docs/                 # Historical (pre-reboot) + contributor docs
    └── legacy/           # Old trust-kernel material, marked non-canonical
```

## Design rules

1. **Reader-first, zero-install.** The repository is useful to a reader without installing anything. Contributors who want to validate/regenerate run Python tools.
2. **YAML is canonical.** All profile facts live in `agents/<id>/profile.yaml` as YAML validated by JSON Schema. Markdown in `matrix/` and the report's tables are generated; a header states: *"This file is generated. Edit the YAML in agents/, not this file."*
3. **JSON Schema is the validation contract.** `validate_profiles.py` validates profile YAML against the JSON Schema in `schema/` (`schema/agent-profile.schema.json`). `validate_run.py` is future.
4. **Generated artifacts are clearly marked and deterministic.** `generate_matrix.py` reads `agents/<id>/profile.yaml` and emits `matrix/*.md` deterministically.
5. **Python-only tooling for v1.** Scripts use only the standard library where possible; any third-party Python must be justified and documented.
6. **Historical material is preserved, not deleted.** The pre-reboot `docs/` and `nexusmcp/` material stays where it is, referenced from `docs/legacy/` as historical/non-canonical. It is not moved, copied, or deleted by this pass.

## Data model (conceptual)

- **AgentProfile** (in `agents/<agent-slug>/profile.yaml`) — see [AGENT_PROFILE_SCHEMA.md](AGENT_PROFILE_SCHEMA.md). **Implemented** (OpenCode profile in Phase 1).
- **TaskDefinition** (in `tasks/<task-slug>/TASK.yml`) — see [INITIAL_TASK_SET.md](INITIAL_TASK_SET.md). **Future** (not yet implemented).
- **RunEvidence** (in `runs/<agent-slug>/<task-slug>/<run-id>/RUN.yml`) — see [RUN_EVIDENCE_SCHEMA.md](RUN_EVIDENCE_SCHEMA.md). **Future** (not yet implemented).
- **Report** (in `reports/YYYY-MM.md`) — derived only from committed Run YAML; no off-repo data.

Linking convention:
- A Run path encodes `runs/<agent-slug>/<task-slug>/<run-id>/`.
- A Report cites Runs by relative path so claims are auditable.

## Run identity (ratified)

Every result is bound to a complete configuration tuple (agent name; agent version; underlying model; model version when available; subscription/API/service tier; execution mode; configuration; permissions; operating system; hardware/runtime environment; task-set revision; fixture commit or digest; execution date; cost methodology; evidence-bundle digest). A configuration-specific result is **never** attributed to an agent universally.

## Initial tooling scope (small)

- `validate_profiles.py` — validates `agents/<id>/profile.yaml` against `schema/agent-profile.schema.json`. **Implemented.**
- `validate_run.py` — validates `runs/**/RUN.yml` against `schema/run.schema.json`. **Future** (no Runs in Phase 1).
- `generate_matrix.py` — reads `agents/<id>/profile.yaml`, emits `matrix/*.md`. **Implemented.**

The implemented scripts are single-file Python modules using the standard library where possible. The run validator is not yet implemented because Runs are out of Phase 1 scope.

## Explicit non-goals for v1

- No web app, backend, database, or hosted control plane.
- No containerized verification in the repo (Kernux Proof is reserved).
- No telemetry from the repository itself.
- No auto-updater that fetches vendor pages on a schedule without human review.
- No non-Python tooling in `tools/` for v1.

## Relationship to old repo content

- `docs/` (pre-reboot architecture docs) and `nexusmcp/` (OmniBridge prototype) → preserved, referenced as historical, **not** migrated.
- No file is moved or deleted by this pass.
- Legacy archival is a later, separately authorized Git operation (see [FOUNDER_DECISIONS.md](FOUNDER_DECISIONS.md)).

## Implementation authorization

**Phase 1 implemented locally.** Independent acceptance pending. Phase 2 remains unauthorized. The implemented tree (`agents/opencode/profile.yaml`, `schema/agent-profile.schema.json`, `tools/validate_profiles.py`, `tools/generate_matrix.py`, plus `tools/profile_io.py` and `tools/compatibility.py`) is in place; Runs, tasks, and `validate_run.py` remain future work pending Phase 2.
