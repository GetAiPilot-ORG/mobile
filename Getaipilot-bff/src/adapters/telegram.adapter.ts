import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import { UpstreamSessionService } from '../services/upstream-session.service.js';

export interface TelegramAuthPayload {
  phone?: string;
  otp?: string;
  password?: string;
}

export interface TelegramContext {
  hubUserId: string;
  organizationId: string;
  telegramUserId: number | null;
  telegramConnected: boolean;
  telegramPhone: string | null;
  role: string;
}

function resolveUserId(user: any): string {
  if (!user) return '';
  if (typeof user === 'string') return user;
  return user.user_id || user.id || user.userId || user.sub || '';
}

export class TelegramAdapter {
  private static baseUrl = env.TELEGRAM_SERVICE_URL || 'https://tg.getaipilot.in';
  private static supabase: SupabaseClient = createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_ANON_KEY
  );

  /**
   * Resolves canonical dual-identity: Hub UUID and Telegram numeric BigInt ID
   */
  public static async resolveTelegramContext(user: any): Promise<TelegramContext> {
    const hubUserId = resolveUserId(user);
    const orgId = user?.organization_id || user?.organizationId || user?.org_id || '';
    const role = user?.role || 'User';

    let telegramUserId: number | null = null;
    let telegramConnected = false;
    let telegramPhone: string | null = null;

    if (hubUserId) {
      try {
        // 1. Check app_user_subscriptions first (source of truth on web)
        const { data: appSub } = await this.supabase
          .from('app_user_subscriptions')
          .select('telegram_user_id')
          .eq('user_id', hubUserId)
          .maybeSingle();

        if (appSub?.telegram_user_id) {
          telegramUserId = Number(appSub.telegram_user_id);
        }

        // 2. Check profiles table if still null
        if (!telegramUserId) {
          const { data: profile } = await this.supabase
            .from('profiles')
            .select('telegram_user_id, phone')
            .eq('id', hubUserId)
            .maybeSingle();

          if (profile?.telegram_user_id) {
            telegramUserId = Number(profile.telegram_user_id);
          }
          if (profile?.phone) {
            telegramPhone = profile.phone;
          }
        }

        // 3. Check tg_accounts table for live MTProto session
        const { data: tgAccount } = await this.supabase
          .from('tg_accounts')
          .select('phone, is_active')
          .eq('user_id', hubUserId)
          .maybeSingle();

        if (tgAccount) {
          telegramConnected = Boolean(tgAccount.is_active);
          if (tgAccount.phone) telegramPhone = tgAccount.phone;
        } else if (telegramUserId) {
          telegramConnected = true;
        }
      } catch (err: any) {
        console.warn('[TELEGRAM] Error resolving Telegram context:', err.message);
      }
    }

    return {
      hubUserId,
      organizationId: orgId,
      telegramUserId,
      telegramConnected,
      telegramPhone,
      role,
    };
  }

  /**
   * Helper to retrieve or generate a valid GoTrue user token for upstream Telesub API
   */
  public static async getUpstreamUserToken(user: any): Promise<string | null> {
    const userId = resolveUserId(user);
    const sessionId = user?.session_id;

    if (user?.token) return user.token;
    if (user?.access_token) return user.access_token;

    // 1. Try active session registry
    const inMemoryToken = await UpstreamSessionService.getSupabaseAccessToken(sessionId, userId);
    if (inMemoryToken) {
      return inMemoryToken;
    }

    // 2. Fetch email if missing
    let email = user?.email;
    if (!email && userId) {
      try {
        const { data: profile } = await this.supabase
          .from('profiles')
          .select('email')
          .eq('id', userId)
          .maybeSingle();
        if (profile?.email) {
          email = profile.email;
        } else {
          const { data: authUser } = await this.supabase.auth.admin.getUserById(userId);
          if (authUser?.user?.email) email = authUser.user.email;
        }
      } catch {}
    }

    // 3. Generate a valid GoTrue user access token using Supabase admin for seamless recovery
    if (email) {
      try {
        const { data: linkData, error: linkErr } = await this.supabase.auth.admin.generateLink({
          type: 'magiclink',
          email,
        });

        if (!linkErr && linkData?.properties?.hashed_token) {
          const { data: sessionData, error: sessionErr } = await this.supabase.auth.verifyOtp({
            token_hash: linkData.properties.hashed_token,
            type: 'email',
          });

          if (!sessionErr && sessionData?.session?.access_token) {
            UpstreamSessionService.saveSession(sessionId || `tg_${userId}`, userId, sessionData.session);
            return sessionData.session.access_token;
          }
        }
      } catch (err: any) {
        console.error('[TELEGRAM] Error generating upstream user token:', err.message);
      }
    }

    return null;
  }

  /**
   * Centralized HTTP requester to upstream Telegram backend
   */
  private static async requestUpstream<T>(
    endpoint: string,
    options: {
      method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      body?: any;
      user?: any;
      headers?: Record<string, string>;
    } = {}
  ): Promise<T> {
    const method = options.method || 'GET';
    const user = options.user || {};
    const url = new URL(endpoint, this.baseUrl);
    const token = await this.getUpstreamUserToken(user);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      };

      const response = await fetch(url.toString(), {
        method,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        let parsedMessage = errorText;
        try {
          const jsonErr = JSON.parse(errorText);
          parsedMessage = jsonErr.detail || jsonErr.error || jsonErr.message || errorText;
        } catch {}

        const err: any = new Error(parsedMessage);
        err.statusCode = response.status === 401 ? 502 : response.status;
        err.code = response.status === 401 ? 'TELEGRAM_UPSTREAM_AUTH_FAILED' : 'TELEGRAM_UPSTREAM_ERROR';
        throw err;
      }

      const json = await response.json();
      return json as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        const timeoutErr: any = new Error('Telegram upstream request timed out');
        timeoutErr.statusCode = 504;
        timeoutErr.code = 'TELEGRAM_UPSTREAM_TIMEOUT';
        throw timeoutErr;
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ==========================================
  // 1. Account & Connection Lifecycle (MTProto)
  // ==========================================

  public static async getStatus(user: any) {
    const ctx = await this.resolveTelegramContext(user);

    const { data: dbAccount } = await this.supabase
      .from('tg_accounts')
      .select('id, user_id, phone, is_active, created_at, updated_at')
      .eq('user_id', ctx.hubUserId)
      .maybeSingle();

    try {
      const upstreamRes: any = await this.requestUpstream('/telegram/status', { user });
      return {
        connected: Boolean(upstreamRes?.connected || dbAccount?.is_active || ctx.telegramConnected),
        phone: upstreamRes?.phone || dbAccount?.phone || ctx.telegramPhone || null,
        status: (upstreamRes?.connected || dbAccount?.is_active || ctx.telegramConnected) ? 'connected' : 'not_connected',
        account: dbAccount || null,
        telegramUserId: ctx.telegramUserId,
      };
    } catch (err) {
      return {
        connected: Boolean(dbAccount?.is_active || ctx.telegramConnected),
        phone: dbAccount?.phone || ctx.telegramPhone || null,
        status: (dbAccount?.is_active || ctx.telegramConnected) ? 'connected' : 'not_connected',
        account: dbAccount || null,
        telegramUserId: ctx.telegramUserId,
      };
    }
  }

  public static async startLogin(user: any, phone: string) {
    return this.requestUpstream('/telegram/login/start', {
      method: 'POST',
      body: { phone },
      user,
    });
  }

  public static async verifyOtp(user: any, otp: string) {
    return this.requestUpstream('/telegram/login/otp', {
      method: 'POST',
      body: { otp },
      user,
    });
  }

  public static async verifyPassword(user: any, password: string, phone?: string) {
    return this.requestUpstream('/telegram/login/password', {
      method: 'POST',
      body: { password, phone },
      user,
    });
  }

  public static async logout(user: any) {
    return this.requestUpstream('/telegram/logout', {
      method: 'POST',
      user,
    });
  }

  public static async getChats(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    try {
      const res: any = await this.requestUpstream('/telegram/chats', { user });
      if (Array.isArray(res?.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (e) {
      console.warn('[TELEGRAM] Live getChats upstream failed, reading local tg_chats cache');
    }

    const { data: chats, error } = await this.supabase
      .from('tg_chats')
      .select('id, user_id, title, type, members_count, is_admin, can_invite, can_post')
      .eq('user_id', ctx.hubUserId);

    if (error) {
      console.warn('[TELEGRAM] tg_chats query notice:', error.message);
    }

    return chats || [];
  }

  public static async syncChats(user: any) {
    return this.requestUpstream('/telegram/sync/chats', {
      method: 'POST',
      user,
    });
  }

  // ==========================================
  // 2. Aggregated Dashboard & Setup Hub
  // ==========================================

  public static async getDashboard(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const userId = ctx.hubUserId;
    const tgUserId = ctx.telegramUserId;

    // Parallel aggregate queries using exact DB column names
    const [
      accountRes,
      chatsRes,
      trackerBotsRes,
      landingPagesRes,
      subscribersRes,
      chatbotsRes,
      brandSettingsRes,
      forwardMappingsRes,
    ] = await Promise.allSettled([
      this.getStatus(user),
      this.supabase.from('tg_chats').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.from('tg_tracker').select('id, bot_name, bot_username, is_active, created_at').eq('user_id', userId),
      this.supabase.from('tg_landing_pages').select('id, title, slug, is_active, community_id, channel_id, created_at').eq('user_id', userId),
      this.supabase.from('tg_channel_subscriptions').select('id, status, plan_id, expires_at').eq('landing_page_user_id', userId),
      this.supabase.from('tg_chatbot_configs').select('id, bot_name, provider, is_active').eq('user_id', userId),
      this.supabase.from('tg_brand_settings').select('id, user_id, analyst_name, registration_no, is_active').eq('user_id', userId).maybeSingle(),
      tgUserId
        ? this.supabase.from('tg_forward_mappings').select('id, user_id, sender_id, sender_name, receivers, receivers_names, updated_at').eq('user_id', tgUserId)
        : Promise.resolve({ data: [] }),
    ]);

    const status = accountRes.status === 'fulfilled' ? accountRes.value : { connected: false, status: 'not_connected', phone: null };
    const channelsCount = chatsRes.status === 'fulfilled' ? (chatsRes.value.count || 0) : 0;
    const trackerBots = trackerBotsRes.status === 'fulfilled' ? (trackerBotsRes.value.data || []) : [];
    const landingPages = landingPagesRes.status === 'fulfilled' ? (landingPagesRes.value.data || []) : [];
    const subscribers = subscribersRes.status === 'fulfilled' ? (subscribersRes.value.data || []) : [];
    const chatbots = chatbotsRes.status === 'fulfilled' ? (chatbotsRes.value.data || []) : [];
    const brandSettings = brandSettingsRes.status === 'fulfilled' ? brandSettingsRes.value.data : null;
    const rawForwardMappings = (forwardMappingsRes as any)?.value?.data || [];

    const activeSubscribers = subscribers.filter((s: any) => s.status === 'active').length;
    const activeBotsCount = trackerBots.filter((b: any) => b.is_active).length + chatbots.filter((c: any) => c.is_active).length;

    return {
      connected: status.connected,
      phone: status.phone,
      telegramUserId: tgUserId,
      metrics: {
        totalChannels: channelsCount,
        activeBots: activeBotsCount,
        activeForwards: rawForwardMappings.length,
        totalLandingPages: landingPages.length,
        activeSubscribers,
        activeChatbots: chatbots.filter((c: any) => c.is_active).length,
      },
      trackerBots,
      landingPages,
      chatbots,
      brandSettings,
      recentActivity: [],
    };
  }

  public static async getSetupHub(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const userId = ctx.hubUserId;
    const tgUserId = ctx.telegramUserId;

    // Check all 8 module conditions matching TelegramSetupHub.tsx on web
    const [
      forwardsRes,
      pagesRes,
      joinLinksRes,
      trackerRes,
      reportBrandRes,
      chatbotRes,
      broadcastsRes,
      reactionsRes,
    ] = await Promise.all([
      tgUserId
        ? this.supabase.from('tg_forward_mappings').select('id', { count: 'exact', head: true }).eq('user_id', tgUserId)
        : this.supabase.from('tg_forward_mappings').select('id', { count: 'exact', head: true }),
      this.supabase.from('tg_landing_pages').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.from('tg_bot_join_links').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.from('tg_tracker').select('id', { count: 'exact' }).eq('user_id', userId),
      this.supabase.from('tg_brand_settings').select('id', { count: 'exact', head: true }).eq('user_id', userId).eq('is_active', true),
      this.supabase.from('tg_chatbot_configs').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.from('tg_broadcast_tasks').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.from('tg_reaction_orders').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    const trackerIds = (trackerRes.data || []).map((t: any) => t.id);
    let reportChannelCount = 0;

    if (trackerIds.length > 0) {
      const { count } = await this.supabase
        .from('tg_bot_channel_mappings')
        .select('id', { count: 'exact', head: true })
        .in('bot_id', trackerIds)
        .neq('status', 'Inactive')
        .eq('report_generation_enabled', true);

      reportChannelCount = count ?? 0;
    }

    const forwardCount = forwardsRes.count ?? 0;
    const landingPagesCount = pagesRes.count ?? 0;
    const joinLinksCount = joinLinksRes.count ?? 0;
    const trackerBotsCount = trackerRes.count ?? trackerIds.length;
    const reportBrandCount = reportBrandRes.count ?? 0;
    const chatbotCount = chatbotRes.count ?? 0;
    const broadcastsCount = broadcastsRes.count ?? 0;
    const reactionsCount = reactionsRes.count ?? 0;

    const hasTelegramLink = Boolean(tgUserId) || ctx.telegramConnected;
    const trackerComplete = joinLinksCount > 0 || trackerBotsCount > 0;
    const reportBotComplete = reportBrandCount > 0 && reportChannelCount > 0;

    const modules = [
      {
        id: 'autoforward',
        name: 'GAP Autoforwarding',
        description: 'Configure source to target forwarding rules.',
        missingHint: 'Add at least one forwarding mapping to complete setup.',
        completed: forwardCount > 0,
        missingRequirements: forwardCount > 0 ? [] : ['Add at least one forwarding mapping to complete setup.'],
        setupRoute: 'Autoforward',
      },
      {
        id: 'telesub',
        name: 'GAP Sub Manager',
        description: 'Create monetized landing pages for Telegram communities.',
        missingHint: 'Create your first landing page to complete setup.',
        completed: landingPagesCount > 0,
        missingRequirements: landingPagesCount > 0 ? [] : ['Create your first landing page to complete setup.'],
        setupRoute: 'SubManager',
      },
      {
        id: 'tracker',
        name: 'GAP Tracker',
        description: 'Track joins, retention, and channel growth with deep links.',
        missingHint: 'Connect a tracker bot or create a join link to complete setup.',
        completed: trackerComplete,
        missingRequirements: trackerComplete ? [] : ['Connect a tracker bot or create a join link to complete setup.'],
        setupRoute: 'Tracker',
      },
      {
        id: 'report-bot',
        name: 'GAP Report Bot',
        description: 'Generate branded SEBI research PDFs from Telegram trading calls.',
        missingHint: reportBotComplete
          ? 'Setup complete.'
          : reportBrandCount <= 0
            ? 'Add SEBI brand profile to complete report setup.'
            : 'Link one report-enabled channel to complete setup.',
        completed: reportBotComplete,
        missingRequirements: reportBotComplete ? [] : [reportBrandCount <= 0 ? 'Add SEBI brand profile.' : 'Link report-enabled channel.'],
        setupRoute: 'ReportBot',
      },
      {
        id: 'broadcast',
        name: 'Broadcast Msg',
        description: 'Send broadcast messages to your Telegram audience.',
        missingHint: 'Link Telegram account to enable broadcast setup.',
        completed: hasTelegramLink || broadcastsCount > 0,
        missingRequirements: hasTelegramLink ? [] : ['Link Telegram account.'],
        setupRoute: 'Broadcast',
      },
      {
        id: 'auto-approve',
        name: 'GAP Auto Approve',
        description: 'Auto-approve join requests in private channels.',
        missingHint: 'Link Telegram account to enable auto-approve setup.',
        completed: hasTelegramLink,
        missingRequirements: hasTelegramLink ? [] : ['Link Telegram account.'],
        setupRoute: 'AutoApprove',
      },
      {
        id: 'chatbot',
        name: 'Chat Bot Automation',
        description: 'Connect AI bot and configure responses for users.',
        missingHint: 'Add one chatbot config to complete setup.',
        completed: chatbotCount > 0 || trackerBotsCount > 0,
        missingRequirements: (chatbotCount > 0 || trackerBotsCount > 0) ? [] : ['Add one chatbot config to complete setup.'],
        setupRoute: 'ChatBot',
      },
      {
        id: 'reactions',
        name: 'GAP Reactions',
        description: 'Auto-deliver custom reaction emojis to your channel posts.',
        missingHint: 'Link Telegram account to enable reactions setup.',
        completed: hasTelegramLink || reactionsCount > 0,
        missingRequirements: hasTelegramLink ? [] : ['Link Telegram account.'],
        setupRoute: 'Reactions',
      },
    ];

    const completedCount = modules.filter(m => m.completed).length;

    return {
      completed: completedCount,
      total: modules.length,
      progressPercentage: Math.round((completedCount / modules.length) * 100),
      modules,
    };
  }

  // ==========================================
  // 3. GAP Autoforwarding (BigInt Scoped)
  // ==========================================

  public static async getAutoforwardOverview(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const tgUserId = ctx.telegramUserId;

    if (!tgUserId) {
      return {
        activeMappings: 0,
        textFilters: 0,
        blockedWords: 0,
        delay: 0,
        textAddons: { start_text: '', end_text: '' },
        mappings: [],
        filters: [],
        blacklist: [],
      };
    }

    const [mappingsRes, filtersRes, blacklistRes, settingsRes, addonsRes] = await Promise.all([
      this.supabase.from('tg_forward_mappings').select('*').eq('user_id', tgUserId).order('updated_at', { ascending: false }),
      this.supabase.from('tg_user_text_filters').select('*').eq('user_id', tgUserId),
      this.supabase.from('tg_user_blacklist_words').select('*').eq('user_id', tgUserId),
      this.supabase.from('tg_user_settings').select('*').eq('user_id', tgUserId).maybeSingle(),
      this.supabase.from('tg_user_text_addons').select('*').eq('user_id', tgUserId).maybeSingle(),
    ]);

    const rawMappings = mappingsRes.data || [];
    const filters = filtersRes.data || [];
    const blacklist = blacklistRes.data || [];

    // Normalize forward mappings for clean UI display
    const mappings = rawMappings.map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      source_channel_id: String(m.sender_id),
      source_channel_name: m.sender_name || `Channel ${m.sender_id}`,
      destination_channel_id: Array.isArray(m.receivers) ? m.receivers.join(', ') : String(m.receivers || ''),
      destination_channel_name: Array.isArray(m.receivers_names) ? m.receivers_names.join(', ') : 'Destination',
      is_active: true,
      updated_at: m.updated_at,
    }));

    return {
      activeMappings: mappings.length,
      textFilters: filters.length,
      blockedWords: blacklist.length,
      delay: settingsRes.data?.delay_seconds || settingsRes.data?.delay || 0,
      textAddons: {
        start_text: addonsRes.data?.start_text || '',
        end_text: addonsRes.data?.end_text || '',
      },
      mappings,
      filters,
      blacklist,
    };
  }

  public static async getForwardMappings(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) return [];
    const { data } = await this.supabase
      .from('tg_forward_mappings')
      .select('*')
      .eq('user_id', ctx.telegramUserId)
      .order('updated_at', { ascending: false });

    return (data || []).map((m: any) => ({
      id: m.id,
      user_id: m.user_id,
      source_channel_id: String(m.sender_id),
      source_channel_name: m.sender_name || `Channel ${m.sender_id}`,
      destination_channel_id: Array.isArray(m.receivers) ? m.receivers.join(', ') : String(m.receivers || ''),
      destination_channel_name: Array.isArray(m.receivers_names) ? m.receivers_names.join(', ') : 'Destination',
      is_active: true,
      updated_at: m.updated_at,
    }));
  }

  public static async createForwardMapping(user: any, payload: { source_channel_id: string; destination_channel_id: string; is_active?: boolean }) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Telegram user identity not linked. Please connect Telegram first.');

    const senderId = Number(payload.source_channel_id) || 0;
    const receiverId = Number(payload.destination_channel_id) || 0;

    const { data, error } = await this.supabase
      .from('tg_forward_mappings')
      .insert({
        user_id: ctx.telegramUserId,
        sender_id: senderId,
        sender_name: payload.source_channel_id,
        receivers: [receiverId],
        receivers_names: [payload.destination_channel_id],
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  public static async updateForwardMapping(user: any, id: string | number, payload: any) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');

    const { data, error } = await this.supabase
      .from('tg_forward_mappings')
      .update(payload)
      .eq('id', id)
      .eq('user_id', ctx.telegramUserId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  public static async deleteForwardMapping(user: any, id: string | number) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');

    const { error } = await this.supabase
      .from('tg_forward_mappings')
      .delete()
      .eq('id', id)
      .eq('user_id', ctx.telegramUserId);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  public static async getTextFilters(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) return [];
    const { data } = await this.supabase.from('tg_user_text_filters').select('*').eq('user_id', ctx.telegramUserId);
    return data || [];
  }

  public static async createTextFilter(user: any, payload: { search_text: string; replace_text: string }) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');
    const { data, error } = await this.supabase
      .from('tg_user_text_filters')
      .insert({
        user_id: ctx.telegramUserId,
        from_name: payload.search_text,
        to_name: payload.replace_text,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  public static async deleteTextFilter(user: any, id: string | number) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');
    const { error } = await this.supabase.from('tg_user_text_filters').delete().eq('id', id).eq('user_id', ctx.telegramUserId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  public static async getBlockedWords(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) return [];
    const { data } = await this.supabase.from('tg_user_blacklist_words').select('*').eq('user_id', ctx.telegramUserId);
    return data || [];
  }

  public static async createBlockedWord(user: any, word: string) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');
    const { data, error } = await this.supabase
      .from('tg_user_blacklist_words')
      .insert({ user_id: ctx.telegramUserId, word })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  public static async deleteBlockedWord(user: any, id: string | number) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');
    const { error } = await this.supabase.from('tg_user_blacklist_words').delete().eq('id', id).eq('user_id', ctx.telegramUserId);
    if (error) throw new Error(error.message);
    return { success: true };
  }

  public static async updateAutoforwardSettings(user: any, settings: { delay?: number }) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');
    const { data, error } = await this.supabase
      .from('tg_user_settings')
      .upsert({
        user_id: ctx.telegramUserId,
        delay_seconds: settings.delay || 0,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  public static async updateTextAddons(user: any, addons: { start_text?: string; end_text?: string }) {
    const ctx = await this.resolveTelegramContext(user);
    if (!ctx.telegramUserId) throw new Error('Unauthorized');
    const { data, error } = await this.supabase
      .from('tg_user_text_addons')
      .upsert({ user_id: ctx.telegramUserId, ...addons })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  }

  // ==========================================
  // 4. GAP Sub Manager (TeleSub)
  // ==========================================

  public static async getSubManagerOverview(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const userId = ctx.hubUserId;

    // 1. Fetch Landing Pages
    const { data: pages, error: pagesErr } = await this.supabase
      .from('tg_landing_pages')
      .select('id, user_id, community_id, slug, title, description, logo_url, is_active, channel_id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (pagesErr) throw pagesErr;

    const pageList = pages || [];
    const pageIds = pageList.map(p => p.id);
    const communityIds = pageList.map(p => p.community_id).filter(id => id !== null);

    // 2. Fetch subscribers count & active subscriptions
    let totalSubscribers = 0;
    let activeSubscriptions = 0;

    if (communityIds.length > 0) {
      const [totalCountRes, activeCountRes] = await Promise.all([
        this.supabase
          .from('tg_channel_subscriptions')
          .select('id', { count: 'exact', head: true })
          .in('community_id', communityIds)
          .not('telegram_user_id', 'is', null),
        this.supabase
          .from('tg_channel_subscriptions')
          .select('id', { count: 'exact', head: true })
          .in('community_id', communityIds)
          .eq('status', 'active')
          .not('telegram_user_id', 'is', null),
      ]);

      totalSubscribers = totalCountRes.count || 0;
      activeSubscriptions = activeCountRes.count || 0;
    }

    // 3. Fetch Payments Total
    let totalRevenue = 0;
    let currency = 'INR';

    if (pageIds.length > 0) {
      const { data: payments } = await this.supabase
        .from('payments')
        .select('amount, currency')
        .in('landing_page_id', pageIds)
        .eq('status', 'success');

      if (payments && payments.length > 0) {
        totalRevenue = payments.reduce((sum, p: any) => sum + (Number(p.amount) || 0), 0);
        if (payments[0]?.currency) currency = payments[0].currency;
      }
    }

    // 4. Linked Account Payout KYC
    const { data: linkedAccount } = await this.supabase
      .from('linked_accounts')
      .select('id, business_name, razorpay_account_status, is_active')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const paymentStatus = String(linkedAccount?.razorpay_account_status || '').toLowerCase();
    const paymentReady = paymentStatus === 'active' || paymentStatus === 'activated';

    // 5. Readiness checklist (preserving 4 web steps)
    const readiness = {
      telegramOwnerLinked: ctx.telegramConnected,
      channelBotAdmin: pageList.length > 0,
      payoutKycCompleted: paymentReady,
      subscriptionPagePublished: pageList.some(p => p.is_active),
    };

    return {
      totalRevenue,
      activeSubscribers: activeSubscriptions || totalSubscribers,
      totalPages: pageList.length,
      botAutomatedAccess: true,
      currency,
      readiness,
      pages: pageList.map(p => ({
        ...p,
        is_published: p.is_active,
      })),
      subscribersCount: totalSubscribers,
    };
  }

  public static async getLandingPages(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_landing_pages')
      .select('id, user_id, community_id, slug, title, description, logo_url, is_active, channel_id, created_at')
      .eq('user_id', ctx.hubUserId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(p => ({
      ...p,
      is_published: p.is_active,
    }));
  }

  public static async createLandingPage(user: any, payload: any) {
    const ctx = await this.resolveTelegramContext(user);
    const slug = payload.slug || `page-${Date.now()}`;

    const { data, error } = await this.supabase
      .from('tg_landing_pages')
      .insert({
        user_id: ctx.hubUserId,
        title: payload.title,
        description: payload.description || '',
        slug,
        channel_id: payload.channel_id,
        is_active: payload.is_published !== undefined ? payload.is_published : true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  public static async updateLandingPage(user: any, id: string, payload: any) {
    const ctx = await this.resolveTelegramContext(user);
    const updateData: any = { ...payload };
    if (updateData.is_published !== undefined) {
      updateData.is_active = updateData.is_published;
      delete updateData.is_published;
    }

    const { data, error } = await this.supabase
      .from('tg_landing_pages')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', ctx.hubUserId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  public static async getSubscribers(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_channel_subscriptions')
      .select('*')
      .eq('landing_page_user_id', ctx.hubUserId)
      .order('created_at', { ascending: false });

    if (error) {
      // Fallback query if landing_page_user_id is not populated
      const { data: fallbackSubs } = await this.supabase
        .from('tg_channel_subscriptions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      return fallbackSubs || [];
    }
    return data || [];
  }

  public static async getPayoutStatus(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data: account } = await this.supabase
      .from('linked_accounts')
      .select('id, business_name, razorpay_account_status, is_active, created_at')
      .eq('user_id', ctx.hubUserId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const paymentStatus = String(account?.razorpay_account_status || '').toLowerCase();
    const paymentReady = paymentStatus === 'active' || paymentStatus === 'activated';

    return {
      account: account || null,
      kycCompleted: paymentReady,
      accountStatus: account?.razorpay_account_status || 'not_connected',
    };
  }

  // ==========================================
  // 5. GAP Tracker
  // ==========================================

  public static async getTrackerOverview(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const userId = ctx.hubUserId;

    const [botsRes, linksRes, joinUsersRes] = await Promise.all([
      this.supabase.from('tg_tracker').select('id, bot_name, bot_username, is_active, created_at').eq('user_id', userId),
      this.supabase.from('tg_bot_join_links').select('*').eq('user_id', userId),
      this.supabase.from('tg_bot_join_users').select('id, join_time, left_time').eq('user_id', userId),
    ]);

    const bots = botsRes.data || [];
    const links = linksRes.data || [];
    const joinUsers = joinUsersRes.data || [];

    const totalJoins = joinUsers.length;
    const activeJoins = joinUsers.filter((u: any) => !u.left_time).length;

    return {
      connectedBotsCount: bots.length,
      totalLinksCount: links.length,
      totalJoins,
      activeJoins,
      bots,
      links: links.map((l: any) => ({
        ...l,
        public_url: l.public_url || `https://getaipilot.in/p/join-bot/${userId}/${l.link_slug || l.id}`,
      })),
    };
  }

  public static async saveTrackerBot(user: any, payload: { bot_token: string }) {
    const ctx = await this.resolveTelegramContext(user);
    const token = payload.bot_token.trim();
    if (!token.includes(':')) throw new Error('Invalid Telegram Bot Token format');

    let botUsername = '';
    let botName = 'Tracker Bot';
    try {
      const tgRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const tgJson: any = await tgRes.json();
      if (tgJson?.ok && tgJson?.result) {
        botUsername = tgJson.result.username || '';
        botName = tgJson.result.first_name || 'Tracker Bot';
      }
    } catch {}

    const { data, error } = await this.supabase
      .from('tg_tracker')
      .upsert({
        user_id: ctx.hubUserId,
        bot_token: token,
        bot_name: botName,
        bot_username: botUsername,
        is_active: true,
      })
      .select('id, user_id, bot_name, bot_username, is_active, created_at')
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  public static async getJoinLinks(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_bot_join_links')
      .select('*')
      .eq('user_id', ctx.hubUserId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map((l: any) => ({
      ...l,
      public_url: l.public_url || `https://getaipilot.in/p/join-bot/${ctx.hubUserId}/${l.link_slug || l.id}`,
    }));
  }

  public static async createJoinLink(user: any, payload: { link_name: string; channel_id: string; campaign_name?: string }) {
    const ctx = await this.resolveTelegramContext(user);
    const slug = `track_${Math.random().toString(36).substring(2, 8)}`;

    const { data, error } = await this.supabase
      .from('tg_bot_join_links')
      .insert({
        user_id: ctx.hubUserId,
        link_name: payload.link_name,
        channel_id: payload.channel_id,
        campaign_name: payload.campaign_name || 'Direct',
        link_slug: slug,
        public_url: `https://getaipilot.in/p/join-bot/${ctx.hubUserId}/${slug}`,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  public static async deleteJoinLink(user: any, id: string) {
    const ctx = await this.resolveTelegramContext(user);
    const { error } = await this.supabase
      .from('tg_bot_join_links')
      .delete()
      .eq('id', id)
      .eq('user_id', ctx.hubUserId);

    if (error) throw new Error(error.message);
    return { success: true };
  }

  // ==========================================
  // 6. GAP Report Bot (SEBI Compliance)
  // ==========================================

  public static async getReportBotConfig(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data: brand } = await this.supabase
      .from('tg_brand_settings')
      .select('*')
      .eq('user_id', ctx.hubUserId)
      .eq('is_active', true)
      .maybeSingle();

    const { data: calls } = await this.supabase
      .from('tg_trading_calls')
      .select('*')
      .eq('user_id', ctx.hubUserId)
      .order('created_at', { ascending: false })
      .limit(20);

    return {
      brand: brand || {
        analyst_name: '',
        registration_no: '',
        website: '',
        office_address: '',
        logo_url: '',
        is_active: false,
      },
      recentReports: calls || [],
    };
  }

  public static async updateReportBotConfig(user: any, payload: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_brand_settings')
      .upsert({
        user_id: ctx.hubUserId,
        is_active: true,
        ...payload,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ==========================================
  // 7. Broadcast Msg
  // ==========================================

  public static async getBroadcasts(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_broadcast_tasks')
      .select('*')
      .eq('user_id', ctx.hubUserId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  public static async createBroadcastTask(user: any, payload: { message: string; target_audience?: string; scheduled_at?: string }) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_broadcast_tasks')
      .insert({
        user_id: ctx.hubUserId,
        message: payload.message,
        target_audience: payload.target_audience || 'all',
        scheduled_at: payload.scheduled_at || new Date().toISOString(),
        status: 'queued',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ==========================================
  // 8. GAP Auto Approve
  // ==========================================

  public static async getAutoApproveStatus(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data: trackerBots } = await this.supabase
      .from('tg_tracker')
      .select('id')
      .eq('user_id', ctx.hubUserId);

    const trackerIds = (trackerBots || []).map((t: any) => t.id);
    let channels: any[] = [];

    if (trackerIds.length > 0) {
      const { data } = await this.supabase
        .from('tg_bot_channel_mappings')
        .select('*')
        .in('bot_id', trackerIds);
      channels = data || [];
    }

    return {
      autoApproveActive: true,
      channels,
    };
  }

  // ==========================================
  // 9. Chat Bot Automation (AI RAG)
  // ==========================================

  public static async getChatbotConfigs(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_chatbot_configs')
      .select('*')
      .eq('user_id', ctx.hubUserId);

    if (error) throw new Error(error.message);
    return (data || []).map((cfg: any) => ({
      id: cfg.id,
      user_id: cfg.user_id,
      bot_name: cfg.bot_name || (cfg.reply_model ? `${cfg.reply_model.toUpperCase()} Assistant` : 'AI Assistant'),
      provider: cfg.reply_model || 'gemini',
      system_prompt: cfg.system_prompt || '',
      welcome_message: cfg.reply_prompt || '',
      is_active: cfg.is_active ?? true,
      hasApiKey: Boolean(cfg.gemini_api_key || cfg.groq_api_key),
      created_at: cfg.created_at,
      updated_at: cfg.updated_at,
    }));
  }

  public static async createChatbotConfig(user: any, payload: any) {
    const ctx = await this.resolveTelegramContext(user);
    const model = payload.provider === 'groq' ? 'groq' : 'gemini';
    const insertData: any = {
      user_id: ctx.hubUserId,
      reply_model: model,
      system_prompt: payload.system_prompt || '',
      reply_prompt: payload.welcome_message || '',
      is_active: payload.is_active !== undefined ? payload.is_active : true,
    };
    if (payload.api_key) {
      if (model === 'groq') insertData.groq_api_key = payload.api_key.trim();
      else insertData.gemini_api_key = payload.api_key.trim();
    }

    const { data, error } = await this.supabase
      .from('tg_chatbot_configs')
      .insert(insertData)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      user_id: data.user_id,
      bot_name: data.reply_model ? `${data.reply_model.toUpperCase()} Assistant` : 'AI Assistant',
      provider: data.reply_model || 'gemini',
      system_prompt: data.system_prompt || '',
      welcome_message: data.reply_prompt || '',
      is_active: data.is_active ?? true,
      hasApiKey: Boolean(data.gemini_api_key || data.groq_api_key),
      created_at: data.created_at,
    };
  }

  public static async updateChatbotConfig(user: any, id: string, payload: any) {
    const ctx = await this.resolveTelegramContext(user);
    const updateData: any = {};
    if (payload.system_prompt !== undefined) updateData.system_prompt = payload.system_prompt;
    if (payload.welcome_message !== undefined) updateData.reply_prompt = payload.welcome_message;
    if (payload.is_active !== undefined) updateData.is_active = payload.is_active;
    if (payload.provider) updateData.reply_model = payload.provider;
    if (payload.api_key) {
      if (payload.provider === 'groq') updateData.groq_api_key = payload.api_key.trim();
      else updateData.gemini_api_key = payload.api_key.trim();
    }

    const { data, error } = await this.supabase
      .from('tg_chatbot_configs')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', ctx.hubUserId)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return {
      id: data.id,
      user_id: data.user_id,
      bot_name: data.reply_model ? `${data.reply_model.toUpperCase()} Assistant` : 'AI Assistant',
      provider: data.reply_model || 'gemini',
      system_prompt: data.system_prompt || '',
      welcome_message: data.reply_prompt || '',
      is_active: data.is_active ?? true,
      hasApiKey: Boolean(data.gemini_api_key || data.groq_api_key),
      created_at: data.created_at,
    };
  }

  // ==========================================
  // 10. GAP Reactions (SMM Engagement)
  // ==========================================

  public static async getReactionsOverview(user: any) {
    const ctx = await this.resolveTelegramContext(user);
    const userId = ctx.hubUserId;

    const [ordersRes, walletRes] = await Promise.all([
      this.supabase.from('tg_reaction_orders').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      this.supabase.from('wallets').select('balance').eq('user_id', userId).maybeSingle(),
    ]);

    return {
      walletBalance: walletRes.data?.balance || 0,
      orders: ordersRes.data || [],
    };
  }

  public static async createReactionOrder(user: any, payload: { post_link: string; reactions: string[]; quantity: number }) {
    const ctx = await this.resolveTelegramContext(user);
    const { data, error } = await this.supabase
      .from('tg_reaction_orders')
      .insert({
        user_id: ctx.hubUserId,
        post_link: payload.post_link,
        reactions: payload.reactions,
        quantity: payload.quantity,
        status: 'queued',
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  // ==========================================
  // Unified Dashboard & Inbox Support Methods
  // ==========================================

  public static async getSummary(user: any): Promise<any> {
    const ctx = await this.resolveTelegramContext(user);
    const userId = ctx.hubUserId;

    const [chatsRes, landingRes] = await Promise.all([
      this.supabase.from('tg_chats').select('id', { count: 'exact', head: true }).eq('user_id', userId),
      this.supabase.from('tg_landing_pages').select('id', { count: 'exact', head: true }).eq('user_id', userId),
    ]);

    return {
      connected: ctx.telegramConnected,
      phone: ctx.telegramPhone,
      totalChannels: chatsRes.count || 0,
      totalLandingPages: landingRes.count || 0,
    };
  }

  public static async getConversations(user: any): Promise<any[]> {
    const ctx = await this.resolveTelegramContext(user);
    const userId = ctx.hubUserId;

    const { data: chats } = await this.supabase
      .from('tg_chats')
      .select('*')
      .eq('user_id', userId)
      .limit(50);

    return (chats || []).map((chat: any) => ({
      id: `tg_${chat.id}`,
      organization_id: ctx.organizationId,
      contact: {
        name: chat.title || 'Telegram Chat',
        handle_or_phone: chat.username ? `@${chat.username}` : `chat_${chat.id}`,
      },
      channel: 'telegram' as const,
      last_message: {
        content: chat.last_message || 'No recent messages',
        created_at: chat.updated_at || new Date().toISOString(),
        direction: 'inbound' as const,
      },
      unread_count: 0,
      status: 'active' as const,
    }));
  }

  public static async getMessages(conversationId: string): Promise<any[]> {
    const cleanId = conversationId.replace('tg_', '');
    const { data: msgs } = await this.supabase
      .from('tg_chat_messages')
      .select('*')
      .eq('chat_id', cleanId)
      .order('created_at', { ascending: true })
      .limit(50);

    return (msgs || []).map((m: any) => ({
      id: m.id,
      conversation_id: conversationId,
      channel: 'telegram' as const,
      direction: m.direction || 'inbound',
      content: m.content || m.message || '',
      media: [],
      sender: {
        name: m.sender_name || 'Telegram User',
        type: (m.direction === 'outbound' ? 'agent' : 'contact') as any,
      },
      created_at: m.created_at || new Date().toISOString(),
      status: 'delivered' as const,
    }));
  }

  public static async sendMessage(conversationId: string, content: string, attachments: any[] = []): Promise<any> {
    const cleanId = conversationId.replace('tg_', '');
    return {
      id: `tg_msg_${Date.now()}`,
      conversation_id: conversationId,
      channel: 'telegram',
      direction: 'outbound',
      content,
      media: attachments || [],
      sender: {
        name: 'Agent',
        type: 'agent',
      },
      created_at: new Date().toISOString(),
      status: 'sent',
    };
  }
}
