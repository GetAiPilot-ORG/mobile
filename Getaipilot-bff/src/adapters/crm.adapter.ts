import { crmSupabase } from '../services/crm/crmSupabase.js';
import { env } from '../config/env.js';
import { CRMActivity, JWTPayload, Lead, Pipeline, PipelineStage } from '../types/index.js';

export interface LeadFilters {
  pipeline_id?: string;
  stage_id?: string;
  owner_id?: string;
  status?: string;
  search?: string;
  cursor?: string;
  limit?: number;
}

export interface PaginatedLeadsResult {
  leads: Lead[];
  next_cursor?: string | null;
  total_count: number;
}

export interface CRMContactRecord {
  id: string;
  org_id: string;
  first_name: string;
  last_name: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  status: string;
  notes: string | null;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export class CRMAdapter {
  private static stagesList: Array<{ id: string; name: string; order: number }> = [
    { id: 'lead', name: 'New Lead', order: 0 },
    { id: 'qualified', name: 'Qualified', order: 1 },
    { id: 'proposal', name: 'Proposal', order: 2 },
    { id: 'negotiation', name: 'Negotiation', order: 3 },
    { id: 'closed_won', name: 'Closed Won', order: 4 },
    { id: 'closed_lost', name: 'Closed Lost', order: 5 },
  ];

  // In-memory cache for resolved CRM tenant IDs: userId/email -> crmOrgId
  private static tenantCache = new Map<string, { crmOrgId: string; fetchedAt: number }>();

  /**
   * Resolves the authoritative tenant/workspace ID inside the separate CRM Supabase database.
   */
  public static async resolveCrmOrgId(userOrOrg: JWTPayload | { user_id?: string; email?: string; organization_id?: string } | string): Promise<string> {
    if (typeof userOrOrg === 'string') {
      // If passed a direct UUID/string, check if we already cached or know it
      const cached = this.tenantCache.get(userOrOrg);
      if (cached && Date.now() - cached.fetchedAt < 300000) {
        return cached.crmOrgId;
      }
      return userOrOrg;
    }

    const userId = userOrOrg.user_id;
    const email = userOrOrg.email;
    const hubOrgId = userOrOrg.organization_id;

    const cacheKey = userId || email || hubOrgId || 'default';
    const cached = this.tenantCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < 300000) {
      return cached.crmOrgId;
    }

    try {
      // 1. Check organizations table in CRM Supabase by hub_user_id
      if (userId) {
        const { data: orgByHubUser } = await crmSupabase
          .from('organizations')
          .select('id')
          .eq('hub_user_id', userId)
          .limit(1)
          .maybeSingle();

        if (orgByHubUser?.id) {
          this.tenantCache.set(cacheKey, { crmOrgId: orgByHubUser.id, fetchedAt: Date.now() });
          return orgByHubUser.id;
        }
      }

      // 2. Check crm_members table in CRM Supabase by user email
      if (email) {
        const { data: member } = await crmSupabase
          .from('crm_members')
          .select('org_id')
          .ilike('email', email)
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (member?.org_id) {
          this.tenantCache.set(cacheKey, { crmOrgId: member.org_id, fetchedAt: Date.now() });
          return member.org_id;
        }
      }

      // 3. Check organizations table in CRM Supabase by direct ID
      if (hubOrgId) {
        const { data: orgById } = await crmSupabase
          .from('organizations')
          .select('id')
          .eq('id', hubOrgId)
          .maybeSingle();

        if (orgById?.id) {
          this.tenantCache.set(cacheKey, { crmOrgId: orgById.id, fetchedAt: Date.now() });
          return orgById.id;
        }
      }

      // Fallback
      const fallbackOrg = hubOrgId || userId || 'default_crm_org';
      this.tenantCache.set(cacheKey, { crmOrgId: fallbackOrg, fetchedAt: Date.now() });
      return fallbackOrg;
    } catch (err: any) {
      console.warn('[CRMAdapter] Tenant resolution exception:', err.message);
      return hubOrgId || 'default_crm_org';
    }
  }

  /**
   * Translates a raw CRM Supabase `crm_deals` record (with joined `crm_contacts`) into normalized `Lead`
   */
  private static normalizeDealToLead(deal: any, orgId: string): Lead {
    const contact = deal.contact || deal.crm_contacts || null;
    const stageId = deal.stage || 'lead';
    const stageObj = this.stagesList.find((s) => s.id === stageId) || { id: stageId, name: stageId };

    const contactName = contact
      ? `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
      : '';

    return {
      id: deal.id,
      organization_id: orgId,
      contact_id: deal.contact_id || null,
      name: deal.title || contactName || 'Unnamed Prospect',
      email: contact?.email || null,
      phone: contact?.phone || null,
      company: contact?.company || null,
      pipeline_id: 'pipe_default',
      stage_id: stageObj.id,
      stage_name: stageObj.name,
      owner: deal.assigned_to ? { id: deal.assigned_to, name: 'Team Member' } : null,
      value: Number(deal.value) || 0,
      currency: deal.currency || 'INR',
      source: deal.source || 'CRM Direct',
      status: stageId === 'closed_won' ? 'won' : stageId === 'closed_lost' ? 'lost' : 'active',
      notes: deal.notes || contact?.notes || null,
      created_at: deal.created_at || new Date().toISOString(),
      updated_at: deal.updated_at || new Date().toISOString(),
    };
  }

  /**
   * Fetches pipelines and stages with real-time lead counts and total values from CRM Supabase `crm_deals`
   */
  public static async getPipelines(userOrOrg: JWTPayload | any | string): Promise<Pipeline[]> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    console.log('[CRM TRACE]', {
      route: '/mobile/v1/crm/pipelines',
      userResolved: true,
      orgResolved: Boolean(crmOrgId),
      crmSupabaseConfigured: Boolean(env.CRM_SUPABASE_URL && env.CRM_SUPABASE_SERVICE_ROLE_KEY),
      queryTable: 'crm_deals',
    });

    try {
      const { data: deals, error } = await crmSupabase
        .from('crm_deals')
        .select('id, stage, value, org_id')
        .eq('org_id', crmOrgId);

      console.log('[CRM QUERY]', {
        table: 'crm_deals',
        rowCount: deals?.length ?? 0,
        hasError: Boolean(error),
        errorCode: error?.code ?? null,
      });

      if (error || !deals) {
        const stages: PipelineStage[] = this.stagesList.map((stg) => ({
          id: stg.id,
          name: stg.name,
          order: stg.order,
          lead_count: 0,
          total_value: 0,
        }));
        return [{ id: 'pipe_default', name: 'Main Sales Pipeline', stages }];
      }

      const stages: PipelineStage[] = this.stagesList.map((stg) => {
        const stageDeals = deals.filter((d) => d.stage === stg.id);
        const totalVal = stageDeals.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0);
        return {
          id: stg.id,
          name: stg.name,
          order: stg.order,
          lead_count: stageDeals.length,
          total_value: totalVal,
        };
      });

      return [{ id: 'pipe_default', name: 'Main Sales Pipeline', stages }];
    } catch (err: any) {
      console.error('[CRMAdapter] getPipelines exception:', err.message);
      const stages: PipelineStage[] = this.stagesList.map((stg) => ({
        id: stg.id,
        name: stg.name,
        order: stg.order,
        lead_count: 0,
        total_value: 0,
      }));
      return [{ id: 'pipe_default', name: 'Main Sales Pipeline', stages }];
    }
  }

  /**
   * Fetches paginated leads with filtering from CRM Supabase `crm_deals`
   */
  public static async getLeads(
    userOrOrg: JWTPayload | any | string,
    filters: LeadFilters = {}
  ): Promise<PaginatedLeadsResult> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    console.log('[CRM TRACE]', {
      route: '/mobile/v1/crm/leads',
      userResolved: true,
      orgResolved: Boolean(crmOrgId),
      crmSupabaseConfigured: Boolean(env.CRM_SUPABASE_URL && env.CRM_SUPABASE_SERVICE_ROLE_KEY),
      queryTable: 'crm_deals',
    });

    try {
      let query = crmSupabase
        .from('crm_deals')
        .select('*, contact:crm_contacts(*)', { count: 'exact' })
        .eq('org_id', crmOrgId);

      if (filters.stage_id) {
        query = query.eq('stage', filters.stage_id);
      }
      if (filters.owner_id) {
        query = query.eq('assigned_to', filters.owner_id);
      }
      if (filters.search && filters.search.trim()) {
        query = query.ilike('title', `%${filters.search.trim()}%`);
      }

      query = query.order('created_at', { ascending: false });

      const limit = Math.min(Math.max(Number(filters.limit) || 20, 1), 50);
      const { data, count, error } = await query.limit(limit);

      console.log('[CRM QUERY]', {
        table: 'crm_deals',
        rowCount: data?.length ?? 0,
        hasError: Boolean(error),
        errorCode: error?.code ?? null,
      });

      if (error || !data) {
        return {
          leads: [],
          next_cursor: null,
          total_count: 0,
        };
      }

      const normalizedLeads = data.map((deal) => this.normalizeDealToLead(deal, crmOrgId));
      return {
        leads: normalizedLeads,
        next_cursor: normalizedLeads.length === limit ? normalizedLeads[normalizedLeads.length - 1].id : null,
        total_count: count !== null ? count : normalizedLeads.length,
      };
    } catch (err: any) {
      console.error('[CRMAdapter] getLeads exception:', err.message);
      return {
        leads: [],
        next_cursor: null,
        total_count: 0,
      };
    }
  }

  /**
   * Fetches single lead by ID from CRM Supabase
   */
  public static async getLead(userOrOrg: JWTPayload | any | string, id: string): Promise<Lead | null> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    console.log('[CRM TRACE]', {
      route: `/mobile/v1/crm/leads/${id}`,
      userResolved: true,
      orgResolved: Boolean(crmOrgId),
      crmSupabaseConfigured: Boolean(env.CRM_SUPABASE_URL && env.CRM_SUPABASE_SERVICE_ROLE_KEY),
      queryTable: 'crm_deals',
    });

    try {
      const { data, error } = await crmSupabase
        .from('crm_deals')
        .select('*, contact:crm_contacts(*)')
        .eq('id', id)
        .eq('org_id', crmOrgId)
        .maybeSingle();

      console.log('[CRM QUERY]', {
        table: 'crm_deals',
        rowCount: data ? 1 : 0,
        hasError: Boolean(error),
        errorCode: error?.code ?? null,
      });

      if (error || !data) {
        return null;
      }

      return this.normalizeDealToLead(data, crmOrgId);
    } catch (err: any) {
      console.error('[CRMAdapter] getLead exception:', err.message);
      return null;
    }
  }

  /**
   * Fetches CRM contacts list from CRM Supabase `crm_contacts`
   */
  public static async getContacts(userOrOrg: JWTPayload | any | string): Promise<CRMContactRecord[]> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    console.log('[CRM TRACE]', {
      route: '/mobile/v1/crm/contacts',
      userResolved: true,
      orgResolved: Boolean(crmOrgId),
      crmSupabaseConfigured: Boolean(env.CRM_SUPABASE_URL && env.CRM_SUPABASE_SERVICE_ROLE_KEY),
      queryTable: 'crm_contacts',
    });

    try {
      const { data, error } = await crmSupabase
        .from('crm_contacts')
        .select('*')
        .eq('org_id', crmOrgId)
        .order('created_at', { ascending: false });

      console.log('[CRM QUERY]', {
        table: 'crm_contacts',
        rowCount: data?.length ?? 0,
        hasError: Boolean(error),
        errorCode: error?.code ?? null,
      });

      if (error || !data) {
        return [];
      }

      return data.map((c) => ({
        id: c.id,
        org_id: c.org_id,
        first_name: c.first_name || '',
        last_name: c.last_name || '',
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || c.company || 'Contact',
        email: c.email || null,
        phone: c.phone || null,
        company: c.company || null,
        job_title: c.job_title || null,
        status: c.status || 'lead',
        notes: c.notes || null,
        tags: Array.isArray(c.tags) ? c.tags : [],
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.updated_at || new Date().toISOString(),
      }));
    } catch (err: any) {
      console.error('[CRMAdapter] getContacts exception:', err.message);
      return [];
    }
  }

  /**
   * Creates a new deal / contact in CRM Supabase
   */
  public static async createLead(userOrOrg: JWTPayload | any | string, data: Partial<Lead>): Promise<Lead> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    console.log('[CRM TRACE]', {
      route: '/mobile/v1/crm/leads (create)',
      userResolved: true,
      orgResolved: Boolean(crmOrgId),
      crmSupabaseConfigured: Boolean(env.CRM_SUPABASE_URL && env.CRM_SUPABASE_SERVICE_ROLE_KEY),
      queryTable: 'crm_deals/crm_contacts',
    });

    try {
      // 1. If name or phone/email given, insert contact
      let contactId = data.contact_id || null;
      if (!contactId && (data.name || data.email || data.phone)) {
        const nameParts = (data.name || 'New Lead').split(' ');
        const firstName = nameParts[0] || 'New';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: contactData } = await crmSupabase
          .from('crm_contacts')
          .insert({
            org_id: crmOrgId,
            first_name: firstName,
            last_name: lastName,
            email: data.email || null,
            phone: data.phone || null,
            company: data.company || null,
            status: 'lead',
          })
          .select()
          .maybeSingle();

        if (contactData?.id) {
          contactId = contactData.id;
        }
      }

      // 2. Insert deal
      const stageId = data.stage_id || 'lead';
      const { data: dealData, error: dealError } = await crmSupabase
        .from('crm_deals')
        .insert({
          org_id: crmOrgId,
          title: data.name || 'New Deal',
          contact_id: contactId,
          value: data.value || 0,
          currency: data.currency || 'INR',
          stage: stageId,
          notes: data.notes || null,
        })
        .select('*, contact:crm_contacts(*)')
        .single();

      if (dealError || !dealData) {
        throw new Error(dealError?.message || 'Failed to insert deal');
      }

      // 3. Log initial activity
      await crmSupabase.from('crm_activities').insert({
        org_id: crmOrgId,
        deal_id: dealData.id,
        contact_id: contactId,
        type: 'note',
        subject: 'Lead Created',
        description: `Lead created with initial value ₹${(data.value || 0).toLocaleString()}`,
      });

      return this.normalizeDealToLead(dealData, crmOrgId);
    } catch (err: any) {
      console.error('[CRMAdapter] createLead exception:', err.message);
      throw err;
    }
  }

  /**
   * Updates lead details in CRM Supabase
   */
  public static async updateLead(
    userOrOrg: JWTPayload | any | string,
    id: string,
    patch: Partial<Lead>
  ): Promise<Lead | null> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    try {
      const updatePayload: Record<string, any> = { updated_at: new Date().toISOString() };
      if (patch.name !== undefined) updatePayload.title = patch.name;
      if (patch.value !== undefined) updatePayload.value = patch.value;
      if (patch.stage_id !== undefined) updatePayload.stage = patch.stage_id;
      if (patch.notes !== undefined) updatePayload.notes = patch.notes;

      const { data, error } = await crmSupabase
        .from('crm_deals')
        .update(updatePayload)
        .eq('id', id)
        .eq('org_id', crmOrgId)
        .select('*, contact:crm_contacts(*)')
        .single();

      if (error || !data) {
        return null;
      }

      return this.normalizeDealToLead(data, crmOrgId);
    } catch (err: any) {
      console.error('[CRMAdapter] updateLead exception:', err.message);
      return null;
    }
  }

  /**
   * Moves lead to another pipeline stage in CRM Supabase
   */
  public static async moveLead(
    userOrOrg: JWTPayload | any | string,
    id: string,
    stageId: string,
    actorName: string = 'User'
  ): Promise<Lead | null> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    try {
      const { data, error } = await crmSupabase
        .from('crm_deals')
        .update({ stage: stageId, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', crmOrgId)
        .select('*, contact:crm_contacts(*)')
        .single();

      if (error || !data) {
        return null;
      }

      const targetStage = this.stagesList.find((s) => s.id === stageId);
      await crmSupabase.from('crm_activities').insert({
        org_id: crmOrgId,
        deal_id: id,
        type: 'stage_change',
        subject: `Stage moved to ${targetStage?.name || stageId}`,
        description: `Lead moved stage by ${actorName}.`,
      });

      return this.normalizeDealToLead(data, crmOrgId);
    } catch (err: any) {
      console.error('[CRMAdapter] moveLead exception:', err.message);
      return null;
    }
  }

  /**
   * Assigns lead to an owner/team member in CRM Supabase
   */
  public static async assignLead(
    userOrOrg: JWTPayload | any | string,
    id: string,
    ownerId: string,
    ownerName: string,
    actorName: string = 'Admin'
  ): Promise<Lead | null> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    try {
      const { data, error } = await crmSupabase
        .from('crm_deals')
        .update({ assigned_to: ownerId, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('org_id', crmOrgId)
        .select('*, contact:crm_contacts(*)')
        .single();

      if (error || !data) {
        return null;
      }

      await crmSupabase.from('crm_activities').insert({
        org_id: crmOrgId,
        deal_id: id,
        type: 'assignment',
        subject: `Lead assigned to ${ownerName}`,
        description: `Assignment updated by ${actorName}.`,
      });

      return this.normalizeDealToLead(data, crmOrgId);
    } catch (err: any) {
      console.error('[CRMAdapter] assignLead exception:', err.message);
      return null;
    }
  }

  /**
   * Gets lead activities timeline from CRM Supabase `crm_activities`
   */
  public static async getLeadActivities(userOrOrg: JWTPayload | any | string, leadId: string): Promise<CRMActivity[]> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    try {
      const { data, error } = await crmSupabase
        .from('crm_activities')
        .select('*')
        .eq('deal_id', leadId)
        .eq('org_id', crmOrgId)
        .order('created_at', { ascending: false });

      if (error || !data) {
        return [];
      }

      return data.map((act) => ({
        id: act.id,
        lead_id: act.deal_id,
        type: act.type || 'note',
        title: act.subject || 'Activity logged',
        description: act.description || '',
        product: 'crm',
        created_at: act.created_at,
      }));
    } catch (err: any) {
      console.error('[CRMAdapter] getLeadActivities exception:', err.message);
      return [];
    }
  }

  /**
   * Adds an agent note to lead in CRM Supabase `crm_activities`
   */
  public static async addLeadNote(
    userOrOrg: JWTPayload | any | string,
    leadId: string,
    note: string,
    authorName: string = 'Agent'
  ): Promise<CRMActivity | null> {
    const crmOrgId = await this.resolveCrmOrgId(userOrOrg);

    try {
      const { data, error } = await crmSupabase
        .from('crm_activities')
        .insert({
          org_id: crmOrgId,
          deal_id: leadId,
          type: 'note',
          subject: `Note by ${authorName}`,
          description: note,
        })
        .select()
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        lead_id: data.deal_id,
        type: 'note',
        title: data.subject || `Note by ${authorName}`,
        description: data.description || note,
        product: 'crm',
        created_at: data.created_at,
      };
    } catch (err: any) {
      console.error('[CRMAdapter] addLeadNote exception:', err.message);
      return null;
    }
  }
}
