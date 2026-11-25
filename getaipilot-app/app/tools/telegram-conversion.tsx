import * as Clipboard from "expo-clipboard";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
      } catch {}
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
      Linking.openURL(res.url).catch(() => {});
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
      Linking.openURL(res.url).catch(() => {});
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

      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.heroIconWrap}>
              <HugeiconsIcon
                icon={TelegramIcon}
                size={22}
                color={isDark ? "#38BDF8" : "#0284C7"}
                strokeWidth={1.9}
              />
            </View>
            <View style={styles.advancedBadge}>
              <Text style={styles.advancedBadgeText}>ADVANCED</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>Telegram Conversion Tracking</Text>
          <Text style={styles.heroSubtitle}>
            Verify your created landing templates or your own website, link your
            Telegram account & channel, and track real verified joins.
          </Text>
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
                <Text
                  style={[
                    styles.segmentBtnText,
                    active && styles.segmentBtnTextActive,
                  ]}
                >
                  {tabKey === "setup" ? "Pages & Setup" : "Analytics & Campaigns"}
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
            <Text style={styles.loadingText}>Loading templates & connections...</Text>
          </View>
        ) : activeTab === "setup" ? (
          <>
            {/* 1. ALL CREATED DESIGNS DROPDOWN + VERIFIED BADGE */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <HugeiconsIcon
                    icon={Rocket01Icon}
                    size={18}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text style={styles.sectionTitle}>Your Created Designs</Text>
                </View>
                <Text style={styles.countPill}>{templates.length}</Text>
              </View>
              <Text style={styles.sectionDesc}>
                Select any of your created designs from the dropdown below. Once
                verified, it shows a Verified tag and is ready for campaigns.
              </Text>

              {templates.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyTitle}>No created designs yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Create a design in Landing Funnels / Bio Builder or add your
                    own website below.
                  </Text>
                  <Pressable
                    style={styles.secondaryBtn}
                    onPress={() => router.push("/tools/landing-templates" as any)}
                  >
                    <Text style={styles.secondaryBtnText}>Browse Templates</Text>
                  </Pressable>
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
                        Select Created Design
                      </Text>
                      <Text style={styles.dropdownValue} numberOfLines={1}>
                        {selectedDesign
                          ? `${selectedDesign.page_title} (${
                              selectedDesign.design_type === "bio"
                                ? "Bio"
                                : "Landing"
                            })`
                          : "Choose a design..."}
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
                                  Linking.openURL(designUrl).catch(() => {})
                                }
                              >
                                <Text style={styles.ghostBtnText}>Open</Text>
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
                                      Verify & Connect
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
                                          `${page.page_title} selected for campaign creation below.`,
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

            {/* Created Designs Dropdown Modal */}
            <Modal
              visible={dropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setDropdownOpen(false)}
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
                      Select Created Design ({templates.length})
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
                      placeholder="Search your designs..."
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
            </Modal>

            {/* Telegram Channels Dropdown Modal */}
            <Modal
              visible={channelDropdownOpen}
              transparent
              animationType="fade"
              onRequestClose={() => setChannelDropdownOpen(false)}
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
            </Modal>

            {/* 2. ADD YOUR OWN WEBSITE INSTEAD OF GETAIPILOT TEMPLATES */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <HugeiconsIcon
                    icon={BrowserIcon}
                    size={18}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text style={styles.sectionTitle}>Add Your Own Website</Text>
                </View>
              </View>
              <Text style={styles.sectionDesc}>
                Use your own landing page URL instead of GetAiPilot templates.
                Add a DNS TXT record once to get the Verified tag.
              </Text>

              <View style={styles.formStack}>
                <Text style={styles.inputLabel}>Website / Page Name</Text>
                <TextInput
                  value={siteName}
                  onChangeText={setSiteName}
                  placeholder="e.g. Trading VIP Landing"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Published HTTPS URL</Text>
                <TextInput
                  value={siteUrl}
                  onChangeText={setSiteUrl}
                  placeholder="https://yourdomain.com/community"
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
                      <Text style={styles.primaryBtnText}>Add Website</Text>
                    </>
                  )}
                </Pressable>
              </View>

              {externalSites.length > 0 && (
                <View style={[styles.listStack, { marginTop: 14 }]}>
                  {externalSites.map((site) => {
                    const isVerified = Boolean(site.verified_at);
                    let host = "";
                    try {
                      host = new URL(site.url).hostname;
                    } catch {}
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
                            <Text style={styles.dnsLabel}>TXT Record Name</Text>
                            <Text style={styles.dnsCode} selectable>
                              {txtName}
                            </Text>
                            <Text style={[styles.dnsLabel, { marginTop: 6 }]}>
                              TXT Record Value
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
                                  `${site.name} selected for campaign creation below.`,
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

            {/* 3. ADD TELEGRAM ACCOUNT & CONNECT CHANNEL */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <HugeiconsIcon
                    icon={TelegramIcon}
                    size={18}
                    color={isDark ? "#38BDF8" : "#0284C7"}
                    strokeWidth={2}
                  />
                  <Text style={styles.sectionTitle}>
                    Telegram Account & Channel
                  </Text>
                </View>
                {inventory.telegram.identity ? (
                  <View style={styles.verifiedBadge}>
                    <HugeiconsIcon
                      icon={CheckmarkCircle01Icon}
                      size={12}
                      color="#047857"
                      strokeWidth={2.2}
                    />
                    <Text style={styles.verifiedBadgeText}>Linked</Text>
                  </View>
                ) : null}
              </View>

              {inventory.telegram.identity ? (
                <View style={styles.identityCard}>
                  <View style={styles.titleBadgeRow}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={styles.identityTitle}>
                        {inventory.telegram.identity.display_name}
                      </Text>
                      <Text style={styles.identityMeta}>
                        Verified Telegram ID: {inventory.telegram.identity.telegram_user_id}
                      </Text>
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
                  <Text style={styles.sectionDesc}>
                    First verify the Telegram account you use to manage your
                    channel.
                  </Text>
                  {!inventory.telegram.configured ? (
                    <Text style={styles.warnText}>
                      Shared GetAiPilot tracking bot is not configured yet on
                      the server. Ask platform admin to configure it first.
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
                          icon={ShieldCheckIcon}
                          size={16}
                          color={colors.primaryForeground}
                          strokeWidth={2.1}
                        />
                        <Text style={styles.primaryBtnText}>
                          {activeLink
                            ? "Create Fresh Verification Link"
                            : "Add Telegram Account"}
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
                    onPress={() => Linking.openURL(activeLink.url).catch(() => {})}
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

              {/* Channel Connection Mode */}
              <View style={[styles.segmentRow, { marginTop: 14, marginBottom: 10 }]}>
                {(["shared", "own"] as const).map((m) => (
                  <Pressable
                    key={m}
                    onPress={() => setBotMode(m)}
                    style={[
                      styles.segmentBtn,
                      botMode === m && styles.segmentBtnActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.segmentBtnText,
                        botMode === m && styles.segmentBtnTextActive,
                      ]}
                    >
                      {m === "shared" ? "GetAiPilot Bot" : "Own Bot (Advanced)"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {botMode === "shared" && inventory.telegram.identity ? (
                <View style={styles.formStack}>
                  {/* All User Telegram Channels Dropdown */}
                  <View style={styles.channelsBlock}>
                    <View style={styles.sectionHeader}>
                      <Text style={styles.inputLabel}>
                        Your Telegram Channels ({availableChannels.length})
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
                          <View style={{ flex: 1, minWidth: 0 }}>
                            <Text style={styles.dropdownLabel}>
                              Select Telegram Channel
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
                                      `${selectedAvailableChannel.title} selected for campaign creation below.`,
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
                      <Text style={styles.sectionDesc}>
                        No synced channels found yet. Tap "Choose Channel in
                        Telegram" below or add @{inventory.telegram.bot_username || "the tracking bot"} as
                        channel admin and tap Refresh.
                      </Text>
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

                  <Text style={styles.inputLabel}>
                    Or enter Channel Username / ID manually
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
                    style={styles.outlineBtn}
                    disabled={!!busyKey}
                    onPress={() => void handleConnectManualChannel()}
                  >
                    <Text style={styles.outlineBtnText}>
                      Verify & Connect Channel
                    </Text>
                  </Pressable>
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

              {inventory.connections.length > 0 && (
                <View style={[styles.listStack, { marginTop: 14 }]}>
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
            </View>

            {/* 4. CREATE TRACKING CAMPAIGN */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={styles.sectionHeaderLeft}>
                  <HugeiconsIcon
                    icon={Link01Icon}
                    size={18}
                    color={colors.primary}
                    strokeWidth={2}
                  />
                  <Text style={styles.sectionTitle}>Create Tracking Campaign</Text>
                </View>
              </View>
              <Text style={styles.sectionDesc}>
                Pair a Verified template or website with your connected channel to
                generate a tracked Telegram invite link.
              </Text>

              <View style={styles.formStack}>
                <Text style={styles.inputLabel}>Campaign Name</Text>
                <TextInput
                  value={campaignName}
                  onChangeText={setCampaignName}
                  placeholder="e.g. November VIP Launch"
                  placeholderTextColor={colors.inputPlaceholder}
                  style={styles.input}
                />

                <Text style={styles.inputLabel}>Select Verified Page / Website</Text>
                {verifiedSites.length === 0 ? (
                  <Text style={styles.warnText}>
                    Verify at least one template or external website above first.
                  </Text>
                ) : (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.chipRow}
                  >
                    {verifiedSites.map((s) => {
                      const active = selectedSiteId === s.id;
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
                            {s.name}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}

                <Text style={styles.inputLabel}>Select Telegram Channel</Text>
                {inventory.connections.length === 0 ? (
                  <Text style={styles.warnText}>
                    Connect a Telegram channel above first.
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
                  placeholder="https://t.me/yourchannel"
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
                      !!busyKey) && { opacity: 0.6 },
                  ]}
                  disabled={
                    !verifiedSites.length ||
                    !inventory.connections.length ||
                    !!busyKey
                  }
                  onPress={() => void handleCreateCampaign()}
                >
                  <Text style={styles.primaryBtnText}>Create Campaign</Text>
                </Pressable>
              </View>
            </View>
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
                { label: "Page Views", value: reportTotals.views },
                { label: "TG Clicks", value: reportTotals.clicks },
                { label: "Verified Joins", value: reportTotals.joins },
                { label: "Active Members", value: reportTotals.active },
              ].map((stat) => (
                <View key={stat.label} style={styles.kpiCard}>
                  <Text style={styles.kpiLabel}>{stat.label}</Text>
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
                            <Text style={styles.miniMetric}>
                              Views: {perf.views}
                            </Text>
                            <Text style={styles.miniMetric}>
                              Clicks: {perf.clicks}
                            </Text>
                            <Text style={styles.miniMetric}>
                              Joins: {perf.acquisitions}
                            </Text>
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
  });
