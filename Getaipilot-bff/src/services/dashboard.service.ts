import { createClient } from '@supabase/supabase-js';
import { CRMAdapter } from '../adapters/crm.adapter.js';
import { HubAdapter } from '../adapters/hub.adapter.js';
import { SocialAdapter } from '../adapters/social.adapter.js';
import { TelegramAdapter } from '../adapters/telegram.adapter.js';
import { VoiceAdapter } from '../adapters/voice.adapter.js';
import { WhatsAppAdapter } from '../adapters/whatsapp.adapter.js';
import { env } from '../config/env.js';
import { JWTPayload } from '../types/index.js';

export interface UnifiedDashboardResponse {
  organization: {
    id: string;
    name: string;
    role: string;
    user_name: string;
    user_email: string;
  };
  subscription: {
    plan_name: string;
    status: string;
    renews_at: string;
    amount: number;
    currency: string;
  };
  metrics: {
    whatsapp: {
      messages_count: number;
      contacts_count: number;
      active_conversations: number;
      connected: boolean;
    };
    crm: {
      leads_count: number;
      pipeline_summary: {
        new: number;
        contacted: number;
        qualified: number;
        proposal: number;
        won: number;
        total_value: number;
      };
    };
    voice: {
      calls_count: number;
      minutes_used: number;
      active_agents: number;
      wallet_balance: number;
      currency: string;
    };
    social: {
      scheduled_posts: number;
      connected_accounts: number;
    };
    telegram: {
      bot_status: 'connected' | 'disconnected';
      active_sessions: number;
      landing_pages: number;
      subscribers_count: number;
      monthly_revenue: number;
    };
  };
  recent_activity: Array<{
    id: string;
    product: 'whatsapp' | 'crm' | 'voice' | 'social' | 'telegram' | 'billing';
    title: string;
    description: string;
    timestamp: string;
    status: 'success' | 'warning' | 'info' | 'error';
  }>;
}

export class DashboardService {
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

  public static async getUnifiedDashboard(user: JWTPayload): Promise<UnifiedDashboardResponse> {
    const orgId = user.organization_id;
    const userId = user.user_id;

    // 1. Concurrently fetch Hub profile & billing
    const [profile, billing, leadsResult, voiceSummary, socialPosts, socialAccounts, tgSummary] =
      await Promise.all([
        HubAdapter.getUserProfile(userId, user.email),
        HubAdapter.getBillingStatus(userId),
        CRMAdapter.getLeads(user),
        VoiceAdapter.getSummary(orgId),
        SocialAdapter.getPosts(orgId),
        SocialAdapter.getConnectedAccounts(orgId),
        TelegramAdapter.getSummary(userId),
      ]);

    const leadList = leadsResult?.leads || [];

    // 2. Fetch real counts from Supabase tables for WhatsApp & Telegram
    let waMessagesCount = 0;
    let waContactsCount = 0;
    let waConvsCount = 0;
    let tgSessionsCount = 0;
    let tgLandingPagesCount = 0;

    try {
      const [msgRes, cntRes, convRes, tgSessRes, tgLandRes] = await Promise.all([
        this.supabase.from('w_messages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        this.supabase.from('w_contacts').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        this.supabase.from('w_conversations').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        this.supabase.from('tg_bot_sessions').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        this.supabase.from('tg_landing_pages').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
      ]);

      if (msgRes.count !== null && msgRes.count !== undefined) waMessagesCount = msgRes.count;
      if (cntRes.count !== null && cntRes.count !== undefined) waContactsCount = cntRes.count;
      if (convRes.count !== null && convRes.count !== undefined) waConvsCount = convRes.count;
      if (tgSessRes.count !== null && tgSessRes.count !== undefined) tgSessionsCount = tgSessRes.count;
      if (tgLandRes.count !== null && tgLandRes.count !== undefined) tgLandingPagesCount = tgLandRes.count;
    } catch (e) {
      // Clean 0 defaults retained
    }

    // 3. Compute CRM Pipeline Summary
    const pipelineSummary = {
      new: leadList.filter((l: any) => l.stage_id === 'lead' || l.stage_name === 'New Lead' || l.stage_name === 'New').length,
      contacted: leadList.filter((l: any) => l.stage_id === 'contacted' || l.stage_name === 'Contacted').length,
      qualified: leadList.filter((l: any) => l.stage_id === 'qualified' || l.stage_name === 'Qualified').length,
      proposal: leadList.filter((l: any) => l.stage_id === 'proposal' || l.stage_name === 'Proposal').length,
      won: leadList.filter((l: any) => l.stage_id === 'closed_won' || l.stage_name === 'Closed Won').length,
      total_value: leadList.reduce((sum: number, l: any) => sum + (l.value || 0), 0),
    };

    const recentActivity: UnifiedDashboardResponse['recent_activity'] = [];
    if (waMessagesCount > 0) {
      recentActivity.push({
        id: 'act_wa_sync',
        product: 'whatsapp',
        title: 'WhatsApp Messages Synced',
        description: `${waMessagesCount.toLocaleString()} total messages in ecosystem inbox.`,
        timestamp: new Date().toISOString(),
        status: 'success',
      });
    }
    if (leadList.length > 0) {
      recentActivity.push({
        id: 'act_crm_leads',
        product: 'crm',
        title: 'CRM Pipeline Active',
        description: `${leadList.length} leads tracked (₹${pipelineSummary.total_value.toLocaleString()} Pipeline Value).`,
        timestamp: new Date().toISOString(),
        status: 'success',
      });
    }
    if (profile.subscriptionTier) {
      recentActivity.push({
        id: 'act_sub_active',
        product: 'billing',
        title: 'Subscription Active',
        description: `${profile.subscriptionTier} plan verified for workspace.`,
        timestamp: new Date().toISOString(),
        status: 'info',
      });
    }

    return {
      organization: {
        id: orgId,
        name: `${profile.fullName}'s Organization`,
        role: user.role,
        user_name: profile.fullName,
        user_email: profile.email,
      },
      subscription: {
        plan_name: profile.subscriptionTier || billing.planName,
        status: profile.subscriptionStatus || billing.status,
        renews_at: billing.renewsAt,
        amount: billing.amount,
        currency: billing.currency,
      },
      metrics: {
        whatsapp: {
          messages_count: waMessagesCount,
          contacts_count: waContactsCount,
          active_conversations: waConvsCount,
          connected: waContactsCount > 0 || waMessagesCount > 0,
        },
        crm: {
          leads_count: leadList.length,
          pipeline_summary: pipelineSummary,
        },
        voice: {
          calls_count: voiceSummary.totalCallsToday,
          minutes_used: voiceSummary.totalMinutesUsed,
          active_agents: voiceSummary.activeAgentsCount,
          wallet_balance: voiceSummary.walletCreditsRemaining,
          currency: 'INR',
        },
        social: {
          scheduled_posts: Array.isArray(socialPosts) ? socialPosts.filter((p: any) => p.status === 'scheduled').length : 0,
          connected_accounts: Array.isArray(socialAccounts) ? (socialAccounts as any[]).filter((a: any) => a.connected !== false).length : ((socialAccounts as any)?.accounts?.length || 0),
        },
        telegram: {
          bot_status: tgSummary.botConnected ? 'connected' : 'disconnected',
          active_sessions: tgSessionsCount,
          landing_pages: tgLandingPagesCount,
          subscribers_count: tgSummary.telesubSubscribers,
          monthly_revenue: tgSummary.telesubMonthlyRevenue,
        },
      },
      recent_activity: recentActivity,
    };
  }
}
