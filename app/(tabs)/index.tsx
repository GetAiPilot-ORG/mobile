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

  // Primary Automation Engines
  const ENGINES = [
    {
      id: 'telegram',
      name: 'Telegram Pilot',
      desc: 'Auto-forward feeds, bots & reactions',
      icon: 'paper-plane',
      iconBg: '#0088CC',
      route: '/products/telegram',
      status: hasTelegram ? 'Active' : 'Pro',
      isLive: hasTelegram,
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp Suite',
      desc: 'Broadcasts & 24/7 Meta API triggers',
      icon: 'logo-whatsapp',
      iconBg: '#25D366',
      route: '/products/whatsapp',
      status: hasWhatsApp ? 'Active' : 'Pro',
      isLive: hasWhatsApp,
    },
    {
      id: 'voice',
      name: 'Voice Pilot',
      desc: 'AI Voice calling agents & speech streaming',
      icon: 'mic',
      iconBg: '#8B5CF6',
      route: '/products/voice',
      status: hasVoice ? 'Active' : 'Pro',
      isLive: hasVoice,
    },
    {
      id: 'crm',
      name: 'Smart CRM',
      desc: 'Pipelines, deals & lead contact automation',
      icon: 'briefcase',
      iconBg: '#F59E0B',
      route: '/products/crm',
      status: hasCRM ? 'Active' : 'Pro',
      isLive: hasCRM,
    },
    {
      id: 'social',
      name: 'Social Pilot',
      desc: 'Cross-platform auto-poster & queue',
      icon: 'share-social',
      iconBg: '#E1306C',
      route: '/products/social',
      status: hasSocial ? 'Active' : 'Growth',
      isLive: hasSocial,
    },
    {
      id: 'activity',
      name: 'Connected Hub',
      desc: 'Multi-inbox chats & subscribers directory',
      icon: 'chatbubbles',
      iconBg: '#0284C7',
      route: '/(tabs)/activity',
      status: 'Live',
      isLive: true,
    },
  ];

  // Studio & Free Tools
  const TOOLS = [
    {
      id: 'qr',
      name: 'QR Generator',
      desc: 'Custom branded QR codes',
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
        {/* iOS Mobbin / Klarna Style Search Bar */}
        <View style={[styles.searchBarContainer, isDark && styles.searchBarContainerDark]}>
          <Ionicons name="search" size={18} color="#8E8E93" style={styles.searchIcon} />
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
              <Ionicons name="close-circle" size={18} color="#8E8E93" />
            </Pressable>
          ) : (
            <Ionicons name="options-outline" size={18} color="#8E8E93" />
          )}
        </View>

        {/* Hero Cards Carousel (Klarna Plus / Power Style) */}
        <View style={styles.heroRow}>
          {/* Card 1: Workspace Plan Status */}
          <Pressable
            style={[styles.heroCard, isDark && styles.heroCardDark]}
            onPress={() => {
              triggerHaptic();
              router.push('/account/plans' as any);
            }}
          >
            <View
              style={[
                styles.heroIconBox,
                { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.16)' : '#EBF5FF' },
              ]}
            >
              <Ionicons name="diamond" size={22} color="#0A84FF" />
            </View>
            <Text style={[styles.heroCardEyebrow, isDark && styles.heroCardEyebrowDark]}>
              Workspace Plan
            </Text>
            <Text style={[styles.heroCardTitle, isDark && styles.heroCardTitleDark]}>
              {planLabel || 'Free Plan'}
            </Text>
            <View style={styles.heroFooterRow}>
              <Text style={styles.heroBadgeText}>⚡ All AI engines active</Text>
            </View>
          </Pressable>

          {/* Card 2: Connected Bots Metric */}
          <Pressable
            style={[styles.heroCard, isDark && styles.heroCardDark]}
            onPress={() => {
              triggerHaptic();
              router.push('/(tabs)/products' as any);
            }}
          >
            <View
              style={[
                styles.heroIconBox,
                { backgroundColor: isDark ? 'rgba(22, 163, 74, 0.18)' : '#DCFCE7' },
              ]}
            >
              <Ionicons name="rocket" size={22} color="#16A34A" />
            </View>
            <Text style={[styles.heroCardEyebrow, isDark && styles.heroCardEyebrowDark]}>
              Automation Fleet
            </Text>
            <Text style={[styles.heroCardTitle, isDark && styles.heroCardTitleDark]}>
              5 Engines
            </Text>
            <View style={styles.heroFooterRow}>
              <Text style={[styles.heroBadgeText, { color: '#16A34A' }]}>
                ● Live & Running
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Category Pill Filters (Meetup Style) */}
        <View style={styles.filtersRow}>
          <Pressable
            style={[
              styles.filterPill,
              selectedFilter === 'all' && styles.filterPillActive,
              isDark && styles.filterPillDark,
              isDark && selectedFilter === 'all' && styles.filterPillActiveDark,
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('all');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'all' && styles.filterPillTextActive,
                isDark && styles.filterPillTextDark,
              ]}
            >
              All Engines
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              selectedFilter === 'bots' && styles.filterPillActive,
              isDark && styles.filterPillDark,
              isDark && selectedFilter === 'bots' && styles.filterPillActiveDark,
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('bots');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'bots' && styles.filterPillTextActive,
                isDark && styles.filterPillTextDark,
              ]}
            >
              Automation Hub
            </Text>
          </Pressable>

          <Pressable
            style={[
              styles.filterPill,
              selectedFilter === 'tools' && styles.filterPillActive,
              isDark && styles.filterPillDark,
              isDark && selectedFilter === 'tools' && styles.filterPillActiveDark,
            ]}
            onPress={() => {
              triggerHaptic();
              setSelectedFilter('tools');
            }}
          >
            <Text
              style={[
                styles.filterPillText,
                selectedFilter === 'tools' && styles.filterPillTextActive,
                isDark && styles.filterPillTextDark,
              ]}
            >
              Studio Tools
            </Text>
          </Pressable>
        </View>

        {/* SECTION 1: Automation Engines (Klarna 'Stores for you' Grid) */}
        {(selectedFilter === 'all' || selectedFilter === 'bots') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Automation Engines
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/(tabs)/products' as any);
                }}
              >
                <Text style={styles.sectionActionText}>View all →</Text>
              </Pressable>
            </View>

            {/* 3-Column Clean Icon Grid (Klarna App Style) */}
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
                  <View style={[styles.gridIconCircle, { backgroundColor: item.iconBg }]}>
                    <Ionicons name={item.icon as any} size={22} color="#FFFFFF" />
                  </View>
                  <Text
                    style={[styles.gridItemTitle, isDark && styles.gridItemTitleDark]}
                    numberOfLines={1}
                  >
                    {item.name.replace(' Pilot', '').replace(' Suite', '')}
                  </Text>
                  <Text
                    style={[
                      styles.gridItemStatus,
                      item.isLive ? styles.statusLive : styles.statusPro,
                    ]}
                  >
                    {item.status}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* SECTION 2: Studio & Free Tools (Klarna 'New to cashback' Style) */}
        {(selectedFilter === 'all' || selectedFilter === 'tools') && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
                Studio & Utilities
              </Text>
              <Pressable
                onPress={() => {
                  triggerHaptic();
                  router.push('/(tabs)/tools' as any);
                }}
              >
                <Text style={styles.sectionActionText}>Explore tools →</Text>
              </Pressable>
            </View>

            <View style={styles.toolsList}>
              {filteredTools.map((tool) => (
                <Pressable
                  key={tool.id}
                  style={[styles.toolRowCard, isDark && styles.toolRowCardDark]}
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
                  <Ionicons name="chevron-forward" size={18} color="#8E8E93" />
                </Pressable>
              ))}
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
    backgroundColor: '#F8F9FA',
  },
  scrollViewDark: {
    backgroundColor: '#000000',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 140,
  },
  scrollContentLight: {
    backgroundColor: '#F8F9FA',
  },
  scrollContentDark: {
    backgroundColor: '#000000',
  },
  avatarBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#0A84FF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // ─── Search Bar ───────────────────────────────────────────────
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingHorizontal: 14,
    height: 46,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchBarContainerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#000000',
    paddingVertical: 10,
  },
  searchInputDark: {
    color: '#FFFFFF',
  },
  // ─── Hero Cards (Klarna Style) ────────────────────────────────
  heroRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  heroCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heroCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  heroIconBox: {
    width: 40,
    height: 40,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  heroCardEyebrow: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  heroCardEyebrowDark: {
    color: '#8E8E93',
  },
  heroCardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.4,
    marginBottom: 6,
  },
  heroCardTitleDark: {
    color: '#FFFFFF',
  },
  heroFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0A84FF',
  },
  // ─── Filter Pills ─────────────────────────────────────────────
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterPillDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  filterPillActive: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  filterPillActiveDark: {
    backgroundColor: '#0A84FF',
    borderColor: '#0A84FF',
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterPillTextDark: {
    color: '#8E8E93',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // ─── Section Header ───────────────────────────────────────────
  sectionBlock: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#000000',
    letterSpacing: -0.3,
  },
  sectionTitleDark: {
    color: '#FFFFFF',
  },
  sectionActionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A84FF',
  },
  // ─── 3-Column Grid ────────────────────────────────────────────
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  gridContainerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  gridItem: {
    width: '33.33%',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  gridIconCircle: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  gridItemTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 2,
  },
  gridItemTitleDark: {
    color: '#FFFFFF',
  },
  gridItemStatus: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  statusLive: {
    color: '#16A34A',
  },
  statusPro: {
    color: '#0A84FF',
  },
  // ─── Tools Row List ───────────────────────────────────────────
  toolsList: {
    gap: 10,
  },
  toolRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  toolRowCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  toolIconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolInfo: {
    flex: 1,
  },
  toolName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  toolNameDark: {
    color: '#FFFFFF',
  },
  toolDesc: {
    fontSize: 12,
    color: '#6B7280',
  },
  toolDescDark: {
    color: '#8E8E93',
  },
});
