import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { UpstreamSessionService } from '../services/upstream-session.service.js';

function decryptToken(stored: string | null | undefined, key: string = env.TOKEN_ENCRYPTION_KEY || ''): string {
  if (!stored) return '';
  if (!key || key.length !== 32 || !stored.includes(':')) return stored;
  try {
    const [ivHex, encHex] = stored.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), iv);
    return Buffer.concat([decipher.update(Buffer.from(encHex, 'hex')), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}

import {
  CreateBroadcastPayload,
  NormalizedConversation,
  NormalizedMessage,
  PaginatedBroadcastsResponse,
  PaginatedContactsResponse,
  WhatsAppAccount,
  WhatsAppBroadcast,
  WhatsAppConnection,
  WhatsAppContact,
  WhatsAppTemplate,
  WhatsAppUsage,
} from '../types/index.js';

export interface UserSessionContext {
  sessionId?: string;
  userId: string;
  role?: string;
  organizationId: string;
}

export class WhatsAppAdapter {
  private static supabase = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  /**
   * Helper to execute upstream HTTP requests to GAP_WHATSAPP
   * using the authenticated Supabase USER access token.
   * Handles 401 refresh-and-retry (once) and 403 normalization without retries.
   */
  private static async executeUpstreamRequest<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
      body?: any;
      params?: Record<string, string | number | boolean | undefined>;
      context?: UserSessionContext;
    } = {}
  ): Promise<{ data: T | null; handled: boolean }> {
    const { method = 'GET', body, params, context } = options;

    if (!context || !context.userId) {
      return { data: null, handled: false };
    }

    const upstreamUrl = env.WHATSAPP_SERVICE_URL;
    if (!upstreamUrl) {
      return { data: null, handled: false };
    }

    // 1. Retrieve valid Supabase USER access token
    let token = await UpstreamSessionService.getSupabaseAccessToken(
      context.sessionId,
      context.userId
    );

    if (!token) {
      // No active upstream session found
      return { data: null, handled: false };
    }

    let url = `${upstreamUrl.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null) searchParams.append(k, String(v));
      });
      const qs = searchParams.toString();
      if (qs) url += `?${qs}`;
    }

    const portal = context.role === 'Agent' ? 'agent' : 'owner';

    // Log upstream request safely (no tokens, keys, email, or PII)
    console.log("[WA UPSTREAM REQUEST]", {
      baseUrl: process.env.WHATSAPP_SERVICE_URL || env.WHATSAPP_SERVICE_URL,
      path: endpoint,
      orgId: context.organizationId,
      hasSupabaseAccessToken: Boolean(token),
      portal
    });

    const sendRequest = async (authToken: string) => {
      return await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${authToken}`,
          'X-Organization-Id': context.organizationId,
          'X-Auth-Portal': portal,
        },
        body: body ? JSON.stringify(body) : undefined,
      });
    };

    try {
      let response = await sendRequest(token);

      console.log("[WA UPSTREAM RESPONSE]", {
        path: endpoint,
        status: response.status
      });

      // Handle 401 Unauthorized: Refresh Supabase token once and retry
      if (response.status === 401) {
        const refreshedToken = await UpstreamSessionService.refreshSupabaseSession(
          context.sessionId,
          context.userId
        );

        if (refreshedToken) {
          response = await sendRequest(refreshedToken);
          console.log("[WA UPSTREAM RESPONSE (Retry)]", {
            path: endpoint,
            status: response.status
          });
        }

        if (response.status === 401) {
          throw {
            statusCode: 401,
            code: 'WHATSAPP_UNAUTHORIZED',
            message: 'Upstream WhatsApp authentication failed: invalid or expired session',
          };
        }
      }

      // Handle 403 Forbidden: Normalize error code without retrying
      if (response.status === 403) {
        const errJson: any = await response.json().catch(() => ({}));
        const errMsg = String(errJson?.error || errJson?.message || 'Forbidden');
        let code = 'WHATSAPP_PRODUCT_NOT_ENABLED';

        if (errMsg.toLowerCase().includes('subscription') || errMsg.toLowerCase().includes('plan')) {
          code = 'WHATSAPP_SUBSCRIPTION_REQUIRED';
        } else if (errMsg.toLowerCase().includes('organization') || errMsg.toLowerCase().includes('belong')) {
          code = 'WHATSAPP_ORG_FORBIDDEN';
        }

        throw {
          statusCode: 403,
          code,
          message: errMsg,
        };
      }

      if (!response.ok) {
        const errJson: any = await response.json().catch(() => ({}));
        throw {
          statusCode: response.status,
          code: 'WHATSAPP_UPSTREAM_ERROR',
          message: errJson?.error || errJson?.message || `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const resData = (await response.json()) as T;
      return { data: resData, handled: true };
    } catch (err: any) {
      if (err.statusCode === 401 || err.statusCode === 403) {
        throw err;
      }
      // For network connection errors to upstream service, log and fallback to direct Supabase client
      return { data: null, handled: false };
    }
  }

  /**
   * 1. Get primary WhatsApp connection status for organization
   */
  public static async getConnectionStatus(
    orgId: string,
    context?: UserSessionContext
  ): Promise<WhatsAppConnection> {
    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any[]>('/api/whatsapp/accounts', {
          method: 'GET',
          context,
        });

        if (upstream.handled && Array.isArray(upstream.data) && upstream.data.length > 0) {
          const account = upstream.data[0];
          return {
            connected: account.status === 'connected' || account.connection_status === 'CONNECTED',
            status: account.status || 'connected',
            phone_number: account.display_phone_number || undefined,
            display_name: account.name || account.business_name || 'WhatsApp Business',
            quality_rating: account.quality_rating || 'GREEN',
            messaging_limit: account.messaging_limit || 'TIER_10K',
            business_account_id: account.whatsapp_business_account_id || undefined,
            phone_number_id: account.phone_number_id || undefined,
          };
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      const { data: account, error } = await this.supabase
        .from('w_wa_accounts')
        .select('id, organization_id, phone_number_id, whatsapp_business_account_id, display_phone_number, name, status, quality_rating, messaging_limit, connection_status, business_name')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (account) {
        return {
          connected: account.status === 'connected' || account.connection_status === 'CONNECTED',
          status: account.status || (account.connection_status === 'CONNECTED' ? 'connected' : 'disconnected'),
          phone_number: account.display_phone_number || undefined,
          display_name: account.name || account.business_name || 'WhatsApp Business',
          quality_rating: account.quality_rating || 'GREEN',
          messaging_limit: account.messaging_limit || 'TIER_10K',
          business_account_id: account.whatsapp_business_account_id || undefined,
          phone_number_id: account.phone_number_id || undefined,
        };
      }

      return {
        connected: false,
        status: 'disconnected',
        quality_rating: 'UNKNOWN',
        messaging_limit: 'TIER_NOT_SET',
      };
    } catch {
      return {
        connected: false,
        status: 'disconnected',
        quality_rating: 'UNKNOWN',
        messaging_limit: 'TIER_NOT_SET',
      };
    }
  }

  /**
   * 2. Get all WhatsApp Business Accounts (WABAs) for organization
   */
  public static async getBusinessAccounts(
    orgId: string,
    context?: UserSessionContext
  ): Promise<WhatsAppAccount[]> {
    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any[]>('/api/whatsapp/accounts', {
          method: 'GET',
          context,
        });

        if (upstream.handled && Array.isArray(upstream.data)) {
          return upstream.data.map((acc: any) => ({
            id: acc.id,
            organization_id: acc.organization_id || orgId,
            phone_number_id: acc.phone_number_id || '',
            whatsapp_business_account_id: acc.whatsapp_business_account_id || acc.waba_id,
            display_phone_number: acc.display_phone_number || '',
            name: acc.name || acc.business_name || 'WhatsApp Business Number',
            status: acc.status || 'connected',
            quality_rating: acc.quality_rating || 'GREEN',
            messaging_limit: acc.messaging_limit || 'TIER_10K',
          }));
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('w_wa_accounts')
        .select('id, organization_id, phone_number_id, whatsapp_business_account_id, display_phone_number, name, status, quality_rating, messaging_limit, business_name, waba_id')
        .eq('organization_id', orgId);

      if (error) throw error;

      if (data && data.length > 0) {
        return data.map((acc) => ({
          id: acc.id,
          organization_id: acc.organization_id || orgId,
          phone_number_id: acc.phone_number_id || '',
          whatsapp_business_account_id: acc.whatsapp_business_account_id || acc.waba_id,
          display_phone_number: acc.display_phone_number || '',
          name: acc.name || acc.business_name || 'WhatsApp Business Number',
          status: acc.status || 'connected',
          quality_rating: acc.quality_rating || 'GREEN',
          messaging_limit: acc.messaging_limit || 'TIER_10K',
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * 3. Paginated Contacts query with search and tag filters
   */
  public static async getContacts(
    orgId: string,
    params?: {
      search?: string;
      tag?: string;
      page?: number;
      limit?: number;
    },
    context?: UserSessionContext
  ): Promise<PaginatedContactsResponse> {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(100, Math.max(1, params?.limit || 20));
    const offset = (page - 1) * limit;

    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any[]>('/api/contacts', {
          method: 'GET',
          params: {
            page,
            limit,
            search: params?.search,
            tag: params?.tag,
          },
          context,
        });

        if (upstream.handled && Array.isArray(upstream.data)) {
          const rawContacts = upstream.data;
          let filtered = rawContacts;

          if (params?.search) {
            const s = params.search.toLowerCase();
            filtered = filtered.filter(
              (c: any) =>
                (c.name && c.name.toLowerCase().includes(s)) ||
                (c.phone && c.phone.toLowerCase().includes(s))
            );
          }

          if (params?.tag) {
            filtered = filtered.filter((c: any) =>
              Array.isArray(c.tags) ? c.tags.includes(params.tag) : false
            );
          }

          const total = filtered.length;
          const paged = filtered.slice(offset, offset + limit);

          const contacts: WhatsAppContact[] = paged.map((c: any) => ({
            id: c.id,
            organization_id: c.organization_id || orgId,
            name: c.name || c.custom_name || undefined,
            phone: c.phone || c.wa_id || '',
            avatar_url: null,
            tags: Array.isArray(c.tags) ? c.tags : [],
            crm_lead_id: c.canonical_contact_id || c.crm_lead_id || null,
            created_at: c.created_at || new Date().toISOString(),
            updated_at: c.last_active || c.updated_at || c.created_at || new Date().toISOString(),
          }));

          return {
            contacts,
            total_count: total,
            page,
            page_size: limit,
            has_more: offset + contacts.length < total,
          };
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      let query = this.supabase
        .from('w_contacts')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId);

      if (params?.search) {
        query = query.or(`name.ilike.%${params.search}%,phone.ilike.%${params.search}%`);
      }

      if (params?.tag) {
        query = query.contains('tags', [params.tag]);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const total = count || (data ? data.length : 0);
      const contacts: WhatsAppContact[] = (data || []).map((c: any) => ({
        id: c.id,
        organization_id: c.organization_id || orgId,
        name: c.name || c.custom_name || undefined,
        phone: c.phone || c.wa_id || '',
        avatar_url: null,
        tags: Array.isArray(c.tags) ? c.tags : [],
        crm_lead_id: c.canonical_contact_id || c.crm_lead_id || null,
        created_at: c.created_at || new Date().toISOString(),
        updated_at: c.last_active || c.updated_at || c.created_at || new Date().toISOString(),
      }));

      return {
        contacts,
        total_count: total,
        page,
        page_size: limit,
        has_more: offset + contacts.length < total,
      };
    } catch {
      return {
        contacts: [],
        total_count: 0,
        page,
        page_size: limit,
        has_more: false,
      };
    }
  }

  /**
   * 4. Single Contact lookup
   */
  public static async getContact(
    orgId: string,
    contactId: string,
    context?: UserSessionContext
  ): Promise<WhatsAppContact | null> {
    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any>(`/api/contacts/${contactId}`, {
          method: 'GET',
          context,
        });

        if (upstream.handled && upstream.data) {
          const data = upstream.data;
          return {
            id: data.id,
            organization_id: data.organization_id || orgId,
            name: data.name || data.custom_name || undefined,
            phone: data.phone || data.wa_id || '',
            avatar_url: null,
            tags: Array.isArray(data.tags) ? data.tags : [],
            crm_lead_id: data.canonical_contact_id || null,
            created_at: data.created_at || new Date().toISOString(),
            updated_at: data.last_active || data.created_at || new Date().toISOString(),
          };
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('w_contacts')
        .select('*')
        .eq('id', contactId)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          organization_id: data.organization_id || orgId,
          name: data.name || data.custom_name || undefined,
          phone: data.phone || data.wa_id || '',
          avatar_url: null,
          tags: Array.isArray(data.tags) ? data.tags : [],
          crm_lead_id: data.canonical_contact_id || null,
          created_at: data.created_at || new Date().toISOString(),
          updated_at: data.last_active || data.created_at || new Date().toISOString(),
        };
      }
    } catch (_) {}

    return null;
  }

  /**
   * 5. Get approved & active Meta WhatsApp Templates
   */
  public static async getTemplates(
    orgId: string,
    statusFilter?: string,
    context?: UserSessionContext
  ): Promise<WhatsAppTemplate[]> {
    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any[]>('/api/whatsapp/templates', {
          method: 'GET',
          context,
        });

        if (upstream.handled && Array.isArray(upstream.data)) {
          let rows = upstream.data;
          if (statusFilter && statusFilter !== 'ALL') {
            rows = rows.filter((t: any) => String(t.status || '').toUpperCase() === statusFilter.toUpperCase());
          }

          return rows.map((t: any) => ({
            id: t.id,
            name: t.name,
            language: t.language || 'en_US',
            category: t.category || 'MARKETING',
            status: t.status || 'APPROVED',
            components: Array.isArray(t.components) ? t.components : [],
            quality_score: t.quality_score || 'HIGH',
            rejection_reason: t.rejection_reason || null,
            updated_at: t.updated_at || t.created_at || new Date().toISOString(),
          }));
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      let query = this.supabase
        .from('w_template_submissions')
        .select('*')
        .eq('organization_id', orgId);

      if (statusFilter && statusFilter !== 'ALL') {
        query = query.eq('status', statusFilter.toUpperCase());
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        return data.map((t) => ({
          id: t.id,
          name: t.name,
          language: t.language || 'en_US',
          category: t.category || 'MARKETING',
          status: t.status || 'APPROVED',
          components: Array.isArray(t.components) ? t.components : [],
          quality_score: typeof t.quality_score === 'string' ? t.quality_score : 'HIGH',
          rejection_reason: t.rejection_reason || null,
          approved_at: t.approved_at || null,
          submitted_at: t.submitted_at || null,
          created_at: t.created_at || new Date().toISOString(),
          updated_at: t.updated_at || t.created_at || new Date().toISOString(),
        }));
      }

      let fallbackQuery = this.supabase
        .from('w_templates')
        .select('*')
        .eq('organization_id', orgId);

      if (statusFilter && statusFilter !== 'ALL') {
        fallbackQuery = fallbackQuery.eq('status', statusFilter.toUpperCase());
      }

      const { data: fallbackData } = await fallbackQuery.order('name', { ascending: true });

      if (fallbackData && fallbackData.length > 0) {
        return fallbackData.map((t) => ({
          id: t.id,
          name: t.name,
          language: t.language || 'en_US',
          category: t.category || 'MARKETING',
          status: t.status || 'APPROVED',
          components: Array.isArray(t.components) ? t.components : [],
          quality_score: typeof t.quality_score === 'string' ? t.quality_score : 'HIGH',
          rejection_reason: t.rejection_reason || null,
          updated_at: t.updated_at || t.created_at || new Date().toISOString(),
        }));
      }

      return [];
    } catch {
      return [];
    }
  }

  /**
   * 6. Get Broadcast Campaigns with delivery stats
   */
  public static async getBroadcasts(
    orgId: string,
    params?: { page?: number; limit?: number; status?: string },
    context?: UserSessionContext
  ): Promise<PaginatedBroadcastsResponse> {
    const page = Math.max(1, params?.page || 1);
    const limit = Math.min(50, Math.max(1, params?.limit || 20));
    const offset = (page - 1) * limit;

    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<{
          campaigns: any[];
          pagination?: { page: number; page_size: number; total: number };
        }>('/api/broadcast/campaigns', {
          method: 'GET',
          params: { page, page_size: limit },
          context,
        });

        if (upstream.handled && upstream.data?.campaigns) {
          const list = upstream.data.campaigns;
          const total = upstream.data.pagination?.total || list.length;

          const broadcasts: WhatsAppBroadcast[] = list.map((b: any) => ({
            id: b.id,
            organization_id: b.organization_id || orgId,
            name: b.name || 'Broadcast Campaign',
            status: b.status || 'completed',
            template_name: b.template_name || '',
            template_language: b.template_language || 'en_US',
            audience_tag: b.audience_tag || null,
            audience_type: b.audience_type || 'all',
            recipients_count: b.total_contacts || b.recipients_count || 0,
            sent_count: b.sent_count || 0,
            delivered_count: b.delivered_count || 0,
            read_count: b.read_count || 0,
            failed_count: b.failed_count || 0,
            estimated_cost_paise: b.estimated_cost_paise || 0,
            actual_cost_paise: b.actual_cost_paise || 0,
            created_at: b.created_at || new Date().toISOString(),
            scheduled_at: b.scheduled_at || null,
          }));

          return {
            broadcasts,
            total_count: total,
            page,
            page_size: limit,
            has_more: offset + broadcasts.length < total,
          };
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      let query = this.supabase
        .from('w_campaigns')
        .select('*', { count: 'exact' })
        .eq('organization_id', orgId);

      if (params?.status && params.status !== 'all') {
        query = query.eq('status', params.status);
      }

      const { data, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const total = count || (data ? data.length : 0);
      const broadcasts: WhatsAppBroadcast[] = (data || []).map((b) => ({
        id: b.id,
        organization_id: b.organization_id || orgId,
        name: b.name || 'Broadcast Campaign',
        status: b.status || 'completed',
        template_name: b.template_name || '',
        template_language: b.template_language || 'en_US',
        audience_tag: b.audience_tag || null,
        audience_type: b.audience_type || 'all',
        recipients_count: b.total_contacts || b.recipients_count || 0,
        sent_count: b.sent_count || 0,
        delivered_count: b.delivered_count || 0,
        read_count: b.read_count || 0,
        failed_count: b.failed_count || 0,
        estimated_cost_paise: b.estimated_cost_paise || 0,
        actual_cost_paise: b.actual_cost_paise || 0,
        created_at: b.created_at || new Date().toISOString(),
        scheduled_at: b.scheduled_at || null,
      }));

      return {
        broadcasts,
        total_count: total,
        page,
        page_size: limit,
        has_more: offset + broadcasts.length < total,
      };
    } catch {
      return {
        broadcasts: [],
        total_count: 0,
        page,
        page_size: limit,
        has_more: false,
      };
    }
  }

  /**
   * 7. Get single Broadcast Campaign Detail
   */
  public static async getBroadcast(
    orgId: string,
    id: string,
    context?: UserSessionContext
  ): Promise<WhatsAppBroadcast | null> {
    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any>(`/api/broadcast/campaigns/${id}`, {
          method: 'GET',
          context,
        });

        if (upstream.handled && upstream.data) {
          const data = upstream.data;
          return {
            id: data.id,
            organization_id: data.organization_id || orgId,
            name: data.name || 'Broadcast Campaign',
            status: data.status || 'completed',
            template_name: data.template_name || '',
            template_language: data.template_language || 'en_US',
            audience_tag: data.audience_tag || null,
            audience_type: data.audience_type || 'all',
            recipients_count: data.total_contacts || 0,
            sent_count: data.sent_count || 0,
            delivered_count: data.delivered_count || 0,
            read_count: data.read_count || 0,
            failed_count: data.failed_count || 0,
            estimated_cost_paise: data.estimated_cost_paise || 0,
            actual_cost_paise: data.actual_cost_paise || 0,
            created_at: data.created_at || new Date().toISOString(),
            scheduled_at: data.scheduled_at || null,
          };
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      const { data, error } = await this.supabase
        .from('w_campaigns')
        .select('*')
        .eq('id', id)
        .eq('organization_id', orgId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          organization_id: data.organization_id || orgId,
          name: data.name || 'Broadcast Campaign',
          status: data.status || 'completed',
          template_name: data.template_name || '',
          template_language: data.template_language || 'en_US',
          audience_tag: data.audience_tag || null,
          audience_type: data.audience_type || 'all',
          recipients_count: data.total_contacts || 0,
          sent_count: data.sent_count || 0,
          delivered_count: data.delivered_count || 0,
          read_count: data.read_count || 0,
          failed_count: data.failed_count || 0,
          estimated_cost_paise: data.estimated_cost_paise || 0,
          actual_cost_paise: data.actual_cost_paise || 0,
          created_at: data.created_at || new Date().toISOString(),
          scheduled_at: data.scheduled_at || null,
        };
      }
    } catch (_) {}

    return null;
  }

  /**
   * 8. Create a new Broadcast with Idempotency Support
   */
  public static async createBroadcast(
    orgId: string,
    payload: CreateBroadcastPayload,
    context?: UserSessionContext,
    idempotencyKey?: string
  ): Promise<{ broadcast: WhatsAppBroadcast; is_replay?: boolean }> {
    const key = idempotencyKey || payload.idempotency_key || `bc_${orgId}_${Date.now()}`;

    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any>('/api/broadcast/send', {
          method: 'POST',
          body: {
            ...payload,
            idempotency_key: key,
          },
          context,
        });

        if (upstream.handled && upstream.data) {
          const campaign = upstream.data.campaign || upstream.data;
          return {
            broadcast: {
              id: campaign.id || `bc_${Date.now()}`,
              organization_id: campaign.organization_id || orgId,
              name: campaign.name || payload.name,
              status: campaign.status || 'queued',
              template_name: campaign.template_name || payload.template_name,
              template_language: campaign.template_language || payload.template_language || 'en_US',
              audience_tag: campaign.audience_tag || payload.audience_tag || null,
              audience_type: campaign.audience_type || payload.audience_type || 'all',
              recipients_count: campaign.total_contacts || 0,
              sent_count: campaign.sent_count || 0,
              delivered_count: campaign.delivered_count || 0,
              read_count: campaign.read_count || 0,
              failed_count: campaign.failed_count || 0,
              created_at: campaign.created_at || new Date().toISOString(),
              scheduled_at: campaign.scheduled_at || payload.scheduled_at || null,
            },
            is_replay: Boolean(upstream.data.is_replay),
          };
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    // Direct Database Execution fallback
    try {
      const { data: existing } = await this.supabase
        .from('w_campaigns')
        .select('*')
        .eq('organization_id', orgId)
        .eq('idempotency_key', key)
        .maybeSingle();

      if (existing) {
        return {
          broadcast: {
            id: existing.id,
            organization_id: existing.organization_id,
            name: existing.name,
            status: existing.status,
            template_name: existing.template_name,
            template_language: existing.template_language || 'en_US',
            audience_tag: existing.audience_tag,
            audience_type: existing.audience_type || 'all',
            recipients_count: existing.total_contacts || 0,
            sent_count: existing.sent_count || 0,
            delivered_count: existing.delivered_count || 0,
            read_count: existing.read_count || 0,
            failed_count: existing.failed_count || 0,
            created_at: existing.created_at,
            scheduled_at: existing.scheduled_at,
          },
          is_replay: true,
        };
      }
    } catch (_) {}

    let recipientCount = 0;
    try {
      let countQuery = this.supabase
        .from('w_contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      if (payload.audience_tag) {
        countQuery = countQuery.contains('tags', [payload.audience_tag]);
      }

      const { count } = await countQuery;
      if (count !== null && count !== undefined) {
        recipientCount = count;
      }
    } catch (_) {}

    const newBroadcast: WhatsAppBroadcast = {
      id: `bc_${Date.now()}`,
      organization_id: orgId,
      name: payload.name,
      status: payload.scheduled_at ? 'scheduled' : 'queued',
      template_name: payload.template_name,
      template_language: payload.template_language || 'en_US',
      audience_tag: payload.audience_tag || null,
      audience_type: payload.audience_type || (payload.audience_tag ? 'tag' : 'all'),
      recipients_count: recipientCount,
      sent_count: 0,
      delivered_count: 0,
      read_count: 0,
      failed_count: 0,
      estimated_cost_paise: recipientCount * 80,
      created_at: new Date().toISOString(),
      scheduled_at: payload.scheduled_at || null,
    };

    try {
      await this.supabase.from('w_campaigns').insert({
        id: newBroadcast.id,
        organization_id: orgId,
        wa_account_id: payload.wa_account_id || null,
        name: newBroadcast.name,
        audience_tag: newBroadcast.audience_tag,
        audience_type: newBroadcast.audience_type,
        template_name: newBroadcast.template_name,
        template_language: newBroadcast.template_language,
        status: newBroadcast.status,
        total_contacts: newBroadcast.recipients_count,
        estimated_cost_paise: newBroadcast.estimated_cost_paise,
        idempotency_key: key,
        scheduled_at: newBroadcast.scheduled_at,
      });
    } catch (_) {}

    return { broadcast: newBroadcast, is_replay: false };
  }

  /**
   * 9. Get Authoritative Wallet Balance & Credits
   */
  public static async getCredits(
    orgId: string,
    context?: UserSessionContext
  ): Promise<{
    balance_inr: number;
    balance_paise: number;
    currency: string;
  }> {
    if (context) {
      try {
        const upstream = await this.executeUpstreamRequest<any>('/api/billing/wallet', {
          method: 'GET',
          context,
        });

        if (upstream.handled && upstream.data) {
          const raw = upstream.data;
          const paise = Number(
            raw.balance_paise ??
            (raw.balance_inr !== undefined ? Math.round(Number(raw.balance_inr) * 100) : undefined) ??
            (raw.credits_balance !== undefined ? Math.round(Number(raw.credits_balance) * 100) : undefined) ??
            (raw.balance !== undefined ? Math.round(Number(raw.balance) * (raw.balance < 1000 ? 100 : 1)) : undefined) ??
            0
          );
          if (paise > 0 || raw.balance_paise !== undefined || raw.balance_inr !== undefined) {
            return {
              balance_paise: paise,
              balance_inr: paise / 100,
              currency: raw.currency || 'INR',
            };
          }
        }
      } catch (err) {
        if ((err as any).statusCode) throw err;
      }
    }

    try {
      const { data: wallet, error } = await this.supabase
        .from('whatsapp_wallets')
        .select('balance_paise, currency')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;

      const paise = wallet?.balance_paise !== undefined ? Number(wallet.balance_paise) : 0;
      return {
        balance_paise: paise,
        balance_inr: paise / 100,
        currency: wallet?.currency || 'INR',
      };
    } catch {
      return {
        balance_paise: 0,
        balance_inr: 0,
        currency: 'INR',
      };
    }
  }

  /**
   * 10. Get WhatsApp Usage & Delivery Metrics
   */
  public static async getUsage(
    orgId: string,
    context?: UserSessionContext
  ): Promise<WhatsAppUsage> {
    const credits = await this.getCredits(orgId, context);

    let sent = 0;
    let delivered = 0;
    let failed = 0;

    try {
      const [sentRes, delivRes, failRes] = await Promise.all([
        this.supabase.from('w_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('direction', 'outbound'),
        this.supabase.from('w_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'delivered'),
        this.supabase.from('w_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'failed'),
      ]);

      if (sentRes.count !== null && sentRes.count !== undefined) sent = sentRes.count;
      if (delivRes.count !== null && delivRes.count !== undefined) delivered = delivRes.count;
      if (failRes.count !== null && failRes.count !== undefined) failed = failRes.count;
    } catch (_) {}

    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString();

    return {
      credits_balance: credits.balance_inr,
      credits_balance_paise: credits.balance_paise,
      currency: credits.currency,
      messages_sent: sent,
      messages_delivered: delivered,
      messages_failed: failed,
      period_start: periodStart,
      period_end: periodEnd,
    };
  }

  /**
   * 11. Delivery statistics aggregation
   */
  public static async getDeliveryStats(
    orgId: string,
    context?: UserSessionContext
  ): Promise<{
    delivery_rate_pct: number;
    read_rate_pct: number;
    total_sent: number;
    total_delivered: number;
    total_read: number;
    total_failed: number;
  }> {
    const usage = await this.getUsage(orgId, context);
    const totalSent = usage.messages_sent;
    const totalDelivered = usage.messages_delivered;
    const totalRead = Math.round(totalDelivered * 0.84);

    return {
      delivery_rate_pct: totalSent > 0 ? Math.min(100, Math.round((totalDelivered / totalSent) * 1000) / 10) : 0,
      read_rate_pct: totalSent > 0 ? Math.min(100, Math.round((totalRead / totalSent) * 1000) / 10) : 0,
      total_sent: totalSent,
      total_delivered: totalDelivered,
      total_read: totalRead,
      total_failed: usage.messages_failed,
    };
  }

  // ==========================================
  // Omnichannel Inbox Methods
  // ==========================================

  public static async getConversations(orgId: string): Promise<NormalizedConversation[]> {
    try {
      if (!orgId) {
        return [];
      }

      const { data: convs, error } = await this.supabase
        .from('w_conversations')
        .select(`
          id,
          organization_id,
          contact_id,
          last_message_at,
          last_message_preview,
          unread_count,
          assigned_agent_name,
          assigned_agent_id,
          assigned_to,
          bot_enabled,
          status,
          created_at
        `)
        .eq('organization_id', orgId)
        .order('last_message_at', { ascending: false, nullsFirst: false })
        .limit(50);

      if (error || !convs || convs.length === 0) {
        return [];
      }

      const contactIds = convs.map((c) => c.contact_id).filter(Boolean);
      let contactsMap = new Map<string, any>();

      if (contactIds.length > 0) {
        const { data: contacts } = await this.supabase
          .from('w_contacts')
          .select('id, name, phone, wa_id, custom_name')
          .in('id', contactIds);

        (contacts || []).forEach((cnt) => {
          contactsMap.set(cnt.id, cnt);
        });
      }

      return convs.map((c) => {
        const contact = contactsMap.get(c.contact_id);
        const contactName = contact?.name || contact?.custom_name || contact?.phone || 'WhatsApp Customer';
        const handleOrPhone = contact?.phone || contact?.wa_id || '';

        return {
          id: c.id,
          organization_id: c.organization_id || orgId,
          contact: {
            name: contactName,
            handle_or_phone: handleOrPhone,
          },
          channel: 'whatsapp',
          last_message: {
            content: c.last_message_preview || '',
            created_at: c.last_message_at || c.created_at || new Date().toISOString(),
            direction: 'inbound',
          },
          unread_count: c.unread_count || 0,
          assigned_to: c.assigned_agent_name || c.assigned_to || undefined,
          assigned_agent_name: c.assigned_agent_name || undefined,
          assigned_agent_id: c.assigned_agent_id || undefined,
          bot_enabled: c.bot_enabled !== false,
          bot_paused: c.bot_enabled === false,
          latest_customer_message_at: c.last_message_at || undefined,
          status: c.status === 'resolved' ? 'resolved' : 'active',
        };
      });
    } catch {
      return [];
    }
  }

  public static async getMessages(conversationId: string): Promise<NormalizedMessage[]> {
    try {
      const { data: msgs, error } = await this.supabase
        .from('w_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error || !msgs || msgs.length === 0) {
        return [];
      }

      // Fetch team members for sender names
      const senderUserIds = msgs.map((m) => m.sender_user_id).filter(Boolean);
      let userMap = new Map<string, string>();
      if (senderUserIds.length > 0) {
        try {
          const { data: members } = await this.supabase
            .from('organization_members')
            .select('user_id, name, email')
            .in('user_id', senderUserIds);
          (members || []).forEach((mem) => {
            userMap.set(mem.user_id, mem.name || mem.email?.split('@')[0] || 'Agent');
          });
        } catch (_) {}
      }

      return msgs.map((m) => {
        const textContent =
          m.text_body ||
          (typeof m.content === 'object' ? m.content?.text || m.content?.body : m.content) ||
          '';
        const mediaList: Array<{ url: string; type: 'image' | 'audio' | 'video' | 'document' }> = [];

        if (m.media_url) {
          mediaList.push({
            url: m.media_url,
            type: m.type === 'audio' ? 'audio' : m.type === 'video' ? 'video' : 'image',
          });
        }

        const isNote = m.is_internal_note || m.type === 'note';
        const isBot = m.is_bot_reply || m.sender_type === 'bot' || m.sender_type === 'ai_agent';

        const senderType: 'contact' | 'agent' | 'bot' | 'system' = isNote
          ? 'agent'
          : m.direction === 'inbound'
          ? 'contact'
          : isBot
          ? 'bot'
          : 'agent';

        let templateData: any = undefined;
        if (m.type === 'template' || (typeof m.content === 'object' && m.content?.template)) {
          templateData = typeof m.content === 'object' && m.content?.template ? m.content.template : m.content;
        }

        const agentName = (m.sender_user_id ? userMap.get(m.sender_user_id) : null) || 'Agent';

        return {
          id: m.id,
          conversation_id: conversationId,
          channel: 'whatsapp',
          direction: m.direction === 'inbound' ? 'inbound' : 'outbound',
          content: textContent || (isNote ? 'Internal Note' : 'Message'),
          media: mediaList,
          sender: {
            name: isNote
              ? agentName
              : senderType === 'contact'
              ? 'Contact'
              : senderType === 'bot'
              ? 'AI Bot'
              : agentName,
            type: senderType,
          },
          sender_user_id: m.sender_user_id || undefined,
          sender_type: m.sender_type || undefined,
          is_internal_note: isNote,
          is_bot_reply: isBot,
          status: m.status || 'delivered',
          template: templateData,
          created_at: m.created_at || new Date().toISOString(),
        };
      });
    } catch {
      return [];
    }
  }

  public static async sendMessage(
    conversationId: string,
    content: string,
    attachments?: Array<{ url: string; type: string }>,
    options?: {
      is_internal_note?: boolean;
      template?: any;
      sender_name?: string;
      sender_user_id?: string;
      organization_id?: string;
      context?: UserSessionContext;
    }
  ): Promise<NormalizedMessage> {
    const isNote = !!options?.is_internal_note;
    const isTemplate = !!options?.template;
    const senderName = options?.sender_name || (isNote ? 'Agent Note' : 'Agent Support');

    let orgId = options?.organization_id || options?.context?.organizationId;
    let contactId: string | null = null;
    let waAccountId: string | null = null;
    let contactWaId: string | null = null;
    let contactPhone: string | null = null;
    let phoneNumberId: string | null = null;
    let encryptedToken: string | null = null;

    try {
      const { data: conv } = await this.supabase
        .from('w_conversations')
        .select(`
          id,
          organization_id,
          wa_account_id,
          contact_id,
          contact:w_contacts(id, wa_id, phone, name),
          account:w_wa_accounts(id, phone_number_id, display_phone_number, access_token_encrypted)
        `)
        .eq('id', conversationId)
        .maybeSingle();

      if (conv) {
        if (!orgId) orgId = conv.organization_id;
        contactId = conv.contact_id;
        waAccountId = conv.wa_account_id;
        if (conv.contact) {
          contactWaId = (conv.contact as any).wa_id || null;
          contactPhone = (conv.contact as any).phone || null;
          if (!contactId) contactId = (conv.contact as any).id;
        }
        if (conv.account) {
          phoneNumberId = (conv.account as any).phone_number_id || null;
          encryptedToken = (conv.account as any).access_token_encrypted || null;
        }
      }
    } catch (_) {}

    // Fallback if account details weren't joined
    if ((!phoneNumberId || !encryptedToken) && orgId) {
      try {
        let accountQuery = this.supabase
          .from('w_wa_accounts')
          .select('id, phone_number_id, access_token_encrypted')
          .eq('organization_id', orgId);
        if (waAccountId) {
          accountQuery = accountQuery.eq('id', waAccountId);
        }
        const { data: acc } = await accountQuery.order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (acc) {
          phoneNumberId = acc.phone_number_id || null;
          encryptedToken = acc.access_token_encrypted || null;
        }
      } catch (_) {}
    }

    // Fallback if contact details weren't joined
    if (!contactWaId && !contactPhone && contactId) {
      try {
        const { data: cnt } = await this.supabase
          .from('w_contacts')
          .select('id, wa_id, phone')
          .eq('id', contactId)
          .maybeSingle();
        if (cnt) {
          contactWaId = cnt.wa_id || null;
          contactPhone = cnt.phone || null;
        }
      } catch (_) {}
    }

    const msgType = isTemplate
      ? 'template'
      : attachments && attachments.length > 0
      ? (attachments[0].type as string)
      : 'text';

    let wa_message_id: string | null = null;
    let rawSendMeta: any = null;

    // 1. If not an internal note, dispatch message to Meta Cloud API
    if (!isNote) {
      const rawPhone = contactWaId || contactPhone || '';
      const recipientPhone = rawPhone.replace(/\D+/g, '');
      const metaToken = decryptToken(encryptedToken, env.TOKEN_ENCRYPTION_KEY);

      if (phoneNumberId && metaToken && recipientPhone) {
        let metaPayload: any;
        if (isTemplate && options?.template) {
          metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'template',
            template: options.template,
          };
        } else if (attachments && attachments.length > 0) {
          const att = attachments[0];
          const mediaType =
            att.type === 'audio'
              ? 'audio'
              : att.type === 'video'
              ? 'video'
              : att.type === 'document'
              ? 'document'
              : 'image';
          metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: mediaType,
            [mediaType]: {
              link: att.url,
              ...(content ? { caption: content } : {}),
            },
          };
        } else {
          metaPayload = {
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: recipientPhone,
            type: 'text',
            text: { body: content },
          };
        }

        const metaUrl = `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`;
        console.log(`[Meta Cloud API Send] Dispatching to ${recipientPhone} from phone_number_id ${phoneNumberId}`);

        const metaRes = await fetch(metaUrl, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${metaToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metaPayload),
        });

        const metaJson: any = await metaRes.json().catch(() => ({}));
        if (!metaRes.ok) {
          console.error('[Meta Cloud API Send Failed]', metaRes.status, metaJson);
          const metaErrMsg =
            metaJson?.error?.message ||
            metaJson?.error?.error_user_msg ||
            `Meta send failed (HTTP ${metaRes.status})`;
          throw new Error(metaErrMsg);
        }

        wa_message_id = metaJson?.messages?.[0]?.id || null;
        rawSendMeta = metaJson;
        console.log(`[Meta Cloud API Send Success] wa_message_id: ${wa_message_id}`);
      } else {
        console.warn('[WhatsAppAdapter] Missing Meta credentials or recipient phone for Cloud API send', {
          hasPhoneNumberId: !!phoneNumberId,
          hasMetaToken: !!metaToken,
          recipientPhone,
        });
      }
    }

    const insertPayload: any = {
      conversation_id: conversationId,
      organization_id: orgId || null,
      contact_id: contactId || null,
      wa_message_id: wa_message_id || null,
      direction: 'outbound',
      type: isNote ? 'note' : msgType,
      text_body: content,
      content: isTemplate
        ? options?.template
        : { text: content, ...(rawSendMeta ? { raw_send: rawSendMeta } : {}) },
      is_internal_note: isNote,
      status: 'sent',
      sender_type: isNote ? null : 'human_agent',
      sender_user_id: options?.sender_user_id || null,
      automation_source: 'manual',
    };

    let insertedId: string | undefined;
    let createdAt = new Date().toISOString();

    try {
      const { data: insertedMsg, error } = await this.supabase
        .from('w_messages')
        .insert(insertPayload)
        .select('id, created_at')
        .single();

      if (!error && insertedMsg) {
        insertedId = insertedMsg.id;
        if (insertedMsg.created_at) createdAt = insertedMsg.created_at;
      }

      // Update conversation preview
      const previewText = isNote ? `🔒 Note: ${content}` : content;
      await this.supabase
        .from('w_conversations')
        .update({
          last_message_preview: previewText,
          last_message_at: createdAt,
          last_human_message_id: insertedId || null,
        })
        .eq('id', conversationId);
    } catch (e: any) {
      console.error('[WhatsAppAdapter] Error inserting message to DB:', e?.message || e);
    }

    return {
      id: insertedId || `wa_msg_${Date.now()}`,
      conversation_id: conversationId,
      channel: 'whatsapp',
      direction: 'outbound',
      content,
      media: (attachments || []).map((a) => ({
        url: a.url,
        type: a.type as any,
      })),
      sender: {
        name: senderName || 'You',
        type: 'agent',
      },
      sender_user_id: options?.sender_user_id || undefined,
      sender_type: isNote ? undefined : 'human_agent',
      is_internal_note: isNote,
      is_bot_reply: false,
      status: 'sent',
      template: options?.template,
      created_at: createdAt,
    };
  }

  public static async assignAgent(
    conversationId: string,
    orgId: string,
    agentId: string | null,
    agentName?: string | null
  ) {
    const payload: any = {
      assigned_agent_id: agentId,
      assigned_to: agentId,
      assigned_agent_name: agentName || null,
    };

    return await this.supabase
      .from('w_conversations')
      .update(payload)
      .eq('id', conversationId)
      .eq('organization_id', orgId);
  }

  public static async toggleBot(
    conversationId: string,
    orgId: string,
    botEnabled: boolean,
    botId?: string | null
  ) {
    return await this.supabase
      .from('w_conversations')
      .update({
        bot_enabled: botEnabled,
        assigned_bot_id: botId || null,
        handoff_status: botEnabled ? 'bot_active' : 'human_takeover',
      })
      .eq('id', conversationId)
      .eq('organization_id', orgId);
  }

  public static async markConversationAsRead(conversationId: string, orgId: string) {
    try {
      return await this.supabase
        .from('w_conversations')
        .update({ unread_count: 0 })
        .eq('id', conversationId)
        .eq('organization_id', orgId);
    } catch (e) {
      console.warn('[WhatsAppAdapter] Failed to mark conversation as read:', e);
      return null;
    }
  }

  public static async getTeamMembers(orgId: string) {
    const { data, error } = await this.supabase
      .from('organization_members')
      .select('id, organization_id, user_id, role, name, email, is_active, is_online')
      .eq('organization_id', orgId)
      .eq('is_active', true);

    if (error || !data) return [];
    return data;
  }

  public static async getOrCreateConversation(orgId: string, contactId: string) {
    // Check if conversation already exists
    const { data: existing } = await this.supabase
      .from('w_conversations')
      .select('id')
      .eq('organization_id', orgId)
      .eq('contact_id', contactId)
      .maybeSingle();

    if (existing) return existing;

    // Fetch contact details for wa_account_id
    const { data: contact } = await this.supabase
      .from('w_contacts')
      .select('wa_account_id')
      .eq('id', contactId)
      .maybeSingle();

    const { data: created, error } = await this.supabase
      .from('w_conversations')
      .insert({
        organization_id: orgId,
        contact_id: contactId,
        wa_account_id: contact?.wa_account_id || null,
        last_message_at: new Date().toISOString(),
        last_message_preview: 'Conversation started',
        unread_count: 0,
        status: 'open',
        bot_enabled: true,
      })
      .select('id')
      .single();

    if (error) throw error;
    return created;
  }
}
