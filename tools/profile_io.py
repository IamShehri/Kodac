"""Shared I/O for Kernux agent profiles.

Loads canonical YAML profiles, resolves the JSON Schema, and provides
deterministic helpers used by both the validator and the matrix generator.
No network access.
"""

from __future__ import annotations

import datetime as _dt
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


class _NoDateSafeLoader(yaml.SafeLoader):
    """YAML loader that does NOT auto-convert ISO date strings into date objects.

    Profile dates are canonical strings (YYYY-MM-DD); they must remain strings
    so JSON Schema's `format: date` and our custom checks see them as strings.
    """


# No date/time constructors registered -> dates stay as raw strings.
_NoDateSafeLoader.yaml_implicit_resolvers = {
    k: [r for r in v if r[0] != "tag:yaml.org,2002:timestamp"]
    for k, v in yaml.SafeLoader.yaml_implicit_resolvers.items()
}


def _load_yaml(text: str) -> Any:
    return _NoDateSafeLoader(text).get_single_data()


REPO_ROOT = Path(__file__).resolve().parent.parent
SCHEMA_PATH = REPO_ROOT / "schema" / "agent-profile.schema.json"
AGENTS_DIR = REPO_ROOT / "agents"

# Freshness windows in days, per ratified policy (FOUNDER_DECISIONS.md).
FRESHNESS_WINDOWS_DAYS: dict[int, int] = {1: 30, 2: 90, 3: 180}


def load_schema() -> dict[str, Any]:
    """Load the agent-profile JSON Schema from disk."""
    return json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))


@dataclass(frozen=True)
class ProfileFile:
    """A loaded profile and its on-disk context."""

    path: Path
    data: dict[str, Any]
    agent_id: str

    @property
    def relative_path(self) -> Path:
        return self.path.relative_to(REPO_ROOT)


def discover_profiles() -> list[ProfileFile]:
    """Discover all agents/<id>/profile.yaml files, sorted by agent id."""
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
    """Load a single profile by agent id."""
    path = AGENTS_DIR / agent_id / "profile.yaml"
    if not path.is_file():
        raise FileNotFoundError(f"No profile at {path}")
    data = _load_yaml(path.read_text(encoding="utf-8"))
    return ProfileFile(path=path, data=data, agent_id=str(data.get("id", agent_id)))


def parse_iso_date(value: str) -> _dt.date:
    """Parse an ISO 8601 date (YYYY-MM-DD). Raises ValueError on invalid input."""
    return _dt.date.fromisoformat(value)


def field_is_unknown(field_value: dict[str, Any]) -> bool:
    """True if a field's value is the explicit unknown state."""
    v = field_value.get("value")
    return v == "unknown"


def field_is_stale(field_value: dict[str, Any], *, evaluation_date: _dt.date) -> bool:
    """True if a previously-verified field is past its freshness window.

    A field with value 'unknown' is NOT stale (unknown and stale are distinct).
    """
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
    """Yield (dotted_path, field_value_dict) for every factual field in a profile.

    Walks the known object-valued blocks and their declared field properties.
    """
    field_blocks = {
        "identity": [
            "vendor_or_maintainer",
            "official_url",
            "source_repository",
        ],
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
