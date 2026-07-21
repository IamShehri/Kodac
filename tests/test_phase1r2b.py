"""Phase 1-R2B tests: canonical repository validation and JSON Schema dispute closure.

All tests assert the specific invariant, not just `assert errors`.
Malformed-repository tests assert a direct error on identity.source_repository.value.
"""

from __future__ import annotations

import copy

import jsonschema
import pytest

from tests._fixtures import (
    EVAL_DATE,
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


def _has_repo_error(errors):
    """True if at least one error has field identity.source_repository.value and
    mentions the canonical GitHub requirement."""
    return any(
        e.field == "identity.source_repository.value"
        and "canonical GitHub repository root" in e.message
        for e in errors
    )


def _run_repo_probe(url):
    """Run a minimal isolated profile with the given source_repository URL.
    All evidence uses the official host so no unrelated GitHub authority errors mask the result."""
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = url
    return _run_full(make_profile(data))


# ============================================================================
# Valid controls
# ============================================================================


def test_canonical_github_root_passes():
    errs = _run_repo_probe("https://github.com/test-vendor/test-agent")
    repo_errs = [e for e in errs if e.field == "identity.source_repository.value"]
    assert repo_errs == [], _errs_str(repo_errs)


def test_non_github_https_repo_passes_repo_check():
    errs = _run_repo_probe("https://gitlab.com/test-vendor/test-agent")
    repo_errs = [e for e in errs if e.field == "identity.source_repository.value"]
    assert repo_errs == [], _errs_str(repo_errs)


def test_opencode_profile_passes():
    errs = _run_full(opencode_profile())
    assert errs == [], _errs_str(errs)


def test_valid_two_source_dispute_zero_errors():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    rec2 = copy.deepcopy(data["evidence"]["records"][3])
    rec2["id"] = "src-docs-mcp-alt"
    rec2["title"] = "Alt MCP"
    rec2["fields_supported"] = ["protocols.mcp_support"]
    data["evidence"]["records"].append(rec2)
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-mcp-alt"],
            "note": "Conflict.",
        }
    ]
    errs = _run_full(make_profile(data))
    assert errs == [], f"Expected zero errors, got:\n{_errs_str(errs)}"


# ============================================================================
# Invalid GitHub repository identities (all must produce direct repo error)
# ============================================================================


@pytest.mark.parametrize(
    "url,desc",
    [
        ("https://github.com/owner/repo.git", ".git suffix"),
        ("https://github.com/owner/repo/", "trailing slash"),
        ("https://github.com/owner/repo/extra", "extra path"),
        ("https://github.com/owner/repo/blob/dev/file", "blob URL"),
        ("https://github.com/owner/repo/tree/main", "tree URL"),
        ("https://github.com/owner/repo/issues", "issues URL"),
        ("https://github.com/owner/repo/pull/1", "pull URL"),
        ("https://github.com/owner/repo?x=1", "query string"),
        ("https://github.com/owner/repo#frag", "fragment"),
        ("https://user:pass@github.com/owner/repo", "credentials"),
        ("https://github.com:443/owner/repo", "explicit port 443"),
        ("https://github.com:8443/owner/repo", "explicit non-443 port"),
        ("https://github.com//repo", "missing owner"),
        ("https://github.com/owner/", "missing repository"),
        ("https://github.com/owner/repo%2Fextra", "encoded slash"),
        ("https://github.com/owner/repo%5Cextra", "encoded backslash"),
    ],
)
def test_malformed_github_repo_rejected(url, desc):
    errs = _run_repo_probe(url)
    assert _has_repo_error(
        errs
    ), f"{desc}: expected direct identity.source_repository.value error\n{_errs_str(errs)}"


# ============================================================================
# JSON Schema-only dispute tests
# ============================================================================


def _schema_errors(data):
    schema = profile_io.load_schema()
    v = jsonschema.Draft202012Validator(
        schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER
    )
    return list(v.iter_errors(data))


def test_schema_missing_sources_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "note": "x"}]
    errs = _schema_errors(data)
    assert any("sources" in e.message and "required" in e.message for e in errs)


def test_schema_one_source_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a"], "note": "x"}]
    errs = _schema_errors(data)
    assert any("too short" in e.message.lower() or "minItems" in e.message for e in errs)


def test_schema_duplicate_sources_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a", "a"], "note": "x"}]
    errs = _schema_errors(data)
    assert any("unique" in e.message.lower() for e in errs)


def test_schema_empty_source_id_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a", ""], "note": "x"}]
    errs = _schema_errors(data)
    assert any("disputes" in str(e.absolute_path) for e in errs)


def test_schema_empty_field_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "", "sources": ["a", "b"], "note": "x"}]
    errs = _schema_errors(data)
    assert any("disputes" in str(e.absolute_path) for e in errs)


def test_schema_empty_note_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a", "b"], "note": ""}]
    errs = _schema_errors(data)
    assert any("disputes" in str(e.absolute_path) for e in errs)


def test_schema_unexpected_dispute_property_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a", "b"], "note": "x", "extra": 1}]
    errs = _schema_errors(data)
    assert any("additional" in e.message.lower() for e in errs)


def test_schema_valid_two_source_dispute_passes():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a", "b"], "note": "x"}]
    errs = _schema_errors(data)
    dispute_errs = [e for e in errs if "disputes" in str(e.absolute_path)]
    assert dispute_errs == []


# ============================================================================
# Regression tests
# ============================================================================


def test_duplicate_dispute_entries_still_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    rec2 = copy.deepcopy(data["evidence"]["records"][3])
    rec2["id"] = "src-docs-mcp-alt"
    rec2["title"] = "Alt"
    rec2["fields_supported"] = ["protocols.mcp_support"]
    data["evidence"]["records"].append(rec2)
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-mcp-alt"],
            "note": "A.",
        },
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-mcp-alt"],
            "note": "B.",
        },
    ]
    errs = _run_full(make_profile(data))
    assert any("exactly one" in e.message.lower() for e in errs), _errs_str(errs)


def test_orphan_disputes_still_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-index"],
            "note": "x",
        }
    ]
    errs = _run_full(make_profile(data))
    assert any("not disputed" in e.message or "does not exist" in e.message for e in errs)


def test_alternative_dispute_sources_not_unused():
    """The valid two-source dispute test already confirms this (zero errors)."""
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    rec2 = copy.deepcopy(data["evidence"]["records"][3])
    rec2["id"] = "src-docs-mcp-alt"
    rec2["title"] = "Alt"
    rec2["fields_supported"] = ["protocols.mcp_support"]
    data["evidence"]["records"].append(rec2)
    data["notes"]["disputes"] = [
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-mcp-alt"],
            "note": "x",
        }
    ]
    errs = _run_full(make_profile(data))
    orphan_errs = [
        e for e in errs if "orphan" in e.message.lower() or "not in any" in e.message.lower()
    ]
    assert orphan_errs == [], _errs_str(orphan_errs)


def test_dynamic_immutable_true_still_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-repo-api")
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any("immutable: false" in e.message for e in errs)


def test_commit_pinned_immutable_false_still_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["immutable"] = False
    errs = _run_full(make_profile(data))
    assert any("immutable: true" in e.message for e in errs)


def test_moving_blob_url_still_rejected():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["url"] = "https://github.com/test-vendor/test-agent/blob/dev/LICENSE"
    rec["immutable"] = True
    rec["revision_or_commit"] = ""
    errs = _run_full(make_profile(data))
    assert any("blob" in e.message.lower() or "not accepted" in e.message.lower() for e in errs)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
