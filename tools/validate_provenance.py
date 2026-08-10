from __future__ import annotations

import json
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
PROVENANCE = ROOT / "provenance"
SCHEMA_PATH = ROOT / "schema" / "provenance-import-record.schema.json"


def load_yaml(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def fail(message: str) -> None:
    raise ValueError(message)


def validate_global_policy(upstreams: dict) -> bool:
    if upstreams.get("schema_version") != 1:
        fail("provenance/upstreams.yaml: unsupported schema_version")
    policy = upstreams.get("policy")
    if not isinstance(policy, dict):
        fail("provenance/upstreams.yaml: missing policy mapping")
    required = (
        "code_import_authorized",
        "require_exact_commit",
        "require_component_license_review",
        "require_import_record",
        "require_behavioral_tests",
    )
    for key in required:
        if key not in policy:
            fail(f"provenance/upstreams.yaml: policy.{key} is required")
    for key in required[1:]:
        if policy[key] is not True:
            fail(f"provenance policy must set {key}=true")
    return bool(policy["code_import_authorized"])


def upstream_index(upstreams: dict) -> dict[str, dict]:
    rows = upstreams.get("upstreams")
    if not isinstance(rows, list):
        fail("provenance/upstreams.yaml: upstreams must be a list")
    result: dict[str, dict] = {}
    for row in rows:
        if not isinstance(row, dict) or not row.get("id"):
            fail("provenance/upstreams.yaml: every upstream requires an id")
        if row["id"] in result:
            fail(f"duplicate upstream id: {row['id']}")
        commit = row.get("commit")
        if not isinstance(commit, str) or len(commit) != 40 or any(c not in "0123456789abcdef" for c in commit):
            fail(f"upstream {row['id']}: exact lowercase 40-char commit required")
        result[row["id"]] = row
    return result


def validate_import_records(code_import_authorized: bool, upstreams: dict[str, dict]) -> int:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    checker = Draft202012Validator(schema)
    imports_dir = PROVENANCE / "imports"
    if not imports_dir.exists():
        return 0

    count = 0
    seen_ids: set[str] = set()
    for path in sorted(imports_dir.glob("*.yaml")):
        record = load_yaml(path)
        errors = sorted(checker.iter_errors(record), key=lambda error: list(error.path))
        if errors:
            detail = "; ".join(
                f"{'.'.join(map(str, error.path)) or '<root>'}: {error.message}" for error in errors
            )
            fail(f"{path.relative_to(ROOT)}: schema validation failed: {detail}")

        record_id = record["record_id"]
        if record_id in seen_ids:
            fail(f"duplicate import record_id: {record_id}")
        seen_ids.add(record_id)

        source = record["upstream"]
        upstream = upstreams.get(source["id"])
        if upstream is None:
            fail(f"{path.relative_to(ROOT)}: unknown upstream id {source['id']}")
        if source["repository"] != upstream["repository"]:
            fail(f"{path.relative_to(ROOT)}: repository differs from pinned upstream")
        if source["commit"] != upstream["commit"]:
            fail(f"{path.relative_to(ROOT)}: commit differs from pinned upstream")
        if record["status"] in {"authorized", "imported"} and not code_import_authorized:
            fail(
                f"{path.relative_to(ROOT)}: {record['status']} import is forbidden while "
                "policy.code_import_authorized=false"
            )
        if record["status"] in {"authorized", "imported"}:
            authorization = record.get("authorization") or {}
            if not authorization.get("authorized_by") or not authorization.get("authorization_ref"):
                fail(f"{path.relative_to(ROOT)}: authorized/imported record requires authorization evidence")
        count += 1
    return count


def main() -> int:
    try:
        upstreams_doc = load_yaml(PROVENANCE / "upstreams.yaml")
        code_import_authorized = validate_global_policy(upstreams_doc)
        upstreams = upstream_index(upstreams_doc)
        imports = validate_import_records(code_import_authorized, upstreams)
    except Exception as exc:
        print(f"PROVENANCE_VALIDATION_FAIL: {exc}", file=sys.stderr)
        return 1

    state = "AUTHORIZED" if code_import_authorized else "FAIL_CLOSED"
    print(f"PROVENANCE_VALIDATION_PASS imports={imports} code_import={state}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
