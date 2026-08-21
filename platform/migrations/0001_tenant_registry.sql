-- 0001: Global tenant registry + isolation scaffolding.
-- The registry lives in the shared `public` schema; each client's data lives in
-- its own isolated schema (created by scaffold-client migrations, template below).

create table if not exists public.tenants (
  tenant_id        text primary key,
  client_name      text not null,
  is_active        boolean not null default true,
  database_schema  text not null unique,
  crm_provider     text not null check (crm_provider in ('leadperfection', 'builderprime', 'hubspot')),
  -- Settings mirror TenantConfig. secret_key_env_var stores the ENV VAR NAME
  -- only; actual keys live in the deployment's secret store, never in the DB.
  crm_api_settings jsonb not null,
  features         jsonb not null default '{}'::jsonb,
  theme            jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

-- Belt-and-suspenders for shared tables (anything kept in `public` with a
-- tenant_id column): RLS keyed on the verified JWT claim physically blocks
-- cross-tenant reads even if application code has a bug.
--
-- Template (apply per shared table):
--   alter table public.<shared_table> enable row level security;
--   create policy tenant_isolation on public.<shared_table>
--     using (tenant_id = current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id');

-- Per-tenant schema template (emitted by scaffold-client for each new client):
--   create schema if not exists tenant_<slug>;
--   -- grant usage only to the platform service role; portal roles get access
--   -- exclusively through the tenant-scoped middleware.
