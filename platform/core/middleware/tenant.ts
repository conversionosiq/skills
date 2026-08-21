import type { TenantConfig } from '../types.js';
import type { ICrmAdapter } from '../../adapters/ICrmAdapter.js';
import { createAdapter } from '../../adapters/index.js';

/**
 * Claims from a JWT that the auth layer (e.g. Supabase Auth) has ALREADY
 * verified. This middleware never decodes or verifies tokens itself — passing
 * unverified claims here defeats tenant isolation entirely.
 */
export interface VerifiedClaims {
  tenant_id?: unknown;
  [claim: string]: unknown;
}

/** Everything a request handler needs, scoped to exactly one tenant. */
export interface TenantContext {
  config: TenantConfig;
  adapter: ICrmAdapter;
  /** Postgres schema to scope the DB client to (or the RLS tenant context). */
  dbSchema: string;
}

export function extractTenantId(claims: VerifiedClaims): string {
  const id = claims.tenant_id;
  if (typeof id !== 'string' || id.length === 0) {
    // Fail closed: a request with no tenant identity gets nothing, not a default tenant.
    throw new Error('Tenant resolution refused: verified JWT carries no tenant_id claim.');
  }
  return id;
}

/**
 * Resolves database schema and CRM adapter at runtime from tenant metadata —
 * one engine, every client, no duplicated repositories.
 */
export class MultiTenantManager {
  private tenantRegistry = new Map<string, TenantConfig>();

  constructor(initialConfigs: TenantConfig[]) {
    for (const config of initialConfigs) {
      this.tenantRegistry.set(config.tenantId, config);
    }
  }

  public resolveTenant(tenantId: string): TenantContext {
    const config = this.tenantRegistry.get(tenantId);
    if (!config) {
      throw new Error(`Tenant isolation: rejected request for unknown tenant id "${tenantId}".`);
    }
    if (!config.isActive) {
      throw new Error(`Tenant "${config.clientName}" is suspended; request rejected.`);
    }
    return { config, adapter: createAdapter(config), dbSchema: config.databaseSchema };
  }

  /** The per-request entry point: verified claims in, tenant-scoped context out. */
  public resolveFromClaims(claims: VerifiedClaims): TenantContext {
    return this.resolveTenant(extractTenantId(claims));
  }
}
