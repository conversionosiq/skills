import type { TenantConfig } from '../core/types.js';
import type { ICrmAdapter } from './ICrmAdapter.js';
import { LeadPerfectionAdapter } from './leadperfection.js';
import { BuilderPrimeAdapter } from './builderprime.js';

/** Polymorphic adapter factory — the single place a CRM provider maps to code. */
export function createAdapter(config: TenantConfig): ICrmAdapter {
  switch (config.crmProvider) {
    case 'leadperfection':
      return new LeadPerfectionAdapter(config);
    case 'builderprime':
      return new BuilderPrimeAdapter(config);
    default:
      throw new Error(
        `No CRM adapter implemented for provider "${config.crmProvider}" (tenant ${config.tenantId}).`,
      );
  }
}

export type { ICrmAdapter } from './ICrmAdapter.js';
export { LeadPerfectionAdapter } from './leadperfection.js';
export { BuilderPrimeAdapter } from './builderprime.js';
