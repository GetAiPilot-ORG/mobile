import { CRMAdapter, CRMContactRecord, LeadFilters, PaginatedLeadsResult } from '../adapters/crm.adapter.js';
import { VoiceAdapter } from '../adapters/voice.adapter.js';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter.js';
import { CRMActivity, JWTPayload, Lead, Pipeline, PipelineStage } from '../types/index.js';
import { PermissionService } from './permission.service.js';
import { WebSocketService } from './websocket.service.js';

export class CRMService {
  /**
   * Fetches pipelines with stages & metrics
   */
  public static async getPipelines(user: JWTPayload): Promise<Pipeline[]> {
    if (!PermissionService.hasPermission(user.permissions, 'crm.read')) {
      throw new Error('Forbidden: Missing crm.read permission');
    }
    return await CRMAdapter.getPipelines(user);
  }

  /**
   * Fetches pipeline stages definition
   */
  public static async getStages(user: JWTPayload): Promise<PipelineStage[]> {
    const pipelines = await this.getPipelines(user);
    return pipelines[0]?.stages || [];
  }

  /**
   * Fetches leads with filtering and pagination
   */
  public static async getLeads(
    user: JWTPayload,
    filters: LeadFilters = {}
  ): Promise<PaginatedLeadsResult> {
    if (!PermissionService.hasPermission(user.permissions, 'crm.read')) {
      throw new Error('Forbidden: Missing crm.read permission');
    }

    return await CRMAdapter.getLeads(user, filters);
  }

  /**
   * Fetches single lead with cross-tenant authorization check
   */
  public static async getLead(user: JWTPayload, id: string): Promise<Lead> {
    if (!PermissionService.hasPermission(user.permissions, 'crm.read')) {
      throw new Error('Forbidden: Missing crm.read permission');
    }

    const lead = await CRMAdapter.getLead(user, id);
    if (!lead) {
      throw new Error('NotFound: Lead does not exist in this organization');
    }
    return lead;
  }

  /**
   * Fetches CRM contacts list
   */
  public static async getContacts(user: JWTPayload): Promise<CRMContactRecord[]> {
    if (!PermissionService.hasPermission(user.permissions, 'crm.read')) {
      throw new Error('Forbidden: Missing crm.read permission');
    }
    return await CRMAdapter.getContacts(user);
  }

  /**
   * Creates a new lead
   */
  public static async createLead(user: JWTPayload, data: Partial<Lead>): Promise<Lead> {
    const canWrite =
      PermissionService.hasPermission(user.permissions, 'crm.write') ||
      PermissionService.hasPermission(user.permissions, 'crm.write_assigned');

    if (!canWrite) {
      throw new Error('Forbidden: Missing crm.write permission');
    }

    // Assign to creator by default if agent
    if (!data.owner && user.role === 'Agent') {
      data.owner = { id: user.user_id, name: user.email.split('@')[0] };
    }

    const newLead = await CRMAdapter.createLead(user, data);

    // Broadcast Realtime Event
    WebSocketService.broadcastToOrg(user.organization_id, 'lead.created' as any, newLead);

    return newLead;
  }

  /**
   * Updates lead with strict ownership enforcement for agents
   */
  public static async updateLead(
    user: JWTPayload,
    id: string,
    patch: Partial<Lead>
  ): Promise<Lead> {
    const existing = await this.getLead(user, id);

    // Enforce crm.write_assigned rule on backend
    if (
      !PermissionService.hasPermission(user.permissions, 'crm.write') &&
      PermissionService.hasPermission(user.permissions, 'crm.write_assigned')
    ) {
      if (existing.owner?.id !== user.user_id) {
        throw new Error('Forbidden: Agent cannot modify leads assigned to other members');
      }
    }

    const updated = await CRMAdapter.updateLead(user, id, patch);
    if (!updated) {
      throw new Error('NotFound: Lead update failed');
    }

    WebSocketService.broadcastToOrg(user.organization_id, 'lead.updated' as any, updated);

    return updated;
  }

  /**
   * Moves lead to a new pipeline stage
   */
  public static async moveLead(
    user: JWTPayload,
    id: string,
    stageId: string
  ): Promise<Lead> {
    const existing = await this.getLead(user, id);

    if (
      !PermissionService.hasPermission(user.permissions, 'crm.write') &&
      PermissionService.hasPermission(user.permissions, 'crm.write_assigned')
    ) {
      if (existing.owner?.id !== user.user_id) {
        throw new Error('Forbidden: Agent cannot move leads assigned to other members');
      }
    }

    const moved = await CRMAdapter.moveLead(
      user,
      id,
      stageId,
      user.email.split('@')[0]
    );

    if (!moved) {
      throw new Error('BadRequest: Invalid stage or lead');
    }

    WebSocketService.broadcastToOrg(user.organization_id, 'lead.stage_changed' as any, moved);

    return moved;
  }

  /**
   * Assigns lead to an owner
   */
  public static async assignLead(
    user: JWTPayload,
    id: string,
    ownerId: string,
    ownerName: string
  ): Promise<Lead> {
    if (
      !PermissionService.hasPermission(user.permissions, 'crm.write') &&
      !PermissionService.hasPermission(user.permissions, 'crm.assign')
    ) {
      throw new Error('Forbidden: Missing permission to assign leads');
    }

    const assigned = await CRMAdapter.assignLead(
      user,
      id,
      ownerId,
      ownerName,
      user.email.split('@')[0]
    );

    if (!assigned) {
      throw new Error('NotFound: Lead not found');
    }

    WebSocketService.broadcastToOrg(user.organization_id, 'lead.assigned' as any, assigned);

    return assigned;
  }

  /**
   * Gets unified timeline merging CRM events, WhatsApp messages, and Voice calls
   */
  public static async getLeadUnifiedTimeline(
    user: JWTPayload,
    id: string
  ): Promise<CRMActivity[]> {
    const lead = await this.getLead(user, id);
    const crmActivities = await CRMAdapter.getLeadActivities(user, id);

    const mergedActivities: CRMActivity[] = [...crmActivities];

    // If phone exists, fetch and merge linked voice calls
    if (lead.phone) {
      try {
        const calls = await VoiceAdapter.getCallLogs(user.organization_id);
        const matchedCalls = calls.filter((c) => c.customerPhone.includes(lead.phone!.slice(-8)));

        matchedCalls.forEach((call) => {
          mergedActivities.push({
            id: `call_${call.id}`,
            lead_id: id,
            type: 'call',
            title: `VoicePilot Call (${call.status})`,
            description: `Agent: ${call.agentName} • Duration: ${call.durationSeconds}s. Transcript: "${call.transcriptSnippet || 'N/A'}"`,
            product: 'voice',
            created_at: call.timestamp,
          });
        });
      } catch (_) {}
    }

    mergedActivities.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return mergedActivities;
  }

  /**
   * Adds an agent note to lead
   */
  public static async addLeadNote(
    user: JWTPayload,
    id: string,
    note: string
  ): Promise<CRMActivity> {
    await this.getLead(user, id);

    const activity = await CRMAdapter.addLeadNote(
      user,
      id,
      note,
      user.email.split('@')[0]
    );

    if (!activity) {
      throw new Error('BadRequest: Note could not be created');
    }

    WebSocketService.broadcastToOrg(
      user.organization_id,
      'crm.activity.created' as any,
      activity
    );

    return activity;
  }
}
