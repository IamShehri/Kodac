"""Phase 1-R2D tests: total generic identity URL validation.

Covers the R2C review findings: generic non-GitHub identity URL validation was
incomplete on both ``identity.source_repository.value`` and
``identity.official_url.value``. R2D makes generic validation total and
exception-safe, separates generic and GitHub messages, and preserves the R2C
GitHub canonical contract.

Every URL-contract test asserts the exact field and a stable message fragment
(``valid public HTTPS URL`` for generic failures, ``canonical GitHub repository
root`` for GitHub canonical failures). Generic ``assert errors`` is prohibited.
Field isolation: when one identity field is mutated, the other stays at a
known-valid value so unrelated evidence/schema errors cannot satisfy an
assertion.
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

GENERIC_FRAGMENT = "valid public HTTPS URL"
GITHUB_FRAGMENT = "canonical GitHub repository root"

SR_FIELD = "identity.source_repository.value"
OU_FIELD = "identity.official_url.value"

# Known-valid values so the OTHER identity field stays independently valid.
VALID_SR = "https://github.com/test-vendor/test-agent"
VALID_OU = "https://test-agent.example.com"


def _run_full(profile):
    return validate_profiles.validate_profile(
        profile,
        schema=profile_io.load_schema(),
        validator_cls=jsonschema.Draft202012Validator,
        evaluation_date=EVAL_DATE,
    )


def _errs_str(errors):
    return "\n".join(e.render() for e in errors)


def _run_field(field_key: str, value: str):
    """Mutate only the named identity field; keep the other at a valid value."""
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["source_repository"]["value"] = VALID_SR
    data["identity"]["official_url"]["value"] = VALID_OU
    data["identity"][field_key]["value"] = value
    return _run_full(make_profile(data))


def _field_errors(errs, field):
    return [e for e in errs if e.field == field]


def _has_generic(errs, field):
    return any(
        e.field == field and GENERIC_FRAGMENT in e.message and GITHUB_FRAGMENT not in e.message
        for e in errs
    )


def _has_github(errs, field):
    return any(e.field == field and GITHUB_FRAGMENT in e.message for e in errs)


# ============================================================================
# A. Mandatory reviewed regressions (both fields)
# ============================================================================


_MANDATORY = [
    "https://gitlab.com:notaport/o/r",
    "https://gitlab.com:99999/o/r",
    "https://gitlab.com:/o/r",
    "https:///o/r",
    "https://gitlab.com/o/r ",  # trailing space
    "https://gitlab.com/o/r\x00",  # NUL
]


@pytest.mark.parametrize(
    "field_key,field", [("source_repository", SR_FIELD), ("official_url", OU_FIELD)]
)
@pytest.mark.parametrize("value", _MANDATORY)
def test_mandatory_generic_regressions(field_key, field, value):
    errs = _run_field(field_key, value)
    assert not _has_github(
        errs, field
    ), f"{field} for {value!r} must NOT get the GitHub message\n{_errs_str(errs)}"
    assert _has_generic(
        errs, field
    ), f"{field} for {value!r}: expected generic 'valid public HTTPS URL' error\n{_errs_str(errs)}"


# ============================================================================
# B. Parser-totality matrix (both fields where applicable); never raises
# ============================================================================


_TOTALITY = [
    ("https://gitlab.com:notaport/o/r", "nonnumeric port"),
    ("https://gitlab.com:65536/o/r", "port 65536"),
    ("https://gitlab.com:999999/o/r", "very large port"),
    ("https://gitlab.com:-1/o/r", "negative port"),
    ("https://gitlab.com:/o/r", "empty port"),
    ("https://gitlab.com:80:443/o/r", "double port"),
    ("https://[::1:2:3/o/r", "invalid IPv6 opening bracket"),
    ("https://[::1/o/r", "invalid IPv6 closing bracket"),
    ("https:///o/r", "missing hostname"),
    ("https://", "bare scheme"),
    ("https://user:pass@gitlab.com/o/r", "credentials"),
    ("", "empty string"),
    ("   ", "whitespace-only"),
    (" https://gitlab.com/o/r", "leading space"),
    ("https://gitlab.com/o/r ", "trailing space"),
    ("https://gitlab.com/o r", "embedded space"),
    ("https://gitlab.com/o/r\n", "newline"),
    ("https://gitlab.com/o/r\r", "carriage return"),
    ("https://gitlab.com/o/r\t", "tab"),
    ("https://gitlab.com/o/r\x00", "NUL"),
    ("https://gitlab.com/o/r\x7f", "DEL"),
    # NOTE: a literal backslash (0x5C) in the PATH is not a C0 control, not
    # whitespace, and not a generic structural failure (urllib treats it as a
    # path character). It is therefore NOT rejected by the generic contract.
    # It IS rejected by the GitHub canonical contract (tested in section F).
]


@pytest.mark.parametrize("value,desc", _TOTALITY)
@pytest.mark.parametrize(
    "field_key,field", [("source_repository", SR_FIELD), ("official_url", OU_FIELD)]
)
def test_parser_totality_never_raises(field_key, field, value, desc):
    try:
        errs = _run_field(field_key, value)
    except BaseException as exc:  # noqa: BLE001 — totality is the point
        pytest.fail(f"{field} {desc}: validator raised {type(exc).__name__}: {exc}")
    assert isinstance(errs, list)
    # These malformed inputs must produce a direct generic error on the field
    # (they are all unambiguously malformed generic URLs). ::1 cases below are
    # handled by the address-class policy and tested separately.
    if "IPv6" not in desc:
        assert _has_generic(
            errs, field
        ), f"{field} {desc}: expected generic direct error\n{_errs_str(errs)}"


def test_non_string_value_does_not_crash():
    """A non-string value reaching this layer must not raise (Section 7.B)."""
    data = copy.deepcopy(minimal_profile_dict())
    data["identity"]["official_url"]["value"] = 12345
    try:
        errs = _run_full(make_profile(data))
    except BaseException as exc:  # noqa: BLE001
        pytest.fail(f"non-string official_url raised {type(exc).__name__}: {exc}")
    assert isinstance(errs, list)


# ============================================================================
# C. Field isolation
# ============================================================================


def test_source_repository_malformed_leaves_official_url_valid():
    """When source_repository is malformed, official_url must remain valid and
    the direct error must be on identity.source_repository.value only."""
    errs = _run_field("source_repository", "https://gitlab.com:notaport/o/r")
    assert _has_generic(errs, SR_FIELD)
    ou_errs = _field_errors(errs, OU_FIELD)
    assert ou_errs == [], f"official_url should be valid; got:\n{_errs_str(ou_errs)}"


def test_official_url_malformed_leaves_source_repository_valid():
    errs = _run_field("official_url", "https://gitlab.com:notaport/o/r")
    assert _has_generic(errs, OU_FIELD)
    sr_errs = _field_errors(errs, SR_FIELD)
    assert sr_errs == [], f"source_repository should be valid; got:\n{_errs_str(sr_errs)}"


# ============================================================================
# D. Generic non-GitHub controls (safe roots must NOT error)
# ============================================================================


@pytest.mark.parametrize(
    "value,desc",
    [
        ("https://gitlab.com/owner/repo", "gitlab root"),
        ("https://codeberg.org/owner/repo", "codeberg root"),
        ("https://example.org/project", "example project"),
        ("https://gitlab.com:8443/owner/repo", "valid non-default port"),
    ],
)
@pytest.mark.parametrize(
    "field_key,field", [("source_repository", SR_FIELD), ("official_url", OU_FIELD)]
)
def test_safe_non_github_roots_pass_generic(field_key, field, value, desc):
    errs = _run_field(field_key, value)
    fe = _field_errors(errs, field)
    assert fe == [], f"{field} safe {desc} should pass; got:\n{_errs_str(fe)}"


# ============================================================================
# E. Security-address regressions (existing disallowed hosts preserved)
# ============================================================================


@pytest.mark.parametrize(
    "value,desc",
    [
        ("https://localhost/o/r", "localhost"),
        ("https://127.0.0.1/o/r", "loopback IPv4"),
        ("https://[::1]/o/r", "loopback IPv6"),
        ("https://10.0.0.1/o/r", "private IPv4"),
        ("https://192.168.1.1/o/r", "private IPv4 (RFC1918)"),
        ("https://[fe80::1]/o/r", "link-local IPv6"),
        ("https://240.0.0.1/o/r", "reserved IPv4"),
    ],
)
@pytest.mark.parametrize(
    "field_key,field", [("source_repository", SR_FIELD), ("official_url", OU_FIELD)]
)
def test_security_addresses_rejected(field_key, field, value, desc):
    errs = _run_field(field_key, value)
    fe = _field_errors(errs, field)
    assert fe, f"{field} {desc} should be rejected\n{_errs_str(errs)}"
    # These get either the generic message or the specific private/local IP
    # message (both are documented policy). Critically, never the GitHub msg.
    assert not _has_github(
        errs, field
    ), f"{field} {desc} must not get the GitHub message\n{_errs_str(fe)}"


# ============================================================================
# F. GitHub regression preservation (R2B/R2C contract unchanged)
# ============================================================================


@pytest.mark.parametrize(
    "value,desc",
    [
        ("https://github.com:notaport/owner/repo", "invalid GitHub port"),
        ("https://github.com/owner/%72epo", "%72 path"),
        ("https://github.com/owner/repo%2Egit", "%2Egit path"),
        ("https://GitHub.com/owner/repo", "GitHub.com host casing"),
        ("https://github.com:443/owner/repo", "explicit port 443"),
        ("https://github.com/owner/repo/", "trailing slash"),
        ("https://github.com/owner/repo.git", ".git suffix"),
        ("https://github.com/owner/repo/extra", "extra path"),
        ("https://github.com/owner/repo?x=1", "query"),
        ("https://github.com/owner/repo#f", "fragment"),
        ("https://user:pass@github.com/owner/repo", "credentials"),
        ("https://github.com/owner/repo%2f", "percent encoding"),
        ("https://github.com/./repo", "dot owner segment"),
        ("https://github.com/owner/repo\\x", "backslash"),
    ],
)
def test_github_canonical_regressions_preserved(value, desc):
    errs = _run_field("source_repository", value)
    assert _has_github(
        errs, SR_FIELD
    ), f"{desc}: expected GitHub canonical error on source_repository\n{_errs_str(errs)}"


def test_canonical_github_url_still_passes():
    errs = _run_field("source_repository", "https://github.com/owner/repo")
    sr_errs = _field_errors(errs, SR_FIELD)
    assert sr_errs == [], f"canonical GitHub URL must pass\n{_errs_str(sr_errs)}"


# ============================================================================
# G. Generic-vs-GitHub message separation
# ============================================================================


def test_malformed_non_github_ipv6_gets_generic_not_github():
    """A malformed non-GitHub IPv6/netloc input must get the generic message,
    never the GitHub canonical message (the R2C mislabel defect)."""
    errs = _run_field("source_repository", "https://[::1:2:3/o/r")
    assert _has_generic(errs, SR_FIELD)
    assert not _has_github(errs, SR_FIELD)


def test_malformed_intended_github_gets_github_message():
    """A malformed intended GitHub repository URL gets the canonical GitHub
    message on identity.source_repository.value (not the generic message)."""
    errs = _run_field("source_repository", "https://github.com:notaport/owner/repo")
    assert _has_github(errs, SR_FIELD)


def test_official_url_uses_generic_even_for_github_host():
    """official_url has no GitHub canonicalization; even a github.com official
    URL must not get the GitHub message (only the generic contract applies)."""
    errs = _run_field("official_url", "https://github.com/owner/repo")
    assert not _has_github(errs, OU_FIELD)
    assert (
        _field_errors(errs, OU_FIELD) == []
    ), f"valid github.com official_url must pass generic; got:\n{_errs_str(errs)}"


def test_official_url_malformed_uses_generic_not_github():
    # ':notaport' is in the AUTHORITY (before the path), so it is a genuine
    # malformed port. official_url must use the generic message, never GitHub.
    errs = _run_field("official_url", "https://example.org:notaport/path")
    assert _has_generic(errs, OU_FIELD)
    assert not _has_github(errs, OU_FIELD)


# ============================================================================
# H. Total-function adversarial test (call twice; identical; stable order)
# ============================================================================


_ADVERSARIAL = [
    "",
    "   ",
    "\n",
    "\t",
    "\x00",
    "\x7f",
    "not a url",
    "://no-scheme",
    "ftp://gitlab.com/o/r",
    "http://gitlab.com/o/r",
    "https://",
    "https://gitlab.com",
    "https://gitlab.com/",
    "https://gitlab.com/o",
    "https://gitlab.com/o/r/",
    "https://gitlab.com:notaport/o/r",
    "https://gitlab.com:99999/o/r",
    "https://gitlab.com:/o/r",
    "https://gitlab.com:65536/o/r",
    "https://gitlab.com:80:443/o/r",
    "https://[::1:2:3/o/r",
    "https://[::1/o/r",
    "https://[::1]/o/r",
    "https://localhost/o/r",
    "https://127.0.0.1/o/r",
    "https://10.0.0.1/o/r",
    "https://192.168.1.1/o/r",
    "https://240.0.0.1/o/r",
    "https://[fe80::1]/o/r",
    "https://user:pass@gitlab.com/o/r",
    "https://gitlab.com/o/r ",
    " https://gitlab.com/o/r",
    "https://gitlab.com/o r",
    "https://gitlab.com/o/r\n",
    "https://gitlab.com/o/r\r",
    "https://gitlab.com/o/r\t",
    "https://gitlab.com/o/r\x00",
    # A literal backslash in the path is NOT a generic structural failure
    # (not C0 control, not whitespace); it is exercised only for non-raising.
    "https://gitlab.com/o/r\\x",
    # Valid generic controls (must NOT error on the field):
    "https://gitlab.com/owner/repo",
    "https://codeberg.org/owner/repo",
    "https://example.org/project",
    "https://gitlab.com:8443/owner/repo",
]


@pytest.mark.parametrize(
    "field_key,field", [("source_repository", SR_FIELD), ("official_url", OU_FIELD)]
)
def test_adversarial_total_and_deterministic(field_key, field):
    for value in _ADVERSARIAL:
        try:
            errs1 = _run_field(field_key, value)
            errs2 = _run_field(field_key, value)
        except BaseException as exc:  # noqa: BLE001
            pytest.fail(f"{field} raised on {value!r}: {type(exc).__name__}: {exc}")
        # Identical rendered output across two calls.
        r1 = [e.render() for e in errs1]
        r2 = [e.render() for e in errs2]
        assert r1 == r2, f"{field} nondeterministic for {value!r}"
        # Stable ordering: sorted by (path, field, message).
        keys = [(e.profile_path, e.field, e.message) for e in errs1]
        assert keys == sorted(keys), f"{field} errors not sorted for {value!r}"
        # Where the input is clearly a malformed generic URL (not a safe root),
        # the field must carry a direct generic error and never the GitHub msg.
        clearly_malformed = value in {
            "",
            "   ",
            "\n",
            "\t",
            "\x00",
            "\x7f",
            "not a url",
            "://no-scheme",
            "ftp://gitlab.com/o/r",
            "http://gitlab.com/o/r",
            "https://",
            "https://gitlab.com:notaport/o/r",
            "https://gitlab.com:99999/o/r",
            "https://gitlab.com:/o/r",
            "https://gitlab.com:65536/o/r",
            "https://gitlab.com:80:443/o/r",
            "https://user:pass@gitlab.com/o/r",
            "https://gitlab.com/o/r ",
            " https://gitlab.com/o/r",
            "https://gitlab.com/o r",
            "https://gitlab.com/o/r\n",
            "https://gitlab.com/o/r\r",
            "https://gitlab.com/o/r\t",
            "https://gitlab.com/o/r\x00",
        }
        if clearly_malformed:
            assert _has_generic(
                errs1, field
            ), f"{field} {value!r}: expected generic direct error\n{_errs_str(errs1)}"
            assert not _has_github(
                errs1, field
            ), f"{field} {value!r}: must not get GitHub message\n{_errs_str(errs1)}"


# ============================================================================
# I. Full regression
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
    data = copy.deepcopy(minimal_profile_dict())
    data["notes"]["disputes"] = [{"field": "test", "sources": ["a", "b"], "note": "x"}]
    dispute_errs = [e for e in _schema_errors(data) if "disputes" in str(e.absolute_path)]
    assert dispute_errs == []


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


def test_dynamic_immutable_rule_remains_enforced():
    data = copy.deepcopy(minimal_profile_dict())
    rec = next(r for r in data["evidence"]["records"] if r["id"] == "src-repo-api")
    rec["immutable"] = True
    errs = _run_full(make_profile(data))
    assert any("immutable: false" in e.message for e in errs), _errs_str(errs)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
