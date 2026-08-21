# LKS & COSIQ AI RevOps Harness

This repository is the deterministic harness for the LKS & COSIQ RevOps system,
in the `conversionosiq` GitHub organization. Keep this file lean — it loads on
every turn. Detailed procedures live in lazy-loaded skills under
`.claude/skills/`; consult the matching skill before acting instead of
improvising.

## Multi-client isolation

The active client context for any session attached to this repository is
**Internal** (Lauren Kingsley Strategy / ConversionOS IQ) — never a client
engagement. Client production code and client credentials live in each client's
own repository and are worked on in sessions attached to that repository:
Carolina Home Remodeling, Privacy Fence Company, and Aully Command each have
their own. `docs/multi-client-isolation.md` documents the architecture and how
each repository carries this same security configuration.

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
| `multi-tenant-architect` | Metadata-driven multi-tenant engine: tenant registry, DB isolation, polymorphic CRM adapters, client scaffolding (`/tenant …`) |

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

## Session security configuration

- `.claude/settings.json` carries `permissions.deny` rules that prevent reading
  or editing credential-pattern files (`.env*`, private keys, certificates,
  client credential identifiers), and registers a PreToolUse hook.
- `.claude/hooks/protect_secrets.py` is that hook: it denies Read, Edit, Write,
  NotebookEdit, Grep, and Bash calls that target a credential-pattern file or
  reference a known credential identifier. Patterns for client system names that
  also appear in skill and adapter filenames (BuilderPrime, for example) are
  scoped to credential-bearing names so the integration files themselves stay
  readable.
- `.gitignore` keeps the same credential patterns out of version control.
- Credential values never appear in this repository — not in skills, docs,
  examples, or commit messages. Pattern *names* (the string
  `SUPABASE_ACCESS_TOKEN`, for example) may appear in blocklists; values may not.

## System Evolution Log

Append an entry for every major fix so bugs become permanent upgrades. Newest first.

| Date | Incident / bug | Root cause | Permanent upgrade |
|---|---|---|---|
| _(none yet)_ | | | |
