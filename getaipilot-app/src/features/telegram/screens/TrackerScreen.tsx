import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatCard } from '../components/ui/StatCard';
import { ProductHeading } from "@/components/ProductUI";
import { TelegramToolKey } from '../types';

type TrackerSection = 'joins' | 'connect' | 'links';

interface TrackerScreenProps {
  botsList: any[];
  trackerDash: any;
  trackerLinks: any[];
  onOpenModal: (key: TelegramToolKey) => void;
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({ botsList, trackerDash, trackerLinks, onOpenModal }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [trackerSection, setTrackerSection] = useState<TrackerSection>('joins');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'All' | 'Active' | 'Bot Start' | 'Leave' | 'Pending'>('All');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);
  const [visibleLimit, setVisibleLimit] = useState(25);

  const card = { backgroundColor: colors.card, borderColor: colors.cardBorder };
  const txt = { color: colors.text };
  const border = { borderColor: colors.cardBorder };

  const filteredUsers = useMemo(() => {
    const list = trackerDash?.newUsers || [];
    const q = userSearch.trim().toLowerCase();
    if (!q && userFilter === 'All') return list;

    return list.filter((u: any) => {
      const nameStr = (u.name || u.first_name || '').toLowerCase();
      const chanStr = (u.channel_name || '').toLowerCase();
      const matchesSearch =
        !q ||
        nameStr.includes(q) ||
        chanStr.includes(q) ||
        String(u.telegram_user_id || '').includes(q);
      const matchesFilter = userFilter === 'All' || u.status === userFilter;
      return matchesSearch && matchesFilter;
    });
  }, [trackerDash?.newUsers, userSearch, userFilter]);

  const displayedUsers = useMemo(() => {
    return filteredUsers.slice(0, visibleLimit);
  }, [filteredUsers, visibleLimit]);

  const handleCopyLink = async (url: string, id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Active': return { bg: 'rgba(16,185,129,0.12)', text: '#10B981', border: 'rgba(16,185,129,0.25)' };
      case 'Bot Start': return { bg: 'rgba(37,99,235,0.12)', text: '#2563EB', border: 'rgba(37,99,235,0.25)' };
      case 'Leave': return { bg: 'rgba(239,68,68,0.12)', text: '#EF4444', border: 'rgba(239,68,68,0.25)' };
      default: return { bg: 'rgba(245,158,11,0.12)', text: '#F59E0B', border: 'rgba(245,158,11,0.25)' };
    }
  };

  const kpis = trackerDash?.kpis || { totalJoins: 0, todaysJoins: 0, thisMonthJoins: 0, botStarts: 0, pendingJoins: 0, conversionRate: 0 };

  const TRACKER_CATEGORIES: { key: TrackerSection; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number | null }[] = [
    { key: 'joins', label: 'Analytics & Events', icon: 'analytics-outline', count: (trackerDash?.channels || []).length },
    { key: 'connect', label: 'Connected Bots', icon: 'hardware-chip-outline', count: botsList.length },
    { key: 'links', label: 'Join Links', icon: 'globe-outline', count: (trackerLinks || []).length },
  ];

  const kpiItems = [
    { label: 'TOTAL JOINS', value: kpis.totalJoins, color: '#0284C7', icon: 'people', bg: 'rgba(2,132,199,0.12)', tab: 'joins', sub: 'Channel members' },
    { label: "TODAY'S JOINS", value: `+${kpis.todaysJoins}`, color: '#10B981', icon: 'calendar', bg: 'rgba(16,185,129,0.12)', tab: 'joins', sub: 'New joins today' },
    { label: 'THIS MONTH', value: `+${kpis.thisMonthJoins}`, color: '#06B6D4', icon: 'calendar-outline', bg: 'rgba(6,182,212,0.12)', tab: 'joins', sub: 'New this month' },
    { label: 'BOT STARTS', value: kpis.botStarts, color: '#8B5CF6', icon: 'sparkles', bg: 'rgba(139,92,246,0.12)', tab: 'connect', sub: 'Bot interactions' },
    { label: 'PENDING JOINS', value: kpis.pendingJoins, color: '#F59E0B', icon: 'time', bg: 'rgba(245,158,11,0.12)', tab: 'joins', sub: 'Started not joined' },
    { label: 'CONVERSION', value: `${kpis.conversionRate}%`, color: '#EC4899', icon: 'trending-up', bg: 'rgba(236,72,153,0.12)', tab: 'links', sub: 'Starts to joins' },
  ];

  const itemsPerRow = isTablet ? 3 : 2;
  const kpiRows: (typeof kpiItems)[] = [];
  for (let i = 0; i < kpiItems.length; i += itemsPerRow) {
    kpiRows.push(kpiItems.slice(i, i + itemsPerRow));
  }

  return (
    <>
      {/* HERO: Command Center (Responsive Header with Telegram Graphic) */}
      <ProductHeading title="Join tracker" action="Manage tracker" onAction={() => onOpenModal('tracker')} />

      {/* 6 KPI Cards in Responsive Rows */}
      <View
        className="w-full pt-3 mt-1 gap-2 self-stretch mb-3.5"
        style={{ borderTopColor: isDark ? '#27272A' : '#E9E6F2' }}
      >
        {kpiRows.map((row, rowIndex) => (
          <View key={rowIndex} className="flex-row w-full gap-2.5 self-stretch mb-2.5">
            {row.map((m, colIndex) => (
              <View key={colIndex} className="flex-1 min-w-0" style={{ flexBasis: 0 }}>
                <StatCard
                  label={m.label}
                  value={m.value}
                  icon={m.icon}
                  color={m.color}
                  bg={m.bg}
                  sub={m.sub}
                  onPress={() => {
                    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setTrackerSection(m.tab as TrackerSection);
                  }}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Category Filter Tabs (Overview Screen Style) */}
      <View className="mb-3.5 p-2.5 rounded-xl" style={{ backgroundColor: colors.backgroundSecondary }}>
        <Text className="text-[15px] font-medium mb-2.5" style={{ color: colors.text }}>
          Tracker Controls & Modules ({TRACKER_CATEGORIES.length})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {TRACKER_CATEGORIES.map((cat) => {
            const isSelected = trackerSection === cat.key;
            return (
              <Pressable
                key={cat.key}
                className={`flex-row items-center gap-1.5 px-3 py-[7px] rounded-full border ${isSelected
                  ? 'bg-[#E7DEFA] border-transparent'
                  : isDark
                    ? 'bg-[#121212] border-[#27272A]'
                    : 'bg-[#F5F3FB] border-[#E9E6F2]'
                  }`}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTrackerSection(cat.key);
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#6C55C5' : isDark ? '#94A3B8' : '#64748B'}
                />
                <Text
                  className={`text-xs ${isSelected ? 'text-[#6C55C5] font-medium' : 'font-semibold'}`}
                  style={isSelected ? undefined : { color: colors.text }}
                >
                  {cat.label}
                  {cat.count !== undefined && cat.count !== null ? ` (${cat.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* SECTION 1: ANALYTICS & EVENTS */}
      {trackerSection === 'joins' && (
        <View style={{ gap: 14 }}>
          {/* Channel & Links Breakdown */}
          <View style={[styles.sectionCard, card]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
                <Ionicons name="newspaper-outline" size={15} color="#0284C7" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Channel & Links Breakdown</Text>
                <Text style={styles.sectionSub} numberOfLines={1}>
                  {(trackerDash?.channels || []).length} channels actively monitored
                </Text>
              </View>
              {trackerDash?.period?.startDate && (
                <View style={styles.periodBadge}>
                  <Text style={styles.periodBadgeText}>
                    {trackerDash?.period?.startDate} - {trackerDash?.period?.endDate}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ marginTop: 8 }}>
              {(trackerDash?.channels || []).length === 0 ? (
                <View style={styles.emptyCardInner}>
                  <Ionicons name="bar-chart-outline" size={26} color="#0284C7" style={{ marginBottom: 6 }} />
                  <Text style={[styles.emptyCardTitle, txt]}>No Channel Activity Data</Text>
                  <Text style={styles.emptyCardSub}>
                    Connect your Telegram bot and add it to channels to start tracking member flows.
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={trackerDash?.channels || []}
                  keyExtractor={(chan: any) => String(chan.channel_id)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                  renderItem={({ item: chan }: { item: any }) => (
                    <View style={[styles.chanCard, { backgroundColor: colors.backgroundSecondary }]}>
                      <View style={styles.chanCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                          <Ionicons name="megaphone-outline" size={14} color="#0284C7" />
                          <Text style={[styles.chanName, txt]} numberOfLines={1}>{chan.channel_name}</Text>
                        </View>
                        <View style={styles.periodPill}>
                          <Text style={styles.periodPillText}>+{chan.period_joins} Joins (7 Days)</Text>
                        </View>
                      </View>
                      <View style={styles.chanStats}>
                        {[
                          { label: 'JOINED', val: chan.joined, color: txt },
                          { label: 'PERIOD', val: `+${chan.period_joins}`, color: { color: '#10B981' } },
                          { label: 'LEFT', val: chan.left, color: { color: '#EF4444' } },
                          { label: 'ALL ACTIVE', val: chan.all_active, color: { color: '#0284C7' } },
                        ].map((s, idx) => (
                          <View key={idx} style={styles.chanStatItem}>
                            <Text style={styles.chanStatLbl}>{s.label}</Text>
                            <Text style={[styles.chanStatVal, s.color as any]}>{s.val}</Text>
                          </View>
                        ))}
                      </View>
                      {chan.links && chan.links.length > 0 && (
                        <View style={styles.linksWrap}>
                          <FlatList
                            data={chan.links || []}
                            keyExtractor={(link: any) => String(link.id)}
                            scrollEnabled={false}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            ItemSeparatorComponent={() => <View style={{ width: 8 }} />}
                            renderItem={({ item: link }: { item: any }) => (
                              <View style={[styles.linkPill, { backgroundColor: isDark ? 'rgba(2,132,199,0.15)' : 'rgba(2,132,199,0.08)' }]}>
                                <Ionicons name="link-outline" size={12} color="#0284C7" />
                                <Text style={[styles.linkPillTitle, txt]} numberOfLines={1}>{link.title}</Text>
                                <View style={styles.linkPillBadge}>
                                  <Text style={styles.linkPillBadgeText}>+{link.joins} joins</Text>
                                </View>
                              </View>
                            )}
                          />
                        </View>
                      )}
                    </View>
                  )}
                />
              )}
            </View>
          </View>

          {/* New Users Event Stream */}
          <View style={[styles.sectionCard, card]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <Ionicons name="people-outline" size={15} color="#10B981" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>New Users Stream</Text>
                <Text style={styles.sectionSub} numberOfLines={1}>{filteredUsers.length} total events captured</Text>
              </View>
            </View>

            {/* Search Bar */}
            <View style={[styles.searchBar, { backgroundColor: colors.backgroundSecondary }]}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={[styles.searchInput, txt]}
                placeholder="Search by name, ID or channel..."
                placeholderTextColor="#94A3B8"
                value={userSearch}
                onChangeText={setUserSearch}
              />
              {userSearch.length > 0 && (
                <Pressable onPress={() => setUserSearch('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </Pressable>
              )}
            </View>

            {/* Filter Pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {(['All', 'Active', 'Bot Start', 'Leave', 'Pending'] as const).map((st) => (
                  <Pressable
                    key={st}
                    style={[
                      styles.filterPill,
                      userFilter === st
                        ? styles.filterPillActive
                        : { backgroundColor: colors.backgroundSecondary, borderColor: 'transparent' },
                    ]}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setUserFilter(st);
                    }}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        userFilter === st ? styles.filterPillTextActive : txt,
                      ]}
                    >
                      {st}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            {/* Virtualized User Event List */}
            <FlatList
              data={displayedUsers}
              keyExtractor={(user: any, index: number) => String(user.id || user.telegram_user_id || `u_${index}`)}
              scrollEnabled={false}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
              renderItem={({ item: user }: { item: any }) => {
                const sc = statusColor(user.status);
                const userNameStr = user.name || user.first_name || 'User';
                return (
                  <View style={[styles.userRow, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>{userNameStr.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.userName, txt]} numberOfLines={1}>{userNameStr}</Text>
                        <Text style={styles.userSub} numberOfLines={1}>
                          ID: {user.telegram_user_id || 'N/A'} • {user.channel_name || 'Channel'}
                        </Text>
                        <Text style={styles.userTime}>{user.time_ago || 'Recent'}</Text>
                      </View>
                    </View>
                    <View style={[styles.statusPill, { backgroundColor: sc.bg, borderColor: sc.border }]}>
                      <Text style={[styles.statusPillText, { color: sc.text }]}>{user.status}</Text>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyCardInner}>
                  <Ionicons name="search-outline" size={24} color="#94A3B8" style={{ marginBottom: 4 }} />
                  <Text style={[styles.emptyCardTitle, txt]}>No Events Found</Text>
                  <Text style={styles.emptyCardSub}>Try adjusting your filter or search keywords.</Text>
                </View>
              }
              ListFooterComponent={
                filteredUsers.length > visibleLimit ? (
                  <Pressable
                    style={styles.loadMoreBtn}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setVisibleLimit((prev) => prev + 25);
                    }}
                  >
                    <Text style={styles.loadMoreBtnText}>
                      Show More ({filteredUsers.length - visibleLimit} remaining)
                    </Text>
                    <Ionicons name="chevron-down" size={14} color="#0284C7" />
                  </Pressable>
                ) : null
              }
            />
          </View>
        </View>
      )}

      {/* SECTION 2: CONNECTED BOTS */}
      {trackerSection === 'connect' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
              <Ionicons name="hardware-chip-outline" size={15} color="#0284C7" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Connected Bots</Text>
              <Text style={styles.sectionSub} numberOfLines={1}>{botsList.length} bots mapped to channels</Text>
            </View>
            <Pressable
              style={styles.addMiniBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenModal('tracker');
              }}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
              <Text style={styles.addMiniBtnText}>Connect Bot</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 8 }}>
            {botsList.length === 0 ? (
              <View style={styles.emptyCardInner}>
                <Ionicons name="hardware-chip-outline" size={32} color="#0284C7" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyCardTitle, txt]}>No Bots Connected</Text>
                <Text style={styles.emptyCardSub}>
                  Connect your Telegram bot to track joins and generate deep tracking links.
                </Text>
                <Pressable
                  style={[styles.primaryBtn, { marginTop: 12 }]}
                  onPress={() => onOpenModal('tracker')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Connect First Bot</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={botsList}
                keyExtractor={(bot: any) => String(bot.id || bot.bot_username)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item: bot }: { item: any }) => (
                  <View style={[styles.botCard, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <View style={styles.botAvatar}>
                        <Text style={styles.botAvatarText}>{(bot.bot_name || 'B').charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.botTitle, txt]} numberOfLines={1}>{bot.bot_name}</Text>
                          <View style={styles.activePill}>
                            <Text style={styles.activePillText}>{bot.status || 'ACTIVE'}</Text>
                          </View>
                        </View>
                        <Text style={styles.botUsername}>@{bot.bot_username}</Text>
                      </View>
                      <Pressable
                        style={styles.createLinkBtn}
                        onPress={() => {
                          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          onOpenModal('tracker');
                        }}
                      >
                        <Text style={styles.createLinkBtnText}>Create Link</Text>
                      </Pressable>
                    </View>
                    <View style={[styles.mappedRow, border]}>
                      <Text style={styles.mappedLabel}>MAPPED CHANNELS:</Text>
                      {bot.channel_name ? (
                        <View style={styles.channelTag}>
                          <Ionicons name="radio-button-on" size={10} color="#059669" />
                          <Text style={styles.channelTagText} numberOfLines={1}>{bot.channel_name}</Text>
                        </View>
                      ) : (
                        <Text style={{ fontSize: 11, color: '#94A3B8' }}>No channels mapped</Text>
                      )}
                    </View>
                  </View>
                )}
              />
            )}
          </View>
        </View>
      )}

      {/* SECTION 3: JOIN LINKS */}
      {trackerSection === 'links' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(6,182,212,0.12)' }]}>
              <Ionicons name="globe-outline" size={15} color="#06B6D4" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Tracking Links</Text>
              <Text style={styles.sectionSub} numberOfLines={1}>{(trackerLinks || []).length} deep join links created</Text>
            </View>
            <Pressable
              style={styles.addMiniBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenModal('tracker');
              }}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
              <Text style={styles.addMiniBtnText}>Create Link</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 8 }}>
            {(trackerLinks || []).length === 0 ? (
              <View style={styles.emptyCardInner}>
                <Ionicons name="link-outline" size={32} color="#0284C7" style={{ marginBottom: 8 }} />
                <Text style={[styles.emptyCardTitle, txt]}>No Tracking Links</Text>
                <Text style={styles.emptyCardSub}>
                  Create customized invite links for marketing campaigns and monitor conversion rates.
                </Text>
                <Pressable
                  style={[styles.primaryBtn, { marginTop: 12 }]}
                  onPress={() => onOpenModal('tracker')}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.primaryBtnText}>Create First Link</Text>
                </Pressable>
              </View>
            ) : (
              <FlatList
                data={trackerLinks}
                keyExtractor={(link: any, idx: number) => String(link.id || idx)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                renderItem={({ item: link, index: idx }: { item: any; index: number }) => {
                  const linkTitle = link.name || link.title || 'Tracking Link';
                  const botUsername = link.bot?.bot_username || link.bot_username || '';
                  const channelName = link.channel_mapping?.channel_name || link.channel_name || (link.bot?.bot_name ? `${link.bot.bot_name}` : '');
                  const users = link.users || [];
                  const starts = users.length > 0 ? users.length : (link.bot_starts ?? 0);
                  const joined = users.length > 0 ? users.filter((u: any) => (u.joined_channel || u.status === 'Active') && !u.left_channel).length : (link.joined ?? 0);
                  const convRate = starts > 0 ? Math.round((joined / starts) * 100) : (link.conversion_rate ?? 0);
                  const copyUrl = link.deep_link_url || (botUsername ? `https://t.me/${botUsername}?start=${link.slug}` : `https://t.me?start=${link.slug}`);
                  const linkId = link.id || String(idx);

                  return (
                    <View style={[styles.botCard, { backgroundColor: colors.backgroundSecondary }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text style={[styles.botTitle, txt]} numberOfLines={1}>{linkTitle}</Text>
                          <Text style={styles.botUsername} numberOfLines={1}>
                            {channelName ? `${channelName} ` : ''}{botUsername ? `@${botUsername}` : ''}
                          </Text>
                          {link.is_auto_fetched ? (
                            <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }}>
                              <View style={{ backgroundColor: 'rgba(2,132,199,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 }}>
                                <Text style={{ fontSize: 9, color: '#0284C7', fontWeight: '700' }}>Auto-Fetched from Telegram</Text>
                              </View>
                            </View>
                          ) : null}
                        </View>
                        <Pressable
                          style={[
                            styles.createLinkBtn,
                            copiedLinkId === linkId && { backgroundColor: 'rgba(16,185,129,0.15)' },
                          ]}
                          onPress={() => handleCopyLink(copyUrl, linkId)}
                        >
                          <Ionicons
                            name={copiedLinkId === linkId ? 'checkmark-circle' : 'copy-outline'}
                            size={13}
                            color={copiedLinkId === linkId ? '#10B981' : '#0284C7'}
                          />
                          <Text
                            style={[
                              styles.createLinkBtnText,
                              copiedLinkId === linkId && { color: '#10B981' },
                            ]}
                          >
                            {copiedLinkId === linkId ? 'Copied' : 'Copy Link'}
                          </Text>
                        </Pressable>
                      </View>
                      <View
                        style={{
                          flexDirection: 'row',
                          gap: 10,
                          marginTop: 10,
                          paddingTop: 8,
                          borderTopWidth: 1,
                          borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : '#E9E6F2',
                        }}
                      >
                        <View style={styles.statPillSmall}>
                          <Text style={styles.statPillLabel}>Starts</Text>
                          <Text style={[styles.statPillVal, { color: '#0284C7' }]}>{starts}</Text>
                        </View>
                        <View style={styles.statPillSmall}>
                          <Text style={styles.statPillLabel}>Joins</Text>
                          <Text style={[styles.statPillVal, { color: '#10B981' }]}>{joined}</Text>
                        </View>
                        <View style={styles.statPillSmall}>
                          <Text style={styles.statPillLabel}>Rate</Text>
                          <Text style={[styles.statPillVal, { color: '#EC4899' }]}>{convRate}%</Text>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            )}
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    padding: 14,
    borderRadius: 16,
    marginBottom: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: { fontSize: 18, fontWeight: '500', lineHeight: 24 },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  addMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#0284C7',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 7,
    flexShrink: 0,
  },
  addMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  periodBadge: { backgroundColor: 'rgba(2,132,199,0.1)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  periodBadgeText: { fontSize: 10, fontWeight: '700', color: '#0284C7' },
  chanCard: { borderRadius: 24, padding: 12, marginBottom: 8 , borderWidth: 0 , shadowOpacity: 0 },
  chanCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 , borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  chanName: { fontSize: 13, fontWeight: '700', flex: 1 },
  periodPill: { backgroundColor: 'rgba(2,132,199,0.1)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  periodPillText: { fontSize: 10, fontWeight: '700', color: '#0284C7' },
  chanStats: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  chanStatItem: { alignItems: 'center' },
  chanStatLbl: { fontSize: 9, fontWeight: '800', color: '#777383', letterSpacing: 0.3 },
  chanStatVal: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  linksWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  linkPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(2,132,199,0.08)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  linkPillTitle: { fontSize: 11, fontWeight: '600', maxWidth: 120 },
  linkPillBadge: { backgroundColor: '#0284C7', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 5 },
  linkPillBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 0, marginBottom: 10 , minHeight: 48 },
  searchInput: { flex: 1, fontSize: 13, fontWeight: '500' },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterPillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterPillText: { fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  userRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, marginBottom: 6 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  userAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  userName: { fontSize: 13, fontWeight: '700' },
  userSub: { fontSize: 13, color: '#716B7C', marginTop: 1 },
  userTime: { fontSize: 10, color: '#777383', marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  statusPillText: { fontSize: 11, fontWeight: '700' },
  botCard: { padding: 14, borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
  botAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  botAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  botTitle: { fontSize: 13, fontWeight: '700' },
  botUsername: { fontSize: 11, color: '#64748B', marginTop: 2 },
  activePill: { backgroundColor: 'rgba(16,185,129,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 },
  activePillText: { fontSize: 9, fontWeight: '800', color: '#10B981' },
  createLinkBtn: { backgroundColor: 'rgba(2,132,199,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  createLinkBtnText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },
  mappedRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1 },
  mappedLabel: { fontSize: 9, fontWeight: '800', color: '#777383', letterSpacing: 0.5 },
  channelTag: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(5,150,105,0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  channelTagText: { fontSize: 11, fontWeight: '600', color: '#059669' },
  statPillSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statPillLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  statPillVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    marginTop: 8,
    backgroundColor: 'rgba(2,132,199,0.08)',
  },
  loadMoreBtnText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#17171C', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 28, minHeight: 44 , shadowOpacity: 0 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  emptyCardInner: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  emptyCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyCardSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 280,
  },
});
