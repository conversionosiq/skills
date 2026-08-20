# LKS & COSIQ AI RevOps Harness

This repository is the deterministic harness for the LKS & COSIQ RevOps system.
Keep this file lean — it loads on every turn. Detailed procedures live in
lazy-loaded skills under `.claude/skills/`; consult the matching skill before
acting instead of improvising.

## Stack

- **LeadPerfection (LP)** — lead CRM / source of lead exports
- **Five9** — dialer / call center ACD
- **BuilderPrime (BP)** — job CRM, fed by front-end ("Lovable") portals via webhook
- **Supabase Edge Functions** — hosts the Sovereign Command Center dashboard

## Skills index (lazy-loaded)

| Skill | Use for |
|---|---|
| `standing-advisor` | Strategic grounding, audits, pre-implementation adversarial review (`/advisor …`) |
| `lp-ingest` | Lead CSV ingestion, schema-drift guard, sanitization, intent classification (`/lp …`) |
| `five9-ingest` | Dialer queue optimization and ACD reporting (`/five9 …`) |
| `builderprime-integration` | Portal→BP webhook/API field mapping and validation (`/bp …`) |
| `outbound-iq-sync` | 30-second speed-to-lead SMS/email and aged-lead drips (`/iq …`) |
| `command-center-deploy` | Compile and deploy the revenue dashboard to Supabase (`/deploy …`) |

## Operating rules (always in force)

1. **Verify, don't trust.** Every completed step needs proof of work (validation
   script output, screenshot, rendered page) — "it ran" is not proof.
2. **Scoped API keys only.** A system prompt is not a permission layer; if an agent
   can read a secret, it can use a secret. Never commit or echo keys.
3. **Halt on drift.** Schema or mapping drift stops the pipeline; never import or
   push past a failed check "just this once".
4. **No bulk outbound without explicit confirmation** naming segment, count, and
   message (see the Cole Medine protocol in `builderprime-integration`).
5. **Truth over vanity.** Optimize Revenue per Zip Code and Agent Capacity ROI,
   never raw lead counts or calendar fill.

## System Evolution Log

Append an entry for every major fix so bugs become permanent upgrades. Newest first.

| Date | Incident / bug | Root cause | Permanent upgrade |
|---|---|---|---|
| _(none yet)_ | | | |
