# Kodac K0/K1 Governance CI Verification — 2026-08-11

## Decision

```text
PASS — GOVERNANCE WORKFLOW VERIFIED ON PUBLISHED BRANCH HEAD
```

Verified commit:

```text
bc1b162f5ccd03f8e35f5b4d174f7393677c852a
```

Workflow:

```text
governance
run: 31440802982
event: push
conclusion: success
```

## Jobs

### provenance

```text
SUCCESS
```

The job successfully completed:

- checkout;
- `uv sync --frozen --dev`;
- `uv run python tools/validate_provenance.py`.

This verifies the published provenance schema/validator against the repository manifests including the reviewed-but-not-authorized OpenCode patch intake record.

### legacy-tests

```text
SUCCESS
```

The job successfully completed:

- checkout;
- `uv sync --frozen --dev`;
- `uv run pytest`;
- `uv run ruff check .`.

## Authorization boundary

Workflow success does not authorize donor source intake.

The controlling state remains:

```text
code_import_authorized: false
K2 donor source import: not authorized
main mutation: not authorized
```

## Remaining blockers

- G1 name/trademark clearance remains RED.
- The ratified `main` protection ruleset is not yet activated because the connected GitHub control surface does not expose a ruleset write action.

Therefore G7 final K0/K1 closure and G8 K2 source-intake authorization remain blocked.
