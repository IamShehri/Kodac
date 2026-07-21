"""Phase 1-R2A tests: dispute model repair, duplicate disputes, canonical URL,
conservative immutability classifier, and regression probes."""

from __future__ import annotations

import copy

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
# 1. Dispute model repair — valid two-source dispute passes with zero errors
# ============================================================================


def test_valid_dispute_zero_errors():
    """The fully valid dispute must produce ZERO validation errors (not just zero dispute errors)."""
    data = copy.deepcopy(minimal_profile_dict())
    data["protocols"]["mcp_support"]["claim_status"] = "disputed"
    rec2 = copy.deepcopy(data["evidence"]["records"][3])
    rec2["id"] = "src-docs-mcp-alt"
    rec2["title"] = "Alternative MCP doc"
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


def test_dispute_alternative_not_orphan():
    """Alternative dispute evidence must not be treated as orphan."""
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
    orphan_errs = [
        e
        for e in errs
        if "orphan" in e.message.lower()
        or "not referenced" in e.message.lower()
        or "not in any" in e.message.lower()
    ]
    assert orphan_errs == [], _errs_str(orphan_errs)


# ============================================================================
# 2. Duplicate dispute entries
# ============================================================================


def test_duplicate_dispute_entries_fail():
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
            "note": "First.",
        },
        {
            "field": "protocols.mcp_support",
            "sources": ["src-docs-mcp", "src-docs-mcp-alt"],
            "note": "Second duplicate.",
        },
    ]
    errs = _run_full(make_profile(data))
    assert any(
        "exactly one" in e.message.lower() or "more than one" in e.message.lower() for e in errs
    ), _errs_str(errs)


# ============================================================================
# 3. Canonical GitHub repository URL
# ============================================================================


def test_valid_github_repository_root_passes():
    """The standard canonical root must pass."""
    errs = _run_full(make_profile())
    repo_errs = [e for e in errs if "source_repository" in e.field]
    assert repo_errs == [], _errs_str(repo_errs)


def test_extra_github_subpath_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = (
        "https://github.com/test-vendor/test-agent/unrelated/subpath"
    )
    errs = _run_full(make_profile(data))
    assert errs, _errs_str(errs)


def test_github_blob_url_as_source_repository_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = (
        "https://github.com/test-vendor/test-agent/blob/dev/README.md"
    )
    errs = _run_full(make_profile(data))
    assert errs


def test_github_tree_url_as_source_repository_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = (
        "https://github.com/test-vendor/test-agent/tree/main"
    )
    errs = _run_full(make_profile(data))
    assert errs


def test_github_url_with_query_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = (
        "https://github.com/test-vendor/test-agent?tab=readme"
    )
    errs = _run_full(make_profile(data))
    assert errs


def test_github_url_with_fragment_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = (
        "https://github.com/test-vendor/test-agent#readme"
    )
    errs = _run_full(make_profile(data))
    assert errs


def test_github_url_with_credentials_fails():
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = (
        "https://user:pass@github.com/test-vendor/test-agent"
    )
    errs = _run_full(make_profile(data))
    assert errs


# ============================================================================
# 4. Conservative immutability classifier
# ============================================================================


def test_commit_pinned_raw_url_immutable_true_passes():
    """Baseline already tests this; confirm explicitly."""
    errs = _run_full(make_profile())
    imm_errs = [e for e in errs if "immutable" in e.message.lower()]
    assert imm_errs == [], _errs_str(imm_errs)


def test_commit_pinned_raw_url_immutable_false_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["immutable"] = False
    errs = _run_full(make_profile(data))
    assert any("immutable: true" in e.message for e in errs), _errs_str(errs)


def test_moving_raw_url_immutable_true_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["url"] = "https://raw.githubusercontent.com/test-vendor/test-agent/dev/LICENSE"
    rec["immutable"] = True
    rec["revision_or_commit"] = ""
    errs = _run_full(make_profile(data))
    assert any("moving" in e.message.lower() for e in errs), _errs_str(errs)


def test_moving_github_blob_url_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["url"] = "https://github.com/test-vendor/test-agent/blob/dev/LICENSE"
    rec["immutable"] = True
    rec["revision_or_commit"] = ""
    errs = _run_full(make_profile(data))
    assert any(
        "blob" in e.message.lower() or "not accepted" in e.message.lower() for e in errs
    ), _errs_str(errs)


def test_sha_github_blob_url_rejected():
    """Even a SHA-pinned github.com/blob URL should be rejected (use raw instead)."""
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-license")
    rec["url"] = f"https://github.com/test-vendor/test-agent/blob/{FAKE_SHA}/LICENSE"
    rec["immutable"] = True
    rec["revision_or_commit"] = FAKE_SHA
    errs = _run_full(make_profile(data))
    assert any(
        "blob" in e.message.lower() or "not accepted" in e.message.lower() for e in errs
    ), _errs_str(errs)


def test_dynamic_api_immutable_true_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-repo-api")
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any("immutable: false" in e.message for e in errs), _errs_str(errs)


def test_dynamic_official_homepage_immutable_true_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-site-home")
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any("immutable: false" in e.message for e in errs), _errs_str(errs)


def test_dynamic_official_docs_immutable_true_fails():
    """Official documentation on a dynamic official subdomain (not raw.githubusercontent.com)
    must not be immutable. We simulate this by pointing an official-docs record at the
    official host (test-agent.example.com) rather than raw.githubusercontent.com."""
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-docs-mcp")
    # Point at the official host (dynamic), not raw.githubusercontent.com.
    rec["url"] = "https://test-agent.example.com/docs/mcp"
    rec["immutable"] = True
    rec["revision_or_commit"] = ""
    errs = _run_full(make_profile(data))
    assert any("immutable: false" in e.message for e in errs), _errs_str(errs)


def test_unrecognized_https_immutable_true_fails():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-site-home")
    rec["url"] = "https://random-unknown-host.example.com/page"
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any("immutable: false" in e.message for e in errs), _errs_str(errs)


def test_release_tag_api_immutable_false_passes():
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


def test_release_tag_api_immutable_true_fails():
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
            "immutable": True,
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
    assert any("immutable: false" in e.message for e in errs), _errs_str(errs)


def test_releases_latest_cannot_support_current_versions():
    data = copy.deepcopy(minimal_profile_dict())
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


# ============================================================================
# 5. Regression — OpenCode profile passes
# ============================================================================


def test_opencode_profile_passes():
    errs = _run_full(opencode_profile())
    assert errs == [], _errs_str(errs)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
