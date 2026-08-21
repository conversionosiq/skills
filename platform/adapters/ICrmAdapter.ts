import type { AppointmentPayload, NormalizedLead } from '../core/types.js';

/**
 * Unified CRM interface. The rest of the platform (portals, dashboards,
 * middleware) speaks ONLY this interface — never a CRM's native payload shape.
 */
export interface ICrmAdapter {
  /** Fetch a lead from the client's CRM, normalized into the platform layout. */
  getLead(externalId: string): Promise<NormalizedLead>;

  /** Push a portal-captured lead into the client's master CRM; returns the CRM's native id. */
  pushLead(lead: NormalizedLead): Promise<string>;

  /** Schedule or update an appointment in the client's CRM. */
  updateAppointment(appointment: AppointmentPayload): Promise<boolean>;
}
