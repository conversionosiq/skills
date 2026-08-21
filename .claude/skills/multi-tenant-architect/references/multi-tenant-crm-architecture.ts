/**
 * LKS & COSIQ Sovereign Multi-Tenant Architecture Blueprint
 * Location: /workspace/out/multi-tenant-crm-architecture.ts
 * Description: Core Type definitions, Schema Registry, and Polymorphic CRM Adapters.
 * Target Platforms: Supabase Edge Functions, Node/TypeScript backends.
 */

// ==========================================
// 1. TENANT SCHEMAS & CONFIG REGISTRY
// ==========================================

export type CrmProvider = 'leadperfection' | 'builderprime' | 'hubspot';

export interface BrandedTheme {
  primaryColor: string; // e.g., '#0A2540' (LKS Navy)
  secondaryColor: string; // e.g., '#C9A23F' (LKS Gold)
  accentColor: string;
  logoUrl: string;
}

export interface TenantConfig {
  tenantId: string;       // Unique UUID or slug (e.g., 'carolina-home', 'privacy-fence')
  clientName: string;     // Friendly name
  isActive: boolean;
  databaseSchema: string; // Isolated Postgres schema name for Multi-tenant isolation (e.g., 'tenant_carolina')
  crmProvider: CrmProvider;
  crmApiSettings: {
    baseUrl: string;
    authHeaderName: string; // e.g. 'Authorization' or 'x-api-key'
    rateLimitPerMinute: number;
    secretKeyEnvVar: string; // Reference to environment variable containing secret (e.g. 'CAROLINA_LP_SECRET')
  };
  features: {
    enableAutoDialer: boolean;
    enableSpeedToLeadSms: boolean;
    enableDynamicQueueRouting: boolean;
  };
  theme: BrandedTheme;
}

// ==========================================
// 2. UNIFIED COSIQ COGNITIVE DATA MODELS
// ==========================================

/**
 * Normalized Lead model used internally by LKS and COSIQ portal dashboards.
 * Regardless of whether data originates from LeadPerfection, BuilderPrime, or HubSpot,
 * it is mapped strictly to this schema before touching our databases or UI.
 */
export interface NormalizedLead {
  externalId: string;      // Original ID in client's native CRM
  tenantId: string;
  firstName: string;
  lastName: string;
  phone: string;           // E.164 sanitized format
  email: string;
  postalCode: string;
  source: string;          // Marketing campaign source
  status: 'new' | 'contacted' | 'appointment_set' | 'closed_won' | 'dead';
  netRevenueExpected: number; // Sovereign Expected Net Revenue Per Lead (NRPL)
  createdAt: Date;
}

export interface AppointmentPayload {
  leadId: string;
  appointmentTime: Date;
  assignedRepId: string;
  status: 'scheduled' | 'issued' | 'demo_completed' | 'canceled';
}

// ==========================================
// 3. POLYMORPHIC CRM ADAPTERS
// ==========================================

export interface ICrmAdapter {
  /**
   * Fetch a lead from the client's CRM and normalize it into our platform's layout
   */
  getLead(externalId: string): Promise<NormalizedLead>;

  /**
   * Push a newly captured lead from our Lovable Portal back into the client's master CRM
   */
  pushLead(lead: NormalizedLead): Promise<string>;

  /**
   * Schedule or update an appointment in the client's CRM
   */
  updateAppointment(appointment: AppointmentPayload): Promise<boolean>;
}

/**
 * Concrete Adapter for Carolina Home Remodeling (CHR) -> LeadPerfection CRM
 */
export class LeadPerfectionAdapter implements ICrmAdapter {
  private config: TenantConfig;

  constructor(config: TenantConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    const secretKey = process.env[this.config.crmApiSettings.secretKeyEnvVar];
    if (!secretKey) {
      throw new Error(`Critical System Misconfiguration: Missing secret key for env var: ${this.config.crmApiSettings.secretKeyEnvVar}`);
    }
    return {
      [this.config.crmApiSettings.authHeaderName]: `Bearer ${secretKey}`,
      'Content-Type': 'application/json',
    };
  }

  async getLead(externalId: string): Promise<NormalizedLead> {
    const url = `${this.config.crmApiSettings.baseUrl}/api/v1/leads/${externalId}`;
    
    // In a real execution, we would call our secure http client:
    // const response = await fetch(url, { headers: this.getHeaders() });
    // const rawLead = await response.json();
    
    // MOCK normalisation of raw LeadPerfection payloads:
    const mockRawLead = {
      LeadId: externalId,
      FName: "John",
      LName: "Doe",
      PrimaryPhone: "3145550199",
      EmailAddress: "john.doe@example.com",
      CampaignSourceCode: "Google_AdWords_HVAC",
      EstProjectCost: 15000,
      StatusDescription: "NEW_LEAD"
    };

    return {
      externalId: mockRawLead.LeadId,
      tenantId: this.config.tenantId,
      firstName: mockRawLead.FName,
      lastName: mockRawLead.LName,
      phone: `+1${mockRawLead.PrimaryPhone.replace(/\D/g, '')}`, // Sanitize to E.164
      email: mockRawLead.EmailAddress,
      postalCode: "63017", // Mock
      source: mockRawLead.CampaignSourceCode,
      status: 'new',
      netRevenueExpected: mockRawLead.EstProjectCost * 0.42, // Sovereign baseline conversion expectation (42%)
      createdAt: new Date(),
    };
  }

  async pushLead(lead: NormalizedLead): Promise<string> {
    const url = `${this.config.crmApiSettings.baseUrl}/api/v1/leads`;
    
    // Map internal normalized structure to LeadPerfection expectations:
    const lpPayload = {
      FName: lead.firstName,
      LName: lead.lastName,
      Phone_1: lead.phone.replace('+1', ''),
      Email: lead.email,
      Campaign: lead.source,
      TenantRef: lead.tenantId
    };

    console.log(`[LeadPerfectionAdapter] Safely pushing normalized lead to LP CRM:`, lpPayload);
    // return rawLeadId from CRM response
    return `lp_lead_${Math.floor(Math.random() * 100000)}`;
  }

  async updateAppointment(appointment: AppointmentPayload): Promise<boolean> {
    console.log(`[LeadPerfectionAdapter] Updating Appointment in LeadPerfection:`, appointment);
    return true;
  }
}

/**
 * Concrete Adapter for Privacy Fence Company -> BuilderPrime CRM
 */
export class BuilderPrimeAdapter implements ICrmAdapter {
  private config: TenantConfig;

  constructor(config: TenantConfig) {
    this.config = config;
  }

  private getHeaders(): Record<string, string> {
    const secretKey = process.env[this.config.crmApiSettings.secretKeyEnvVar];
    if (!secretKey) {
      throw new Error(`Security Fail: Missing key for ${this.config.crmApiSettings.secretKeyEnvVar}`);
    }
    return {
      'x-builderprime-token': secretKey,
      'Content-Type': 'application/json'
    };
  }

  async getLead(externalId: string): Promise<NormalizedLead> {
    // BuilderPrime normalisation logic
    return {
      externalId,
      tenantId: this.config.tenantId,
      firstName: "Jane",
      lastName: "Smith",
      phone: "+16165550232",
      email: "jane.smith@fence.com",
      postalCode: "49503",
      source: "Ace_Hardware_Canvass",
      status: 'appointment_set',
      netRevenueExpected: 4200, // Based on average fencing tickets
      createdAt: new Date()
    };
  }

  async pushLead(lead: NormalizedLead): Promise<string> {
    const bpPayload = {
      client_first_name: lead.firstName,
      client_last_name: lead.lastName,
      contact_number: lead.phone,
      referral_source: lead.source,
    };
    console.log(`[BuilderPrimeAdapter] Pushing normalized lead:`, bpPayload);
    return `bp_client_${Math.floor(Math.random() * 100000)}`;
  }

  async updateAppointment(appointment: AppointmentPayload): Promise<boolean> {
    console.log(`[BuilderPrimeAdapter] Scheduling event:`, appointment);
    return true;
  }
}

// ==========================================
// 4. TENANT DICTATOR (DYNAMIC ROUTING MIDDLEWARE)
// ==========================================

export class MultiTenantManager {
  // A mock database of our config registry.
  // In production, this table would reside in your global 'public' Supabase schema.
  private tenantRegistry: Map<string, TenantConfig> = new Map();

  constructor(initialConfigs: TenantConfig[]) {
    for (const config of initialConfigs) {
      this.tenantRegistry.set(config.tenantId, config);
    }
  }

  /**
   * Dynmically resolves the database schema and CRM class at runtime based on incoming tenant_id.
   * Eliminates the need to start over or deploy duplicate repositories!
   */
  public resolveTenant(tenantId: string): { 
    config: TenantConfig; 
    adapter: ICrmAdapter; 
    dbSchema: string 
  } {
    const config = this.tenantRegistry.get(tenantId);
    if (!config) {
      throw new Error(`Tenant Isolation Breach Alert: Request attempted for non-existent Tenant ID "${tenantId}"`);
    }

    if (!config.isActive) {
      throw new Error(`Authorization Error: Tenant "${config.clientName}" is currently suspended.`);
    }

    let adapter: ICrmAdapter;

    switch (config.crmProvider) {
      case 'leadperfection':
        adapter = new LeadPerfectionAdapter(config);
        break;
      case 'builderprime':
        adapter = new BuilderPrimeAdapter(config);
        break;
      default:
        throw new Error(`Unsupported CRM Adapter configured for tenant ${tenantId}`);
    }

    return {
      config,
      adapter,
      dbSchema: config.databaseSchema
    };
  }
}
