"""Shared test fixtures: a genuinely schema-valid and policy-valid baseline profile.

The baseline uses a synthetic agent 'test-agent' with a synthetic official URL
and GitHub repository so that URL authority checks pass without external
dependencies. Every field carries the required freshness_class matching the
ratified field-specific mapping.
"""

from __future__ import annotations

import copy
import datetime as _dt
from pathlib import Path
from typing import Any

from tools.profile_io import REPO_ROOT, ProfileFile

EVAL_DATE = _dt.date(2026, 7, 21)

FAKE_SHA = "a" * 40
FAKE_CONTENT_SHA = "b" * 64


def minimal_profile_dict(agent_id: str = "test-agent") -> dict[str, Any]:
    """Return a deep-copyable, genuinely schema-valid and policy-valid profile."""
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
                "source": "src-repo-api",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
            "official_url": {
                "value": "https://test-agent.example.com",
                "source": "src-repo-readme",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
            "source_repository": {
                "value": "https://github.com/test-vendor/test-agent",
                "source": "src-repo-api",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
        },
        "openness": {
            "open_source": {
                "value": "supported",
                "source": "src-repo-api",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
            "license": {
                "value": "MIT",
                "source": "src-license",
                "verified": "2026-07-21",
                "claim_status": "verified",
                "freshness_class": 3,
            },
        },
        "compatibility": {
            "operating_systems": {
                "value": ["Linux"],
                "source": "src-docs-index",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 2,
            },
            "surfaces": {
                "value": ["terminal"],
                "source": "src-docs-index",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 2,
            },
            "supported_providers": {
                "value": ["Anthropic"],
                "source": "src-docs-providers",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 2,
            },
            "local_model_support": {
                "value": "supported",
                "source": "src-docs-providers",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 2,
            },
        },
        "protocols": {
            "mcp_support": {
                "value": "supported",
                "source": "src-docs-mcp",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 2,
            },
            "agent_skills_support": {
                "value": "unknown",
                "source": "none",
                "verified": "2026-07-21",
                "claim_status": "unknown",
                "freshness_class": 2,
            },
            "headless_or_ci": {
                "value": "unknown",
                "source": "none",
                "verified": "2026-07-21",
                "claim_status": "unknown",
                "freshness_class": 2,
            },
        },
        "security": {
            "sandboxing_model": {
                "value": "unknown",
                "source": "none",
                "verified": "2026-07-21",
                "claim_status": "unknown",
                "freshness_class": 2,
            },
            "permission_controls": {
                "value": "Per-tool allow/ask/deny permission system.",
                "source": "src-docs-permissions",
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
                "claim_status": "unknown",
                "freshness_class": 2,
            },
            "data_retention": {
                "value": "The vendor states no code or context data is stored.",
                "source": "src-docs-enterprise",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 1,
            },
        },
        "cost": {
            "pricing_model": {
                "value": "Per-seat enterprise pricing (contact sales).",
                "source": "src-docs-enterprise",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 1,
            },
            "free_tier": {
                "value": "The homepage states free models are included.",
                "source": "src-site-home",
                "verified": "2026-07-21",
                "claim_status": "vendor-reported",
                "freshness_class": 1,
            },
        },
        "evidence": {
            "records": [
                {
                    "id": "src-repo-api",
                    "title": "test-vendor/test-agent repository metadata (GitHub API)",
                    "url": "https://api.github.com/repos/test-vendor/test-agent",
                    "authority": "official-repo",
                    "verification_method": "repository-metadata",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "fields_supported": [
                        "identity.vendor_or_maintainer",
                        "identity.source_repository",
                        "openness.open_source",
                    ],
                    "immutable": False,
                },
                {
                    "id": "src-repo-readme",
                    "title": "test-vendor/test-agent README.md at commit " + FAKE_SHA[:8],
                    "url": f"https://raw.githubusercontent.com/test-vendor/test-agent/{FAKE_SHA}/README.md",
                    "authority": "official-repo",
                    "verification_method": "repository-artifact",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "revision_or_commit": FAKE_SHA,
                    "fields_supported": ["identity.official_url"],
                    "immutable": True,
                },
                {
                    "id": "src-license",
                    "title": "test-vendor/test-agent LICENSE (MIT) at commit " + FAKE_SHA[:8],
                    "url": f"https://raw.githubusercontent.com/test-vendor/test-agent/{FAKE_SHA}/LICENSE",
                    "authority": "official-repo",
                    "verification_method": "repository-artifact",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "revision_or_commit": FAKE_SHA,
                    "fields_supported": ["openness.license"],
                    "immutable": True,
                },
                {
                    "id": "src-docs-index",
                    "title": "Test Agent docs index.mdx at commit " + FAKE_SHA[:8],
                    "url": f"https://raw.githubusercontent.com/test-vendor/test-agent/{FAKE_SHA}/docs/index.mdx",
                    "authority": "official-docs",
                    "verification_method": "official-documentation",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "revision_or_commit": FAKE_SHA,
                    "fields_supported": [
                        "compatibility.operating_systems",
                        "compatibility.surfaces",
                    ],
                    "immutable": True,
                },
                {
                    "id": "src-docs-providers",
                    "title": "Test Agent docs providers.mdx at commit " + FAKE_SHA[:8],
                    "url": f"https://raw.githubusercontent.com/test-vendor/test-agent/{FAKE_SHA}/docs/providers.mdx",
                    "authority": "official-docs",
                    "verification_method": "official-documentation",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "revision_or_commit": FAKE_SHA,
                    "fields_supported": [
                        "compatibility.supported_providers",
                        "compatibility.local_model_support",
                    ],
                    "immutable": True,
                },
                {
                    "id": "src-docs-mcp",
                    "title": "Test Agent docs mcp.mdx at commit " + FAKE_SHA[:8],
                    "url": f"https://raw.githubusercontent.com/test-vendor/test-agent/{FAKE_SHA}/docs/mcp.mdx",
                    "authority": "official-docs",
                    "verification_method": "official-documentation",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "revision_or_commit": FAKE_SHA,
                    "fields_supported": ["protocols.mcp_support"],
                    "immutable": True,
                },
                {
                    "id": "src-docs-permissions",
                    "title": "Test Agent docs permissions.mdx at commit " + FAKE_SHA[:8],
                    "url": f"https://raw.githubusercontent.com/test-vendor/test-agent/{FAKE_SHA}/docs/permissions.mdx",
                    "authority": "official-docs",
                    "verification_method": "official-documentation",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "revision_or_commit": FAKE_SHA,
                    "fields_supported": ["security.permission_controls"],
                    "immutable": True,
                },
                {
                    "id": "src-docs-enterprise",
                    "title": "Test Agent docs enterprise.mdx at commit " + FAKE_SHA[:8],
                    "url": f"https://raw.githubusercontent.com/test-vendor/test-agent/{FAKE_SHA}/docs/enterprise.mdx",
                    "authority": "official-docs",
                    "verification_method": "official-documentation",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "revision_or_commit": FAKE_SHA,
                    "fields_supported": ["privacy.data_retention", "cost.pricing_model"],
                    "immutable": True,
                },
                {
                    "id": "src-site-home",
                    "title": "test-agent.example.com homepage",
                    "url": "https://test-agent.example.com",
                    "authority": "official",
                    "verification_method": "vendor-marketing",
                    "date_accessed": "2026-07-21",
                    "content_sha256": FAKE_CONTENT_SHA,
                    "fields_supported": ["cost.free_tier"],
                    "immutable": False,
                },
            ]
        },
        "notes": {
            "summary": "A minimal valid test profile with synthetic sources.",
        },
    }


def make_profile(
    data: dict[str, Any] | None = None,
    *,
    agent_id: str = "test-agent",
    path: Path | None = None,
) -> ProfileFile:
    d = copy.deepcopy(data) if data is not None else minimal_profile_dict(agent_id)
    if path is None:
        path = REPO_ROOT / "agents" / agent_id / "profile.yaml"
    return ProfileFile(path=path, data=d, agent_id=str(d.get("id", agent_id)))


def opencode_profile() -> ProfileFile:
    from tools.profile_io import load_profile_by_id

    return load_profile_by_id("opencode")
