/**
 * Core type definitions for the LKS & COSIQ multi-tenant engine.
 * Source of truth: .claude/skills/multi-tenant-architect/references/multi-tenant-crm-architecture.ts
 */

export type CrmProvider = 'leadperfection' | 'builderprime' | 'hubspot';

export interface BrandedTheme {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string;
}

export interface TenantConfig {
  tenantId: string;
  clientName: string;
  isActive: boolean;
  /** Isolated Postgres schema name, e.g. 'tenant_carolina'. */
  databaseSchema: string;
  crmProvider: CrmProvider;
  crmApiSettings: {
    baseUrl: string;
    authHeaderName: string;
    rateLimitPerMinute: number;
    /** Name of the env var holding the secret — the secret itself is NEVER stored in config. */
    secretKeyEnvVar: string;
  };
  features: {
    enableAutoDialer: boolean;
    enableSpeedToLeadSms: boolean;
    enableDynamicQueueRouting: boolean;
  };
  theme: BrandedTheme;
}

/** Normalized lead model — every CRM payload maps to this before touching DB or UI. */
export interface NormalizedLead {
  externalId: string;
  tenantId: string;
  firstName: string;
  lastName: string;
  /** E.164 sanitized format. */
  phone: string;
  email: string;
  postalCode: string;
  source: string;
  status: 'new' | 'contacted' | 'appointment_set' | 'closed_won' | 'dead';
  netRevenueExpected: number;
  createdAt: Date;
}

export interface AppointmentPayload {
  leadId: string;
  appointmentTime: Date;
  assignedRepId: string;
  status: 'scheduled' | 'issued' | 'demo_completed' | 'canceled';
}
