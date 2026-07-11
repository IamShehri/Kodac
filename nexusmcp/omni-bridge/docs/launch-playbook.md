# OmniBridge Launch Playbook

## 90-Day Product Launch Plan

### Pre-Launch (Days 1–14)

- [ ] Open source repo on GitHub with MIT license
- [ ] publish** `public/index.html` via GitHub Pages or Vercel
- ] Write **HIPAA compliance doc** (`docs/hipaa.md`) — BAA process, environmental controls, audit log retention
- [ ] Write **authentication guide** (`docs/auth.md`) — OAuth2 PKCE flow, SAML setup, mock auth for dev
- [ ] Write **tool reference** (`docs/tools.md`) — all 8 FHIR tool schemas with examples
- [ ] Set up **GitHub Discussions** for Q&A
- [ ] Prepare **HN headline**: "Show HN: OmniBridge — HIPAA-ready MCP gateway for FHIR with audit logs" 

### Launch (Days 15–21)

**Day 1 — Hacker News** (9 AM EST)
- Post title: "Show HN: OmniBridge – HIPAA-ready MCP gateway for FHIR R4 with audit logs, OAuth2, and rate limiting"
- Body: Explain why FHIR + MCP is the missing link for healthcare AI. Link to GitHub and landing page.

**Day 1 — r/mcp** (2 PM EST)
- Post: "I built a HIPAA-ready FHIR MCP server with audit logs for healthtech AI teams"
- Be specific about what it does and doesn't do. Link to the FHIR tool doc.

**Day 1 — r/HealthIT** (4 PM EST)
- Post: "Healthtech AI devs: I built a compliance-gated MCP gateway for EHR data — would love your feedback"
- Focus on the compliance pain, not the tech.

**Day 2 — Twitter/X thread**
- Thread 1: "FHIR + MCP is the missing link for healthcare AI. Here's what I built..."
- Thread 2: "Why most FHIR MCP servers fail HIPAA audits (and how OmniBridge fixes it)"
- Tag @HealthIT influencers, @FHIR community

**Day 2 — BioStars / Dev.to / Medium**
- Publish "How to build HIPAA-compliant AI agents on FHIR data with MCP" — technical tutorial using OmniBridge
- Include code samples, architecture diagram, compliance checklist

**Day 3 — Direct Outreach**
- Identify 20 healthtech AI founders on Twitter/LinkedIn building clinical documentation, prior auth, or patient engagement tools
- Personalized DM: "I built a HIPAA-ready FHIR MCP gateway. Would love 20 min of your time — would this solve your EHR integration problem?"
- Don't pitch. Ask. Get on calls.

**Day 5 — Indie Hackers**
- Post project update thread in r/indiehackers
- Share revenue/model learnings (even if $0)
- Ask for feedback on pricing

**Day 14 — Follow-up**
- Email everyone who joined the waitlist
- Send detailed technical comparison vs. rolling your own
- Offer 14-day managed hosting trial for Founding Slots

### Post-Launch (Days 22–90)

- [ ] Ship based on feedback (add missing FHIR resources, fix bugs)
- [ ] Publish first case study / tutorial
- [ ] Run 2–3 webinars / Twitter Spaces on "Building HIPAA-compliant AI on FHIR"
- [ ] Attend 1 virtual healthcare AI conference / meetup
- [ ] Convert waitlist → Production tier customers
- [ ] Add second integration (Airtable or Jira) to prove horizontal play
- [ ] Reach 5 paying customers by Day 90
