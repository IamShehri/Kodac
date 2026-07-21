"""Proposal-document consistency check: rejects known obsolete current-state phrases
and obsolete Phase 1 canonical paths in the twelve proposal documents."""

from __future__ import annotations

import os

import pytest

from tools.profile_io import REPO_ROOT

PROPOSAL_DIR = REPO_ROOT / "proposal"
PROPOSAL_FILES = sorted(f for f in os.listdir(PROPOSAL_DIR) if f.endswith(".md"))

# Phrases that, when they appear as UNQUALIFIED current-state statements (not
# inside clearly historical context), contradict the implemented state.
# We check each line; if the phrase appears without a historical qualifier
# nearby, it's flagged.
OBSOLETE_CURRENT_STATE_PATTERNS: list[tuple[str, str]] = [
    ("Implementation not authorized", "Phase 1 is implemented; current status should say so"),
    ("no profile YAML is created", "Profile YAML exists at agents/opencode/profile.yaml"),
    ("no profile YAML exists", "Profile YAML exists"),
    ("no schema exists", "Schema exists at schema/agent-profile.schema.json"),
    ("no validators exist", "Validators exist at tools/validate_profiles.py"),
    ("implementation has not begun", "Implementation has begun"),
    (
        "Phase 1 vertical-slice kickoff requires authorization",
        "Phase 1 is authorized and implemented",
    ),
    (
        "Not authorized. Legacy archival and the Phase 1 vertical-slice kickoff",
        "Phase 1 is authorized and implemented",
    ),
    ("Not authorized — awaiting final", "Phase 1 is authorized"),
]

# Obsolete Phase 1 canonical paths (the correct paths are implemented).
OBSOLETE_PATHS: list[str] = [
    "data/profiles/*.yml",
    "data/profiles/",
    "data/schema/profile.schema.json",
    "data/schema/",
    "tools/validate_profile.py",  # singular — correct is validate_profiles.py
    "tools/validate_run.py",
]


@pytest.mark.parametrize("filename", PROPOSAL_FILES)
def test_no_obsolete_current_state_phrases(filename: str):
    """Each proposal document must not contain unqualified obsolete current-state phrases."""
    filepath = PROPOSAL_DIR / filename
    content = filepath.read_text(encoding="utf-8")
    lines = content.splitlines()
    violations: list[str] = []

    historical_qualifiers = (
        "historical",
        "earlier",
        "previous",
        "pre-reboot",
        "originally",
        "was to be",
        "would",
        "this pass",
        "not yet implemented",  # legitimate when describing future work
    )

    for i, line in enumerate(lines):
        lower = line.lower()
        # Skip lines that are clearly historical context.
        if any(q in lower for q in historical_qualifiers):
            continue
        for phrase, reason in OBSOLETE_CURRENT_STATE_PATTERNS:
            if phrase.lower() in lower:
                # Allow if the line itself negates it (e.g., "Phase 1 is no longer not authorized").
                violations.append(
                    f"  {filename}:{i+1}: '{phrase}' — {reason}\n    > {line.strip()}"
                )
    assert not violations, "Obsolete current-state phrases found:\n" + "\n".join(violations)


@pytest.mark.parametrize("filename", PROPOSAL_FILES)
def test_no_obsolete_canonical_paths(filename: str):
    """Each proposal document must not contain obsolete Phase 1 canonical paths."""
    filepath = PROPOSAL_DIR / filename
    content = filepath.read_text(encoding="utf-8")
    violations: list[str] = []
    for obsolete_path in OBSOLETE_PATHS:
        if obsolete_path in content:
            for i, line in enumerate(content.splitlines(), 1):
                if obsolete_path in line:
                    lower = line.lower()
                    if any(
                        q in lower
                        for q in ("future", "not yet", "unimplemented", "phase 2", "reserved")
                    ):
                        continue
                    violations.append(
                        f"  {filename}:{i}: obsolete path '{obsolete_path}'\n    > {line.strip()}"
                    )
    assert not violations, "Obsolete canonical paths found:\n" + "\n".join(violations)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
