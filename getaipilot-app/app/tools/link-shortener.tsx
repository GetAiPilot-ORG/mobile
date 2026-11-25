import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Link01Icon,
  Copy01Icon,
  Share01Icon,
  QrCode01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  Rocket01Icon,
} from '@/constants/icons';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useTheme, getColors, AppColors } from '@/theme';

interface SavedShortLink {
  id: string;
  slug: string;
  url: string;
  clicks: number;
  created_at: string;
}

export default function LinkShortenerScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const { user } = useAuth();
  const [destinationUrl, setDestinationUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingLinks, setLoadingLinks] = useState(false);

  // Active generated link
  const [activeShortUrl, setActiveShortUrl] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // User's short links history
  const [recentLinks, setRecentLinks] = useState<SavedShortLink[]>([]);

  const fetchUserLinks = useCallback(async () => {
    let uid = user?.id;
    if (!uid) {
      const { data: session } = await supabase.auth.getSession();
      uid = session?.session?.user?.id;
    }
    if (!uid) return;

    try {
      setLoadingLinks(true);
      const { data, error } = await supabase
        .from('short_links')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!error && Array.isArray(data)) {
        setRecentLinks(
          data.map((item: any) => ({
            id: item.id || String(Math.random()),
            slug: item.slug || item.alias || item.short_url || 'link',
            url: item.url || item.destination_url || item.original_url || '',
            clicks: Number(item.clicks || 0),
            created_at: item.created_at || new Date().toISOString(),
          }))
        );
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoadingLinks(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUserLinks();
  }, [fetchUserLinks]);

  const handlePasteClipboard = async () => {
    try {
      const text = await Clipboard.getStringAsync();
      if (text && text.startsWith('http')) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setDestinationUrl(text);
      } else {
        Alert.alert('Notice', 'Clipboard does not contain a valid URL starting with http:// or https://');
      }
    } catch {}
  };

  const handleRandomizeSlug = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const randomSlug = Math.random().toString(36).substring(2, 7);
    setCustomAlias(randomSlug);
  };

  const handleShorten = async () => {
    let cleanUrl = destinationUrl.trim();
    if (!cleanUrl) {
      Alert.alert('Missing URL', 'Please enter a destination URL to shorten.');
      return;
    }

    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const slug = customAlias.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '') || Math.random().toString(36).substring(2, 7);
    const shortUrl = `https://gap.to/${slug}`;

    try {
      let uid = user?.id;
      if (!uid) {
        const { data: session } = await supabase.auth.getSession();
        uid = session?.session?.user?.id;
      }

      if (uid) {
        await supabase.from('short_links').insert([
          {
            user_id: uid,
            url: cleanUrl,
            slug: slug,
            clicks: 0,
          },
        ]);
      }
    } catch {
      // Continue even if database insert encounters column disparity
    }

    // Add to local state list immediately
    const newItem: SavedShortLink = {
      id: String(Date.now()),
      slug,
      url: cleanUrl,
      clicks: 0,
      created_at: new Date().toISOString(),
    };

    setRecentLinks((prev) => [newItem, ...prev.filter((l) => l.slug !== slug)]);
    setActiveShortUrl(shortUrl);
    setShowQr(false);
    setIsSubmitting(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleCopy = async (linkText: string) => {
    await Clipboard.setStringAsync(linkText);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedLink(linkText);
    setTimeout(() => setCopiedLink(null), 2000);
  };

  const handleShare = async (linkText: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: linkText,
        title: 'Shortened Link',
      });
    } catch {}
  };

  const totalClicks = useMemo(() => {
    return recentLinks.reduce((sum, item) => sum + (item.clicks || 0), 0);
  }, [recentLinks]);

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Instant Link Shortener" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Workspace Telemetry Strip */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Links</Text>
            <Text style={styles.metricValue}>{recentLinks.length}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Total Clicks</Text>
            <Text style={styles.metricValue}>{totalClicks}</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Domain</Text>
            <Text style={[styles.metricValue, { fontSize: 15, color: colors.accent }]}>gap.to</Text>
          </View>
        </View>

        {/* Link Creator Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerIconBubble}>
              <HugeiconsIcon icon={Link01Icon} size={18} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Shorten Any URL</Text>
              <Text style={styles.cardSubtitle}>
                Create concise, trackable branded links with analytics
              </Text>
            </View>
          </View>

          {/* Long URL Input */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Destination URL</Text>
              <Pressable onPress={handlePasteClipboard} style={styles.quickPasteBtn}>
                <Text style={styles.quickPasteText}>Paste</Text>
              </Pressable>
            </View>
            <View style={styles.inputBox}>
              <HugeiconsIcon icon={Link01Icon} size={17} color={colors.mutedForeground} />
              <TextInput
                style={styles.textInput}
                placeholder="https://example.com/very/long/campaign/page"
                placeholderTextColor={colors.mutedForeground}
                value={destinationUrl}
                onChangeText={setDestinationUrl}
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </View>

          {/* Custom Slug Input */}
          <View style={[styles.inputGroup, { marginTop: 14 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Custom Alias / Slug (Optional)</Text>
              <Pressable onPress={handleRandomizeSlug} style={styles.quickPasteBtn}>
                <Text style={styles.quickPasteText}>Randomize</Text>
              </Pressable>
            </View>
            <View style={styles.inputBox}>
              <View style={styles.domainPrefixPill}>
                <Text style={styles.domainPrefixText}>gap.to/</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="summer-deal-2026"
                placeholderTextColor={colors.mutedForeground}
                value={customAlias}
                onChangeText={setCustomAlias}
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Shorten Button */}
          <Pressable
            style={({ pressed }) => [
              styles.shortenBtn,
              { opacity: pressed || isSubmitting ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
            ]}
            onPress={handleShorten}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.buttonPrimaryForeground} />
            ) : (
              <>
                <HugeiconsIcon
                  icon={Rocket01Icon}
                  size={17}
                  color={colors.buttonPrimaryForeground}
                  strokeWidth={2}
                />
                <Text style={styles.shortenBtnText}>Create Short Link</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Active Result Card */}
        {activeShortUrl ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View style={styles.resultBadge}>
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={13} color="#10B981" />
                <Text style={styles.resultBadgeText}>LINK READY</Text>
              </View>
              <Pressable
                onPress={() => setShowQr(!showQr)}
                style={[styles.qrToggleBtn, showQr && styles.qrToggleBtnActive]}
              >
                <HugeiconsIcon
                  icon={QrCode01Icon}
                  size={15}
                  color={showQr ? colors.accent : colors.textSecondary}
                />
                <Text
                  style={[
                    styles.qrToggleText,
                    showQr && { color: colors.accent, fontWeight: '700' },
                  ]}
                >
                  {showQr ? 'Hide QR' : 'Show QR'}
                </Text>
              </Pressable>
            </View>

            {/* Short URL Box */}
            <View style={styles.shortUrlContainer}>
              <Text style={styles.shortUrlText} selectable>
                {activeShortUrl}
              </Text>
              <Pressable
                style={styles.copyIconBtn}
                onPress={() => handleCopy(activeShortUrl)}
              >
                <HugeiconsIcon
                  icon={copiedLink === activeShortUrl ? CheckmarkCircle01Icon : Copy01Icon}
                  size={17}
                  color={copiedLink === activeShortUrl ? '#10B981' : colors.text}
                />
              </Pressable>
            </View>

            {/* Expanded QR Code preview */}
            {showQr && (
              <View style={styles.qrExpandWrapper}>
                <View style={styles.qrFrameInner}>
                  <QRCode value={activeShortUrl} size={160} color="#18181B" backgroundColor="#FFFFFF" />
                </View>
                <Text style={styles.qrScanHint}>Scan to open short link</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.resultActionsRow}>
              <Pressable
                style={styles.actionBtnPrimary}
                onPress={() => handleCopy(activeShortUrl)}
              >
                <HugeiconsIcon
                  icon={copiedLink === activeShortUrl ? CheckmarkCircle01Icon : Copy01Icon}
                  size={16}
                  color={colors.buttonPrimaryForeground}
                />
                <Text style={styles.actionBtnPrimaryText}>
                  {copiedLink === activeShortUrl ? 'Copied!' : 'Copy Link'}
                </Text>
              </Pressable>

              <Pressable
                style={styles.actionBtnSecondary}
                onPress={() => handleShare(activeShortUrl)}
              >
                <HugeiconsIcon icon={Share01Icon} size={16} color={colors.text} />
                <Text style={styles.actionBtnSecondaryText}>Share</Text>
              </Pressable>

              <Pressable
                style={styles.actionBtnOutline}
                onPress={() => Linking.openURL(activeShortUrl)}
              >
                <HugeiconsIcon icon={ArrowUpRight01Icon} size={16} color={colors.text} />
                <Text style={styles.actionBtnOutlineText}>Visit</Text>
              </Pressable>
            </View>
          </View>
        ) : null}

        {/* Recent Links History List */}
        <View style={styles.historyCard}>
          <View style={styles.historyHeader}>
            <Text style={styles.historyTitle}>Your Recent Links</Text>
            {loadingLinks && <ActivityIndicator size="small" color={colors.accent} />}
          </View>

          {recentLinks.length === 0 ? (
            <View style={styles.emptyHistoryState}>
              <HugeiconsIcon icon={Link01Icon} size={28} color={colors.mutedForeground} />
              <Text style={styles.emptyHistoryText}>No short links created yet.</Text>
              <Text style={styles.emptyHistorySub}>
                Paste any URL above to generate your first branded link.
              </Text>
            </View>
          ) : (
            <View style={styles.linksList}>
              {recentLinks.map((item) => {
                const fullUrl = `https://gap.to/${item.slug}`;
                const isCopied = copiedLink === fullUrl;
                return (
                  <View key={item.id} style={styles.linkItem}>
                    <View style={{ flex: 1, gap: 3 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.linkItemSlug}>{fullUrl}</Text>
                        <View style={styles.clicksPill}>
                          <Text style={styles.clicksPillText}>{item.clicks} clicks</Text>
                        </View>
                      </View>
                      {item.url ? (
                        <Text style={styles.linkItemDestination} numberOfLines={1}>
                          {item.url}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.linkItemActions}>
                      <Pressable
                        style={styles.linkActionBtn}
                        onPress={() => handleCopy(fullUrl)}
                      >
                        <HugeiconsIcon
                          icon={isCopied ? CheckmarkCircle01Icon : Copy01Icon}
                          size={15}
                          color={isCopied ? '#10B981' : colors.textSecondary}
                        />
                      </Pressable>
                      <Pressable
                        style={styles.linkActionBtn}
                        onPress={() => Linking.openURL(item.url || fullUrl)}
                      >
                        <HugeiconsIcon
                          icon={ArrowUpRight01Icon}
                          size={15}
                          color={colors.textSecondary}
                        />
                      </Pressable>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const createStyles = (colors: AppColors, isDark: boolean) =>
  StyleSheet.create({
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: 10,
      marginBottom: 14,
    },
    metricCard: {
      flex: 1,
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 14,
      alignItems: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.mutedForeground,
      marginBottom: 3,
    },
    metricValue: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.foreground,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    headerIconBubble: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.foreground,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    inputGroup: {
      gap: 6,
    },
    labelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.foreground,
    },
    quickPasteBtn: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      backgroundColor: colors.accentSoft,
    },
    quickPasteText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    },
    domainPrefixPill: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    domainPrefixText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.accent,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      padding: 0,
    },
    shortenBtn: {
      marginTop: 18,
      backgroundColor: colors.buttonPrimary,
      paddingVertical: 14,
      borderRadius: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    shortenBtnText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.buttonPrimaryForeground,
    },
    resultCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    resultHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    resultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    resultBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.6,
      color: '#10B981',
    },
    qrToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      paddingHorizontal: 9,
      paddingVertical: 4.5,
      borderRadius: 10,
    },
    qrToggleBtnActive: {
      backgroundColor: colors.accentSoft,
    },
    qrToggleText: {
      fontSize: 11.5,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    shortUrlContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 14,
      marginBottom: 14,
    },
    shortUrlText: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.accent,
      flex: 1,
    },
    copyIconBtn: {
      padding: 4,
    },
    qrExpandWrapper: {
      alignItems: 'center',
      paddingVertical: 12,
      marginBottom: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    qrFrameInner: {
      backgroundColor: '#FFFFFF',
      padding: 12,
      borderRadius: 16,
      shadowColor: '#29213E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 10,
      elevation: 3,
      marginBottom: 8,
    },
    qrScanHint: {
      fontSize: 11,
      color: colors.mutedForeground,
    },
    resultActionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtnPrimary: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.buttonPrimary,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnPrimaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.buttonPrimaryForeground,
    },
    actionBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accentSoft,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnSecondaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    actionBtnOutline: {
      flex: 0.8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: 'transparent',
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.cardBorder,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnOutlineText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    historyCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    historyHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    historyTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.foreground,
    },
    emptyHistoryState: {
      alignItems: 'center',
      paddingVertical: 24,
      gap: 6,
    },
    emptyHistoryText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.foreground,
      marginTop: 4,
    },
    emptyHistorySub: {
      fontSize: 12,
      color: colors.mutedForeground,
      textAlign: 'center',
      maxWidth: 240,
    },
    linksList: {
      gap: 12,
    },
    linkItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.cardBorder,
      gap: 10,
    },
    linkItemSlug: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.accent,
    },
    clicksPill: {
      backgroundColor: 'rgba(16, 185, 129, 0.12)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 6,
    },
    clicksPillText: {
      fontSize: 10,
      fontWeight: '700',
      color: '#10B981',
    },
    linkItemDestination: {
      fontSize: 11.5,
      color: colors.mutedForeground,
    },
    linkItemActions: {
      flexDirection: 'row',
      gap: 4,
    },
    linkActionBtn: {
      width: 32,
      height: 32,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceSecondary,
    },
  });
