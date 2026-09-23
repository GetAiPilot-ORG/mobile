import { crmSupabase } from './crmSupabase.js';
import { JWTPayload } from '../../types/index.js';
import {
  CRMActivity,
  CRMContact,
  CRMContext,
  CRMDashboardSummary,
  CRMDeal,
  CRMMember,
  CRMTask,
  DealStage,
} from '../../types/crm.types.js';

export const PIPELINE_STAGES: Array<{ id: DealStage; label: string; color: string; order: number }> = [
  { id: 'lead', label: 'Lead', color: '#6B7280', order: 1 },
  { id: 'qualified', label: 'Qualified', color: '#3B82F6', order: 2 },
  { id: 'proposal', label: 'Proposal', color: '#F59E0B', order: 3 },
  { id: 'negotiation', label: 'Negotiation', color: '#8B5CF6', order: 4 },
  { id: 'closed_won', label: 'Closed Won', color: '#10B981', order: 5 },
  { id: 'closed_lost', label: 'Closed Lost', color: '#EF4444', order: 6 },
];

export class CRMRepository {
  private static contextCache = new Map<string, { context: CRMContext; fetchedAt: number }>();
  private static membersMapCache = new Map<string, { members: Map<string, CRMMember>; fetchedAt: number }>();

  /**
   * Resolves canonical CRM Context (org_id, member_id, role, permissions) from user JWT
   */
  public static async resolveCrmContext(user: JWTPayload | { user_id?: string; email?: string; organization_id?: string; role?: string }): Promise<CRMContext> {
    const userId = user.user_id || '';
    const email = user.email || '';
    const hubOrgId = user.organization_id || '';
    const cacheKey = `${userId}:${email}:${hubOrgId}`;

    const cached = this.contextCache.get(cacheKey);
    if (cached && Date.now() - cached.fetchedAt < 300000) {
      return cached.context;
    }

    let crmOrgId = '';
    let crmMemberId = userId;
    let crmRole = user.role || 'sales';
    let permissions: Record<string, boolean> = {};

    try {
      // 1. Check crm_members by email
      if (email) {
        const { data: member } = await crmSupabase
          .from('crm_members')
          .select('id, org_id, role, is_active')
          .ilike('email', email)
          .eq('is_deleted', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (member?.org_id) {
          crmOrgId = member.org_id;
          crmMemberId = member.id;
          crmRole = member.role || 'sales';
        }
      }

      // 2. Check organizations table by hub_user_id or id if org not found
      if (!crmOrgId && userId) {
        const { data: orgByHubUser } = await crmSupabase
          .from('organizations')
          .select('id')
          .eq('hub_user_id', userId)
          .limit(1)
          .maybeSingle();

        if (orgByHubUser?.id) {
          crmOrgId = orgByHubUser.id;
        }
      }

      if (!crmOrgId && hubOrgId) {
        const { data: orgById } = await crmSupabase
          .from('organizations')
          .select('id')
          .eq('id', hubOrgId)
          .maybeSingle();

        if (orgById?.id) {
          crmOrgId = orgById.id;
        }
      }

      // Fallback
      if (!crmOrgId) {
        const { data: firstOrg } = await crmSupabase
          .from('organizations')
          .select('id')
          .limit(1)
          .maybeSingle();
        crmOrgId = firstOrg?.id || hubOrgId || 'default_crm_org';
      }

      // 3. Load permissions from crm_roles
      if (crmOrgId && crmRole) {
        const { data: roleDoc } = await crmSupabase
          .from('crm_roles')
          .select('permissions')
          .eq('org_id', crmOrgId)
          .ilike('name', crmRole)
          .maybeSingle();

        if (roleDoc?.permissions) {
          permissions = roleDoc.permissions;
        }
      }

      const context: CRMContext = {
        hubUserId: userId,
        hubOrgId,
        crmOrgId,
        crmMemberId,
        crmRole,
        permissions,
      };

      this.contextCache.set(cacheKey, { context, fetchedAt: Date.now() });
      return context;
    } catch (err: any) {
      console.warn('[CRMRepository] Error resolving CRM context:', err.message);
      return {
        hubUserId: userId,
        hubOrgId,
        crmOrgId: hubOrgId || 'default_crm_org',
        crmMemberId: userId,
        crmRole: 'sales',
        permissions: {},
      };
    }
  }

  private static async getMembersMap(orgId: string): Promise<Map<string, CRMMember>> {
    const cached = this.membersMapCache.get(orgId);
    if (cached && Date.now() - cached.fetchedAt < 60000) {
      return cached.members;
    }

    const members = await this.getMembers(orgId);
    const map = new Map<string, CRMMember>();
    for (const m of members) {
      map.set(m.id, m);
    }
    this.membersMapCache.set(orgId, { members: map, fetchedAt: Date.now() });
    return map;
  }

  // ── Dashboard Summary ──────────────────────────────────────────────────────

  public static async getDashboardSummary(orgId: string): Promise<CRMDashboardSummary> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const todayStr = now.toISOString().split('T')[0];

    const [
      allContactsRes,
      leadsRes,
      newContactsRes,
      dealsRes,
      tasksDueRes,
      overdueTasksRes,
      activitiesRes,
      wonDealsRes,
      teamRes,
      recentLeadsRes,
      upcomingTasksRes,
      recentActivitiesRes,
      membersMap,
    ] = await Promise.all([
      crmSupabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId),
      crmSupabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('status', 'lead'),
      crmSupabase.from('crm_contacts').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', startOfMonth),
      crmSupabase.from('crm_deals').select('id, value, stage').eq('org_id', orgId),
      crmSupabase.from('crm_tasks').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('due_date', todayStr).neq('status', 'done'),
      crmSupabase.from('crm_tasks').select('id', { count: 'exact', head: true }).eq('org_id', orgId).lt('due_date', todayStr).neq('status', 'done'),
      crmSupabase.from('crm_activities').select('id', { count: 'exact', head: true }).eq('org_id', orgId).gte('created_at', startOfWeek),
      crmSupabase.from('crm_deals').select('id, value').eq('org_id', orgId).eq('stage', 'closed_won').gte('updated_at', startOfMonth),
      crmSupabase.from('crm_members').select('id', { count: 'exact', head: true }).eq('org_id', orgId).eq('is_active', true),
      crmSupabase.from('crm_contacts').select('*').eq('org_id', orgId).eq('status', 'lead').order('created_at', { ascending: false }).limit(5),
      crmSupabase.from('crm_tasks').select('*').eq('org_id', orgId).neq('status', 'done').order('due_date', { ascending: true, nullsFirst: false }).limit(5),
      crmSupabase.from('crm_activities').select('*, contact:crm_contacts(id, first_name, last_name), deal:crm_deals(id, title)').eq('org_id', orgId).order('created_at', { ascending: false }).limit(6),
      this.getMembersMap(orgId),
    ]);

    const allDeals = dealsRes.data || [];
    const openDeals = allDeals.filter((d) => !['closed_won', 'closed_lost'].includes(d.stage));
    const totalDealValue = openDeals.reduce((sum, d) => sum + (Number(d.value) || 0), 0);
    const wonDealsList = wonDealsRes.data || [];
    const wonDealValue = wonDealsList.reduce((sum, d) => sum + (Number(d.value) || 0), 0);

    const pipelineSummary = PIPELINE_STAGES.map((s) => {
      const dealsInStage = allDeals.filter((d) => d.stage === s.id);
      return {
        stage: s.id,
        label: s.label,
        color: s.color,
        count: dealsInStage.length,
        totalValue: dealsInStage.reduce((sum, d) => sum + (Number(d.value) || 0), 0),
      };
    });

    return {
      stats: {
        totalContacts: allContactsRes.count || 0,
        totalLeads: leadsRes.count || 0,
        newContactsThisMonth: newContactsRes.count || 0,
        openDeals: openDeals.length,
        totalDealValue,
        wonDealsThisMonth: wonDealsList.length,
        wonDealValueThisMonth: wonDealValue,
        tasksDueToday: tasksDueRes.count || 0,
        overdueTasks: overdueTasksRes.count || 0,
        activitiesThisWeek: activitiesRes.count || 0,
        teamCount: teamRes.count || 0,
      },
      recentLeads: ((recentLeadsRes.data || []) as any[]).map(c => ({
        ...c,
        name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed Lead',
        assignee: c.assigned_to ? membersMap.get(c.assigned_to) : null,
      })),
      upcomingTasks: ((upcomingTasksRes.data || []) as any[]).map(t => ({
        ...t,
        assignee: t.assigned_to ? membersMap.get(t.assigned_to) : null,
      })),
      recentActivities: (recentActivitiesRes.data || []) as CRMActivity[],
      pipelineSummary,
    };
  }

  // ── Contacts / Leads ───────────────────────────────────────────────────────

  public static async getContacts(
    orgId: string,
    filters: { status?: string; search?: string; assigned_to?: string; limit?: number; offset?: number }
  ): Promise<{ contacts: CRMContact[]; totalCount: number }> {
    let query = crmSupabase
      .from('crm_contacts')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    if (filters.assigned_to && filters.assigned_to !== 'all') {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term},company.ilike.${term},phone.ilike.${term}`);
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const [{ data, error, count }, membersMap] = await Promise.all([
      query.order('created_at', { ascending: false }).range(offset, offset + limit - 1),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;

    const contacts: CRMContact[] = (data || []).map((c: any) => ({
      ...c,
      name: `${c.first_name || ''} ${c.last_name || ''}`.trim() || 'Unnamed Contact',
      assignee: c.assigned_to ? membersMap.get(c.assigned_to) : null,
    }));

    return {
      contacts,
      totalCount: count || contacts.length,
    };
  }

  public static async getContactById(orgId: string, id: string): Promise<CRMContact | null> {
    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_contacts').select('*').eq('id', id).eq('org_id', orgId).maybeSingle(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    if (!data) return null;

    return {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Unnamed Contact',
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async createContact(orgId: string, payload: Partial<CRMContact>): Promise<CRMContact> {
    const insertData = {
      org_id: orgId,
      first_name: payload.first_name?.trim() || 'New',
      last_name: payload.last_name?.trim() || 'Contact',
      email: payload.email?.trim() || null,
      phone: payload.phone?.trim() || null,
      company: payload.company?.trim() || null,
      job_title: payload.job_title?.trim() || null,
      status: payload.status || 'lead',
      assigned_to: payload.assigned_to || null,
      notes: payload.notes || null,
      tags: payload.tags || [],
    };

    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_contacts').insert(insertData).select().single(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async updateContact(orgId: string, id: string, payload: Partial<CRMContact>): Promise<CRMContact> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };
    delete updateData.id;
    delete updateData.org_id;
    delete updateData.assignee;
    delete updateData.name;

    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_contacts').update(updateData).eq('id', id).eq('org_id', orgId).select().single(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return {
      ...data,
      name: `${data.first_name || ''} ${data.last_name || ''}`.trim(),
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async deleteContact(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_contacts')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Deals / Pipeline ───────────────────────────────────────────────────────

  public static async getDeals(
    orgId: string,
    filters: { stage?: string; assigned_to?: string; search?: string; contact_id?: string }
  ): Promise<CRMDeal[]> {
    let query = crmSupabase
      .from('crm_deals')
      .select('*, contact:crm_contacts(*)')
      .eq('org_id', orgId);

    if (filters.stage && filters.stage !== 'all') {
      query = query.eq('stage', filters.stage);
    }
    if (filters.assigned_to && filters.assigned_to !== 'all') {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }
    if (filters.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.ilike('title', term);
    }

    const [{ data, error }, membersMap] = await Promise.all([
      query.order('created_at', { ascending: false }),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return (data || []).map((d: any) => ({
      ...d,
      assignee: d.assigned_to ? membersMap.get(d.assigned_to) : null,
    }));
  }

  public static async getDealById(orgId: string, id: string): Promise<CRMDeal | null> {
    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_deals').select('*, contact:crm_contacts(*)').eq('id', id).eq('org_id', orgId).maybeSingle(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async createDeal(orgId: string, payload: Partial<CRMDeal>): Promise<CRMDeal> {
    const insertData = {
      org_id: orgId,
      title: payload.title?.trim() || 'New Deal',
      contact_id: payload.contact_id || null,
      value: payload.value !== undefined ? Number(payload.value) : 0,
      currency: payload.currency || 'INR',
      stage: payload.stage || 'lead',
      expected_close_date: payload.expected_close_date || null,
      assigned_to: payload.assigned_to || null,
      probability: payload.probability !== undefined ? Number(payload.probability) : null,
      notes: payload.notes || null,
    };

    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_deals').insert(insertData).select('*, contact:crm_contacts(*)').single(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return {
      ...data,
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async updateDeal(orgId: string, id: string, payload: Partial<CRMDeal>): Promise<CRMDeal> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };
    delete updateData.id;
    delete updateData.org_id;
    delete updateData.contact;
    delete updateData.assignee;

    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_deals').update(updateData).eq('id', id).eq('org_id', orgId).select('*, contact:crm_contacts(*)').single(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return {
      ...data,
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async updateDealStage(orgId: string, id: string, stage: DealStage): Promise<CRMDeal> {
    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_deals').update({ stage, updated_at: new Date().toISOString() }).eq('id', id).eq('org_id', orgId).select('*, contact:crm_contacts(*)').single(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return {
      ...data,
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async deleteDeal(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_deals')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Tasks & Follow-ups ─────────────────────────────────────────────────────

  public static async getTasks(
    orgId: string,
    filters: {
      status?: string;
      priority?: string;
      assigned_to?: string;
      contact_id?: string;
      deal_id?: string;
      timeframe?: 'today' | 'upcoming' | 'overdue' | 'completed' | 'all';
    }
  ): Promise<CRMTask[]> {
    let query = crmSupabase
      .from('crm_tasks')
      .select('*')
      .eq('org_id', orgId);

    const todayStr = new Date().toISOString().split('T')[0];

    if (filters.timeframe === 'today') {
      query = query.eq('due_date', todayStr).neq('status', 'done');
    } else if (filters.timeframe === 'upcoming') {
      query = query.gt('due_date', todayStr).neq('status', 'done');
    } else if (filters.timeframe === 'overdue') {
      query = query.lt('due_date', todayStr).neq('status', 'done');
    } else if (filters.timeframe === 'completed') {
      query = query.eq('status', 'done');
    }

    if (filters.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }
    if (filters.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority);
    }
    if (filters.assigned_to && filters.assigned_to !== 'all') {
      query = query.eq('assigned_to', filters.assigned_to);
    }
    if (filters.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }
    if (filters.deal_id) {
      query = query.eq('deal_id', filters.deal_id);
    }

    const [{ data, error }, membersMap] = await Promise.all([
      query.order('due_date', { ascending: true, nullsFirst: false }),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return (data || []).map((t: any) => ({
      ...t,
      assignee: t.assigned_to ? membersMap.get(t.assigned_to) : null,
    }));
  }

  public static async getTaskById(orgId: string, id: string): Promise<CRMTask | null> {
    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_tasks').select('*').eq('id', id).eq('org_id', orgId).maybeSingle(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    if (!data) return null;
    return {
      ...data,
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async createTask(orgId: string, payload: Partial<CRMTask>): Promise<CRMTask> {
    const insertData = {
      org_id: orgId,
      title: payload.title?.trim() || 'New Task',
      description: payload.description || null,
      priority: payload.priority || 'medium',
      status: payload.status || 'todo',
      due_date: payload.due_date || null,
      assigned_to: payload.assigned_to || null,
      contact_id: payload.contact_id || null,
      deal_id: payload.deal_id || null,
    };

    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_tasks').insert(insertData).select().single(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return {
      ...data,
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async updateTask(orgId: string, id: string, payload: Partial<CRMTask>): Promise<CRMTask> {
    const updateData: any = {
      ...payload,
      updated_at: new Date().toISOString(),
    };
    delete updateData.id;
    delete updateData.org_id;
    delete updateData.contact;
    delete updateData.deal;
    delete updateData.assignee;

    const [{ data, error }, membersMap] = await Promise.all([
      crmSupabase.from('crm_tasks').update(updateData).eq('id', id).eq('org_id', orgId).select().single(),
      this.getMembersMap(orgId),
    ]);

    if (error) throw error;
    return {
      ...data,
      assignee: data.assigned_to ? membersMap.get(data.assigned_to) : null,
    };
  }

  public static async toggleTask(orgId: string, id: string, done: boolean): Promise<CRMTask> {
    const status = done ? 'done' : 'todo';
    return this.updateTask(orgId, id, { status } as any);
  }

  public static async deleteTask(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_tasks')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Activities & Timeline ──────────────────────────────────────────────────

  public static async getActivities(
    orgId: string,
    filters: {
      type?: string;
      contact_id?: string;
      deal_id?: string;
      assigned_to?: string;
      search?: string;
      limit?: number;
    }
  ): Promise<CRMActivity[]> {
    let query = crmSupabase
      .from('crm_activities')
      .select('*, contact:crm_contacts(id, first_name, last_name), deal:crm_deals(id, title)')
      .eq('org_id', orgId);

    if (filters.type && filters.type !== 'all') {
      query = query.eq('type', filters.type);
    }
    if (filters.contact_id) {
      query = query.eq('contact_id', filters.contact_id);
    }
    if (filters.deal_id) {
      query = query.eq('deal_id', filters.deal_id);
    }
    if (filters.search && filters.search.trim() !== '') {
      const term = `%${filters.search.trim()}%`;
      query = query.or(`subject.ilike.${term},description.ilike.${term}`);
    }

    const limit = filters.limit || 100;
    const { data, error } = await query.order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []) as CRMActivity[];
  }

  public static async createActivity(orgId: string, payload: Partial<CRMActivity>): Promise<CRMActivity> {
    const insertData: any = {
      org_id: orgId,
      type: payload.type || 'note',
      subject: payload.subject?.trim() || 'Activity Note',
      description: payload.description || null,
      contact_id: payload.contact_id || null,
      deal_id: payload.deal_id || null,
      created_by: payload.created_by || null,
      scheduled_for: payload.scheduled_for || null,
      completed_at: payload.completed_at || null,
    };

    const { data, error } = await crmSupabase
      .from('crm_activities')
      .insert(insertData)
      .select('*, contact:crm_contacts(id, first_name, last_name), deal:crm_deals(id, title)')
      .single();

    if (error) throw error;
    return data as CRMActivity;
  }

  public static async updateActivityStatus(orgId: string, id: string, status: string): Promise<CRMActivity> {
    const completed_at = status === 'completed' ? new Date().toISOString() : null;
    const { data, error } = await crmSupabase
      .from('crm_activities')
      .update({ completed_at, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data as CRMActivity;
  }

  public static async deleteActivity(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_activities')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }


  // ── Team Members ───────────────────────────────────────────────────────────

  public static async getMembers(orgId: string): Promise<CRMMember[]> {
    const { data, error } = await crmSupabase
      .from('crm_members')
      .select('id, org_id, name, email, role, is_active, birthday, created_at')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  public static async getMembersFull(orgId: string): Promise<any[]> {
    const { data, error } = await crmSupabase
      .from('crm_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .order('name', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  public static async getMemberById(orgId: string, id: string): Promise<any | null> {
    const { data, error } = await crmSupabase
      .from('crm_members')
      .select('*')
      .eq('org_id', orgId)
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async createMember(orgId: string, memberData: any): Promise<any> {
    const { data, error } = await crmSupabase
      .from('crm_members')
      .insert({ ...memberData, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async updateMember(orgId: string, id: string, patch: any): Promise<any> {
    const { data, error } = await crmSupabase
      .from('crm_members')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async deleteMember(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_members')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Organization ───────────────────────────────────────────────────────────

  public static async getOrganization(orgId: string): Promise<any | null> {
    const { data, error } = await crmSupabase
      .from('organizations')
      .select('*, plan:crm_plans(id, name, emoji, tagline, price_min, price_max, price_display)')
      .eq('id', orgId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  // ── Invoices ───────────────────────────────────────────────────────────────

  public static async getInvoices(orgId: string, filters: { status?: string; contact_id?: string; limit?: number; offset?: number } = {}): Promise<{ invoices: any[]; total_count: number }> {
    let query = crmSupabase
      .from('crm_invoices')
      .select('*, contact:crm_contacts(id, first_name, last_name, email, phone, company)', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.contact_id) query = query.eq('contact_id', filters.contact_id);
    query = query.order('created_at', { ascending: false }).limit(filters.limit || 50);
    if (filters.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);

    const { data, count, error } = await query;
    if (error) throw error;
    return { invoices: data || [], total_count: count || 0 };
  }

  public static async getInvoiceById(orgId: string, id: string): Promise<any | null> {
    const { data, error } = await crmSupabase
      .from('crm_invoices')
      .select('*, items:crm_invoice_items(*), contact:crm_contacts(id, first_name, last_name, email, phone, company)')
      .eq('org_id', orgId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async createInvoice(orgId: string, data: any): Promise<any> {
    const { data: created, error } = await crmSupabase
      .from('crm_invoices')
      .insert({ ...data, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  public static async updateInvoice(orgId: string, id: string, patch: any): Promise<any> {
    const { data, error } = await crmSupabase
      .from('crm_invoices')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async deleteInvoice(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_invoices')
      .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Quotations ─────────────────────────────────────────────────────────────

  public static async getQuotations(orgId: string, filters: { status?: string; contact_id?: string; limit?: number; offset?: number } = {}): Promise<{ quotations: any[]; total_count: number }> {
    let query = crmSupabase
      .from('crm_quotations')
      .select('*, contact:crm_contacts(id, first_name, last_name, email, company)', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.status) query = query.eq('status', filters.status);
    if (filters.contact_id) query = query.eq('contact_id', filters.contact_id);
    query = query.order('created_at', { ascending: false }).limit(filters.limit || 50);

    const { data, count, error } = await query;
    if (error) throw error;
    return { quotations: data || [], total_count: count || 0 };
  }

  public static async getQuotationById(orgId: string, id: string): Promise<any | null> {
    const { data, error } = await crmSupabase
      .from('crm_quotations')
      .select('*, items:crm_quotation_items(*), contact:crm_contacts(id, first_name, last_name, email, company)')
      .eq('org_id', orgId)
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async createQuotation(orgId: string, data: any): Promise<any> {
    const { data: created, error } = await crmSupabase
      .from('crm_quotations')
      .insert({ ...data, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  public static async updateQuotation(orgId: string, id: string, patch: any): Promise<any> {
    const { data, error } = await crmSupabase
      .from('crm_quotations')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async deleteQuotation(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_quotations')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Billing Profiles (Client Profiles) ────────────────────────────────────

  public static async getBillingProfiles(orgId: string, filters: { contact_id?: string; limit?: number } = {}): Promise<{ profiles: any[]; total_count: number }> {
    let query = crmSupabase
      .from('crm_billing_profiles')
      .select('*, contact:crm_contacts(id, first_name, last_name, email, company)', { count: 'exact' })
      .eq('org_id', orgId)
      .eq('is_deleted', false);

    if (filters.contact_id) query = query.eq('contact_id', filters.contact_id);
    query = query.order('created_at', { ascending: false }).limit(filters.limit || 50);

    const { data, count, error } = await query;
    if (error) throw error;
    return { profiles: data || [], total_count: count || 0 };
  }

  public static async getBillingProfileById(orgId: string, id: string): Promise<any | null> {
    const { data, error } = await crmSupabase
      .from('crm_billing_profiles')
      .select('*, contact:crm_contacts(id, first_name, last_name, email, company)')
      .eq('org_id', orgId)
      .eq('id', id)
      .eq('is_deleted', false)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  public static async createBillingProfile(orgId: string, data: any): Promise<any> {
    const { data: created, error } = await crmSupabase
      .from('crm_billing_profiles')
      .insert({ ...data, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  public static async updateBillingProfile(orgId: string, id: string, patch: any): Promise<any> {
    const { data, error } = await crmSupabase
      .from('crm_billing_profiles')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async deleteBillingProfile(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_billing_profiles')
      .update({ is_deleted: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Payments ───────────────────────────────────────────────────────────────

  public static async getPayments(orgId: string, filters: { invoice_id?: string; limit?: number; offset?: number } = {}): Promise<{ payments: any[]; total_count: number }> {
    let query = crmSupabase
      .from('crm_payments')
      .select('*, invoice:crm_invoices(id, invoice_number, total_amount, status)', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.invoice_id) query = query.eq('invoice_id', filters.invoice_id);
    query = query.order('payment_date', { ascending: false }).limit(filters.limit || 50);

    const { data, count, error } = await query;
    if (error) throw error;
    return { payments: data || [], total_count: count || 0 };
  }

  public static async createPayment(orgId: string, data: any): Promise<any> {
    const { data: created, error } = await crmSupabase
      .from('crm_payments')
      .insert({ ...data, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  public static async deletePayment(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('crm_payments')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Attendance ─────────────────────────────────────────────────────────────

  public static async getAttendanceRecords(orgId: string, filters: { member_id?: string; date_from?: string; date_to?: string; status?: string; limit?: number } = {}): Promise<{ records: any[]; total_count: number }> {
    let query = crmSupabase
      .from('attendance_records')
      .select('*, member:crm_members(id, name, email, role)', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.member_id) query = query.eq('member_id', filters.member_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.date_from) query = query.gte('attendance_date', filters.date_from);
    if (filters.date_to) query = query.lte('attendance_date', filters.date_to);
    query = query.order('attendance_date', { ascending: false }).limit(filters.limit || 50);

    const { data, count, error } = await query;
    if (error) throw error;
    return { records: data || [], total_count: count || 0 };
  }

  public static async createAttendanceRecord(orgId: string, data: any): Promise<any> {
    const { data: created, error } = await crmSupabase
      .from('attendance_records')
      .insert({ ...data, org_id: orgId, is_manual: true })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  public static async updateAttendanceRecord(orgId: string, id: string, patch: any): Promise<any> {
    const { data, error } = await crmSupabase
      .from('attendance_records')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async deleteAttendanceRecord(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('attendance_records')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Leave Requests ─────────────────────────────────────────────────────────

  public static async getLeaveRequests(orgId: string, filters: { member_id?: string; status?: string; leave_type?: string; limit?: number } = {}): Promise<{ requests: any[]; total_count: number }> {
    let query = crmSupabase
      .from('leave_requests')
      .select('*, member:crm_members(id, name, email, role)', { count: 'exact' })
      .eq('org_id', orgId);

    if (filters.member_id) query = query.eq('member_id', filters.member_id);
    if (filters.status) query = query.eq('status', filters.status);
    if (filters.leave_type) query = query.eq('leave_type', filters.leave_type);
    query = query.order('created_at', { ascending: false }).limit(filters.limit || 50);

    const { data, count, error } = await query;
    if (error) throw error;
    return { requests: data || [], total_count: count || 0 };
  }

  public static async createLeaveRequest(orgId: string, data: any): Promise<any> {
    const { data: created, error } = await crmSupabase
      .from('leave_requests')
      .insert({ ...data, org_id: orgId })
      .select()
      .single();

    if (error) throw error;
    return created;
  }

  public static async updateLeaveRequest(orgId: string, id: string, patch: any): Promise<any> {
    const { data, error } = await crmSupabase
      .from('leave_requests')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  public static async deleteLeaveRequest(orgId: string, id: string): Promise<boolean> {
    const { error } = await crmSupabase
      .from('leave_requests')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('org_id', orgId);

    if (error) throw error;
    return true;
  }

  // ── Presence ───────────────────────────────────────────────────────────────

  public static async getPresenceLogs(orgId: string, filters: { member_id?: string; limit?: number } = {}): Promise<any[]> {
    let query = crmSupabase
      .from('crm_presence_logs')
      .select('*, member:crm_members(id, name, email, role)')
      .eq('org_id', orgId);

    if (filters.member_id) query = query.eq('member_id', filters.member_id);
    query = query.order('logged_at', { ascending: false }).limit(filters.limit || 100);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  // ── Holidays ───────────────────────────────────────────────────────────────

  public static async getHolidays(orgId: string): Promise<any[]> {
    const now = new Date().toISOString().split('T')[0];
    const { data, error } = await crmSupabase
      .from('company_holidays')
      .select('*')
      .eq('org_id', orgId)
      .gte('holiday_date', now)
      .order('holiday_date', { ascending: true })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  // ── Birthdays ──────────────────────────────────────────────────────────────

  public static async getUpcomingBirthdays(orgId: string): Promise<any[]> {
    const { data, error } = await crmSupabase
      .from('crm_members')
      .select('id, name, email, role, birthday')
      .eq('org_id', orgId)
      .eq('is_active', true)
      .eq('is_deleted', false)
      .not('birthday', 'is', null);

    if (error) throw error;

    // Sort by upcoming birthday (month/day) regardless of year
    const today = new Date();
    const sorted = (data || [])
      .map((m: any) => {
        if (!m.birthday) return null;
        const bday = new Date(m.birthday);
        const nextBday = new Date(today.getFullYear(), bday.getMonth(), bday.getDate());
        if (nextBday < today) nextBday.setFullYear(today.getFullYear() + 1);
        const daysUntil = Math.ceil((nextBday.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return { ...m, next_birthday: nextBday.toISOString().split('T')[0], days_until: daysUntil };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => a.days_until - b.days_until)
      .slice(0, 20);

    return sorted;
  }
}

