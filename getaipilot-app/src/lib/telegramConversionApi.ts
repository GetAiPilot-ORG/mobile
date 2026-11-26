import { supabase } from "./supabase";
import { authStorage } from "../core/storage/authStorage";

const DEFAULT_SUPABASE_URL = "https://uklxlappjcuvdqjvecfh.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrbHhsYXBwamN1dmRxanZlY2ZoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgxNDcwODMsImV4cCI6MjA4MzcyMzA4M30.v-TvyQrYpttcmCnzT9MkUlBgGXXU3lspZCxCYm-Oil4";

const supabaseUrl = (
  process.env.EXPO_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL
).replace(/\/+$/, "");

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY?.trim() || DEFAULT_SUPABASE_ANON_KEY;

export const conversionEndpoint = `${supabaseUrl}/functions/v1/telegram-conversion`;

export interface TrackingSite {
  id: string;
  name: string;
  url: string;
  landing_page_id: string | null;
  bio_page_id?: string | null;
  verified_at: string | null;
  verification_token: string;
}

export interface TrackingConnection {
  id: string;
  bot_mode: "own" | "shared";
  title: string;
  bot_username: string;
  chat_id: string;
  status: string;
  last_checked_at: string | null;
  coverage_gap_since: string | null;
}

export interface TrackingCampaign {
  id: string;
  name: string;
  site_id: string;
  connection_id: string;
  public_key: string;
  status: string;
  invite_link: string | null;
  original_telegram_url: string;
  join_request: boolean;
  created_at: string;
}

export interface TelegramSetup {
  configured: boolean;
  bot_username: string | null;
  status: string;
  is_admin: boolean;
  identity: {
    telegram_user_id: number | string;
    display_name: string;
    verified_at: string;
  } | null;
  link: {
    id: string;
    claimed_user_id: number | string | null;
    display_name: string | null;
    confirmed_at: string | null;
    connection_id: string | null;
    expires_at: string;
  } | null;
}

export interface CreatedTemplatePage {
  id: string;
  page_title: string;
  slug: string;
  telegram_url: string;
  image_url?: string;
  design_type?: "landing" | "bio";
  created_at?: string;
}

export interface AvailableChannel {
  chat_id: string;
  title: string;
  username: string | null;
  chat_type: string;
  is_admin: boolean;
  photo_url: string | null;
  source: string;
  connection_id: string | null;
  connection_status: string | null;
}

export interface TrackingInventory {
  telegram: TelegramSetup;
  operations: { pending: number; dead: number };
  sites: TrackingSite[];
  connections: TrackingConnection[];
  available_channels?: AvailableChannel[];
  campaigns: TrackingCampaign[];
  pages: CreatedTemplatePage[];
}

export interface CampaignReport extends TrackingCampaign {
  site_name: string;
  site_url: string;
  channel_title: string;
  connection_status: string;
  coverage_gap_since: string | null;
  last_checked_at: string | null;
  views: number;
  clicks: number;
  acquisitions: number;
  active: number;
  inactive: number;
  leave_events: number;
  unique_left: number;
  pending: number;
  ambiguous: number;
}

export interface ConversionReport {
  first_party_complete?: boolean;
  campaigns: CampaignReport[];
  as_of: string;
  timezone: string;
  unknown_members: number;
}

export async function getValidSupabaseAccessToken(
  forceRefresh = false,
): Promise<string | null> {
  if (forceRefresh) {
    try {
      const { data: refreshed } = await supabase.auth.refreshSession();
      if (refreshed?.session?.access_token) {
        return refreshed.session.access_token;
      }
    } catch {}
  }

  try {
    const { data } = await supabase.auth.getSession();
    const current = data?.session;
    if (current?.access_token) {
      const expiresAtMs = (current.expires_at ?? 0) * 1000;
      if (!forceRefresh && (!expiresAtMs || expiresAtMs > Date.now() + 60_000)) {
        return current.access_token;
      }
      const { data: refreshed } = await supabase.auth
        .refreshSession()
        .catch(() => ({ data: { session: null } }));
      if (refreshed?.session?.access_token) {
        return refreshed.session.access_token;
      }
      if (!forceRefresh) {
        return current.access_token;
      }
    }
  } catch {}

  try {
    const { data: refreshed } = await supabase.auth.refreshSession();
    if (refreshed?.session?.access_token) {
      return refreshed.session.access_token;
    }
  } catch {}

  try {
    const { accessToken, refreshToken } = await authStorage.getSession();
    if (accessToken && refreshToken) {
      const { data: restored } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (restored?.session?.access_token) {
        return restored.session.access_token;
      }
    }
    if (accessToken) {
      const { data: userCheck } = await supabase.auth.getUser(accessToken);
      if (userCheck?.user) {
        return accessToken;
      }
    }
  } catch {}

  return null;
}

export async function trackingRequest<T>(
  action: string,
  body?: object,
  _retried = false,
): Promise<T> {
  const token = await getValidSupabaseAccessToken(_retried);
  if (!token) {
    throw new Error("Sign in to manage Telegram conversion tracking.");
  }

  const response = await fetch(
    `${conversionEndpoint}?action=${encodeURIComponent(action)}`,
    {
      method: body ? "POST" : "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: supabaseAnonKey,
        "content-type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );

  if (response.status === 401 && !_retried) {
    const refreshedToken = await getValidSupabaseAccessToken(true);
    if (refreshedToken) {
      return trackingRequest<T>(action, body, true);
    }
  }

  const result = await response
    .json()
    .catch(() => ({ error: "Tracking service returned an invalid response." }));

  if (!response.ok) {
    throw new Error(result.error || "Could not load conversion tracking.");
  }

  return result as T;
}

export async function fetchUserCreatedTemplates(
  userId?: string,
): Promise<CreatedTemplatePage[]> {
  let uid = userId;
  if (!uid) {
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    uid = data?.user?.id;
  }
  if (!uid) return [];

  const [landingRes, bioRes] = await Promise.allSettled([
    supabase
      .from("landing_template_submissions")
      .select("id,page_title,slug,form_data,created_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),
    supabase
      .from("free_template_submissions")
      .select("id,page_title,slug,form_data,created_at,downloaded_at")
      .eq("user_id", uid)
      .neq("niche", "earn_storefront")
      .order("downloaded_at", { ascending: false }),
  ]);

  const landingItems: CreatedTemplatePage[] =
    landingRes.status === "fulfilled" && !landingRes.value.error && landingRes.value.data
      ? landingRes.value.data.map((row: any) => ({
          id: row.id,
          page_title:
            row.page_title ||
            row.form_data?.channelName ||
            row.form_data?.channelTitle ||
            row.slug ||
            "Untitled Landing Page",
          slug: row.slug,
          telegram_url:
            row.form_data?.channelLink || row.form_data?.channel_link || "",
          image_url: row.form_data?.imageUrl || undefined,
          design_type: "landing" as const,
          created_at: row.created_at || "",
        }))
      : [];

  const bioItems: CreatedTemplatePage[] =
    bioRes.status === "fulfilled" && !bioRes.value.error && bioRes.value.data
      ? bioRes.value.data.map((row: any) => {
          const tgBtn = Array.isArray(row.form_data?.buttons)
            ? row.form_data.buttons.find(
                (b: any) => typeof b?.url === "string" && b.url.includes("t.me/"),
              )
            : null;
          return {
            id: row.id,
            page_title:
              row.page_title ||
              row.form_data?.profileName ||
              row.slug ||
              "Untitled Bio Page",
            slug: row.slug,
            telegram_url: tgBtn?.url || "",
            image_url: row.form_data?.profileImage || undefined,
            design_type: "bio" as const,
            created_at: row.downloaded_at || row.created_at || "",
          };
        })
      : [];

  return [...landingItems, ...bioItems].sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || ""),
  );
}

export async function fetchUserTelegramChannels(
  userId?: string,
): Promise<AvailableChannel[]> {
  let uid = userId;
  if (!uid) {
    const { data } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    uid = data?.user?.id;
  }
  if (!uid) return [];

  const [chatsRes, commsRes, autopostRes] = await Promise.allSettled([
    supabase
      .from("tg_chats")
      .select("chat_id,chat_title,chat_type,username,is_admin,photo_url")
      .eq("user_id", uid)
      .in("chat_type", ["channel", "group"])
      .order("last_synced_at", { ascending: false }),
    supabase
      .from("tg_communities")
      .select("telegram_chat_id,title,photo_url")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),
    supabase
      .from("tg_autopost_channels")
      .select("channel_id,channel_title,channel_username,channel_type,is_admin")
      .eq("user_id", uid)
      .order("created_at", { ascending: false }),
  ]);

  const map = new Map<string, AvailableChannel>();
  const add = (item: AvailableChannel) => {
    const key = String(item.chat_id || "").trim();
    if (!key) return;
    const prev = map.get(key);
    map.set(key, {
      ...item,
      title: item.title || prev?.title || "Telegram Channel",
      username: item.username ?? prev?.username ?? null,
      photo_url: item.photo_url ?? prev?.photo_url ?? null,
      source: prev?.source || item.source,
    });
  };

  if (chatsRes.status === "fulfilled" && !chatsRes.value.error && chatsRes.value.data) {
    for (const r of chatsRes.value.data as any[]) {
      add({
        chat_id: String(r.chat_id),
        title: r.chat_title || "Telegram Channel",
        username: r.username || null,
        chat_type: r.chat_type || "channel",
        is_admin: r.is_admin !== false,
        photo_url: r.photo_url || null,
        source: "telegram",
        connection_id: null,
        connection_status: null,
      });
    }
  }
  if (commsRes.status === "fulfilled" && !commsRes.value.error && commsRes.value.data) {
    for (const r of commsRes.value.data as any[]) {
      add({
        chat_id: String(r.telegram_chat_id),
        title: r.title || "Community Channel",
        username: null,
        chat_type: "channel",
        is_admin: true,
        photo_url: r.photo_url || null,
        source: "community",
        connection_id: null,
        connection_status: null,
      });
    }
  }
  if (autopostRes.status === "fulfilled" && !autopostRes.value.error && autopostRes.value.data) {
    for (const r of autopostRes.value.data as any[]) {
      add({
        chat_id: String(r.channel_id),
        title: r.channel_title || "Telegram Channel",
        username: r.channel_username || null,
        chat_type: r.channel_type || "channel",
        is_admin: r.is_admin !== false,
        photo_url: null,
        source: "autopost",
        connection_id: null,
        connection_status: null,
      });
    }
  }

  return Array.from(map.values());
}

export async function fetchConversionReport(
  days = 7,
  campaignId = "",
): Promise<ConversionReport | null> {
  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const { data, error } = await supabase.rpc("tci_report", {
    p_from: from.toISOString(),
    p_to: to.toISOString(),
    p_campaign: campaignId || null,
    p_timezone: "Asia/Kolkata",
  });
  if (error) return null;
  return data as unknown as ConversionReport;
}

export function buildInstallSnippet(publicKey: string): string {
  return `<script defer src="https://gpage.us/gap-tracking.js"\n  data-endpoint="${conversionEndpoint}"\n  data-campaign="${publicKey}"\n  data-consent="ask"></script>`;
}
