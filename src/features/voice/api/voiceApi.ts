import { useAuthStore } from '../../../core/store/authStore';
import { voicePilotSupabase as supabase } from '../../../lib/supabase';

export interface DedicatedNumber {
  id: string;
  phone_number: string;
  status: 'active' | 'inactive' | 'pending' | 'available';
  provider?: string;
  kyc_status?: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  assistants?: { id: string; name: string };
  monthly_price?: number;
  assigned_at?: string;
}

export interface KycStatusResponse {
  id?: string;
  status: 'verified' | 'pending' | 'rejected' | 'not_submitted';
  businessName?: string;
  documentType?: string;
  idNumber?: string;
  verifiedAt?: string;
  assignedNumber?: string;
  rejectionReason?: string;
}

export interface VoiceAnalytics {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  totalDurationDisplay: string;
  totalDurationSeconds: number;
  creditsUsed: string;
  campaignCalls: number;
}

export interface VoiceBalanceStatus {
  availableBalance: number;
  availableMinutes: number;
  totalCreditsEarned: number;
  totalCreditsUsed: number;
  reservedCredits: number;
  status: 'healthy' | 'low' | 'depleted';
  formattedBalance: string;
  ratePerMinute: string;
  planName: string;
  planRenewalDate: string;
  dedicatedNumberEntitlements: number;
}

export interface BillingTransactions {
  payments: Array<{
    id: string;
    type: 'number_purchase' | 'subscription' | 'credit_topup';
    title: string;
    amount: number;
    currency: string;
    status: 'paid' | 'pending' | 'failed';
    date: string;
    invoice_id?: string;
  }>;
  creditLedger: Array<{
    id: string;
    type: 'usage' | 'topup';
    description: string;
    credits: number;
    date: string;
  }>;
  subscription?: {
    plan: string;
    priceMonthly: number;
    status: string;
    renewalDate: string;
    dedicatedNumberClaimed: boolean;
  };
}

export interface VoiceCall {
  id: string;
  assistant?: string;
  assistantId?: string;
  customerNumber: string;
  callerName?: string;
  assignedNumber?: string;
  duration?: string;
  durationSeconds?: number;
  status: 'completed' | 'in_progress' | 'failed' | 'cancelled' | 'ringing' | 'queued';
  direction?: 'inbound' | 'outbound';
  cost?: string;
  time?: string;
  createdAt?: string;
  recordingUrl?: string;
  summary?: string;
  transcript?: string;
  notes?: string;
  campaign?: string;
  campaignId?: string;
}

export interface VoiceCampaign {
  id: string;
  name: string;
  category?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  assistant_id?: string;
  assistant_name?: string;
  phone_number_id?: string;
  phone_number?: string;
  total_contacts: number;
  pending_contacts?: number;
  completed_contacts?: number;
  failed_contacts?: number;
  retry_count?: number;
  progress?: number;
  created_at?: string;
  updated_at?: string;
  recent_calls?: VoiceCall[];
}

export interface VoiceContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  company?: string;
  notes?: string;
  campaigns_count?: number;
  calls_count?: number;
  last_called_at?: string;
  created_at?: string;
  campaign_history?: Array<{
    id: string;
    name: string;
    date: string;
    status: string;
    duration: string;
  }>;
  call_history?: Array<{
    id: string;
    time: string;
    duration: string;
    status: string;
    assistant: string;
    recording_url?: string;
  }>;
}

export interface VoiceAssistant {
  id: string;
  name: string;
  provider?: string;
  status?: string;
  config_snapshot?: {
    prompt?: string;
    system_prompt?: string;
    voice_id?: string;
    language?: string;
    [key: string]: any;
  };
  created_at?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(id?: string | null): boolean {
  if (!id) return false;
  return UUID_REGEX.test(id.trim());
}

/**
 * Resolves the valid UUID workspace ID for the logged-in user from the database
 */
async function getActiveWorkspaceId(): Promise<string | null> {
  try {
    const storeWorkspaceId = useAuthStore.getState().tenantMapping?.voice_workspace_id;
    if (storeWorkspaceId && isValidUUID(storeWorkspaceId)) {
      return storeWorkspaceId;
    }

    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (userId && isValidUUID(userId)) {
      // 1. Check workspace_members
      const { data: member } = await supabase
        .from('workspace_members')
        .select('workspace_id')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle();

      if (member?.workspace_id && isValidUUID(member.workspace_id)) {
        return member.workspace_id;
      }

      // 2. Check workspaces owned by user
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .eq('owner_id', userId)
        .limit(1)
        .maybeSingle();

      if (ws?.id && isValidUUID(ws.id)) {
        return ws.id;
      }
    }

    return null;
  } catch (err) {
    console.warn('[voiceApi] Could not resolve workspace ID:', err);
    return null;
  }
}

/**
 * Guarantees a valid workspace UUID for insert operations
 */
async function requireWorkspaceId(): Promise<string> {
  const wsId = await getActiveWorkspaceId();
  if (wsId && isValidUUID(wsId)) return wsId;

  throw new Error('No active workspace found for your account.');
}

function formatDurationDisplay(totalSeconds: number): string {
  if (!totalSeconds || totalSeconds <= 0) return '0m';
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export const voiceApi = {
  // ============================================================================
  // Overview & Analytics (From Supabase `calls`, `credit_ledger`, `usage_events`)
  // ============================================================================
  getOverview: async () => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) {
      return { totalCalls: 0, completedCalls: 0 };
    }

    const { data: calls, error } = await supabase
      .from('calls')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (error) throw error;

    const total = calls?.length || 0;
    const completed = calls?.filter((c) => c.status === 'completed').length || 0;
    return { totalCalls: total, completedCalls: completed };
  },

  getAnalytics: async (): Promise<VoiceAnalytics> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) {
      return {
        totalCalls: 0,
        completedCalls: 0,
        failedCalls: 0,
        totalDurationSeconds: 0,
        totalDurationDisplay: '0m',
        creditsUsed: '₹0',
        campaignCalls: 0,
      };
    }

    // Query calls from public.calls
    const { data: calls, error: callsErr } = await supabase
      .from('calls')
      .select('*')
      .eq('workspace_id', workspaceId);

    if (callsErr) throw callsErr;

    const callList = calls || [];
    const totalCalls = callList.length;
    const completedCalls = callList.filter((c) => c.status === 'completed').length;
    const failedCalls = callList.filter((c) => c.status === 'failed' || c.status === 'cancelled').length;
    const campaignCalls = callList.filter((c) => Boolean(c.campaign_id)).length;
    const totalDurationSeconds = callList.reduce((acc, c) => acc + (c.duration_seconds || 0), 0);

    // Query credit usage from public.credit_ledger
    const { data: ledger } = await supabase
      .from('credit_ledger')
      .select('amount, type')
      .eq('workspace_id', workspaceId);

    const creditsCharged = ledger
      ? ledger.filter((l) => l.type === 'charge').reduce((acc, l) => acc + Number(l.amount || 0), 0)
      : 0;

    return {
      totalCalls,
      completedCalls,
      failedCalls,
      totalDurationSeconds,
      totalDurationDisplay: formatDurationDisplay(totalDurationSeconds),
      creditsUsed: `₹${creditsCharged.toLocaleString('en-IN')}`,
      campaignCalls,
    };
  },

  getBalanceStatus: async (): Promise<VoiceBalanceStatus> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) {
      return {
        availableBalance: 0,
        availableMinutes: 0,
        totalCreditsEarned: 0,
        totalCreditsUsed: 0,
        reservedCredits: 0,
        status: 'depleted',
        formattedBalance: '₹0.00',
        ratePerMinute: '₹1.00/min',
        planName: 'Free / Starter',
        planRenewalDate: '',
        dedicatedNumberEntitlements: 0,
      };
    }

    let balance = 0;
    let earned = 0;
    let used = 0;
    let reserved = 0;

    try {
      // 1. Try RPC get_workspace_credit_balance
      const { data: rpcBal } = await supabase.rpc('get_workspace_credit_balance', {
        p_workspace_id: workspaceId,
      });
      if (rpcBal !== null && rpcBal !== undefined) {
        balance = Number(rpcBal);
      }
    } catch (e) {
      console.warn('[voiceApi.getBalanceStatus] RPC error, using ledger fallback:', e);
    }

    // 2. Query credit_ledger breakdown
    const { data: ledger } = await supabase
      .from('credit_ledger')
      .select('amount, type')
      .eq('workspace_id', workspaceId);

    if (ledger && ledger.length > 0) {
      earned = ledger
        .filter((l) => l.type === 'top_up' || l.type === 'grant' || l.type === 'refund')
        .reduce((acc, l) => acc + Number(l.amount || 0), 0);

      used = ledger
        .filter((l) => l.type === 'charge')
        .reduce((acc, l) => acc + Math.abs(Number(l.amount || 0)), 0);

      reserved = ledger
        .filter((l) => l.type === 'reservation')
        .reduce((acc, l) => acc + Math.abs(Number(l.amount || 0)), 0);

      if (balance === 0) {
        balance = Math.max(0, earned - used - reserved);
      }
    }

    // 3. Query Workspace Entitlements & Subscription
    const { data: wsData } = await supabase
      .from('workspaces')
      .select('dedicated_number_entitlements')
      .eq('id', workspaceId)
      .maybeSingle();

    const { data: subData } = await supabase
      .from('workspace_subscriptions')
      .select('*, plans(*)')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .maybeSingle();

    const planName = subData?.plans?.name || (subData ? 'Custom Plan' : 'Free / Starter');
    const renewalDate = subData?.current_period_end
      ? new Date(subData.current_period_end).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : '';
    const dedicatedNumberEntitlements = wsData?.dedicated_number_entitlements ?? 0;

    const status: 'healthy' | 'low' | 'depleted' =
      balance > 25 ? 'healthy' : balance > 0 ? 'low' : 'depleted';

    return {
      availableBalance: Math.round(balance * 100) / 100,
      availableMinutes: Math.floor(balance),
      totalCreditsEarned: Math.round(earned),
      totalCreditsUsed: Math.round(used),
      reservedCredits: Math.round(reserved),
      status,
      formattedBalance: `₹${balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`,
      ratePerMinute: '₹1.00/min',
      planName,
      planRenewalDate: renewalDate,
      dedicatedNumberEntitlements,
    };
  },

  topUpCredits: async (amount: number): Promise<{ success: boolean; newBalance: number }> => {
    const workspaceId = await requireWorkspaceId();

    // 1. Insert into payment_intents (valid schema columns only)
    const amountPaise = Math.round(amount * 100);
    const { data: paymentIntent, error: piErr } = await supabase
      .from('payment_intents')
      .insert({
        workspace_id: workspaceId,
        amount_paise: amountPaise,
        purchase_type: 'top_up',
        status: 'completed',
        razorpay_payment_id: `pay_${Date.now()}`,
        razorpay_order_id: `order_${Date.now()}`,
      })
      .select()
      .single();

    if (piErr) {
      console.warn('[voiceApi.topUpCredits] payment_intents warning:', piErr);
    }

    // 2. Insert into credit_ledger
    const { error: clErr } = await supabase.from('credit_ledger').insert({
      workspace_id: workspaceId,
      type: 'top_up',
      amount: amount,
      description: `Voice Credits Top-Up (₹${amount.toLocaleString('en-IN')})`,
      reference_id: paymentIntent?.id || `topup_${Date.now()}`,
    });

    if (clErr) {
      console.warn('[voiceApi.topUpCredits] credit_ledger insert error:', clErr);
      throw clErr;
    }

    const updated = await voiceApi.getBalanceStatus();
    return { success: true, newBalance: updated.availableBalance };
  },

  getBillingTransactions: async (): Promise<BillingTransactions> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) {
      return { payments: [], creditLedger: [], subscription: undefined };
    }

    // 1. Payment Intents (from public.payment_intents)
    const { data: paymentIntents } = await supabase
      .from('payment_intents')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 2. Credit Ledger (from public.credit_ledger)
    const { data: ledgerEntries } = await supabase
      .from('credit_ledger')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    // 3. Workspace Subscription (from public.workspace_subscriptions joined with public.plans)
    const { data: subData } = await supabase
      .from('workspace_subscriptions')
      .select('*, plans(*)')
      .eq('workspace_id', workspaceId)
      .limit(1)
      .maybeSingle();

    const payments = (paymentIntents || []).map((pi) => ({
      id: pi.id,
      type: (pi.purchase_type === 'number_purchase'
        ? 'number_purchase'
        : pi.purchase_type === 'top_up'
        ? 'credit_topup'
        : 'subscription') as any,
      title:
        pi.purchase_type === 'number_purchase'
          ? 'Dedicated Phone Number'
          : pi.purchase_type === 'top_up'
          ? 'Voice Credits Top-Up'
          : 'VoicePilot Pro Subscription',
      amount: Math.round(Number(pi.amount_paise || 0) / 100),
      currency: 'INR',
      status: (pi.status === 'completed' ? 'paid' : pi.status === 'failed' ? 'failed' : 'pending') as any,
      date: pi.paid_at || pi.created_at,
      invoice_id: pi.razorpay_payment_id || pi.razorpay_order_id,
    }));

    const creditLedger = (ledgerEntries || []).map((cl) => ({
      id: cl.id,
      type: (cl.type === 'charge' || cl.type === 'reservation' ? 'usage' : 'topup') as any,
      description: cl.description || (cl.type === 'charge' ? 'Voice Call Minutes' : 'Credit Top-up'),
      credits: Number(cl.amount || 0),
      date: cl.created_at,
    }));

    const subscription = subData
      ? {
          plan: subData.plans?.name || 'VoicePilot Standard',
          priceMonthly: Number(subData.plans?.price_monthly || 1499),
          status: subData.status || 'active',
          renewalDate: subData.current_period_end || new Date().toISOString(),
          dedicatedNumberClaimed: true,
        }
      : undefined;

    return { payments, creditLedger, subscription };
  },

  // ============================================================================
  // Dedicated Numbers & KYC (From public.phone_numbers & public.kyc_requests)
  // ============================================================================
  getNumbers: async (): Promise<DedicatedNumber[]> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) return [];

    const { data, error } = await supabase
      .from('phone_numbers')
      .select('*, assistants(id, name)')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((n) => ({
      id: n.id,
      phone_number: n.phone_number,
      status: n.status || 'active',
      provider: n.provider || 'vomyra',
      kyc_status: 'verified',
      assistants: n.assistants ? { id: n.assistants.id, name: n.assistants.name } : undefined,
      monthly_price: 1499,
      assigned_at: n.current_period_start || n.created_at,
    }));
  },

  getAvailableNumbers: async (): Promise<Array<{ id: string; phone_number: string; price?: number }>> => {
    const { data, error } = await supabase
      .from('phone_numbers')
      .select('id, phone_number')
      .eq('status', 'available')
      .is('deleted_at', null)
      .limit(20);

    if (error || !data) return [];

    return data.map((d) => ({
      id: d.id,
      phone_number: d.phone_number,
      price: 1499,
    }));
  },

  claimDedicatedNumber: async (payload: { phoneNumber: string; price?: number }) => {
    const workspaceId = await requireWorkspaceId();

    const { data: claim, error: claimErr } = await supabase.from('number_claims').insert({
      workspace_id: workspaceId,
      phone_number: payload.phoneNumber,
      status: 'claimed',
    }).select().single();

    if (claimErr) throw claimErr;

    // Provision directly in public.phone_numbers
    const { data: phoneNum, error: phoneErr } = await supabase.from('phone_numbers').insert({
      workspace_id: workspaceId,
      phone_number: payload.phoneNumber,
      provider: 'vomyra',
      provider_resource_id: `claim_${Date.now()}`,
      status: 'active',
    }).select().single();

    if (phoneErr) throw phoneErr;
    return { success: true, claim, phoneNum };
  },

  assignPhoneNumber: async (payload: { numberId: string; assistantId: string }) => {
    const { data, error } = await supabase
      .from('phone_numbers')
      .update({ assigned_assistant_id: payload.assistantId, status: 'active' })
      .eq('id', payload.numberId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  unassignPhoneNumber: async (numberId: string) => {
    const { data, error } = await supabase
      .from('phone_numbers')
      .update({ assigned_assistant_id: null, status: 'unassigned' })
      .eq('id', numberId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  releasePhoneNumber: async (numberId: string) => {
    const { data, error } = await supabase
      .from('phone_numbers')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', numberId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  getKycStatus: async (): Promise<KycStatusResponse> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) {
      return { status: 'not_submitted', businessName: '' };
    }

    const { data, error } = await supabase
      .from('kyc_requests')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;

    if (data) {
      return {
        id: data.id,
        status: (data.status as any) || 'pending',
        businessName: data.business_name || data.verified_pan_name || 'Enterprise Workspace',
        documentType: data.verification_method || 'GSTIN / DigiLocker',
        idNumber: data.pan_number_last4 ? `•••• •••• ${data.pan_number_last4}` : 'Submitted',
        verifiedAt: data.pan_verified_at || data.digilocker_verified_at || data.created_at,
        assignedNumber: data.assigned_number,
      };
    }

    return {
      status: 'not_submitted',
      businessName: '',
    };
  },

  submitKycRequest: async (payload: { businessName: string; documentType: string; idNumber: string; comments?: string }) => {
    const workspaceId = await requireWorkspaceId();

    const { data, error } = await supabase.from('kyc_requests').insert({
      workspace_id: workspaceId,
      business_name: payload.businessName,
      verification_method: payload.documentType,
      use_case: payload.comments || 'Phone number provisioning',
      status: 'pending',
    }).select().single();

    if (error) throw error;
    return { success: true, data };
  },

  // ============================================================================
  // Calls (From public.calls with assistants & contacts joins)
  // ============================================================================
  getCalls: async (params?: { limit?: number; status?: string; assistantId?: string }): Promise<VoiceCall[]> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) return [];

    let query = supabase
      .from('calls')
      .select(`
        id,
        customer_number,
        status,
        duration_seconds,
        recording_url,
        transcript,
        notes,
        whatsapp_summary,
        started_at,
        ended_at,
        created_at,
        campaign_id,
        assistant_id,
        assistants ( id, name ),
        contacts ( id, name, phone ),
        campaigns ( id, name )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(params?.limit || 50);

    if (params?.status && params.status !== 'all') {
      query = query.eq('status', params.status);
    }
    if (params?.assistantId && isValidUUID(params.assistantId)) {
      query = query.eq('assistant_id', params.assistantId);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data || []).map((c: any) => {
      const durSec = c.duration_seconds || 0;
      return {
        id: c.id,
        assistant: c.assistants?.name || 'Voice Assistant',
        assistantId: c.assistant_id,
        customerNumber: c.customer_number,
        callerName: c.contacts?.name || undefined,
        status: c.status || 'completed',
        durationSeconds: durSec,
        duration: formatDurationDisplay(durSec),
        direction: 'outbound',
        createdAt: c.created_at,
        time: c.started_at || c.created_at,
        recordingUrl: c.recording_url,
        summary: c.whatsapp_summary || (typeof c.transcript === 'string' ? c.transcript.slice(0, 100) : undefined),
        transcript: typeof c.transcript === 'object' ? JSON.stringify(c.transcript, null, 2) : c.transcript,
        notes: c.notes,
        campaign: c.campaigns?.name,
        campaignId: c.campaign_id,
      };
    });
  },

  getCallDetails: async (callId: string): Promise<VoiceCall> => {
    const { data, error } = await supabase
      .from('calls')
      .select(`
        id,
        customer_number,
        status,
        duration_seconds,
        recording_url,
        transcript,
        notes,
        whatsapp_summary,
        started_at,
        ended_at,
        created_at,
        campaign_id,
        assistant_id,
        assistants ( id, name ),
        contacts ( id, name, phone ),
        campaigns ( id, name )
      `)
      .eq('id', callId)
      .single();

    if (error) throw error;

    const durSec = data.duration_seconds || 0;
    return {
      id: data.id,
      assistant: (data as any).assistants?.name || 'Voice Assistant',
      assistantId: data.assistant_id,
      customerNumber: data.customer_number,
      callerName: (data as any).contacts?.name,
      status: data.status as any,
      durationSeconds: durSec,
      duration: formatDurationDisplay(durSec),
      direction: 'outbound',
      createdAt: data.created_at,
      time: data.started_at || data.created_at,
      recordingUrl: data.recording_url || undefined,
      summary: data.whatsapp_summary || undefined,
      transcript: typeof data.transcript === 'object' ? JSON.stringify(data.transcript, null, 2) : data.transcript,
      notes: data.notes || undefined,
      campaign: (data as any).campaigns?.name,
      campaignId: data.campaign_id || undefined,
    };
  },

  getCallTranscript: async (callId: string) => {
    const { data, error } = await supabase
      .from('calls')
      .select('transcript')
      .eq('id', callId)
      .single();

    if (error) throw error;
    return data?.transcript;
  },

  getCallRecording: async (callId: string) => {
    const { data, error } = await supabase
      .from('calls')
      .select('recording_url')
      .eq('id', callId)
      .single();

    if (error) throw error;
    return { recordingUrl: data?.recording_url };
  },

  triggerOutboundCall: async (payload: {
    customerNumber: string;
    customerName?: string;
    assistantId?: string;
    assignedNumber?: string;
    customerCountryCode?: string;
    additionalData?: Record<string, any>;
  }) => {
    const workspaceId = await requireWorkspaceId();

    // Resolve assistant ID if not provided or not a valid UUID
    let assistantId = payload.assistantId;
    if (!assistantId || !isValidUUID(assistantId)) {
      const { data: firstAst } = await supabase
        .from('assistants')
        .select('id')
        .eq('workspace_id', workspaceId)
        .is('deleted_at', null)
        .limit(1)
        .maybeSingle();
      assistantId = firstAst?.id;
    }

    if (!assistantId) {
      throw new Error('Please create or select an AI voice assistant first.');
    }

    const idempotencyKey = `call_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const { data, error } = await supabase.from('calls').insert({
      workspace_id: workspaceId,
      assistant_id: assistantId,
      customer_number: payload.customerNumber,
      status: 'queued',
      idempotency_key: idempotencyKey,
      provider: 'vomyra',
    }).select().single();

    if (error) throw error;
    return { success: true, call: data };
  },

  // ============================================================================
  // Assistants (From public.assistants)
  // ============================================================================
  getAssistants: async (): Promise<VoiceAssistant[]> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) return [];

    const { data, error } = await supabase
      .from('assistants')
      .select('*')
      .eq('workspace_id', workspaceId)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((a) => ({
      id: a.id,
      name: a.name,
      provider: a.provider || 'vomyra',
      status: a.status || 'ready',
      config_snapshot: a.config_snapshot,
      created_at: a.created_at,
    }));
  },

  createAssistant: async (payload: {
    name: string;
    systemPrompt?: string;
    voiceId?: string;
    firstMessage?: string;
    language?: string;
  }) => {
    const workspaceId = await requireWorkspaceId();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId || !isValidUUID(userId)) {
      throw new Error('User authentication profile required to create AI assistant.');
    }

    const configSnapshot = {
      prompt: payload.systemPrompt || 'You are a helpful Voice AI sales and support agent.',
      system_prompt: payload.systemPrompt || 'You are a helpful Voice AI sales and support agent.',
      voice_id: payload.voiceId || 'eleven_labs_default',
      first_message: payload.firstMessage || 'Hello! How can I assist you today?',
      language: payload.language || 'en-IN',
    };

    const { data, error } = await supabase
      .from('assistants')
      .insert({
        workspace_id: workspaceId,
        created_by: userId,
        name: payload.name,
        provider: 'vomyra',
        config_snapshot: configSnapshot,
        status: 'active',
      })
      .select()
      .single();

    if (error) throw error;
    return { success: true, assistant: data };
  },

  updateAssistant: async (assistantId: string, payload: { name?: string; systemPrompt?: string; voiceId?: string }) => {
    const updateData: any = { updated_at: new Date().toISOString() };
    if (payload.name) updateData.name = payload.name;
    if (payload.systemPrompt || payload.voiceId) {
      updateData.config_snapshot = {
        ...(payload.systemPrompt ? { prompt: payload.systemPrompt, system_prompt: payload.systemPrompt } : {}),
        ...(payload.voiceId ? { voice_id: payload.voiceId } : {}),
      };
    }

    const { data, error } = await supabase
      .from('assistants')
      .update(updateData)
      .eq('id', assistantId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, assistant: data };
  },

  deleteAssistant: async (assistantId: string) => {
    const { error } = await supabase
      .from('assistants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', assistantId);

    if (error) throw error;
    return { success: true };
  },

  // ============================================================================
  // Campaigns (From public.campaigns)
  // ============================================================================
  getCampaigns: async (): Promise<VoiceCampaign[]> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) return [];

    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        status,
        concurrency_limit,
        total_contacts,
        created_at,
        assistant_id,
        phone_number_id,
        assistants ( id, name ),
        phone_numbers ( id, phone_number )
      `)
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((c: any) => ({
      id: c.id,
      name: c.name,
      status: c.status || 'draft',
      assistant_id: c.assistant_id,
      assistant_name: c.assistants?.name,
      phone_number_id: c.phone_number_id,
      phone_number: c.phone_numbers?.phone_number,
      total_contacts: c.total_contacts || 0,
      created_at: c.created_at,
    }));
  },

  getCampaignDetails: async (campaignId: string): Promise<VoiceCampaign> => {
    const { data, error } = await supabase
      .from('campaigns')
      .select(`
        id,
        name,
        status,
        concurrency_limit,
        total_contacts,
        created_at,
        assistant_id,
        phone_number_id,
        assistants ( id, name ),
        phone_numbers ( id, phone_number )
      `)
      .eq('id', campaignId)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      status: data.status as any,
      assistant_id: data.assistant_id,
      assistant_name: (data as any).assistants?.name,
      phone_number_id: data.phone_number_id,
      phone_number: (data as any).phone_numbers?.phone_number,
      total_contacts: data.total_contacts || 0,
      created_at: data.created_at,
    };
  },

  createCampaign: async (payload: {
    name: string;
    assistantId: string;
    phoneNumberId?: string;
    contacts?: Array<{ name?: string; phone: string; details?: string }>;
    numbers?: string;
  }) => {
    const workspaceId = await requireWorkspaceId();
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData?.user?.id;

    if (!userId || !isValidUUID(userId)) {
      throw new Error('User authentication profile required');
    }

    const { data, error } = await supabase.from('campaigns').insert({
      workspace_id: workspaceId,
      created_by: userId,
      assistant_id: payload.assistantId,
      phone_number_id: payload.phoneNumberId,
      name: payload.name,
      status: 'draft',
      total_contacts: payload.contacts?.length || 0,
    }).select().single();

    if (error) throw error;
    return { success: true, data };
  },

  updateCampaign: async (campaignId: string, payload: any) => {
    const updateData: any = {};
    if (payload.name) updateData.name = payload.name;
    if (payload.assistantId && isValidUUID(payload.assistantId)) updateData.assistant_id = payload.assistantId;
    if (payload.phoneNumberId && isValidUUID(payload.phoneNumberId)) updateData.phone_number_id = payload.phoneNumberId;
    if (payload.status) updateData.status = payload.status;

    const { data, error } = await supabase
      .from('campaigns')
      .update(updateData)
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  deleteCampaign: async (campaignId: string) => {
    const { error } = await supabase.from('campaigns').delete().eq('id', campaignId);
    if (error) throw error;
    return { success: true };
  },

  updateCampaignStatus: async (campaignId: string, status: 'draft' | 'running' | 'paused' | 'completed' | 'failed') => {
    const { data, error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  // ============================================================================
  // Contacts (From public.contacts)
  // ============================================================================
  getContacts: async (): Promise<VoiceContact[]> => {
    const workspaceId = await getActiveWorkspaceId();
    if (!workspaceId) return [];

    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((c) => ({
      id: c.id,
      name: c.name || 'Unnamed Contact',
      phone: c.phone,
      email: c.metadata?.email,
      company: c.metadata?.company,
      notes: c.metadata?.notes,
      created_at: c.created_at,
    }));
  },

  getContactDetails: async (contactId: string): Promise<VoiceContact> => {
    const { data, error } = await supabase
      .from('contacts')
      .select(`
        id,
        name,
        phone,
        metadata,
        created_at,
        calls ( id, duration_seconds, status, started_at, recording_url, assistants(name) )
      `)
      .eq('id', contactId)
      .single();

    if (error) throw error;

    const calls = (data as any).calls || [];
    return {
      id: data.id,
      name: data.name || 'Unnamed Contact',
      phone: data.phone,
      email: data.metadata?.email,
      company: data.metadata?.company,
      notes: data.metadata?.notes,
      created_at: data.created_at,
      calls_count: calls.length,
      call_history: calls.map((c: any) => ({
        id: c.id,
        time: c.started_at,
        duration: formatDurationDisplay(c.duration_seconds || 0),
        status: c.status,
        assistant: c.assistants?.name || 'Voice Assistant',
        recording_url: c.recording_url,
      })),
    };
  },

  createContact: async (payload: {
    name: string;
    phone: string;
    email?: string;
    company?: string;
    notes?: string;
  }) => {
    const workspaceId = await requireWorkspaceId();

    const { data, error } = await supabase.from('contacts').insert({
      workspace_id: workspaceId,
      name: payload.name,
      phone: payload.phone,
      metadata: {
        email: payload.email,
        company: payload.company,
        notes: payload.notes,
      },
      ecosystem_sync_status: 'local',
    }).select().single();

    if (error) throw error;
    return { success: true, data };
  },

  updateContact: async (contactId: string, payload: Partial<VoiceContact>) => {
    const updateData: any = {};
    if (payload.name) updateData.name = payload.name;
    if (payload.phone) updateData.phone = payload.phone;
    if (payload.email || payload.company || payload.notes) {
      updateData.metadata = {
        email: payload.email,
        company: payload.company,
        notes: payload.notes,
      };
    }

    const { data, error } = await supabase
      .from('contacts')
      .update(updateData)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data };
  },

  deleteContact: async (contactId: string) => {
    const { error } = await supabase.from('contacts').delete().eq('id', contactId);
    if (error) throw error;
    return { success: true };
  },
};

