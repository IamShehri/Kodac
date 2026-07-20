"""Tests for the deterministic matrix generator."""

from __future__ import annotations

import pytest

from tests._fixtures import EVAL_DATE, make_profile, minimal_profile_dict, opencode_profile
from tools import generate_matrix, profile_io

MATRIX_PATH = profile_io.REPO_ROOT / "matrix" / "AGENT_MATRIX.md"


# ---------------------------------------------------------------------------
# Determinism
# ---------------------------------------------------------------------------


def test_generation_is_deterministic():
    p = opencode_profile()
    out1 = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    out2 = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert out1 == out2


def test_agent_ordering_is_deterministic():
    """Agents are sorted by canonical id regardless of input order."""
    base = minimal_profile_dict("alpha")
    base2 = minimal_profile_dict("alpha")
    base2["id"] = "zeta"
    base2["name"] = "Zeta"
    p_alpha = make_profile(base, agent_id="alpha")
    p_zeta = make_profile(base2, agent_id="zeta")
    out_unsorted = generate_matrix.render_matrix([p_zeta, p_alpha], evaluation_date=EVAL_DATE)
    out_sorted = generate_matrix.render_matrix([p_alpha, p_zeta], evaluation_date=EVAL_DATE)
    assert out_unsorted == out_sorted
    # alpha row appears before zeta row.
    assert out_sorted.index("Test Agent") < out_sorted.index("Zeta")


def test_column_ordering_is_stable():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    header_line = [ln for ln in out.splitlines() if ln.startswith("| Agent")][0]
    # Exact expected column order.
    assert header_line == (
        "| Agent | Track(s) | Source availability | License | Surfaces | "
        "Local-model status | MCP status | Headless/CI status | "
        "Evidence status | Last verified |"
    )


# ---------------------------------------------------------------------------
# Committed matrix matches regenerated output
# ---------------------------------------------------------------------------


def test_committed_matrix_matches_regenerated():
    """The committed matrix/AGENT_MATRIX.md must equal freshly regenerated output."""
    assert MATRIX_PATH.is_file(), "matrix/AGENT_MATRIX.md is missing"
    committed = MATRIX_PATH.read_text(encoding="utf-8")
    regenerated = generate_matrix.generate(evaluation_date=EVAL_DATE)
    assert committed == regenerated, (
        "matrix/AGENT_MATRIX.md is out of date. " "Run: uv run python -m tools.generate_matrix"
    )


# ---------------------------------------------------------------------------
# Invalid input prevents generation
# ---------------------------------------------------------------------------


def test_invalid_input_prevents_generation():
    bad = minimal_profile_dict()
    bad["schema_version"] = 99  # invalid
    p = make_profile(bad)
    with pytest.raises(ValueError, match="validation error"):
        generate_matrix.generate(evaluation_date=EVAL_DATE, profiles=[p])


# ---------------------------------------------------------------------------
# --check detects drift
# ---------------------------------------------------------------------------


def test_check_detects_drift(tmp_path, monkeypatch):
    """--check must fail (exit 1) when the committed matrix differs."""
    # Tamper with the on-disk matrix.
    original = MATRIX_PATH.read_text(encoding="utf-8")
    try:
        MATRIX_PATH.write_text(original + "\n<!-- tampered -->\n", encoding="utf-8")
        rc = generate_matrix.main(["--check", "--evaluation-date", EVAL_DATE.isoformat()])
        assert rc == 1, "--check should fail when matrix differs"
    finally:
        # Restore.
        MATRIX_PATH.write_text(original, encoding="utf-8")


def test_check_passes_when_up_to_date():
    rc = generate_matrix.main(["--check", "--evaluation-date", EVAL_DATE.isoformat()])
    assert rc == 0


# ---------------------------------------------------------------------------
# No score / no winner in output
# ---------------------------------------------------------------------------


def test_no_overall_score_in_output():
    """No overall score column/value is rendered. The legend explicitly states
    the prohibition ('No overall Kernux Score is computed'), so we only check
    the table header and rows for an actual score column."""
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    # The matrix must declare there is no overall score (prohibition present).
    assert "no overall" in out.lower()
    # The table header must not contain a score column.
    header_lines = [ln for ln in out.splitlines() if ln.startswith("| Agent")]
    assert header_lines, "table header missing"
    header = header_lines[0].lower()
    for forbidden in ("score", "winner", "rank", "best agent", "grade"):
        assert forbidden not in header, f"header contains forbidden term {forbidden!r}"
    # No data row may declare a winner.
    data_rows = [
        ln
        for ln in out.splitlines()
        if ln.startswith("| ") and "open source coding agent" not in ln.lower()
    ]
    for row in data_rows:
        for forbidden in ("winner", "best agent", "#1"):
            assert forbidden not in row.lower(), f"row contains {forbidden!r}"


def test_generated_notice_present():
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    assert "This file is generated" in out
    assert "Do not edit by hand" in out


def test_no_timestamp_that_drifts():
    """Output must not contain a generation timestamp that changes between runs."""
    p = opencode_profile()
    out = generate_matrix.render_matrix([p], evaluation_date=EVAL_DATE)
    lower = out.lower()
    # Forbidden drift sources: "generated at", "generated on", current time.
    for forbidden in ("generated at", "generated on", "last run:", "run at"):
        assert forbidden not in lower


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
