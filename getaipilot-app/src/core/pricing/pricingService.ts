import { supabase } from '../../lib/supabase';
import { apiClient } from '../api/client';

export interface PricingPlan {
  id: string;
  plan_name: string;
  currency: string;
  amount: number; // amount in paise (e.g. 99900 = ₹999)
  duration: string; // "monthly" | "yearly" | "quarterly"
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  plan_label?: string | null;
  category?: string | null; // "calling" | "whatsapp" | "telegram" | "social" | "crm" | "all-in-one" | "platform"
  description?: string | null;
  features?: string[] | null;
  color?: string | null;
  icon?: string | null;
  is_popular?: boolean | null;
  razorpay_plan_id?: string | null;
  included_call_minutes?: number | null;
  extra_call_rate_paise?: number | null;
  included_numbers?: number | null;
  included_channels?: number | null;
  setup_fee_paise?: number | null;
  billing_note?: string | null;
  is_addon?: boolean | null;
}

export type PlanCategory = 'all' | 'all-in-one' | 'calling' | 'social' | 'whatsapp' | 'telegram' | 'crm';

export const CATEGORY_META: Record<
  string,
  { label: string; icon: string; color: string; badge: string; desc: string }
> = {
  all: {
    label: 'All Plans',
    icon: 'apps',
    color: '#0A84FF',
    badge: 'ALL ENGINES',
    desc: 'Complete GetAiPilot Ecosystem Quotas',
  },
  'all-in-one': {
    label: 'GAP Pro',
    icon: 'diamond',
    color: '#8B5CF6',
    badge: 'ALL-IN-ONE PRO',
    desc: 'Complete All-in-One AI Suite (WhatsApp, Telegram, Voice, CRM, Social)',
  },
  calling: {
    label: 'Voice AI',
    icon: 'call',
    color: '#8B5CF6',
    badge: 'VOICE AGENTS',
    desc: 'AI Autonomous Inbound & Outbound Calling',
  },
  social: {
    label: 'Social Pilot',
    icon: 'share-social',
    color: '#EC4899',
    badge: 'OMNICHANNEL',
    desc: 'Auto-posting, AI captions & DM automation',
  },
  whatsapp: {
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    badge: 'META API',
    desc: 'Cloud API broadcasting & 24/7 bots',
  },
  telegram: {
    label: 'Telegram',
    icon: 'paper-plane',
    color: '#0088CC',
    badge: 'HIGH SPEED',
    desc: 'Channel forwarders, filters & bot triggers',
  },
  crm: {
    label: 'Smart CRM',
    icon: 'people',
    color: '#F59E0B',
    badge: 'PIPELINES',
    desc: 'Contact management, leads & deals sync',
  },
};

export type GapProInterval = 'month' | 'quarterly' | 'six_months' | 'year';

export interface GapProBillingOption {
  key: GapProInterval;
  label: string;
  badge?: string;
  discountPercent: number;
  months: number;
  days: number;
}

export const GAP_PRO_INTERVALS: GapProBillingOption[] = [
  { key: 'month', label: 'Monthly', discountPercent: 0, months: 1, days: 30 },
  { key: 'quarterly', label: 'Quarterly', badge: '10% OFF', discountPercent: 10, months: 3, days: 90 },
  { key: 'six_months', label: 'Half-Yearly', badge: '20% OFF', discountPercent: 20, months: 6, days: 180 },
  { key: 'year', label: 'Yearly', badge: '30% OFF', discountPercent: 30, months: 12, days: 365 },
];

export const calculateGapProPricing = (
  baseAmountInPaise: number,
  intervalKey: GapProInterval,
  referralDiscountPercent: number = 0
) => {
  const option = GAP_PRO_INTERVALS.find((o) => o.key === intervalKey) || GAP_PRO_INTERVALS[0];
  const baseMonthlyRupees = Math.round(baseAmountInPaise / 100);

  const intervalDiscountPercent = option.discountPercent;
  const discountedMonthlyRupees = Math.round(baseMonthlyRupees * (1 - intervalDiscountPercent / 100));

  const finalMonthlyRupees =
    referralDiscountPercent > 0
      ? Math.max(1, Math.round(discountedMonthlyRupees * (1 - referralDiscountPercent / 100)))
      : discountedMonthlyRupees;

  const totalChargedRupees = finalMonthlyRupees * option.months;
  const originalPeriodRupees = baseMonthlyRupees * option.months;
  const totalSavedRupees = originalPeriodRupees - totalChargedRupees;

  return {
    option,
    baseMonthlyRupees,
    finalMonthlyRupees,
    totalChargedRupees,
    originalPeriodRupees,
    totalSavedRupees,
    hasDiscount: intervalDiscountPercent > 0 || referralDiscountPercent > 0,
    intervalDiscountPercent,
  };
};

/**
 * Checks whether a given plan is considered an Add-on (e.g. dedicated phone number, extra seats)
 */
export const isAddonPlan = (plan: PricingPlan): boolean => {
  if (plan.is_addon) return true;
  const name = (plan.plan_name || '').toLowerCase();
  const label = (plan.plan_label || '').toLowerCase();
  const id = (plan.id || '').toLowerCase();
  return (
    name.includes('number') ||
    name.includes('extra_user') ||
    label.includes('phone number') ||
    label.includes('extra seat') ||
    id.includes('number') ||
    id.includes('extra_user')
  );
};

const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uklxlappjcuvdqjvecfh.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4';

/**
 * Directly queries the Supabase REST PostgREST API for active pricing plans
 * matching the cURL specification:
 * curl --url 'https://<SUPABASE_URL>/rest/v1/pricing_plans?select=*&is_active=eq.true'
 *   -H 'accept: *\/*'
 *   -H 'accept-profile: public'
 *   -H 'apikey: <ANON_KEY>'
 *   -H 'authorization: Bearer <ANON_KEY>'
 */
export async function fetchSupabasePricingPlans(category?: string): Promise<any> {
  // 1. Direct REST fetch with exact curl headers
  try {
    let url = `${SUPABASE_URL}/rest/v1/pricing_plans?select=*&is_active=eq.true&order=amount.asc`;
    if (category && category !== 'all') {
      url += `&category=eq.${encodeURIComponent(category)}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 7000);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'accept-profile': 'public',
        'apikey': SUPABASE_ANON_KEY,
        'authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'origin': 'https://getaipilot.in',
        'referer': 'https://getaipilot.in/',
        'sec-fetch-dest': 'empty',
        'sec-fetch-mode': 'cors',
        'sec-fetch-site': 'cross-site',
        'x-client-info': 'supabase-js-web/2.78.0',
      },
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as PricingPlan[];
      }
    }
  } catch (restErr) {
    if (__DEV__) {
      console.warn('[PricingService] Supabase REST API fetch failed, trying Supabase JS Client:', restErr);
    }
  }

  // 2. Supabase JS Client SDK fallback
  try {
    let query = supabase
      .from('pricing_plans')
      .select('*')
      .eq('is_active', true)
      .order('amount', { ascending: true });

    if (category && category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      return data as PricingPlan[];
    }
  } catch (sbErr) {
    if (__DEV__) {
      console.warn('[PricingService] Supabase client query error:', sbErr);
    }
  }

  // 3. BFF API Endpoint fallback (if deployed & accessible)
  try {
    const res = await apiClient.get<{ success: boolean; data: PricingPlan[] }>(
      '/mobile/v1/billing/plans',
      {
        params: category && category !== 'all' ? { category } : undefined,
        skipAuth: true,
      }
    );
    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (err) {
    // BFF optional fallback failure is silently caught
  }

  return null;
}

export const CANONICAL_ECOSYSTEM_PLANS: PricingPlan[] = [
  // --- 1. WHATSAPP AUTOMATION (Official Meta Cloud API) ---
  {
    id: 'a642e61c-8e4d-44a3-aa6a-e27efb99e71e',
    plan_name: 'whatsapp_starter_monthly',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'WA Starter',
    category: 'whatsapp',
    description: 'Simple WhatsApp workspace for small shops and service businesses.',
    features: [
      '1 WhatsApp number can be connected',
      '1,000 contacts',
      '5 automation flows',
      'Manual broadcasts',
      'Basic bot replies',
    ],
    color: 'blue',
    icon: 'zap',
    is_popular: false,
    razorpay_plan_id: null,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 1,
    included_channels: 1,
    setup_fee_paise: 0,
    billing_note: 'Billed monthly.',
  },
  {
    id: '3bdfa67b-1cb2-4752-b5e1-5db0d603e5c9',
    plan_name: 'whatsapp_growth_monthly',
    currency: 'INR',
    amount: 199900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'WA Growth',
    category: 'whatsapp',
    description: 'Best plan for growing teams running campaigns and customer support.',
    features: [
      '10,000 contacts',
      '5 agents included',
      'Unlimited flows',
      'Broadcast campaigns',
      'Message spend dashboard',
    ],
    color: 'emerald',
    icon: 'crown',
    is_popular: true,
    razorpay_plan_id: null,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 1,
    included_channels: 1,
    setup_fee_paise: 0,
    billing_note: 'Billed monthly.',
  },
  {
    id: 'fa0c90e1-158c-4508-bdec-aeca6fdecf41',
    plan_name: 'whatsapp_pro_monthly',
    currency: 'INR',
    amount: 349900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'WA Pro',
    category: 'whatsapp',
    description: 'Advanced automation, campaigns, AI agents, and reporting.',
    features: [
      '2 WhatsApp numbers',
      '50,000 contacts',
      '10 agents included',
      'Campaign scheduler',
      'API and webhooks',
    ],
    color: 'purple',
    icon: 'award',
    is_popular: false,
    razorpay_plan_id: null,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 2,
    included_channels: 2,
    setup_fee_paise: 0,
    billing_note: 'Billed monthly.',
  },

  // --- 2. TELEGRAM SUITE (High-Speed Channel Routing & Bots) ---
  {
    id: '9cae7afb-73e7-4e13-b41f-ae05a20c2dbf',
    plan_name: 'telegram_monthly',
    currency: 'INR',
    amount: 149900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'TG Pro',
    category: 'telegram',
    description: 'Full Telegram Automation Suite with 8 powerful growth tools.',
    features: [
      'Priority High-Speed Servers',
      'Unlimited Automated Forwards',
      'Advanced Audience Analytics',
      'Whitelabel Dashboard Access',
      'Priority WhatsApp Support',
    ],
    color: 'emerald',
    icon: 'zap',
    is_popular: false,
    razorpay_plan_id: 'plan_StyqlqVWQeZl98',
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 0,
    included_channels: 0,
    setup_fee_paise: 0,
    billing_note: 'Billed monthly. Full Telegram automation.',
  },

  // --- 3. VOICE AI (AI Telecalling, Inbound & Outbound Bots) ---
  {
    id: '9c7fa53b-7fe0-46d9-8c1c-40daa3b547ec',
    plan_name: 'calling_lite_monthly',
    currency: 'INR',
    amount: 149900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'Start',
    category: 'calling',
    description: 'Starter AI calling plan for small businesses and testing.',
    features: [
      '250 AI Calling Minutes',
      '₹6.00 / min per-minute rate',
      'Hindi, English & Hinglish Support',
      'Custom AI System Prompts',
      'Basic Lead & Contact Capture',
    ],
    color: 'blue',
    icon: 'phone',
    is_popular: false,
    razorpay_plan_id: null,
    included_call_minutes: 250,
    extra_call_rate_paise: 600,
    included_numbers: 1,
    included_channels: 1,
    setup_fee_paise: 0,
    billing_note: 'Includes 250 AI calling minutes. Extra minutes charged at ₹6/min.',
  },
  {
    id: 'e746cb80-cc2c-45ac-bbba-c574080f4eb8',
    plan_name: 'calling_pro_monthly',
    currency: 'INR',
    amount: 499900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'Build',
    category: 'calling',
    description: 'Growth AI calling plan for sales, support, and lead qualification.',
    features: [
      '1,000 AI Calling Minutes',
      '₹5.00 / min per-minute rate',
      'Realtime Live Call Transfer',
      'Automatic CRM Auto-Syncing',
      'Live Call Transcripts & Recording',
    ],
    color: 'purple',
    icon: 'award',
    is_popular: true,
    razorpay_plan_id: null,
    included_call_minutes: 1000,
    extra_call_rate_paise: 500,
    included_numbers: 1,
    included_channels: 1,
    setup_fee_paise: 0,
    billing_note: 'Includes 1,000 AI calling minutes. Extra minutes charged at ₹5/min.',
  },
  {
    id: '355b80d5-7283-4078-9f54-3d19babb8530',
    plan_name: 'calling_elite_monthly',
    currency: 'INR',
    amount: 799900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'Scale',
    category: 'calling',
    description: 'High-volume AI calling plan for serious businesses.',
    features: [
      '2,000 AI Calling Minutes',
      '₹4.00 / min per-minute rate',
      'Unlimited Multi-Agent Workflows',
      'Priority SIP Latency Routing',
      'Dedicated Account Manager',
    ],
    color: 'emerald',
    icon: 'crown',
    is_popular: false,
    razorpay_plan_id: null,
    included_call_minutes: 2000,
    extra_call_rate_paise: 400,
    included_numbers: 1,
    included_channels: 1,
    setup_fee_paise: 0,
    billing_note: 'Includes 2,000 AI calling minutes. Extra minutes charged at ₹4/min.',
  },
  {
    id: 'f647a473-cfa8-47fe-97d6-d1520aee2023',
    plan_name: 'calling_phone_number_monthly',
    currency: 'INR',
    amount: 149900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'Phone Number',
    category: 'calling',
    is_addon: true,
    description: 'Dedicated Business Number with inbound IVR routing and automated calling support.',
    features: [
      '1 Dedicated Business Phone Number',
      'Inbound & Outbound Calling Support',
      'Automated IVR Call Forwarding',
      'High Reliability SIP Trunk Routing',
      'Real-time Call Records & Analytics',
    ],
    color: 'blue',
    icon: 'phone',
    is_popular: false,
    razorpay_plan_id: null,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 1,
    included_channels: 1,
    setup_fee_paise: 0,
    billing_note: 'Billed monthly. Dedicated local business phone number.',
  },

  // --- 4. SMART CRM (Leads + Invoicing + Team Activity) ---
  {
    id: 'ecb219b1-e4f0-4314-8fff-c46bc3cb61f1',
    plan_name: 'crm_pro_modules',
    currency: 'INR',
    amount: 79900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'CRM Pro Modules',
    category: 'crm',
    description: '3-IN-1 PACK: Leads + Auto Invoice + Team Activity',
    features: [
      'Leads Module: Intake Forms, Webhooks & Pipeline Stages',
      'Auto Invoice: Recurring Monthly Billing & GST Reminders',
      'Team Activity: Real-time Action Stream & Audit Logs',
      'Full Workspace Access for All Team Members',
    ],
    color: 'blue',
    icon: 'Sparkles',
    is_popular: false,
    razorpay_plan_id: null,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 0,
    included_channels: 0,
    setup_fee_paise: 0,
    billing_note: '3-IN-1 PACK: Leads + Auto Invoice + Team Activity',
  },

  // --- 5. SOCIAL PILOT (Auto-Publish & Multi-Platform Scheduler) ---
  {
    id: 'cb719495-5f0e-4c81-a32d-9d11d998bc21',
    plan_name: 'social_pilot_starter',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    plan_label: 'SPstarter',
    category: 'social',
    description: 'Schedule & auto-publish across social platforms',
    features: [
      'Auto-Post to Facebook, Instagram & LinkedIn',
      'Unlimited Post Scheduling',
      'AI Caption Generator',
      'Smart Hashtag Suggestions',
      'Multi-Account Management',
      'WhatsApp Support',
    ],
    color: 'amber',
    icon: 'globe',
    is_popular: false,
    razorpay_plan_id: 'plan_SwIlOb0ufTl6iG',
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 0,
    included_channels: 0,
    setup_fee_paise: 0,
    billing_note: 'Billed monthly.',
  },
];

export class PricingService {
  /**
   * Fetches all active pricing plans directly from Supabase/BFF.
   * If remote fetch succeeds, returns active production plans.
   * Falls back to canonical verified plans if offline.
   */
  public static async getPlans(category?: string): Promise<PricingPlan[]> {
    const remotePlans = await fetchSupabasePricingPlans(category);
    
    let combined: PricingPlan[] = [];
    if (Array.isArray(remotePlans) && remotePlans.length > 0) {
      combined = remotePlans;
    } else {
      combined = [...CANONICAL_ECOSYSTEM_PLANS];
    }

    if (category && category !== 'all') {
      const targetCat = category.toLowerCase();
      return combined.filter((p) => {
        const pCat = (p.category || '').toLowerCase();
        if (targetCat === 'calling' || targetCat === 'voice') {
          return pCat === 'calling' || pCat === 'voice';
        }
        if (targetCat === 'all-in-one') {
          return pCat === 'all-in-one' || pCat === 'bundle' || pCat === 'ecosystem';
        }
        return pCat === targetCat;
      });
    }

    return combined;
  }

  /**
   * Formats paise integer to Rupees string (e.g. 99900 -> ₹999)
   */
  public static formatPrice(amountInPaise: number, currency: string = 'INR'): string {
    const rupees = Math.round(amountInPaise / 100);
    if (currency === 'INR') {
      return `₹${rupees.toLocaleString('en-IN')}`;
    }
    return `${currency} ${rupees.toLocaleString()}`;
  }

  /**
   * Formats duration to human string
   */
  public static formatDuration(duration: string): string {
    const d = duration.toLowerCase();
    if (d === 'monthly' || d === 'month') return '/month';
    if (d === 'yearly' || d === 'year' || d === 'annual') return '/year';
    if (d === 'quarterly' || d === 'quarter') return '/quarter';
    if (d === 'six_months') return '/6 months';
    return `/${duration}`;
  }
}
