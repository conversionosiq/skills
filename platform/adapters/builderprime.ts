import type { AppointmentPayload, NormalizedLead, TenantConfig } from '../core/types.js';
import type { ICrmAdapter } from './ICrmAdapter.js';

/**
 * BuilderPrime CRM adapter (e.g. Privacy Fence Company).
 * HTTP calls are stubbed pending live credentials; field mapping should stay in
 * sync with .claude/skills/builderprime-integration/references/bp_map.json.
 */
export class BuilderPrimeAdapter implements ICrmAdapter {
  constructor(private config: TenantConfig) {}

  private getHeaders(): Record<string, string> {
    const secretKey = process.env[this.config.crmApiSettings.secretKeyEnvVar];
    if (!secretKey) {
      throw new Error(
        `Missing secret for env var ${this.config.crmApiSettings.secretKeyEnvVar} — refusing to call CRM without scoped credentials.`,
      );
    }
    return { 'x-builderprime-token': secretKey, 'Content-Type': 'application/json' };
  }

  async getLead(externalId: string): Promise<NormalizedLead> {
    // Mock of a normalized BuilderPrime record; live version fetches from baseUrl.
    return {
      externalId,
      tenantId: this.config.tenantId,
      firstName: 'Jane',
      lastName: 'Smith',
      phone: '+16165550232',
      email: 'jane.smith@fence.com',
      postalCode: '49503',
      source: 'Ace_Hardware_Canvass',
      status: 'appointment_set',
      netRevenueExpected: 4200,
      createdAt: new Date(),
    };
  }

  async pushLead(lead: NormalizedLead): Promise<string> {
    const bpPayload = {
      client_first_name: lead.firstName,
      client_last_name: lead.lastName,
      contact_number: lead.phone,
      referral_source: lead.source,
    };
    void bpPayload; // live version POSTs to `${baseUrl}` per bp_map.json
    return `bp_client_${lead.externalId || 'new'}`;
  }

  async updateAppointment(_appointment: AppointmentPayload): Promise<boolean> {
    return true;
  }
}
