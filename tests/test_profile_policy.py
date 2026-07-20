"""Custom evidence-policy tests for the validator."""

from __future__ import annotations

import copy

import jsonschema
import pytest

from tests._fixtures import EVAL_DATE, make_profile, minimal_profile_dict, opencode_profile
from tools import profile_io, validate_profiles


def _run_policy(profile) -> list:
    """Run full validation (schema + policy) and return errors."""
    return validate_profiles.validate_profile(
        profile,
        schema=profile_io.load_schema(),
        validator_cls=jsonschema.Draft202012Validator,
        evaluation_date=EVAL_DATE,
    )


def _err_fields(errors) -> set[str]:
    return {e.field for e in errors}


def _err_messages(errors) -> str:
    return "\n".join(e.render() for e in errors)


# ---------------------------------------------------------------------------
# Rule 1: path/id mismatch
# ---------------------------------------------------------------------------


def test_path_id_mismatch_fails():
    p = make_profile(minimal_profile_dict("opencode"), agent_id="opencode")
    # Override the id in data to mismatch the directory.
    p.data["id"] = "different-id"
    # Patch agent_id to simulate the directory name; the validator reads data id vs path.
    from tools.profile_io import ProfileFile

    p = ProfileFile(path=p.path, data=p.data, agent_id="different-id")
    # But path parent is 'opencode'. Use a synthesized mismatch:
    p2 = ProfileFile(
        path=profile_io.REPO_ROOT / "agents" / "opencode" / "profile.yaml",
        data=p.data,
        agent_id="different-id",
    )
    errs = _run_policy(p2)
    assert any(
        "does not match directory name" in m for m in [e.message for e in errs]
    ), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 2: duplicate evidence ids
# ---------------------------------------------------------------------------


def test_duplicate_evidence_id_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["evidence"]["records"].append(copy.deepcopy(data["evidence"]["records"][0]))
    errs = _run_policy(make_profile(data))
    assert any("duplicate evidence id" in e.message for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 3: missing evidence reference (dangling source)
# ---------------------------------------------------------------------------


def test_missing_evidence_reference_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["source"] = "nonexistent-eid"
    errs = _run_policy(make_profile(data))
    assert any("does not resolve" in e.message for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 4: dangling (unused) evidence record
# ---------------------------------------------------------------------------


def test_dangling_evidence_reference_fails():
    data = copy.deepcopy(minimal_profile_dict())
    # Add an unused record.
    data["evidence"]["records"].append(
        {
            "id": "unused-src",
            "title": "Unused",
            "url": "https://example.com/unused",
            "authority": "official-docs",
            "date_accessed": "2026-07-21",
            "fields_supported": ["nothing"],
        }
    )
    errs = _run_policy(make_profile(data))
    assert any("not referenced" in e.message for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 5: non-unknown unsourced fact fails
# ---------------------------------------------------------------------------


def test_non_unknown_unsourced_fact_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["privacy"]["telemetry_behavior"] = {
        "value": "some claim",
        "source": "none",
        "verified": "2026-07-21",
        "freshness_class": 2,
    }
    errs = _run_policy(make_profile(data))
    assert any("no evidence source" in e.message for e in errs), _err_messages(errs)


def test_unknown_field_with_evidence_source_is_rejected():
    """An 'unknown' value must have source 'none', not a real evidence id."""
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["agent_skills_support"] = {
        "value": "unknown",
        "source": "src1",  # wrong: unknown must be 'none'
        "verified": "2026-07-21",
        "freshness_class": 2,
    }
    errs = _run_policy(make_profile(data))
    assert any("value is 'unknown' but source" in e.message for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 8: future verification date fails
# ---------------------------------------------------------------------------


def test_future_verification_date_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["verified"] = "2099-01-01"
    errs = _run_policy(make_profile(data))
    assert any("in the future" in e.message for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 10: unknown vs stale remain distinct
# ---------------------------------------------------------------------------


def test_unknown_is_not_stale():
    fv = {"value": "unknown", "source": "none", "verified": "2026-07-21", "freshness_class": 1}
    assert profile_io.field_is_unknown(fv) is True
    # Even with an ancient verified date, unknown is not stale.
    fv_old = {"value": "unknown", "source": "none", "verified": "2000-01-01", "freshness_class": 1}
    assert profile_io.field_is_stale(fv_old, evaluation_date=EVAL_DATE) is False


def test_stale_is_distinct_from_unknown():
    fv = {
        "value": "supported",
        "source": "src1",
        "verified": "2020-01-01",  # well past any freshness window
        "freshness_class": 1,
    }
    assert profile_io.field_is_unknown(fv) is False
    assert profile_io.field_is_stale(fv, evaluation_date=EVAL_DATE) is True


# ---------------------------------------------------------------------------
# Rule 9: freshness class must be 1/2/3
# ---------------------------------------------------------------------------


def test_invalid_freshness_class_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["freshness_class"] = 7
    errs = _run_policy(make_profile(data))
    assert any("freshness_class" in e.field for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 14: overall score rejected
# ---------------------------------------------------------------------------


def test_overall_score_field_rejected_by_policy():
    data = copy.deepcopy(minimal_profile_dict())
    data["overall_score"] = 9
    errs = _run_policy(make_profile(data))
    assert any("overall score" in e.message.lower() for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 15: universal superiority rejected
# ---------------------------------------------------------------------------


def test_universal_superiority_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["summary"] = "This is the best agent in the world."
    errs = _run_policy(make_profile(data))
    assert any("superiority" in e.message.lower() for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Rule 11: duplicate agent ids
# ---------------------------------------------------------------------------


def test_duplicate_agent_ids_fail():
    p1 = make_profile(minimal_profile_dict("dup"), agent_id="dup")
    p2 = make_profile(minimal_profile_dict("dup"), agent_id="dup")
    errs = validate_profiles._check_duplicate_agent_ids([p1, p2])
    assert errs, "expected duplicate-agent-id errors"


# ---------------------------------------------------------------------------
# Rule 12: unsupported schema version fails (policy layer)
# ---------------------------------------------------------------------------


def test_unsupported_schema_version_fails_policy():
    data = copy.deepcopy(minimal_profile_dict())
    data["schema_version"] = 2
    errs = _run_policy(make_profile(data))
    assert any("unsupported schema_version" in e.message for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Claim-status requirement on identity/cost/security
# ---------------------------------------------------------------------------


def test_missing_claim_status_on_identity_field_fails():
    data = copy.deepcopy(minimal_profile_dict())
    del data["identity"]["official_url"]["claim_status"]
    errs = _run_policy(make_profile(data))
    assert any(
        "claim_status is required" in e.message and "official_url" in e.field for e in errs
    ), _err_messages(errs)


# ---------------------------------------------------------------------------
# Unsupported phrase policy
# ---------------------------------------------------------------------------


def test_unsupported_phrase_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["summary"] = "This agent is production-ready and fully secure."
    errs = _run_policy(make_profile(data))
    # Should fail on at least one forbidden phrase.
    assert any("unsupported positive claim" in e.message for e in errs), _err_messages(errs)


# ---------------------------------------------------------------------------
# Real OpenCode profile passes full policy
# ---------------------------------------------------------------------------


def test_opencode_profile_passes_policy():
    errs = _run_policy(opencode_profile())
    assert errs == [], _err_messages(errs)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
