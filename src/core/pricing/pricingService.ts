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
}

export class PricingService {
  /**
   * Fetches all active pricing plans directly from Supabase, with graceful fallbacks
   */
  public static async getPlans(category?: string): Promise<PricingPlan[]> {
    return fetchSupabasePricingPlans(category);
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
