import type { AppointmentPayload, NormalizedLead, TenantConfig } from '../core/types.js';
import type { ICrmAdapter } from './ICrmAdapter.js';

/**
 * LeadPerfection CRM adapter (e.g. Carolina Home Remodeling).
 * HTTP calls are stubbed pending live credentials — the normalization mapping
 * is the contract under test. Replace the mock payloads with fetch() calls
 * against crmApiSettings.baseUrl when wiring a real tenant.
 */
export class LeadPerfectionAdapter implements ICrmAdapter {
  constructor(private config: TenantConfig) {}

  private getHeaders(): Record<string, string> {
    const secretKey = process.env[this.config.crmApiSettings.secretKeyEnvVar];
    if (!secretKey) {
      throw new Error(
        `Missing secret for env var ${this.config.crmApiSettings.secretKeyEnvVar} — refusing to call CRM without scoped credentials.`,
      );
    }
    return {
      [this.config.crmApiSettings.authHeaderName]: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getLead(externalId: string): Promise<NormalizedLead> {
    // Mock of a raw LeadPerfection payload; live version fetches
    // `${baseUrl}/api/v1/leads/${externalId}` with this.getHeaders().
    const raw = {
      LeadId: externalId,
      FName: 'John',
      LName: 'Doe',
      PrimaryPhone: '3145550199',
      EmailAddress: 'john.doe@example.com',
      Zip: '63017',
      CampaignSourceCode: 'Google_AdWords_HVAC',
      EstProjectCost: 15000,
      StatusDescription: 'NEW_LEAD',
    };

    return {
      externalId: raw.LeadId,
      tenantId: this.config.tenantId,
      firstName: raw.FName,
      lastName: raw.LName,
      phone: `+1${raw.PrimaryPhone.replace(/\D/g, '')}`,
      email: raw.EmailAddress.toLowerCase(),
      postalCode: raw.Zip,
      source: raw.CampaignSourceCode,
      status: 'new',
      netRevenueExpected: raw.EstProjectCost * 0.42,
      createdAt: new Date(),
    };
  }

  async pushLead(lead: NormalizedLead): Promise<string> {
    // Map the normalized structure to LeadPerfection's expected fields.
    const lpPayload = {
      FName: lead.firstName,
      LName: lead.lastName,
      Phone_1: lead.phone.replace('+1', ''),
      Email: lead.email,
      Campaign: lead.source,
      TenantRef: lead.tenantId,
    };
    void lpPayload; // live version POSTs to `${baseUrl}/api/v1/leads`
    return `lp_lead_${lead.externalId || 'new'}`;
  }

  async updateAppointment(_appointment: AppointmentPayload): Promise<boolean> {
    return true;
  }
}
