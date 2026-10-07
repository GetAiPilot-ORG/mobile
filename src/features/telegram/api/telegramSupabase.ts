import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../../core/store/authStore';
import { TelegramSummary } from '../types';

export const telegramSupabase = {
  getSummary: async (): Promise<any> => {
    // 1. Resiliently resolve authenticated user id
    let currentUserId: string | null = null;
    let currentUserEmail: string | null = null;
    let currentUserMetadata: any = {};

    try {
      const { data } = await supabase.auth.getUser();
      if (data?.user) {
        currentUserId = data.user.id;
        currentUserEmail = data.user.email || null;
        currentUserMetadata = data.user.user_metadata || {};
      }
    } catch {}

    if (!currentUserId) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          currentUserId = data.session.user.id;
          currentUserEmail = data.session.user.email || null;
          currentUserMetadata = data.session.user.user_metadata || {};
        }
      } catch {}
    }

    if (!currentUserId) {
      const storeUser = useAuthStore.getState().user;
      if (storeUser?.id) {
        currentUserId = storeUser.id;
        currentUserEmail = storeUser.email || null;
        currentUserMetadata = storeUser.user_metadata || {};
      }
    }

    const defaultModules = [
      { key: "reactions", title: "GAP Reactions", statusText: "Boost your post engagement with automated Telegram reaction emoji delivery." },
      { key: "tracker", title: "GAP Tracker", statusText: "Connect Telegram bots, track channel joins, and generate deep tracking invite links." },
      { key: "report_bot", title: "GAP Report Bot", statusText: "Turn Telegram trading calls and chart screenshots into branded SEBI research report PDFs." },
      { key: "autoforward", title: "GAP Autoforwarding", statusText: "Mirror and auto-forward messages across public and private Telegram channels automatically." },
      { key: "sub_manager", title: "GAP Sub Manager", statusText: "Manage gated subscription landing pages and process recurring community payments." },
      { key: "auto_approve", title: "Auto-Approve Bot", statusText: "Instantly and automatically accept new group or channel join requests 24/7." },
      { key: "chatbot", title: "AI Chat Bot", statusText: "Deploy intelligent ChatGPT-powered Telegram bots to handle user support & sales queries." },
      { key: "broadcast", title: "Broadcast Msg", statusText: "Send high-converting instant announcements and mass broadcasts to all your bot subscribers." },
    ];

    const defaultHub = {
      totalModules: 8,
      completedModules: 8,
      tools: defaultModules.map(m => ({
        key: m.key as any,
        title: m.title,
        description: m.statusText,
        isCompleted: true,
        statusText: m.statusText,
        icon: '',
      })),
    };

    if (!currentUserId) {
      return {
        trackerBots: [],
        trackerBotsCount: 0,
        channelsCount: 0,
        deepLinksCount: 0,
        forwardsCount: 0,
        teleSubPagesCount: 0,
        revenue: 0,
        activeSubscribers: 0,
        hub: defaultHub,
        loadedLinks: [],
        loadedPages: [],
        loadedChatbots: [],
        loadedForwards: [],
        loadedBrand: null,
        loadedReports: [],
        loadedMappings: [],
        loadedJoins: [],
        loadedPurchases: [],
        loadedReactionOrders: [],
        loadedFilters: [],
        loadedBlacklist: [],
        loadedForwardSettings: null,
        telegramUserId: null,
      };
    }

    // 2. Fetch User Profiles & Telegram Subscriptions for telegram_user_id
    const storeTenant = useAuthStore.getState().tenantMapping;
    const [profileRes, subRes] = await Promise.all([
      supabase.from("profiles").select("telegram_user_id").eq("id", currentUserId).maybeSingle(),
      supabase.from("app_user_subscriptions").select("telegram_user_id").eq("user_id", currentUserId).maybeSingle(),
    ]);

    let rawTgUserId =
      profileRes.data?.telegram_user_id ||
      subRes.data?.telegram_user_id ||
      storeTenant?.telegram_user_id ||
      currentUserMetadata?.telegram_user_id ||
      currentUserMetadata?.telegram_id;

    let numericTgUserId: number | null = null;
    if (rawTgUserId !== undefined && rawTgUserId !== null && rawTgUserId !== '') {
      const parsed = Number(rawTgUserId);
      if (!isNaN(parsed) && parsed !== 0) {
        numericTgUserId = parsed;
      }
    }

    // 3. Fetch all primary data in parallel
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
      forwardSettingsData,
      directJoinsData,
    ] = await Promise.all([
      supabase.from("tg_tracker").select("*").eq("user_id", currentUserId).order("created_at", { ascending: false }),
      supabase
        .from("tg_bot_join_links")
        .select(`
          *,
          channel_mapping:tg_bot_channel_mappings(id, channel_name, status, channel_icon_url),
          bot:tg_tracker(id, status, bot_username, bot_name),
          users:tg_bot_join_users(id, telegram_user_id, joined_channel, left_channel, joined_at, left_at, created_at, telegram_username, telegram_first_name, rejoined_at, rejoin_count, status)
        `)
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false }),
      supabase.from("tg_landing_pages").select("*").eq("user_id", currentUserId).order("created_at", { ascending: false }),
      supabase.from("tg_chatbot_configs").select("*").eq("user_id", currentUserId),
      numericTgUserId
        ? supabase.from("tg_forward_mappings").select("*").eq("user_id", numericTgUserId).order("updated_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase.from("tg_brand_settings").select("*").eq("user_id", currentUserId).maybeSingle(),
      supabase
        .from("tg_trading_calls")
        .select("id, created_at, channel_id, channel_name, telegram_message_id, direction, symbol, strike_price, entry_price, targets, stop_loss, expiry, rationale, chart_url, pdf_url, status")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(50),
      supabase.from("tg_reaction_orders").select("*").eq("user_id", currentUserId),
      numericTgUserId
        ? supabase.from("tg_user_text_filters").select("*").eq("user_id", numericTgUserId)
        : Promise.resolve({ data: [], error: null }),
      numericTgUserId
        ? supabase.from("tg_user_blacklist_words").select("*").eq("user_id", numericTgUserId)
        : Promise.resolve({ data: [], error: null }),
      numericTgUserId
        ? supabase.from("tg_user_settings").select("*").eq("user_id", numericTgUserId).limit(1).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
      supabase
        .from("tg_bot_join_users")
        .select("*")
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false })
        .limit(300),
    ]);

    const loadedBots = botsData.data || [];
    const loadedLinks = linksData.data || [];
    const rawPages = pagesData.data || [];

    const loadedChatbots = chatbotsData.data || [];
    const loadedForwards = forwardsData.data || [];
    const loadedBrand = brandData.data || null;
    const loadedReports = reportsData.data || [];
    const loadedReactionOrders = reactionOrdersData.data || [];
    const loadedFilters = filtersData.data || [];
    const loadedBlacklist = blacklistData.data || [];
    const loadedForwardSettings = forwardSettingsData.data || null;

    // 4. Fetch Channel Mappings for user's bots
    let loadedMappings: any[] = [];
    if (loadedBots.length > 0) {
      const botIds = loadedBots.map((b: any) => b.id);
      const { data: mapData } = await supabase
        .from("tg_bot_channel_mappings")
        .select("*")
        .in("bot_id", botIds)
        .neq("status", "Inactive");
      loadedMappings = mapData || [];
    }

    // Try edge function live sync with 3-second timeout protection so it never hangs
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Edge fn timeout')), 3000)
      );
      const edgePromise = supabase.functions.invoke("telegram-call-report", {
        body: { action: "get_channel_mappings", user_id: currentUserId },
      });
      const syncRes: any = await Promise.race([edgePromise, timeoutPromise]);
      if (syncRes?.data?.mappings && Array.isArray(syncRes.data.mappings) && syncRes.data.mappings.length > 0) {
        const existingIds = new Set(loadedMappings.map((m: any) => m.id || m.channel_id));
        for (const m of syncRes.data.mappings) {
          if (!existingIds.has(m.id || m.channel_id)) {
            loadedMappings.push(m);
          }
        }
      }
    } catch {
      // Ignore edge function error or timeout, retain DB loadedMappings
    }

    // 5. Aggregate All User Joins (from direct joins query & link.users nested query)
    const joinsMap = new Map<string, any>();
    (directJoinsData.data || []).forEach((j: any) => {
      if (j.id) joinsMap.set(j.id, j);
    });

    loadedLinks.forEach((link: any) => {
      const chanName = link.channel_mapping?.channel_name || link.name || 'Tracked Channel';
      (link.users || []).forEach((u: any) => {
        if (u.id) {
          const existing = joinsMap.get(u.id);
          joinsMap.set(u.id, {
            ...u,
            channel_name: existing?.channel_name || chanName,
            joined_at: u.joined_at || u.created_at,
          });
        }
      });
    });

    const loadedJoins = Array.from(joinsMap.values()).sort(
      (a: any, b: any) => new Date(b.joined_at || b.created_at || 0).getTime() - new Date(a.joined_at || a.created_at || 0).getTime()
    );

    // 6. Fetch Purchases & Subscriptions for user's landing pages
    let loadedPurchases: any[] = [];
    let activeSubscribersCount = 0;
    const pageIds = rawPages.map((p: any) => p.id).filter(Boolean);

    let subsList: any[] = [];
    if (pageIds.length > 0) {
      const [paymentsRes, subsRes] = await Promise.all([
        supabase
          .from("payments")
          .select("id, amount, currency, status, created_at, landing_page_id, razorpay_payment_id")
          .in("landing_page_id", pageIds)
          .eq("status", "success")
          .order("created_at", { ascending: false }),
        supabase
          .from("tg_channel_subscriptions")
          .select("id, plan_id, landing_page_id, status, telegram_user_id, created_at, plan:tg_plans(price, currency)")
          .in("landing_page_id", pageIds)
          .eq("status", "active")
          .not("telegram_user_id", "is", null),
      ]);

      subsList = subsRes.data || [];
      activeSubscribersCount = subsList.length;

      const directPayments = paymentsRes.data || [];
      if (directPayments.length > 0) {
        loadedPurchases = directPayments;
      } else if (subsList.length > 0) {
        // Fallback when payments table is restricted by RLS for unauthenticated/anon client
        loadedPurchases = subsList.map((s: any) => ({
          id: s.id,
          amount: Number(s.plan?.price) || 0,
          currency: s.plan?.currency || "INR",
          status: "SUCCESS",
          created_at: s.created_at || new Date().toISOString(),
          landing_page_id: s.landing_page_id,
          razorpay_payment_id: `sub_${s.id.slice(0, 8)}`,
        }));
      }
    }

    // Calculate revenue (from direct payments or subscription plan prices)
    let totalRevenue = loadedPurchases.reduce(
      (acc: number, curr: any) => acc + (Number(curr.amount) || 0),
      0
    );
    if (totalRevenue === 0 && subsList.length > 0) {
      totalRevenue = subsList.reduce(
        (acc: number, curr: any) => acc + (Number(curr.plan?.price) || 0),
        0
      );
    }

    // Attach member count to each page
    const subsCountByPage = new Map<string, number>();
    subsList.forEach((s: any) => {
      if (s.landing_page_id) {
        subsCountByPage.set(s.landing_page_id, (subsCountByPage.get(s.landing_page_id) || 0) + 1);
      }
    });

    const loadedPages = rawPages.map((p: any) => ({
      ...p,
      title: p.title || p.page_title || 'Untitled Page',
      subscribers_count: subsCountByPage.get(p.id) || 0,
      members: subsCountByPage.get(p.id) || p.members || 0,
    }));

    const activeForwardsCount = loadedForwards.filter((f: any) => f.is_active !== false).length;
    const trackerBotsCount = loadedBots.length;
    const channelsCount = loadedMappings.length;
    const deepLinksCount = loadedLinks.length;
    const forwardsCount = activeForwardsCount;
    const teleSubPagesCount = loadedPages.length;

    return {
      trackerBots: loadedBots,
      trackerBotsCount,
      channelsCount,
      deepLinksCount,
      forwardsCount,
      teleSubPagesCount,
      revenue: totalRevenue,
      activeSubscribers: activeSubscribersCount,
      hub: defaultHub,
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

