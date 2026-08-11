from __future__ import annotations

import json
from pathlib import Path

import pytest
import yaml
from jsonschema import Draft202012Validator

import tools.validate_provenance as vp


def _load(path: Path):
    return yaml.safe_load(path.read_text(encoding="utf-8"))


def _configure(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> tuple[dict, list[dict]]:
    provenance = tmp_path / "provenance"
    imports = provenance / "imports"
    adoptions = provenance / "main-adoptions"
    imports.mkdir(parents=True)
    adoptions.mkdir(parents=True)

    fixture_root = Path(__file__).resolve().parents[1]
    record = _load(fixture_root / "provenance" / "imports" / "opencode-patch-v1.yaml")
    adoption = _load(
        fixture_root / "provenance" / "main-adoptions" / "k2-opencode-patch-v1.yaml"
    )
    (imports / "opencode-patch-v1.yaml").write_text(yaml.safe_dump(record, sort_keys=False))
    (adoptions / "k2-opencode-patch-v1.yaml").write_text(
        yaml.safe_dump(adoption, sort_keys=False)
    )

    monkeypatch.setattr(vp, "ROOT", tmp_path)
    monkeypatch.setattr(vp, "PROVENANCE", provenance)
    monkeypatch.setattr(vp, "validate_schema", lambda path, schema_path: vp.load_yaml(path))
    upstreams = {
        "opencode": {
            "id": "opencode",
            "repository": "https://github.com/anomalyco/opencode",
            "commit": "3a90639cb57619a21e59f544b3e8d23ffed56f48",
        }
    }
    return upstreams, [adoption]


def test_main_adoption_schema_accepts_canonical_record() -> None:
    root = Path(__file__).resolve().parents[1]
    schema = json.loads((root / "schema" / "provenance-main-adoption.schema.json").read_text())
    adoption = _load(root / "provenance" / "main-adoptions" / "k2-opencode-patch-v1.yaml")
    errors = list(Draft202012Validator(schema).iter_errors(adoption))
    assert errors == []


def test_main_accepts_exact_adopted_import(monkeypatch: pytest.MonkeyPatch, tmp_path: Path) -> None:
    upstreams, adoptions = _configure(monkeypatch, tmp_path)
    monkeypatch.setenv("KODAC_BRANCH", "main")
    assert vp.validate_import_records(False, upstreams, [], adoptions) == 1


def test_descendant_feature_branch_inherits_exact_main_adoption(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    upstreams, adoptions = _configure(monkeypatch, tmp_path)
    monkeypatch.setenv("KODAC_BRANCH", "agent/provenance-correction")
    assert vp.validate_import_records(False, upstreams, [], adoptions) == 1


def test_main_rejects_import_without_exact_adoption(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    upstreams, _ = _configure(monkeypatch, tmp_path)
    monkeypatch.setenv("KODAC_BRANCH", "main")
    with pytest.raises(ValueError, match="exact active main-adoption authorization"):
        vp.validate_import_records(False, upstreams, [], [])


def test_feature_branch_rejects_new_unadopted_unscoped_import(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    upstreams, adoptions = _configure(monkeypatch, tmp_path)
    record_path = tmp_path / "provenance" / "imports" / "opencode-patch-v1.yaml"
    record = _load(record_path)
    record["record_id"] = "opencode-patch-v2"
    record["destination_paths"] = ["packages/kodac-runtime/src/edit/patch-v2.ts"]
    record_path.write_text(yaml.safe_dump(record, sort_keys=False))
    monkeypatch.setenv("KODAC_BRANCH", "feat/new-donor-intake")
    with pytest.raises(ValueError, match="exact active scoped authorization"):
        vp.validate_import_records(False, upstreams, [], adoptions)


def test_original_scoped_branch_still_accepts_exact_intake_authorization(
    monkeypatch: pytest.MonkeyPatch, tmp_path: Path
) -> None:
    upstreams, _ = _configure(monkeypatch, tmp_path)
    record = _load(tmp_path / "provenance" / "imports" / "opencode-patch-v1.yaml")
    scoped = {
        "status": "active",
        "branch": "feat/kodac-k2-runtime-spine",
        "authorized_by": "Kodac founder",
        "authorization_ref": record["authorization"]["authorization_ref"],
        "records": [
            {
                "record_id": record["record_id"],
                "upstream_id": record["upstream"]["id"],
                "commit": record["upstream"]["commit"],
                "source_paths": record["upstream"]["source_paths"],
                "destination_paths": record["destination_paths"],
            }
        ],
    }
    monkeypatch.setenv("KODAC_BRANCH", "feat/kodac-k2-runtime-spine")
    assert vp.validate_import_records(False, upstreams, [scoped], []) == 1
