import { apiClient } from '../api/client';
import { supabase } from '../../lib/supabase';

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
  category?: string | null; // "calling" | "whatsapp" | "telegram" | "social" | "crm" | "platform"
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

export type PlanCategory = 'all' | 'calling' | 'social' | 'whatsapp' | 'telegram' | 'crm';

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

export const DEFAULT_FALLBACK_PLANS: PricingPlan[] = [
  {
    id: 'calling_lite',
    plan_name: 'calling_lite_monthly',
    plan_label: 'Start',
    currency: 'INR',
    amount: 149900,
    duration: 'monthly',
    is_active: true,
    category: 'calling',
    description: 'Starter AI calling plan for small businesses and testing.',
    features: [
      '250 AI Calling Minutes Included',
      '₹6.00 / min extra per-minute rate',
      '1 Dedicated Virtual Phone Line Included',
      'Hindi, English & Hinglish Support',
      'Custom AI System Prompts & Memory',
      'Basic Lead & Contact Capture',
    ],
    color: 'blue',
    icon: 'phone',
    is_popular: false,
    included_call_minutes: 250,
    extra_call_rate_paise: 600,
    included_numbers: 1,
    included_channels: 1,
    billing_note: 'Includes 250 AI calling minutes. Extra minutes charged at ₹6/min.',
  },
  {
    id: 'calling_pro',
    plan_name: 'calling_pro_monthly',
    plan_label: 'Growth',
    currency: 'INR',
    amount: 499900,
    duration: 'monthly',
    is_active: true,
    category: 'calling',
    description: 'Growth AI calling plan for sales, support, and lead qualification.',
    features: [
      '1,000 AI Calling Minutes Included',
      '₹5.00 / min extra per-minute rate',
      '1 Dedicated Virtual Phone Line Included',
      'Realtime Live Call Transfer & Webhooks',
      'Automatic CRM Auto-Syncing & Tagging',
      'Full Audio Recording & Instant Transcripts',
    ],
    color: 'purple',
    icon: 'award',
    is_popular: true,
    included_call_minutes: 1000,
    extra_call_rate_paise: 500,
    included_numbers: 1,
    included_channels: 1,
    billing_note: 'Includes 1,000 AI calling minutes. Extra minutes charged at ₹5/min.',
  },
  {
    id: 'calling_scale',
    plan_name: 'calling_scale_monthly',
    plan_label: 'Scale',
    currency: 'INR',
    amount: 1499900,
    duration: 'monthly',
    is_active: true,
    category: 'calling',
    description: 'Scale AI calling for high-volume sales teams and contact centers.',
    features: [
      '3,500 AI Calling Minutes Included',
      '₹4.50 / min extra per-minute rate',
      '2 Dedicated Virtual Phone Lines Included',
      'Priority Telephony Gateway & High Concurrency',
      'Full Multi-language & Accent Support',
      'Dedicated Account Manager & SLA',
    ],
    color: 'emerald',
    icon: 'flash',
    is_popular: false,
    included_call_minutes: 3500,
    extra_call_rate_paise: 450,
    included_numbers: 2,
    included_channels: 2,
    billing_note: 'Includes 3,500 AI calling minutes. Extra minutes charged at ₹4.50/min.',
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
    description: 'Add an extra dedicated virtual phone line to your workspace.',
    features: [
      '1 Dedicated Virtual Phone Number (30 Days)',
      'Inbound & Outbound Calling Enabled',
      'Bind to Any AI Voice Assistant Bot',
      'Instant KYC Verification Linkage',
      'TRAI & DND Compliant Routing',
    ],
    color: 'indigo',
    icon: 'phone-portrait',
    is_popular: false,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 1,
    included_channels: 1,
    billing_note: 'Dedicated virtual phone line valid for 30 days.',
    is_addon: true,
  },
  {
    id: 'social_starter',
    plan_name: 'social_pilot_starter',
    plan_label: 'SPstarter',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    category: 'social',
    description: 'Schedule & auto-publish across social channels.',
    features: [
      'Auto-Post to Facebook, Instagram & LinkedIn',
      'Unlimited Post Scheduling & Queue',
      'AI Caption & Viral Hook Generator',
      'Smart Hashtag Suggestions & Sentiment',
      'Multi-Account Sync & Direct DM Replies',
    ],
    color: 'amber',
    icon: 'globe',
    is_popular: true,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 0,
    included_channels: 10,
    billing_note: 'Includes 10 connected social accounts and unlimited queue.',
  },
  {
    id: 'whatsapp_starter',
    plan_name: 'whatsapp_starter_monthly',
    plan_label: 'WA Starter',
    currency: 'INR',
    amount: 99900,
    duration: 'monthly',
    is_active: true,
    category: 'whatsapp',
    description: 'Simple WhatsApp workspace for small shops and service businesses.',
    features: [
      '1 WhatsApp number connected via Meta Cloud API',
      '1,000 Verified Contact Quota',
      '5 Active Trigger & Automation Flows',
      'High-Speed Manual & Tagged Broadcasts',
      'Interactive Button Replies & Bots',
    ],
    color: 'blue',
    icon: 'zap',
    is_popular: false,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 1,
    included_channels: 1,
    billing_note: 'Official Meta WhatsApp Business API integration.',
  },
  {
    id: 'telegram_monthly',
    plan_name: 'telegram_monthly',
    plan_label: 'TG Lite',
    currency: 'INR',
    amount: 149900,
    duration: 'monthly',
    is_active: true,
    category: 'telegram',
    description: 'High-speed automated Telegram channel forwarding.',
    features: [
      'Priority High-Speed Telegram Forwarder Core',
      'Unlimited Automated Channel Forwards',
      'Keyword Blacklists, Whitelists & RegEx Filters',
      'Watermark / Header & Footer Replacement',
      'Priority WhatsApp & Telegram Support',
    ],
    color: 'emerald',
    icon: 'zap',
    is_popular: false,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 0,
    included_channels: 5,
    billing_note: 'Enterprise MTProto speed with sub-second propagation.',
  },
  {
    id: 'crm_pro_modules',
    plan_name: 'crm_pro_modules',
    plan_label: 'CRM Pro Modules',
    currency: 'INR',
    amount: 79900,
    duration: 'monthly',
    is_active: true,
    category: 'crm',
    description: '3-IN-1 PACK: Leads + Auto Invoice + Team Activity.',
    features: [
      'Leads Module: Intake Forms, Webhooks & Pipeline Stages',
      'Auto Invoice: Recurring Monthly Billing & GST Reminders',
      'Team Activity: Real-time Action Stream & Audit Logs',
      'Full Workspace Access for Unlimited Team Members',
    ],
    color: 'blue',
    icon: 'sparkles',
    is_popular: false,
    included_call_minutes: 0,
    extra_call_rate_paise: 0,
    included_numbers: 0,
    included_channels: 0,
    billing_note: 'All 3 Core CRM Modules Enabled.',
  },
];

export class PricingService {
  /**
   * Fetches all active pricing plans from BFF, with Supabase fallback
   */
  public static async getPlans(category?: string): Promise<PricingPlan[]> {
    // 1. Primary: BFF Endpoint
    try {
      const res = await apiClient.get<{ success: boolean; data: PricingPlan[] }>(
        '/mobile/v1/billing/plans',
        { params: category && category !== 'all' ? { category } : undefined }
      );
      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        return res.data;
      }
    } catch (err) {
      console.warn('[PricingService] BFF plans query error, attempting Supabase fallback:', err);
    }

    // 2. Fallback: Direct Supabase Client
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
      if (!error && data && data.length > 0) {
        return data as PricingPlan[];
      }
    } catch (sbErr) {
      console.warn('[PricingService] Supabase client plans query error:', sbErr);
    }

    // 3. Fallback: Curated Offline Default Plans
    if (category && category !== 'all') {
      return DEFAULT_FALLBACK_PLANS.filter((p) => p.category === category);
    }
    return DEFAULT_FALLBACK_PLANS;
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
