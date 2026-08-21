import { readFileSync } from 'node:fs';
import type { TenantConfig } from './types.js';

/**
 * Dev registry loader (tenants/registry.json). In production the registry is
 * the global `public.tenants` table (see migrations/0001_tenant_registry.sql);
 * swap this loader for a DB query without touching any caller.
 */
export function loadRegistry(path: string): TenantConfig[] {
  const parsed = JSON.parse(readFileSync(path, 'utf8')) as { tenants?: TenantConfig[] };
  const tenants = parsed.tenants;
  if (!Array.isArray(tenants)) {
    throw new Error(`Registry at ${path} is malformed: expected a "tenants" array.`);
  }
  for (const t of tenants) {
    for (const field of ['tenantId', 'clientName', 'databaseSchema', 'crmProvider'] as const) {
      if (!t[field]) {
        throw new Error(`Registry entry missing required field "${field}": ${JSON.stringify(t).slice(0, 120)}`);
      }
    }
    const secret = t.crmApiSettings?.secretKeyEnvVar ?? '';
    // The registry stores env-var NAMES, never secrets. Anything that doesn't
    // look like an env-var name is treated as a leaked credential and rejected.
    if (!/^[A-Z][A-Z0-9_]*$/.test(secret)) {
      throw new Error(
        `Tenant ${t.tenantId}: secretKeyEnvVar "${secret.slice(0, 8)}…" is not an env-var name. Never store raw keys in the registry.`,
      );
    }
  }
  return tenants;
}
