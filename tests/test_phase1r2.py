"""Phase 1-R2 new tests: authority/method/field compatibility, dispute contract,
immutability, URL validation, list invariants, deterministic error ordering,
and document consistency."""

from __future__ import annotations

import copy
import subprocess
import sys

import jsonschema
import pytest

from tests._fixtures import (
    EVAL_DATE,
    FAKE_CONTENT_SHA,
    FAKE_SHA,
    make_profile,
    minimal_profile_dict,
    opencode_profile,
)
from tools import profile_io, validate_profiles


def _run_full(profile):
    return validate_profiles.validate_profile(
        profile,
        schema=profile_io.load_schema(),
        validator_cls=jsonschema.Draft202012Validator,
        evaluation_date=EVAL_DATE,
    )


def _errs_str(errors):
    return "\n".join(e.render() for e in errors)


# ============================================================================
# 1. Authority / method / field compatibility
# ============================================================================


def test_official_docs_relabel_to_repository_artifact_fails():
    """Official-docs record cannot use repository-artifact to upgrade to verified."""
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-docs-mcp")
    rec["verification_method"] = "repository-artifact"
    errs = _run_full(make_profile(data))
    assert any("incompatible" in e.message for e in errs), _errs_str(errs)


def test_behavioral_field_artifact_method_verified_fails():
    """A behavioral field (e.g. protocols.mcp_support) cannot be verified via artifact."""
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "verified"
    # Also flip its record to repository-artifact so claim_method passes,
    # but the field-level restriction should still catch it.
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-docs-mcp")
    rec["verification_method"] = "repository-metadata"
    rec["authority"] = "official-repo"
    rec["url"] = "https://api.github.com/repos/test-vendor/test-agent"
    errs = _run_full(make_profile(data))
    assert any("may not be" in e.message and "verified" in e.message for e in errs), _errs_str(errs)


def test_secondary_authority_official_documentation_fails():
    """secondary authority cannot use official-documentation method."""
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-docs-index")
    rec["authority"] = "secondary"
    rec["verification_method"] = "official-documentation"
    errs = _run_full(make_profile(data))
    assert any("incompatible" in e.message and "authority" in e.message for e in errs), _errs_str(
        errs
    )


def test_tertiary_authority_primary_method_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-docs-index")
    rec["authority"] = "tertiary"
    rec["verification_method"] = "official-documentation"
    errs = _run_full(make_profile(data))
    assert any("incompatible" in e.message for e in errs), _errs_str(errs)


def test_valid_authority_method_combinations_pass():
    """The baseline fixture uses valid combinations; it must pass."""
    errs = _run_full(make_profile())
    compat_errs = [e for e in errs if "incompatible" in e.message]
    assert compat_errs == [], _errs_str(compat_errs)


# ============================================================================
# 2. Dispute contract
# ============================================================================


def test_disputed_field_without_disputes_entry_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    errs = _run_full(make_profile(data))
    assert any("disputed" in e.message and "notes.disputes" in e.message for e in errs), _errs_str(
        errs
    )


def test_orphan_dispute_entry_fails():
    """Dispute entry for a field that is not disputed must fail."""
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-index"],
            "note": "Conflict between docs.",
        }
    ]
    # mcp_support is NOT disputed in the baseline, so this should fail.
    errs = _run_full(make_profile(data))
    assert any(
        "not disputed" in e.message or "does not exist" in e.message for e in errs
    ), _errs_str(errs)


def test_dispute_with_one_source_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp"],  # only one source
            "note": "Conflict.",
        }
    ]
    errs = _run_full(make_profile(data))
    assert any("at least two" in e.message for e in errs), _errs_str(errs)


def test_dispute_with_unresolved_source_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "nonexistent-eid"],
            "note": "Conflict.",
        }
    ]
    errs = _run_full(make_profile(data))
    assert any("does not resolve" in e.message for e in errs), _errs_str(errs)


def test_valid_two_source_dispute_passes():
    """A valid dispute with two primary sources must pass."""
    data = copy.deepcopy(minimal_profile_dict())
    # Make mcp_support disputed.
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    # Add a second record that supports mcp_support.
    rec2 = copy.deepcopy(data["evidence"]["records"][3])  # copy src-docs-index
    rec2["id"] = "src-docs-mcp-alt"
    rec2["title"] = "Alternative MCP doc"
    rec2["fields_supported"] = ["protocols.mcp_support"]
    data["evidence"]["records"].append(rec2)
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-mcp-alt"],
            "note": "Two official docs conflict on MCP details.",
        }
    ]
    errs = _run_full(make_profile(data))
    dispute_errs = [e for e in errs if "disputes" in e.field or "disputed" in e.message]
    assert dispute_errs == [], _errs_str(dispute_errs)


# ============================================================================
# 3. List and surface invariants
# ============================================================================


def test_empty_operating_systems_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["compatibility"]["operating_systems"]["value"] = []
    errs = _run_full(make_profile(data))
    # Schema should reject empty arrays now (minItems: 1).
    assert any("operating_systems" in e.field or "minItems" in e.message for e in errs), _errs_str(
        errs
    )


def test_empty_surfaces_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["compatibility"]["surfaces"]["value"] = []
    errs = _run_full(make_profile(data))
    assert errs  # schema or policy should reject


def test_duplicate_surfaces_fail():
    data = copy.deepcopy(minimal_profile_dict())
    data["compatibility"]["surfaces"]["value"] = ["terminal", "terminal"]
    errs = _run_full(make_profile(data))
    assert errs, _errs_str(errs)


def test_legitimate_non_empty_array_passes():
    errs = _run_full(make_profile())
    list_errs = [e for e in errs if "minItems" in e.message or "unique" in e.message.lower()]
    assert list_errs == [], _errs_str(list_errs)


def test_string_unknown_list_value_passes():
    data = copy.deepcopy(minimal_profile_dict())
    data["compatibility"]["operating_systems"]["value"] = "unknown"
    data["compatibility"]["operating_systems"]["source"] = "none"
    data["compatibility"]["operating_systems"]["claim_status"] = "unknown"
    errs = _run_full(make_profile(data))
    # Should not fail on list-specific rules.
    list_errs = [e for e in errs if "minItems" in e.message]
    assert list_errs == [], _errs_str(list_errs)


# ============================================================================
# 4. URL validation for identity fields
# ============================================================================


def test_malformed_official_url_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["value"] = "not-a-url"
    errs = _run_full(make_profile(data))
    assert any(
        "official_url" in e.field or "uri" in e.message.lower() or "https" in e.message.lower()
        for e in errs
    ), _errs_str(errs)


def test_http_official_url_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["value"] = "http://test-agent.example.com"
    errs = _run_full(make_profile(data))
    assert errs


def test_url_with_credentials_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["value"] = "https://user:pass@test-agent.example.com"
    errs = _run_full(make_profile(data))
    assert errs


def test_private_localhost_url_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["value"] = "https://127.0.0.1"
    errs = _run_full(make_profile(data))
    assert errs


def test_malformed_source_repository_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = "not-a-url"
    errs = _run_full(make_profile(data))
    assert errs


# ============================================================================
# 5. Immutability contract
# ============================================================================


def test_dynamic_api_marked_immutable_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-repo-api")
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any(
        "immutable" in e.message.lower() and "false" in e.message.lower() for e in errs
    ), _errs_str(errs)


def test_commit_pinned_raw_url_marked_false_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["immutable"] = False
    errs = _run_full(make_profile(data))
    assert any(
        "immutable" in e.message.lower() and "true" in e.message.lower() for e in errs
    ), _errs_str(errs)


def test_moving_raw_github_ref_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["url"] = "https://raw.githubusercontent.com/test-vendor/test-agent/dev/LICENSE"
    rec["revision_or_commit"] = None
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any("moving ref" in e.message for e in errs), _errs_str(errs)


def test_releases_latest_cannot_support_current_versions():
    """A /releases/latest URL cannot be the source for current_versions."""
    data = copy.deepcopy(minimal_profile_dict())
    # Add a record with /releases/latest supporting current_versions.
    data["evidence"]["records"].append(
        {
            "id": "src-release-latest",
            "title": "releases/latest",
            "url": "https://api.github.com/repos/test-vendor/test-agent/releases/latest",
            "authority": "official-release",
            "verification_method": "release-metadata",
            "date_accessed": "2026-07-21",
            "content_sha256": FAKE_CONTENT_SHA,
            "fields_supported": ["model_and_tier.current_versions"],
            "immutable": False,
        }
    )
    # Add a model_and_tier block referencing it.
    data["model_and_tier"] = {
        "current_versions": {
            "value": ["v1.0.0"],
            "source": "src-release-latest",
            "verified": "2026-07-21",
            "claim_status": "verified",
            "freshness_class": 1,
        }
    }
    errs = _run_full(make_profile(data))
    assert any("releases/latest" in e.message for e in errs), _errs_str(errs)


def test_specific_release_tag_source_passes():
    """A specific /releases/tags/<tag> endpoint with immutable: false passes."""
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"].append(
        {
            "id": "src-release-tag",
            "title": "release v1.0.0",
            "url": "https://api.github.com/repos/test-vendor/test-agent/releases/tags/v1.0.0",
            "authority": "official-release",
            "verification_method": "release-metadata",
            "date_accessed": "2026-07-21",
            "content_sha256": FAKE_CONTENT_SHA,
            "fields_supported": ["model_and_tier.current_versions"],
            "immutable": False,
        }
    )
    data["model_and_tier"] = {
        "current_versions": {
            "value": ["v1.0.0"],
            "source": "src-release-tag",
            "verified": "2026-07-21",
            "claim_status": "verified",
            "freshness_class": 1,
        }
    }
    errs = _run_full(make_profile(data))
    release_errs = [e for e in errs if "releases/latest" in e.message]
    assert release_errs == [], _errs_str(release_errs)


# ============================================================================
# 6. Exact evidence mapping (no allow_unused_records)
# ============================================================================


def test_unused_evidence_record_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"].append(
        {
            "id": "unused-rec",
            "title": "Unused record",
            "url": "https://raw.githubusercontent.com/test-vendor/test-agent/"
            + FAKE_SHA
            + "/extra.md",
            "authority": "official-repo",
            "verification_method": "repository-artifact",
            "date_accessed": "2026-07-21",
            "content_sha256": FAKE_CONTENT_SHA,
            "revision_or_commit": FAKE_SHA,
            "fields_supported": ["cost.pricing_model"],
            "immutable": True,
        }
    )
    errs = _run_full(make_profile(data))
    assert any(
        "not referenced" in e.message or "orphan" in e.message.lower() for e in errs
    ), _errs_str(errs)


def test_allow_unused_records_rejected_by_schema():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["allow_unused_records"] = True
    schema = profile_io.load_schema()
    v = jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )
    errs = list(v.iter_errors(data))
    assert any("additional" in e.message.lower() for e in errs)


# ============================================================================
# 7. Deterministic error ordering (PYTHONHASHSEED-independent)
# ============================================================================


def test_error_ordering_stable_across_hashseeds():
    """Run validation with two different PYTHONHASHSEED values; error output must be identical."""
    data = copy.deepcopy(minimal_profile_dict())
    # Introduce multiple errors to make ordering observable.
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"  # no dispute entry
    data["cost"]["pricing_model"]["freshness_class"] = 3  # wrong freshness
    data["identity"]["official_url"]["verified"] = "2099-01-01"  # future date

    def run_with_hashseed(seed: str) -> str:
        env = {**dict(__import__("os").environ), "PYTHONHASHSEED": seed}
        result = subprocess.run(
            [
                sys.executable,
                "-c",
                """
import sys
sys.path.insert(0, '.')
from tests._fixtures import minimal_profile_dict, make_profile, EVAL_DATE
from tools import profile_io, validate_profiles
import copy, jsonschema
data = copy.deepcopy(minimal_profile_dict())
data['protocols']['mcp_support']['claim_status'] = 'disputed'
data['cost']['pricing_model']['freshness_class'] = 3
data['identity']['official_url']['verified'] = '2099-01-01'
p = make_profile(data)
errs = validate_profiles.validate_profile(
    p, schema=profile_io.load_schema(),
    validator_cls=jsonschema.Draft202012Validator,
    evaluation_date=EVAL_DATE
)
for e in errs:
    print(e.render())
""",
            ],
            capture_output=True,
            text=True,
            env=env,
            cwd=str(profile_io.REPO_ROOT),
        )
        return result.stdout

    out1 = run_with_hashseed("0")
    out2 = run_with_hashseed("42")
    assert (
        out1 == out2
    ), f"Error ordering differs across PYTHONHASHSEED values:\n--- seed=0 ---\n{out1}\n--- seed=42 ---\n{out2}"


# ============================================================================
# 8. OpenCode profile and matrix regression
# ============================================================================


def test_opencode_profile_passes_full_validation():
    errs = _run_full(opencode_profile())
    assert errs == [], _errs_str(errs)


def test_matrix_remains_byte_stable():
    from tools import generate_matrix

    p = opencode_profile()
    out1 = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    out2 = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert out1 == out2


def test_changing_claim_status_changes_matrix_bytes():
    from tools import generate_matrix

    p = opencode_profile()
    out1 = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    p2_data = copy.deepcopy(p.data)
    p2_data["openness"]["license"]["claim_status"] = "vendor-reported"
    rec = next(r for r in p2_data["evidence"]["records"] if r["id"] == "opencode-license")
    rec["verification_method"] = "official-documentation"
    rec["authority"] = "official-docs"
    p2 = make_profile(p2_data, agent_id="opencode")
    out2 = generate_matrix.render_matrix([p2], evaluation_date=EVAL_DATE)
    assert out1 != out2


def test_committed_matrix_matches_regeneration():
    from tools import generate_matrix

    committed = (profile_io.REPO_ROOT / "matrix" / "AGENT_MATRIX.md").read_text(encoding="utf-8")
    regenerated = generate_matrix.generate(evaluation_date=EVAL_DATE)
    assert committed == regenerated


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
