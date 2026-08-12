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
MAIN_ADOPTION_SCHEMA_PATH = ROOT / "schema" / "provenance-main-adoption.schema.json"

EXPECTED_SOURCE_RIGHTS = {
    "state": "founder_asserted_owner_permission",
    "asserted_on": "2026-08-12",
    "rights_axis": "founder_confirmed_not_a_general_blocker",
    "admission_axis": "fail_closed_component_scoped_separately_authorized",
    "import_authority": "none_by_implication",
}
EXPECTED_ADMISSION_LIFECYCLE = [
    "RIGHTS_CONFIRMED",
    "SOURCE_PINNED",
    "AUDITED",
    "BENCHMARKED",
    "QUALIFIED",
    "ADMITTED",
    "CANONICALLY_ADOPTED",
]
SOURCE_RIGHTS_REF = "provenance/upstreams.yaml#source_rights"
ADMISSION_LIFECYCLE_REF = "provenance/upstreams.yaml#admission_lifecycle"


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


def validate_rights_admission_model(upstreams_doc: dict, module_decisions: dict) -> None:
    policy = upstreams_doc.get("policy")
    if not isinstance(policy, dict) or policy.get("code_import_authorized") is not False:
        fail("provenance/upstreams.yaml: policy.code_import_authorized must remain false")

    source_rights = upstreams_doc.get("source_rights")
    if not isinstance(source_rights, dict):
        fail("provenance/upstreams.yaml: source_rights mapping is required")

    missing = set(EXPECTED_SOURCE_RIGHTS) - set(source_rights)
    if missing:
        fail(
            "provenance/upstreams.yaml: source_rights missing required fields: "
            + ", ".join(sorted(missing))
        )
    unexpected = set(source_rights) - set(EXPECTED_SOURCE_RIGHTS) - {"notes"}
    if unexpected:
        fail(
            "provenance/upstreams.yaml: source_rights contains unexpected fields: "
            + ", ".join(sorted(unexpected))
        )
    for key, expected in EXPECTED_SOURCE_RIGHTS.items():
        if source_rights.get(key) != expected:
            fail(f"provenance/upstreams.yaml: source_rights.{key} must equal {expected!r}")

    if upstreams_doc.get("admission_lifecycle") != EXPECTED_ADMISSION_LIFECYCLE:
        fail(
            "provenance/upstreams.yaml: admission_lifecycle must exactly match the canonical ordered lifecycle"
        )

    if module_decisions.get("code_import_authorized") is not False:
        fail("provenance/module-decisions.yaml: code_import_authorized must remain false")
    if "source_rights" in module_decisions:
        fail(
            "provenance/module-decisions.yaml: source_rights must reference the canonical upstreams model, not duplicate it"
        )
    if "admission_lifecycle" in module_decisions:
        fail(
            "provenance/module-decisions.yaml: admission_lifecycle must reference the canonical upstreams model, not duplicate it"
        )
    if module_decisions.get("source_rights_ref") != SOURCE_RIGHTS_REF:
        fail(
            "provenance/module-decisions.yaml: source_rights_ref must point to provenance/upstreams.yaml#source_rights"
        )
    if module_decisions.get("admission_lifecycle_ref") != ADMISSION_LIFECYCLE_REF:
        fail(
            "provenance/module-decisions.yaml: admission_lifecycle_ref must point to provenance/upstreams.yaml#admission_lifecycle"
        )


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


def load_main_adoptions() -> list[dict]:
    adoption_dir = PROVENANCE / "main-adoptions"
    if not adoption_dir.exists():
        return []
    result: list[dict] = []
    seen_ids: set[str] = set()
    for path in sorted(adoption_dir.glob("*.yaml")):
        adoption = validate_schema(path, MAIN_ADOPTION_SCHEMA_PATH)
        adoption_id = adoption["adoption_id"]
        if adoption_id in seen_ids:
            fail(f"duplicate main adoption_id: {adoption_id}")
        seen_ids.add(adoption_id)
        result.append(adoption)
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


def exact_main_adoption(record: dict, adoptions: list[dict]) -> dict | None:
    authorization_ref = (record.get("authorization") or {}).get("authorization_ref")
    for adoption in adoptions:
        if adoption["status"] != "active" or adoption["target_branch"] != "main":
            continue
        if adoption["intake_authorization_ref"] != authorization_ref:
            continue
        for adopted in adoption["records"]:
            if adopted["record_id"] != record["record_id"]:
                continue
            if adopted["upstream_id"] != record["upstream"]["id"]:
                continue
            if adopted["commit"] != record["upstream"]["commit"]:
                continue
            if adopted["source_paths"] != record["upstream"]["source_paths"]:
                continue
            if adopted["destination_paths"] != record["destination_paths"]:
                continue
            return adoption
    return None


def validate_import_records(
    global_code_import_authorized: bool,
    upstreams: dict[str, dict],
    authorizations: list[dict],
    main_adoptions: list[dict],
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
                main_adoption = exact_main_adoption(record, main_adoptions)
                if branch == "main":
                    if main_adoption is None:
                        fail(
                            f"{path.relative_to(ROOT)}: {record['status']} import is forbidden on canonical main "
                            "while policy.code_import_authorized=false unless an exact active main-adoption "
                            "authorization exists"
                        )
                    if main_adoption["authorized_by"] != authorization_evidence.get("authorized_by"):
                        fail(f"{path.relative_to(ROOT)}: adoption actor differs from import authorization actor")
                elif record["status"] == "imported" and main_adoption is not None:
                    if main_adoption["authorized_by"] != authorization_evidence.get("authorized_by"):
                        fail(f"{path.relative_to(ROOT)}: adoption actor differs from import authorization actor")
                else:
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
                            f"matches branch {branch!r} or an exact active main-adoption authorization exists"
                        )
                    if scoped["authorized_by"] != authorization_evidence.get("authorized_by"):
                        fail(f"{path.relative_to(ROOT)}: authorization actor differs from scoped authorization")

        count += 1
    return count


def main() -> int:
    try:
        upstreams_doc = load_yaml(PROVENANCE / "upstreams.yaml")
        module_decisions = load_yaml(PROVENANCE / "module-decisions.yaml")
        validate_rights_admission_model(upstreams_doc, module_decisions)
        global_code_import_authorized = validate_global_policy(upstreams_doc)
        upstreams = upstream_index(upstreams_doc)
        authorizations = load_scoped_authorizations()
        main_adoptions = load_main_adoptions()
        imports = validate_import_records(
            global_code_import_authorized,
            upstreams,
            authorizations,
            main_adoptions,
        )
    except Exception as exc:
        print(f"PROVENANCE_VALIDATION_FAIL: {exc}", file=sys.stderr)
        return 1

    branch = current_branch() or "unknown"
    state = "GLOBAL" if global_code_import_authorized else "SCOPED_OR_FAIL_CLOSED"
    print(
        f"PROVENANCE_VALIDATION_PASS imports={imports} authorizations={len(authorizations)} "
        f"main_adoptions={len(main_adoptions)} code_import={state} branch={branch}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
