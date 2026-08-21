---
name: multi-tenant-architect
description: Metadata-driven multi-tenant platform architecture — replace per-client codebase clones (the Ad-Hoc Silo Anti-Pattern) with one core engine that resolves each tenant's config (isolated database schema, CRM provider, scoped credentials, branding) at runtime through polymorphic CRM adapters (LeadPerfection, BuilderPrime, HubSpot). Use whenever the user types a /tenant command (design, middleware, scaffold, verify, swarm), wants to onboard a new client without cloning code, unify client portals across different CRMs, design tenant isolation (Postgres schemas / RLS), build a client scaffolder CLI, or complains about starting over for every new client, mismatched schemas, or cross-tenant data risk — even if they never say "multi-tenant".
---

# Multi-Tenant Architect: Metadata-Driven Tenant Adapter Engine

Maintaining a separate clone of the platform per client guarantees configuration
drift, security hazards, and code rot. The cure is one **core platform engine**
that reads a client's metadata at runtime and adapts on the fly — fix a bug once,
every client gets it instantly.

## The pattern — three planes, strictly separated

1. **Core App Engine** — auth, global routing, shared frontend. One codebase, zero
   client-specific forks.
2. **Tenant Config Registry** — centralized metadata per client: `tenant_id`,
   `database_schema`, `crm_provider`, API settings (secrets referenced by
   **env-var name only**, never stored), active features, branded theme.
3. **Polymorphic CRM Adapters** — a unified `ICrmAdapter` interface with concrete
   adapters per CRM. The frontend only ever speaks the normalized internal schema;
   adapters translate silently.

## Bundled resources

- `references/multi-tenant-crm-architecture.ts` — the canonical blueprint:
  `TenantConfig`, `NormalizedLead`, `ICrmAdapter`, LeadPerfection/BuilderPrime
  adapters, `MultiTenantManager`. Start here; keep it the source of truth for types.
- `references/swarm-roles.md` — the four sub-agent role prompts and handoff gates
  for orchestrated builds (`/tenant swarm`).
- `platform/` at this repo's root — a working, tested reference implementation
  (middleware, scaffolder CLI, isolation test harness) to lift into the master
  platform repository.

## Where this runs

Architecture and scaffolding target the **master platform repository**. This
skills repo carries the blueprint and reference implementation; don't grow a
production platform inside the harness repo.

## Commands

### `/tenant design` — Step 1: architecture (approval-gated)

Propose, then **stop and wait for explicit approval** before writing code.
Directory layout and isolation strategy are the two decisions most expensive to
reverse — an hour of review here beats a quarter of migration later. Propose:

- The **Bridge Model**: shared application instance, isolated data — per-tenant
  Postgres schemas (strongest isolation) or shared tables with Row-Level Security
  on `jwt.claims.tenant_id` (simpler migrations). Recommend per-tenant schemas
  when clients differ in CRM shape; RLS when they're homogeneous.
- The directory layout (default, adapt as needed):

```
platform/
├── core/            # engine: types, registry loader, tenant middleware
├── adapters/        # ICrmAdapter + leadperfection.ts, builderprime.ts, …
├── tenants/         # registry.json (dev) / public.tenants table (prod)
├── migrations/      # registry table, per-tenant schema template, RLS policies
├── scripts/         # scaffold-client CLI
└── tests/           # multi-tenant isolation + normalization harness
```

- The registry schema, following `TenantConfig` in the blueprint.

### `/tenant middleware` — Step 2: the tenant resolver

Build the middleware every portal request passes through:

- Take `tenant_id` from a **verified** JWT claim (the auth layer — e.g. Supabase —
  verifies signatures; never decode-and-trust yourself, and never accept a
  tenant_id from the request body).
- Fetch tenant metadata from the registry; **fail closed** — unknown or suspended
  tenant is a hard reject, not a default.
- Scope the DB client to the tenant's schema (or apply the RLS context) so data
  can never cross-contaminate.
- Instantiate the correct CRM adapter via the provider switch.

### `/tenant scaffold` — Step 3: 30-second client onboarding

Build/maintain the `npm run scaffold-client` CLI: takes client name, tenant ID,
CRM provider, API base URL, theme colors; appends the registry entry (env-var
reference only — the CLI must refuse an actual key pasted as input); emits the SQL
migration for the isolated schema; creates a per-client validation test folder.
Onboarding ends with the validation test passing — that's the proof of work.

### `/tenant verify` — Step 4: prove isolation

Run/extend `npm run test:multi-tenant`: mock simultaneous requests from Client A
(LeadPerfection) and Client B (BuilderPrime); assert A can never read B's data
(including a forged/unknown tenant_id being rejected, and a suspended tenant
blocked); assert every adapter normalizes its CRM payloads into the unified
internal models (`NormalizedLead`, E.164 phones). Never ship a tenant change
without this harness green.

### `/tenant swarm` — orchestrated build

For large builds, spawn the four specialized sub-agents defined in
`references/swarm-roles.md` (Database Architect, API Adapter, Frontend Adapter,
DevOps & Security Gatekeeper) and enforce the handoff gates listed there — no
code before the isolation layer and RLS rules are signed off.

## Security rules (harness rules apply in full)

- Run a `standing-advisor` `before` audit ahead of implementation.
- Scoped API keys only, referenced by env-var name in config; pre-commit checks
  block raw keys from entering the repo.
- Isolation failures are release blockers, never "fix later" — a cross-tenant
  leak is the one bug that ends a multi-client business.
- Log every isolation or adapter incident to the System Evolution Log in
  `CLAUDE.md`.

## Relationship to the other harness skills

- `builderprime-integration`'s `bp_map.json` is the field-mapping source for the
  BuilderPrime adapter; `lp-ingest`'s sanitization rules define `NormalizedLead`
  hygiene (phone/email normalization, dedupe).
- `command-center-deploy` consumes the normalized, tenant-scoped data — which is
  what makes one dashboard engine servable to every client.
