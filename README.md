# LKS & COSIQ RevOps Skills

Custom Claude Code skills implementing the **LKS & COSIQ AI RevOps Systems Manual**
— a deterministic harness for revenue operations across LeadPerfection, Five9,
BuilderPrime, and a Supabase-hosted command center.

The design principle: treat the LLM as a non-deterministic engine inside a
deterministic harness. Global conventions live in the lean, always-loaded
[`CLAUDE.md`](CLAUDE.md); operational procedures live in lazy-loaded skills under
[`.claude/skills/`](.claude/skills/) so the model's attention stays in the "Sharp
Zone" instead of drowning in eager context.

## The skills

| Skill | Purpose | Shorthand |
|---|---|---|
| [`standing-advisor`](.claude/skills/standing-advisor/SKILL.md) | Strategic grounding: blueprint audits, ROI alignment checks, adversarial pre-implementation review, sub-agent prompt generation | `/advisor audit\|check\|before\|prompt` |
| [`lp-ingest`](.claude/skills/lp-ingest/SKILL.md) | Schema-drift-guarded LeadPerfection ingestion, deterministic sanitization, critical intent classification | `/lp ingest\|validate` |
| [`five9-ingest`](.claude/skills/five9-ingest/SKILL.md) | Dialer queue optimization against arrival curves; ACD reports that expose Lost Time Silos | `/five9 optimize\|report` |
| [`builderprime-integration`](.claude/skills/builderprime-integration/SKILL.md) | Secure portal→BuilderPrime webhook/API field mapping with scoped-key enforcement | `/bp` |
| [`outbound-iq-sync`](.claude/skills/outbound-iq-sync/SKILL.md) | 30-second Golden Window speed-to-lead SMS/email; high-EQ drips for aged leads | `/iq sync\|campaign` |
| [`fireflies-intelligence`](.claude/skills/fireflies-intelligence/SKILL.md) | Fireflies meeting intelligence via MCP: timestamped post-call recaps, transcript mining, CRM/follow-up sync, conversation-analytics coaching | `/ff recap\|search\|sync\|coach\|setup` |
| [`command-center-deploy`](.claude/skills/command-center-deploy/SKILL.md) | Compile Revenue-per-Zip and Agent-Capacity-ROI dashboard; deploy to Supabase Edge Functions | `/deploy --compile\|--encode\|--push` |
| [`multi-tenant-architect`](.claude/skills/multi-tenant-architect/SKILL.md) | Metadata-driven multi-tenant engine: tenant config registry, DB isolation (schemas/RLS), polymorphic CRM adapters, 30-second client scaffolding | `/tenant design\|middleware\|scaffold\|verify\|swarm` |

Bundled resources:

- `lp-ingest/scripts/lp_ingest.py` — stdlib-only drift check + sanitizer (deterministic, exit code 2 halts on drift)
- `lp-ingest/references/schema.json` — expected LP export schema (template; verify against a real export)
- `builderprime-integration/references/bp_map.json` — portal→BP field map (template; fill in real field IDs)
- `multi-tenant-architect/references/multi-tenant-crm-architecture.ts` — canonical TypeScript blueprint (TenantConfig registry, NormalizedLead, polymorphic ICrmAdapter, MultiTenantManager)
- `multi-tenant-architect/references/swarm-roles.md` — sub-agent role prompts and gates for orchestrated multi-tenant builds
- `fireflies-intelligence/references/mcp-endpoint.md` — Fireflies MCP endpoint (`https://api.fireflies.ai/mcp`): registration/auth options, full tool surface, search grammar, deep-link format
- `.mcp.json` (repo root) — project-scoped registration of the Fireflies MCP server; approve on first use, then authenticate via `/mcp`

## The MindStudio agent fleet

[`mindstudio-agents/`](mindstudio-agents/) holds the version-controlled builds for
the four customer-facing AI agents (Portal Concierge, Speed-to-Lead Responder,
Lead Qualifier, Revenue Reporter) — each file is a paste-ready MindStudio agent
with its prompt, launch variables, output contract, and harness wiring. The
prompt is the product: edit it here, then re-paste into MindStudio.

## The `platform/` reference implementation

[`platform/`](platform/) is a working, tested TypeScript implementation of the
multi-tenant engine, ready to lift into the master platform repository: tenant
middleware (fail-closed resolution from verified JWT claims), polymorphic
LeadPerfection/BuilderPrime adapters, a `scaffold-client` CLI (onboard a tenant in
under 30 seconds, refuses raw keys), registry + RLS migrations, and an isolation
test harness (`npm run test:multi-tenant`) proving Client A can never read
Client B's data.

## Installation

1. **Extract/clone** this repository into your working environment.
2. **Initialize**: open Claude Code at the repo root. `CLAUDE.md` loads
   automatically; run `/init` only if you want Claude to re-scan and extend it.
3. **Harness verification**: configure your status line (`/statusline`) to show
   model, context %, and cost — this is your first proof of work that the harness
   is active.
4. **Structure audit**: confirm `.claude/skills/` contains the six skills above,
   then run `/lp validate` against a current LP export to verify the schema is in
   sync before the first real ingestion.

## Operating ethos

Do not trust; verify. Every skill ends in a proof-of-work step, halts on drift
rather than guessing, uses scoped API keys only, and logs every major fix to the
System Evolution Log in `CLAUDE.md` so a bug becomes a permanent upgrade.
