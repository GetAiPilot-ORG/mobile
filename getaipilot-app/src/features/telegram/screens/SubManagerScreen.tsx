import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  Alert,
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

type SubSection = 'pages' | 'revenue' | 'channels';

interface SubManagerScreenProps {
  stats: {
    totalRevenue: number;
    activeSubscribers: number;
    subscriptionPages: number;
    botAutomatedAccess: string;
    grossSales: number;
    netCreatorShare: number;
    availableToWithdraw: number;
    rollingHold: number;
    successfulPaymentsCount: number;
    connectedBank: { accountHolder: string; status: string; details: string };
    botStatus: { botUsername: string; isOnline: boolean; verifiedChannels: number };
    monetizedChannels: any[];
    discoveredChannels: any[];
    transactions: any[];
    pages: any[];
  };
  onOpenModal: (key: TelegramToolKey) => void;
  onRefresh: () => void;
}

export const SubManagerScreen: React.FC<SubManagerScreenProps> = ({ stats, onOpenModal, onRefresh }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [subSection, setSubSection] = useState<SubSection>('pages');
  const [txnSearch, setTxnSearch] = useState('');
  const [txnFilter, setTxnFilter] = useState<'All' | 'Success' | 'On Hold'>('All');
  const [channelTab, setChannelTab] = useState<'monetized' | 'discovered'>('monetized');
  const [channelSearch, setChannelSearch] = useState('');
  const [pageSearch, setPageSearch] = useState('');
  const [pageView, setPageView] = useState<'grid' | 'list'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pageActiveMap, setPageActiveMap] = useState<Record<string, boolean>>({});
  const [launchExpanded, setLaunchExpanded] = useState(false);

  const card = { backgroundColor: colors.card, borderColor: colors.border };
  const txt = { color: colors.text };
  const border = { borderColor: colors.border };

  const filteredTxns = (stats.transactions || []).filter((tx: any) => {
    const q = txnSearch.toLowerCase();
    const pid = (tx.razorpay_payment_id || tx.id || '').toLowerCase();
    const dt = (tx.dateTime || (tx.created_at ? new Date(tx.created_at).toLocaleString() : '')).toLowerCase();
    const matchSearch = !q || pid.includes(q) || dt.includes(q);
    const st = (tx.status || '').toUpperCase();
    const matchFilter = txnFilter === 'All' || (txnFilter === 'Success' && (st === 'SUCCESS' || st === 'CAPTURED')) || (txnFilter === 'On Hold' && (st === 'ON_HOLD' || st === 'PENDING'));
    return matchSearch && matchFilter;
  });

  const filteredMonetized = (stats.monetizedChannels || []).filter((ch) =>
    (ch.title || ch.channel_name || '').toLowerCase().includes(channelSearch.toLowerCase()) || String(ch.telegram_chat_id || '').includes(channelSearch)
  );
  const filteredDiscovered = (stats.discoveredChannels || []).filter((ch) =>
    (ch.title || ch.channel_name || '').toLowerCase().includes(channelSearch.toLowerCase()) || String(ch.chat_id || '').includes(channelSearch)
  );
  const filteredPages = (stats.pages || []).filter((pg) =>
    (pg.title || '').toLowerCase().includes(pageSearch.toLowerCase()) || (pg.slug || '').toLowerCase().includes(pageSearch.toLowerCase())
  );

  const handleCopyLink = async (url: string, id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const SUB_CATEGORIES: { key: SubSection; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number | null }[] = [
    { key: 'pages', label: 'Subscription Pages', icon: 'globe-outline', count: (stats.pages || []).length },
    { key: 'revenue', label: 'Revenue & KYC', icon: 'cash-outline' },
    { key: 'channels', label: 'Monetized Channels', icon: 'megaphone-outline', count: (stats.monetizedChannels || []).length },
  ];

  const kpiItems = [
    { label: 'TOTAL REVENUE', value: `₹${(stats.totalRevenue ?? 0).toLocaleString()}`, color: '#6366F1', icon: 'trending-up', bg: 'rgba(99,102,241,0.12)', tab: 'revenue', sub: 'Net earnings', isRevenue: true },
    { label: 'SUBSCRIBERS', value: String(stats.activeSubscribers ?? 0), color: '#10B981', icon: 'pulse', bg: 'rgba(16,185,129,0.12)', tab: 'channels', sub: 'Active members' },
    { label: 'PAYMENT PAGES', value: String(stats.subscriptionPages ?? stats.pages?.length ?? 0), color: '#0284C7', icon: 'globe', bg: 'rgba(2,132,199,0.12)', tab: 'pages', sub: 'Hosted checkouts' },
    { label: 'GROSS SALES', value: `₹${(stats.grossSales ?? 0).toLocaleString()}`, color: '#F59E0B', icon: 'cash', bg: 'rgba(245,158,11,0.12)', tab: 'revenue', sub: 'Total sales', isRevenue: true },
    { label: 'WITHDRAWABLE', value: `₹${(stats.availableToWithdraw ?? 0).toLocaleString()}`, color: '#10B981', icon: 'wallet', bg: 'rgba(16,185,129,0.12)', tab: 'revenue', sub: 'Ready to payout', isRevenue: true },
    { label: 'INVITE ACCESS', value: stats.botAutomatedAccess || 'Active', color: '#8B5CF6', icon: 'shield-checkmark', bg: 'rgba(139,92,246,0.12)', tab: 'pages', sub: 'Single-use links' },
  ];

  const itemsPerRow = isTablet ? 3 : 2;
  const kpiRows: (typeof kpiItems)[] = [];
  for (let i = 0; i < kpiItems.length; i += itemsPerRow) {
    kpiRows.push(kpiItems.slice(i, i + itemsPerRow));
  }

  return (
    <>
      {/* HERO: Command Center (Responsive Header with Telegram Animated Graphic) */}
      <ProductHeading title="Your subscriptions" action="New page" onAction={() => onOpenModal('sub_manager')} />

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
                    setSubSection(m.tab as SubSection);
                  }}
                  isRevenue={m.isRevenue}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Launch Readiness Banner */}
      <Pressable
        style={[styles.launchBanner, { backgroundColor: colors.backgroundSecondary }]}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setLaunchExpanded(!launchExpanded);
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
            <Ionicons name="rocket-outline" size={15} color="#10B981" />
          </View>
          <Text style={[styles.launchTitle, txt]}>Launch Readiness</Text>
          <View style={styles.readyBadge}>
            <Text style={styles.readyBadgeText}>100% Ready</Text>
          </View>
        </View>
        <Ionicons name={launchExpanded ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" />
      </Pressable>
      {launchExpanded && (
        <View style={[styles.launchExpanded, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
          {[
            { label: 'Bot Connected', icon: 'checkmark-circle', color: '#10B981' },
            { label: 'Bank Account Verified', icon: 'checkmark-circle', color: '#10B981' },
            { label: 'Subscription Page Created', icon: 'checkmark-circle', color: '#10B981' },
            { label: 'Telegram Account Linked', icon: 'checkmark-circle', color: '#10B981' },
          ].map((item, i) => (
            <View key={i} style={styles.launchItem}>
              <Ionicons name={item.icon as any} size={16} color={item.color} />
              <Text style={[styles.launchItemText, txt]}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Category Filter Tabs (Overview / Tracker Screen Style) */}
      <View className="mb-3.5 p-2.5 rounded-xl" style={{ backgroundColor: colors.backgroundSecondary }}>
        <Text className="text-[15px] font-medium mb-2.5" style={{ color: colors.text }}>
          Monetization Modules ({SUB_CATEGORIES.length})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {SUB_CATEGORIES.map((cat) => {
            const isSelected = subSection === cat.key;
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
                  setSubSection(cat.key);
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                />
                <Text
                  className={`text-xs ${isSelected ? 'text-[#6C55C5] font-medium' : 'font-semibold'}`}
                  style={isSelected ? undefined : { color: colors.text }}
                >
                  {cat.label}
                </Text>
                {cat.count !== undefined && cat.count !== null && (
                  <View
                    className={`px-1.5 py-0.5 rounded-full ${isSelected ? 'bg-white/20' : isDark ? 'bg-white/10' : 'bg-slate-200'}`}
                  >
                    <Text
                      className={`text-[10px] font-black ${isSelected ? 'text-white' : isDark ? 'text-slate-300' : 'text-slate-600'}`}
                    >
                      {cat.count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* PAGES */}
      {subSection === 'pages' && (
        <View style={{ gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={[styles.searchBar, card]}>
              <Ionicons name="search" size={15} color="#94A3B8" />
              <TextInput style={[styles.searchInput, txt]} placeholder="Search pages..." placeholderTextColor="#94A3B8" value={pageSearch} onChangeText={setPageSearch} />
            </View>
            <Pressable style={[styles.viewToggle, card]} onPress={() => setPageView(pageView === 'grid' ? 'list' : 'grid')}>
              <Ionicons name={pageView === 'grid' ? 'list-outline' : 'grid-outline'} size={16} color="#0284C7" />
            </Pressable>
          </View>
          <FlatList
            data={filteredPages}
            keyExtractor={(page) => String(page.id)}
            scrollEnabled={false}
            renderItem={({ item: page }) => (
              <View key={page.id} style={[pageView === 'grid' ? styles.pageCardGrid : styles.pageCardList, { backgroundColor: colors.backgroundSecondary, marginBottom: 10 }]}>
                <View style={styles.pageCardHeader}>
                  <View style={[styles.pageIconCircle, { backgroundColor: page.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.12)' }]}>
                    <Ionicons name="globe-outline" size={15} color={page.isActive ? '#10B981' : '#94A3B8'} />
                  </View>
                  <View style={[styles.pageStatusBadge, page.isActive ? styles.pageStatusActive : styles.pageStatusInactive]}>
                    <View style={[styles.dotStatus, { backgroundColor: page.isActive ? '#10B981' : '#94A3B8' }]} />
                    <Text style={[styles.pageStatusText, { color: page.isActive ? '#10B981' : '#94A3B8' }]} numberOfLines={1}>
                      {pageView === 'grid' ? (page.isActive ? 'Active' : 'Paused') : page.statusText}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.pageTitle, txt]} numberOfLines={1}>{page.title}</Text>
                <Text style={styles.pageUrl} numberOfLines={1}>{page.displayUrl}</Text>
                <View style={styles.pageActionRow}>
                  <Pressable style={[styles.pageActionBtn, { flex: 1, justifyContent: 'center' }]} onPress={() => handleCopyLink(page.url, page.id)}>
                    <Ionicons name={copiedId === page.id ? 'checkmark' : 'copy-outline'} size={12} color="#0284C7" />
                    <Text style={styles.pageActionBtnText}>{copiedId === page.id ? 'Copied' : 'Copy'}</Text>
                  </Pressable>
                  <Pressable style={[styles.pageActionBtn, { flex: 1, justifyContent: 'center' }]} onPress={() => onOpenModal('sub_manager')}>
                    <Ionicons name="create-outline" size={12} color="#0284C7" />
                    <Text style={styles.pageActionBtnText}>Edit</Text>
                  </Pressable>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#64748B', fontSize: 12 }}>No pages found</Text>
              </View>
            }
          />
          <Pressable style={styles.primaryBtn} onPress={() => onOpenModal('sub_manager')}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Create New Subscription Page</Text>
          </Pressable>
        </View>
      )}

      {/* REVENUE & KYC */}
      {subSection === 'revenue' && (
        <View style={{ gap: 12 }}>
          {/* Financial Summary */}
          <View style={[styles.sectionCard, card]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(99,102,241,0.12)' }]}>
                <Ionicons name="cash-outline" size={15} color="#6366F1" />
              </View>
              <Text style={[styles.sectionTitle, txt]}>Financial Hub</Text>
            </View>
            {[
              { label: 'Gross Sales', val: `₹${stats.grossSales}`, color: '#0284C7' },
              { label: 'Net Creator Share (90%)', val: `₹${stats.netCreatorShare}`, color: '#10B981' },
              { label: 'Available to Withdraw', val: `₹${stats.availableToWithdraw}`, color: '#10B981' },
              { label: '7-Day Rolling Hold', val: `₹${stats.rollingHold}`, color: '#F59E0B' },
            ].map((row, i) => (
              <View key={i} style={[styles.finRow, border]}>
                <Text style={[styles.finLabel, txt]}>{row.label}</Text>
                <Text style={[styles.finVal, { color: row.color }]}>{row.val}</Text>
              </View>
            ))}
          </View>

          {/* Bank Account KYC */}
          <View style={[styles.sectionCard, card]}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
                <Ionicons name="shield-checkmark-outline" size={15} color="#10B981" />
              </View>
              <Text style={[styles.sectionTitle, txt]}>Bank Account & KYC</Text>
            </View>
            <View style={{ gap: 8 }}>
              {[
                { icon: 'person-outline', label: stats.connectedBank.accountHolder || 'Account Holder', sub: 'Account Holder' },
                { icon: 'shield-checkmark-outline', label: stats.connectedBank.status || 'Active', sub: 'KYC Status' },
                { icon: 'card-outline', label: stats.connectedBank.details || 'Direct Bank Settlement (IMPS)', sub: 'Payout Route' },
              ].map((item, i) => (
                <View key={i} style={styles.kycRow}>
                  <View style={[styles.kycIconCircle, { backgroundColor: 'rgba(16,185,129,0.1)' }]}>
                    <Ionicons name={item.icon as any} size={14} color="#10B981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.kycLabel, txt]}>{item.label}</Text>
                    <Text style={styles.kycSub}>{item.sub}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Transactions */}
          <View style={[styles.sectionCard, card]}>
            <View style={[styles.sectionHeader, { marginBottom: 10 }]}>
              <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
                <Ionicons name="receipt-outline" size={15} color="#0284C7" />
              </View>
              <Text style={[styles.sectionTitle, txt]}>Transaction History</Text>
            </View>
            <View style={[styles.searchBar, card]}>
              <Ionicons name="search" size={15} color="#94A3B8" />
              <TextInput style={[styles.searchInput, txt]} placeholder="Search payments..." placeholderTextColor="#94A3B8" value={txnSearch} onChangeText={setTxnSearch} />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {(['All', 'Success', 'On Hold'] as const).map((f) => (
                  <Pressable key={f} style={[styles.filterPill, txnFilter === f && styles.filterPillActive, { backgroundColor: colors.background, borderColor: colors.border }]} onPress={() => setTxnFilter(f)}>
                    <Text style={[styles.filterPillText, txnFilter === f && styles.filterPillTextActive, txt]}>{f}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            <FlatList
              data={filteredTxns}
              keyExtractor={(tx: any) => String(tx.id || tx.razorpay_payment_id || Math.random())}
              scrollEnabled={false}
              initialNumToRender={15}
              maxToRenderPerBatch={20}
              renderItem={({ item: tx }: { item: any }) => {
                const paymentId = tx.razorpay_payment_id || tx.id || 'Payment';
                const formattedDate = tx.dateTime || (tx.created_at ? new Date(tx.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recent');
                const amountVal = tx.netPayout ?? tx.amount ?? 0;
                const statusVal = (tx.status || 'SUCCESS').toUpperCase();

                return (
                  <View key={tx.id || paymentId} style={[styles.txnRow, { backgroundColor: colors.backgroundSecondary }]}>
                    <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                      <Text style={[styles.txnId, txt]} numberOfLines={1}>{paymentId}</Text>
                      <Text style={styles.txnDate} numberOfLines={1}>{formattedDate}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={[styles.txnAmount, { color: '#10B981' }]}>₹{amountVal}</Text>
                      <View style={[styles.txnStatusBadge, statusVal === 'SUCCESS' ? styles.txnStatusSuccess : styles.txnStatusPending]}>
                        <Text style={[styles.txnStatusText, statusVal === 'SUCCESS' ? { color: '#10B981' } : { color: '#F59E0B' }]}>
                          {statusVal}
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="receipt-outline" size={24} color="#64748B" />
                  <Text style={{ color: '#64748B', fontSize: 12, marginTop: 6, fontWeight: '600' }}>No transactions found</Text>
                </View>
              }
            />
          </View>
        </View>
      )}

      {/* CHANNELS */}
      {subSection === 'channels' && (
        <View style={{ gap: 12 }}>
          <View style={[styles.sectionCard, card]}>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 10 }}>
              {(['monetized', 'discovered'] as const).map((t) => (
                <Pressable key={t} style={[styles.chanTab, channelTab === t && styles.chanTabActive]} onPress={() => setChannelTab(t)}>
                  <Text style={[styles.chanTabText, channelTab === t && styles.chanTabTextActive, txt]}>
                    {t === 'monetized' ? `Monetized (${filteredMonetized.length})` : `Discovered (${filteredDiscovered.length})`}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={[styles.searchBar, card]}>
              <Ionicons name="search" size={15} color="#94A3B8" />
              <TextInput style={[styles.searchInput, txt]} placeholder="Search channels..." placeholderTextColor="#94A3B8" value={channelSearch} onChangeText={setChannelSearch} />
            </View>
            <View style={{ marginTop: 8 }}>
              {channelTab === 'monetized' && (
                <FlatList
                  data={filteredMonetized}
                  keyExtractor={(ch, index) => ch.id || ch.channel_id || String(index)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                  renderItem={({ item: ch }) => {
                    const titleStr = ch.title || ch.channel_name || 'Channel';
                    return (
                      <View style={[styles.chanCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={styles.chanAvatar}><Text style={styles.chanAvatarText}>{titleStr.charAt(0).toUpperCase()}</Text></View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.chanTitle, txt]} numberOfLines={1}>{titleStr}</Text>
                            <Text style={styles.chanId}>ID: {ch.telegram_chat_id || ch.channel_id || 'N/A'}</Text>
                          </View>
                          <View style={styles.botActiveBadge}>
                            <Ionicons name="checkmark" size={12} color="#10B981" />

                          </View>
                        </View>
                        <View style={{ flexDirection: 'row', gap: 8, marginTop: 10 }}>
                          <Pressable style={[styles.chanActionBtn, border]} onPress={() => Alert.alert('Status Check', `${titleStr}: Bot active with full admin rights.`)}>
                            <Ionicons name="sync" size={12} color="#64748B" />
                            <Text style={[styles.chanActionBtnText, txt]}>Status</Text>
                          </Pressable>
                          <Pressable style={[styles.chanActionBtn, border]} onPress={() => Alert.alert('Guide', 'Ensure @Gapsubmanagerbot is Admin.')}>
                            <Ionicons name="settings-outline" size={12} color="#64748B" />
                            <Text style={[styles.chanActionBtnText, txt]}>Guide</Text>
                          </Pressable>
                          <Pressable style={styles.createPageBtn} onPress={() => onOpenModal('sub_manager')}>
                            <Text style={styles.createPageBtnText}>Create Page →</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={[styles.chanCard, { backgroundColor: colors.backgroundSecondary, alignItems: 'center', paddingVertical: 20 }]}>
                      <Text style={[{ fontSize: 13, color: '#94A3B8' }, txt]}>No monetized channels found</Text>
                    </View>
                  }
                />
              )}
              {channelTab === 'discovered' && (
                <FlatList
                  data={filteredDiscovered}
                  keyExtractor={(disc, index) => disc.id || disc.chat_id || disc.channel_id || String(index)}
                  scrollEnabled={false}
                  ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
                  renderItem={({ item: disc }) => {
                    const discTitle = disc.title || disc.channel_name || 'Channel';
                    return (
                      <View style={[styles.chanCard, { backgroundColor: colors.backgroundSecondary }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                          <View style={[styles.chanAvatar, { backgroundColor: '#F0EEF8' }]}><Text style={[styles.chanAvatarText, { color: '#0284C7' }]}>{discTitle.charAt(0).toUpperCase()}</Text></View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.chanTitle, txt]}>{discTitle}</Text>
                            <Text style={styles.chanId}>ID: {disc.chat_id || disc.channel_id || 'N/A'} • {disc.members || 0} Members</Text>
                          </View>
                          <Pressable style={styles.createPageBtn} onPress={() => Alert.alert('Activate', `Add @Gapsubmanagerbot as Admin in ${discTitle}.`)}>
                            <Ionicons name="add" size={13} color="#FFFFFF" />
                            <Text style={styles.createPageBtnText}>Add Bot</Text>
                          </Pressable>
                        </View>
                      </View>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={[styles.chanCard, { backgroundColor: colors.backgroundSecondary, alignItems: 'center', paddingVertical: 20 }]}>
                      <Text style={[{ fontSize: 13, color: '#94A3B8' }, txt]}>No discovered channels found</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E9E6F2' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  textLight: { color: '#1C1A25' },
  textDark: { color: '#F5F3FB' },
  borderLight: { borderColor: '#E9E6F2' },
  borderDark: { borderColor: '#27272A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 14 },
  headerTitle: { fontSize: 28, fontWeight: '500', lineHeight: 36 , letterSpacing: -0.5 },
  headerSub: { fontSize: 13, fontWeight: '500', marginTop: 2 },
  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 20 },
  dotGreen: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  activeBadgeText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#17171C', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 28, minHeight: 44 , shadowOpacity: 0 },
  newBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  iconBtn: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  metricsContainer: { width: '100%', alignSelf: 'stretch', gap: 10, marginBottom: 12 },
  metricsRow: { flexDirection: 'row', gap: 10, width: '100%', alignSelf: 'stretch', marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 12, width: '100%' },
  statCard: { width: '48%', padding: 12, borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
  statHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  statLabel: { fontSize: 8.5, fontWeight: '800', color: '#777383', letterSpacing: 0.4, flex: 1 },
  statIconBadge: { width: 24, height: 24, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  statVal: { fontSize: 22, fontWeight: '800' },
  statSub: { fontSize: 13, color: '#716B7C', marginTop: 2 },
  launchBanner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, borderRadius: 24, borderWidth: 0, marginBottom: 4 },
  launchBannerLight: { backgroundColor: '#F0FDF4', borderColor: '#A7F3D0' },
  launchBannerDark: { backgroundColor: 'rgba(16,185,129,0.08)', borderColor: 'rgba(16,185,129,0.2)' },
  launchTitle: { fontSize: 13, fontWeight: '700' },
  readyBadge: { backgroundColor: '#10B981', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  readyBadgeText: { color: '#FFF', fontSize: 10, fontWeight: '800' },
  launchExpanded: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 12, gap: 8 },
  launchItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  launchItemText: { fontSize: 13, fontWeight: '600' },
  segBar: { flexDirection: 'row', borderRadius: 14, padding: 4, marginBottom: 14, borderWidth: 1 },
  segTab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 9, borderRadius: 10 },
  segTabActive: { backgroundColor: '#0284C7' },
  segTabText: { fontSize: 11, fontWeight: '600' },
  segTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 22, paddingHorizontal: 12, paddingVertical: 9, borderWidth: 0, flex: 1 , minHeight: 48 },
  searchInput: { flex: 1, fontSize: 13 },
  viewToggle: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  pagesGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 10, width: '100%' },
  pageCardGrid: { width: '48.5%', padding: 12, borderRadius: 24, borderWidth: 0, marginBottom: 10 , shadowOpacity: 0 },
  pageCardList: { padding: 14, borderRadius: 24, borderWidth: 0, marginBottom: 10 , shadowOpacity: 0 },
  pageCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 , borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  pageIconCircle: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  pageStatusBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 6, paddingVertical: 2.5, borderRadius: 6, maxWidth: '65%' },
  dotStatus: { width: 5, height: 5, borderRadius: 2.5 },
  pageStatusActive: { backgroundColor: 'rgba(16,185,129,0.12)' },
  pageStatusInactive: { backgroundColor: 'rgba(148,163,184,0.12)' },
  pageStatusText: { fontSize: 9.5, fontWeight: '700' },
  pageTitle: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  pageUrl: { fontSize: 10, color: '#0284C7', marginTop: 2 },
  pageActionRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  pageActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(2,132,199,0.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8 },
  pageActionBtnText: { color: '#0284C7', fontSize: 11, fontWeight: '700' },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#17171C', borderRadius: 28, paddingVertical: 13 , minHeight: 44 , shadowOpacity: 0 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  sectionCard: { padding: 14, borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionIconCircle: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '500', flex: 1 , lineHeight: 24 },
  finRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1 },
  finLabel: { fontSize: 12, fontWeight: '600' },
  finVal: { fontSize: 15, fontWeight: '800' },
  kycRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kycIconCircle: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  kycLabel: { fontSize: 13, fontWeight: '600' },
  kycSub: { fontSize: 13, color: '#716B7C', marginTop: 1 },
  filterPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  filterPillLight: { backgroundColor: '#F5F3FB', borderColor: '#E9E6F2' },
  filterPillDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  filterPillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterPillText: { fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },
  txnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10, borderRadius: 10, marginBottom: 6 },
  txnRowLight: { backgroundColor: '#F5F3FB' },
  txnRowDark: { backgroundColor: 'rgba(255,255,255,0.04)' },
  txnId: { fontSize: 12, fontWeight: '700' },
  txnDate: { fontSize: 10, color: '#64748B', marginTop: 1 },
  txnAmount: { fontSize: 14, fontWeight: '800' },
  txnStatusBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 },
  txnStatusSuccess: { backgroundColor: 'rgba(16,185,129,0.12)' },
  txnStatusPending: { backgroundColor: 'rgba(245,158,11,0.12)' },
  txnStatusText: { fontSize: 9, fontWeight: '800', color: '#10B981' },
  chanTab: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  chanTabActive: { backgroundColor: '#0284C7' },
  chanTabText: { fontSize: 12, fontWeight: '600' },
  chanTabTextActive: { color: '#FFFFFF', fontWeight: '700' },
  chanCard: { padding: 12, borderRadius: 24, borderWidth: 0, shadowOpacity: 0 },
  chanAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#0284C7', alignItems: 'center', justifyContent: 'center' },
  chanAvatarText: { color: '#FFF', fontSize: 14, fontWeight: '800' },
  chanTitle: { fontSize: 13, fontWeight: '700' },
  chanId: { fontSize: 10, color: '#64748B', marginTop: 1 },
  botActiveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.1)', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8 },
  botActiveBadgeText: { fontSize: 10, fontWeight: '700', color: '#10B981' },
  chanActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  chanActionBtnText: { fontSize: 11, fontWeight: '600' },
  createPageBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginLeft: 'auto' },
  createPageBtnText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
