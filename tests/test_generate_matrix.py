"""Tests for the deterministic matrix generator."""

from __future__ import annotations

import copy
import datetime as _dt  # noqa: F401  (kept for explicit-evaluation-date pattern docs)

import pytest

from tests._fixtures import EVAL_DATE, make_profile, minimal_profile_dict, opencode_profile
from tools import generate_matrix, profile_io

MATRIX_PATH = profile_io.REPO_ROOT / "matrix" / "AGENT_MATRIX.md"


# Determinism.


def test_generation_is_deterministic():
    p = opencode_profile()
    out1 = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    out2 = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert out1 == out2


def test_agent_ordering_is_deterministic():
    base = minimal_profile_dict("alpha")
    base2 = minimal_profile_dict("alpha")
    base2["id"] = "zeta"
    base2["name"] = "Zeta"
    p_alpha = make_profile(base, agent_id="alpha")
    p_zeta = make_profile(base2, agent_id="zeta")
    out_unsorted = generate_matrix.render_matrix([p_zeta, p_alpha], evaluation_date=EVAL_DATE)
    out_sorted = generate_matrix.render_matrix([p_alpha, p_zeta], evaluation_date=EVAL_DATE)
    assert out_unsorted == out_sorted
    assert out_sorted.index("Test Agent") < out_sorted.index("Zeta")


def test_column_ordering_is_stable():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    header_line = [ln for ln in out.splitlines() if ln.startswith("| Agent")][0]
    assert header_line == (
        "| Agent | Track(s) | Source availability | License | Surfaces | "
        "Local-model status | MCP status | Headless/CI status | "
        "Evidence status | Last verified |"
    )


# Committed matrix matches regenerated output.


def test_committed_matrix_matches_regenerated():
    assert MATRIX_PATH.is_file(), "matrix/AGENT_MATRIX.md is missing"
    committed = MATRIX_PATH.read_text(encoding="utf-8")
    regenerated = generate_matrix.generate(evaluation_date=EVAL_DATE)
    assert committed == regenerated, (
        "matrix/AGENT_MATRIX.md is out of date. " "Run: uv run python -m tools.generate_matrix"
    )


# Invalid input prevents generation.


def test_invalid_input_prevents_generation():
    bad = copy.deepcopy(minimal_profile_dict())
    bad["schema_version"] = 99
    p = make_profile(bad)
    with pytest.raises(ValueError, match="validation error"):
        generate_matrix.generate(evaluation_date=EVAL_DATE, profiles=[p])


# --check detects drift.


def test_check_detects_drift():
    original = MATRIX_PATH.read_text(encoding="utf-8")
    try:
        MATRIX_PATH.write_text(original + "\n<!-- tampered -->\n", encoding="utf-8")
        rc = generate_matrix.main(["--check", "--evaluation-date", EVAL_DATE.isoformat()])
        assert rc == 1
    finally:
        MATRIX_PATH.write_text(original, encoding="utf-8")


def test_check_passes_when_up_to_date():
    rc = generate_matrix.main(["--check", "--evaluation-date", EVAL_DATE.isoformat()])
    assert rc == 0


# Claim-status visibility: a change from verified to vendor-reported changes bytes.


def test_claim_status_change_changes_output():
    p = opencode_profile()
    out_verified = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    p2_data = copy.deepcopy(p.data)
    p2_data["openness"]["license"]["claim_status"] = "vendor-reported"
    rec = next(r for r in p2_data["evidence"]["records"] if r["id"] == "opencode-license")
    rec["verification_method"] = "official-documentation"
    rec["authority"] = "official-docs"
    p2 = make_profile(p2_data, agent_id="opencode")
    out_flipped = generate_matrix.render_matrix([p2], evaluation_date=EVAL_DATE)
    assert out_verified != out_flipped, "claim-status change must change matrix bytes"
    assert "MIT \u00b7 vendor-reported" in out_flipped
    assert "MIT \u00b7 verified" in out_verified


def test_matrix_displays_vendor_reported_markers():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert "vendor-reported" in out


def test_unknown_renders_plainly():
    data = copy.deepcopy(minimal_profile_dict())
    p = make_profile(data)
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert "unknown \u00b7 unknown" not in out
    assert "unknown" in out


def test_evidence_status_is_derived():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    derived = profile_io.derive_evidence_status(p.data)
    assert derived in out


def test_last_verified_is_derived():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    derived = profile_io.derive_last_verified(p.data)
    assert derived in out


# No score / no winner / no timestamp.


def test_no_overall_score_in_header_or_rows():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert "no overall" in out.lower()
    header_lines = [ln for ln in out.splitlines() if ln.startswith("| Agent")]
    assert header_lines
    header = header_lines[0].lower()
    for forbidden in ("score", "winner", "rank", "best agent", "grade"):
        assert forbidden not in header


def test_generated_notice_present():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert "This file is generated" in out
    assert "Do not edit by hand" in out


def test_no_drifting_timestamp():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    lower = out.lower()
    for forbidden in ("generated at", "generated on", "last run:", "run at"):
        assert forbidden not in lower


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
