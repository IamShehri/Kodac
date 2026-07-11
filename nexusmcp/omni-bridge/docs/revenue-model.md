# OmniBridge Revenue Model & Customer Acquisition

## Revenue Projections (Realistic, No-Sponsor)

| Quarter | Customers | Avg Price | MRR | Revenue | Burn | Net |
|---------|-----------|-----------|-----|---------|------|-----|
| Q1 2025 | 0 | — | $0 | $0 | $0 | $0 |
| Q2 2025 | 5 | $199 | $995 | $2,985 | $500 | +$2,485 |
| Q3 2025 | 12 | $279 | $3,348 | $10,044 | $800 | +$9,244 |
| Q4 2025 | 22 | $349 | $7,678 | $23,034 | $1,200 | +$21,834 |

**Assumptions:**
- Average price is blended across Developer ($99) and Production ($399) tiers
- Burn covers hosting, monitoring, S3 storage, support time, legal (BAA templates)
- Zero paid ads. All distribution is organic.

## Customer Acquisition by Channel

| Channel | % of New Customers | Cost per Customer | Notes |
|---------|-------------------|-------------------|-------|
| GitHub / HN | 40% | $0 | Long-tail developer SEO + HN launch spike |
| Twitter / X | 25% | $0 | Threads + replies in healthtech conversations |
| Direct Outreach | 20% | $5 | Personalized DMs to healthtech founders |
| Docs / SEO | 10% | $0 | "FHIR MCP" / "HIPAA compliant MCP" searches |
| Partnerships | 5% | $0 | Referrals from FHIR consulting firms |

## Pricing Rationale

- **Open source = free** creates trust and funnel
- **$99 Developer** removes friction for solo builders
- **$399 Production** is where real MRR lives — under $500/month is a no-brainer for Series A startups
- **Enterprise $1,500+** comes from direct sales after customers outgrow Production tier

## Key Metrics to Track

- **MRR**: primary
- **Burn multiple**: MRR / monthly burn (target: > 3x)
- **Logo count**: total paying customers
- **NPS**: post-onboarding survey
- **Time to first dollar**: target < 60 days from repo publication
- **ADC (acquisition channel dominance)**: which channels convert most?

## Risk Factors

1. **Compliance anchoring**: Without a HIPAA-ready environment (BAA, access controls, encryption), you cannot sell to healthcare. This takes 2–4 weeks of setup.
2. **Customer education**: "Compliance-gated MCP gateway" is a new concept. Expect 3–6 months of education before product-market fit.
3. **Open-source competition**: Momentum FHIR MCP, WSO2, and HAPI bridges are free. You are selling trust, support, and compliance packaging — not features.
4. **Market size**: Healthtech AI startups are ~500 companies globally. Realistic TAM at $399/month: ~$2.4M. You need 5–10% to build a real company.

## Upsell Path

1. **FHIR MCP** (landing product)
2. **MCP Compliance Gateway** (horizontal play — any regulated integration)
3. **Managed FHIR Backend** (optional — host their HAPI FHIR too)
4. **Custom Integration Build** (enterprise professional services)

Each step increases ARPU and retention.
