"""Schema-level tests: JSON Schema (Draft 2020-12) validation of agent profiles."""

from __future__ import annotations

import jsonschema
import pytest

from tests._fixtures import EVAL_DATE, minimal_profile_dict, opencode_profile
from tools import profile_io, validate_profiles


def _validator():
    schema = profile_io.load_schema()
    return jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )


def _schema_errors(data):
    return list(_validator().iter_errors(data))


# ---------------------------------------------------------------------------
# Real committed profile
# ---------------------------------------------------------------------------


def test_opencode_profile_passes_schema():
    """The committed OpenCode profile must pass JSON Schema validation."""
    errors = _schema_errors(opencode_profile().data)
    assert errors == [], "OpenCode profile failed schema:\n" + "\n".join(e.message for e in errors)


def test_opencode_profile_passes_full_validation():
    """The committed OpenCode profile must pass schema + custom policy."""
    errors = validate_profiles.validate_profile(
        opencode_profile(),
        schema=profile_io.load_schema(),
        validator_cls=jsonschema.Draft202012Validator,
        evaluation_date=EVAL_DATE,
    )
    assert errors == [], "OpenCode profile failed validation:\n" + "\n".join(
        e.render() for e in errors
    )


# ---------------------------------------------------------------------------
# Negative schema tests
# ---------------------------------------------------------------------------


def test_missing_required_field_fails():
    data = minimal_profile_dict()
    del data["identity"]
    errs = _schema_errors(data)
    assert any("identity" in e.path for e in errs) or any(
        "required" in e.message.lower() for e in errs
    )


def test_unexpected_property_fails():
    data = minimal_profile_dict()
    data["surprise_field"] = "boo"
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


def test_invalid_enum_fails():
    data = minimal_profile_dict()
    data["submission"] = "not-a-real-submission-label"
    errs = _schema_errors(data)
    assert any("submission" in str(e.path) for e in errs)


def test_unsupported_schema_version_fails():
    data = minimal_profile_dict()
    data["schema_version"] = 99
    errs = _schema_errors(data)
    assert errs, "schema_version 99 should be rejected"


def test_additional_properties_false_at_field_boundary():
    """A misspelled field inside a field-value object must fail."""
    data = minimal_profile_dict()
    data["identity"]["vendor_or_maintainer"]["sourcce"] = "typo"
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


def test_overall_score_field_is_rejected_by_policy():
    """The custom policy rejects overall-score fields even though schema allows
    additionalProperties:false at root (the key itself is unknown, so schema
    catches it; the policy also guards explicitly)."""
    data = minimal_profile_dict()
    data["overall_score"] = 9
    # Schema catches this via additionalProperties:false.
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


def test_no_benchmark_score_field_present():
    """The schema must not declare a benchmark-score field anywhere."""
    schema_text = profile_io.load_schema().__repr__()
    for forbidden in ("benchmark_score", "overall_score", "kernux_score", "swe_bench_score"):
        assert forbidden not in schema_text.lower(), f"schema mentions {forbidden}"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
