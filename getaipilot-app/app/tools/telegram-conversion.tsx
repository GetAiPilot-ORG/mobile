import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, {
  Circle as SvgCircle,
  Defs,
  Line as SvgLine,
  LinearGradient as SvgGradient,
  Path as SvgPath,
  Rect as SvgRect,
  Stop,
} from "react-native-svg";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Activity01Icon,
  Add01Icon,
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  BrowserIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  CreditCardIcon,
  Edit02Icon,
  Forward01Icon,
  Layout01Icon,
  Link01Icon,
  Megaphone01Icon,
  Rocket01Icon,
  Search01Icon,
  ShieldCheckIcon,
  TelegramIcon,
  TelescopeIcon,
  UserGroupIcon,
  UserIcon,
} from "@/constants/icons";
import { AppColors, getColors, useTheme } from "@/theme";
import { AppScreen } from "../../src/components/AppScreen";
import { AppTopBar } from "../../src/components/AppTopBar";
import { useAuthStore } from "../../src/core/store/authStore";
import { soundService } from "../../src/services/soundFeedbackService";
import {
  AvailableChannel,
  buildInstallSnippet,
  ConversionReport,
  CreatedTemplatePage,
  fetchConversionReport,
  fetchMetaReport,
  fetchUserCreatedTemplates,
  fetchUserTelegramChannels,
  getDateRange,
  MetaReport,
  TelegramSetup,
  TrackingCampaign,
  TrackingInventory,
  trackingRequest,
} from "../../src/lib/telegramConversionApi";

const emptyInventory: TrackingInventory = {
  telegram: {
    configured: false,
    bot_username: null,
    status: "not_configured",
    is_admin: false,
    identity: null,
    link: null,
  },
  operations: { pending: 0, dead: 0 },
  meta_accounts: [],
  sites: [],
  connections: [],
  campaigns: [],
  pages: [],
};

function showNotice(title: string, message: string) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    window.alert(`${title}\n\n${message}`);
    return;
  }
  Alert.alert(title, message);
}

function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
) {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    if (window.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: "Cancel", style: "cancel" },
    { text: "Disconnect", style: "destructive", onPress: onConfirm },
  ]);
}

export default function TelegramConversionScreen() {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const authUser = useAuthStore((s) => s.user);

  const [activeTab, setActiveTab] = useState<"setup" | "analytics">("setup");
  const [setupStep, setSetupStep] = useState<1 | 2 | 3>(1);
  const [inventory, setInventory] = useState<TrackingInventory>(emptyInventory);
  const [fallbackPages, setFallbackPages] = useState<CreatedTemplatePage[]>([]);
  const [fallbackChannels, setFallbackChannels] = useState<AvailableChannel[]>([]);
  const [report, setReport] = useState<ConversionReport | null>(null);
  const [metaReport, setMetaReport] = useState<MetaReport[]>([]);
  const [reportDays, setReportDays] = useState<7 | 30>(7);
  const [selectedCampaignFilter, setSelectedCampaignFilter] = useState("");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [chartSeries, setChartSeries] = useState<
    "all" | "views" | "joins" | "leaves"
  >("all");
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const { width: windowWidth } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

  // Meta Ads Reporting & Mapping Forms
  const [metaSetupExpanded, setMetaSetupExpanded] = useState(false);
  const [metaAdAccountId, setMetaAdAccountId] = useState("");
  const [metaAccessToken, setMetaAccessToken] = useState("");
  const [mapTrackingCampaignId, setMapTrackingCampaignId] = useState("");
  const [mapMetaAccountId, setMapMetaAccountId] = useState("");
  const [mapMetaCampaignId, setMapMetaCampaignId] = useState("");

  // Created Designs Dropdown
  const [selectedDesignId, setSelectedDesignId] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [designSearch, setDesignSearch] = useState("");

  // Telegram Channels Dropdown
  const [selectedAvailableChatId, setSelectedAvailableChatId] = useState("");
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");

  // Website Type Selection: Internal (GetAiPilot Templates) vs External (Custom Domain)
  const [websiteType, setWebsiteType] = useState<"internal" | "external">("internal");

  // Custom Website Form
  const [siteName, setSiteName] = useState("");
  const [siteUrl, setSiteUrl] = useState("");

  // Telegram Account + Channel Form
  const [botMode, setBotMode] = useState<"shared" | "own">("shared");
  const [activeLink, setActiveLink] = useState<{
    id: string;
    url: string;
    expires_at: string;
  } | null>(null);
  const [manualChannel, setManualChannel] = useState("");
  const [manualAccordionOpen, setManualAccordionOpen] = useState(false);
  const [ownBotToken, setOwnBotToken] = useState("");
  const [ownChatId, setOwnChatId] = useState("");

  // Campaign Form
  const [campaignName, setCampaignName] = useState("");
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [selectedConnectionId, setSelectedConnectionId] = useState("");
  const [originalTelegramUrl, setOriginalTelegramUrl] = useState("");
  const [joinRequest, setJoinRequest] = useState(false);
  const [expandedInstallMap, setExpandedInstallMap] = useState<
    Record<string, boolean>
  >({});

  const loadData = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const range = getDateRange(reportDays, timezone);
        const [invResult, pagesResult, channelsResult, reportResult, metaResult] =
          await Promise.allSettled([
            trackingRequest<TrackingInventory>("list"),
            fetchUserCreatedTemplates(authUser?.id),
            fetchUserTelegramChannels(authUser?.id),
            fetchConversionReport(reportDays, selectedCampaignFilter, timezone),
            fetchMetaReport(range.from, range.to, selectedCampaignFilter),
          ]);

        if (pagesResult.status === "fulfilled") {
          setFallbackPages(pagesResult.value);
        }

        if (channelsResult.status === "fulfilled") {
          setFallbackChannels(channelsResult.value);
        }

        if (invResult.status === "fulfilled") {
          const inv = invResult.value;
          setInventory(inv);
          setErrorMsg("");

          const firstVerified = inv.sites.find((s) => s.verified_at);
          if (firstVerified) {
            setSelectedSiteId((prev) => prev || firstVerified.id);
          }
          if (inv.connections.length > 0) {
            setSelectedConnectionId((prev) => prev || inv.connections[0].id);
          }
          if ((inv.meta_accounts || []).length > 0) {
            setMapMetaAccountId((prev) => prev || inv.meta_accounts![0].id);
          }
          if (inv.campaigns.length > 0) {
            setMapTrackingCampaignId((prev) => prev || inv.campaigns[0].id);
          }
        } else {
          setErrorMsg(
            invResult.reason instanceof Error
              ? invResult.reason.message
              : "Could not load Telegram conversion settings.",
          );
        }

        if (reportResult.status === "fulfilled") {
          setReport(reportResult.value);
        }
        if (metaResult.status === "fulfilled") {
          setMetaReport(metaResult.value);
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authUser?.id, reportDays, selectedCampaignFilter, timezone],
  );

  useEffect(() => {
    void loadData(true);
  }, [loadData]);

  // Poll Telegram verification link while user completes /start in Telegram
  useEffect(() => {
    if (!activeLink) return;
    let stopped = false;

    const poll = async () => {
      if (Date.now() >= Date.parse(activeLink.expires_at)) {
        setActiveLink(null);
        return;
      }
      try {
        const next = await trackingRequest<TelegramSetup>("telegram_status", {});
        if (stopped) return;
        setInventory((prev) => ({ ...prev, telegram: next }));
        if (next.link?.id === activeLink.id && next.link.connection_id) {
          setActiveLink(null);
          await loadData(false);
        }
      } catch { }
    };

    const timer = setInterval(() => void poll(), 4000);
    void poll();
    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [activeLink, loadData]);

  const templates = useMemo(() => {
    const merged = new Map<string, CreatedTemplatePage>();
    for (const p of fallbackPages) merged.set(p.id, p);
    for (const p of inventory.pages) {
      merged.set(p.id, { design_type: "landing", ...merged.get(p.id), ...p });
    }
    return Array.from(merged.values());
  }, [fallbackPages, inventory.pages]);

  const selectedDesign = useMemo(
    () =>
      templates.find((t) => t.id === selectedDesignId) || templates[0] || null,
    [templates, selectedDesignId],
  );

  const filteredDesigns = useMemo(() => {
    const q = designSearch.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter(
      (t) =>
        t.page_title.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q),
    );
  }, [templates, designSearch]);

  const getDesignUrl = (page: CreatedTemplatePage) =>
    page.design_type === "bio"
      ? `https://gbio.us/${page.slug}`
      : `https://gpage.us/${page.slug}`;

  const normalizeSiteUrl = (raw: string): string => {
    try {
      const u = new URL(raw.trim());
      const path = decodeURIComponent(u.pathname).replace(/\/+$/, "") || "";
      return `${u.protocol}//${u.hostname.toLowerCase()}${path}`;
    } catch {
      return raw.trim().replace(/\/+$/, "").toLowerCase();
    }
  };

  const findSiteForDesign = (page: CreatedTemplatePage) => {
    const normalized = normalizeSiteUrl(getDesignUrl(page));
    return inventory.sites.find(
      (s) =>
        s.landing_page_id === page.id ||
        normalizeSiteUrl(s.url) === normalized,
    );
  };

  const externalSites = useMemo(() => {
    const templateUrls = new Set(
      templates.map((t) => normalizeSiteUrl(getDesignUrl(t))),
    );
    return inventory.sites.filter(
      (s) => !s.landing_page_id && !templateUrls.has(normalizeSiteUrl(s.url)),
    );
  }, [inventory.sites, templates]);

  const verifiedSites = useMemo(
    () => inventory.sites.filter((s) => Boolean(s.verified_at)),
    [inventory.sites],
  );

  const step1Done = inventory.connections.length > 0;
  const step2Done = verifiedSites.length > 0;
  const step3Done = inventory.campaigns.length > 0;

  const selectedSite = useMemo(
    () => inventory.sites.find((s) => s.id === selectedSiteId) || null,
    [inventory.sites, selectedSiteId],
  );

  const selectedConnection = useMemo(
    () =>
      inventory.connections.find((c) => c.id === selectedConnectionId) ||
      (inventory.connections.length > 0 ? inventory.connections[0] : null),
    [inventory.connections, selectedConnectionId],
  );

  const isSelectedSiteInternal = useMemo(() => {
    if (!selectedSite) return false;
    return Boolean(
      selectedSite.landing_page_id ||
      selectedSite.bio_page_id ||
      templates.some(
        (t) =>
          t.id === selectedSite.landing_page_id ||
          normalizeSiteUrl(getDesignUrl(t)) === normalizeSiteUrl(selectedSite.url),
      ),
    );
  }, [selectedSite, templates]);

  const availableChannels = useMemo(() => {
    const connByChatId = new Map(
      inventory.connections.map((c) => [String(c.chat_id), c]),
    );
    const merged = new Map<string, AvailableChannel>();
    const add = (ch: AvailableChannel) => {
      const key = String(ch.chat_id || "").trim();
      if (!key) return;
      const conn = connByChatId.get(key);
      merged.set(key, {
        ...ch,
        chat_id: key,
        connection_id: conn?.id || ch.connection_id || null,
        connection_status: conn?.status || ch.connection_status || null,
      });
    };
    for (const ch of fallbackChannels) add(ch);
    for (const ch of inventory.available_channels || []) add(ch);
    for (const c of inventory.connections) {
      if (!merged.has(String(c.chat_id))) {
        add({
          chat_id: String(c.chat_id),
          title: c.title || "Telegram Channel",
          username: null,
          chat_type: "channel",
          is_admin: true,
          photo_url: null,
          source: "connected",
          connection_id: c.id,
          connection_status: c.status,
        });
      }
    }
    return Array.from(merged.values());
  }, [fallbackChannels, inventory.available_channels, inventory.connections]);

  const selectedAvailableChannel = useMemo(
    () =>
      availableChannels.find((c) => c.chat_id === selectedAvailableChatId) ||
      availableChannels[0] ||
      null,
    [availableChannels, selectedAvailableChatId],
  );

  const filteredChannels = useMemo(() => {
    const q = channelSearch.trim().toLowerCase();
    if (!q) return availableChannels;
    return availableChannels.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.username || "").toLowerCase().includes(q) ||
        c.chat_id.includes(q),
    );
  }, [availableChannels, channelSearch]);

  const runAction = async <T = any>(
    key: string,
    action: string,
    body: object,
    successTitle?: string,
    successFallback?: string,
  ): Promise<T | null> => {
    setBusyKey(key);
    try {
      const res = await trackingRequest<any>(action, body);
      soundService.play("success");
      await loadData(false);
      if (successTitle) {
        showNotice(successTitle, res?.message || successFallback || "Done");
      }
      return res as T;
    } catch (e: any) {
      soundService.play("click");
      showNotice("Action Failed", e?.message || "Please try again.");
      return null;
    } finally {
      setBusyKey("");
    }
  };

  const handleCopy = async (id: string, value: string, label: string) => {
    await Clipboard.setStringAsync(value);
    soundService.play("success");
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(""), 2200);
    showNotice("Copied", `${label} copied to clipboard.`);
  };

  const normalizeTelegramDestination = (raw?: string | null): string => {
    const trimmed = (raw || "").trim();
    if (!trimmed) return "";
    if (/^@([a-zA-Z0-9_]{3,})$/.test(trimmed)) {
      return `https://t.me/${trimmed.slice(1)}`;
    }
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed.replace(/^http:\/\//i, "https://")
      : /^t\.me\/.+/i.test(trimmed)
        ? `https://${trimmed}`
        : trimmed;
    try {
      const url = new URL(withProto);
      if (
        url.protocol === "https:" &&
        url.hostname.toLowerCase() === "t.me" &&
        url.pathname &&
        url.pathname !== "/"
      ) {
        return url.href;
      }
    } catch {
      // ignore invalid placeholder URLs like "https://"
    }
    return "";
  };

  const handleConnectTemplate = async (page: CreatedTemplatePage) => {
    const isBio = page.design_type === "bio";
    const saved = await runAction(
      `tpl-${page.id}`,
      "site",
      isBio
        ? {
          name: page.page_title || page.slug,
          bio_page_id: page.id,
        }
        : {
          name: page.page_title || page.slug,
          landing_page_id: page.id,
        },
      "Design Verified",
      `${page.page_title} is connected and verified for Telegram tracking.`,
    );
    if (saved?.id) {
      setSelectedSiteId(saved.id);
      const cleanTarget = normalizeTelegramDestination(page.telegram_url);
      if (cleanTarget && !normalizeTelegramDestination(originalTelegramUrl)) {
        setOriginalTelegramUrl(cleanTarget);
      }
    }
  };

  const handleAddWebsite = async () => {
    const cleanName = siteName.trim();
    const cleanUrl = siteUrl.trim();
    if (!cleanName || !cleanUrl) {
      showNotice("Missing Details", "Enter both website name and HTTPS URL.");
      return;
    }
    const saved = await runAction(
      "add-site",
      "site",
      { name: cleanName, url: cleanUrl },
      "Website Added",
      "Add the DNS TXT record shown below and tap Verify DNS.",
    );
    if (saved) {
      setSiteName("");
      setSiteUrl("");
    }
  };

  const handleVerifyExternalSite = async (siteId: string) => {
    const res = await runAction(
      `verify-${siteId}`,
      "verify_site",
      { id: siteId },
      "Website Verified",
      "DNS TXT record confirmed. Your website is now verified.",
    );
    if (res?.verified) {
      setSelectedSiteId(siteId);
    }
  };

  const handleDisconnectSite = (siteId: string, label: string) => {
    confirmAction(
      "Disconnect Webpage",
      `Disconnect "${label}"? Any tracking campaigns linked to this webpage will also be removed.`,
      () => {
        void runAction(
          `disc-site-${siteId}`,
          "disconnect_site",
          { id: siteId },
          "Webpage Disconnected",
          `${label} has been disconnected.`,
        ).then((res) => {
          if (res?.ok && selectedSiteId === siteId) {
            setSelectedSiteId("");
          }
        });
      },
    );
  };

  const handleDisconnectConnection = (connectionId: string, label: string) => {
    confirmAction(
      "Disconnect Telegram Channel",
      `Disconnect "${label}"? Any campaigns using this channel will also be removed.`,
      () => {
        void runAction(
          `disc-conn-${connectionId}`,
          "disconnect_connection",
          { id: connectionId },
          "Channel Disconnected",
          `${label} has been disconnected.`,
        ).then((res) => {
          if (res?.ok && selectedConnectionId === connectionId) {
            setSelectedConnectionId("");
          }
        });
      },
    );
  };

  const handleDisconnectTelegramAccount = () => {
    confirmAction(
      "Disconnect Telegram Account",
      "Disconnect your linked Telegram account? All connected Telegram channels and their campaigns will also be disconnected.",
      () => {
        void runAction(
          "disc-tg",
          "disconnect_telegram",
          {},
          "Telegram Disconnected",
          "Your Telegram account and connected channels have been disconnected.",
        ).then((res) => {
          if (res?.ok) {
            setActiveLink(null);
            setSelectedConnectionId("");
          }
        });
      },
    );
  };

  const handleLinkTelegramAccount = async () => {
    const res = await runAction<{ id: string; url: string; expires_at: string }>(
      "tg-link",
      "telegram_link",
      {},
    );
    if (res?.url) {
      setActiveLink(res);
      Linking.openURL(res.url).catch(() => { });
    }
  };

  const handleConfirmTelegramAccount = async () => {
    if (!inventory.telegram.link) return;
    const saved = await runAction(
      "tg-confirm",
      "telegram_confirm",
      { id: inventory.telegram.link.id, channel_picker: botMode === "shared" },
      "Telegram Account Verified",
      botMode === "shared"
        ? "Account confirmed! Choose your channel in the bot or connect manually below."
        : "Telegram identity verified. You can now connect your own bot.",
    );
    if (saved && botMode === "own") {
      setActiveLink(null);
    }
  };

  const handleOpenChannelPicker = async () => {
    const res = await runAction<{ id: string; url: string; expires_at: string }>(
      "tg-picker",
      "telegram_picker",
      {},
    );
    if (res?.url) {
      setActiveLink(res);
      Linking.openURL(res.url).catch(() => { });
    }
  };

  const handleConnectManualChannel = async () => {
    if (!manualChannel.trim()) {
      showNotice("Channel Required", "Enter @channelusername or -100... chat ID.");
      return;
    }
    const saved = await runAction(
      "tg-bind",
      "connect_shared",
      { chat_id: manualChannel.trim() },
      "Channel Connected",
      "Channel permissions verified and connected.",
    );
    if (saved?.id) {
      setManualChannel("");
      setActiveLink(null);
      setSelectedConnectionId(saved.id);
    }
  };

  const handleConnectOwnBot = async () => {
    if (!ownBotToken.trim() || !ownChatId.trim()) {
      showNotice("Missing Fields", "Enter both bot token and channel ID/username.");
      return;
    }
    const saved = await runAction(
      "tg-own",
      "connect",
      { bot_token: ownBotToken.trim(), chat_id: ownChatId.trim() },
      "Dedicated Bot Connected",
      "Bot permissions and webhook verified.",
    );
    if (saved?.id) {
      setOwnBotToken("");
      setOwnChatId("");
      setSelectedConnectionId(saved.id);
    }
  };

  const handleCreateCampaign = async () => {
    const verifiedSites = inventory.sites.filter((s) => Boolean(s.verified_at));
    const effectiveSiteId =
      verifiedSites.find((s) => s.id === selectedSiteId)?.id ||
      (verifiedSites.length === 1 ? verifiedSites[0].id : "");
    const effectiveConnectionId =
      inventory.connections.find((c) => c.id === selectedConnectionId)?.id ||
      (inventory.connections.length === 1 ? inventory.connections[0].id : "");

    if (!effectiveSiteId) {
      showNotice(
        "Verified Page Required",
        "Verify and select a created design or website before creating a campaign.",
      );
      return;
    }
    if (!effectiveConnectionId) {
      showNotice(
        "Telegram Channel Required",
        "Connect and select a Telegram channel before creating a campaign.",
      );
      return;
    }
    if (!campaignName.trim()) {
      showNotice("Campaign Name Required", "Enter a name for your campaign.");
      return;
    }
    if (campaignName.trim().length > 120) {
      showNotice(
        "Campaign Name Too Long",
        "Campaign name must be 120 characters or fewer.",
      );
      return;
    }

    const cleanTelegramUrl = normalizeTelegramDestination(originalTelegramUrl);
    if (!cleanTelegramUrl) {
      showNotice(
        "Valid Telegram Link Required",
        "Enter a valid destination link like https://t.me/yourchannel or https://t.me/+invite.",
      );
      return;
    }
    if (cleanTelegramUrl !== originalTelegramUrl.trim()) {
      setOriginalTelegramUrl(cleanTelegramUrl);
    }

    setBusyKey("create-campaign");
    try {
      const created = await trackingRequest<TrackingCampaign>("campaign", {
        name: campaignName.trim(),
        site_id: effectiveSiteId,
        connection_id: effectiveConnectionId,
        original_telegram_url: cleanTelegramUrl,
        join_request: joinRequest,
      });

      let activatedInvite: string | null = null;
      if (created?.id) {
        try {
          const act = await trackingRequest<{ invite_link?: string }>(
            "activate",
            { id: created.id },
          );
          activatedInvite = act?.invite_link || null;
        } catch {
          // Campaign remains in draft; user can tap Activate on the card below.
        }
      }

      soundService.play("success");
      setCampaignName("");
      await loadData(false);
      setActiveTab("analytics");

      showNotice(
        activatedInvite ? "Campaign Active" : "Campaign Created",
        activatedInvite
          ? "Your tracking campaign is active! Copy the Campaign Tracking URL and Telegram Invite Link below."
          : "Campaign created below. Tap Activate & Generate Invite to generate your tracking invite link.",
      );
    } catch (e: any) {
      soundService.play("click");
      showNotice("Action Failed", e?.message || "Could not create campaign.");
    } finally {
      setBusyKey("");
    }
  };

  const linkClaimed =
    Boolean(inventory.telegram.link?.claimed_user_id) &&
    !inventory.telegram.link?.confirmed_at &&
    Date.parse(inventory.telegram.link?.expires_at || "") > Date.now();

  const reportTotals = useMemo(() => {
    const rows = report?.campaigns || [];
    return rows.reduce(
      (acc, r) => ({
        views: acc.views + Number(r.views || 0),
        clicks: acc.clicks + Number(r.clicks || 0),
        joins: acc.joins + Number(r.acquisitions || 0),
        active: acc.active + Number(r.active || 0),
        leaves: acc.leaves + Number(r.leave_events || 0),
        pending: acc.pending + Number(r.pending || 0),
        ambiguous: acc.ambiguous + Number(r.ambiguous || 0),
      }),
      { views: 0, clicks: 0, joins: 0, active: 0, leaves: 0, pending: 0, ambiguous: 0 },
    );
  }, [report]);

  const metaAccounts = inventory.meta_accounts || [];
  const availableTimezones = useMemo(
    () =>
      Array.from(
        new Set(["Asia/Kolkata", "UTC", ...metaAccounts.map((a) => a.timezone).filter(Boolean)]),
      ),
    [metaAccounts],
  );
  const currentRange = useMemo(
    () => getDateRange(reportDays, timezone),
    [reportDays, timezone],
  );
  const reportRows = report?.campaigns || [];
  const financeReady =
    !errorMsg &&
    reportRows.length > 0 &&
    metaReport.length === reportRows.length &&
    metaReport.every(
      (m) =>
        m.complete &&
        m.status === "connected" &&
        m.timezone === timezone &&
        m.currency === metaReport[0].currency,
    );
  const metaSpend = useMemo(
    () => metaReport.reduce((sum, m) => sum + Number(m.spend || 0), 0),
    [metaReport],
  );
  const metaLinkClicks = useMemo(
    () => metaReport.reduce((sum, m) => sum + Number(m.link_clicks || 0), 0),
    [metaReport],
  );
  const formatMoney = useCallback(
    (val: number, currencyOverride?: string) => {
      const currency = currencyOverride || metaReport[0]?.currency || "INR";
      try {
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency,
          maximumFractionDigits: 2,
        }).format(val);
      } catch {
        return `${currency} ${val.toFixed(2)}`;
      }
    },
    [metaReport],
  );

  const handleConnectMeta = async () => {
    const cleanId = metaAdAccountId.trim().replace(/^act_/, "");
    const cleanToken = metaAccessToken.trim();
    if (!/^\d+$/.test(cleanId)) {
      showNotice("Invalid Account ID", "Enter a valid numeric Meta Ad Account ID (e.g. act_123456789).");
      return;
    }
    if (!cleanToken) {
      showNotice("Missing Token", "Paste your authorized Meta reporting access token.");
      return;
    }
    const saved = await runAction(
      "connect-meta",
      "connect_meta",
      { account_id: cleanId, access_token: cleanToken },
      "Meta Reporting Connected",
      "Meta ad account connected. Now sync dates and map your campaigns.",
    );
    if (saved) {
      setMetaAdAccountId("");
      setMetaAccessToken("");
    }
  };

  const handleSyncMetaAccount = async (accountId: string) => {
    await runAction(
      `sync-meta-${accountId}`,
      "sync_meta",
      { id: accountId, from: currentRange.from, to: currentRange.to },
      "Meta Reporting Synchronized",
      `Synced Meta ad spend & link clicks for ${currentRange.from} to ${currentRange.to}.`,
    );
  };

  const handleMapMetaCampaign = async () => {
    const cleanCampaign = mapTrackingCampaignId.trim();
    const cleanAccount = mapMetaAccountId.trim();
    const cleanMetaCampaignId = mapMetaCampaignId.trim();
    if (!cleanCampaign || !cleanAccount || !/^\d+$/.test(cleanMetaCampaignId)) {
      showNotice("Missing Details", "Select a tracking campaign, Meta ad account, and numeric Meta campaign ID.");
      return;
    }
    const res = await runAction(
      "map-meta",
      "map_meta",
      {
        id: cleanCampaign,
        account_id: cleanAccount,
        meta_campaign_id: cleanMetaCampaignId,
      },
      "Campaign Mapped",
      "Meta advertising campaign linked for ad spend & ROI attribution.",
    );
    if (res) {
      setMapMetaCampaignId("");
    }
  };

  const dailyChartData = useMemo(() => {
    const count = reportDays === 7 ? 7 : 14;
    const byDay = new Map<
      string,
      { views: number; clicks: number; joins: number; departures: number }
    >();
    for (const item of report?.daily || []) {
      const key = String(item.day || "").slice(0, 10);
      if (!key) continue;
      byDay.set(key, {
        views: Number(item.views || 0),
        clicks: Number(item.clicks || 0),
        joins: Number(item.joins || 0),
        departures: Number(item.departures || 0),
      });
    }

    const fmtDay = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    const fmtLabel = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      month: "short",
      day: "numeric",
    });

    const points: {
      day: string;
      label: string;
      views: number;
      clicks: number;
      joins: number;
      departures: number;
    }[] = [];

    const now = Date.now();
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now - i * 86_400_000);
      const dayKey = fmtDay.format(d);
      const existing = byDay.get(dayKey);
      points.push({
        day: dayKey,
        label: i === 0 ? "Today" : fmtLabel.format(d),
        views: existing?.views ?? 0,
        clicks: existing?.clicks ?? 0,
        joins: existing?.joins ?? 0,
        departures: existing?.departures ?? 0,
      });
    }
    return points;
  }, [report?.daily, reportDays]);

  const activeDayPoint = useMemo(() => {
    if (dailyChartData.length === 0) return null;
    if (
      selectedDayIndex !== null &&
      selectedDayIndex >= 0 &&
      selectedDayIndex < dailyChartData.length
    ) {
      return dailyChartData[selectedDayIndex];
    }
    for (let i = dailyChartData.length - 1; i >= 0; i--) {
      const p = dailyChartData[i];
      if (p.views || p.clicks || p.joins || p.departures) return p;
    }
    return dailyChartData[dailyChartData.length - 1];
  }, [dailyChartData, selectedDayIndex]);

  const renderTrendChart = () => {
    const chartWidth = Math.max(250, Math.min(windowWidth - 64, 520));
    const chartHeight = 148;
    const padX = 12;
    const padTop = 14;
    const padBottom = 10;
    const plotW = chartWidth - padX * 2;
    const plotH = chartHeight - padTop - padBottom;
    const n = Math.max(dailyChartData.length, 1);

    const valuesForSeries = dailyChartData.map((p) => {
      if (chartSeries === "views") return p.views;
      if (chartSeries === "joins") return p.joins;
      if (chartSeries === "leaves") return p.departures;
      return Math.max(p.views, p.clicks, p.joins, p.departures);
    });
    const maxVal = Math.max(1, ...valuesForSeries);

    const getX = (idx: number) =>
      n === 1 ? padX + plotW / 2 : padX + (idx / (n - 1)) * plotW;
    const getY = (val: number) => padTop + plotH - (val / maxVal) * plotH;

    const buildSmoothPath = (vals: number[]) => {
      if (vals.length === 0) return "";
      const pts = vals.map((v, i) => ({ x: getX(i), y: getY(v) }));
      if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
      let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i];
        const p1 = pts[i + 1];
        const cx = (p0.x + p1.x) / 2;
        d += ` C ${cx.toFixed(1)} ${p0.y.toFixed(1)}, ${cx.toFixed(1)} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
      }
      return d;
    };

    const viewsPath = buildSmoothPath(dailyChartData.map((p) => p.views));
    const joinsPath = buildSmoothPath(dailyChartData.map((p) => p.joins));
    const leavesPath = buildSmoothPath(dailyChartData.map((p) => p.departures));

    const primaryVals =
      chartSeries === "joins"
        ? dailyChartData.map((p) => p.joins)
        : chartSeries === "leaves"
          ? dailyChartData.map((p) => p.departures)
          : dailyChartData.map((p) => p.views);
    const primaryLine = buildSmoothPath(primaryVals);
    const primaryArea =
      dailyChartData.length > 1
        ? `${primaryLine} L ${getX(n - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${getX(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
        : "";

    const primaryColor =
      chartSeries === "joins"
        ? "#10B981"
        : chartSeries === "leaves"
          ? "#EF4444"
          : isDark
            ? "#38BDF8"
            : "#0284C7";

    const barWidth = Math.max(6, Math.min(16, plotW / (n * 2.1)));

    return (
      <View style={styles.chartCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.chartIconBadge}>
              <HugeiconsIcon
                icon={Activity01Icon}
                size={16}
                color={isDark ? "#38BDF8" : "#0284C7"}
                strokeWidth={2.1}
              />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Activity Trend</Text>
              <Text style={styles.chartSub}>
                Last {dailyChartData.length} days · Tap any day to inspect
              </Text>
            </View>
          </View>
          <Text style={styles.countPill}>Peak {maxVal}</Text>
        </View>

        {/* Series Filter Pills */}
        <View style={styles.chartFilterRow}>
          {(
            [
              { key: "all", label: "All", dot: colors.primary },
              { key: "views", label: "Views", dot: isDark ? "#38BDF8" : "#0284C7" },
              { key: "joins", label: "Joins", dot: "#10B981" },
              { key: "leaves", label: "Leaves", dot: "#EF4444" },
            ] as const
          ).map((item) => {
            const active = chartSeries === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  soundService.play("click");
                  setChartSeries(item.key);
                }}
                style={[
                  styles.chartFilterChip,
                  active && styles.chartFilterChipActive,
                ]}
              >
                <View style={[styles.legendDot, { backgroundColor: item.dot }]} />
                <Text
                  style={[
                    styles.chartFilterText,
                    active && styles.chartFilterTextActive,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* SVG Chart */}
        <View style={styles.svgChartWrap}>
          <Svg width={chartWidth} height={chartHeight}>
            <Defs>
              <SvgGradient id="gapChartFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor={primaryColor} stopOpacity={0.28} />
                <Stop offset="100%" stopColor={primaryColor} stopOpacity={0.01} />
              </SvgGradient>
            </Defs>

            {/* Horizontal reference gridlines */}
            {[0, 0.5, 1].map((ratio) => {
              const y = padTop + plotH * ratio;
              return (
                <SvgLine
                  key={ratio}
                  x1={padX}
                  y1={y}
                  x2={chartWidth - padX}
                  y2={y}
                  stroke={isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0"}
                  strokeWidth={1}
                  strokeDasharray="4,4"
                />
              );
            })}

            {/* Background volume bars */}
            {dailyChartData.map((p, idx) => {
              const val =
                chartSeries === "joins"
                  ? p.joins
                  : chartSeries === "leaves"
                    ? p.departures
                    : chartSeries === "views"
                      ? p.views
                      : Math.max(p.views, p.clicks, p.joins);
              const barH = Math.max(3, (val / maxVal) * plotH);
              const x = getX(idx) - barWidth / 2;
              const y = padTop + plotH - barH;
              const isSelected = activeDayPoint?.day === p.day;
              return (
                <SvgRect
                  key={p.day}
                  x={x}
                  y={y}
                  width={barWidth}
                  height={barH}
                  rx={4}
                  fill={primaryColor}
                  opacity={isSelected ? 0.34 : 0.14}
                />
              );
            })}

            {/* Area fill */}
            {primaryArea ? (
              <SvgPath d={primaryArea} fill="url(#gapChartFill)" />
            ) : null}

            {/* Primary & secondary curves */}
            {chartSeries === "all" ? (
              <>
                <SvgPath
                  d={viewsPath}
                  fill="none"
                  stroke={isDark ? "#38BDF8" : "#0284C7"}
                  strokeWidth={2.5}
                />
                <SvgPath
                  d={joinsPath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth={2.5}
                />
                <SvgPath
                  d={leavesPath}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth={1.75}
                  strokeDasharray="3,3"
                />
              </>
            ) : (
              <SvgPath
                d={primaryLine}
                fill="none"
                stroke={primaryColor}
                strokeWidth={2.75}
              />
            )}

            {/* Data point dots */}
            {dailyChartData.map((p, idx) => {
              const isSelected = activeDayPoint?.day === p.day;
              const cx = getX(idx);
              const cy =
                chartSeries === "joins"
                  ? getY(p.joins)
                  : chartSeries === "leaves"
                    ? getY(p.departures)
                    : getY(p.views);
              return (
                <SvgCircle
                  key={`pt-${p.day}`}
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 5 : 3}
                  fill={isSelected ? "#FFFFFF" : primaryColor}
                  stroke={primaryColor}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                />
              );
            })}
          </Svg>

          {/* Interactive X-axis tap targets */}
          <View style={[styles.chartAxisRow, { width: chartWidth }]}>
            {dailyChartData.map((p, idx) => {
              const showLabel =
                dailyChartData.length <= 7 ||
                idx === 0 ||
                idx === dailyChartData.length - 1 ||
                idx % 3 === 0;
              const isSelected = activeDayPoint?.day === p.day;
              return (
                <Pressable
                  key={`ax-${p.day}`}
                  style={styles.chartAxisTap}
                  onPress={() => {
                    soundService.play("click");
                    setSelectedDayIndex(idx);
                  }}
                >
                  <Text
                    style={[
                      styles.chartAxisText,
                      isSelected && styles.chartAxisTextActive,
                    ]}
                    numberOfLines={1}
                  >
                    {showLabel || isSelected ? p.label : "·"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Selected Day Breakdown Strip */}
        {activeDayPoint ? (
          <View style={styles.dayInspector}>
            <Text style={styles.dayInspectorDate}>{activeDayPoint.label}</Text>
            <View style={styles.dayInspectorPills}>
              <Text style={[styles.dayMetricTag, { color: isDark ? "#38BDF8" : "#0284C7" }]}>
                {activeDayPoint.views} views
              </Text>
              <Text style={[styles.dayMetricTag, { color: "#8B5CF6" }]}>
                {activeDayPoint.clicks} clicks
              </Text>
              <Text style={[styles.dayMetricTag, { color: "#10B981" }]}>
                {activeDayPoint.joins} joins
              </Text>
              <Text style={[styles.dayMetricTag, { color: "#EF4444" }]}>
                {activeDayPoint.departures} leaves
              </Text>
            </View>
          </View>
        ) : null}
      </View>
    );
  };

  const renderFunnelCard = () => {
    const base = Math.max(reportTotals.views, reportTotals.joins, 1);
    const ctr = reportTotals.views
      ? Math.round((reportTotals.clicks / reportTotals.views) * 100)
      : 0;
    const joinRate = reportTotals.views
      ? Math.round((reportTotals.joins / reportTotals.views) * 100)
      : 0;
    const retention = reportTotals.joins
      ? Math.round((reportTotals.active / reportTotals.joins) * 100)
      : 0;

    const stages = [
      {
        label: "Landing Page Views",
        count: reportTotals.views,
        pct: Math.round((reportTotals.views / base) * 100),
        tag: "100% base",
        color: isDark ? "#38BDF8" : "#0284C7",
      },
      {
        label: "Telegram Button Clicks",
        count: reportTotals.clicks,
        pct: Math.round((reportTotals.clicks / base) * 100),
        tag: `${ctr}% CTR`,
        color: "#8B5CF6",
      },
      {
        label: "Verified Channel Joins",
        count: reportTotals.joins,
        pct: Math.round((reportTotals.joins / base) * 100),
        tag: `${joinRate}% conv`,
        color: "#10B981",
      },
      {
        label: "Active Retained Members",
        count: reportTotals.active,
        pct: Math.round((reportTotals.active / base) * 100),
        tag: reportTotals.joins ? `${retention}% kept` : "0% kept",
        color: "#4F46E5",
      },
    ];

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <HugeiconsIcon
              icon={ShieldCheckIcon}
              size={17}
              color="#10B981"
              strokeWidth={2}
            />
            <Text style={styles.sectionTitle}>Conversion Funnel</Text>
          </View>
          {reportTotals.leaves > 0 ? (
            <View style={styles.leavePillBadge}>
              <Text style={styles.leavePillBadgeText}>
                {reportTotals.leaves} left
              </Text>
            </View>
          ) : (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>0 churn</Text>
            </View>
          )}
        </View>

        <View style={styles.funnelList}>
          {stages.map((st) => (
            <View key={st.label} style={styles.funnelItem}>
              <View style={styles.funnelTopRow}>
                <Text style={styles.funnelLabel}>{st.label}</Text>
                <View style={styles.funnelRightMeta}>
                  <Text style={styles.funnelTag}>{st.tag}</Text>
                  <Text style={styles.funnelCount}>{st.count}</Text>
                </View>
              </View>
              <View style={styles.funnelTrack}>
                <View
                  style={[
                    styles.funnelFill,
                    {
                      width: `${Math.max(st.count > 0 ? 6 : 0, Math.min(100, st.pct))}%`,
                      backgroundColor: st.color,
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderMetaSpendCard = () => {
    const costPerJoin =
      financeReady && reportTotals.joins > 0
        ? formatMoney(metaSpend / reportTotals.joins)
        : "—";
    const costPerActive =
      financeReady && reportTotals.active > 0
        ? formatMoney(metaSpend / reportTotals.active)
        : "—";
    const joinToClickRatio =
      report?.first_party_complete !== false && reportTotals.clicks > 0
        ? `${((reportTotals.joins / reportTotals.clicks) * 100).toFixed(1)}%`
        : "—";

    return (
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <View style={styles.metaIconWrap}>
              <HugeiconsIcon
                icon={CreditCardIcon}
                size={16}
                color="#7C3AED"
                strokeWidth={2}
              />
            </View>
            <View>
              <Text style={styles.sectionTitle}>Meta Ads Spend & ROI</Text>
              <Text style={styles.chartSub}>
                {currentRange.from} → {currentRange.to} · {timezone}
              </Text>
            </View>
          </View>
          <View
            style={financeReady ? styles.verifiedBadge : styles.pendingBadge}
          >
            <Text
              style={
                financeReady
                  ? styles.verifiedBadgeText
                  : styles.pendingBadgeText
              }
            >
              {financeReady ? "Synced" : metaAccounts.length > 0 ? "Map & Sync" : "Not Connected"}
            </Text>
          </View>
        </View>

        <View style={styles.kpiGrid}>
          {[
            {
              label: "Meta Ad Spend",
              value: financeReady ? formatMoney(metaSpend) : "Unavailable",
              color: "#7C3AED",
            },
            {
              label: "Meta Link Clicks",
              value: financeReady
                ? metaLinkClicks.toLocaleString("en-IN")
                : "—",
              color: isDark ? "#38BDF8" : "#0284C7",
            },
            {
              label: "Cost / Join",
              value: costPerJoin,
              color: "#10B981",
            },
            {
              label: "Cost / Active",
              value: costPerActive,
              color: "#F59E0B",
            },
            {
              label: "Join-to-Click",
              value: joinToClickRatio,
              color: "#4F46E5",
            },
            {
              label: "Pending Req",
              value: reportTotals.pending,
              color: colors.textSecondary,
            },
          ].map((item) => (
            <View key={item.label} style={styles.kpiCard}>
              <Text style={styles.kpiLabel}>{item.label}</Text>
              <Text
                style={[styles.kpiValueSmall, { color: item.color }]}
                numberOfLines={1}
              >
                {item.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.metaHintBox}>
          <Text style={styles.metaHintText}>
            {financeReady
              ? "Meta-reported spend for the selected dates divided by verified acquisitions or currently active members in that cohort."
              : "Connect Meta reporting, map each tracking campaign to its numeric Meta Campaign ID, and sync dates. Currency & timezone must match across selected campaigns."}
          </Text>
        </View>

        <View style={styles.metaCardActionRow}>
          <Pressable
            style={styles.ghostBtn}
            onPress={() => {
              soundService.play("click");
              setMetaSetupExpanded((prev) => !prev);
            }}
          >
            <Text style={styles.ghostBtnText}>
              {metaSetupExpanded
                ? "Hide Meta Setup"
                : metaAccounts.length > 0
                  ? "Manage & Map Meta"
                  : "Connect Meta Reporting"}
            </Text>
          </Pressable>

          {metaAccounts.length > 0 ? (
            <Pressable
              style={[
                styles.primaryBtnSmall,
                busyKey.startsWith("sync-meta-") && { opacity: 0.7 },
              ]}
              disabled={!!busyKey}
              onPress={() => void handleSyncMetaAccount(metaAccounts[0].id)}
            >
              <Text style={styles.primaryBtnSmallText}>
                {busyKey.startsWith("sync-meta-")
                  ? "Syncing..."
                  : "Sync Selected Dates"}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    );
  };

  const renderMetaReportingPanel = () => (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionHeaderLeft}>
          <HugeiconsIcon
            icon={Megaphone01Icon}
            size={18}
            color="#7C3AED"
            strokeWidth={2}
          />
          <Text style={styles.sectionTitle}>Meta Ads Reporting</Text>
        </View>
        <Text style={styles.countPill}>{metaAccounts.length} connected</Text>
      </View>

      <Text style={styles.sectionDesc}>
        Connect an authorized read-only Marketing API reporting token for your ad account. The token is encrypted server-side.
      </Text>

      <View style={styles.formStack}>
        <Text style={styles.inputLabel}>Meta Ad Account ID</Text>
        <TextInput
          value={metaAdAccountId}
          onChangeText={setMetaAdAccountId}
          placeholder="act_123456789"
          placeholderTextColor={colors.inputPlaceholder}
          autoCapitalize="none"
          style={styles.input}
        />

        <Text style={styles.inputLabel}>Authorized Reporting Access Token</Text>
        <TextInput
          value={metaAccessToken}
          onChangeText={setMetaAccessToken}
          placeholder="Paste Meta Marketing API token (ads_read)"
          placeholderTextColor={colors.inputPlaceholder}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
        />

        <Pressable
          style={[
            styles.primaryBtn,
            (busyKey === "connect-meta" || !!busyKey) && { opacity: 0.7 },
          ]}
          disabled={!!busyKey}
          onPress={() => void handleConnectMeta()}
        >
          <Text style={styles.primaryBtnText}>
            {busyKey === "connect-meta"
              ? "Connecting Meta Account..."
              : "Connect Meta Reporting"}
          </Text>
        </Pressable>
      </View>

      {metaAccounts.length > 0 && (
        <View style={[styles.listStack, { marginTop: 6 }]}>
          <Text style={styles.subHeading}>Connected Ad Accounts</Text>
          {metaAccounts.map((acc) => {
            const syncing = busyKey === `sync-meta-${acc.id}`;
            return (
              <View key={acc.id} style={styles.itemCard}>
                <View style={styles.titleBadgeRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {acc.name}
                  </Text>
                  <View
                    style={
                      acc.status === "connected"
                        ? styles.verifiedBadge
                        : styles.pendingBadge
                    }
                  >
                    <Text
                      style={
                        acc.status === "connected"
                          ? styles.verifiedBadgeText
                          : styles.pendingBadgeText
                      }
                    >
                      {acc.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemMeta}>
                  {acc.account_id} · {acc.currency} · {acc.timezone}
                </Text>
                <Text style={styles.itemUrl}>
                  Last sync:{" "}
                  {acc.last_synced_at
                    ? new Date(acc.last_synced_at).toLocaleString("en-IN", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Not synced yet"}
                </Text>
                {acc.last_error_code ? (
                  <Text style={styles.warnText}>
                    Sync error: {acc.last_error_code}. Reconnect token or retry sync.
                  </Text>
                ) : null}
                <Pressable
                  style={[styles.ghostBtn, syncing && { opacity: 0.7 }]}
                  disabled={!!busyKey}
                  onPress={() => void handleSyncMetaAccount(acc.id)}
                >
                  <Text style={styles.ghostBtnText}>
                    {syncing
                      ? "Syncing Dates..."
                      : `Sync ${currentRange.from} to ${currentRange.to}`}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>
      )}

      {metaAccounts.length > 0 && inventory.campaigns.length > 0 && (
        <View style={[styles.formStack, { marginTop: 8 }]}>
          <Text style={styles.subHeading}>Map an Advertising Campaign</Text>
          <Text style={styles.sectionDesc}>
            Each Meta campaign can map to one tracking campaign so ad spend isn&apos;t duplicated.
          </Text>

          <Text style={styles.inputLabel}>Tracking Campaign</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {inventory.campaigns.map((camp) => {
              const active = mapTrackingCampaignId === camp.id;
              return (
                <Pressable
                  key={camp.id}
                  onPress={() => setMapTrackingCampaignId(camp.id)}
                  style={[
                    styles.selectChip,
                    active && styles.selectChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      active && styles.selectChipTextActive,
                    ]}
                  >
                    {camp.name}
                    {camp.meta_campaign_id ? ` (#${camp.meta_campaign_id})` : ""}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>Meta Ad Account</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {metaAccounts.map((acc) => {
              const active = mapMetaAccountId === acc.id;
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => setMapMetaAccountId(acc.id)}
                  style={[
                    styles.selectChip,
                    active && styles.selectChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      active && styles.selectChipTextActive,
                    ]}
                  >
                    {acc.name} ({acc.currency})
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.inputLabel}>Meta Campaign ID</Text>
          <TextInput
            value={mapMetaCampaignId}
            onChangeText={setMapMetaCampaignId}
            placeholder="Numeric Meta campaign ID (e.g. 120214567890123)"
            placeholderTextColor={colors.inputPlaceholder}
            keyboardType="number-pad"
            style={styles.input}
          />

          <Pressable
            style={[
              styles.primaryBtn,
              busyKey === "map-meta" && { opacity: 0.7 },
            ]}
            disabled={!!busyKey}
            onPress={() => void handleMapMetaCampaign()}
          >
            <Text style={styles.primaryBtnText}>
              {busyKey === "map-meta"
                ? "Saving Mapping..."
                : "Save Campaign Mapping"}
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );

  const renderCampaignCard = (c: TrackingCampaign) => {
    const site = inventory.sites.find((s) => s.id === c.site_id);
    const conn = inventory.connections.find((ch) => ch.id === c.connection_id);
    const perf = report?.campaigns.find((r) => r.id === c.id);
    const metaPerf = metaReport.find((m) => m.campaign_id === c.id);
    const campaignUrl = site ? `${site.url}?gap_campaign=${c.public_key}` : "";
    const isExternal = Boolean(site && !site.landing_page_id);
    const showInstall = expandedInstallMap[c.id] === true;
    const buttonHtml = `<a href="${c.invite_link || c.original_telegram_url}"\n   data-gap-telegram="join-community">Join Telegram</a>`;

    return (
      <View key={c.id} style={styles.campaignCard}>
        {/* Header Strip */}
        <View style={styles.campaignHeaderRow}>
          <View
            style={[
              styles.campaignIconWrap,
              isExternal && styles.campaignIconWrapExt,
            ]}
          >
            <HugeiconsIcon
              icon={isExternal ? BrowserIcon : TelegramIcon}
              size={17}
              color={isExternal ? "#6366F1" : isDark ? "#38BDF8" : "#0284C7"}
              strokeWidth={2}
            />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.itemTitle} numberOfLines={1}>
              {c.name}
            </Text>
            <Text style={styles.itemUrl} numberOfLines={1}>
              {site?.name || "Unknown page"} · {conn?.title || "Telegram channel"}
              {c.meta_campaign_id ? ` · Meta #${c.meta_campaign_id}` : ""}
            </Text>
          </View>
          <View
            style={
              c.status === "active"
                ? styles.verifiedBadge
                : c.status === "paused"
                  ? styles.pendingBadge
                  : styles.unverifiedBadge
            }
          >
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    c.status === "active"
                      ? "#10B981"
                      : c.status === "paused"
                        ? "#F59E0B"
                        : "#94A3B8",
                },
              ]}
            />
            <Text
              style={
                c.status === "active"
                  ? styles.verifiedBadgeText
                  : c.status === "paused"
                    ? styles.pendingBadgeText
                    : styles.unverifiedBadgeText
              }
            >
              {c.status}
            </Text>
          </View>
        </View>

        {/* Tinted 5-Metric Strip */}
        {perf && (
          <View style={styles.campaignMetricsStrip}>
            {[
              { label: "Views", val: perf.views, tint: isDark ? "rgba(56,189,248,0.12)" : "#F0F9FF", color: isDark ? "#38BDF8" : "#0284C7" },
              { label: "Clicks", val: perf.clicks, tint: isDark ? "rgba(139,92,246,0.14)" : "#F5F3FF", color: "#7C3AED" },
              { label: "Joins", val: perf.acquisitions, tint: isDark ? "rgba(16,185,129,0.14)" : "#ECFDF5", color: "#059669" },
              { label: "Active", val: perf.active, tint: isDark ? "rgba(99,102,241,0.14)" : "#EEF2FF", color: "#4F46E5" },
              { label: "Leaves", val: perf.leave_events, tint: isDark ? "rgba(239,68,68,0.14)" : "#FEF2F2", color: isDark ? "#FCA5A5" : "#DC2626" },
            ].map((m) => (
              <View
                key={m.label}
                style={[styles.campaignMetricPill, { backgroundColor: m.tint }]}
              >
                <Text style={[styles.campaignMetricVal, { color: m.color }]}>
                  {m.val}
                </Text>
                <Text style={styles.campaignMetricLbl}>{m.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Per-campaign Meta Ad Spend & Clicks strip when synced */}
        {metaPerf && metaPerf.status === "connected" && (
          <View style={styles.campaignMetaRow}>
            <Text style={styles.campaignMetaText}>
              Meta Spend:{" "}
              <Text style={styles.campaignMetaStrong}>
                {formatMoney(Number(metaPerf.spend || 0), metaPerf.currency)}
              </Text>
            </Text>
            <Text style={styles.campaignMetaText}>
              Meta Clicks:{" "}
              <Text style={styles.campaignMetaStrong}>
                {Number(metaPerf.link_clicks || 0).toLocaleString("en-IN")}
              </Text>
            </Text>
            {perf && perf.acquisitions > 0 ? (
              <Text style={styles.campaignMetaText}>
                CPJ:{" "}
                <Text style={styles.campaignMetaStrong}>
                  {formatMoney(
                    Number(metaPerf.spend || 0) / perf.acquisitions,
                    metaPerf.currency,
                  )}
                </Text>
              </Text>
            ) : null}
          </View>
        )}

        {/* Stylish Link Cards */}
        <View style={styles.linkCardsStack}>
          {/* 1. Ad / Bio Tracking Link */}
          {campaignUrl ? (
            <View style={styles.linkCardAds}>
              <View style={styles.linkCardTop}>
                <View style={styles.linkBadgeAds}>
                  <HugeiconsIcon
                    icon={Link01Icon}
                    size={11}
                    color={isDark ? "#7DD3FC" : "#0369A1"}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.linkBadgeAdsText}>
                    Ad & Bio Tracking URL
                  </Text>
                </View>
                <View style={styles.linkBtnGroup}>
                  <Pressable
                    style={styles.linkIconBtn}
                    onPress={() => Linking.openURL(campaignUrl).catch(() => {})}
                  >
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={13}
                      color={colors.text}
                      strokeWidth={2.1}
                    />
                  </Pressable>
                  <Pressable
                    style={[
                      styles.copyPillAds,
                      copiedKey === `url-${c.id}` && styles.copyPillDone,
                    ]}
                    onPress={() =>
                      void handleCopy(
                        `url-${c.id}`,
                        campaignUrl,
                        "Campaign tracking URL",
                      )
                    }
                  >
                    <HugeiconsIcon
                      icon={copiedKey === `url-${c.id}` ? CheckmarkCircle01Icon : Copy01Icon}
                      size={12}
                      color="#FFFFFF"
                      strokeWidth={2.2}
                    />
                    <Text style={styles.copyPillText}>
                      {copiedKey === `url-${c.id}` ? "Copied" : "Copy URL"}
                    </Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.linkCardHint}>
                Use this link in your Meta/Google Ads or bio
              </Text>
              <View style={styles.linkUrlPill}>
                <Text style={styles.linkUrlText} numberOfLines={2} selectable>
                  {campaignUrl}
                </Text>
              </View>
            </View>
          ) : null}

          {/* 2. Tracked Telegram Invite Link */}
          {c.invite_link ? (
            <View style={styles.linkCardInvite}>
              <View style={styles.linkCardTop}>
                <View style={styles.linkBadgeInvite}>
                  <HugeiconsIcon
                    icon={TelegramIcon}
                    size={11}
                    color={isDark ? "#6EE7B7" : "#047857"}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.linkBadgeInviteText}>
                    Join Button Invite Link
                  </Text>
                </View>
                <Pressable
                  style={[
                    styles.copyPillInvite,
                    copiedKey === `inv-${c.id}` && styles.copyPillDone,
                  ]}
                  onPress={() =>
                    void handleCopy(
                      `inv-${c.id}`,
                      c.invite_link!,
                      "Telegram invite link",
                    )
                  }
                >
                  <HugeiconsIcon
                    icon={copiedKey === `inv-${c.id}` ? CheckmarkCircle01Icon : Copy01Icon}
                    size={12}
                    color="#FFFFFF"
                    strokeWidth={2.2}
                  />
                  <Text style={styles.copyPillText}>
                    {copiedKey === `inv-${c.id}` ? "Copied" : "Copy Invite"}
                  </Text>
                </Pressable>
              </View>
              <Text style={styles.linkCardHint}>
                Paste inside your landing page's Join Telegram button
              </Text>
              <View style={styles.linkUrlPill}>
                <Text style={styles.linkUrlText} numberOfLines={1} selectable>
                  {c.invite_link}
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.linkCardWarn}>
              <Text style={styles.warnText}>
                Generate a unique Telegram invite link to start counting joins.
              </Text>
              {c.status !== "archived" ? (
                <Pressable
                  style={[
                    styles.primaryBtnSmall,
                    { alignSelf: "flex-start" },
                    busyKey === `act-${c.id}` && { opacity: 0.7 },
                  ]}
                  disabled={!!busyKey}
                  onPress={() =>
                    void runAction(
                      `act-${c.id}`,
                      "activate",
                      { id: c.id },
                      "Campaign Activated",
                      "Unique Telegram invite link generated and active.",
                    )
                  }
                >
                  <Text style={styles.primaryBtnSmallText}>
                    Activate & Generate Invite
                  </Text>
                </Pressable>
              ) : null}
            </View>
          )}
        </View>

        {/* Collapsible Script & Button HTML Drawer */}
        {showInstall && (
          <View style={styles.terminalBox}>
            <View style={styles.codeBoxHeader}>
              <Text style={styles.terminalLabel}>
                {isExternal
                  ? "Website Measurement Script (Required)"
                  : "Measurement Script"}
              </Text>
              <Pressable
                style={styles.terminalCopyBtn}
                onPress={() =>
                  void handleCopy(
                    `script-${c.id}`,
                    buildInstallSnippet(c.public_key),
                    "Installation script",
                  )
                }
              >
                <Text style={styles.terminalCopyText}>
                  {copiedKey === `script-${c.id}` ? "✓ Copied" : "Copy Script"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.terminalCode} selectable>
              {buildInstallSnippet(c.public_key)}
            </Text>

            <View style={[styles.codeBoxHeader, { marginTop: 10 }]}>
              <Text style={styles.terminalLabel}>Telegram Button HTML</Text>
              <Pressable
                style={styles.terminalCopyBtn}
                onPress={() =>
                  void handleCopy(`btn-${c.id}`, buttonHtml, "Button HTML")
                }
              >
                <Text style={styles.terminalCopyText}>
                  {copiedKey === `btn-${c.id}` ? "✓ Copied" : "Copy Button"}
                </Text>
              </Pressable>
            </View>
            <Text style={styles.terminalCode} selectable>
              {buttonHtml}
            </Text>
          </View>
        )}

        {/* Footer Actions */}
        <View style={styles.itemActions}>
          {c.status !== "archived" &&
            (c.status === "active" ? (
              <Pressable
                style={styles.ghostBtn}
                disabled={!!busyKey}
                onPress={() =>
                  void runAction(
                    `pause-${c.id}`,
                    "pause",
                    { id: c.id },
                    "Campaign Paused",
                    "Tracking paused while keeping the invite active.",
                  )
                }
              >
                <Text style={styles.ghostBtnText}>Pause</Text>
              </Pressable>
            ) : (
              <Pressable
                style={[
                  styles.primaryBtnSmall,
                  busyKey === `act-${c.id}` && { opacity: 0.7 },
                ]}
                disabled={!!busyKey}
                onPress={() =>
                  void runAction(
                    `act-${c.id}`,
                    "activate",
                    { id: c.id },
                    "Campaign Activated",
                    "Unique Telegram invite link generated and active.",
                  )
                }
              >
                <Text style={styles.primaryBtnSmallText}>
                  {c.invite_link ? "Resume" : "Activate & Get Link"}
                </Text>
              </Pressable>
            ))}

          <Pressable
            style={styles.ghostBtn}
            onPress={() =>
              setExpandedInstallMap((prev) => ({
                ...prev,
                [c.id]: !showInstall,
              }))
            }
          >
            <Text style={styles.ghostBtnText}>
              {showInstall
                ? "Hide Script"
                : isExternal
                  ? "Setup Script"
                  : "Script & HTML"}
            </Text>
          </Pressable>

          {c.status !== "archived" && (
            <Pressable
              style={styles.dangerBtnSmall}
              disabled={!!busyKey}
              onPress={() =>
                confirmAction(
                  "Archive Campaign",
                  `Archive "${c.name}"? Historical metrics are preserved.`,
                  () => {
                    void runAction(
                      `arch-${c.id}`,
                      "archive",
                      { id: c.id },
                      "Campaign Archived",
                      "Historical tracking records are preserved.",
                    );
                  },
                )
              }
            >
              <Text style={styles.dangerBtnSmallText}>Archive</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Telegram Conversion" showBack={true} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={{ flex: 1, backgroundColor: colors.background }}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                void loadData(false);
              }}
              tintColor={colors.primary}
            />
          }
        >
        {/* Top Hero Banner */}
        {/* Top Hero Banner - Graphical & Minimal Text */}
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <View style={styles.heroIconWrap}>
                <HugeiconsIcon
                  icon={TelegramIcon}
                  size={20}
                  color={isDark ? "#38BDF8" : "#0284C7"}
                  strokeWidth={2}
                />
              </View>
              <View>
                <Text style={styles.heroTitle}>Telegram Conversions</Text>
                <Text style={styles.heroSubtitle}>Track verified joins & ad spend ROI</Text>
              </View>
            </View>
            <View style={styles.advancedBadge}>
              <Text style={styles.advancedBadgeText}>PRO</Text>
            </View>
          </View>

          {/* Graphic Feature Badges */}
          <View style={styles.heroPillRow}>
            <View style={styles.heroFeaturePill}>
              <HugeiconsIcon
                icon={Rocket01Icon}
                size={11}
                color={isDark ? "#38BDF8" : "#0284C7"}
                strokeWidth={2}
              />
              <Text style={styles.heroFeaturePillText}>Auto-Track</Text>
            </View>
            <View style={styles.heroFeaturePill}>
              <HugeiconsIcon
                icon={ShieldCheckIcon}
                size={11}
                color="#059669"
                strokeWidth={2}
              />
              <Text style={styles.heroFeaturePillText}>Verified Joins</Text>
            </View>
            <View style={styles.heroFeaturePill}>
              <HugeiconsIcon
                icon={Activity01Icon}
                size={11}
                color="#7C3AED"
                strokeWidth={2}
              />
              <Text style={styles.heroFeaturePillText}>Real-Time ROI</Text>
            </View>
          </View>
        </View>

        {/* Segmented Tabs */}
        <View style={styles.segmentRow}>
          {(["setup", "analytics"] as const).map((tabKey) => {
            const active = activeTab === tabKey;
            return (
              <Pressable
                key={tabKey}
                onPress={() => {
                  soundService.play("click");
                  setActiveTab(tabKey);
                }}
                style={[styles.segmentBtn, active && styles.segmentBtnActive]}
              >
                <HugeiconsIcon
                  icon={tabKey === "setup" ? Layout01Icon : Activity01Icon}
                  size={14}
                  color={active ? colors.text : colors.textSecondary}
                  strokeWidth={2}
                />
                <Text
                  style={[
                    styles.segmentBtnText,
                    active && styles.segmentBtnTextActive,
                    { marginLeft: 6 },
                  ]}
                >
                  {tabKey === "setup" ? "Setup Wizard" : "Analytics"}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {errorMsg ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              {errorMsg.toLowerCase().includes("sign in") ? (
                <Pressable
                  onPress={async () => {
                    await useAuthStore.getState().logout();
                    router.replace("/(auth)/login" as any);
                  }}
                >
                  <Text style={styles.errorRetry}>Sign In</Text>
                </Pressable>
              ) : null}
              <Pressable onPress={() => void loadData(true)}>
                <Text style={styles.errorRetry}>Retry</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : activeTab === "setup" ? (
          <>
            {/* ═══════════════════════════════════════════════════════════════════════
                STEP PROGRESS TRACKER (Interactive 3-Step Wizard Flow)
                ═══════════════════════════════════════════════════════════════════════ */}
            <View style={styles.stepTrackerCard}>
              <View style={styles.stepTrackerHeader}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberBadgeText}>{setupStep}/3</Text>
                  </View>
                  <Text style={styles.stepTrackerMainTitle}>
                    {setupStep === 1
                      ? "Connect Channel"
                      : setupStep === 2
                        ? "Choose Destination"
                        : "Launch Campaign"}
                  </Text>
                </View>

                {/* Graphical mini progress dots */}
                <View style={styles.stepDotsRow}>
                  {[1, 2, 3].map((s) => (
                    <View
                      key={s}
                      style={[
                        styles.stepDot,
                        setupStep === s
                          ? styles.stepDotActive
                          : setupStep > s
                            ? styles.stepDotDone
                            : styles.stepDotPending,
                      ]}
                    />
                  ))}
                </View>
              </View>

              <View style={styles.stepTrackerRow}>
                {/* Step 1 Pill */}
                <Pressable
                  style={[
                    styles.stepTabItem,
                    setupStep === 1 && styles.stepTabItemActive,
                  ]}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(1);
                  }}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      step1Done && styles.stepCircleDone,
                      setupStep === 1 && styles.stepCircleActive,
                    ]}
                  >
                    {step1Done ? (
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>✓</Text>
                    ) : (
                      <Text
                        style={[
                          styles.stepCircleNum,
                          setupStep === 1 && styles.stepCircleNumActive,
                        ]}
                      >
                        1
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        styles.stepItemTitle,
                        setupStep === 1 && styles.stepItemTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      Channel
                    </Text>
                    <Text
                      style={[
                        styles.stepItemSub,
                        step1Done && styles.stepItemSubDone,
                      ]}
                      numberOfLines={1}
                    >
                      {step1Done ? "Connected" : "Step 1"}
                    </Text>
                  </View>
                </Pressable>

                <View
                  style={[
                    styles.stepDivider,
                    (setupStep > 1 || step1Done) && styles.stepDividerActive,
                  ]}
                />

                {/* Step 2 Pill */}
                <Pressable
                  style={[
                    styles.stepTabItem,
                    setupStep === 2 && styles.stepTabItemActive,
                  ]}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(2);
                  }}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      step2Done && styles.stepCircleDone,
                      setupStep === 2 && styles.stepCircleActive,
                    ]}
                  >
                    {step2Done ? (
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>✓</Text>
                    ) : (
                      <Text
                        style={[
                          styles.stepCircleNum,
                          setupStep === 2 && styles.stepCircleNumActive,
                        ]}
                      >
                        2
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        styles.stepItemTitle,
                        setupStep === 2 && styles.stepItemTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      Website
                    </Text>
                    <Text
                      style={[
                        styles.stepItemSub,
                        step2Done && styles.stepItemSubDone,
                      ]}
                      numberOfLines={1}
                    >
                      {step2Done ? "Verified" : "Step 2"}
                    </Text>
                  </View>
                </Pressable>

                <View
                  style={[
                    styles.stepDivider,
                    (setupStep > 2 || step2Done) && styles.stepDividerActive,
                  ]}
                />

                {/* Step 3 Pill */}
                <Pressable
                  style={[
                    styles.stepTabItem,
                    setupStep === 3 && styles.stepTabItemActive,
                  ]}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(3);
                  }}
                >
                  <View
                    style={[
                      styles.stepCircle,
                      step3Done && styles.stepCircleDone,
                      setupStep === 3 && styles.stepCircleActive,
                    ]}
                  >
                    {step3Done ? (
                      <Text style={{ color: "#FFFFFF", fontSize: 11, fontWeight: "800" }}>✓</Text>
                    ) : (
                      <Text
                        style={[
                          styles.stepCircleNum,
                          setupStep === 3 && styles.stepCircleNumActive,
                        ]}
                      >
                        3
                      </Text>
                    )}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[
                        styles.stepItemTitle,
                        setupStep === 3 && styles.stepItemTitleActive,
                      ]}
                      numberOfLines={1}
                    >
                      Campaign
                    </Text>
                    <Text
                      style={[
                        styles.stepItemSub,
                        step3Done && styles.stepItemSubDone,
                      ]}
                      numberOfLines={1}
                    >
                      {step3Done ? "Active" : "Step 3"}
                    </Text>
                  </View>
                </Pressable>
              </View>
            </View>

            {/* ═══════════════════════════════════════════════════════════════════════
                STEP 1: CONNECT TELEGRAM CHANNEL
                ═══════════════════════════════════════════════════════════════════════ */}
            {setupStep === 1 && (
              <View style={styles.sectionCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>STEP 1</Text>
                </View>
                {inventory.connections.length > 0 ? (
                  <View style={styles.verifiedBadge}>
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={12}
                      color="#047857"
                      strokeWidth={2.2}
                    />
                    <Text style={styles.verifiedBadgeText}>Channel Connected</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Action Required</Text>
                  </View>
                )}
              </View>

              <View style={styles.sectionHeaderLeft}>
                <View style={styles.stepIconWrap}>
                  <HugeiconsIcon
                    icon={TelegramIcon}
                    size={20}
                    color={isDark ? "#38BDF8" : "#0284C7"}
                    strokeWidth={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Connect Channel</Text>
                  <Text style={styles.sectionDesc}>
                    Link your Telegram account & target channel
                  </Text>
                </View>
              </View>

              {/* Graphic Setup Pipeline */}
              <View style={styles.pipelineBar}>
                <View style={[styles.pipelineStep, inventory.telegram.identity ? styles.pipelineStepActive : null]}>
                  <HugeiconsIcon
                    icon={UserIcon}
                    size={12}
                    color={inventory.telegram.identity ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.pipelineStepText, inventory.telegram.identity ? styles.pipelineStepTextActive : null]}>
                    Account
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>›</Text>
                <View style={[styles.pipelineStep, inventory.telegram.is_admin ? styles.pipelineStepActive : null]}>
                  <HugeiconsIcon
                    icon={ShieldCheckIcon}
                    size={12}
                    color={inventory.telegram.is_admin ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.pipelineStepText, inventory.telegram.is_admin ? styles.pipelineStepTextActive : null]}>
                    Bot Admin
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: colors.textSecondary }}>›</Text>
                <View style={[styles.pipelineStep, inventory.connections.length > 0 ? styles.pipelineStepActive : null]}>
                  <HugeiconsIcon
                    icon={Megaphone01Icon}
                    size={12}
                    color={inventory.connections.length > 0 ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary}
                    strokeWidth={2}
                  />
                  <Text style={[styles.pipelineStepText, inventory.connections.length > 0 ? styles.pipelineStepTextActive : null]}>
                    Channel
                  </Text>
                </View>
              </View>

              {/* Telegram Account Identity Box */}
              {inventory.telegram.identity ? (
                <View style={styles.identityCard}>
                  <View style={styles.titleBadgeRow}>
                    <View style={styles.identityAvatarWrap}>
                      <HugeiconsIcon icon={UserIcon} size={16} color={colors.primary} strokeWidth={2} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.identityTitle} numberOfLines={1}>
                        {inventory.telegram.identity.display_name}
                      </Text>
                      <View style={styles.verifiedChip}>
                        <HugeiconsIcon icon={CheckmarkCircle01Icon} size={11} color="#059669" strokeWidth={2.2} />
                        <Text style={styles.verifiedChipText}>Verified Account</Text>
                      </View>
                    </View>
                    <Pressable
                      style={styles.dangerBtnSmall}
                      disabled={!!busyKey}
                      onPress={handleDisconnectTelegramAccount}
                    >
                      <Text style={styles.dangerBtnSmallText}>Disconnect</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <View style={styles.formStack}>
                  {!inventory.telegram.configured ? (
                    <Text style={styles.warnText}>
                      Platform tracking bot not configured yet.
                    </Text>
                  ) : null}
                  <Pressable
                    style={[
                      styles.primaryBtn,
                      (!inventory.telegram.configured || busyKey === "tg-link") && {
                        opacity: 0.6,
                      },
                    ]}
                    disabled={!inventory.telegram.configured || !!busyKey}
                    onPress={() => void handleLinkTelegramAccount()}
                  >
                    {busyKey === "tg-link" ? (
                      <ActivityIndicator
                        size="small"
                        color={colors.primaryForeground}
                      />
                    ) : (
                      <>
                        <HugeiconsIcon
                          icon={Link01Icon}
                          size={16}
                          color={colors.primaryForeground}
                          strokeWidth={2}
                        />
                        <Text style={styles.primaryBtnText}>
                          {activeLink
                            ? "Create Fresh Verification Link"
                            : "Link Telegram Admin Account"}
                        </Text>
                      </>
                    )}
                  </Pressable>
                </View>
              )}

              {activeLink && (
                <View style={styles.linkStepBox}>
                  <Text style={styles.linkStepText}>
                    {inventory.telegram.identity
                      ? "Tap Choose my channel inside Telegram bot and grant Invite users permission."
                      : "Press Start in Telegram bot, then return here to confirm your account."}
                  </Text>
                  <Pressable
                    style={styles.ghostBtn}
                    onPress={() => Linking.openURL(activeLink.url).catch(() => { })}
                  >
                    <Text style={styles.ghostBtnText}>
                      Open @{inventory.telegram.bot_username}
                    </Text>
                    <HugeiconsIcon
                      icon={ArrowUpRight01Icon}
                      size={13}
                      color={colors.text}
                      strokeWidth={2}
                    />
                  </Pressable>
                </View>
              )}

              {linkClaimed && (
                <View style={styles.confirmCard}>
                  <Text style={styles.confirmTitle}>
                    Confirm this Telegram account
                  </Text>
                  <Text style={styles.identityMeta}>
                    {inventory.telegram.link?.display_name} · ID{" "}
                    {inventory.telegram.link?.claimed_user_id}
                  </Text>
                  <Pressable
                    style={[styles.primaryBtn, { marginTop: 10 }]}
                    disabled={!!busyKey}
                    onPress={() => void handleConfirmTelegramAccount()}
                  >
                    <Text style={styles.primaryBtnText}>Confirm Account</Text>
                  </Pressable>
                </View>
              )}

              {/* Bot Mode Tabs with Graphics */}
              <View style={[styles.segmentRow, { marginTop: 8 }]}>
                {(["shared", "own"] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setBotMode(m)}
                    style={[
                      styles.segmentBtn,
                      botMode === m && styles.segmentBtnActive,
                    ]}
                  >
                    <HugeiconsIcon
                      icon={m === "shared" ? Rocket01Icon : ShieldCheckIcon}
                      size={13}
                      color={botMode === m ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        botMode === m && styles.segmentBtnTextActive,
                        { marginLeft: 5 },
                      ]}
                    >
                      {m === "shared" ? "Instant Shared Bot" : "Dedicated Bot"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {botMode === "shared" && inventory.telegram.identity ? (
                <View style={styles.formStack}>
                  <View style={styles.channelsBlock}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.inputLabel}>
                        Available Channels ({availableChannels.length})
                      </Text>
                      <Pressable onPress={() => void loadData(false)}>
                        <Text style={styles.errorRetry}>Refresh</Text>
                      </Pressable>
                    </View>

                    {availableChannels.length > 0 ? (
                      <>
                        <Pressable
                          style={styles.dropdownTrigger}
                          onPress={() => {
                            soundService.play("click");
                            setChannelSearch("");
                            setChannelDropdownOpen(true);
                          }}
                        >
                          <View style={styles.dropdownIconBox}>
                            <HugeiconsIcon icon={TelegramIcon} size={15} color={colors.primary} strokeWidth={2} />
                          </View>
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.dropdownLabel}>
                              Telegram Channel
                            </Text>
                            <Text style={styles.dropdownValue} numberOfLines={1}>
                              {selectedAvailableChannel
                                ? selectedAvailableChannel.title
                                : "Choose a channel..."}
                            </Text>
                          </View>
                          {selectedAvailableChannel?.connection_id ? (
                            <View style={styles.verifiedBadge}>
                              <HugeiconsIcon
                                icon={CheckmarkCircle01Icon}
                                size={12}
                                color="#047857"
                                strokeWidth={2.2}
                              />
                              <Text style={styles.verifiedBadgeText}>
                                Connected
                              </Text>
                            </View>
                          ) : (
                            <View style={styles.unverifiedBadge}>
                              <Text style={styles.unverifiedBadgeText}>
                                Not connected
                              </Text>
                            </View>
                          )}
                          <Text style={styles.dropdownChevron}>▾</Text>
                        </Pressable>

                        {selectedAvailableChannel ? (
                          <View style={styles.itemCard}>
                            <View style={styles.titleBadgeRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {selectedAvailableChannel.title}
                              </Text>
                              {selectedAvailableChannel.connection_id ? (
                                <View style={styles.verifiedBadge}>
                                  <HugeiconsIcon
                                    icon={CheckmarkCircle01Icon}
                                    size={12}
                                    color="#047857"
                                    strokeWidth={2.2}
                                  />
                                  <Text style={styles.verifiedBadgeText}>
                                    {selectedAvailableChannel.connection_status ||
                                      "Connected"}
                                  </Text>
                                </View>
                              ) : (
                                <View style={styles.unverifiedBadge}>
                                  <Text style={styles.unverifiedBadgeText}>
                                    Not connected
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.itemMeta} numberOfLines={1}>
                              {selectedAvailableChannel.username
                                ? `@${selectedAvailableChannel.username.replace(/^@/, "")} · `
                                : ""}
                              ID: {selectedAvailableChannel.chat_id}
                            </Text>
                            {!selectedAvailableChannel.connection_id &&
                              inventory.telegram.bot_username ? (
                              <Text style={styles.itemMeta}>
                                Make @{inventory.telegram.bot_username} admin with
                                Invite users permission, then tap Connect Channel.
                              </Text>
                            ) : null}
                            <View style={styles.itemActions}>
                              {selectedAvailableChannel.connection_id ? (
                                <Pressable
                                  style={styles.outlineBtnSmall}
                                  onPress={() => {
                                    setSelectedConnectionId(
                                      selectedAvailableChannel.connection_id!,
                                    );
                                    showNotice(
                                      "Channel Selected",
                                      `${selectedAvailableChannel.title} selected for campaign creation in Step 3.`,
                                    );
                                  }}
                                >
                                  <Text style={styles.outlineBtnSmallText}>
                                    Use in Campaign
                                  </Text>
                                </Pressable>
                              ) : (
                                <Pressable
                                  style={[
                                    styles.primaryBtnSmall,
                                    busyKey ===
                                    `ch-${selectedAvailableChannel.chat_id}` && {
                                      opacity: 0.7,
                                    },
                                  ]}
                                  disabled={!!busyKey}
                                  onPress={() =>
                                    void runAction(
                                      `ch-${selectedAvailableChannel.chat_id}`,
                                      "connect_shared",
                                      {
                                        chat_id:
                                          selectedAvailableChannel.chat_id,
                                      },
                                      "Channel Connected",
                                      `${selectedAvailableChannel.title} is now connected.`,
                                    ).then((saved) => {
                                      if (saved?.id) {
                                        setSelectedConnectionId(saved.id);
                                      }
                                    })
                                  }
                                >
                                  <Text style={styles.primaryBtnSmallText}>
                                    Connect Channel
                                  </Text>
                                </Pressable>
                              )}
                            </View>
                          </View>
                        ) : null}
                      </>
                    ) : (
                      <View style={styles.emptyGraphicBox}>
                        <HugeiconsIcon icon={Megaphone01Icon} size={24} color={colors.primary} strokeWidth={1.8} />
                        <Text style={styles.emptyGraphicTitle}>No Synced Channels</Text>
                        <Text style={styles.emptyGraphicSub}>Select a channel via Telegram or add manually</Text>
                      </View>
                    )}
                  </View>

                  <Pressable
                    style={styles.secondaryBtn}
                    disabled={!inventory.telegram.configured || !!busyKey}
                    onPress={() => void handleOpenChannelPicker()}
                  >
                    <Text style={styles.secondaryBtnText}>
                      Choose Channel in Telegram
                    </Text>
                  </Pressable>

                  {/* Accordion for Manual Channel Entry */}
                  <View style={styles.accordionWrap}>
                    <Pressable
                      style={styles.accordionHeader}
                      onPress={() => {
                        soundService.play("click");
                        setManualAccordionOpen((prev) => !prev);
                      }}
                    >
                      <View style={styles.accordionHeaderLeft}>
                        <View style={styles.accordionIconBox}>
                          <HugeiconsIcon
                            icon={Edit02Icon}
                            size={15}
                            color={colors.primary}
                            strokeWidth={2}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.accordionTitle}>
                            Enter Channel Manually
                          </Text>
                          <Text style={styles.accordionSubtitle}>
                            Add via @username or Chat ID if not listed
                          </Text>
                        </View>
                      </View>
                      <View style={styles.accordionChevronBox}>
                        <Text style={{ fontSize: 13, fontWeight: "700", color: colors.textSecondary }}>
                          {manualAccordionOpen ? "▴" : "▾"}
                        </Text>
                      </View>
                    </Pressable>

                    {manualAccordionOpen && (
                      <View style={styles.accordionBody}>
                        <Text style={styles.accordionDesc}>
                          Make sure @{inventory.telegram.bot_username || "the tracking bot"} is added as an admin with Invite users permission in your channel, then enter your channel username or chat ID below.
                        </Text>

                        <Text style={styles.inputLabel}>
                          Channel Username or Chat ID
                        </Text>
                        <TextInput
                          value={manualChannel}
                          onChangeText={setManualChannel}
                          placeholder="@yourchannel or -1001234567890"
                          placeholderTextColor={colors.inputPlaceholder}
                          autoCapitalize="none"
                          style={styles.input}
                        />
                        <Pressable
                          style={[
                            styles.outlineBtn,
                            (!manualChannel.trim() || !!busyKey) && { opacity: 0.6 },
                          ]}
                          disabled={!manualChannel.trim() || !!busyKey}
                          onPress={() => void handleConnectManualChannel()}
                        >
                          {busyKey === "tg-bind" ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                          ) : (
                            <Text style={styles.outlineBtnText}>
                              Verify & Connect Channel
                            </Text>
                          )}
                        </Pressable>
                      </View>
                    )}
                  </View>
                </View>
              ) : null}

              {botMode === "own" ? (
                <View style={styles.formStack}>
                  <Text style={styles.inputLabel}>Dedicated Bot Token</Text>
                  <TextInput
                    value={ownBotToken}
                    onChangeText={setOwnBotToken}
                    placeholder="123456:ABC-DEF..."
                    placeholderTextColor={colors.inputPlaceholder}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <Text style={styles.inputLabel}>Channel Username or ID</Text>
                  <TextInput
                    value={ownChatId}
                    onChangeText={setOwnChatId}
                    placeholder="@yourchannel or -100..."
                    placeholderTextColor={colors.inputPlaceholder}
                    autoCapitalize="none"
                    style={styles.input}
                  />
                  <Pressable
                    style={[
                      styles.primaryBtn,
                      (!inventory.telegram.identity || !!busyKey) && {
                        opacity: 0.6,
                      },
                    ]}
                    disabled={!inventory.telegram.identity || !!busyKey}
                    onPress={() => void handleConnectOwnBot()}
                  >
                    <Text style={styles.primaryBtnText}>
                      Verify & Connect Own Bot
                    </Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Connected Channels List */}
              {inventory.connections.length > 0 && (
                <View style={[styles.listStack, { marginTop: 12 }]}>
                  <Text style={styles.subHeading}>Connected Channels</Text>
                  {inventory.connections.map((conn) => (
                    <View key={conn.id} style={styles.itemCard}>
                      <View style={styles.titleBadgeRow}>
                        <Text style={styles.itemTitle} numberOfLines={1}>
                          {conn.title}
                        </Text>
                        <View
                          style={
                            conn.status === "healthy"
                              ? styles.verifiedBadge
                              : styles.pendingBadge
                          }
                        >
                          <Text
                            style={
                              conn.status === "healthy"
                                ? styles.verifiedBadgeText
                                : styles.pendingBadgeText
                            }
                          >
                            {conn.status}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.itemMeta}>
                        @{conn.bot_username} ·{" "}
                        {conn.bot_mode === "shared"
                          ? "GetAiPilot bot"
                          : "Own bot"}
                      </Text>
                      <View style={styles.itemActions}>
                        <Pressable
                          style={styles.ghostBtn}
                          disabled={!!busyKey}
                          onPress={() =>
                            void runAction(
                              `health-${conn.id}`,
                              "health",
                              { id: conn.id },
                              "Connection Check",
                            )
                          }
                        >
                          <Text style={styles.ghostBtnText}>Check Health</Text>
                        </Pressable>
                        <Pressable
                          style={styles.dangerBtnSmall}
                          disabled={!!busyKey}
                          onPress={() =>
                            handleDisconnectConnection(conn.id, conn.title)
                          }
                        >
                          <Text style={styles.dangerBtnSmallText}>
                            Disconnect
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Step 1 Completion Feedback */}
              {inventory.connections.length > 0 ? (
                <View style={styles.completionBanner}>
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={16}
                    color="#047857"
                    strokeWidth={2.2}
                  />
                  <Text style={styles.completionBannerText}>
                    Connected: {inventory.connections[0].title}
                  </Text>
                </View>
              ) : null}

              <View style={styles.wizardActionBox}>
                <Pressable
                  style={styles.wizardNextBtn}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(2);
                  }}
                >
                  <Text style={styles.wizardNextBtnText}>
                    Next: Choose Destination
                  </Text>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={17}
                    color="#FFFFFF"
                    strokeWidth={2.4}
                  />
                </Pressable>
              </View>
            </View>
          )}

            {/* ═══════════════════════════════════════════════════════════════════════
                STEP 2: CONNECT WEBSITE / LANDING PAGE (INTERNAL vs EXTERNAL)
                ═══════════════════════════════════════════════════════════════════════ */}
            {setupStep === 2 && (
              <View style={styles.sectionCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>STEP 2</Text>
                </View>
                {verifiedSites.length > 0 ? (
                  <View style={styles.verifiedBadge}>
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={12}
                      color="#047857"
                      strokeWidth={2.2}
                    />
                    <Text style={styles.verifiedBadgeText}>Website Verified</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Action Required</Text>
                  </View>
                )}
              </View>

              <View style={styles.sectionHeaderLeft}>
                <View style={styles.stepIconWrap}>
                  <HugeiconsIcon
                    icon={BrowserIcon}
                    size={20}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Destination Page</Text>
                  <Text style={styles.sectionDesc}>
                    Select where incoming traffic lands
                  </Text>
                </View>
              </View>

              {/* TWO TYPES SELECTOR CARDS: INTERNAL vs EXTERNAL */}
              <View style={styles.typeSelectorGrid}>
                {/* Internal Option */}
                <Pressable
                  style={[
                    styles.typeCard,
                    websiteType === "internal" && styles.typeCardActive,
                  ]}
                  onPress={() => {
                    soundService.play("click");
                    setWebsiteType("internal");
                  }}
                >
                  <View style={styles.typeCardTop}>
                    <View
                      style={[
                        styles.typeIconBox,
                        websiteType === "internal" && styles.typeIconBoxActive,
                      ]}
                    >
                      <HugeiconsIcon
                        icon={Rocket01Icon}
                        size={18}
                        color={websiteType === "internal" ? colors.primary : colors.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.typeTagInternal}>
                      <Text style={styles.typeTagInternalText}>Instant</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.typeCardTitle,
                      websiteType === "internal" && styles.typeCardTitleActive,
                    ]}
                  >
                    Internal Funnel
                  </Text>
                  <Text style={styles.typeCardDesc}>
                    GetAiPilot Funnels & Bio Pages.
                  </Text>
                  <View style={styles.featurePillRow}>
                    <View style={styles.microPill}>
                      <HugeiconsIcon icon={Rocket01Icon} size={9} color="#059669" strokeWidth={2} />
                      <Text style={styles.microPillText}>Zero DNS</Text>
                    </View>
                    <View style={styles.microPill}>
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={9} color="#059669" strokeWidth={2} />
                      <Text style={styles.microPillText}>Auto-Track</Text>
                    </View>
                  </View>
                  <View style={styles.typeRadioRow}>
                    <View
                      style={[
                        styles.typeRadioCircle,
                        websiteType === "internal" && styles.typeRadioCircleActive,
                      ]}
                    >
                      {websiteType === "internal" && <View style={styles.typeRadioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.typeRadioText,
                        websiteType === "internal" && styles.typeRadioTextActive,
                      ]}
                    >
                      {templates.length > 0 ? `${templates.length} Available` : "Create Template"}
                    </Text>
                  </View>
                </Pressable>

                {/* External Option */}
                <Pressable
                  style={[
                    styles.typeCard,
                    websiteType === "external" && styles.typeCardActive,
                  ]}
                  onPress={() => {
                    soundService.play("click");
                    setWebsiteType("external");
                  }}
                >
                  <View style={styles.typeCardTop}>
                    <View
                      style={[
                        styles.typeIconBox,
                        websiteType === "external" && styles.typeIconBoxActive,
                      ]}
                    >
                      <HugeiconsIcon
                        icon={BrowserIcon}
                        size={18}
                        color={websiteType === "external" ? colors.primary : colors.textSecondary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.typeTagExternal}>
                      <Text style={styles.typeTagExternalText}>Custom</Text>
                    </View>
                  </View>
                  <Text
                    style={[
                      styles.typeCardTitle,
                      websiteType === "external" && styles.typeCardTitleActive,
                    ]}
                  >
                    External Website
                  </Text>
                  <Text style={styles.typeCardDesc}>
                    Shopify, WordPress, Webflow.
                  </Text>
                  <View style={styles.featurePillRow}>
                    <View style={styles.microPill}>
                      <HugeiconsIcon icon={BrowserIcon} size={9} color="#0284C7" strokeWidth={2} />
                      <Text style={styles.microPillText}>Any Site</Text>
                    </View>
                    <View style={styles.microPill}>
                      <HugeiconsIcon icon={Link01Icon} size={9} color="#0284C7" strokeWidth={2} />
                      <Text style={styles.microPillText}>Snippet</Text>
                    </View>
                  </View>
                  <View style={styles.typeRadioRow}>
                    <View
                      style={[
                        styles.typeRadioCircle,
                        websiteType === "external" && styles.typeRadioCircleActive,
                      ]}
                    >
                      {websiteType === "external" && <View style={styles.typeRadioDot} />}
                    </View>
                    <Text
                      style={[
                        styles.typeRadioText,
                        websiteType === "external" && styles.typeRadioTextActive,
                      ]}
                    >
                      {externalSites.length > 0 ? `${externalSites.length} Added` : "Add Domain"}
                    </Text>
                  </View>
                </Pressable>
              </View>

              {/* ─────────────────────────────────────────────────────────────────
                  INTERNAL MODE: GETAIPILOT CREATED DESIGNS
                  ───────────────────────────────────────────────────────────────── */}
              {websiteType === "internal" ? (
                <View style={styles.modeSection}>
                  <View style={styles.modeHeaderBar}>
                    <View style={styles.modeIndicatorInternal} />
                    <Text style={styles.modeHeaderTitle}>Internal Template</Text>
                    <Text style={styles.countPill}>{templates.length}</Text>
                  </View>

                  {/* IF USER HAS NO TEMPLATES: CLEARLY INFORM LANDING TEMPLATE REQUIRED */}
                  {templates.length === 0 ? (
                    <View style={styles.noticeBoxGraphic}>
                      <View style={styles.noticeIconCircle}>
                        <HugeiconsIcon
                          icon={Rocket01Icon}
                          size={22}
                          color="#D97706"
                          strokeWidth={2}
                        />
                      </View>
                      <Text style={styles.noticeGraphicTitle}>
                        No Landing Funnels Yet
                      </Text>
                      <Text style={styles.noticeGraphicSub}>
                        Create a landing template or connect your external website
                      </Text>
                      <View style={styles.noticeActionsGraphic}>
                        <Pressable
                          style={styles.primaryBtnSmall}
                          onPress={() => router.push("/tools/landing-templates" as any)}
                        >
                          <HugeiconsIcon icon={Add01Icon} size={14} color="#FFFFFF" strokeWidth={2} />
                          <Text style={styles.primaryBtnSmallText}>
                            Create Funnel
                          </Text>
                        </Pressable>
                        <Pressable
                          style={styles.outlineBtnSmall}
                          onPress={() => {
                            soundService.play("click");
                            setWebsiteType("external");
                          }}
                        >
                          <HugeiconsIcon icon={BrowserIcon} size={13} color={colors.text} strokeWidth={2} />
                          <Text style={styles.outlineBtnSmallText}>
                            Use External Site
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <>
                      {/* Dropdown Trigger */}
                      <Pressable
                        style={styles.dropdownTrigger}
                        onPress={() => {
                          soundService.play("click");
                          setDesignSearch("");
                          setDropdownOpen(true);
                        }}
                      >
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text style={styles.dropdownLabel}>
                            Select Internal Template
                          </Text>
                          <Text style={styles.dropdownValue} numberOfLines={1}>
                            {selectedDesign
                              ? `${selectedDesign.page_title} (${selectedDesign.design_type === "bio"
                                ? "Bio"
                                : "Landing"
                              })`
                              : "Choose an internal design..."}
                          </Text>
                        </View>
                        {selectedDesign ? (
                          findSiteForDesign(selectedDesign)?.verified_at ? (
                            <View style={styles.verifiedBadge}>
                              <HugeiconsIcon
                                icon={CheckmarkCircle01Icon}
                                size={12}
                                color="#047857"
                                strokeWidth={2.2}
                              />
                              <Text style={styles.verifiedBadgeText}>Verified</Text>
                            </View>
                          ) : (
                            <View style={styles.unverifiedBadge}>
                              <Text style={styles.unverifiedBadgeText}>
                                Unverified
                              </Text>
                            </View>
                          )
                        ) : null}
                        <Text style={styles.dropdownChevron}>▾</Text>
                      </Pressable>

                      {/* Selected Design Card */}
                      {selectedDesign
                        ? (() => {
                          const page = selectedDesign;
                          const connectedSite = findSiteForDesign(page);
                          const isVerified = Boolean(connectedSite?.verified_at);
                          const isBusy = busyKey === `tpl-${page.id}`;
                          const designUrl = getDesignUrl(page);

                          return (
                            <View style={styles.itemCard}>
                              <View style={styles.itemRow}>
                                {page.image_url ? (
                                  <Image
                                    source={{ uri: page.image_url }}
                                    style={styles.thumb}
                                    resizeMode="cover"
                                  />
                                ) : (
                                  <View style={styles.thumbFallback}>
                                    <HugeiconsIcon
                                      icon={Rocket01Icon}
                                      size={18}
                                      color={colors.primary}
                                      strokeWidth={1.9}
                                    />
                                  </View>
                                )}

                                <View style={{ flex: 1, minWidth: 0 }}>
                                  <View style={styles.titleBadgeRow}>
                                    <Text style={styles.itemTitle} numberOfLines={1}>
                                      {page.page_title}
                                    </Text>
                                    {isVerified ? (
                                      <View style={styles.verifiedBadge}>
                                        <HugeiconsIcon
                                          icon={CheckmarkCircle01Icon}
                                          size={12}
                                          color="#047857"
                                          strokeWidth={2.2}
                                        />
                                        <Text style={styles.verifiedBadgeText}>
                                          Verified
                                        </Text>
                                      </View>
                                    ) : (
                                      <View style={styles.unverifiedBadge}>
                                        <Text style={styles.unverifiedBadgeText}>
                                          Unverified
                                        </Text>
                                      </View>
                                    )}
                                  </View>
                                  <Text style={styles.itemUrl} numberOfLines={1}>
                                    {designUrl}
                                  </Text>
                                  {normalizeTelegramDestination(page.telegram_url) ? (
                                    <Text style={styles.itemMeta} numberOfLines={1}>
                                      Target: {normalizeTelegramDestination(page.telegram_url)}
                                    </Text>
                                  ) : null}
                                </View>
                              </View>

                              <View style={styles.itemActions}>
                                <Pressable
                                  style={styles.ghostBtn}
                                  onPress={() =>
                                    Linking.openURL(designUrl).catch(() => { })
                                  }
                                >
                                  <Text style={styles.ghostBtnText}>Open Page</Text>
                                  <HugeiconsIcon
                                    icon={ArrowUpRight01Icon}
                                    size={13}
                                    color={colors.text}
                                    strokeWidth={2}
                                  />
                                </Pressable>

                                {!isVerified ? (
                                  <Pressable
                                    style={[
                                      styles.primaryBtnSmall,
                                      isBusy && { opacity: 0.7 },
                                    ]}
                                    disabled={!!busyKey}
                                    onPress={() => void handleConnectTemplate(page)}
                                  >
                                    {isBusy ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={colors.primaryForeground}
                                      />
                                    ) : (
                                      <Text style={styles.primaryBtnSmallText}>
                                        Verify & Connect (Instant)
                                      </Text>
                                    )}
                                  </Pressable>
                                ) : (
                                  <>
                                    <Pressable
                                      style={styles.outlineBtnSmall}
                                      onPress={() => {
                                        if (connectedSite) {
                                          setSelectedSiteId(connectedSite.id);
                                          const cleanTarget =
                                            normalizeTelegramDestination(
                                              page.telegram_url,
                                            );
                                          if (cleanTarget) {
                                            setOriginalTelegramUrl(cleanTarget);
                                          }
                                          showNotice(
                                            "Design Selected",
                                            `${page.page_title} selected for Step 3 Campaign creation below.`,
                                          );
                                        }
                                      }}
                                    >
                                      <Text style={styles.outlineBtnSmallText}>
                                        Use in Campaign
                                      </Text>
                                    </Pressable>
                                    {connectedSite ? (
                                      <Pressable
                                        style={styles.dangerBtnSmall}
                                        disabled={!!busyKey}
                                        onPress={() =>
                                          handleDisconnectSite(
                                            connectedSite.id,
                                            page.page_title,
                                          )
                                        }
                                      >
                                        <Text style={styles.dangerBtnSmallText}>
                                          Disconnect
                                        </Text>
                                      </Pressable>
                                    ) : null}
                                  </>
                                )}
                              </View>
                            </View>
                          );
                        })()
                        : null}
                    </>
                  )}
                </View>
              ) : null}

              {/* ─────────────────────────────────────────────────────────────────
                  EXTERNAL MODE: CUSTOM DOMAIN & DNS TXT VERIFICATION
                  ───────────────────────────────────────────────────────────────── */}
              {websiteType === "external" ? (
                <View style={styles.modeSection}>
                  <View style={styles.modeHeaderBar}>
                    <View style={styles.modeIndicatorExternal} />
                    <Text style={styles.modeHeaderTitle}>External Custom Domain</Text>
                    <Text style={styles.countPill}>{externalSites.length}</Text>
                  </View>

                  <Text style={styles.sectionDesc}>
                    Add your existing website URL. You will receive a DNS TXT verification token to confirm ownership.
                  </Text>

                  <View style={styles.formStack}>
                    <Text style={styles.inputLabel}>Website / Page Name</Text>
                    <TextInput
                      value={siteName}
                      onChangeText={setSiteName}
                      placeholder="e.g. My WordPress / Shopify Landing"
                      placeholderTextColor={colors.inputPlaceholder}
                      style={styles.input}
                    />

                    <Text style={styles.inputLabel}>Published HTTPS URL</Text>
                    <TextInput
                      value={siteUrl}
                      onChangeText={setSiteUrl}
                      placeholder="https://yourdomain.com/landing"
                      placeholderTextColor={colors.inputPlaceholder}
                      autoCapitalize="none"
                      keyboardType="url"
                      style={styles.input}
                    />

                    <Pressable
                      style={[
                        styles.primaryBtn,
                        busyKey === "add-site" && { opacity: 0.7 },
                      ]}
                      disabled={!!busyKey}
                      onPress={() => void handleAddWebsite()}
                    >
                      {busyKey === "add-site" ? (
                        <ActivityIndicator size="small" color={colors.primaryForeground} />
                      ) : (
                        <>
                          <HugeiconsIcon
                            icon={Add01Icon}
                            size={16}
                            color={colors.primaryForeground}
                            strokeWidth={2.2}
                          />
                          <Text style={styles.primaryBtnText}>Add External Website</Text>
                        </>
                      )}
                    </Pressable>
                  </View>

                  {/* List of External Sites */}
                  {externalSites.length > 0 && (
                    <View style={[styles.listStack, { marginTop: 14 }]}>
                      <Text style={styles.subHeading}>Your External Websites</Text>
                      {externalSites.map((site) => {
                        const isVerified = Boolean(site.verified_at);
                        let host = "";
                        try {
                          host = new URL(site.url).hostname;
                        } catch { }
                        const txtName = host ? `_getaipilot.${host}` : "_getaipilot";
                        const txtValue = `getaipilot-verification=${site.verification_token}`;
                        const verifying = busyKey === `verify-${site.id}`;

                        return (
                          <View key={site.id} style={styles.itemCard}>
                            <View style={styles.titleBadgeRow}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {site.name}
                              </Text>
                              {isVerified ? (
                                <View style={styles.verifiedBadge}>
                                  <HugeiconsIcon
                                    icon={CheckmarkCircle01Icon}
                                    size={12}
                                    color="#047857"
                                    strokeWidth={2.2}
                                  />
                                  <Text style={styles.verifiedBadgeText}>Verified</Text>
                                </View>
                              ) : (
                                <View style={styles.pendingBadge}>
                                  <Text style={styles.pendingBadgeText}>
                                    DNS Required
                                  </Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.itemUrl} numberOfLines={1}>
                              {site.url}
                            </Text>

                            {!isVerified ? (
                              <View style={styles.dnsBox}>
                                <Text style={styles.dnsLabel}>1. Add DNS TXT Record Name</Text>
                                <Text style={styles.dnsCode} selectable>
                                  {txtName}
                                </Text>
                                <Text style={[styles.dnsLabel, { marginTop: 6 }]}>
                                  2. Add DNS TXT Record Value
                                </Text>
                                <Text style={styles.dnsCode} selectable>
                                  {txtValue}
                                </Text>

                                <View style={styles.itemActions}>
                                  <Pressable
                                    style={styles.ghostBtn}
                                    onPress={() =>
                                      void handleCopy(
                                        `dns-${site.id}`,
                                        txtValue,
                                        "TXT record value",
                                      )
                                    }
                                  >
                                    <HugeiconsIcon
                                      icon={Copy01Icon}
                                      size={13}
                                      color={colors.text}
                                      strokeWidth={2}
                                    />
                                    <Text style={styles.ghostBtnText}>
                                      {copiedKey === `dns-${site.id}`
                                        ? "Copied"
                                        : "Copy TXT"}
                                    </Text>
                                  </Pressable>

                                  <Pressable
                                    style={[
                                      styles.primaryBtnSmall,
                                      verifying && { opacity: 0.7 },
                                    ]}
                                    disabled={!!busyKey}
                                    onPress={() => void handleVerifyExternalSite(site.id)}
                                  >
                                    {verifying ? (
                                      <ActivityIndicator
                                        size="small"
                                        color={colors.primaryForeground}
                                      />
                                    ) : (
                                      <Text style={styles.primaryBtnSmallText}>
                                        Verify DNS
                                      </Text>
                                    )}
                                  </Pressable>

                                  <Pressable
                                    style={styles.dangerBtnSmall}
                                    disabled={!!busyKey}
                                    onPress={() =>
                                      handleDisconnectSite(site.id, site.name)
                                    }
                                  >
                                    <Text style={styles.dangerBtnSmallText}>
                                      Disconnect
                                    </Text>
                                  </Pressable>
                                </View>
                              </View>
                            ) : (
                              <View style={styles.itemActions}>
                                <Pressable
                                  style={styles.outlineBtnSmall}
                                  onPress={() => {
                                    setSelectedSiteId(site.id);
                                    showNotice(
                                      "Website Selected",
                                      `${site.name} selected for Step 3 Campaign creation below.`,
                                    );
                                  }}
                                >
                                  <Text style={styles.outlineBtnSmallText}>
                                    Use in Campaign
                                  </Text>
                                </Pressable>
                                <Pressable
                                  style={styles.dangerBtnSmall}
                                  disabled={!!busyKey}
                                  onPress={() =>
                                    handleDisconnectSite(site.id, site.name)
                                  }
                                >
                                  <Text style={styles.dangerBtnSmallText}>
                                    Disconnect
                                  </Text>
                                </Pressable>
                              </View>
                            )}
                          </View>
                        );
                      })}
                    </View>
                  )}
                </View>
              ) : null}

              {/* Step 2 Completion Banner */}
              {verifiedSites.length > 0 ? (
                <View style={styles.completionBanner}>
                  <HugeiconsIcon
                    icon={CheckmarkCircle01Icon}
                    size={16}
                    color="#047857"
                    strokeWidth={2.2}
                  />
                  <Text style={styles.completionBannerText}>
                    Ready: {selectedSite?.name || `${verifiedSites.length} verified page(s)`}
                  </Text>
                </View>
              ) : null}

              <View style={styles.wizardNavRow}>
                <Pressable
                  style={styles.wizardBackBtn}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(1);
                  }}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={16} color={colors.text} strokeWidth={2} />
                  <Text style={styles.wizardBackBtnText}>Back</Text>
                </Pressable>

                <Pressable
                  style={styles.wizardNextBtnFlex}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(3);
                  }}
                >
                  <Text style={styles.wizardNextBtnText}>Next: Launch Campaign</Text>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={17}
                    color="#FFFFFF"
                    strokeWidth={2.4}
                  />
                </Pressable>
              </View>
            </View>
          )}

            {/* ═══════════════════════════════════════════════════════════════════════
                STEP 3: CREATE TRACKING CAMPAIGN
                ═══════════════════════════════════════════════════════════════════════ */}
            {setupStep === 3 && (
              <>
              <View style={styles.sectionCard}>
              <View style={styles.stepHeaderRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepBadgeText}>STEP 3</Text>
                </View>
                {inventory.campaigns.length > 0 ? (
                  <View style={styles.verifiedBadge}>
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={12}
                      color="#047857"
                      strokeWidth={2.2}
                    />
                    <Text style={styles.verifiedBadgeText}>
                      {inventory.campaigns.length} Active
                    </Text>
                  </View>
                ) : (
                  <View style={styles.unverifiedBadge}>
                    <Text style={styles.unverifiedBadgeText}>Launch</Text>
                  </View>
                )}
              </View>

              <View style={styles.sectionHeaderLeft}>
                <View style={styles.stepIconWrap}>
                  <HugeiconsIcon
                    icon={Link01Icon}
                    size={20}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.sectionTitle}>Campaign Launch</Text>
                  <Text style={styles.sectionDesc}>
                    Pair channel & landing page to track conversions
                  </Text>
                </View>
              </View>

              {/* Graphic Flow Map of Selections */}
              <View style={styles.graphicFlowCard}>
                <View style={styles.flowNode}>
                  <View style={styles.flowIconBoxTg}>
                    <HugeiconsIcon icon={TelegramIcon} size={16} color="#0284C7" strokeWidth={2} />
                  </View>
                  <Text style={styles.flowNodeTitle} numberOfLines={1}>
                    {selectedConnection ? selectedConnection.title : "Channel"}
                  </Text>
                  <View style={selectedConnection ? styles.flowBadgeOk : styles.flowBadgeWait}>
                    <Text style={selectedConnection ? styles.flowBadgeOkText : styles.flowBadgeWaitText}>
                      {selectedConnection ? "Ready" : "Step 1"}
                    </Text>
                  </View>
                </View>

                {/* Graphical Connector */}
                <View style={styles.flowConnector}>
                  <View style={styles.flowLine} />
                  <View style={styles.flowConnectorBadge}>
                    <HugeiconsIcon icon={Link01Icon} size={11} color="#FFFFFF" strokeWidth={2.2} />
                  </View>
                  <View style={styles.flowLine} />
                </View>

                <View style={styles.flowNode}>
                  <View style={styles.flowIconBoxWeb}>
                    <HugeiconsIcon icon={BrowserIcon} size={16} color="#10B981" strokeWidth={2} />
                  </View>
                  <Text style={styles.flowNodeTitle} numberOfLines={1}>
                    {selectedSite ? selectedSite.name : "Destination"}
                  </Text>
                  <View style={selectedSite ? styles.flowBadgeOk : styles.flowBadgeWait}>
                    <Text style={selectedSite ? styles.flowBadgeOkText : styles.flowBadgeWaitText}>
                      {selectedSite ? "Ready" : "Step 2"}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.formStack}>
                <Text style={styles.inputLabel}>Campaign Name</Text>
                <TextInput
                  value={campaignName}
                  onChangeText={setCampaignName}
                  placeholder="e.g. VIP Member Launch Campaign"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Select Verified Page / Website</Text>
                {verifiedSites.length === 0 ? (
                  <Text style={styles.warnText}>
                    Please verify an internal template or external website in Step 2 above first.
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {verifiedSites.map((s) => {
                      const active = selectedSiteId === s.id;
                      const isInternal = Boolean(s.landing_page_id || s.bio_page_id);
                      return (
                        <Pressable
                          key={s.id}
                          onPress={() => setSelectedSiteId(s.id)}
                          style={[
                            styles.selectChip,
                            active && styles.selectChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              active && styles.selectChipTextActive,
                            ]}
                          >
                            {s.name} ({isInternal ? "Internal" : "External"})
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                <Text style={styles.inputLabel}>Select Telegram Channel</Text>
                {inventory.connections.length === 0 ? (
                  <Text style={styles.warnText}>
                    Please connect a Telegram channel in Step 1 above first.
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {inventory.connections.map((c) => {
                      const active = selectedConnectionId === c.id;
                      return (
                        <Pressable
                          key={c.id}
                          onPress={() => setSelectedConnectionId(c.id)}
                          style={[
                            styles.selectChip,
                            active && styles.selectChipActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.selectChipText,
                              active && styles.selectChipTextActive,
                            ]}
                          >
                            {c.title}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                <Text style={styles.inputLabel}>Current Telegram Button URL</Text>
                <TextInput
                  value={originalTelegramUrl}
                  onChangeText={setOriginalTelegramUrl}
                  placeholder="https://t.me/yourchannel or https://t.me/+invite"
                  placeholderTextColor={colors.inputPlaceholder}
                  autoCapitalize="none"
                  keyboardType="url"
                  style={styles.input}
                />

                <View style={styles.switchRow}>
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={styles.switchLabel}>Require join approval</Text>
                    <Text style={styles.switchHint}>
                      Join requests count separately until approved.
                    </Text>
                  </View>
                  <Switch
                    value={joinRequest}
                    onValueChange={setJoinRequest}
                    trackColor={{ false: colors.border, true: colors.primary }}
                  />
                </View>

                <Pressable
                  style={[
                    styles.primaryBtn,
                    (!verifiedSites.length ||
                      !inventory.connections.length ||
                      !campaignName.trim() ||
                      !originalTelegramUrl.trim() ||
                      !!busyKey) && { opacity: 0.6 },
                  ]}
                  disabled={
                    !verifiedSites.length ||
                    !inventory.connections.length ||
                    !campaignName.trim() ||
                    !originalTelegramUrl.trim() ||
                    !!busyKey
                  }
                  onPress={() => void handleCreateCampaign()}
                >
                  <Text style={styles.primaryBtnText}>
                    {busyKey === "create-campaign"
                      ? "Creating & Generating Link..."
                      : "Create Campaign & Get Link"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.wizardBackBtnCenter}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(2);
                  }}
                >
                  <HugeiconsIcon icon={ArrowLeft01Icon} size={15} color={colors.textSecondary} strokeWidth={2} />
                  <Text style={styles.wizardBackBtnCenterText}>
                    Back to Step 2 (Destination)
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* 5. CAMPAIGNS & TRACKING LINKS (VISIBLE RIGHT AFTER CREATION) */}
            {inventory.campaigns.length > 0 && (
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionHeaderLeft}>
                    <HugeiconsIcon
                      icon={Activity01Icon}
                      size={18}
                      color={colors.primary}
                      strokeWidth={2}
                    />
                    <Text style={styles.sectionTitle}>
                      Campaigns & Tracking Links
                    </Text>
                  </View>
                  <Text style={styles.countPill}>
                    {inventory.campaigns.length}
                  </Text>
                </View>
                <Text style={styles.sectionDesc}>
                  Share the Campaign Tracking URL in your ads or bio. Every
                  click swaps to your tracked Telegram invite link and counts
                  verified channel joins.
                </Text>
                <View style={styles.listStack}>
                  {inventory.campaigns.map(renderCampaignCard)}
                </View>
              </View>
            )}

            {renderMetaReportingPanel()}
            </>
            )}

            {/* Created Designs Dropdown Modal */}
            <Modal
              visible={dropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setDropdownOpen(false)}
            >
              <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
              >
                <Pressable
                  style={styles.modalBackdrop}
                  onPress={() => setDropdownOpen(false)}
                >
                  <Pressable
                    style={styles.modalSheet}
                    onPress={(e) => e.stopPropagation()}
                  >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Select Internal Design ({templates.length})
                    </Text>
                    <Pressable
                      onPress={() => setDropdownOpen(false)}
                      hitSlop={8}
                      style={styles.modalCloseBtn}
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={16}
                        color={colors.textSecondary}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.modalSearchWrap}>
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      color={colors.textSecondary}
                      strokeWidth={1.9}
                    />
                    <TextInput
                      value={designSearch}
                      onChangeText={setDesignSearch}
                      placeholder="Search internal designs..."
                      placeholderTextColor={colors.inputPlaceholder}
                      style={styles.modalSearchInput}
                    />
                  </View>

                  <ScrollView
                    style={styles.modalList}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredDesigns.length === 0 ? (
                      <Text style={styles.modalEmptyText}>
                        No designs match "{designSearch}".
                      </Text>
                    ) : (
                      filteredDesigns.map((page) => {
                        const isSelected = selectedDesign?.id === page.id;
                        const isVerified = Boolean(
                          findSiteForDesign(page)?.verified_at,
                        );
                        return (
                          <Pressable
                            key={page.id}
                            onPress={() => {
                              soundService.play("click");
                              setSelectedDesignId(page.id);
                              setDropdownOpen(false);
                            }}
                            style={[
                              styles.modalOption,
                              isSelected && styles.modalOptionActive,
                            ]}
                          >
                            {page.image_url ? (
                              <Image
                                source={{ uri: page.image_url }}
                                style={styles.modalThumb}
                                resizeMode="cover"
                              />
                            ) : (
                              <View style={styles.modalThumbFallback}>
                                <HugeiconsIcon
                                  icon={Rocket01Icon}
                                  size={16}
                                  color={colors.primary}
                                  strokeWidth={1.9}
                                />
                              </View>
                            )}
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {page.page_title}
                              </Text>
                              <Text style={styles.itemUrl} numberOfLines={1}>
                                {page.design_type === "bio"
                                  ? "Bio Page · "
                                  : "Landing Page · "}
                                {getDesignUrl(page)}
                              </Text>
                            </View>
                            {isVerified ? (
                              <View style={styles.verifiedBadge}>
                                <HugeiconsIcon
                                  icon={CheckmarkCircle01Icon}
                                  size={11}
                                  color="#047857"
                                  strokeWidth={2.2}
                                />
                                <Text style={styles.verifiedBadgeText}>
                                  Verified
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.unverifiedBadge}>
                                <Text style={styles.unverifiedBadgeText}>
                                  Unverified
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })
                    )}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </KeyboardAvoidingView>
          </Modal>

          {/* Telegram Channels Dropdown Modal */}
          <Modal
            visible={channelDropdownOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setChannelDropdownOpen(false)}
          >
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : undefined}
              style={{ flex: 1 }}
            >
              <Pressable
                style={styles.modalBackdrop}
                onPress={() => setChannelDropdownOpen(false)}
              >
                <Pressable
                  style={styles.modalSheet}
                  onPress={(e) => e.stopPropagation()}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>
                      Select Telegram Channel ({availableChannels.length})
                    </Text>
                    <Pressable
                      onPress={() => setChannelDropdownOpen(false)}
                      hitSlop={8}
                      style={styles.modalCloseBtn}
                    >
                      <HugeiconsIcon
                        icon={Cancel01Icon}
                        size={16}
                        color={colors.textSecondary}
                        strokeWidth={2}
                      />
                    </Pressable>
                  </View>

                  <View style={styles.modalSearchWrap}>
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={16}
                      color={colors.textSecondary}
                      strokeWidth={1.9}
                    />
                    <TextInput
                      value={channelSearch}
                      onChangeText={setChannelSearch}
                      placeholder="Search channels..."
                      placeholderTextColor={colors.inputPlaceholder}
                      style={styles.modalSearchInput}
                    />
                  </View>

                  <ScrollView
                    style={styles.modalList}
                    showsVerticalScrollIndicator={false}
                  >
                    {filteredChannels.length === 0 ? (
                      <Text style={styles.modalEmptyText}>
                        No channels match "{channelSearch}".
                      </Text>
                    ) : (
                      filteredChannels.map((ch) => {
                        const isSelected =
                          selectedAvailableChannel?.chat_id === ch.chat_id;
                        return (
                          <Pressable
                            key={ch.chat_id}
                            onPress={() => {
                              soundService.play("click");
                              setSelectedAvailableChatId(ch.chat_id);
                              if (ch.connection_id) {
                                setSelectedConnectionId(ch.connection_id);
                              }
                              setChannelDropdownOpen(false);
                            }}
                            style={[
                              styles.modalOption,
                              isSelected && styles.modalOptionActive,
                            ]}
                          >
                            <View style={styles.modalThumbFallback}>
                              <HugeiconsIcon
                                icon={TelegramIcon}
                                size={16}
                                color={isDark ? "#38BDF8" : "#0284C7"}
                                strokeWidth={1.9}
                              />
                            </View>
                            <View style={{ flex: 1, minWidth: 0 }}>
                              <Text style={styles.itemTitle} numberOfLines={1}>
                                {ch.title}
                              </Text>
                              <Text style={styles.itemUrl} numberOfLines={1}>
                                {ch.username
                                  ? `@${ch.username.replace(/^@/, "")} · `
                                  : ""}
                                ID: {ch.chat_id}
                              </Text>
                            </View>
                            {ch.connection_id ? (
                              <View style={styles.verifiedBadge}>
                                <HugeiconsIcon
                                  icon={CheckmarkCircle01Icon}
                                  size={11}
                                  color="#047857"
                                  strokeWidth={2.2}
                                />
                                <Text style={styles.verifiedBadgeText}>
                                  Connected
                                </Text>
                              </View>
                            ) : (
                              <View style={styles.unverifiedBadge}>
                                <Text style={styles.unverifiedBadgeText}>
                                  Select
                                </Text>
                              </View>
                            )}
                          </Pressable>
                        );
                      })
                    )}
                  </ScrollView>
                </Pressable>
              </Pressable>
            </KeyboardAvoidingView>
          </Modal>
          </>
        ) : (
          /* ANALYTICS & CAMPAIGNS TAB */
          <>
            <View style={styles.rangeRow}>
              {([7, 30] as const).map((days) => (
                <Pressable
                  key={days}
                  onPress={() => setReportDays(days)}
                  style={[
                    styles.selectChip,
                    reportDays === days && styles.selectChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      reportDays === days && styles.selectChipTextActive,
                    ]}
                  >
                    Last {days} days
                  </Text>
                </Pressable>
              ))}
              {availableTimezones.length > 1 &&
                availableTimezones.map((tz) => (
                  <Pressable
                    key={tz}
                    onPress={() => setTimezone(tz)}
                    style={[
                      styles.selectChip,
                      timezone === tz && styles.selectChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.selectChipText,
                        timezone === tz && styles.selectChipTextActive,
                      ]}
                    >
                      {tz}
                    </Text>
                  </Pressable>
                ))}
            </View>

            {inventory.campaigns.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}
              >
                <Pressable
                  onPress={() => setSelectedCampaignFilter("")}
                  style={[
                    styles.selectChip,
                    selectedCampaignFilter === "" && styles.selectChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.selectChipText,
                      selectedCampaignFilter === "" && styles.selectChipTextActive,
                    ]}
                  >
                    All Campaigns
                  </Text>
                </Pressable>
                {inventory.campaigns.map((camp) => {
                  const active = selectedCampaignFilter === camp.id;
                  return (
                    <Pressable
                      key={camp.id}
                      onPress={() => setSelectedCampaignFilter(camp.id)}
                      style={[
                        styles.selectChip,
                        active && styles.selectChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.selectChipText,
                          active && styles.selectChipTextActive,
                        ]}
                      >
                        {camp.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}

            <View style={styles.kpiGrid}>
              {[
                { label: "Page Views", value: reportTotals.views, icon: TelescopeIcon, color: isDark ? "#38BDF8" : "#0284C7" },
                { label: "TG Clicks", value: reportTotals.clicks, icon: Link01Icon, color: "#8B5CF6" },
                { label: "Verified Joins", value: reportTotals.joins, icon: ShieldCheckIcon, color: "#10B981" },
                { label: "Active Members", value: reportTotals.active, icon: UserGroupIcon, color: "#F59E0B" },
                { label: "Channel Leaves", value: reportTotals.leaves, icon: Forward01Icon, color: isDark ? "#FCA5A5" : "#DC2626" },
                {
                  label: "Retention Rate",
                  value: reportTotals.joins
                    ? `${Math.round((reportTotals.active / reportTotals.joins) * 100)}%`
                    : "—",
                  icon: Activity01Icon,
                  color: "#10B981",
                },
              ].map((stat) => (
                <View key={stat.label} style={styles.kpiCard}>
                  <View style={styles.kpiHeaderRow}>
                    <Text style={styles.kpiLabel}>{stat.label}</Text>
                    <HugeiconsIcon icon={stat.icon} size={15} color={stat.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.kpiValue}>{stat.value}</Text>
                </View>
              ))}
            </View>

            {renderMetaSpendCard()}

            {metaSetupExpanded && renderMetaReportingPanel()}

            {renderTrendChart()}

            {renderFunnelCard()}

            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <HugeiconsIcon
                    icon={Activity01Icon}
                    size={18}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text style={styles.sectionTitle}>Campaigns & Scripts</Text>
                </View>
                <Text style={styles.countPill}>{inventory.campaigns.length}</Text>
              </View>

              {inventory.campaigns.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No campaigns created yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Switch to Pages & Setup to verify a page, connect Telegram,
                    and launch your first campaign.
                  </Text>
                </View>
              ) : (
                <View style={styles.listStack}>
                  {inventory.campaigns.map(renderCampaignCard)}
                </View>
              )}
            </View>
          </>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

const createStyles = (colors: AppColors, isDark: boolean) =>
  StyleSheet.create({
    scrollContent: {
      padding: 16,
      paddingBottom: 80,
      gap: 14,
    },
    heroCard: {
      borderRadius: 20,
      padding: 16,
      backgroundColor: isDark ? "#13212E" : "#F4FAFF",
      borderWidth: 1.25,
      borderColor: isDark
        ? "rgba(56, 189, 248, 0.34)"
        : "rgba(2, 132, 199, 0.24)",
      gap: 8,
    },
    heroTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    heroIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark
        ? "rgba(56, 189, 248, 0.16)"
        : "#E0F2FE",
    },
    advancedBadge: {
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(129, 140, 248, 0.22)" : "#EEF2FF",
    },
    advancedBadgeText: {
      fontSize: 10,
      fontWeight: "800",
      letterSpacing: 0.6,
      color: isDark ? "#A5B4FC" : "#4338CA",
    },
    heroTitle: {
      fontSize: 19,
      fontWeight: "700",
      letterSpacing: -0.3,
      color: colors.text,
    },
    heroSubtitle: {
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.textSecondary,
    },
    segmentRow: {
      flexDirection: "row",
      backgroundColor: isDark ? "#1C1A25" : "#F1F5F9",
      borderRadius: 12,
      padding: 4,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      flexDirection: "row",
      paddingVertical: 9,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
    },
    segmentBtnActive: {
      backgroundColor: isDark ? "#2A2738" : "#FFFFFF",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0.2 : 0.06,
      shadowRadius: 3,
      elevation: 1,
    },
    segmentBtnText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    segmentBtnTextActive: {
      color: colors.text,
      fontWeight: "700",
    },
    errorBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.16)" : "#FEF2F2",
      borderWidth: 1,
      borderColor: isDark ? "rgba(248, 113, 113, 0.3)" : "#FECACA",
      gap: 10,
    },
    errorText: {
      flex: 1,
      fontSize: 12,
      color: isDark ? "#FCA5A5" : "#B91C1C",
    },
    errorRetry: {
      fontSize: 12,
      fontWeight: "700",
      color: colors.primary,
    },
    loadingBox: {
      paddingVertical: 48,
      alignItems: "center",
      gap: 10,
    },
    loadingText: {
      fontSize: 13,
      color: colors.textSecondary,
    },
    sectionCard: {
      borderRadius: 18,
      padding: 15,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : colors.cardBorder,
      gap: 10,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    sectionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    sectionTitle: {
      fontSize: 15.5,
      fontWeight: "700",
      color: colors.text,
      letterSpacing: -0.2,
    },
    sectionDesc: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    countPill: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.textSecondary,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9",
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 10,
    },
    listStack: {
      gap: 10,
    },
    dropdownTrigger: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 12,
      paddingVertical: 11,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "#CBD5E1",
      backgroundColor: isDark ? "#181622" : "#FFFFFF",
    },
    dropdownLabel: {
      fontSize: 10.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    dropdownValue: {
      fontSize: 13.5,
      fontWeight: "700",
      color: colors.text,
      marginTop: 1,
    },
    dropdownChevron: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.textSecondary,
      marginLeft: 2,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.48)",
      justifyContent: "center",
      padding: 18,
    },
    modalSheet: {
      maxHeight: "76%",
      borderRadius: 20,
      padding: 16,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : colors.cardBorder,
      gap: 12,
    },
    modalHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
    },
    modalCloseBtn: {
      padding: 6,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9",
    },
    modalSearchWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 40,
      paddingHorizontal: 11,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
      backgroundColor: isDark ? "#181622" : "#F8FAFC",
    },
    modalSearchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
      paddingVertical: 0,
    },
    modalList: {
      maxHeight: 360,
    },
    modalEmptyText: {
      textAlign: "center",
      paddingVertical: 24,
      fontSize: 12.5,
      color: colors.textSecondary,
    },
    modalOption: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 10,
      borderRadius: 12,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
      backgroundColor: isDark ? "#181622" : "#F8FAFC",
    },
    modalOptionActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.1)" : "#F0F9FF",
    },
    modalThumb: {
      width: 38,
      height: 38,
      borderRadius: 9,
      backgroundColor: isDark ? "#232030" : "#E2E8F0",
    },
    modalThumbFallback: {
      width: 38,
      height: 38,
      borderRadius: 9,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
    },
    itemCard: {
      borderRadius: 14,
      padding: 12,
      backgroundColor: isDark ? "#181622" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
      gap: 8,
    },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    thumb: {
      width: 44,
      height: 44,
      borderRadius: 10,
      backgroundColor: isDark ? "#232030" : "#E2E8F0",
    },
    thumbFallback: {
      width: 44,
      height: 44,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.accentSoft,
    },
    titleBadgeRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    itemTitle: {
      flex: 1,
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    itemUrl: {
      fontSize: 11.5,
      color: colors.textSecondary,
      marginTop: 2,
    },
    itemMeta: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    verifiedBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5",
    },
    verifiedBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: isDark ? "#6EE7B7" : "#047857",
    },
    unverifiedBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
    },
    unverifiedBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    pendingBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
    },
    pendingBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: isDark ? "#FCD34D" : "#B45309",
    },
    itemActions: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 2,
    },
    ghostBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
      backgroundColor: isDark ? "#1F1C2C" : "#FFFFFF",
    },
    ghostBtnText: {
      fontSize: 11.5,
      fontWeight: "600",
      color: colors.text,
    },
    primaryBtnSmall: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 9,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    primaryBtnSmallText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: colors.primaryForeground,
    },
    outlineBtnSmall: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: colors.primary,
      backgroundColor: colors.primaryMuted,
    },
    outlineBtnSmallText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: colors.primary,
    },
    dangerBtnSmall: {
      paddingHorizontal: 11,
      paddingVertical: 7,
      borderRadius: 9,
      borderWidth: 1,
      borderColor: isDark ? "rgba(248, 113, 113, 0.35)" : "#FECACA",
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.14)" : "#FEF2F2",
    },
    dangerBtnSmallText: {
      fontSize: 11.5,
      fontWeight: "700",
      color: isDark ? "#FCA5A5" : "#DC2626",
    },
    formStack: {
      gap: 8,
    },
    channelsBlock: {
      gap: 8,
      marginBottom: 4,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
      marginTop: 4,
    },
    input: {
      height: 42,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.14)" : "#CBD5E1",
      backgroundColor: isDark ? "#181622" : "#FFFFFF",
      paddingHorizontal: 12,
      fontSize: 13,
      color: colors.text,
    },
    primaryBtn: {
      marginTop: 4,
      height: 42,
      borderRadius: 11,
      backgroundColor: colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 7,
    },
    primaryBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.primaryForeground,
    },
    secondaryBtn: {
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 14,
    },
    secondaryBtnText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: colors.primary,
    },
    outlineBtn: {
      height: 40,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    outlineBtnText: {
      fontSize: 12.5,
      fontWeight: "700",
      color: colors.primary,
    },
    dnsBox: {
      marginTop: 4,
      padding: 10,
      borderRadius: 10,
      backgroundColor: isDark ? "#12101A" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
      gap: 4,
    },
    dnsLabel: {
      fontSize: 10.5,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    dnsCode: {
      fontSize: 11.5,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      color: colors.text,
    },
    identityCard: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "rgba(16, 185, 129, 0.25)" : "#A7F3D0",
      gap: 2,
    },
    identityTitle: {
      fontSize: 14,
      fontWeight: "700",
      color: colors.text,
    },
    identityMeta: {
      fontSize: 11.5,
      color: colors.textSecondary,
    },
    linkStepBox: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "#181622" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#CBD5E1",
      gap: 8,
      alignItems: "flex-start",
    },
    linkStepText: {
      fontSize: 12,
      lineHeight: 17,
      color: colors.textSecondary,
    },
    confirmCard: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.14)" : "#EFF6FF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(56, 189, 248, 0.28)" : "#BFDBFE",
    },
    confirmTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 2,
    },
    warnText: {
      fontSize: 12,
      lineHeight: 17,
      color: isDark ? "#FCD34D" : "#B45309",
    },
    chipRow: {
      gap: 8,
      paddingVertical: 4,
    },
    selectChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
      backgroundColor: isDark ? "#181622" : "#FFFFFF",
    },
    selectChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    selectChipText: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    selectChipTextActive: {
      color: colors.primaryForeground,
      fontWeight: "700",
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 6,
      marginBottom: 4,
    },
    switchLabel: {
      fontSize: 13,
      fontWeight: "600",
      color: colors.text,
    },
    switchHint: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    emptyBox: {
      padding: 18,
      borderRadius: 12,
      backgroundColor: isDark ? "#181622" : "#F8FAFC",
      alignItems: "center",
      gap: 8,
    },
    emptyTitle: {
      fontSize: 13.5,
      fontWeight: "700",
      color: colors.text,
    },
    emptySubtitle: {
      fontSize: 12,
      lineHeight: 17,
      textAlign: "center",
      color: colors.textSecondary,
    },
    rangeRow: {
      flexDirection: "row",
      gap: 8,
    },
    kpiGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      rowGap: 10,
    },
    kpiCard: {
      width: "48.5%",
      borderRadius: 14,
      padding: 13,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : colors.cardBorder,
      gap: 4,
    },
    kpiLabel: {
      fontSize: 11.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    kpiValue: {
      fontSize: 22,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.4,
    },
    miniMetricsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      columnGap: 12,
      rowGap: 4,
      marginTop: 4,
      marginBottom: 2,
    },
    miniMetric: {
      fontSize: 11.5,
      fontWeight: "600",
      color: colors.text,
    },

    // Step Tracker Card
    stepTrackerCard: {
      borderRadius: 18,
      padding: 14,
      backgroundColor: isDark ? "#141F2B" : "#F0F9FF",
      borderWidth: 1.25,
      borderColor: isDark ? "rgba(56, 189, 248, 0.28)" : "rgba(2, 132, 199, 0.2)",
      gap: 12,
    },
    stepTrackerHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    stepTrackerTitleRow: {
      gap: 2,
    },
    stepTrackerMainTitle: {
      fontSize: 14.5,
      fontWeight: "800",
      color: colors.text,
      letterSpacing: -0.2,
    },
    stepTrackerSubTitle: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    stepProgressPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.18)" : "#E0F2FE",
    },
    stepProgressPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: isDark ? "#7DD3FC" : "#0369A1",
    },
    stepTrackerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 2,
      gap: 4,
    },
    stepTabItem: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 6,
      borderRadius: 10,
      opacity: 0.75,
    },
    stepTabItemActive: {
      opacity: 1,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.12)" : "rgba(2, 132, 199, 0.08)",
    },
    stepCircle: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: isDark ? "#2A2838" : "#E2E8F0",
      alignItems: "center",
      justifyContent: "center",
    },
    stepCircleActive: {
      backgroundColor: isDark ? "#0284C7" : "#0284C7",
    },
    stepCircleDone: {
      backgroundColor: "#059669",
    },
    stepCircleNum: {
      fontSize: 10.5,
      fontWeight: "800",
      color: colors.textSecondary,
    },
    stepCircleNumActive: {
      color: "#FFFFFF",
    },
    stepItemTitle: {
      fontSize: 11,
      fontWeight: "700",
      color: colors.text,
    },
    stepItemTitleActive: {
      color: isDark ? "#38BDF8" : "#0284C7",
      fontWeight: "800",
    },
    stepItemSub: {
      fontSize: 9.5,
      color: colors.textSecondary,
      marginTop: 1,
    },
    stepItemSubDone: {
      color: isDark ? "#34D399" : "#047857",
      fontWeight: "600",
    },
    stepDivider: {
      width: 10,
      height: 1.5,
      backgroundColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
      marginHorizontal: 1,
    },
    stepDividerActive: {
      backgroundColor: isDark ? "#38BDF8" : "#0284C7",
    },

    // Wizard Navigation Buttons
    wizardActionBox: {
      marginTop: 8,
    },
    wizardNextBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.primary,
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 2,
    },
    wizardNextBtnText: {
      fontSize: 13.5,
      fontWeight: "800",
      color: colors.primaryForeground,
    },
    wizardNavRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginTop: 8,
    },
    wizardBackBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 13,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: isDark ? "#232032" : "#F1F5F9",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
    },
    wizardBackBtnText: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    wizardNextBtnFlex: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 13,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: colors.primary,
      gap: 8,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 4,
      elevation: 2,
    },
    wizardBackBtnCenter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      paddingVertical: 10,
      marginTop: 2,
    },
    wizardBackBtnCenterText: {
      fontSize: 12.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },

    // Step Header & Badges
    stepHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 2,
    },
    stepBadge: {
      paddingHorizontal: 9,
      paddingVertical: 3.5,
      borderRadius: 7,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.18)" : "#E0F2FE",
    },
    stepBadgeText: {
      fontSize: 10,
      fontWeight: "900",
      letterSpacing: 0.8,
      color: isDark ? "#38BDF8" : "#0284C7",
    },
    stepIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    subHeading: {
      fontSize: 12.5,
      fontWeight: "700",
      color: colors.text,
      marginTop: 4,
    },
    completionBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      padding: 11,
      borderRadius: 11,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.14)" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "rgba(16, 185, 129, 0.28)" : "#A7F3D0",
      marginTop: 6,
    },
    completionBannerText: {
      flex: 1,
      fontSize: 11.5,
      fontWeight: "600",
      color: isDark ? "#6EE7B7" : "#047857",
      lineHeight: 16,
    },

    // Two-Option Selector Cards (Internal vs External)
    typeSelectorGrid: {
      flexDirection: "row",
      gap: 10,
      marginVertical: 4,
    },
    typeCard: {
      flex: 1,
      borderRadius: 14,
      padding: 12,
      backgroundColor: isDark ? "#171523" : "#F8FAFC",
      borderWidth: 1.5,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
      gap: 7,
    },
    typeCardActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.08)" : "#F0F9FF",
    },
    typeCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    typeIconBox: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: isDark ? "#232032" : "#EDE9FE",
      alignItems: "center",
      justifyContent: "center",
    },
    typeIconBoxActive: {
      backgroundColor: colors.primaryMuted,
    },
    typeTagInternal: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5",
    },
    typeTagInternalText: {
      fontSize: 9.5,
      fontWeight: "800",
      color: isDark ? "#6EE7B7" : "#047857",
    },
    typeTagExternal: {
      paddingHorizontal: 7,
      paddingVertical: 2.5,
      borderRadius: 6,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.2)" : "#E0F2FE",
    },
    typeTagExternalText: {
      fontSize: 9.5,
      fontWeight: "800",
      color: isDark ? "#38BDF8" : "#0284C7",
    },
    typeCardTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
      marginTop: 2,
    },
    typeCardTitleActive: {
      color: colors.primary,
    },
    typeCardDesc: {
      fontSize: 10.5,
      lineHeight: 14.5,
      color: colors.textSecondary,
    },
    typeRadioRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 4,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
    },
    typeRadioCircle: {
      width: 14,
      height: 14,
      borderRadius: 7,
      borderWidth: 1.5,
      borderColor: colors.textSecondary,
      alignItems: "center",
      justifyContent: "center",
    },
    typeRadioCircleActive: {
      borderColor: colors.primary,
    },
    typeRadioDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: colors.primary,
    },
    typeRadioText: {
      fontSize: 10.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    typeRadioTextActive: {
      color: colors.text,
      fontWeight: "700",
    },

    // Mode Sections inside Step 2
    modeSection: {
      marginTop: 6,
      gap: 10,
    },
    modeHeaderBar: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingBottom: 4,
    },
    modeIndicatorInternal: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#10B981",
    },
    modeIndicatorExternal: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? "#38BDF8" : "#0284C7",
    },
    modeHeaderTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },

    // Notice Box for Missing Landing Template
    noticeBox: {
      padding: 14,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB",
      borderWidth: 1.25,
      borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
      gap: 8,
    },
    noticeHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    noticeTitle: {
      fontSize: 13.5,
      fontWeight: "800",
      color: isDark ? "#FCD34D" : "#B45309",
    },
    noticeText: {
      fontSize: 12,
      lineHeight: 17,
      color: isDark ? "#FDE68A" : "#92400E",
    },
    noticeSubText: {
      fontSize: 11,
      lineHeight: 15.5,
      color: colors.textSecondary,
    },
    noticeActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 4,
      flexWrap: "wrap",
    },

    // Step 3 Selection Summary Card
    selectionSummaryCard: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "#171523" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
      gap: 8,
    },
    selectionSummaryHeading: {
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 0.5,
      color: colors.textSecondary,
      textTransform: "uppercase",
      marginBottom: 2,
    },
    summaryItemRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
    },
    summaryIconBox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: isDark ? "#232032" : "#EDE9FE",
      alignItems: "center",
      justifyContent: "center",
    },
    summaryItemLabel: {
      fontSize: 10,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    summaryItemValue: {
      fontSize: 12.5,
      fontWeight: "700",
      color: colors.text,
      marginTop: 1,
    },

    // Accordion for Manual Channel Entry
    accordionWrap: {
      marginTop: 8,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.1)" : "#E2E8F0",
      backgroundColor: isDark ? "#171523" : "#F8FAFC",
      overflow: "hidden",
    },
    accordionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 12,
    },
    accordionHeaderLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      flex: 1,
    },
    accordionIconBox: {
      width: 30,
      height: 30,
      borderRadius: 8,
      backgroundColor: colors.accentSoft,
      alignItems: "center",
      justifyContent: "center",
    },
    accordionTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    accordionSubtitle: {
      fontSize: 10.5,
      color: colors.textSecondary,
      marginTop: 1,
    },
    accordionChevronBox: {
      width: 26,
      height: 26,
      borderRadius: 13,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
    },
    accordionBody: {
      paddingHorizontal: 12,
      paddingBottom: 12,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#F1F5F9",
      gap: 8,
    },
    accordionDesc: {
      fontSize: 11.5,
      lineHeight: 16,
      color: colors.textSecondary,
    },

    // Hero Graphic Badges
    heroPillRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
      flexWrap: "wrap",
    },
    codeBox: {
      padding: 10,
      borderRadius: 10,
      backgroundColor: isDark ? "#12101A" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
      gap: 4,
    },
    codeBoxHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    codeBoxLabel: {
      fontSize: 10.5,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    identityCard: {
      padding: 12,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.12)" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "rgba(16, 185, 129, 0.25)" : "#A7F3D0",
      gap: 2,
    },
    heroFeaturePill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4.5,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
    },
    heroFeaturePillText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: colors.text,
    },

    // Stepper header graphics
    stepNumberBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.primary,
    },
    stepNumberBadgeText: {
      fontSize: 10,
      fontWeight: "900",
      color: colors.primaryForeground,
    },
    stepDotsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    stepDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    stepDotActive: {
      width: 16,
      backgroundColor: colors.primary,
    },
    stepDotDone: {
      backgroundColor: "#059669",
    },
    stepDotPending: {
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.15)" : "#CBD5E1",
    },

    // Step 1 Setup Pipeline Bar
    pipelineBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 7,
      paddingHorizontal: 10,
      borderRadius: 10,
      backgroundColor: isDark ? "#171523" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.06)" : "#E2E8F0",
      marginVertical: 4,
    },
    pipelineStep: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      opacity: 0.5,
    },
    pipelineStepActive: {
      opacity: 1,
    },
    pipelineStepText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    pipelineStepTextActive: {
      color: colors.text,
      fontWeight: "800",
    },

    // Identity Card graphics
    identityAvatarWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.16)" : "#E0F2FE",
      alignItems: "center",
      justifyContent: "center",
    },
    verifiedChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    verifiedChipText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#059669",
    },

    // Dropdown Icon Box & Empty Graphics
    dropdownIconBox: {
      width: 28,
      height: 28,
      borderRadius: 7,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.15)" : "#E0F2FE",
      alignItems: "center",
      justifyContent: "center",
    },
    emptyGraphicBox: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 18,
      gap: 6,
    },
    emptyGraphicTitle: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.text,
    },
    emptyGraphicSub: {
      fontSize: 11,
      color: colors.textSecondary,
    },

    // Micro Feature Pills for Step 2 Cards
    featurePillRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      marginTop: 4,
      flexWrap: "wrap",
    },
    microPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3.5,
      paddingHorizontal: 6,
      paddingVertical: 2.5,
      borderRadius: 5,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.07)" : "#E2E8F0",
    },
    microPillText: {
      fontSize: 9.5,
      fontWeight: "700",
      color: colors.textSecondary,
    },

    // Notice Box Graphic
    noticeBoxGraphic: {
      padding: 16,
      borderRadius: 14,
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.12)" : "#FFFBEB",
      borderWidth: 1.25,
      borderColor: isDark ? "rgba(245, 158, 11, 0.3)" : "#FDE68A",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
    },
    noticeIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.2)" : "#FEF3C7",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 2,
    },
    noticeGraphicTitle: {
      fontSize: 14,
      fontWeight: "800",
      color: isDark ? "#FCD34D" : "#B45309",
    },
    noticeGraphicSub: {
      fontSize: 11.5,
      color: isDark ? "#FDE68A" : "#92400E",
      textAlign: "center",
    },
    noticeActionsGraphic: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginTop: 6,
    },

    // Graphic Flow Connector for Step 3
    graphicFlowCard: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      padding: 14,
      borderRadius: 14,
      backgroundColor: isDark ? "#171523" : "#F8FAFC",
      borderWidth: 1.25,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : "#E2E8F0",
    },
    flowNode: {
      flex: 1,
      alignItems: "center",
      gap: 5,
    },
    flowIconBoxTg: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.16)" : "#E0F2FE",
      alignItems: "center",
      justifyContent: "center",
    },
    flowIconBoxWeb: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.16)" : "#D1FAE5",
      alignItems: "center",
      justifyContent: "center",
    },
    flowNodeTitle: {
      fontSize: 11.5,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
    },
    flowBadgeOk: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5",
    },
    flowBadgeOkText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#059669",
    },
    flowBadgeWait: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.2)" : "#FEE2E2",
    },
    flowBadgeWaitText: {
      fontSize: 9,
      fontWeight: "800",
      color: "#DC2626",
    },
    flowConnector: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 4,
    },
    flowLine: {
      width: 14,
      height: 1.5,
      backgroundColor: colors.primary,
    },
    flowConnectorBadge: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    // KPI Header & Metric Pills
    kpiHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
    },
    metricPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3.5,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 5,
      backgroundColor: isDark ? "rgba(255, 255, 255, 0.05)" : "#F1F5F9",
    },
    miniMetricLeave: {
      color: isDark ? "#FCA5A5" : "#DC2626",
    },

    // Charts & Funnel
    chartCard: {
      borderRadius: 18,
      padding: 15,
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255, 255, 255, 0.08)" : colors.cardBorder,
      gap: 10,
    },
    chartIconBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.16)" : "#E0F2FE",
      alignItems: "center",
      justifyContent: "center",
    },
    chartSub: {
      fontSize: 11,
      color: colors.textSecondary,
      marginTop: 1,
    },
    chartFilterRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 6,
    },
    chartFilterChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
      backgroundColor: isDark ? "#181622" : "#F8FAFC",
    },
    chartFilterChipActive: {
      borderColor: colors.primary,
      backgroundColor: isDark ? "rgba(56, 189, 248, 0.14)" : "#EFF6FF",
    },
    legendDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
    },
    chartFilterText: {
      fontSize: 11,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    chartFilterTextActive: {
      color: colors.text,
      fontWeight: "700",
    },
    svgChartWrap: {
      alignItems: "center",
      paddingTop: 4,
    },
    chartAxisRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginTop: 4,
      paddingHorizontal: 4,
    },
    chartAxisTap: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 4,
    },
    chartAxisText: {
      fontSize: 9.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    chartAxisTextActive: {
      color: colors.primary,
      fontWeight: "800",
    },
    dayInspector: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 6,
      paddingHorizontal: 11,
      paddingVertical: 8,
      borderRadius: 11,
      backgroundColor: isDark ? "#181622" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
    },
    dayInspectorDate: {
      fontSize: 11.5,
      fontWeight: "700",
      color: colors.text,
    },
    dayInspectorPills: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
    },
    dayMetricTag: {
      fontSize: 11,
      fontWeight: "700",
    },
    leavePillBadge: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(239,68,68,0.18)" : "#FEE2E2",
    },
    leavePillBadgeText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: isDark ? "#FCA5A5" : "#DC2626",
    },
    funnelList: {
      gap: 10,
      marginTop: 2,
    },
    funnelItem: {
      gap: 5,
    },
    funnelTopRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    funnelLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.text,
    },
    funnelRightMeta: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    funnelTag: {
      fontSize: 10.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    funnelCount: {
      fontSize: 12.5,
      fontWeight: "800",
      color: colors.text,
      minWidth: 18,
      textAlign: "right",
    },
    funnelTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#F1F5F9",
      overflow: "hidden",
    },
    funnelFill: {
      height: "100%",
      borderRadius: 4,
    },

    // Attractive Campaign & Link Cards
    campaignCard: {
      borderRadius: 16,
      padding: 13,
      backgroundColor: isDark ? "#181622" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
      gap: 10,
    },
    campaignHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    campaignIconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(56,189,248,0.16)" : "#E0F2FE",
      alignItems: "center",
      justifyContent: "center",
    },
    campaignIconWrapExt: {
      backgroundColor: isDark ? "rgba(99,102,241,0.18)" : "#EEF2FF",
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    campaignMetricsStrip: {
      flexDirection: "row",
      gap: 6,
    },
    campaignMetricPill: {
      flex: 1,
      alignItems: "center",
      paddingVertical: 7,
      paddingHorizontal: 4,
      borderRadius: 10,
      gap: 1,
    },
    campaignMetricVal: {
      fontSize: 13.5,
      fontWeight: "800",
    },
    campaignMetricLbl: {
      fontSize: 9.5,
      fontWeight: "600",
      color: colors.textSecondary,
    },
    linkCardsStack: {
      gap: 8,
    },
    linkCardAds: {
      borderRadius: 12,
      padding: 10,
      backgroundColor: isDark ? "rgba(14, 165, 233, 0.1)" : "#F0F9FF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(56, 189, 248, 0.28)" : "#BAE6FD",
      gap: 6,
    },
    linkCardInvite: {
      borderRadius: 12,
      padding: 10,
      backgroundColor: isDark ? "rgba(16, 185, 129, 0.1)" : "#ECFDF5",
      borderWidth: 1,
      borderColor: isDark ? "rgba(52, 211, 153, 0.28)" : "#A7F3D0",
      gap: 6,
    },
    linkCardWarn: {
      borderRadius: 12,
      padding: 10,
      backgroundColor: isDark ? "rgba(245, 158, 11, 0.1)" : "#FFFBEB",
      borderWidth: 1,
      borderColor: isDark ? "rgba(245, 158, 11, 0.25)" : "#FDE68A",
      gap: 8,
    },
    linkCardTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8,
    },
    linkBadgeAds: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 7,
      backgroundColor: isDark ? "rgba(56,189,248,0.18)" : "#E0F2FE",
    },
    linkBadgeAdsText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: isDark ? "#7DD3FC" : "#0369A1",
    },
    linkBadgeInvite: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 7,
      backgroundColor: isDark ? "rgba(16,185,129,0.2)" : "#D1FAE5",
    },
    linkBadgeInviteText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: isDark ? "#6EE7B7" : "#047857",
    },
    linkBtnGroup: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    linkIconBtn: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.12)" : "#CBD5E1",
      alignItems: "center",
      justifyContent: "center",
    },
    copyPillAds: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: "#0284C7",
    },
    copyPillInvite: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: "#059669",
    },
    copyPillDone: {
      backgroundColor: "#047857",
    },
    copyPillText: {
      fontSize: 11,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    linkCardHint: {
      fontSize: 11,
      color: colors.textSecondary,
    },
    linkUrlPill: {
      borderRadius: 8,
      paddingHorizontal: 9,
      paddingVertical: 7,
      backgroundColor: isDark ? "rgba(0,0,0,0.25)" : "#FFFFFF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)",
    },
    linkUrlText: {
      fontSize: 11.5,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      color: colors.text,
    },
    terminalBox: {
      borderRadius: 12,
      padding: 12,
      backgroundColor: "#0F172A",
      borderWidth: 1,
      borderColor: "#1E293B",
      gap: 6,
    },
    terminalLabel: {
      fontSize: 10.5,
      fontWeight: "700",
      color: "#94A3B8",
    },
    terminalCopyBtn: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      backgroundColor: "#1E293B",
    },
    terminalCopyText: {
      fontSize: 10.5,
      fontWeight: "700",
      color: "#38BDF8",
    },
    terminalCode: {
      fontSize: 11,
      lineHeight: 16,
      fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
      color: "#E2E8F0",
    },
    metaIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(124, 58, 237, 0.2)" : "#F3E8FF",
      alignItems: "center",
      justifyContent: "center",
    },
    kpiValueSmall: {
      fontSize: 17,
      fontWeight: "800",
      letterSpacing: -0.3,
    },
    metaHintBox: {
      borderRadius: 10,
      padding: 10,
      backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#F8FAFC",
      borderWidth: 1,
      borderColor: isDark ? "rgba(255,255,255,0.08)" : "#E2E8F0",
    },
    metaHintText: {
      fontSize: 11.5,
      lineHeight: 16,
      color: colors.textSecondary,
    },
    metaCardActionRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 8,
    },
    campaignMetaRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: isDark ? "rgba(124, 58, 237, 0.14)" : "#F5F3FF",
      borderWidth: 1,
      borderColor: isDark ? "rgba(167, 139, 250, 0.25)" : "#DDD6FE",
    },
    campaignMetaText: {
      fontSize: 11,
      color: colors.textSecondary,
      fontWeight: "500",
    },
    campaignMetaStrong: {
      fontWeight: "700",
      color: isDark ? "#DDD6FE" : "#5B21B6",
    },
  });
