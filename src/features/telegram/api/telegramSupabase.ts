import { supabase } from '../../../lib/supabase';
import { TelegramSummary } from '../types';

export const telegramSupabase = {
  getSummary: async (): Promise<any> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Fetch User Profiles & Telegram Subscriptions for telegram_user_id
    const [profileRes, subRes] = await Promise.all([
      supabase.from("profiles").select("telegram_user_id").eq("id", user.id).maybeSingle(),
      supabase.from("app_user_subscriptions").select("telegram_user_id").eq("user_id", user.id).maybeSingle(),
    ]);

    const rawTgUserId = profileRes.data?.telegram_user_id || subRes.data?.telegram_user_id || user.user_metadata?.telegram_user_id || user.user_metadata?.telegram_id;
    let numericTgUserId: number | null = null;
    if (rawTgUserId !== undefined && rawTgUserId !== null && rawTgUserId !== '') {
      const parsed = Number(rawTgUserId);
      if (!isNaN(parsed) && parsed !== 0) {
        numericTgUserId = parsed;
      }
    }

    // 2. Fetch all data like web TelegramDashboard.tsx & AutoforwardDashboard.tsx
    const [
      botsData,
      linksData,
      pagesData,
      chatbotsData,
      forwardsData,
      brandData,
      reportsData,
      reactionOrdersData,
      filtersData,
      blacklistData,
      forwardSettingsData
    ] = await Promise.all([
      supabase.from("tg_tracker").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase
        .from("tg_bot_join_links")
        .select(`
          *,
          channel_mapping:tg_bot_channel_mappings(id, channel_name, status, channel_icon_url),
          bot:tg_tracker(id, status, bot_username, bot_name),
          users:tg_bot_join_users(id, telegram_user_id, joined_channel, left_channel, joined_at, left_at, created_at, telegram_username, telegram_first_name, status)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("tg_landing_pages").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("tg_chatbot_configs").select("*").eq("user_id", user.id),
      numericTgUserId
        ? supabase.from("tg_forward_mappings").select("*").eq("user_id", numericTgUserId).order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase.from("tg_brand_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("tg_trading_calls")
        .select("id, created_at, channel_id, channel_name, telegram_message_id, direction, symbol, strike_price, entry_price, targets, stop_loss, expiry, rationale, chart_url, pdf_url, status")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase.from("tg_reaction_orders").select("*").eq("user_id", user.id),
      numericTgUserId
        ? supabase.from("tg_user_text_filters").select("*").eq("user_id", numericTgUserId)
        : Promise.resolve({ data: [], error: null }),
      numericTgUserId
        ? supabase.from("tg_user_blacklist_words").select("*").eq("user_id", numericTgUserId)
        : Promise.resolve({ data: [], error: null }),
      numericTgUserId
        ? supabase.from("tg_user_settings").select("*").eq("user_id", numericTgUserId).limit(1).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    const loadedBots = botsData.data || [];
    const loadedLinks = linksData.data || [];
    const loadedPages = pagesData.data || [];
    const loadedChatbots = chatbotsData.data || [];
    const loadedForwards = forwardsData.data || [];
    const loadedBrand = brandData.data || null;
    const loadedReports = reportsData.data || [];
    const loadedReactionOrders = reactionOrdersData.data || [];
    const loadedFilters = filtersData.data || [];
    const loadedBlacklist = blacklistData.data || [];
    const loadedForwardSettings = forwardSettingsData.data || null;

    // 3. Fetch Channel Mappings for user's bots
    let loadedMappings: any[] = [];
    if (loadedBots.length > 0) {
      const botIds = loadedBots.map((b: any) => b.id);
      const { data: mapData } = await supabase
        .from("tg_bot_channel_mappings")
        .select("*")
        .in("bot_id", botIds);
      loadedMappings = mapData || [];
    }

    // Try edge function live sync for Report Bot channel mappings like web
    try {
      const syncRes = await supabase.functions.invoke("telegram-call-report", {
        body: { action: "get_channel_mappings", user_id: user.id },
      });
      if (syncRes.data?.mappings && Array.isArray(syncRes.data.mappings) && syncRes.data.mappings.length > 0) {
        loadedMappings = syncRes.data.mappings;
      }
    } catch (syncErr) {
      // Ignore edge function error, retain DB loadedMappings
    }

    // 4. Fetch Recent Joins for user's deep links
    let loadedJoins: any[] = [];
    if (loadedLinks.length > 0) {
      const linkIds = loadedLinks.map((l: any) => l.id);
      const { data: joinsData } = await supabase
        .from("tg_bot_join_users")
        .select("*")
        .in("link_id", linkIds)
        .order("joined_at", { ascending: false })
        .limit(20);
      loadedJoins = joinsData || [];
    }

    // 5. Fetch Purchases for user's TeleSub Pages
    let loadedPurchases: any[] = [];
    if (loadedPages.length > 0) {
      const pageIds = loadedPages.map((p: any) => p.id);
      const { data: purchData } = await supabase
        .from("telegram_user_purchases")
        .select("*")
        .in("page_id", pageIds)
        .order("created_at", { ascending: false });
      loadedPurchases = purchData || [];
    }

    // Calculated Metrics
    const totalRevenue = loadedPurchases
      .filter((p: any) => p.status === "SUCCESS")
      .reduce((acc: number, curr: any) => acc + (Number(curr.amount) || 0), 0);

    const activeForwardsCount = loadedForwards.filter((f: any) => f.is_active !== false).length;
    const trackerBotsCount = loadedBots.length;
    const channelsCount = loadedMappings.length;
    const deepLinksCount = loadedLinks.length;
    const forwardsCount = activeForwardsCount;
    const teleSubPagesCount = loadedPages.length;

    // Hub Status exactly like Web
    const telegramModules = [
      { key: "reactions", title: "GAP Reactions", statusText: "Boost your post engagement with automated Telegram reaction emoji delivery." },
      { key: "tracker", title: "GAP Tracker", statusText: "Connect Telegram bots, track channel joins, and generate deep tracking invite links." },
      { key: "report_bot", title: "GAP Report Bot", statusText: "Turn Telegram trading calls and chart screenshots into branded SEBI research report PDFs." },
      { key: "autoforward", title: "GAP Autoforwarding", statusText: "Mirror and auto-forward messages across public and private Telegram channels automatically." },
      { key: "sub_manager", title: "GAP Sub Manager", statusText: "Manage gated subscription landing pages and process recurring community payments." },
      { key: "auto_approve", title: "Auto-Approve Bot", statusText: "Instantly and automatically accept new group or channel join requests 24/7." },
      { key: "chatbot", title: "AI Chat Bot", statusText: "Deploy intelligent ChatGPT-powered Telegram bots to handle user support & sales queries." },
      { key: "broadcast", title: "Broadcast Msg", statusText: "Send high-converting instant announcements and mass broadcasts to all your bot subscribers." },
    ];

    const hub = {
      totalModules: 8,
      completedModules: 8,
      tools: telegramModules.map(m => ({
        key: m.key as any,
        title: m.title,
        description: m.statusText,
        isCompleted: true,
        statusText: m.statusText,
        icon: '',
      })),
    };

    return {
      trackerBots: loadedBots,
      trackerBotsCount,
      channelsCount,
      deepLinksCount,
      forwardsCount,
      teleSubPagesCount,
      revenue: totalRevenue,
      hub,
      loadedLinks,
      loadedPages,
      loadedChatbots,
      loadedForwards,
      loadedBrand,
      loadedReports,
      loadedMappings,
      loadedJoins,
      loadedPurchases,
      loadedReactionOrders,
      loadedFilters,
      loadedBlacklist,
      loadedForwardSettings,
      telegramUserId: rawTgUserId,
    };
  }
};
