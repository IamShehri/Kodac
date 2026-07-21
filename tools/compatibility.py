"""Centralized authority / verification_method / claim_status / field compatibility.

Single source of truth for all evidence-contract rules. The validator and tests
import from here so there is no scattered ad-hoc logic.
"""

from __future__ import annotations

# ---------------------------------------------------------------------------
# Verification methods
# ---------------------------------------------------------------------------

# claim_status -> allowed verification_methods
CLAIM_METHOD_COMPAT: dict[str, frozenset[str]] = {
    "verified": frozenset(
        {"repository-artifact", "repository-metadata", "release-metadata", "independent-execution"}
    ),
    "vendor-reported": frozenset({"official-documentation", "vendor-marketing"}),
    # 'unknown' and 'disputed' have no method constraint directly,
    # but unknown requires source=none (handled elsewhere).
}

# ---------------------------------------------------------------------------
# authority -> allowed verification_methods
# ---------------------------------------------------------------------------

AUTHORITY_METHOD_COMPAT: dict[str, frozenset[str]] = {
    "official": frozenset({"vendor-marketing", "official-documentation"}),
    "official-docs": frozenset({"official-documentation"}),
    "official-repo": frozenset({"repository-artifact", "repository-metadata"}),
    "official-release": frozenset({"release-metadata"}),
    "secondary": frozenset({"secondary-context"}),
    "tertiary": frozenset({"secondary-context"}),
}

# ---------------------------------------------------------------------------
# Field-level method restrictions for verified claims.
#
# Only these fields may be claim_status=verified via artifact methods
# (repository-artifact, repository-metadata, release-metadata) in Phase 1.
# All other factual fields must be vendor-reported, unknown, or disputed.
# ---------------------------------------------------------------------------

VERIFIED_ARTIFACT_FIELDS: frozenset[str] = frozenset(
    {
        "identity.vendor_or_maintainer",
        "identity.official_url",
        "identity.source_repository",
        "openness.open_source",
        "openness.license",
        "model_and_tier.current_versions",
    }
)

# Fields that may never be verified via artifact methods in Phase 1
# (behavioral/capability/compatibility/protocol/security/privacy/cost).
BEHAVIORAL_FIELD_PREFIXES: tuple[str, ...] = (
    "compatibility.",
    "protocols.",
    "security.",
    "privacy.",
    "cost.",
    "capabilities.",
)


def is_behavioral_field(field_path: str) -> bool:
    """True if the field is behavioral (may not be verified via artifacts)."""
    return any(field_path.startswith(prefix) for prefix in BEHAVIORAL_FIELD_PREFIXES)


def method_allowed_for_authority(authority: str, method: str) -> bool:
    """Check authority -> method compatibility."""
    allowed = AUTHORITY_METHOD_COMPAT.get(authority)
    if allowed is None:
        return False
    return method in allowed


def method_allowed_for_claim(claim_status: str, method: str) -> bool:
    """Check claim_status -> method compatibility."""
    allowed = CLAIM_METHOD_COMPAT.get(claim_status)
    if allowed is None:
        return True  # unknown/disputed have no method constraint
    return method in allowed


def field_allows_artifact_verified(field_path: str, claim_status: str, method: str) -> bool:
    """True if a verified claim via an artifact method is allowed for this field."""
    if claim_status != "verified":
        return True  # non-verified claims are not restricted by this rule
    if method not in ("repository-artifact", "repository-metadata", "release-metadata"):
        return True  # independent-execution is allowed for any field (future)
    if is_behavioral_field(field_path):
        return False
    return field_path in VERIFIED_ARTIFACT_FIELDS
