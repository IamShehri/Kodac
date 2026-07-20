"""Shared test fixtures: minimal valid profile factory + in-memory ProfileFile helper."""

from __future__ import annotations

import copy
import datetime as _dt
from pathlib import Path
from typing import Any

from tools.profile_io import REPO_ROOT, ProfileFile

EVAL_DATE = _dt.date(2026, 7, 21)


def minimal_profile_dict(agent_id: str = "opencode") -> dict[str, Any]:
    """Return a deep-copyable, valid profile as a dict."""
    return {
        "schema_version": 1,
        "id": agent_id,
        "name": "Test Agent",
        "updated": "2026-07-21",
        "submission": "community-submitted",
        "tracks": ["terminal-agents"],
        "identity": {
            "vendor_or_maintainer": {
                "value": "Test Vendor",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
            "official_url": {
                "value": "https://example.com",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
            "source_repository": {
                "value": "https://example.com/repo",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
        },
        "openness": {
            "open_source": {
                "value": "supported",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
            "license": {
                "value": "MIT",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
        },
        "compatibility": {
            "operating_systems": {
                "value": ["Linux"],
                "source": "src1",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
            "surfaces": {
                "value": ["terminal"],
                "source": "src1",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
            "supported_providers": {
                "value": ["Anthropic"],
                "source": "src1",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
            "local_model_support": {
                "value": "supported",
                "source": "src1",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
        },
        "protocols": {
            "mcp_support": {
                "value": "supported",
                "source": "src1",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
            "agent_skills_support": {
                "value": "unknown",
                "source": "none",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
            "headless_or_ci": {
                "value": "unknown",
                "source": "none",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
        },
        "security": {
            "sandboxing_model": {
                "value": "Permission system; no OS sandbox documented.",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 2,
            },
            "permission_controls": {
                "value": "Per-tool allow/ask/deny.",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 2,
            },
        },
        "privacy": {
            "telemetry_behavior": {
                "value": "unknown",
                "source": "none",
                "verified": "2026-07-21",
                "freshness_class": 2,
            },
            "data_retention": {
                "value": "unknown",
                "source": "none",
                "verified": "2026-07-21",
                "freshness_class": 1,
            },
        },
        "cost": {
            "pricing_model": {
                "value": "Free and open source.",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 1,
            },
            "free_tier": {
                "value": "Yes — free.",
                "source": "src1",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 1,
            },
        },
        "evidence": {
            "records": [
                {
                    "id": "src1",
                    "title": "Example official source",
                    "url": "https://example.com/repo",
                    "authority": "official-repo",
                    "date_accessed": "2026-07-21",
                    "fields_supported": ["identity.vendor_or_maintainer"],
                }
            ],
            "evidence_status": "partial",
            "last_verified": "2026-07-21",
        },
        "notes": {
            "summary": "A minimal valid test profile.",
        },
    }


def make_profile(
    data: dict[str, Any] | None = None,
    *,
    agent_id: str = "opencode",
    path: Path | None = None,
) -> ProfileFile:
    """Build an in-memory ProfileFile for testing (no disk required)."""
    d = copy.deepcopy(data) if data is not None else minimal_profile_dict(agent_id)
    if path is None:
        # Synthesize a path so relative_path works; agent dir matches id.
        path = REPO_ROOT / "agents" / agent_id / "profile.yaml"
    return ProfileFile(path=path, data=d, agent_id=str(d.get("id", agent_id)))


def opencode_profile() -> ProfileFile:
    """Load the real OpenCode profile from disk (the committed canonical profile)."""
    from tools.profile_io import load_profile_by_id

    return load_profile_by_id("opencode")
