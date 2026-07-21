"""Shared I/O for Kernux agent profiles.

Loads canonical YAML profiles, resolves the JSON Schema, and provides
deterministic helpers used by both the validator and the matrix generator.
No network access.
"""

from __future__ import annotations

import datetime as _dt
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


class _NoDateSafeLoader(yaml.SafeLoader):
    """YAML loader that does NOT auto-convert ISO date strings into date objects."""


_NoDateSafeLoader.yaml_implicit_resolvers = {
    k: [r for r in v if r[0] != "tag:yaml.org,2002:timestamp"]
    for k, v in yaml.SafeLoader.yaml_implicit_resolvers.items()
}


def _load_yaml(text: str) -> Any:
    return _NoDateSafeLoader(text).get_single_data()


REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "agent-profile.schema.json"
AGENTS_DIR = REPO_ROOT / "agents"

FRESHNESS_WINDOWS_DAYS: dict[int, int] = {1: 30, 2: 90, 3: 180}

# Ratified field-specific freshness classes (FOUNDER_DECISIONS.md).
# Class 1 (30d): cost, retention, versions, models, tiers.
# Class 2 (90d): compatibility, protocols, security, telemetry, opt_out, capabilities.
# Class 3 (180d): identity, openness.
FIELD_FRESHNESS_CLASS: dict[str, int] = {}
for _f in ("pricing_model", "free_tier"):
    FIELD_FRESHNESS_CLASS[f"cost.{_f}"] = 1
FIELD_FRESHNESS_CLASS["privacy.data_retention"] = 1
for _f in ("current_versions", "available_models", "subscription_or_api_tiers"):
    FIELD_FRESHNESS_CLASS[f"model_and_tier.{_f}"] = 1
for _f in (
    "operating_systems",
    "surfaces",
    "supported_providers",
    "local_model_support",
    "ide_integrations",
):
    FIELD_FRESHNESS_CLASS[f"compatibility.{_f}"] = 2
for _f in ("mcp_support", "agent_skills_support", "headless_or_ci"):
    FIELD_FRESHNESS_CLASS[f"protocols.{_f}"] = 2
for _f in ("sandboxing_model", "permission_controls"):
    FIELD_FRESHNESS_CLASS[f"security.{_f}"] = 2
FIELD_FRESHNESS_CLASS["privacy.telemetry_behavior"] = 2
FIELD_FRESHNESS_CLASS["privacy.opt_out"] = 2
for _f in ("repo_scale_context", "session_persistence", "subagent_support"):
    FIELD_FRESHNESS_CLASS[f"capabilities.{_f}"] = 2
for _f in ("vendor_or_maintainer", "official_url", "source_repository"):
    FIELD_FRESHNESS_CLASS[f"identity.{_f}"] = 3
for _f in ("open_source", "license"):
    FIELD_FRESHNESS_CLASS[f"openness.{_f}"] = 3


def load_schema() -> dict[str, Any]:
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


import json  # noqa: E402  (placed after SCHEMA_PATH for readability)


@dataclass(frozen=True)
class ProfileFile:
    path: Path
    data: dict[str, Any]
    agent_id: str

    @property
    def relative_path(self) -> Path:
        return self.path.relative_to(REPO_ROOT)


def discover_profiles() -> list[ProfileFile]:
    profiles: list[ProfileFile] = []
    if not AGENTS_DIR.is_dir():
        return profiles
    for child in sorted(AGENTS_DIR.iterdir()):
        profile_path = child / "profile.yaml"
        if profile_path.is_file():
            data = _load_yaml(profile_path.read_text(encoding="utf-8"))
            if not isinstance(data, dict):
                raise ValueError(f"{profile_path}: top-level YAML is not a mapping")
            agent_id = data.get("id", child.name)
            profiles.append(ProfileFile(path=profile_path, data=data, agent_id=str(agent_id)))
    return profiles


def load_profile_by_id(agent_id: str) -> ProfileFile:
    path = AGENTS_DIR / agent_id / "profile.yaml"
    if not path.is_file():
        raise FileNotFoundError(f"No profile at {path}")
    data = _load_yaml(path.read_text(encoding="utf-8"))
    return ProfileFile(path=path, data=data, agent_id=str(data.get("id", agent_id)))


def parse_iso_date(value: str) -> _dt.date:
    return _dt.date.fromisoformat(value)


def field_is_unknown(field_value: dict[str, Any]) -> bool:
    v = field_value.get("value")
    return v == "unknown"


def field_is_stale(field_value: dict[str, Any], *, evaluation_date: _dt.date) -> bool:
    if field_is_unknown(field_value):
        return False
    verified = field_value.get("verified")
    freshness_class = field_value.get("freshness_class")
    if not verified or freshness_class is None:
        return False
    try:
        verified_date = parse_iso_date(str(verified))
    except ValueError:
        return False
    window = FRESHNESS_WINDOWS_DAYS.get(int(freshness_class))
    if window is None:
        return False
    return (evaluation_date - verified_date).days > window


def iter_factual_fields(profile: dict[str, Any]):
    """Yield (dotted_path, field_value_dict) for every factual field in a profile."""
    field_blocks = {
        "identity": ["vendor_or_maintainer", "official_url", "source_repository"],
        "openness": ["open_source", "license"],
        "compatibility": [
            "operating_systems",
            "surfaces",
            "supported_providers",
            "local_model_support",
            "ide_integrations",
        ],
        "protocols": ["mcp_support", "agent_skills_support", "headless_or_ci"],
        "security": ["sandboxing_model", "permission_controls"],
        "privacy": ["telemetry_behavior", "data_retention", "opt_out"],
        "cost": ["pricing_model", "free_tier"],
        "capabilities": ["repo_scale_context", "session_persistence", "subagent_support"],
        "model_and_tier": [
            "current_versions",
            "available_models",
            "subscription_or_api_tiers",
        ],
    }
    for block_name, field_names in field_blocks.items():
        block = profile.get(block_name)
        if not isinstance(block, dict):
            continue
        for field_name in field_names:
            fv = block.get(field_name)
            if isinstance(fv, dict):
                yield f"{block_name}.{field_name}", fv


# ---------------------------------------------------------------------------
# Complete source set helper (dispute-aware, single source of truth).
# ---------------------------------------------------------------------------


def complete_sources(field_path: str, fv: dict, profile: dict) -> set[str]:
    """Return the complete set of evidence IDs that support a factual field.

    For non-disputed fields: {field.source}.
    For unknown fields: empty set.
    For disputed fields: {field.source} UNION {matching notes.disputes.sources}.
    """
    if field_is_unknown(fv):
        return set()
    primary = fv.get("source")
    if primary in (None, "none"):
        return set()
    sources = {primary}
    cs = fv.get("claim_status")
    if cs == "disputed":
        for dispute in (profile.get("notes", {}) or {}).get("disputes", []) or []:
            if dispute.get("field") == field_path:
                for sid in dispute.get("sources", []) or []:
                    sources.add(sid)
    return sources


# ---------------------------------------------------------------------------
# Derived evidence summaries (mechanical, never authored).
# ---------------------------------------------------------------------------


def derive_evidence_status(profile: dict[str, Any]) -> str:
    """Derive the profile-level evidence status from field-level claim_status values.

    Priority order (from the ratified spec):
    1. no non-unknown factual values -> unknown
    2. all non-unknown fields vendor-reported and no verified -> vendor-reported-only
    3. all factual values verified with no unknown/vendor/disputed -> verified
    4. any mixture, unknown, or dispute -> partial
    """
    statuses: list[str] = []
    for _path, fv in iter_factual_fields(profile):
        v = fv.get("value")
        if v == "unknown":
            statuses.append("unknown")
        else:
            statuses.append(fv.get("claim_status", "unknown"))

    if not statuses:
        return "unknown"

    non_unknown = [s for s in statuses if s != "unknown"]
    if not non_unknown:
        return "unknown"

    has_verified = any(s == "verified" for s in non_unknown)
    has_vendor = any(s == "vendor-reported" for s in non_unknown)
    has_unknown = any(s == "unknown" for s in statuses)
    has_disputed = any(s == "disputed" for s in non_unknown)

    # Rule 3: all verified, no unknown/vendor/disputed.
    if has_verified and not has_vendor and not has_unknown and not has_disputed:
        return "verified"

    # Rule 2: all non-unknown are vendor-reported, no verified.
    if has_vendor and not has_verified and not has_disputed:
        return "vendor-reported-only"

    # Rule 4: catch-all.
    return "partial"


def derive_last_verified(profile: dict[str, Any]) -> str:
    """Return the maximum verification date among sourced non-unknown factual fields,
    or 'unknown' if none exist."""
    dates: list[str] = []
    for _path, fv in iter_factual_fields(profile):
        if field_is_unknown(fv):
            continue
        verified = fv.get("verified")
        if verified and isinstance(verified, str):
            dates.append(verified)
    if not dates:
        return "unknown"
    return max(dates)
