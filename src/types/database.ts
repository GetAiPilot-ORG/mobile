// Database types based on actual Supabase schema

export interface LandingPage {
  id: string; // uuid
  created_at: string;
  user_id: string; // uuid
  title: string;
  description: string | null;
  slug: string;
  logo_url: string | null;
  hero_image_url: string | null;
  theme: string; // json or string
  is_active: boolean;
  facebook_pixel_id: string | null;
  community_id: number | null;
  linked_account_id: string | null; // uuid
}

export interface LinkedAccount {
  id: string; // uuid
  user_id: string; // uuid
  razorpay_account_id: string;
  razorpay_account_status: string;
  client_email: string;
  client_phone: string;
  business_name: string;
  business_type: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_ifsc_code: string;
  total_received_amount: number;
  total_settled_amount: number;
  pending_settlement_amount: number;
  raw_razorpay_data: any; // jsonb
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string; // uuid
  landing_page_id: string; // uuid
  plan_id: string; // uuid
  amount: number;
  currency: string;
  provider: string;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  razorpay_signature: string | null;
  transfer_id: string | null;
  transfer_amount: number | null;
  transfer_status: string | null;
  platform_fee: number | null;
  linked_account_id: string | null; // uuid
  status: string;
  created_at: string;
}

export interface LandingPageWithSubscribers extends LandingPage {
  subscribers_count: number;
}

export interface ForwardMapping {
  id: string; // uuid
  user_id: number; // bigint (telegram user id)
  sender_id: number; // bigint
  receivers: number[]; // bigint[]
  updated_at: string;
  sender_name?: string | null;
  receivers_names?: string[] | null;
}

export interface InviteLink {
  id: number; // bigint
  user_id: number; // bigint (telegram user id)
  chat_id: number; // bigint
  chat_title: string | null;
  invite_link: string;
  is_active: boolean;
  created_at: string;
}

export interface Join {
  id: number; // bigint
  user_id: number; // bigint (telegram user id)
  chat_id: number; // bigint
  invite_link_id: number | null; // bigint (nullable based on usage)
  joined_user_id: number; // bigint
  joined_at: string;
  joined_username: string | null;
}

export interface PlatformStats {
  id: number; // bigint
  user_id: string; // uuid (references auth.users)
  platform: string;
  active_bots: number;
  total_subscribers: number;
  messages_sent: number;
  active_chats: number;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string; // uuid (references auth.users)
  telegram_user_id: number | null; // bigint
  created_at: string;
  updated_at: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  website: string | null;
  business_name: string | null;
  country: string | null;
  city: string | null;
  category: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  twitter_url: string | null;
  is_admin: boolean;
  // Onboarding fields
  account_type: 'personal' | 'business' | null;
  first_name: string | null;
  last_name: string | null;
  state: string | null;
  business_email: string | null;
  team_size: string | null;
  onboarding_completed: boolean;
}

export interface UserBlacklistWord {
  id: string; // uuid
  user_id: number; // bigint (telegram user id)
  word: string;
  word_lower: string;
  created_at: string;
}

export interface UserPaymentLink {
  paymentlink_id: string; // text (primary key)
  plan_id: string | null;
  plan_label: string | null;
  price_paise: number;
  duration_days: number;
  status: string;
  payment_id: string | null;
  verified_at: string | null;
  raw: any; // jsonb
  created_at: string;
  paymentlink_url: string | null;
  user_uuid: number | null; // bigint (or uuid depending on schema, likely bigint for telegram bots)
  user_id: number | null; // bigint
}

export interface UserSession {
  id: string; // uuid
  user_id: number; // bigint (telegram user id) - UNIQUE
  phone: string;
  session_file: string;
  storage_path: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  started_at: string | null;
  expires_at: string | null;
  total_cycles: number;
}

export interface UserSettings {
  user_id: number; // bigint (telegram user id) - PRIMARY KEY
  delay_seconds: number;
  updated_at: string | null;
  is_forwarding: boolean;
}

export interface UserSubscription {
  user_id: number; // bigint (telegram user id) - PRIMARY KEY
  telegram_user_id: number | null; // bigint
  started_at: string | null;
  expires_at: string | null;
  total_cycles: number;
  last_payment_id: string | null;
  last_payment_status: string | null;
  last_paymentlink_id: string | null;
  last_paymentlink_url: string | null;
  last_payment_verified_at: string | null;
  razorpay_subscription_id: string | null;
  updated_at: string | null;
  raw: any; // jsonb
  plan_id: string | null;
  plan_label: string | null;
  plan_price_paise: number | null;
  plan_duration_days: number | null;
}

export interface UserTextAddon {
  user_id: number; // bigint (telegram user id) - PRIMARY KEY
  start_text: string | null;
  end_text: string | null;
  updated_at: string | null;
}

export interface UserTextFilter {
  id: number; // bigint
  user_id: number; // bigint (telegram user id)
  from_name: string;
  to_name: string;
  from_name_lower: string;
  created_at: string;
  to_name_lower: string;
}
