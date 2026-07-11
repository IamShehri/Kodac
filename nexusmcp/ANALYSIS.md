# NexusMCP: Honest Pre-Build Analysis

## 1. Market Reality: What the Research Actually Shows

### Market Size Claim — Corrected

The plan cites: *"The global MCP server market is projected to reach USD 2,713.9 million by 2025, growing at 8.3% CAGR."*

**Reality check:** That figure is from a market-research report that conflates the MCP protocol adoption with AI infrastructure broadly. It is NOT the addressable market for "hosted MCP server SaaS." The real paid-MCP-hosting TAM in 2025 is likely under $50M globally. Treat the $2.7B figure as directional signal only, not a revenue target.

### Actual Market State (mid-2025)

- MCP is 18 months old. It is a protocol, not a product category.
- Most "MCP servers" today are free open-source integrations.
- Enterprise demand is real but early: companies want managed, audited, SSO-integrated gateways — not just individual servers.
- The winners so far are **MCP gateways/platforms** (Composio, Nango, Toolhouse, MintMCP), not individual vertical servers.
- Individual MCP servers are commoditizing rapidly because they're small (500–2,000 LOC) and easy to clone.

### Competitor Map: What You're Actually Up Against

| Competitor | What they do | Your overlap | Threat level |
|---|---|---|---|
| **Composio** | 100+ MCP integrations, hosted gateway, auth/audit built-in | FHIR, Jira, NetSuite, Airtable | 🔴 High — they're adding healthcare |
| **Nango** | Universal auth layer for AI integrations, includes MCP | OAuth/auth for any integration | 🔴 High — infrastructure play |
| **Toolhouse / MintMCP** | Hosted MCP gateway, tool management, observability | Managed hosting + monitoring | 🟡 Medium — platform play |
| **Momentum FHIR MCP** | Open-source FHIR MCP server, natural language interface | Direct FHIR competitor | 🔴 High — open source + managed possible |
| **WSO2 FHIR MCP** | Enterprise FHIR integration, open source | Direct FHIR competitor | 🟡 Medium — enterprise oriented |
| **HAPI FHIR MCP** | Bridges MCP to HAPI FHIR backend | Direct FHIR competitor | 🟡 Medium |
| **Custom in-house** | Every mid-size health system will build their own | Your target customer may DIY | 🟡 Medium — but they need support |

**Key finding:** In the FHIR space specifically, you have 3+ open-source MCP servers already. Your differentiation MUST be reliability, support, and HIPAA compliance packaging — not the feature set.

---

## 2. The FHIR Angle: Opportunity and Trap

### Why FHIR is simultaneously the best and worst first integration

**Best:**
- Healthcare AI is the breakout category of 2025 ($600M in ambient scribe revenue alone)
- FHIR is a standard — once you implement it, you have a spec to follow
- HIPAA compliance + BAA is a real moat (most devs won't touch it)
- Clinics are actively looking for AI tooling that doesn't require them to become engineers

**Worst:**
- Open-source FHIR MCP servers already exist (Momentum, WSO2, AgentCare, HAPI bridge)
- HIPAA compliance isn't a feature — it's a multi-month process (BAA, audit, environment controls)
- Healthcare sales cycles are 3–6 months minimum
- A small clinic won't pay $499/month for a hosted open-source server they could self-host for free
- The actual buyers are health systems, who will want deep customization and won't buy solo-founder SaaS

### The honest gap in the market

The real underserved segment is **not "FHIR MCP server hosting."** It's:

> **"I'm a healthcare AI startup building an agent on top of FHIR data. I need a compliant, audited, production-ready MCP gateway I can trust — and I'll pay for it because my investors won't sign off on me rolling my own auth/audit pipeline."**

The buyer is the **healthtech startup**, not the hospital. Sell to the 200–500 FHIR-native AI startups, not the 5,000+ US clinics.

---

## 3. Architecture Redesign: What the Plan Gets Wrong

### The plan's stated stack has issues

| Plan says | Problem | Fix |
|---|---|---|
| FastMCP framework | FastMCP is Python-first (PrefectHQ). TypeScript version exists (punkpeye/fastmcp) but is less mature. For Node.js, use the official `@modelcontextprotocol/sdk` or build on FastMCP TS with eyes open. | Use `@modelcontextprotocol/sdk` server + a small Express/Fastify wrapper for auth/rate-limiting. More control, fewer framework abstractions to fight. |
| Fly.io for HIPAA workloads | Fly.io has HIPAA-eligible infrastructure but you need BAA, dedicated VMs, and specific configurations. Railway is similar. Neither is "HIPAA-ready out of the box." | Design for HIPAA from layer 1. Use Fly.io's HIPAA-eligible offering with BAA. All audit logs must be immutable. All transit encryption mandatory. |
| $500–$1,500/month burn | Undercounts by 2–3x for a production HIPAA environment. HIPAA-compliant logging, monitoring, database, and backups add real cost. | Plan for $1,500–3,000/month at 10–20 customers. Use AWS/GCP HIPAA-eligible zones if Fly.io's HIPAA offering doesn't cover audit log retention requirements. |
| Rate limiting in the MCP server | MCP servers are typically co-located with the client agent. Rate limiting happens at the API/proxy layer, not the MCP protocol layer. | Put rate limiting at the HTTP gateway level, not in the MCP server itself. MCP is a protocol — rate limit the HTTP transport. |

### Revised Architecture (Realistic for Solo)

```
┌─────────────────────────────────────────────────────┐
│                  Fly.io / Railway                    │
│  ┌───────────────────────────────────────────────┐  │
│  │  HTTP Gateway (Express/Fastify)               │  │
│  │  - OAuth 2.1 + PKCE                           │  │
│  │  - SAML/OIDC proxy (WorkOS or Clerk)          │  │
│  │  - Rate limiting (Upstash Redis)               │  │
│  │  - CORS + DNS rebinding protection             │  │
│  │  - Audit log emission                          │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │  stdio / SSE transport             │
│  ┌──────────────▼────────────────────────────────┐  │
│  │  MCP Server Core (Node + MCP SDK)             │  │
│  │  - FHIR R4 tool definitions                    │  │
│  │  - Resource CRUD (Patient, Observation, etc.)  │  │
│  │  - Search params / pagination                   │  │
│  │  - Schema validation                            │  │
│  └──────────────┬────────────────────────────────┘  │
│                 │                                     │
│  ┌──────────────▼────────────────────────────────┐  │
│  │  FHIR Backend (HAPI FHIR or cloud FHIR)       │  │
│  │  - You don't host the data — customer does    │  │
│  │  - You provide the MCP interface to it         │  │
│  └────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

External:
  - Audit log sink: S3/GCS with object-lock (immutable, 7-year retention)
  - Auth provider: WorkOS / Clerk / Auth0 for SSO
  - Observability: OpenTelemetry → Honeycomb / Datadog free tier / Axiom
```

---

## 4. Revenue Model: Honest Adjustments

### Why the plan's Year 1 projections are optimistic

The plan projects:
- 50 clinics at $499/month + 50 enterprise at $2,000/month
- $124,950 MRR
- $106,950 net profit Year 1

**Reality:**
- Getting 100 paying customers in Year 1 for a HIPAA-hosted FHIR MCP server as a solo founder is extremely aggressive
- Healthcare procurement means 3–6 month sales cycles with legal review, BAA negotiation, and security questionnaires
- Most "clinics" under 10 providers use EMRs like Epic, Cerner, Athenahealth — they won't plug a solo-hosted MCP into their production environment
- The realistic first year is 5–15 customers, mostly healthtech AI startups, not clinics

### Realistic Year 1 Revenue Model

| Quarter | Customers | Avg price | MRR | Cumulative revenue |
|---------|-----------|-----------|-----|-------------------|
| Q1 | 0–3 | $499 | $0–1,500 | $0–4,500 |
| Q2 | 3–8 | $499 | $1,500–4,000 | $6,000–18,000 |
| Q3 | 8–15 | $499–800 | $4,000–12,000 | $30,000–60,000 |
| Q4 | 15–25 | $499–1,200 | $12,000–30,000 | $90,000–150,000 |

### Revised Pricing That Actually Works

| Tier | Price | Target customer | What's included |
|------|-------|----------------|-----------------|
| **Open Source** | Free | Devs, researchers, self-hosters | Full MCP server code, MIT license, community support |
| **Developer** | $99/month | Healthtech AI startups, solo devs building FHIR agents | Managed hosting, 5 FHIR resources, basic audit log, email support |
| **Production** | $399/month | Series A/B healthtech startups | All FHIR resources, OAuth + SAML, audit log export, 99.5% SLA, Slack support |
| **Enterprise** | $1,500/month | Health systems, large AI vendors | Custom FHIR profiles, BAAs, 99.9% SLA, dedicated support, compliance audit, custom onboarding |

**Key change:** Drop the "per clinic" framing. Sell per workspace/tenant. A healthtech startup with 3 FHIR backends = 3 tenants = $1,200/month. Much easier to price and scale.

---

## 5. Strategic Pivot: The Real Opportunity

After honest analysis, the strongest solo opportunity is NOT "hosted FHIR MCP." It's:

> **"The MCP compliance layer for regulated industries"**

Here's the logic:

1. Every regulated AI company (healthcare, fintech, legal, government) will need MCP servers talking to sensitive systems
2. None of them want to build their own auth, audit, and compliance infrastructure
3. The MCP server itself is commoditized — the compliance wrapper is not
4. You can sell the same compliance wrapper to FHIR, to banking APIs, to legal document systems
5. Once you have the compliance infrastructure, adding a new vertical integration is a few days of work

**Product = "MCP Guard"** — compliance gateway for MCP servers

Features:
- OAuth2/OIDC/SAML auth layer (drop-in for any MCP server)
- Immutable audit log with 7-year retention (regulatory requirement)
- Per-tenant rate limiting and cost controls (prevents runaway AI agent spend)
- PII redaction in tool inputs/outputs (GDPR/HIPAA)
- Sandbox mode with mock responses
- Usage metering and billing integration

Pricing:
- Self-hosted: Free (open-source)
- Managed: $199/month per workspace
- Enterprise: $999/month + custom

This is MORE defensible than a FHIR-specific server because:
- It's horizontal infrastructure, not a vertical feature
- Once a customer configures their compliance policy in MCP Guard, switching cost is high
- You can sell to any regulated industry with one codebase
- The first customer could be a fintech AI company, a legal AI company, OR a healthtech company

**Ship order:**
1. Build the compliance gateway (auth + audit + rate limit)
2. Ship with 2-3 bundled MCP integrations (FHIR, one lightweight one)
3. Market to regulated AI startups broadly, not just healthcare
4. Add vertical integrations based on customer demand, not plan

---

## 6. Revised Honest Plan: 90 Days

### Days 1–14: Repo + Core Gateway
- Initialize OmniBridge repo
- Build Express gateway with OAuth2/PKCE + SAML proxy
- Build MCP server core with FHIR R4 tools (Patient, Observation, Condition, MedicationRequest, Encounter)
- Add immutable audit log to S3-compatible storage
- Rate limiting middleware

### Days 15–28: Fly.io Deploy + HIPAA Prep
- Deploy gateway on Fly.io HIPAA-eligible machines
- Set up BAA-ready environment config
- Write HIPAA security documentation
- Build sandbox mode (mock FHIR responses)
- CI/CD with GitHub Actions

### Days 29–42: Landing Page + Docs
- Developer-first landing page
- FHIR tool reference docs
- "Getting started in 5 minutes" guide
- Pricing page with self-hosted / managed / enterprise tiers

### Days 43–56: Launch + First Conversations
- Post on HN, r/mcp, r/HealthIT, BioStars
- Direct outreach: 20 healthtech AI founders on Twitter/LinkedIn
- Target: 10 discovery calls, 3 waitlist signups, 1 first paying customer

### Days 57–84: First Customer + Iterate
- Ship based on feedback
- Add 1-2 more FHIR resource types if requested
- Build second integration (Jira or Airtable) to prove horizontal play
- Target: 3–5 paying customers at $399/month

---

## 7. What This Project Gets You (Realistic)

At the end of 90 days:
- A running, deployable MCP compliance gateway
- 1–3 paying customers ($400–1,000/month)
- A repo you can show investors, partners, or customers
- Credibility in the MCP/healthtech AI space
- Clear evidence of whether this is a real business or a learning project

At the end of 12 months (if it works):
- 15–30 customers
- $5,000–20,000 MRR
- Proven product-market fit in one vertical (likely healthcare AI)
- Optional: raise a small round or continue bootstrapping

This is a real, honest path. Not a fantasy. Let me build the actual artifacts now.
