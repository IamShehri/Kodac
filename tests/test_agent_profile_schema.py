"""Schema-level tests: JSON Schema (Draft 2020-12) validation of agent profiles."""

from __future__ import annotations

import copy

import jsonschema
import pytest

from tests._fixtures import EVAL_DATE, make_profile, minimal_profile_dict, opencode_profile
from tools import profile_io, validate_profiles


def _validator():
    schema = profile_io.load_schema()
    return jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )


def _schema_errors(data):
    return list(_validator().iter_errors(data))


def _run_full(profile):
    return validate_profiles.validate_profile(
        profile,
        schema=profile_io.load_schema(),
        validator_cls=jsonschema.Draft202012Validator,
        evaluation_date=EVAL_DATE,
    )


# Baseline: the minimal fixture MUST be schema-valid and policy-valid.


def test_minimal_fixture_passes_schema():
    errors = _schema_errors(minimal_profile_dict())
    assert errors == [], "minimal fixture failed schema:\n" + "\n".join(e.message for e in errors)


def test_minimal_fixture_passes_full_policy():
    errors = _run_full(make_profile())
    assert errors == [], "minimal fixture failed policy:\n" + "\n".join(e.render() for e in errors)


def test_opencode_profile_passes_schema():
    errors = _schema_errors(opencode_profile().data)
    assert errors == [], "OpenCode profile failed schema:\n" + "\n".join(e.message for e in errors)


def test_opencode_profile_passes_full_policy():
    errors = _run_full(opencode_profile())
    assert errors == [], "OpenCode profile failed validation:\n" + "\n".join(
        e.render() for e in errors
    )


# Unknown handling (fixed — no overlapping oneOf).


def test_free_form_unknown_passes_schema():
    data = minimal_profile_dict()
    data["openness"]["license"]["value"] = "unknown"
    errs = _schema_errors(data)
    license_errs = [e for e in errs if "license" in str(e.path)]
    assert license_errs == [], [e.message for e in license_errs]


def test_proprietary_license_passes_schema():
    data = minimal_profile_dict()
    data["openness"]["license"]["value"] = "proprietary"
    errs = _schema_errors(data)
    license_errs = [e for e in errs if "license" in str(e.path)]
    assert license_errs == []


def test_unknown_license_passes_schema():
    data = minimal_profile_dict()
    data["openness"]["license"]["value"] = "unknown"
    errs = _schema_errors(data)
    license_errs = [e for e in errs if "license" in str(e.path)]
    assert license_errs == []


# claim_status enforcement on every field type.


def test_missing_claim_status_free_form_fails():
    data = copy.deepcopy(minimal_profile_dict())
    del data["security"]["permission_controls"]["claim_status"]
    errs = _run_full(make_profile(data))
    assert any("claim_status" in e.field or "claim_status" in e.message for e in errs)


def test_missing_claim_status_tri_state_fails():
    data = copy.deepcopy(minimal_profile_dict())
    del data["protocols"]["mcp_support"]["claim_status"]
    errs = _run_full(make_profile(data))
    assert any("claim_status" in e.field or "claim_status" in e.message for e in errs)


def test_missing_claim_status_list_fails():
    data = copy.deepcopy(minimal_profile_dict())
    del data["compatibility"]["operating_systems"]["claim_status"]
    errs = _run_full(make_profile(data))
    assert any("claim_status" in e.field or "claim_status" in e.message for e in errs)


def test_missing_claim_status_license_fails():
    data = copy.deepcopy(minimal_profile_dict())
    del data["openness"]["license"]["claim_status"]
    errs = _run_full(make_profile(data))
    assert any("claim_status" in e.field or "claim_status" in e.message for e in errs)


# URL and content_sha256 validation.


def test_invalid_url_fails_policy():
    """A non-HTTPS evidence URL must fail the policy layer (HTTPS-only)."""
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"][0]["url"] = "http://api.github.com/repos/test-vendor/test-agent"
    errs = _run_full(make_profile(data))
    assert any("HTTPS" in e.message for e in errs)


def test_invalid_content_sha256_fails_schema():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"][0]["content_sha256"] = "short"
    errs = _schema_errors(data)
    assert any("content_sha256" in str(e.path) for e in errs)


# Authored evidence summaries must fail.


def test_authored_evidence_status_fails_schema():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["evidence_status"] = "verified"
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


def test_authored_last_verified_fails_schema():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["last_verified"] = "2026-07-21"
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


# Structural schema tests.


def test_missing_required_field_fails():
    data = minimal_profile_dict()
    del data["identity"]
    errs = _schema_errors(data)
    assert errs


def test_unexpected_property_fails():
    data = minimal_profile_dict()
    data["surprise_field"] = "boo"
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


def test_overall_score_rejected_by_schema():
    data = minimal_profile_dict()
    data["overall_score"] = 9
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


def test_no_benchmark_score_field_in_schema():
    schema_text = repr(profile_io.load_schema())
    for forbidden in ("benchmark_score", "overall_score", "kernux_score", "swe_bench_score"):
        assert forbidden not in schema_text.lower(), f"schema mentions {forbidden}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
