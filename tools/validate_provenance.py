from __future__ import annotations

import json
import os
import sys
from pathlib import Path

import yaml
from jsonschema import Draft202012Validator

ROOT = Path(__file__).resolve().parents[1]
PROVENANCE = ROOT / "provenance"
IMPORT_SCHEMA_PATH = ROOT / "schema" / "provenance-import-record.schema.json"
AUTH_SCHEMA_PATH = ROOT / "schema" / "provenance-import-authorization.schema.json"


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


def current_branch() -> str | None:
    for key in ("KODAC_BRANCH", "GITHUB_HEAD_REF", "GITHUB_REF_NAME"):
        value = os.getenv(key)
        if value:
            return value
    return None


def validate_schema(path: Path, schema_path: Path) -> dict:
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    checker = Draft202012Validator(schema)
    record = load_yaml(path)
    errors = sorted(checker.iter_errors(record), key=lambda error: list(error.path))
    if errors:
        detail = "; ".join(
            f"{'.'.join(map(str, error.path)) or '<root>'}: {error.message}" for error in errors
        )
        fail(f"{path.relative_to(ROOT)}: schema validation failed: {detail}")
    return record


def load_scoped_authorizations() -> list[dict]:
    auth_dir = PROVENANCE / "authorizations"
    if not auth_dir.exists():
        return []
    result: list[dict] = []
    seen_ids: set[str] = set()
    for path in sorted(auth_dir.glob("*.yaml")):
        authorization = validate_schema(path, AUTH_SCHEMA_PATH)
        authorization_id = authorization["authorization_id"]
        if authorization_id in seen_ids:
            fail(f"duplicate authorization_id: {authorization_id}")
        seen_ids.add(authorization_id)
        result.append(authorization)
    return result


def exact_scoped_authorization(record: dict, branch: str, authorizations: list[dict]) -> dict | None:
    for authorization in authorizations:
        if authorization["status"] != "active" or authorization["branch"] != branch:
            continue
        for scoped in authorization["records"]:
            if scoped["record_id"] != record["record_id"]:
                continue
            if scoped["upstream_id"] != record["upstream"]["id"]:
                continue
            if scoped["commit"] != record["upstream"]["commit"]:
                continue
            if scoped["source_paths"] != record["upstream"]["source_paths"]:
                continue
            if scoped["destination_paths"] != record["destination_paths"]:
                continue
            if authorization["authorization_ref"] != (record.get("authorization") or {}).get("authorization_ref"):
                continue
            return authorization
    return None


def validate_import_records(
    global_code_import_authorized: bool,
    upstreams: dict[str, dict],
    authorizations: list[dict],
) -> int:
    imports_dir = PROVENANCE / "imports"
    if not imports_dir.exists():
        return 0

    count = 0
    seen_ids: set[str] = set()
    branch = current_branch()
    for path in sorted(imports_dir.glob("*.yaml")):
        record = validate_schema(path, IMPORT_SCHEMA_PATH)

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

        if record["status"] in {"authorized", "imported"}:
            authorization_evidence = record.get("authorization") or {}
            if not authorization_evidence.get("authorized_by") or not authorization_evidence.get("authorization_ref"):
                fail(f"{path.relative_to(ROOT)}: authorized/imported record requires authorization evidence")

            if not global_code_import_authorized:
                if not branch:
                    fail(
                        f"{path.relative_to(ROOT)}: scoped authorization requires branch context; "
                        "set KODAC_BRANCH for local validation"
                    )
                scoped = exact_scoped_authorization(record, branch, authorizations)
                if scoped is None:
                    fail(
                        f"{path.relative_to(ROOT)}: {record['status']} import is forbidden while "
                        "policy.code_import_authorized=false unless an exact active scoped authorization "
                        f"matches branch {branch!r}"
                    )
                if scoped["authorized_by"] != authorization_evidence.get("authorized_by"):
                    fail(f"{path.relative_to(ROOT)}: authorization actor differs from scoped authorization")

        count += 1
    return count


def main() -> int:
    try:
        upstreams_doc = load_yaml(PROVENANCE / "upstreams.yaml")
        global_code_import_authorized = validate_global_policy(upstreams_doc)
        upstreams = upstream_index(upstreams_doc)
        authorizations = load_scoped_authorizations()
        imports = validate_import_records(global_code_import_authorized, upstreams, authorizations)
    except Exception as exc:
        print(f"PROVENANCE_VALIDATION_FAIL: {exc}", file=sys.stderr)
        return 1

    branch = current_branch() or "unknown"
    state = "GLOBAL" if global_code_import_authorized else "SCOPED_OR_FAIL_CLOSED"
    print(
        f"PROVENANCE_VALIDATION_PASS imports={imports} authorizations={len(authorizations)} "
        f"code_import={state} branch={branch}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
