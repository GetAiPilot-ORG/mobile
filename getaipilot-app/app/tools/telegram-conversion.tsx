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
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Activity01Icon,
  Add01Icon,
  ArrowRight01Icon,
  ArrowUpRight01Icon,
  BrowserIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Copy01Icon,
  Link01Icon,
  Rocket01Icon,
  Search01Icon,
  ShieldCheckIcon,
  TelegramIcon,
} from "@/constants/icons";
import { Ionicons } from "@expo/vector-icons";
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
  fetchUserCreatedTemplates,
  fetchUserTelegramChannels,
  TelegramSetup,
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
  const [reportDays, setReportDays] = useState<7 | 30>(7);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyKey, setBusyKey] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copiedKey, setCopiedKey] = useState("");

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

  const loadData = useCallback(
    async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const [invResult, pagesResult, channelsResult, reportResult] =
          await Promise.allSettled([
            trackingRequest<TrackingInventory>("list"),
            fetchUserCreatedTemplates(authUser?.id),
            fetchUserTelegramChannels(authUser?.id),
            fetchConversionReport(reportDays),
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
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [authUser?.id, reportDays],
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
      if (page.telegram_url && !originalTelegramUrl) {
        setOriginalTelegramUrl(page.telegram_url);
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
    if (!campaignName.trim() || !selectedSiteId || !selectedConnectionId || !originalTelegramUrl.trim()) {
      showNotice(
        "Incomplete Campaign",
        "Select a verified page/website, a connected channel, campaign name, and your https://t.me/... link.",
      );
      return;
    }
    const saved = await runAction(
      "create-campaign",
      "campaign",
      {
        name: campaignName.trim(),
        site_id: selectedSiteId,
        connection_id: selectedConnectionId,
        original_telegram_url: originalTelegramUrl.trim(),
        join_request: joinRequest,
      },
      "Campaign Created",
      "Tap Activate & Generate Invite on the campaign below.",
    );
    if (saved?.id) {
      setCampaignName("");
      setActiveTab("analytics");
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
      }),
      { views: 0, clicks: 0, joins: 0, active: 0, leaves: 0 },
    );
  }, [report]);

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
              <Ionicons name="flash" size={11} color={isDark ? "#38BDF8" : "#0284C7"} />
              <Text style={styles.heroFeaturePillText}>Auto-Track</Text>
            </View>
            <View style={styles.heroFeaturePill}>
              <Ionicons name="shield-checkmark" size={11} color="#059669" />
              <Text style={styles.heroFeaturePillText}>Verified Joins</Text>
            </View>
            <View style={styles.heroFeaturePill}>
              <Ionicons name="stats-chart" size={11} color="#7C3AED" />
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
                <Ionicons
                  name={tabKey === "setup" ? "layers-outline" : "bar-chart-outline"}
                  size={14}
                  color={active ? colors.text : colors.textSecondary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.segmentBtnText,
                    active && styles.segmentBtnTextActive,
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
            <Pressable onPress={() => void loadData(true)}>
              <Text style={styles.errorRetry}>Retry</Text>
            </Pressable>
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
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
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
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
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
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" />
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
                  <Ionicons name="person" size={12} color={inventory.telegram.identity ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary} />
                  <Text style={[styles.pipelineStepText, inventory.telegram.identity ? styles.pipelineStepTextActive : null]}>
                    Account
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={11} color={colors.cardBorder} />
                <View style={[styles.pipelineStep, inventory.telegram.is_admin ? styles.pipelineStepActive : null]}>
                  <Ionicons name="shield-checkmark" size={12} color={inventory.telegram.is_admin ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary} />
                  <Text style={[styles.pipelineStepText, inventory.telegram.is_admin ? styles.pipelineStepTextActive : null]}>
                    Bot Admin
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={11} color={colors.cardBorder} />
                <View style={[styles.pipelineStep, inventory.connections.length > 0 ? styles.pipelineStepActive : null]}>
                  <Ionicons name="megaphone" size={12} color={inventory.connections.length > 0 ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary} />
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
                      <Ionicons name="person" size={16} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.identityTitle} numberOfLines={1}>
                        {inventory.telegram.identity.display_name}
                      </Text>
                      <View style={styles.verifiedChip}>
                        <Ionicons name="checkmark-circle" size={11} color="#059669" />
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
                        <Ionicons
                          name="link"
                          size={16}
                          color={colors.primaryForeground}
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
                    <Ionicons
                      name={m === "shared" ? "flash-outline" : "key-outline"}
                      size={13}
                      color={botMode === m ? (isDark ? "#38BDF8" : "#0284C7") : colors.textSecondary}
                      style={{ marginRight: 5 }}
                    />
                    <Text
                      style={[
                        styles.segmentBtnText,
                        botMode === m && styles.segmentBtnTextActive,
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
                        <Ionicons name="megaphone-outline" size={24} color={colors.primary} />
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
                          <Ionicons
                            name="create-outline"
                            size={15}
                            color={colors.primary}
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
                        <Ionicons
                          name={manualAccordionOpen ? "chevron-up" : "chevron-down"}
                          size={16}
                          color={colors.textSecondary}
                        />
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
                      <Ionicons name="flash" size={9} color="#059669" />
                      <Text style={styles.microPillText}>Zero DNS</Text>
                    </View>
                    <View style={styles.microPill}>
                      <Ionicons name="checkmark-circle" size={9} color="#059669" />
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
                      <Ionicons name="globe-outline" size={9} color="#0284C7" />
                      <Text style={styles.microPillText}>Any Site</Text>
                    </View>
                    <View style={styles.microPill}>
                      <Ionicons name="code-slash" size={9} color="#0284C7" />
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
                          <Ionicons name="add" size={14} color="#FFFFFF" />
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
                          <Ionicons name="globe-outline" size={13} color={colors.text} />
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
                                  {page.telegram_url ? (
                                    <Text style={styles.itemMeta} numberOfLines={1}>
                                      Target: {page.telegram_url}
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
                                          if (page.telegram_url) {
                                            setOriginalTelegramUrl(page.telegram_url);
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
                  <Ionicons name="arrow-back" size={16} color={colors.text} />
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
                    <Ionicons name="flash" size={11} color="#FFFFFF" />
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
                  <HugeiconsIcon
                    icon={Link01Icon}
                    size={16}
                    color={colors.primaryForeground}
                    strokeWidth={2.2}
                  />
                  <Text style={styles.primaryBtnText}>
                    Create Tracking Campaign & Generate Link
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.wizardBackBtnCenter}
                  onPress={() => {
                    soundService.play("click");
                    setSetupStep(2);
                  }}
                >
                  <Ionicons name="arrow-back" size={15} color={colors.textSecondary} />
                  <Text style={styles.wizardBackBtnCenterText}>
                    Back to Step 2 (Destination)
                  </Text>
                </Pressable>
              </View>
            </View>
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
            </View>

            <View style={styles.kpiGrid}>
              {[
                { label: "Page Views", value: reportTotals.views, icon: "eye-outline", color: isDark ? "#38BDF8" : "#0284C7" },
                { label: "TG Clicks", value: reportTotals.clicks, icon: "finger-print-outline", color: "#8B5CF6" },
                { label: "Verified Joins", value: reportTotals.joins, icon: "shield-checkmark-outline", color: "#10B981" },
                { label: "Active Members", value: reportTotals.active, icon: "people-outline", color: "#F59E0B" },
              ].map((stat) => (
                <View key={stat.label} style={styles.kpiCard}>
                  <View style={styles.kpiHeaderRow}>
                    <Text style={styles.kpiLabel}>{stat.label}</Text>
                    <Ionicons name={stat.icon as any} size={15} color={stat.color} />
                  </View>
                  <Text style={styles.kpiValue}>{stat.value}</Text>
                </View>
              ))}
            </View>

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
                  {inventory.campaigns.map((c) => {
                    const site = inventory.sites.find((s) => s.id === c.site_id);
                    const perf = report?.campaigns.find((r) => r.id === c.id);
                    const campaignUrl = site
                      ? `${site.url}?gap_campaign=${c.public_key}`
                      : "";
                    const isExternal = site && !site.landing_page_id;

                    return (
                      <View key={c.id} style={styles.itemCard}>
                        <View style={styles.titleBadgeRow}>
                          <Text style={styles.itemTitle} numberOfLines={1}>
                            {c.name}
                          </Text>
                          <View
                            style={
                              c.status === "active"
                                ? styles.verifiedBadge
                                : styles.unverifiedBadge
                            }
                          >
                            <Text
                              style={
                                c.status === "active"
                                  ? styles.verifiedBadgeText
                                  : styles.unverifiedBadgeText
                              }
                            >
                              {c.status}
                            </Text>
                          </View>
                        </View>

                        <Text style={styles.itemUrl} numberOfLines={1}>
                          {site?.name || "Unknown page"}
                        </Text>
                        {c.invite_link ? (
                          <Text style={styles.itemMeta} numberOfLines={1}>
                            Invite: {c.invite_link}
                          </Text>
                        ) : null}

                        {perf && (
                          <View style={styles.miniMetricsRow}>
                            <View style={styles.metricPill}>
                              <Ionicons name="eye-outline" size={11} color={colors.textSecondary} />
                              <Text style={styles.miniMetric}>{perf.views}</Text>
                            </View>
                            <View style={styles.metricPill}>
                              <Ionicons name="finger-print-outline" size={11} color={colors.textSecondary} />
                              <Text style={styles.miniMetric}>{perf.clicks}</Text>
                            </View>
                            <View style={styles.metricPill}>
                              <Ionicons name="shield-checkmark-outline" size={11} color="#059669" />
                              <Text style={[styles.miniMetric, { color: "#059669", fontWeight: "700" }]}>{perf.acquisitions}</Text>
                            </View>
                          </View>
                        )}

                        <View style={styles.itemActions}>
                          {c.status === "active" ? (
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
                          ) : c.status !== "archived" ? (
                            <Pressable
                              style={styles.primaryBtnSmall}
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
                                {c.invite_link ? "Resume" : "Activate"}
                              </Text>
                            </Pressable>
                          ) : null}

                          {campaignUrl ? (
                            <Pressable
                              style={styles.ghostBtn}
                              onPress={() =>
                                void handleCopy(
                                  `url-${c.id}`,
                                  campaignUrl,
                                  "Campaign URL",
                                )
                              }
                            >
                              <HugeiconsIcon
                                icon={Copy01Icon}
                                size={13}
                                color={colors.text}
                                strokeWidth={2}
                              />
                              <Text style={styles.ghostBtnText}>Copy URL</Text>
                            </Pressable>
                          ) : null}

                          {isExternal ? (
                            <Pressable
                              style={styles.ghostBtn}
                              onPress={() =>
                                void handleCopy(
                                  `script-${c.id}`,
                                  buildInstallSnippet(c.public_key),
                                  "Install Script",
                                )
                              }
                            >
                              <HugeiconsIcon
                                icon={Copy01Icon}
                                size={13}
                                color={colors.text}
                                strokeWidth={2}
                              />
                              <Text style={styles.ghostBtnText}>Copy Script</Text>
                            </Pressable>
                          ) : null}
                        </View>
                      </View>
                    );
                  })}
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
      gap: 12,
      marginTop: 2,
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
  });
