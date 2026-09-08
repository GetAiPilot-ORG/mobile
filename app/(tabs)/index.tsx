import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  useColorScheme,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useAuth } from '../../src/contexts/AuthContext';
import { usePlatformSubscription } from '../../src/hooks/usePlatformSubscription';
import { supabase } from '../../src/lib/supabase';
import * as Haptics from 'expo-haptics';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user } = useAuth();
  const { planLabel, hasTelegram, hasWhatsApp, hasVoice, hasCRM, hasSocial, refresh: refreshSub } =
    usePlatformSubscription();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'bots' | 'tools'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Real Workspace Telemetry from Supabase
  const { data: telemetry, refetch: refetchTelemetry } = useQuery({
    queryKey: ['workspace-telemetry-ios', user?.id],
    queryFn: async () => {
      if (!user?.id) return { landingPagesCount: 0, quickFormsCount: 0, shortLinksCount: 0, botsCount: 0 };
      try {
        const [pagesRes, formsRes, linksRes] = await Promise.all([
          supabase.from('landing_pages').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('quick_forms').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('short_links').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);
        return {
          landingPagesCount: pagesRes.count || 0,
          quickFormsCount: formsRes.count || 0,
          shortLinksCount: linksRes.count || 0,
          botsCount: 5,
        };
      } catch {
        return { landingPagesCount: 0, quickFormsCount: 0, shortLinksCount: 0, botsCount: 5 };
      }
    },
  });

  const onRefresh = async () => {
    setIsRefreshing(true);
    refreshSub();
    await refetchTelemetry();
    setIsRefreshing(false);
  };

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const displayName =
    user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'AI Pilot';

  // Primary Automation Engines (Bundled Native Logos)
  const ENGINES = [
    {
      id: 'telegram',
      name: 'Telegram',
      desc: 'Auto-forward feeds, bots & reactions',
      logo: require('../../assets/images/products/telegram.png'),
      iconBg: '#0088CC',
      route: '/products/telegram',
      status: hasTelegram ? 'Active' : 'Pro',
      isLive: hasTelegram,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      desc: 'Broadcasts & 24/7 Meta API triggers',
      logo: require('../../assets/images/products/whatsapp.png'),
      iconBg: '#25D366',
      route: '/products/whatsapp',
      status: hasWhatsApp ? 'Active' : 'Pro',
      isLive: hasWhatsApp,
    },
    {
      id: 'voice',
      name: 'Voice AI',
      desc: 'AI Voice calling agents & speech streaming',
      logo: require('../../assets/images/products/voice.png'),
      iconBg: '#8B5CF6',
      route: '/products/voice',
      status: hasVoice ? 'Active' : 'Pro',
      isLive: hasVoice,
    },
    {
      id: 'crm',
      name: 'Smart CRM',
      desc: 'Pipelines, deals & lead contact automation',
      logo: require('../../assets/images/products/crm.png'),
      iconBg: '#F59E0B',
      route: '/products/crm',
      status: hasCRM ? 'Active' : 'Pro',
      isLive: hasCRM,
    },
    {
      id: 'social',
      name: 'Social Pilot',
      desc: 'Cross-platform auto-poster & queue',
      logo: require('../../assets/images/products/social.png'),
      iconBg: '#E1306C',
      route: '/products/social',
      status: hasSocial ? 'Active' : 'Growth',
      isLive: hasSocial,
    },
    {
      id: 'activity',
      name: 'Connected Hub',
      desc: 'Multi-inbox chats & subscribers directory',
      logo: require('../../assets/images/icon.png'),
      iconBg: '#0284C7',
      route: '/(tabs)/activity',
      status: 'Live',
      isLive: true,
    },
  ];

  // Studio & Free Utilities
  const TOOLS = [
    {
      id: 'qr',
      name: 'QR Generator',
      desc: 'Custom branded vectors & logos',
      icon: 'qr-code',
      iconBg: '#4F46E5',
      route: '/tools/qr-code',
    },
    {
      id: 'links',
      name: 'Link Shortener',
      desc: 'Custom slugs with click analytics',
      icon: 'link',
      iconBg: '#0284C7',
      route: '/tools/link-shortener',
    },
    {
      id: 'bio',
      name: 'Bio Builder',
      desc: 'Mobile bio link landing pages',
      icon: 'phone-portrait',
      iconBg: '#EC4899',
      route: '/tools/bio-templates',
    },
    {
      id: 'forms',
      name: 'QuickForms',
      desc: 'Conversational lead intake funnels',
      icon: 'document-text',
      iconBg: '#0D9488',
      route: '/tools/quick-forms',
    },
    {
      id: 'speech',
      name: 'Speech to Text',
      desc: 'AI audio transcription engine',
      icon: 'volume-high',
      iconBg: '#7C3AED',
      route: '/tools/speech-to-text',
    },
    {
      id: 'audit',
      name: 'Website Audit',
      desc: 'SEO & Core Web Vitals health score',
      icon: 'speedometer',
      iconBg: '#059669',
      route: '/tools/website-audit',
    },
  ];

  const filteredEngines = ENGINES.filter(
    (e) =>
      e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredTools = TOOLS.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.desc.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppScreen safeArea={false}>
      {/* Top Header */}
      <AppTopBar
        rightElement={
          <Pressable
            style={styles.avatarBtn}
            onPress={() => {
              triggerHaptic();
              router.push('/(tabs)/account' as any);
            }}
          >
            <Text style={styles.avatarBtnText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        }
      />

      <ScrollView
        style={[styles.scrollView, isDark ? styles.scrollViewDark : styles.scrollViewLight]}
        contentContainerStyle={[
          styles.scrollContent,
          isDark ? styles.scrollContentDark : styles.scrollContentLight,
        ]}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#0A84FF" />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* iOS Native Search Field */}
        <View style={[styles.searchBarContainer, isDark && styles.searchBarContainerDark]}>
          <Ionicons name="search" size={16} color="#8E8E93" style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, isDark && styles.searchInputDark]}
            placeholder="Search bots, automation & tools..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color="#8E8E93" />
            </Pressable>
          ) : (
            <Ionicons name="options-outline" size={16} color="#8E8E93" />
          )}
        </View>

        {/* Dual Telemetry Widgets (Apple Inset Dual Cards) */}
        <View style={styles.heroRow}>
          <Pressable
            style={[styles.heroCard, isDark && styles.heroCardDark]}
            onPress={() => {
              triggerHaptic();
              router.push('/account/plans' as any);
            }}
          >
            <View style={styles.heroCardHeader}>
              <View style={[styles.heroIconBox, { backgroundColor: 'rgba(10, 132, 255, 0.15)' }]}>
                <Ionicons name="diamond" size={18} color="#0A84FF" />
              </View>
              <Text style={styles.heroChevron}>›</Text>
            </View>
            <Text style={[styles.heroCardEyebrow, isDark && styles.heroCardEyebrowDark]}>
              WORKSPACE PLAN
            </Text>
            <Text style={[styles.heroCardTitle, isDark && styles.heroCardTitleDark]}>
              {planLabel || 'GAP Pro Max'}
            </Text>
            <View style={styles.heroFooterRow}>
              <Text style={styles.heroBadgeActive}>⚡ All engines active</Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.heroCard, isDark && styles.heroCardDark]}
            onPress={() => {
              triggerHaptic();
              router.push('/(tabs)/products' as any);
            }}
          >
            <View style={styles.heroCardHeader}>
              <View style={[styles.heroIconBox, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}>
                <Ionicons name="rocket" size={18} color="#30D158" />
              </View>
              <Text style={styles.heroChevron}>›</Text>
            </View>
            <Text style={[styles.heroCardEyebrow, isDark && styles.heroCardEyebrowDark]}>
              AUTOMATION FLEET
            </Text>
            <Text style={[styles.heroCardTitle, isDark && styles.heroCardTitleDark]}>
              5 Engines
            </Text>
            <View style={styles.heroFooterRow}>
              <View style={styles.greenDot} />
              <Text style={styles.heroBadgeLive}>Live & Running</Text>
            </View>
          </Pressable>
        </View>

        {/* iOS Native Segmented Filter Bar */}
        <View style={[styles.segmentedTrack, isDark && styles.segmentedTrackDark]}>
          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === 'all' && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActive),
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('all');
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === 'all' && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActive),
              ]}
            >
              All Engines
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === 'bots' && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActive),
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('bots');
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === 'bots' && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActive),
              ]}
            >
              Automation Hub
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.segmentedTab,
              selectedFilter === 'tools' && (isDark ? styles.segmentedTabActiveDark : styles.segmentedTabActive),
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('tools');
            }}
          >
            <Text
              style={[
                styles.segmentedTabText,
                selectedFilter === 'tools' && (isDark ? styles.segmentedTabTextActiveDark : styles.segmentedTabTextActive),
              ]}
            >
              Studio Tools
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: Automation Engines */}
        {(selectedFilter === 'all' || selectedFilter === 'bots') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>AUTOMATION ENGINES</Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/(tabs)/products' as any);
                }}
              >
                <Text style={styles.sectionActionText}>See All ›</Text>
              </Pressable>
            </View>

            {/* Inset Grouped Icon Grid */}
            <View style={[styles.gridContainer, isDark && styles.gridContainerDark]}>
              {filteredEngines.map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.gridItem}
                  onPress={() => {
                    triggerHaptic();
                    router.push(item.route as any);
                  }}
                >
                  <Image
                    source={item.logo}
                    style={styles.gridLogoImage}
                    resizeMode="contain"
                  />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 2: Studio & Utilities (Apple HIG Inset Grouped List) */}
        {(selectedFilter === 'all' || selectedFilter === 'tools') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>STUDIO & UTILITIES</Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/(tabs)/tools' as any);
                }}
              >
                <Text style={styles.sectionActionText}>Explore Tools ›</Text>
              </Pressable>
            </View>

            {/* Apple HIG Inset Grouped Unified Card with Hairline Dividers */}
            <View style={[styles.groupedListContainer, isDark && styles.groupedListContainerDark]}>
              {filteredTools.map((tool, index) => {
                const isLast = index === filteredTools.length - 1;
                return (
                  <View key={tool.id}>
                    <Pressable
                      style={styles.groupedListItem}
                      onPress={() => {
                        triggerHaptic();
                        router.push(tool.route as any);
                      }}
                    >
                      <View style={[styles.toolIconBox, { backgroundColor: tool.iconBg }]}>
                        <Ionicons name={tool.icon as any} size={18} color="#FFFFFF" />
                      </View>
                      <View style={styles.toolInfo}>
                        <Text style={[styles.toolName, isDark && styles.toolNameDark]}>
                          {tool.name}
                        </Text>
                        <Text style={[styles.toolDesc, isDark && styles.toolDescDark]} numberOfLines={1}>
                          {tool.desc}
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={17} color="#8E8E93" />
                    </Pressable>
                    {!isLast && <View style={[styles.hairlineDivider, isDark && styles.hairlineDividerDark]} />}
                  </View>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollViewLight: {
    backgroundColor: '#F2F2F7',
  },
  scrollViewDark: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 130,
  },
  scrollContentLight: {
    backgroundColor: '#F2F2F7',
  },
  scrollContentDark: {
    backgroundColor: '#000000',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  // ─── iOS Native Search Field ───────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3E3E8',
    borderRadius: 12,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 16,
  },
  searchBarContainerDark: {
    backgroundColor: '#1C1C1E',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#2C2C2E',
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 6,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  // ─── Dual Telemetry Widgets ────────────────────────────────────
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  heroCardDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  heroCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  heroIconBox: {
    width: 32,
    height: 32,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroChevron: {
    fontSize: 16,
    color: '#8E8E93',
    fontWeight: '600',
  },
  heroCardEyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: '#8E8E93',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  heroCardEyebrowDark: {
    color: '#8E8E93',
  },
  heroCardTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroCardTitleDark: {
    color: '#FFFFFF',
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroBadgeActive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0A84FF',
  },
  greenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#30D158',
  },
  heroBadgeLive: {
    fontSize: 11,
    fontWeight: '700',
    color: '#30D158',
  },
  // ─── iOS Native Segmented Track ────────────────────────────────
  segmentedTrack: {
    flexDirection: 'row',
    backgroundColor: '#E3E3E8',
    borderRadius: 10,
    padding: 3,
    marginBottom: 22,
  },
  segmentedTrackDark: {
    backgroundColor: '#161B22',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#262C36',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentedTabActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  segmentedTabActiveDark: {
    backgroundColor: '#262C36',
  },
  segmentedTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8E8E93',
  },
  segmentedTabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  segmentedTabTextActiveDark: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // ─── Section Header (Apple HIG Style) ──────────────────────────
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0A84FF',
  },
  // ─── Inset Grouped Grid ────────────────────────────────────────
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 6,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
  },
  gridContainerDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  gridItem: {
    width: '33.33%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  gridLogoImage: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  // ─── Inset Grouped List (Apple HIG Settings Style) ─────────────
  groupedListContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  groupedListContainerDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
  },
  groupedListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  toolIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: -0.2,
    marginBottom: 1,
  },
  toolNameDark: {
    color: '#FFFFFF',
  },
  toolDesc: {
    fontSize: 11.5,
    color: '#6B7280',
  },
  toolDescDark: {
    color: '#8E8E93',
  },
  hairlineDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E5E7EB',
    marginLeft: 58,
  },
  hairlineDividerDark: {
    backgroundColor: '#262C36',
  },
});
