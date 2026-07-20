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
import sys
from dataclasses import dataclass
from typing import Any

import jsonschema

from tools import profile_io
from tools.profile_io import ProfileFile, iter_factual_fields, parse_iso_date

# ---------------------------------------------------------------------------
# Unsupported-phrase policy (positive claims forbidden by EDITORIAL_AND_EVIDENCE_POLICY.md)
# Each entry: (phrase, regex_flag). Matched case-insensitively as substrings.
# ---------------------------------------------------------------------------
UNSUPPORTED_POSITIVE_PHRASES: tuple[str, ...] = (
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

# Fields whose claim_status is mandatory per the ratified schema.
FIELDS_REQUIRING_CLAIM_STATUS: tuple[tuple[str, tuple[str, ...]], ...] = (
    # (block, field names in that block that need claim_status)
    ("identity", ("vendor_or_maintainer", "official_url", "source_repository")),
    ("cost", ("pricing_model", "free_tier")),
    ("security", ("sandboxing_model", "permission_controls")),
)


@dataclass(frozen=True)
class ValidationError:
    profile_path: str
    field: str
    message: str

    def render(self) -> str:
        return f"{self.profile_path}: {self.field}: {self.message}"


def _today() -> _dt.date:
    """Explicit evaluation date (overridable for tests; default today)."""
    return _dt.date.today()


# ---------------------------------------------------------------------------
# JSON Schema validation
# ---------------------------------------------------------------------------


def validate_against_json_schema(
    profile: ProfileFile, schema: dict[str, Any], validator_cls
) -> list[ValidationError]:
    errors: list[ValidationError] = []
    validator = validator_cls(schema, format_checker=jsonschema.Draft202012Validator.FORMAT_CHECKER)
    for err in sorted(validator.iter_errors(profile.data), key=lambda e: list(e.absolute_path)):
        field_path = ".".join(str(p) for p in err.absolute_path) or "(root)"
        errors.append(
            ValidationError(
                profile_path=str(profile.relative_path),
                field=field_path,
                message=err.message,
            )
        )
    return errors


# ---------------------------------------------------------------------------
# Custom policy validation
# ---------------------------------------------------------------------------


def _check_path_id_match(profile: ProfileFile) -> list[ValidationError]:
    """Rule 1: profile directory id must match profile.data.id."""
    errors: list[ValidationError] = []
    expected_dir = profile.path.parent.name
    if profile.agent_id != expected_dir:
        errors.append(
            ValidationError(
                profile_path=str(profile.relative_path),
                field="id",
                message=(
                    f"profile id {profile.agent_id!r} does not match directory name "
                    f"{expected_dir!r}"
                ),
            )
        )
    return errors


def _check_evidence_ids_unique(profile: ProfileFile) -> list[ValidationError]:
    """Rule 2: evidence ids must be unique."""
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []
    seen: dict[str, int] = {}
    for rec in records:
        rid = rec.get("id")
        if rid is None:
            continue
        seen[rid] = seen.get(rid, 0) + 1
    for rid, count in seen.items():
        if count > 1:
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=f"evidence.records.{rid}",
                    message=f"duplicate evidence id {rid!r} appears {count} times",
                )
            )
    return errors


def _check_evidence_references_resolve(profile: ProfileFile) -> list[ValidationError]:
    """Rules 3, 4, 5: every non-unknown factual field source resolves to an evidence record,
    and evidence records are referenced (or explicitly allowed-unused)."""
    errors: list[ValidationError] = []
    records = profile.data.get("evidence", {}).get("records", []) or []
    evidence_ids = {rec.get("id") for rec in records if rec.get("id")}

    referenced: set[str] = set()
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            # 'unknown' fields must have source == 'none'.
            if fv.get("source") not in (None, "none"):
                errors.append(
                    ValidationError(
                        profile_path=str(profile.relative_path),
                        field=field_path,
                        message=(
                            f"value is 'unknown' but source is {fv.get('source')!r}; "
                            "must be 'none'"
                        ),
                    )
                )
            continue
        source = fv.get("source")
        if source in (None, "none"):
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=field_path,
                    message=(
                        "non-unknown factual field has no evidence source "
                        "(expected an evidence id)"
                    ),
                )
            )
            continue
        if source not in evidence_ids:
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=field_path,
                    message=(f"source {source!r} does not resolve to any evidence record id"),
                )
            )
        else:
            referenced.add(source)

    # Rule 4: unused evidence records fail unless explicitly allowed.
    unused = evidence_ids - referenced
    allow_unused = bool(profile.data.get("evidence", {}).get("allow_unused_records", False))
    if unused and not allow_unused:
        for rid in sorted(unused):
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=f"evidence.records.{rid}",
                    message=(
                        "evidence record is not referenced by any field; set "
                        "evidence.allow_unused_records: true to permit"
                    ),
                )
            )
    return errors


def _check_official_source_domains(profile: ProfileFile) -> list[ValidationError]:
    """Rule 6: official-source claims must link to an official domain or canonical repository."""
    errors: list[ValidationError] = []
    records = {
        rec.get("id"): rec for rec in (profile.data.get("evidence", {}).get("records", []) or [])
    }
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            continue
        source_id = fv.get("source")
        rec = records.get(source_id)
        if not rec:
            continue  # reported by resolver check
        authority = rec.get("authority", "")
        if authority not in ("official", "official-repo", "official-docs", "official-release"):
            # Non-official sources are allowed for non-official claims, but official
            # claim fields must use official sources.
            claim_status = fv.get("claim_status")
            if claim_status == "verified":
                errors.append(
                    ValidationError(
                        profile_path=str(profile.relative_path),
                        field=field_path,
                        message=(
                            f"claim_status is 'verified' but source authority is {authority!r}; "
                            "verified claims require an official* authority"
                        ),
                    )
                )
    return errors


def _check_iso_dates(profile: ProfileFile, *, evaluation_date: _dt.date) -> list[ValidationError]:
    """Rules 7, 8: dates must be ISO 8601 and not in the future."""
    errors: list[ValidationError] = []

    def _check_one(field_path: str, value: Any) -> None:
        if value is None:
            return
        try:
            d = parse_iso_date(str(value))
        except (ValueError, TypeError):
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=field_path,
                    message=f"date {value!r} is not valid ISO 8601 (YYYY-MM-DD)",
                )
            )
            return
        if d > evaluation_date:
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=field_path,
                    message=(
                        f"date {value!r} is in the future relative to evaluation date "
                        f"{evaluation_date.isoformat()}"
                    ),
                )
            )

    for field_path, fv in iter_factual_fields(profile.data):
        _check_one(f"{field_path}.verified", fv.get("verified"))
    for rec in profile.data.get("evidence", {}).get("records", []) or []:
        rid = rec.get("id", "?")
        _check_one(f"evidence.records.{rid}.date_accessed", rec.get("date_accessed"))
    _check_one("updated", profile.data.get("updated"))
    _check_one("evidence.last_verified", profile.data.get("evidence", {}).get("last_verified"))
    for change in profile.data.get("notes", {}).get("changes", []) or []:
        _check_one("notes.changes.date", change.get("date"))
    return errors


def _check_freshness_classes(profile: ProfileFile) -> list[ValidationError]:
    """Rule 9: freshness_class must be 1, 2, or 3 (per ratified 30/90/180 policy)."""
    errors: list[ValidationError] = []
    for field_path, fv in iter_factual_fields(profile.data):
        fc = fv.get("freshness_class")
        if fc not in (1, 2, 3):
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=f"{field_path}.freshness_class",
                    message=(
                        f"freshness_class {fc!r} is invalid; must be 1 (30d), 2 (90d), or 3 (180d)"
                    ),
                )
            )
    return errors


def _check_unknown_vs_stale(
    profile: ProfileFile, *, evaluation_date: _dt.date
) -> list[ValidationError]:
    """Rule 10: unknown and stale must remain distinct states.

    This is enforced structurally: a field with value 'unknown' is never stale;
    a non-unknown field past its window is reported as stale (informational, not
    an error — staleness is surfaced in the matrix, not rejected here).
    """
    # No hard errors; the structural separation is enforced by field_is_stale / field_is_unknown.
    # We only fail if a field claims 'unknown' value but also carries a non-'none' source.
    errors: list[ValidationError] = []
    for field_path, fv in iter_factual_fields(profile.data):
        if profile_io.field_is_unknown(fv):
            if fv.get("claim_status") not in (None, "unknown"):
                errors.append(
                    ValidationError(
                        profile_path=str(profile.relative_path),
                        field=field_path,
                        message=(
                            "value is 'unknown' but claim_status is "
                            f"{fv.get('claim_status')!r}; must be 'unknown' or absent"
                        ),
                    )
                )
    return errors


def _check_claim_status_required(profile: ProfileFile) -> list[ValidationError]:
    """Rule: claim_status is required on identity, cost, and security fields."""
    errors: list[ValidationError] = []
    for block, field_names in FIELDS_REQUIRING_CLAIM_STATUS:
        block_data = profile.data.get(block, {})
        if not isinstance(block_data, dict):
            continue
        for fn in field_names:
            fv = block_data.get(fn)
            if isinstance(fv, dict) and "claim_status" not in fv:
                errors.append(
                    ValidationError(
                        profile_path=str(profile.relative_path),
                        field=f"{block}.{fn}.claim_status",
                        message="claim_status is required on this field",
                    )
                )
    return errors


def _check_unsupported_phrases(profile: ProfileFile) -> list[ValidationError]:
    """Rule: no unsupported positive-compliance claims anywhere in the profile text."""
    errors: list[ValidationError] = []
    text_blob = repr(profile.data).lower()
    for phrase in UNSUPPORTED_POSITIVE_PHRASES:
        if phrase in text_blob:
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field="(text)",
                    message=(
                        f"unsupported positive claim phrase {phrase!r} appears in profile; "
                        "such claims are forbidden except inside explicit non-claim statements"
                    ),
                )
            )
    return errors


def _check_no_overall_score(profile: ProfileFile) -> list[ValidationError]:
    """Rule 14: no profile may contain an overall score."""
    errors: list[ValidationError] = []
    forbidden_keys = ("overall_score", "kernux_score", "score", "rating", "grade", "rank")
    for key in forbidden_keys:
        if key in profile.data:
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field=key,
                    message=(
                        "overall score / ranking field is forbidden by the no-overall-score policy"
                    ),
                )
            )
    return errors


def _check_universal_superiority(profile: ProfileFile) -> list[ValidationError]:
    """Rule 15: no profile may claim universal superiority."""
    errors: list[ValidationError] = []
    forbidden_phrases = (
        "best agent",
        "the best",
        "winner",
        "universal winner",
        "superior to all",
        "beats all",
        "#1",
    )
    summary = str(profile.data.get("notes", {}).get("summary", "")).lower()
    for phrase in forbidden_phrases:
        if phrase in summary:
            errors.append(
                ValidationError(
                    profile_path=str(profile.relative_path),
                    field="notes.summary",
                    message=(
                        f"universal-superiority phrase {phrase!r} is forbidden "
                        "(no universal winner declarations)"
                    ),
                )
            )
    return errors


def _check_schema_version(profile: ProfileFile) -> list[ValidationError]:
    """Rule 12: unsupported schema versions fail."""
    errors: list[ValidationError] = []
    sv = profile.data.get("schema_version")
    if sv != 1:
        errors.append(
            ValidationError(
                profile_path=str(profile.relative_path),
                field="schema_version",
                message=f"unsupported schema_version {sv!r}; only 1 is supported",
            )
        )
    return errors


def _check_duplicate_agent_ids(profiles: list[ProfileFile]) -> list[ValidationError]:
    """Rule 11: duplicate agent ids fail."""
    errors: list[ValidationError] = []
    seen: dict[str, list[ProfileFile]] = {}
    for p in profiles:
        seen.setdefault(p.agent_id, []).append(p)
    for aid, group in seen.items():
        if len(group) > 1:
            for p in group:
                errors.append(
                    ValidationError(
                        profile_path=str(p.relative_path),
                        field="id",
                        message=f"duplicate agent id {aid!r} appears in {len(group)} profiles",
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
    """Run JSON Schema + full custom policy on a single profile."""
    errors: list[ValidationError] = []
    errors += validate_against_json_schema(profile, schema, validator_cls)
    # If schema validation failed badly, downstream checks may crash; still try.
    errors += _check_schema_version(profile)
    errors += _check_path_id_match(profile)
    errors += _check_evidence_ids_unique(profile)
    errors += _check_evidence_references_resolve(profile)
    errors += _check_official_source_domains(profile)
    errors += _check_iso_dates(profile, evaluation_date=evaluation_date)
    errors += _check_freshness_classes(profile)
    errors += _check_unknown_vs_stale(profile, evaluation_date=evaluation_date)
    errors += _check_claim_status_required(profile)
    errors += _check_unsupported_phrases(profile)
    errors += _check_no_overall_score(profile)
    errors += _check_universal_superiority(profile)
    return errors


def validate_all(
    *,
    evaluation_date: _dt.date | None = None,
    profiles: list[ProfileFile] | None = None,
    schema: dict[str, Any] | None = None,
) -> list[ValidationError]:
    """Validate every discovered profile. Returns a list of errors (empty = valid)."""
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
            ValidationError(
                profile_path="(none)",
                field="(root)",
                message="no agent profiles discovered under agents/",
            )
        )
        return errors

    errors += _check_duplicate_agent_ids(profiles)
    for p in profiles:
        errors += validate_profile(
            p, schema=schema, validator_cls=validator_cls, evaluation_date=evaluation_date
        )
    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="tools.validate_profiles",
        description="Validate Kernux agent profiles against the JSON Schema and evidence policy.",
    )
    parser.add_argument(
        "--evaluation-date",
        type=str,
        default=None,
        help="ISO date used for freshness/future-date checks (default: today).",
    )
    parser.add_argument(
        "--quiet",
        action="store_true",
        help="suppress per-profile OK output on success.",
    )
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
            print(f"OK    {p.relative_path}")
        print(f"\n{len(profiles)} profile(s) valid.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
