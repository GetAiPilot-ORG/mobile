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
  // --- 1. GAP PRO ALL-IN-ONE (Ecosystem Suite) ---
  {
    id: 'gap_pro',
    plan_name: 'gap_pro',
    plan_label: 'GAP Pro Suite',
    currency: 'INR',
    amount: 299900,
    duration: 'monthly',
    is_active: true,
    category: 'all-in-one',
    is_popular: true,
    description: 'Complete 5-in-1 AI Automation Suite. All products included.',
    billing_note: 'Billed monthly · 30-day renewal cycle',
    features: [
      'WhatsApp Meta Cloud API (15,000 msgs/mo)',
      'Voice AI Telecaller (500 AI Call Mins)',
      'Telegram Auto-Forwarder & Bot Suite',
      'Social Pilot (Instagram, X, LinkedIn, FB)',
      'Smart CRM Pipelines & Contact Sync',
      'Unified Analytics & Priority Engineering Support',
    ],
    included_call_minutes: 500,
    included_numbers: 1,
    included_channels: 10,
    extra_call_rate_paise: 500,
  },
  {
    id: 'gap_scale',
    plan_name: 'gap_scale',
    plan_label: 'GAP Pro Scale',
    currency: 'INR',
    amount: 599900,
    duration: 'monthly',
    is_active: true,
    category: 'all-in-one',
    description: 'High-volume quotas for growing agencies & multi-brand businesses.',
    billing_note: 'Billed monthly · High volume throughput',
    features: [
      'WhatsApp Broadcasts (50,000 msgs/mo)',
      'Voice AI Telecaller (2,000 AI Call Mins)',
      '2 Dedicated Virtual Phone Lines Included',
      'Unlimited Telegram Forwarding Channels',
      'Social Pilot (20 Accounts & Auto-DM)',
      'Multi-User Team CRM & Calendar Sync',
    ],
    included_call_minutes: 2000,
    included_numbers: 2,
    included_channels: 20,
    extra_call_rate_paise: 400,
  },
  {
    id: 'gap_max',
    plan_name: 'gap_max',
    plan_label: 'GAP Enterprise Max',
    currency: 'INR',
    amount: 999900,
    duration: 'monthly',
    is_active: true,
    category: 'all-in-one',
    description: 'Maximum firepower with dedicated servers, custom bots & SLA.',
    billing_note: 'Billed monthly · VIP Enterprise infrastructure',
    features: [
      'WhatsApp Broadcasts (150,000+ msgs/mo)',
      'Voice AI Telecaller (5,000 AI Call Mins)',
      '5 Dedicated Virtual Phone Lines',
      'Custom Voice Cloning & Tone Calibration',
      'Full Agency Whitelabeling & Unlimited Seats',
      'Dedicated Account Manager & 99.9% Uptime SLA',
    ],
    included_call_minutes: 5000,
    included_numbers: 5,
    included_channels: 50,
    extra_call_rate_paise: 350,
  },

  // --- 2. VOICE AI (GAP Voice Pilot) ---
  {
    id: 'call_lite',
    plan_name: 'calling_call_lite',
    plan_label: 'Voice Pilot Lite',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    category: 'calling',
    description: 'AI Autonomous Calling for appointment booking and lead triage.',
    billing_note: 'Includes 100 AI calling minutes.',
    features: [
      '100 AI Calling Minutes Included',
      '1 Virtual Phone Line Included',
      'Hindi, English & Hinglish Speech Recognition',
      'Ultra-Low Conversational Latency (<650ms)',
      '₹6.00 / min extra per-minute rate',
    ],
    included_call_minutes: 100,
    included_numbers: 1,
    included_channels: 1,
    extra_call_rate_paise: 600,
  },
  {
    id: 'call_pro',
    plan_name: 'calling_call_pro',
    plan_label: 'Voice Pilot Pro',
    currency: 'INR',
    amount: 249900,
    duration: 'monthly',
    is_active: true,
    is_popular: true,
    category: 'calling',
    description: '500 AI call minutes with custom system prompts & CRM syncing.',
    billing_note: 'Includes 500 AI calling minutes.',
    features: [
      '500 AI Calling Minutes Included',
      '1 Dedicated Virtual Phone Line',
      'Custom System Prompts & Knowledge Base',
      'Live Call Audio Recording & Transcripts',
      'Automated Call Summary & CRM Logging',
      '₹5.00 / min extra per-minute rate',
    ],
    included_call_minutes: 500,
    included_numbers: 1,
    included_channels: 1,
    extra_call_rate_paise: 500,
  },
  {
    id: 'call_elite',
    plan_name: 'calling_call_elite',
    plan_label: 'Voice Pilot Elite',
    currency: 'INR',
    amount: 499900,
    duration: 'monthly',
    is_active: true,
    category: 'calling',
    description: '1,500 AI call minutes, 2 dedicated lines and custom voice clones.',
    billing_note: 'Includes 1,500 AI calling minutes.',
    features: [
      '1,500 AI Calling Minutes Included',
      '2 Dedicated Virtual Phone Lines Included',
      'Custom Voice Cloning & Pronunciation Tuning',
      'Live Human Agent Call Handoff Transfer',
      'Bulk Outbound Auto-Dialer Campaigns',
      '₹4.00 / min extra per-minute rate',
    ],
    included_call_minutes: 1500,
    included_numbers: 2,
    included_channels: 2,
    extra_call_rate_paise: 400,
  },
  {
    id: 'calling_number',
    plan_name: 'calling_dedicated_number',
    plan_label: 'Dedicated Phone Number',
    currency: 'INR',
    amount: 149900,
    duration: 'monthly',
    is_active: true,
    category: 'calling',
    is_addon: true,
    description: 'Add an extra dedicated virtual phone line to your workspace.',
    billing_note: 'Dedicated virtual phone line valid for 30 days.',
    features: [
      '1 Dedicated Virtual Phone Number (30 Days)',
      'Inbound & Outbound Calling Enabled',
      'Bind to Any AI Voice Assistant Bot',
      'Instant KYC Verification Linkage',
      'TRAI & DND Compliant Routing',
    ],
    included_numbers: 1,
    included_channels: 1,
  },

  // --- 3. WHATSAPP AUTOMATION (GAP WhatsApp Hub) ---
  {
    id: 'whatsapp_starter',
    plan_name: 'whatsapp_starter',
    plan_label: 'WhatsApp Starter',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    category: 'whatsapp',
    description: 'Official Meta Cloud API broadcasting & template messaging.',
    billing_note: '5,000 monthly broadcast quota',
    features: [
      '5,000 Broadcast Messages / month',
      'Official Meta Cloud API Linkage',
      'Template Management & Auto-Sync',
      'Rich Media Messages (Images, PDFs, CTAs)',
      'Delivery & Read Receipts Telemetry',
    ],
    included_channels: 1,
  },
  {
    id: 'whatsapp_pro',
    plan_name: 'whatsapp_pro',
    plan_label: 'WhatsApp Pro',
    currency: 'INR',
    amount: 199900,
    duration: 'monthly',
    is_active: true,
    is_popular: true,
    category: 'whatsapp',
    description: '25,000 broadcasts with 24/7 AI chatbot & multi-agent live chat.',
    billing_note: '25,000 monthly broadcast quota',
    features: [
      '25,000 Broadcast Messages / month',
      '24/7 Autonomous AI Chatbot Replies',
      'Multi-Agent Team Unified Inbox',
      'Contact Segments, Tags & Custom Fields',
      'Automated Webhook Triggers on Inbound Replies',
    ],
    included_channels: 1,
  },
  {
    id: 'whatsapp_premium',
    plan_name: 'whatsapp_premium',
    plan_label: 'WhatsApp Business Scale',
    currency: 'INR',
    amount: 349900,
    duration: 'monthly',
    is_active: true,
    category: 'whatsapp',
    description: 'High-throughput campaign delivery with 100,000 messages and CRM sync.',
    billing_note: '100,000 monthly broadcast quota',
    features: [
      '100,000 Broadcast Messages / month',
      'Priority Meta Cloud API Queue (High TPS)',
      'Unlimited Contact Tags & Broadcast Lists',
      'Automatic CRM Contact & Lead Enrichment',
      'Dedicated Webhook Monitoring & Error Recovery',
    ],
    included_channels: 2,
  },

  // --- 4. TELEGRAM ECOSYSTEM (Forwarders & Bots) ---
  {
    id: 'tg_lite',
    plan_name: 'tg_lite',
    plan_label: 'Telegram Forwarder Lite',
    currency: 'INR',
    amount: 79900,
    duration: 'monthly',
    is_active: true,
    category: 'telegram',
    description: 'Sub-200ms real-time channel message routing with keyword filters.',
    billing_note: 'Up to 5 source channels',
    features: [
      'Up to 5 Source Channels & 5 Destinations',
      'Real-Time Message Forwarding (<200ms)',
      'Regex Keyword Blacklist & Whitelist Filters',
      'Username & Link Stripping / Cleaning',
      'Full Media & Document Forwarding',
    ],
    included_channels: 5,
  },
  {
    id: 'tg_pro',
    plan_name: 'tg_pro',
    plan_label: 'Telegram Pro Suite',
    currency: 'INR',
    amount: 149900,
    duration: 'monthly',
    is_active: true,
    is_popular: true,
    category: 'telegram',
    description: 'Unlimited channel routing, watermark cleaner & auto-join approve bot.',
    billing_note: 'Unlimited channel routing',
    features: [
      'Unlimited Source & Destination Channels',
      'Auto-Join Request Approver Bot',
      'Automated Emoji Reactions Engine',
      'Custom Header/Footer Text Replacement',
      'Join Request Analytics & Deep Link Tracking',
    ],
    included_channels: 20,
  },
  {
    id: 'tg_max',
    plan_name: 'tg_max',
    plan_label: 'Telegram VIP Monetization',
    currency: 'INR',
    amount: 249900,
    duration: 'monthly',
    is_active: true,
    category: 'telegram',
    description: 'VIP subscription monetization, automated member removal & report bot.',
    billing_note: 'Monetize VIP channels with automated subscriptions',
    features: [
      'VIP Subscription Manager Bot (@Gapsubmanagerbot)',
      'Automated Razorpay Payment Verification',
      'Auto Kick on Subscription Expiry',
      'SEBI Research Report PDF Generator Bot',
      'Direct Creator Bank Payouts Integration',
    ],
    included_channels: 50,
  },

  // --- 5. SMART CRM (Pipelines & Leads) ---
  {
    id: 'crm_standard',
    plan_name: 'crm_standard',
    plan_label: 'CRM Starter',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    category: 'crm',
    description: 'Visual deal pipeline and unified customer contacts ledger.',
    billing_note: 'Up to 1,000 active leads',
    features: [
      'Up to 1,000 Leads & Contacts',
      'Interactive Kanban Deal Pipeline',
      'Activity History, Notes & Follow-Up Tasks',
      'Call & WhatsApp Interaction Timelines',
      'CSV / Excel Contacts Import & Export',
    ],
    included_channels: 1,
  },
  {
    id: 'crm_pro',
    plan_name: 'crm_pro',
    plan_label: 'CRM Growth & Invoices',
    currency: 'INR',
    amount: 199900,
    duration: 'monthly',
    is_active: true,
    is_popular: true,
    category: 'crm',
    description: '10,000 leads, quotation generation, automated follow-ups & payments.',
    billing_note: 'Up to 10,000 active leads',
    features: [
      'Up to 10,000 Leads & Contacts',
      'Quotations & Invoices Generator',
      'Payment Tracking & UTR Verification',
      'Custom Deal Stages & Pipeline Funnels',
      'Automated Lead Status Progression',
    ],
    included_channels: 3,
  },
  {
    id: 'crm_enterprise',
    plan_name: 'crm_enterprise',
    plan_label: 'CRM Enterprise Team',
    currency: 'INR',
    amount: 349900,
    duration: 'monthly',
    is_active: true,
    category: 'crm',
    description: 'Unlimited contacts, multi-user attendance, leave & Google Calendar sync.',
    billing_note: 'Unlimited team seats & leads',
    features: [
      'Unlimited Leads, Contacts & Pipelines',
      'Team Members Attendance & Leave Tracking',
      'Google Calendar Two-Way Meeting Sync',
      'Sales Commission & Rep Performance Analytics',
      'Dedicated Priority Database Backups',
    ],
    included_channels: 10,
  },

  // --- 6. SOCIAL PILOT (Multi-Channel Sync) ---
  {
    id: 'slite',
    plan_name: 'social_pilot_starter',
    plan_label: 'Social Starter',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    is_popular: true,
    category: 'social',
    description: 'Publish across 10 brand channels with automated scheduling.',
    billing_note: '10 social accounts connected',
    features: [
      '10 Connected Social Media Accounts',
      'Unlimited Scheduled Queue & Auto-Publisher',
      'Instagram, YouTube, X, LinkedIn, FB & Bluesky',
      'Keyword Auto-DM Replies (Instagram & Threads)',
      '90-Day Content History & Performance Analytics',
    ],
    included_channels: 10,
  },
  {
    id: 'sgrowth',
    plan_name: 'social_pilot_growth',
    plan_label: 'Social Growth Agency',
    currency: 'INR',
    amount: 199900,
    duration: 'monthly',
    is_active: true,
    category: 'social',
    description: 'Full agency firepower, multi-seat approval workflow & AI captions.',
    billing_note: 'Unlimited social accounts',
    features: [
      'Unlimited Social Media Accounts',
      'Multi-Seat Team Approval Workflow',
      'AI Caption & Viral Hook Generator',
      'Unlimited Inbound Auto-DM Automations',
      'Comprehensive Cross-Platform Telemetry',
    ],
    included_channels: 25,
  },
];

export class PricingService {
  /**
   * Fetches all active pricing plans directly from Supabase/BFF,
   * seamlessly merged with canonical verified product plans so no screen has missing data.
   */
  public static async getPlans(category?: string): Promise<PricingPlan[]> {
    const remotePlans = await fetchSupabasePricingPlans(category);
    
    // Merge remote plans with canonical fallback plans
    let combined: PricingPlan[] = [];
    if (Array.isArray(remotePlans) && remotePlans.length > 0) {
      const remoteIds = new Set(remotePlans.map((p) => p.id));
      combined = [
        ...remotePlans,
        ...CANONICAL_ECOSYSTEM_PLANS.filter((cp) => !remoteIds.has(cp.id)),
      ];
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
