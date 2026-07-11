# OmniBridge HIPAA Compliance Guide

## Overview

OmniBridge is designed for HIPAA-compliant operation when deployed in a HIPAA-eligible environment. This document describes what we provide, what you (the customer) must configure, and what we require for Enterprise * authors Pillar 1: HIPAA-compliant hosting environment 
- Customer must provide HIPAA-eligible infrastructure (Fly.io HIPAA, AWS/GCP with BAA)
- OmniBridge never stores PHI transiently in memory beyond the duration of a single tool call
- All audit logs must be persisted to an immutable S3-compatible store with object-lock compliance mode

 Pillar 2: Access control 
- OAuth2 PKCE + SAML 2.0 proxy supported
- JWT tokens with 1-hour expiry + refresh tokens with 30-day expiry
- All tokens audited on issuance and refresh

 Pillar 3: Audit & accountability 
- Every FHIR operation is logged with tenant isolation
- PII fields (name, address, birthdate, SSN, email, phone) are automatically redacted before logging
- Audit logs include: actor, action, resource, result, duration, IP, timestamp

 Pillar 4: Integrity 
- All transit is HTTPS-only
- All storage uses server-side encryption (SSE-S3 or equivalent)
- Request/response bodies are validated against FHIR R4 schema before processing
