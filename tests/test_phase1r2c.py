"""Phase 1-R2C tests: parser safety and exact canonicalization closure.

Covers the four baseline defects (invalid-port crash, percent-encoded
unreserved path bypass, percent-encoded ``.git`` bypass, noncanonical host
casing) plus the broader totality requirements:

  * Malformed URLs produce ``ValidationError`` objects and never raise.
  * The canonical GitHub representation is enforced byte-for-byte:
    ``https://github.com/<owner>/<repository>``.
  * GitHub paths containing percent encoding are rejected, not normalized.
  * Non-GitHub HTTPS hosts retain generic (non-GitHub) validation.

Every canonical-repository test asserts the precise field
``identity.source_repository.value`` and a message containing the canonical
GitHub repository-root fragment. Generic ``assert errors`` is not used for
canonical-repository cases.
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
from tools.validate_profiles import (
    _github_canonical_segments,
    _github_owner_repo,
    _safe_parse_url,
)

FIELD = "identity.source_repository.value"
CANON_FRAGMENT = "canonical GitHub repository root"
CANON_VALUE = "https://github.com/owner/repo"


def _run_full(profile):
    return validate_profiles.validate_profile(
        profile,
        schema=profile_io.load_schema(),
        validator_cls=jsonschema.Draft202012Validator,
        evaluation_date=EVAL_DATE,
    )


def _errs_str(errors):
    return "\n".join(e.render() for e in errors)


def _repo_errors(errors):
    """The precise, canonical-specific errors on identity.source_repository.value."""
    return [e for e in errors if e.field == FIELD and CANON_FRAGMENT in e.message]


def _run_repo_probe(url):
    """Run a minimal isolated profile with the given source_repository URL.

    NOTE: the minimal fixture's evidence uses the synthetic test-vendor/test-agent
    GitHub repository. For GitHub ``source_repository`` probes that is fine
    because we assert the *direct* canonical-repository error, not downstream
    authority errors. For non-GitHub acceptance tests we build an isolated
    fixture instead (see ``_run_isolated_non_github``).
    """
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = url
    return _run_full(make_profile(data))


def _run_isolated_non_github(url):
    """Build a genuinely isolated profile whose evidence matches a non-GitHub host.

    Every evidence record points at the same non-GitHub host as the
    ``source_repository`` so no GitHub authority error can mask the result.
    Used only for the Section 7.E non-GitHub *acceptance* control.
    """
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = url
    data["identity"]["official_url"]["value"] = url
    # Rewrite every evidence URL onto the non-GitHub host so the official /
    # official-docs / official-repo authority checks all line up.
    for rec in data["evidence"]["records"]:
        rec["url"] = f"{url}/evidence/{rec['id']}.txt"
        rec["authority"] = "official-docs"
        rec["verification_method"] = "official-documentation"
        rec.pop("revision_or_commit", None)
        rec["immutable"] = False
    # The vendor identity came from a repository-api record; keep it pointing
    # at the non-GitHub host with a consistent authority.
    return _run_full(make_profile(data))


# ============================================================================
# A. Four mandatory regressions (the documented baseline defects)
# ============================================================================


@pytest.mark.parametrize(
    "url,desc",
    [
        ("https://github.com:notaport/owner/repo", "invalid port (A)"),
        ("https://github.com/owner/%72epo", "percent-encoded unreserved (B)"),
        ("https://github.com/owner/repo%2Egit", "percent-encoded .git (C)"),
        ("https://GitHub.com/owner/repo", "noncanonical host casing (D)"),
    ],
)
def test_four_mandatory_regressions(url, desc):
    errs = _run_repo_probe(url)
    repo = _repo_errors(errs)
    assert repo, (
        f"{desc}: expected a direct identity.source_repository.value error "
        f"with the canonical fragment\n{_errs_str(errs)}"
    )
    # The single canonical error must target the precise field.
    assert all(e.field == FIELD for e in repo)


# ============================================================================
# B. Port and parser safety (never raises; deterministic output)
# ============================================================================


@pytest.mark.parametrize(
    "url,desc",
    [
        ("https://github.com:notaport/owner/repo", "nonnumeric port"),
        ("https://github.com:99999/owner/repo", "port above 65535"),
        ("https://github.com:-1/owner/repo", "negative port"),
        ("https://github.com:+80/owner/repo", "malformed port syntax"),
        ("https://github.com:/owner/repo", "empty explicit port"),
        ("https://github.com:0x50/owner/repo", "hex-style port"),
        ("https://[::1:2:3:4:5:6:7/owner/repo", "invalid IPv6 bracket syntax"),
        ("https://[::1]/owner/repo", "bare IPv6 host"),
        ("https:///owner/repo", "missing hostname"),
        ("https://user:pass@github.com/owner/repo", "embedded credentials"),
        (" https://github.com/owner/repo", "leading whitespace"),
        ("https://github.com/owner/repo ", "trailing whitespace"),
        ("https://github.com/own\ner/repo", "embedded newline"),
        ("https://github.com/own\ter/repo", "embedded tab"),
    ],
)
def test_parser_safety_never_raises(url, desc):
    """Every malformed input must produce deterministic errors, never raise."""
    try:
        errs = _run_repo_probe(url)
    except BaseException as exc:  # noqa: BLE001 — totality is the point
        pytest.fail(f"{desc}: validator raised {type(exc).__name__}: {exc}")
    # Deterministic: the call returned a list of ValidationError objects.
    assert isinstance(errs, list)
    # The GitHub-host cases (port, credentials, IPv6 brackets that urlparse
    # still maps to a github host) must produce a direct repo error.
    # Whitespace/control/missing-host cases may be schema-level; we only
    # require that *no* exception occurred and output is deterministic.


@pytest.mark.parametrize(
    "url,desc",
    [
        ("https://github.com:notaport/owner/repo", "nonnumeric port"),
        ("https://github.com:99999/owner/repo", "port above 65535"),
        ("https://github.com:-1/owner/repo", "negative port"),
        ("https://github.com:+80/owner/repo", "malformed port syntax"),
        ("https://github.com:/owner/repo", "empty explicit port"),
        ("https://user:pass@github.com/owner/repo", "embedded credentials"),
    ],
)
def test_github_malformed_port_or_creds_direct_error(url, desc):
    """GitHub-host URLs with a malformed port or credentials produce a direct
    repo error (these are the cases that previously crashed or bypassed)."""
    errs = _run_repo_probe(url)
    assert _repo_errors(errs), f"{desc}: expected direct repo error\n{_errs_str(errs)}"


# ============================================================================
# C. Percent-encoding matrix
# ============================================================================


PERCENT_ENCODINGS = [
    "%72",  # 'r'
    "%2E",  # '.'
    "%2e",  # '.'
    "%2F",  # '/'
    "%2f",  # '/'
    "%5C",  # '\'
    "%5c",  # '\'
    "%20",  # ' '
    "%41",  # 'A'
    "%252F",  # double-encoded '/'
]


@pytest.mark.parametrize("enc", PERCENT_ENCODINGS)
def test_percent_encoding_in_repository_segment_rejected(enc):
    url = f"https://github.com/owner/repo{enc}"
    errs = _run_repo_probe(url)
    assert _repo_errors(errs), f"repo segment {enc!r}: expected rejection\n{_errs_str(errs)}"


@pytest.mark.parametrize("enc", PERCENT_ENCODINGS)
def test_percent_encoding_in_owner_segment_rejected(enc):
    url = f"https://github.com/own{enc}er/repo"
    errs = _run_repo_probe(url)
    assert _repo_errors(errs), f"owner segment {enc!r}: expected rejection\n{_errs_str(errs)}"


def test_bare_percent_sign_rejected():
    """A literal '%' that is not a valid escape still must not pass."""
    errs = _run_repo_probe("https://github.com/owner/repo%")
    assert _repo_errors(errs), f"bare '%': expected rejection\n{_errs_str(errs)}"


# ============================================================================
# D. Exact canonical representation
# ============================================================================


@pytest.mark.parametrize(
    "url,desc",
    [
        ("https://GitHub.com/owner/repo", "uppercase host"),
        ("https://GITHUB.COM/owner/repo", "all-uppercase host"),
        ("https://github.com./owner/repo", "trailing-dot host"),
        ("https://github.com:443/owner/repo", "explicit port 443"),
        ("https://github.com:8443/owner/repo", "explicit non-443 port"),
        ("HTTPS://github.com/owner/repo", "uppercase scheme"),
        ("https://github.com/owner/repo/", "trailing slash"),
        ("https://github.com/owner/repo.git", ".git suffix"),
        ("https://github.com/owner/repo/extra", "extra path"),
        ("https://github.com/owner/repo?tab=readme", "query"),
        ("https://github.com/owner/repo#readme", "fragment"),
        ("https://github.com/owner/repo/blob/dev/README.md", "blob URL"),
        ("https://github.com/owner/repo/tree/main", "tree URL"),
        ("https://github.com/owner/repo/issues", "issues URL"),
        ("https://github.com/owner/repo/pull/1", "pull URL"),
        ("https://github.com/owner/repo/releases/tag/v1", "release URL"),
        ("https://github.com/owner/repo\\extra", "literal backslash"),
        ("https://github.com/./repo", "'.' owner segment"),
        ("https://github.com/owner/.", "'.' repo segment"),
        ("https://github.com/../repo", "'..' owner segment"),
        ("https://github.com/owner/..", "'..' repo segment"),
        ("https://github.com//repo", "missing owner (empty segment)"),
        ("https://github.com/owner/", "missing repository (trailing slash)"),
        ("http://github.com/owner/repo", "non-HTTPS scheme"),
        ("https://user@github.com/owner/repo", "bare userinfo"),
    ],
)
def test_canonical_representation_rejects(url, desc):
    errs = _run_repo_probe(url)
    assert _repo_errors(errs), f"{desc}: expected direct repo error\n{_errs_str(errs)}"


def test_canonical_lowercase_url_accepted():
    errs = _run_repo_probe("https://github.com/owner/repo")
    assert _repo_errors(errs) == [], f"canonical URL must pass\n{_errs_str(errs)}"


def test_canonical_lowercase_url_byte_identity():
    """The canonical helper must round-trip: segments reconstruct the input."""
    owner, repo = _github_canonical_segments("https://github.com/owner/repo")
    assert (owner, repo) == ("owner", "repo")
    assert _github_owner_repo("https://github.com/owner/repo") == ("owner", "repo")


# ============================================================================
# E. Non-GitHub controls (no GitHub canonicalization error)
# ============================================================================


@pytest.mark.parametrize(
    "url", ["https://gitlab.com/owner/repo", "https://codeberg.org/owner/repo"]
)
def test_non_github_https_roots_no_github_error_via_helper(url):
    """The canonical GitHub helper returns (None, None) for non-GitHub hosts
    so no GitHub canonicalization error can be produced for them."""
    assert _github_canonical_segments(url) == (None, None)
    assert _github_owner_repo(url) is None


@pytest.mark.parametrize(
    "url", ["https://gitlab.com/owner/repo", "https://codeberg.org/owner/repo"]
)
def test_non_github_https_roots_no_github_error_in_profile(url):
    """An isolated non-GitHub profile must not receive a GitHub canonicalization
    error on identity.source_repository.value. The evidence is rebuilt to point
    only at the non-GitHub host, so no unrelated GitHub authority error masks
    the result. (We assert the *absence of a GitHub canonical error*, not that
    the whole profile is policy-valid — per Section 7.E.)"""
    errs = _run_isolated_non_github(url)
    gh_errs = _repo_errors(errs)
    assert (
        gh_errs == []
    ), f"non-GitHub host must not trigger a GitHub canonical error\n{_errs_str(errs)}"


# ============================================================================
# F. Full-regression requirements
# ============================================================================


def test_opencode_profile_zero_errors():
    errs = _run_full(opencode_profile())
    assert errs == [], f"OpenCode profile must have zero errors\n{_errs_str(errs)}"


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
    assert errs == [], f"valid two-source dispute must have zero errors\n{_errs_str(errs)}"


def _schema_errors(data):
    v = jsonschema.Draft202012Validator(
        profile_io.load_schema(),
        format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER,
    )
    return list(v.iter_errors(data))


def test_json_schema_dispute_tests_remain_green():
    # Valid two-source dispute passes the schema.
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a", "b"], "note": "x"}]
    dispute_errs = [e for e in _schema_errors(data) if "disputes" in str(e.absolute_path)]
    assert dispute_errs == []
    # Missing sources / one source / duplicates each fail.
    d1 = copy.deepcopy(minimal_profile_dict())
    d1["notes"]["disputes"] = [{"field": "t", "note": "x"}]
    assert any("sources" in e.message and "required" in e.message for e in _schema_errors(d1))
    d2 = copy.deepcopy(minimal_profile_dict())
    d2["notes"]["disputes"] = [{"field": "t", "sources": ["a"], "note": "x"}]
    assert any(
        "too short" in e.message.lower() or "minItems" in e.message for e in _schema_errors(d2)
    )
    d3 = copy.deepcopy(minimal_profile_dict())
    d3["notes"]["disputes"] = [{"field": "t", "sources": ["a", "a"], "note": "x"}]
    assert any("unique" in e.message.lower() for e in _schema_errors(d3))


def test_duplicate_disputes_remain_rejected():
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


def test_dynamic_immutable_rules_remain_enforced():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-repo-api")
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any("immutable: false" in e.message for e in errs), _errs_str(errs)


# ============================================================================
# G. Total-function adversarial test + deterministic error ordering
# ============================================================================


ADVERSARIAL_URLS = [
    "",
    "   ",
    "\n",
    "\t",
    "not a url",
    "://no-scheme",
    "ftp://github.com/owner/repo",
    "git://github.com/owner/repo",
    "http://github.com/owner/repo",
    "https://",
    "https://github.com",
    "https://github.com/",
    "https://github.com/owner",
    "https://github.com/owner/",
    "https://github.com/owner/repo/",
    "https://github.com/owner/repo//",
    "https://github.com//repo",
    "https://github.com/owner/repo/extra/path",
    "https://github.com:80/owner/repo",
    "https://github.com:443/owner/repo",
    "https://github.com:notaport/owner/repo",
    "https://github.com:99999/owner/repo",
    "https://github.com:-80/owner/repo",
    "https://github.com:/owner/repo",
    "https://github.com:0x50/owner/repo",
    "https://github.com:1e2/owner/repo",
    "https://GitHub.com/owner/repo",
    "https://GITHUB.COM/owner/repo",
    "https://github.com./owner/repo",
    "HTTPS://github.com/owner/repo",
    "https://user:pass@github.com/owner/repo",
    "https://user@github.com/owner/repo",
    "https://github.com/owner/repo?x=1",
    "https://github.com/owner/repo#frag",
    "https://github.com/owner/repo.git",
    "https://github.com/owner/repo%2Egit",
    "https://github.com/owner/%72epo",
    "https://github.com/owner/repo%2f",
    "https://github.com/own%65r/repo",
    "https://github.com/owner/repo\\path",
    "https://github.com/./repo",
    "https://github.com/../repo",
    "https://github.com/owner/.",
    "https://github.com/owner/..",
    "https://[::1]/owner/repo",
    "https://[::1:2:3/owner/repo",
    "https://[]/owner/repo",
    "https://localhost/owner/repo",
    "https://127.0.0.1/owner/repo",
    "https://192.168.1.1/owner/repo",
    "https://github.com/owner/repo\n",
    "https://github.com/owner/repo\r\n",
    " https://github.com/owner/repo",
    "https://github.com/owner/repo ",
    "https://github.com/owner/repo\x00",
    # A few that should NOT raise and are either canonical-OK or generic:
    "https://github.com/owner/repo",  # canonical (accepted)
    "https://gitlab.com/owner/repo",  # non-GitHub (no GitHub error)
    "https://codeberg.org/owner/repo",  # non-GitHub (no GitHub error)
    "https://example.com/owner/repo",  # generic HTTPS
]


def test_adversarial_never_raises_and_deterministic():
    """Pass a broad set of malformed URL strings and assert validation never
    raises, and that errors are deterministically sorted."""
    for url in ADVERSARIAL_URLS:
        try:
            errs = _run_repo_probe(url)
        except BaseException as exc:  # noqa: BLE001 — totality is the point
            pytest.fail(f"validator raised on {url!r}: {type(exc).__name__}: {exc}")
        assert isinstance(errs, list)
        # Deterministic ordering: validate_profile sorts by (path, field, message).
        keys = [(e.profile_path, e.field, e.message) for e in errs]
        assert keys == sorted(keys), f"errors not sorted for {url!r}: {keys}"


def test_safe_parse_url_never_raises():
    """The exception-safe parser must never raise, even on garbage input."""
    for url in ADVERSARIAL_URLS + [None, 12345, object()]:
        try:
            _safe_parse_url(str(url))  # str() handles non-string params
        except BaseException as exc:  # noqa: BLE001
            pytest.fail(f"_safe_parse_url raised on {url!r}: {type(exc).__name__}: {exc}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
