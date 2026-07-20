"""Custom evidence-policy tests for the validator."""

from __future__ import annotations

import copy

import jsonschema
import pytest

from tests._fixtures import EVAL_DATE, make_profile, minimal_profile_dict, opencode_profile
from tools import profile_io, validate_profiles


def _run_policy(profile) -> list:
    return validate_profiles.validate_profile(
        profile,
        schema=profile_io.load_schema(),
        validator_cls=jsonschema.Draft202012Validator,
        evaluation_date=EVAL_DATE,
    )


def _err_messages(errors) -> str:
    return "\n".join(e.render() for e in errors)


# Evidence URL authority consistency.


def test_fake_official_domain_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"][8]["url"] = "https://evil.example.com"
    errs = _run_policy(make_profile(data))
    assert any(
        "does not match" in e.message or "official host" in e.message for e in errs
    ), _err_messages(errs)


def test_mismatched_github_owner_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"][0]["url"] = "https://api.github.com/repos/attacker/test-agent"
    errs = _run_policy(make_profile(data))
    assert any("canonical" in e.message or "match" in e.message for e in errs), _err_messages(errs)


# Secondary-context may not be sole source.


def test_secondary_only_factual_source_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"][3]["verification_method"] = "secondary-context"
    errs = _run_policy(make_profile(data))
    assert any("secondary-context" in e.message for e in errs), _err_messages(errs)


# Bidirectional evidence mapping.


def test_field_references_evidence_omitting_it_from_fields_supported_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-docs-index")
    rec["fields_supported"] = ["compatibility.surfaces"]
    errs = _run_policy(make_profile(data))
    assert any("does not declare" in e.message for e in errs), _err_messages(errs)


def test_evidence_declares_field_that_does_not_reference_it_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-docs-index")
    rec["fields_supported"].append("compatibility.ide_integrations")
    errs = _run_policy(make_profile(data))
    assert any("declares" in e.message for e in errs), _err_messages(errs)


# Claim-status / verification-method mapping.


def test_official_documentation_with_verified_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "verified"
    errs = _run_policy(make_profile(data))
    assert any("incompatible" in e.message for e in errs), _err_messages(errs)


def test_vendor_marketing_with_verified_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["cost"]["free_tier"]["claim_status"] = "verified"
    errs = _run_policy(make_profile(data))
    assert any("incompatible" in e.message for e in errs), _err_messages(errs)


def test_repository_artifact_with_verified_passes():
    data = copy.deepcopy(minimal_profile_dict())
    errs = _run_policy(make_profile(data))
    incompatible = [e for e in errs if "incompatible" in e.message]
    assert incompatible == [], _err_messages(incompatible)


# Unknown handling.


def test_unknown_with_source_none_and_claim_status_unknown_passes():
    data = copy.deepcopy(minimal_profile_dict())
    errs = _run_policy(make_profile(data))
    field_errs = [e for e in errs if "agent_skills_support" in e.field]
    assert field_errs == [], _err_messages(field_errs)


def test_unknown_with_real_source_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["agent_skills_support"]["source"] = "src-docs-mcp"
    errs = _run_policy(make_profile(data))
    assert any(
        "unknown" in e.message.lower() and "source" in e.message.lower() for e in errs
    ), _err_messages(errs)


def test_non_unknown_with_claim_status_unknown_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "unknown"
    errs = _run_policy(make_profile(data))
    assert any("claim_status 'unknown'" in e.message for e in errs), _err_messages(errs)


def test_missing_evidence_reference_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["source"] = "nonexistent-eid"
    errs = _run_policy(make_profile(data))
    assert any("does not resolve" in e.message for e in errs), _err_messages(errs)


def test_duplicate_evidence_ids_fail():
    data = copy.deepcopy(minimal_profile_dict())
    rec = copy.deepcopy(data["evidence"]["records"][0])
    data["evidence"]["records"].append(rec)
    errs = _run_policy(make_profile(data))
    assert any("duplicate" in e.message for e in errs)


# Field-specific freshness.


def test_wrong_freshness_class_for_pricing_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["cost"]["pricing_model"]["freshness_class"] = 3
    errs = _run_policy(make_profile(data))
    assert any("freshness_class" in e.field and "cost" in e.field for e in errs), _err_messages(
        errs
    )


def test_wrong_freshness_class_for_identity_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["freshness_class"] = 1
    errs = _run_policy(make_profile(data))
    assert any("freshness_class" in e.field and "identity" in e.field for e in errs), _err_messages(
        errs
    )


# Dates.


def test_future_verification_date_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["verified"] = "2099-01-01"
    errs = _run_policy(make_profile(data))
    assert any("future" in e.message for e in errs)


# Duplicate agent IDs / schema version.


def test_duplicate_agent_ids_fail():
    p1 = make_profile(minimal_profile_dict("dup"), agent_id="dup")
    p2 = make_profile(minimal_profile_dict("dup"), agent_id="dup")
    errs = validate_profiles._check_duplicate_agent_ids([p1, p2])
    assert errs


def test_unsupported_schema_version_fails_policy():
    data = copy.deepcopy(minimal_profile_dict())
    data["schema_version"] = 2
    errs = _run_policy(make_profile(data))
    assert any("unsupported schema_version" in e.message for e in errs)


# Overall score / superiority / forbidden claims.


def test_overall_score_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    data["overall_score"] = 9
    errs = _run_policy(make_profile(data))
    assert any("overall score" in e.message.lower() for e in errs)


def test_superiority_in_factual_value_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["security"]["permission_controls"]["value"] = "This is the best agent ever."
    errs = _run_policy(make_profile(data))
    assert any("superiority" in e.message.lower() for e in errs), _err_messages(errs)


def test_superiority_in_summary_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["summary"] = "This is the best agent in the world."
    errs = _run_policy(make_profile(data))
    assert any("superiority" in e.message.lower() for e in errs)


def test_forbidden_claim_language_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["summary"] = "This agent is production-ready and fully secure."
    errs = _run_policy(make_profile(data))
    assert any("forbidden" in e.message.lower() for e in errs)


# Authored evidence summaries.


def test_authored_evidence_status_rejected_by_policy():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["evidence_status"] = "verified"
    errs = _run_policy(make_profile(data))
    assert any("must not be authored" in e.message for e in errs)


def test_authored_last_verified_rejected_by_policy():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["last_verified"] = "2026-07-21"
    errs = _run_policy(make_profile(data))
    assert any("must not be authored" in e.message for e in errs)


# Raw GitHub pinning.


def test_raw_github_moving_branch_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["url"] = "https://raw.githubusercontent.com/test-vendor/test-agent/main/LICENSE"
    rec["revision_or_commit"] = None
    errs = _run_policy(make_profile(data))
    assert any("moving ref" in e.message for e in errs)


# Derived evidence summaries.


def test_derive_all_unknown():
    data = copy.deepcopy(minimal_profile_dict())
    for _path, fv in profile_io.iter_factual_fields(data):
        fv["value"] = "unknown"
        fv["source"] = "none"
        fv["claim_status"] = "unknown"
    data["evidence"]["records"] = []
    assert profile_io.derive_evidence_status(data) == "unknown"


def test_derive_all_vendor_reported():
    data = copy.deepcopy(minimal_profile_dict())
    # Turn every field vendor-reported and switch records to official-documentation/vendor-marketing.
    for _path, fv in profile_io.iter_factual_fields(data):
        if fv["value"] == "unknown":
            continue
        fv["claim_status"] = "vendor-reported"
    for rec in data["evidence"]["records"]:
        if rec["verification_method"] in (
            "repository-artifact",
            "repository-metadata",
            "release-metadata",
        ):
            rec["verification_method"] = "official-documentation"
            rec["authority"] = "official-docs"
    assert profile_io.derive_evidence_status(data) == "vendor-reported-only"


def test_derive_all_verified():
    data = copy.deepcopy(minimal_profile_dict())
    # Turn ALL non-unknown fields to verified; switch unknowns to supported+verified.
    for _path, fv in profile_io.iter_factual_fields(data):
        if fv["value"] == "unknown":
            fv["value"] = "supported"
            fv["source"] = "src-repo-api"
            fv["claim_status"] = "verified"
        else:
            fv["claim_status"] = "verified"
    # Switch all records to repository-metadata so claim_status verified is compatible.
    for rec in data["evidence"]["records"]:
        rec["verification_method"] = "repository-metadata"
        rec["authority"] = "official-repo"
    # Add the formerly-unknown fields to src-repo-api's fields_supported.
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-repo-api")
    rec["fields_supported"].extend(
        [
            "protocols.agent_skills_support",
            "protocols.headless_or_ci",
            "security.sandboxing_model",
            "privacy.telemetry_behavior",
        ]
    )
    # data_retention, pricing_model, free_tier use other records; point them to src-repo-api.
    data["privacy"]["data_retention"]["source"] = "src-repo-api"
    rec["fields_supported"].append("privacy.data_retention")
    data["cost"]["pricing_model"]["source"] = "src-repo-api"
    rec["fields_supported"].append("cost.pricing_model")
    data["cost"]["free_tier"]["source"] = "src-repo-api"
    rec["fields_supported"].append("cost.free_tier")
    assert profile_io.derive_evidence_status(data) == "verified"


def test_derive_mixed_partial():
    data = copy.deepcopy(minimal_profile_dict())
    assert profile_io.derive_evidence_status(data) == "partial"


def test_derive_last_verified_max_date():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["verified"] = "2026-07-22"
    result = profile_io.derive_last_verified(data)
    assert result == "2026-07-22"


def test_stale_distinct_from_unknown():
    fv_unknown = {
        "value": "unknown",
        "source": "none",
        "verified": "2026-07-21",
        "freshness_class": 1,
    }
    fv_stale = {
        "value": "supported",
        "source": "src1",
        "verified": "2020-01-01",
        "freshness_class": 1,
    }
    assert profile_io.field_is_unknown(fv_unknown) is True
    assert profile_io.field_is_stale(fv_unknown, evaluation_date=EVAL_DATE) is False
    assert profile_io.field_is_unknown(fv_stale) is False
    assert profile_io.field_is_stale(fv_stale, evaluation_date=EVAL_DATE) is True


# OpenCode real profile passes.


def test_opencode_profile_passes_policy():
    errs = _run_policy(opencode_profile())
    assert errs == [], _err_messages(errs)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
