"""Kernux agent-profile validator.

Runs JSON Schema (Draft 2020-12) validation plus a deterministic custom
evidence-policy layer. No network access.

Exit codes:
  0 — all profiles valid.
  1 — one or more profiles invalid, or no profiles found.
"""

from __future__ import annotations

import argparse
import datetime as _dt
import ipaddress
import sys
from dataclasses import dataclass
from typing import Any
from urllib.parse import urlparse

import jsonschema

from tools import compatibility, profile_io
from tools.profile_io import (
    FIELD_FRESHNESS_CLASS,
    ProfileFile,
    iter_factual_fields,
    parse_iso_date,
)

FORBIDDEN_POSITIVE_PHRASES: tuple[str, ...] = (
    "production-ready",
    "production ready",
    "enterprise-ready",
    "enterprise ready",
    "fully secure",
    "fully-safe",
    "hipaa-ready",
    "hipaa-compliant",
    "soc 2 certified",
    "guaranteed",
    "unbreakable",
)

SUPERIORITY_PHRASES: tuple[str, ...] = (
    "best agent",
    "the best",
    "winner",
    "universal winner",
    "superior to all",
    "beats all",
    "#1",
)


@dataclass(frozen=True)
class ValidationError:
    profile_path: str
    field: str
    message: str

    def render(self) -> str:
        return f"{self.profile_path}: {self.field}: {self.message}"


def _today() -> _dt.date:
    return _dt.date.today()


def validate_against_json_schema(
    profile: ProfileFile, schema: dict[str, Any], validator_cls
) -> list[ValidationError]:
    errors: list[ValidationError] = []
    validator = validator_cls(schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER)
    for err in sorted(validator.iter_errors(profile.data), key=lambda e: list(e.absolute_path)):
        field_path = ".".join(str(p) for p in err.absolute_path) or "(root)"
        errors.append(ValidationError(str(profile.relative_path), field_path, err.message))
    return errors


# ---------------------------------------------------------------------------
# Policy checks
# ---------------------------------------------------------------------------


def _check_path_id_match(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    expected_dir = profile.path.parent.name
    if profile.agent_id != expected_dir:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                "id",
                f"profile id {profile.agent_id!r} does not match directory name {expected_dir!r}",
            )
        )
    return errors


def _check_identity_url_fields(profile: ProfileFile) -> list[ValidationError]:
    """Validate identity URL fields for credentials, localhost, and private IPs."""
    errors: list[ValidationError] = []
    ident = profile.data.get("identity", {}) or {}
    for field_name in ("official_url", "source_repository"):
        fv = ident.get(field_name, {}) or {}
        value = fv.get("value")
        if not isinstance(value, str) or value == "unknown":
            continue
        parsed = urlparse(value)
        field = f"identity.{field_name}.value"
        if parsed.username or parsed.password:
            errors.append(
                ValidationError(
                    str(profile.relative_path), field, "URL must not contain embedded credentials"
                )
            )
        host = parsed.hostname or ""
        if host == "localhost":
            errors.append(
                ValidationError(str(profile.relative_path), field, "URL must not target localhost")
            )
        if host:
            try:
                ip = ipaddress.ip_address(host)
                if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                    errors.append(
                        ValidationError(
                            str(profile.relative_path),
                            field,
                            f"URL targets private/local IP {host}",
                        )
                    )
            except ValueError:
                pass
    return errors


def _check_canonical_source_repository(profile: ProfileFile) -> list[ValidationError]:
    """Direct, invariant-specific validation of identity.source_repository.value.

    For GitHub repository URLs, requires the exact canonical root:
    https://github.com/<owner>/<repository>

    Emits a direct error on identity.source_repository.value for any deviation.
    Does NOT rely on downstream evidence-authority failures.
    """
    errors: list[ValidationError] = []
    ident = profile.data.get("identity", {}) or {}
    sr = ident.get("source_repository", {}) or {}
    value = sr.get("value")
    if not isinstance(value, str) or value == "unknown":
        return errors

    field = "identity.source_repository.value"
    parsed = urlparse(value)

    # Only apply canonical GitHub rules to github.com URLs.
    if parsed.hostname is None:
        return errors  # handled by urlField schema
    if parsed.hostname.lower() != "github.com":
        return (
            errors  # non-GitHub: generic HTTPS checks apply (already in _check_identity_url_fields)
        )

    # --- GitHub-specific canonical checks ---
    msg_prefix = (
        "canonical GitHub repository root must be https://github.com/<owner>/<repository>; "
    )

    if parsed.scheme != "https":
        errors.append(
            ValidationError(str(profile.relative_path), field, msg_prefix + "must use HTTPS")
        )
        return errors
    if parsed.port is not None:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                field,
                msg_prefix + f"explicit port {parsed.port} is not allowed",
            )
        )
        return errors
    if parsed.username or parsed.password:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                field,
                msg_prefix + "embedded credentials are not allowed",
            )
        )
        return errors
    if parsed.query:
        errors.append(
            ValidationError(
                str(profile.relative_path), field, msg_prefix + "query strings are not allowed"
            )
        )
        return errors
    if parsed.fragment:
        errors.append(
            ValidationError(
                str(profile.relative_path), field, msg_prefix + "fragments are not allowed"
            )
        )
        return errors

    # Reject backslashes and percent-encoded slashes/backslashes.
    if chr(92) in value:  # backslash
        errors.append(
            ValidationError(
                str(profile.relative_path), field, msg_prefix + "backslashes are not allowed"
            )
        )
        return errors
    if "%2f" in value.lower() or "%2F" in value or "%5c" in value.lower() or "%5C" in value:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                field,
                msg_prefix + "percent-encoded slashes or backslashes are not allowed",
            )
        )
        return errors

    # Check for trailing slash (non-canonical even with 2 segments).
    if parsed.path.endswith("/") and parsed.path != "/":
        errors.append(
            ValidationError(
                str(profile.relative_path), field, msg_prefix + "trailing slash is not allowed"
            )
        )
        return errors

    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) != 2:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                field,
                msg_prefix + f"expected exactly 2 path segments (owner/repo), got {len(parts)}",
            )
        )
        return errors

    owner, repo = parts
    if not owner:
        errors.append(
            ValidationError(str(profile.relative_path), field, msg_prefix + "owner is empty")
        )
        return errors
    if not repo:
        errors.append(
            ValidationError(
                str(profile.relative_path), field, msg_prefix + "repository name is empty"
            )
        )
        return errors
    if repo.endswith(".git"):
        errors.append(
            ValidationError(
                str(profile.relative_path), field, msg_prefix + ".git suffix is not allowed"
            )
        )
        return errors
    if repo in ("blob", "tree", "issues", "pull", "releases"):
        errors.append(
            ValidationError(
                str(profile.relative_path),
                field,
                msg_prefix + f"{repo!r} is a subpath, not a repository name",
            )
        )
        return errors

    return errors


def _check_evidence_ids_unique(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []
    seen: dict[str, int] = {}
    for rec in records:
        rid = rec.get("id")
        if rid is None:
            continue
        seen[rid] = seen.get(rid, 0) + 1
    for rid, count in sorted(seen.items()):
        if count > 1:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"evidence.records.{rid}",
                    f"duplicate evidence id {rid!r} appears {count} times",
                )
            )
    return errors


def _check_evidence_url_validity(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []
    for rec in records:
        rid = rec.get("id", "?")
        url = rec.get("url", "")
        field = f"evidence.records.{rid}.url"
        parsed = urlparse(url)
        if parsed.scheme != "https":
            errors.append(
                ValidationError(
                    str(profile.relative_path), field, f"URL must be HTTPS (got {parsed.scheme!r})"
                )
            )
            continue
        if parsed.username or parsed.password:
            errors.append(
                ValidationError(
                    str(profile.relative_path), field, "URL must not contain embedded credentials"
                )
            )
        host = parsed.hostname or ""
        if not host:
            errors.append(ValidationError(str(profile.relative_path), field, "URL has no host"))
            continue
        if host == "localhost":
            errors.append(
                ValidationError(str(profile.relative_path), field, "URL must not target localhost")
            )
        try:
            ip = ipaddress.ip_address(host)
            if ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved:
                errors.append(
                    ValidationError(
                        str(profile.relative_path), field, f"URL targets private/local IP {host}"
                    )
                )
        except ValueError:
            pass
    return errors


def _derive_official_identities(profile: dict[str, Any]) -> dict[str, str]:
    ids: dict[str, str] = {}
    ident = profile.get("identity", {}) or {}
    ou = ident.get("official_url", {}) or {}
    if isinstance(ou, dict) and ou.get("value") not in (None, "unknown"):
        ids["official_url"] = str(ou.get("value"))
    sr = ident.get("source_repository", {}) or {}
    if isinstance(sr, dict) and sr.get("value") not in (None, "unknown"):
        ids["source_repository"] = str(sr.get("value"))
    return ids


def _github_owner_repo(source_repo_url: str) -> tuple[str, str] | None:
    """Return (owner, repo) only for an exact canonical GitHub repository root.

    Rejects URLs with extra path segments, blob/tree/issues/pull paths,
    query strings, fragments, .git suffix, non-default ports, or HTTP.
    """
    parsed = urlparse(source_repo_url)
    if parsed.scheme != "https":
        return None
    if parsed.netloc != "github.com":
        return None
    if parsed.query or parsed.fragment:
        return None
    if parsed.username or parsed.password:
        return None
    if parsed.port is not None:
        return None
    parts = [p for p in parsed.path.split("/") if p]
    if len(parts) != 2:
        return None
    owner, repo = parts
    if repo.endswith(".git"):
        repo = repo[:-4]
    if not owner or not repo:
        return None
    return owner, repo


def _check_url_authority_consistency(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    ids = _derive_official_identities(profile.data)
    source_repo = ids.get("source_repository")
    official_url = ids.get("official_url")

    official_host: str | None = None
    if official_url:
        official_host = urlparse(official_url).hostname

    canonical_gh: tuple[str, str] | None = None
    if source_repo:
        canonical_gh = _github_owner_repo(source_repo)

    records = profile.data.get("evidence", {}).get("records", []) or []
    for rec in records:
        rid = rec.get("id", "?")
        authority = rec.get("authority", "")
        url = rec.get("url", "")
        parsed = urlparse(url)
        host = parsed.hostname or ""
        path_parts = [p for p in parsed.path.split("/") if p]

        if authority == "official" and official_host:
            if host != official_host and not host.endswith("." + official_host):
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.url",
                        f"authority is {authority!r} but host {host!r} does not match official host {official_host!r}",
                    )
                )

        if authority == "official-docs":
            on_official = official_host is not None and (
                host == official_host or host.endswith("." + official_host)
            )
            on_canonical_repo = False
            if canonical_gh:
                owner, repo = canonical_gh
                if host in ("github.com", "raw.githubusercontent.com") and len(path_parts) >= 2:
                    on_canonical_repo = (
                        path_parts[0].lower() == owner.lower()
                        and path_parts[1].lower() == repo.lower()
                    )
            if not on_official and not on_canonical_repo:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.url",
                        f"authority is {authority!r} but host {host!r} matches neither official host nor canonical repository",
                    )
                )

        if authority in ("official-repo", "official-release") and canonical_gh:
            owner, repo = canonical_gh
            bad = False
            if host == "github.com":
                if (
                    len(path_parts) < 2
                    or path_parts[0].lower() != owner.lower()
                    or path_parts[1].lower() != repo.lower()
                ):
                    bad = True
            elif host == "raw.githubusercontent.com":
                if (
                    len(path_parts) < 2
                    or path_parts[0].lower() != owner.lower()
                    or path_parts[1].lower() != repo.lower()
                ):
                    bad = True
            elif host == "api.github.com":
                if (
                    len(path_parts) < 3
                    or path_parts[0] != "repos"
                    or path_parts[1].lower() != owner.lower()
                    or path_parts[2].lower() != repo.lower()
                ):
                    bad = True
            else:
                bad = True
            if bad:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.url",
                        f"authority is {authority!r} but URL does not match canonical github {owner}/{repo}",
                    )
                )
    return errors


def _is_hex(s: str) -> bool:
    try:
        int(s, 16)
        return True
    except ValueError:
        return False


def _check_raw_github_pinning(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []
    moving_branches = {"main", "master", "dev", "head", "develop"}
    for rec in records:
        rid = rec.get("id", "?")
        url = rec.get("url", "")
        parsed = urlparse(url)
        if parsed.hostname == "raw.githubusercontent.com":
            parts = [p for p in parsed.path.split("/") if p]
            if len(parts) < 3:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.url",
                        "raw.githubusercontent.com URL is too short",
                    )
                )
                continue
            ref = parts[2]
            if len(ref) != 40 or not _is_hex(ref):
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.url",
                        f"raw.githubusercontent.com URL uses moving ref {ref!r}; must use an exact 40-character commit SHA",
                    )
                )
            else:
                rev = rec.get("revision_or_commit")
                if rev != ref:
                    errors.append(
                        ValidationError(
                            str(profile.relative_path),
                            f"evidence.records.{rid}.revision_or_commit",
                            f"must equal the URL commit SHA {ref!r} (got {rev!r})",
                        )
                    )
            # Also check moving-branch override regardless of length.
            if ref.lower() in moving_branches:
                # Already caught above if not 40-hex, but double-check.
                pass
    return errors


def _check_authority_method_compat(profile: ProfileFile) -> list[ValidationError]:
    """Enforce authority -> verification_method compatibility."""
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []
    for rec in records:
        rid = rec.get("id", "?")
        authority = rec.get("authority", "")
        method = rec.get("verification_method", "")
        if not compatibility.method_allowed_for_authority(authority, method):
            allowed = sorted(compatibility.AUTHORITY_METHOD_COMPAT.get(authority, set()))
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"evidence.records.{rid}.verification_method",
                    f"authority {authority!r} is incompatible with verification_method {method!r} (allowed: {allowed})",
                )
            )
    return errors


def _check_claim_method_compat(profile: ProfileFile) -> list[ValidationError]:
    """Enforce claim_status -> verification_method compatibility (via evidence record)."""
    errors: list[ValidationError] = []
    records = {
        rec.get("id"): rec for rec in (profile.data.get("evidence", {}).get("records", []) or [])
    }
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            continue
        cs = fv.get("claim_status")
        source_id = fv.get("source")
        rec = records.get(source_id)
        if not rec:
            continue
        method = rec.get("verification_method")
        if not compatibility.method_allowed_for_claim(cs, method):
            allowed = sorted(compatibility.CLAIM_METHOD_COMPAT.get(cs, set()))
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    f"claim_status {cs!r} is incompatible with verification_method {method!r} (allowed: {allowed})",
                )
            )
    return errors


def _check_field_artifact_verified(profile: ProfileFile) -> list[ValidationError]:
    """Behavioral fields may not be verified via artifact methods."""
    errors: list[ValidationError] = []
    records = {
        rec.get("id"): rec for rec in (profile.data.get("evidence", {}).get("records", []) or [])
    }
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            continue
        cs = fv.get("claim_status")
        source_id = fv.get("source")
        rec = records.get(source_id)
        if not rec:
            continue
        method = rec.get("verification_method")
        if not compatibility.field_allows_artifact_verified(field_path, cs, method):
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    f"field {field_path!r} may not be claim_status {cs!r} via verification_method {method!r}; "
                    "behavioral fields require official-documentation or vendor-marketing",
                )
            )
    return errors


def _check_unknown_handling(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    for field_path, fv in iter_factual_fields(profile.data):
        is_unknown = profile_io.field_is_unknown(fv)
        source = fv.get("source")
        cs = fv.get("claim_status")
        if is_unknown:
            if source != "none":
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        field_path,
                        f"value is 'unknown' but source is {source!r}; must be 'none'",
                    )
                )
            if cs != "unknown":
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        field_path,
                        f"value is 'unknown' but claim_status is {cs!r}; must be 'unknown'",
                    )
                )
        else:
            if source in (None, "none"):
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        field_path,
                        "non-unknown factual field has no evidence source",
                    )
                )
            if cs == "unknown":
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        field_path,
                        "non-unknown factual field has claim_status 'unknown'",
                    )
                )
    return errors


def _check_bidirectional_evidence_mapping(profile: ProfileFile) -> list[ValidationError]:
    """Exact bidirectional evidence mapping — no allow_unused_records.
    Uses complete_sources to account for dispute alternative sources."""
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []

    # Reject allow_unused_records (schema also catches this, but double-check).
    if "allow_unused_records" in (profile.data.get("evidence", {}) or {}):
        errors.append(
            ValidationError(
                str(profile.relative_path),
                "evidence.allow_unused_records",
                "allow_unused_records is not permitted; evidence mapping must be exact",
            )
        )

    evidence_ids = {rec.get("id") for rec in records if rec.get("id")}

    # Build complete source sets for each field (dispute-aware).
    field_to_complete_sources: dict[str, set[str]] = {}
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            continue
        field_to_complete_sources[field_path] = profile_io.complete_sources(
            field_path, fv, profile.data
        )

    declared: dict[str, set[str]] = {}
    for rec in records:
        rid = rec.get("id")
        declared[rid] = set(rec.get("fields_supported", []) or [])

    # Check 1: every source in the complete set resolves and declares the field.
    for field_path, source_set in sorted(field_to_complete_sources.items()):
        for source_id in sorted(source_set):
            if source_id in (None, "none"):
                continue
            if source_id not in evidence_ids:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        field_path,
                        f"source {source_id!r} does not resolve to any evidence record id",
                    )
                )
                continue
            if field_path not in declared.get(source_id, set()):
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        field_path,
                        f"source {source_id!r} does not declare this field in fields_supported",
                    )
                )

    # Check 2: every declared fields_supported entry must point back to a field
    # whose complete source set contains that record.
    all_referenced: set[str] = set()
    for src_set in field_to_complete_sources.values():
        all_referenced |= src_set

    for rec in records:
        rid = rec.get("id")
        for declared_field in sorted(declared.get(rid, set())):
            src_set = field_to_complete_sources.get(declared_field)
            if declared_field not in field_to_complete_sources:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}",
                        f"fields_supported declares {declared_field!r} but no such factual field exists",
                    )
                )
            elif rid not in src_set:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}",
                        f"fields_supported declares {declared_field!r} but that field's complete source set does not include {rid!r}",
                    )
                )
        # Exact mapping: every record must be in at least one complete source set.
        if rid not in all_referenced:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"evidence.records.{rid}",
                    "evidence record is not in any field's complete source set; exact mapping requires no orphans",
                )
            )
    return errors


def _check_secondary_not_sole_source(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    records = {
        rec.get("id"): rec for rec in (profile.data.get("evidence", {}).get("records", []) or [])
    }
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            continue
        source_id = fv.get("source")
        rec = records.get(source_id)
        if rec and rec.get("verification_method") == "secondary-context":
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    "secondary-context evidence may not be the sole source of a factual field",
                )
            )
    return errors


def _check_dispute_contract(profile: ProfileFile) -> list[ValidationError]:
    """Every disputed field must have exactly one matching notes.disputes entry.
    Uses list-based detection to catch duplicate entries."""
    errors: list[ValidationError] = []
    disputes = profile.data.get("notes", {}).get("disputes", []) or []

    # Build field_path -> list of dispute entries (NOT dict — catches duplicates).
    disputes_by_field: dict[str, list] = {}
    for d in disputes:
        f = d.get("field")
        if f:
            disputes_by_field.setdefault(f, []).append(d)

    records = {
        rec.get("id"): rec for rec in (profile.data.get("evidence", {}).get("records", []) or [])
    }

    # Identify disputed fields.
    disputed_fields: set[str] = set()
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            continue
        if fv.get("claim_status") == "disputed":
            disputed_fields.add(field_path)

    # Check: every disputed field has exactly one dispute entry.
    for field_path in sorted(disputed_fields):
        entries = disputes_by_field.get(field_path, [])
        if len(entries) == 0:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    "claim_status is 'disputed' but no matching notes.disputes entry exists",
                )
            )
        elif len(entries) > 1:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"notes.disputes.{field_path}",
                    f"exactly one dispute entry is required per disputed field; found {len(entries)} entries for {field_path!r}",
                )
            )

    # Check: every dispute entry matches a real disputed field.
    all_factual_paths: set[str] = set()
    for field_path, fv in iter_factual_fields(profile.data):
        if not profile_io.field_is_unknown(fv):
            all_factual_paths.add(field_path)

    for field_path, entries in sorted(disputes_by_field.items()):
        if field_path not in disputed_fields:
            if field_path not in all_factual_paths:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"notes.disputes.{field_path}",
                        f"dispute entry exists for {field_path!r} but no such factual field exists",
                    )
                )
            else:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"notes.disputes.{field_path}",
                        f"dispute entry exists for {field_path!r} but that field is not disputed",
                    )
                )
        # Skip detailed validation if we already flagged duplicates or missing.
        if len(entries) != 1:
            continue
        if field_path not in disputed_fields:
            continue

        dispute = entries[0]
        sources = dispute.get("sources", []) or []
        note = dispute.get("note", "")

        if not note or not note.strip():
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"notes.disputes.{field_path}",
                    "dispute entry must contain a non-empty neutral note",
                )
            )

        if len(sources) < 2:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"notes.disputes.{field_path}",
                    f"dispute entry must contain at least two unique evidence IDs (got {len(sources)})",
                )
            )
        if len(set(sources)) != len(sources):
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"notes.disputes.{field_path}",
                    "dispute entry contains duplicate source IDs",
                )
            )

        primary_source = None
        for fp, fv in iter_factual_fields(profile.data):
            if fp == field_path and not profile_io.field_is_unknown(fv):
                primary_source = fv.get("source")
                break
        if primary_source and primary_source not in sources:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"notes.disputes.{field_path}",
                    f"dispute sources must include the field's primary source {primary_source!r}",
                )
            )

        for sid in sorted(set(sources)):
            rec = records.get(sid)
            if not rec:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"notes.disputes.{field_path}",
                        f"dispute source {sid!r} does not resolve to any evidence record",
                    )
                )
            elif field_path not in (rec.get("fields_supported") or []):
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"notes.disputes.{field_path}",
                        f"dispute source {sid!r} does not declare {field_path!r} in fields_supported",
                    )
                )
            elif rec.get("verification_method") == "secondary-context":
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"notes.disputes.{field_path}",
                        f"dispute source {sid!r} uses secondary-context; disputes must use acceptable primary sources",
                    )
                )
    return errors


def _classify_source_stability(url: str) -> str:
    """Classify a URL as 'immutable', 'dynamic', or 'invalid'.

    Conservative: defaults to 'dynamic' for unrecognized patterns.
    Only commit-pinned raw.githubusercontent.com is 'immutable'.
    """
    parsed = urlparse(url)
    host = parsed.hostname or ""
    path_parts = [p for p in parsed.path.split("/") if p]

    # Commit-pinned raw GitHub content.
    if host == "raw.githubusercontent.com":
        if len(path_parts) >= 3:
            ref = path_parts[2]
            if len(ref) == 40 and _is_hex(ref):
                return "immutable"
        return "dynamic"  # moving branch or unrecognized ref

    # GitHub API endpoints — always dynamic JSON.
    if host == "api.github.com":
        return "dynamic"

    # GitHub web blob/tree URLs — dynamic (moving refs), not artifact sources.
    if host == "github.com" and len(path_parts) >= 3:
        if path_parts[2] in ("blob", "tree"):
            return "dynamic"

    # All other HTTPS URLs default to dynamic.
    return "dynamic"


def _check_immutability_contract(profile: ProfileFile) -> list[ValidationError]:
    """Centralized conservative immutability classifier."""
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []
    moving_branches = {"main", "master", "dev", "head", "develop", "release"}

    for rec in records:
        rid = rec.get("id", "?")
        url = rec.get("url", "")
        immutable = rec.get("immutable")
        parsed = urlparse(url)
        host = parsed.hostname or ""
        path_parts = [p for p in parsed.path.split("/") if p]

        stability = _classify_source_stability(url)

        # Immutable URL must have immutable: true.
        if stability == "immutable" and immutable is not True:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"evidence.records.{rid}.immutable",
                    "commit-pinned raw.githubusercontent.com URL must have immutable: true",
                )
            )

        # Dynamic URL must have immutable: false.
        if stability == "dynamic" and immutable is True:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"evidence.records.{rid}.immutable",
                    f"dynamic URL must have immutable: false (classified dynamic: {host})",
                )
            )

        # Reject github.com blob/tree URLs as evidence sources entirely.
        if host == "github.com" and len(path_parts) >= 3 and path_parts[2] in ("blob", "tree"):
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"evidence.records.{rid}.url",
                    f"github.com/{path_parts[2]}/ URLs are not accepted as repository artifacts; "
                    "use commit-pinned raw.githubusercontent.com content instead",
                )
            )

        # /releases/latest cannot support current_versions.
        if host == "api.github.com" and "/releases/latest" in url:
            fields = rec.get("fields_supported", []) or []
            if "model_and_tier.current_versions" in fields:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.url",
                        "/releases/latest cannot support current_versions; use /releases/tags/<exact-tag>",
                    )
                )

        # Moving-branch raw GitHub URLs rejected by _check_raw_github_pinning,
        # but also flag here if immutable:true was attempted.
        if host == "raw.githubusercontent.com" and len(path_parts) >= 3:
            ref = path_parts[2]
            if ref.lower() in moving_branches and immutable is True:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.immutable",
                        f"moving-branch raw GitHub URL ({ref!r}) must not be immutable: true",
                    )
                )

        # Moving-branch github.com blob URLs with moving ref.
        if host == "github.com" and len(path_parts) >= 4 and path_parts[2] in ("blob", "tree"):
            ref = path_parts[3]
            if ref.lower() in moving_branches and immutable is True:
                errors.append(
                    ValidationError(
                        str(profile.relative_path),
                        f"evidence.records.{rid}.immutable",
                        f"moving-branch github.com URL ({ref!r}) must not be immutable: true",
                    )
                )
    return errors


def _check_iso_and_future_dates(
    profile: ProfileFile, *, evaluation_date: _dt.date
) -> list[ValidationError]:
    errors: list[ValidationError] = []

    def _check_one(field_path: str, value: Any) -> None:
        if value is None:
            return
        try:
            d = parse_iso_date(str(value))
        except (ValueError, TypeError):
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    f"date {value!r} is not valid ISO 8601 (YYYY-MM-DD)",
                )
            )
            return
        if d > evaluation_date:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    f"date {value!r} is in the future relative to evaluation date {evaluation_date.isoformat()}",
                )
            )

    for field_path, fv in iter_factual_fields(profile.data):
        _check_one(f"{field_path}.verified", fv.get("verified"))
    for rec in profile.data.get("evidence", {}).get("records", []) or []:
        rid = rec.get("id", "?")
        _check_one(f"evidence.records.{rid}.date_accessed", rec.get("date_accessed"))
    _check_one("updated", profile.data.get("updated"))
    for change in profile.data.get("notes", {}).get("changes", []) or []:
        _check_one("notes.changes.date", change.get("date"))
    return errors


def _check_field_specific_freshness(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    for field_path, fv in iter_factual_fields(profile.data):
        expected_class = FIELD_FRESHNESS_CLASS.get(field_path)
        if expected_class is None:
            continue
        actual = fv.get("freshness_class")
        if actual != expected_class:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    f"{field_path}.freshness_class",
                    f"freshness_class must be {expected_class} for {field_path} (got {actual!r})",
                )
            )
    return errors


def _scan_value_for_phrases(value: Any, phrases: tuple[str, ...]) -> list[str]:
    hits: list[str] = []
    if isinstance(value, str):
        for phrase in phrases:
            if phrase in value.lower():
                hits.append(phrase)
    elif isinstance(value, list):
        for item in value:
            if isinstance(item, str):
                for phrase in phrases:
                    if phrase in item.lower():
                        hits.append(phrase)
    return hits


def _check_unsupported_phrases(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    for field_path, fv in iter_factual_fields(profile.data):
        for phrase in _scan_value_for_phrases(fv.get("value"), FORBIDDEN_POSITIVE_PHRASES):
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    f"forbidden positive-claim phrase {phrase!r}",
                )
            )
    summary = str(profile.data.get("notes", {}).get("summary", ""))
    for phrase in FORBIDDEN_POSITIVE_PHRASES:
        if phrase in summary.lower():
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    "notes.summary",
                    f"forbidden positive-claim phrase {phrase!r}",
                )
            )
    return errors


def _check_superiority_language(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    for field_path, fv in iter_factual_fields(profile.data):
        for phrase in _scan_value_for_phrases(fv.get("value"), SUPERIORITY_PHRASES):
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    field_path,
                    f"universal-superiority phrase {phrase!r}",
                )
            )
    summary = str(profile.data.get("notes", {}).get("summary", ""))
    for phrase in SUPERIORITY_PHRASES:
        if phrase in summary.lower():
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    "notes.summary",
                    f"universal-superiority phrase {phrase!r}",
                )
            )
    return errors


def _check_no_overall_score(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    forbidden_keys = ("overall_score", "kernux_score", "score", "rating", "grade", "rank")
    for key in forbidden_keys:
        if key in profile.data:
            errors.append(
                ValidationError(
                    str(profile.relative_path),
                    key,
                    "overall score / ranking field is forbidden by the no-overall-score policy",
                )
            )
    return errors


def _check_schema_version(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    sv = profile.data.get("schema_version")
    if sv != 1:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                "schema_version",
                f"unsupported schema_version {sv!r}; only 1 is supported",
            )
        )
    return errors


def _check_no_authored_evidence_summaries(profile: ProfileFile) -> list[ValidationError]:
    errors: list[ValidationError] = []
    evidence = profile.data.get("evidence", {}) or {}
    if "evidence_status" in evidence:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                "evidence.evidence_status",
                "must not be authored; it is derived by tooling",
            )
        )
    if "last_verified" in evidence:
        errors.append(
            ValidationError(
                str(profile.relative_path),
                "evidence.last_verified",
                "must not be authored; it is derived by tooling",
            )
        )
    return errors


def _check_duplicate_agent_ids(profiles: list[ProfileFile]) -> list[ValidationError]:
    errors: list[ValidationError] = []
    seen: dict[str, list[ProfileFile]] = {}
    for p in profiles:
        seen.setdefault(p.agent_id, []).append(p)
    for aid in sorted(seen):
        group = seen[aid]
        if len(group) > 1:
            for p in group:
                errors.append(
                    ValidationError(
                        str(p.relative_path),
                        "id",
                        f"duplicate agent id {aid!r} appears in {len(group)} profiles",
                    )
                )
    return errors


# ---------------------------------------------------------------------------
# Orchestration
# ---------------------------------------------------------------------------


def validate_profile(
    profile: ProfileFile,
    *,
    schema: dict[str, Any],
    validator_cls,
    evaluation_date: _dt.date,
) -> list[ValidationError]:
    errors: list[ValidationError] = []
    errors += validate_against_json_schema(profile, schema, validator_cls)
    errors += _check_schema_version(profile)
    errors += _check_path_id_match(profile)
    errors += _check_identity_url_fields(profile)
    errors += _check_canonical_source_repository(profile)
    errors += _check_evidence_ids_unique(profile)
    errors += _check_evidence_url_validity(profile)
    errors += _check_url_authority_consistency(profile)
    errors += _check_raw_github_pinning(profile)
    errors += _check_authority_method_compat(profile)
    errors += _check_claim_method_compat(profile)
    errors += _check_field_artifact_verified(profile)
    errors += _check_unknown_handling(profile)
    errors += _check_bidirectional_evidence_mapping(profile)
    errors += _check_secondary_not_sole_source(profile)
    errors += _check_dispute_contract(profile)
    errors += _check_immutability_contract(profile)
    errors += _check_iso_and_future_dates(profile, evaluation_date=evaluation_date)
    errors += _check_field_specific_freshness(profile)
    errors += _check_unsupported_phrases(profile)
    errors += _check_superiority_language(profile)
    errors += _check_no_overall_score(profile)
    errors += _check_no_authored_evidence_summaries(profile)
    # Deterministic ordering: sort by (profile_path, field, message).
    errors.sort(key=lambda e: (e.profile_path, e.field, e.message))
    return errors


def validate_all(
    *,
    evaluation_date: _dt.date | None = None,
    profiles: list[ProfileFile] | None = None,
    schema: dict[str, Any] | None = None,
) -> list[ValidationError]:
    if evaluation_date is None:
        evaluation_date = _today()
    if profiles is None:
        profiles = profile_io.discover_profiles()
    if schema is None:
        schema = profile_io.load_schema()
    validator_cls = jsonschema.Draft202012Validator

    errors: list[ValidationError] = []
    if not profiles:
        errors.append(
            ValidationError("(none)", "(root)", "no agent profiles discovered under agents/")
        )
        return errors

    errors += _check_duplicate_agent_ids(profiles)
    for p in profiles:
        errors += validate_profile(
            p, schema=schema, validator_cls=validator_cls, evaluation_date=evaluation_date
        )
    errors.sort(key=lambda e: (e.profile_path, e.field, e.message))
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="tools.validate_profiles",
        description="Validate Kernux agent profiles against the JSON Schema and evidence policy.",
    )
    parser.add_argument("--evaluation-date", type=str, default=None)
    parser.add_argument("--quiet", action="store_true")
    args = parser.parse_args(argv)

    evaluation_date = parse_iso_date(args.evaluation_date) if args.evaluation_date else _today()
    profiles = profile_io.discover_profiles()
    errors = validate_all(evaluation_date=evaluation_date, profiles=profiles)

    if errors:
        for err in errors:
            print(f"FAIL  {err.render()}", file=sys.stderr)
        print(
            f"\n{len(errors)} validation error(s) across {len(profiles)} profile(s).",
            file=sys.stderr,
        )
        return 1

    if not args.quiet:
        for p in profiles:
            derived_status = profile_io.derive_evidence_status(p.data)
            derived_last = profile_io.derive_last_verified(p.data)
            print(
                f"OK    {p.relative_path}  (evidence_status={derived_status}, last_verified={derived_last})"
            )
        print(f"\n{len(profiles)} profile(s) valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
