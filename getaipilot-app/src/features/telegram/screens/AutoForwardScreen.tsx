import { getColors, useTheme } from '@/theme';
import {
  Ionicons
} from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  FlatList,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatCard } from '../components/ui/StatCard';
import { AnimatedHero } from '../components/ui/AnimatedHero';
import { TelegramToolKey } from '../types';

type AfSection = 'mappings' | 'filters' | 'blocked' | 'delays' | 'headers';

interface AutoForwardScreenProps {
  forwardRules: any[];
  summary?: any;
  onOpenModal: (key: TelegramToolKey) => void;
}

export const AutoForwardScreen: React.FC<AutoForwardScreenProps> = ({ forwardRules, summary, onOpenModal }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 375;
  const isTablet = width >= 768;

  const [afSection, setAfSection] = useState<AfSection>('mappings');
  const [selectedDelay, setSelectedDelay] = useState(0);

  const card = { backgroundColor: colors.card, borderColor: colors.cardBorder };
  const txt = { color: colors.text };
  const border = { borderColor: colors.cardBorder };

  const dbFilters = summary?.loadedFilters || [];
  const dbBlacklist = summary?.loadedBlacklist || [];
  const dbSettings = summary?.loadedForwardSettings || null;

  const filtersList = dbFilters.length > 0
    ? dbFilters.map((f: any) => ({
      from: f.from_name || f.keyword || f.find_text || f.word || '',
      to: f.to_name || f.replacement || f.replace_text || f.replace_with || '',
    }))
    : forwardRules.flatMap(r => r.keywords_filter || []).map((f: string) => {
      const parts = f.split('->');
      return { from: parts[0] || f, to: parts[1] || '' };
    });

  const filtersCount = filtersList.length;

  const blacklistList: string[] = dbBlacklist.length > 0
    ? dbBlacklist.map((b: any) => b.word || b.word_lower || b.keyword || b.blacklisted_word).filter(Boolean)
    : [...new Set(forwardRules.flatMap(r => r.blacklist_keywords || []))];

  const blockedCount = blacklistList.length;

  const delaySec = dbSettings?.delay_seconds ?? Math.max(...forwardRules.map(r => r.delay_seconds || 0), 0);

  const targetCount = [
    ...new Set(
      forwardRules.flatMap((r) =>
        r.receivers_names || r.receivers || (r.target_chat_title ? [r.target_chat_title] : [])
      ).filter(Boolean)
    ),
  ].length;

  const AF_CATEGORIES: { key: AfSection; label: string; icon: keyof typeof Ionicons.glyphMap; count?: number }[] = [
    { key: 'mappings', label: 'Routing Rules', icon: 'git-compare-outline', count: (forwardRules || []).length },
    { key: 'filters', label: 'Word Filters', icon: 'filter-outline', count: filtersCount },
    { key: 'blocked', label: 'Blocked Words', icon: 'shield-outline', count: blockedCount },
    { key: 'delays', label: 'Delay Buffer', icon: 'time-outline' },
    { key: 'headers', label: 'Custom Headers', icon: 'text-outline' },
  ];

  const kpiItems = [
    { label: 'ACTIVE MAPPINGS', value: (forwardRules || []).length, color: '#0284C7', icon: 'arrow-redo', bg: 'rgba(2,132,199,0.12)', tab: 'mappings', sub: 'Source routes' },
    { label: 'TARGET CHANNELS', value: targetCount || (forwardRules.length > 0 ? forwardRules.length : 0), color: '#06B6D4', icon: 'paper-plane', bg: 'rgba(6,182,212,0.12)', tab: 'mappings', sub: 'Receiving chats' },
    { label: 'TEXT FILTERS', value: filtersCount, color: '#8B5CF6', icon: 'filter', bg: 'rgba(139,92,246,0.12)', tab: 'filters', sub: 'Word replace' },
    { label: 'BLOCKED WORDS', value: blockedCount, color: '#EF4444', icon: 'shield', bg: 'rgba(239,68,68,0.12)', tab: 'blocked', sub: 'Blacklist terms' },
    { label: 'DELAY BUFFER', value: `${delaySec}s`, color: '#F59E0B', icon: 'time', bg: 'rgba(245,158,11,0.12)', tab: 'delays', sub: 'Anti-flood delay' },
    { label: 'TEXT ACTIONS', value: forwardRules.some(r => r.header || r.footer) ? 'Configured' : 'None', color: '#10B981', icon: 'document-text', bg: 'rgba(16,185,129,0.12)', tab: 'headers', sub: 'Prefix & Suffix' },
  ];

  const itemsPerRow = isTablet ? 3 : 2;
  const kpiRows: (typeof kpiItems)[] = [];
  for (let i = 0; i < kpiItems.length; i += itemsPerRow) {
    kpiRows.push(kpiItems.slice(i, i + itemsPerRow));
  }

  return (
    <>
      {/* HERO: Command Center (Responsive Header with Telegram Graphic) */}
      <View
        className="overflow-hidden"
      >
        <View className="flex-col gap-3">
          {/* Telegram Animated Graphic Banner */}
          <AnimatedHero
            variant="forward"
            tagText="TELEGRAM FORWARD HUB"
            tagIcon="paper-plane"
            title="Channel Message Routing"
            subtitle="Real-time broadcast sync with zero latency"
          />

          {/* Status Badges & Action */}
          <View className="flex-row p-3 items-center justify-between flex-wrap gap-2">
            <View className="flex-row items-center gap-1.5 flex-wrap flex-1 min-w-[180px]">
              <View
                className="flex-row items-center gap-1.5 px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(16,185,129,0.1)' }}
              >
                <View className="w-[7px] h-[7px] rounded-full bg-[#10B981]" />
                <Text className="text-[11px] font-bold text-[#10B981]">Engine Active</Text>
              </View>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(2,132,199,0.1)' }}
              >
                <Text className="text-[11px] font-bold text-[#0284C7]">
                  {(forwardRules || []).length} Active Routes
                </Text>
              </View>
              <View
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(139,92,246,0.1)' }}
              >
                <Text className="text-[11px] font-bold text-[#8B5CF6]">
                  {targetCount || (forwardRules || []).length} Channels Mapped
                </Text>
              </View>
            </View>

            <Pressable
              className="flex-row items-center gap-1 bg-[#0284C7]/10 px-2.5 py-1.5 rounded-lg border border-[#0284C7]/20 self-start"
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Linking.openURL('https://t.me/Gapautoforwardingbot');
              }}
            >
              <Ionicons name="paper-plane" size={11} color="#0284C7" />
              <Text className="text-[11px] font-bold text-[#0284C7]">Open Bot</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 6 KPI Cards in Responsive Rows */}
      <View
        className="w-full border-t pt-3 mt-1 gap-2 self-stretch mb-3.5"
        style={{ borderTopColor: isDark ? '#27272A' : '#E2E8F0' }}
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
                    setAfSection(m.tab as AfSection);
                  }}
                />
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* Category Filter Tabs (Overview Screen Style) */}
      <View className="mb-3.5 p-2.5 rounded-xl " style={{ backgroundColor: colors.backgroundSecondary }}>
        <Text className="text-[15px] font-extrabold mb-2.5" style={{ color: colors.text }}>
          Forwarding Controls & Modules ({AF_CATEGORIES.length})
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ gap: 8, paddingBottom: 4 }}
        >
          {AF_CATEGORIES.map((cat) => {
            const isSelected = afSection === cat.key;
            return (
              <Pressable
                key={cat.key}
                className={`flex-row items-center gap-1.5 px-3 py-[7px] rounded-full border ${isSelected
                  ? 'bg-[#0284C7] border-[#0284C7]'
                  : isDark
                    ? 'bg-[#121212] border-[#27272A]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                  }`}
                onPress={() => {
                  if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAfSection(cat.key);
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : isDark ? '#94A3B8' : '#64748B'}
                />
                <Text
                  className={`text-xs ${isSelected ? 'text-white font-bold' : 'font-semibold'}`}
                  style={isSelected ? undefined : { color: colors.text }}
                >
                  {cat.label}
                  {cat.count !== undefined ? ` (${cat.count})` : ''}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* SECTION 1: ROUTING RULES (MAPPINGS) */}
      {afSection === 'mappings' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(2,132,199,0.12)' }]}>
              <Ionicons name="arrow-redo" size={14} color="#0284C7" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Active Routing Rules</Text>
              <Text style={styles.sectionSub} numberOfLines={1}>{(forwardRules || []).length} channels configured</Text>
            </View>
            <Pressable
              style={styles.addMiniBtn}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenModal('autoforward');
              }}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
              <Text style={styles.addMiniBtnText}>Add Rule</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 8 }}>
            <FlatList
              data={forwardRules || []}
              keyExtractor={(rule, idx) => `rule_${rule.id || idx}`}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              renderItem={({ item: rule }) => {
                const sourceLabel = rule.source_chat_title || rule.sender_name || (rule.sender_id ? `id:${rule.sender_id}` : 'Source Channel');
                const targetLabel = rule.target_chat_title || (Array.isArray(rule.receivers_names) && rule.receivers_names.length > 0 ? rule.receivers_names.join(', ') : (Array.isArray(rule.receivers) && rule.receivers.length > 0 ? rule.receivers.map((r: any) => `id:${r}`).join(', ') : 'Target Channel'));
                return (
                  <View style={[styles.mappingRow, { backgroundColor: colors.backgroundSecondary }]}>
                    {/* Source Row */}
                    <View style={styles.routeHeaderRow}>
                      <View style={styles.routeChannelLeft}>
                        <View style={styles.channelIconMini}>
                          <Ionicons name="megaphone-outline" size={12} color="#0284C7" />
                        </View>
                        <Text style={[styles.channelTitleText, txt]} numberOfLines={1}>{sourceLabel}</Text>
                      </View>
                      <View style={styles.activeTagMini}>
                        <View style={styles.activeDot} />
                        <Text style={styles.activeTagText}>Active</Text>
                      </View>
                    </View>

                    {/* Route Connector */}
                    <View style={styles.connectorRow}>
                      <View style={[styles.connectorLine, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]} />
                      <View style={styles.connectorPill}>
                        <Ionicons name="arrow-forward" size={11} color="#0284C7" />
                        <Text style={styles.connectorPillText}>Auto-Forward</Text>
                      </View>
                      <View style={[styles.connectorLine, { backgroundColor: isDark ? '#27272A' : '#E2E8F0' }]} />
                    </View>

                    {/* Target Row */}
                    <View style={styles.routeFooterRow}>
                      <View style={styles.routeChannelLeft}>
                        <View style={[styles.channelIconMini, { backgroundColor: 'rgba(16,185,129,0.15)' }]}>
                          <Ionicons name="paper-plane-outline" size={12} color="#10B981" />
                        </View>
                        <Text style={[styles.targetTitleText, { color: isDark ? '#94A3B8' : '#475569' }]} numberOfLines={1}>
                          {targetLabel}
                        </Text>
                      </View>
                      {rule.delay_seconds ? (
                        <View style={styles.delayTagMini}>
                          <Ionicons name="time-outline" size={10} color="#F59E0B" />
                          <Text style={styles.delayTagText}>{rule.delay_seconds}s</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                );
              }}
              ListEmptyComponent={
                <View style={{ padding: 20, alignItems: 'center' }}>
                  <Ionicons name="git-compare-outline" size={28} color="#64748B" style={{ marginBottom: 6 }} />
                  <Text style={{ fontSize: 13, color: '#64748B', fontWeight: '600' }}>No active forwarding rules configured.</Text>
                </View>
              }
            />
          </View>
        </View>
      )}

      {/* SECTION 2: FILTERS */}
      {afSection === 'filters' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(139,92,246,0.12)' }]}>
              <Ionicons name="filter-outline" size={14} color="#8B5CF6" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Word Filters & Replacements</Text>
              <Text style={styles.sectionSub} numberOfLines={1}>Automatic link and username substitution</Text>
            </View>
            <Pressable
              style={[styles.addMiniBtn, { backgroundColor: '#8B5CF6' }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenModal('autoforward');
              }}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
              <Text style={styles.addMiniBtnText}>Add Filter</Text>
            </Pressable>
          </View>

          <View style={{ marginTop: 8 }}>
            <FlatList
              data={filtersList}
              keyExtractor={(_, idx) => String(idx)}
              scrollEnabled={false}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => (
                <View style={[styles.filterItem, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
                  <View style={styles.filterChipFrom}>
                    <Text style={styles.filterFrom} numberOfLines={1}>{item.from}</Text>
                  </View>
                  <Ionicons name="arrow-forward" size={12} color="#94A3B8" style={{ marginHorizontal: 6 }} />
                  <View style={styles.filterChipTo}>
                    <Text style={styles.filterTo} numberOfLines={1}>{item.to || '(Removed)'}</Text>
                  </View>
                </View>
              )}
              ListEmptyComponent={
                <Text style={{ fontSize: 12, color: '#64748B', padding: 12, textAlign: 'center' }}>No filters configured.</Text>
              }
            />
          </View>
        </View>
      )}

      {/* SECTION 3: BLOCKED */}
      {afSection === 'blocked' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
              <Ionicons name="shield-outline" size={14} color="#EF4444" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Blacklisted Keywords</Text>
              <Text style={styles.sectionSub} numberOfLines={1}>Messages with these keywords are dropped</Text>
            </View>
            <Pressable
              style={[styles.addMiniBtn, { backgroundColor: '#EF4444' }]}
              onPress={() => {
                if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onOpenModal('autoforward');
              }}
            >
              <Ionicons name="add" size={13} color="#FFFFFF" />
              <Text style={styles.addMiniBtnText}>Add Word</Text>
            </Pressable>
          </View>

          <View style={styles.chipsWrap}>
            {blacklistList.length === 0 ? (
              <Text style={{ fontSize: 12, color: '#64748B', padding: 12, width: '100%', textAlign: 'center' }}>No blocked keywords.</Text>
            ) : (
              blacklistList.map((chip: string, idx: number) => (
                <View key={idx} style={[styles.blockedChip, { maxWidth: Math.max(width - 64, 180) }]}>
                  <Text style={styles.blockedChipText} numberOfLines={1}>{chip}</Text>
                  <Ionicons name="close-circle" size={12} color="#EF4444" />
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {/* SECTION 4: DELAYS */}
      {afSection === 'delays' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(245,158,11,0.12)' }]}>
              <Ionicons name="time-outline" size={14} color="#F59E0B" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Forwarding Delay Interval</Text>
              <Text style={styles.sectionSub} numberOfLines={1}>Prevent Telegram rate-limiting & anti-flood</Text>
            </View>
          </View>

          <View style={[styles.delayBigBox, { backgroundColor: colors.backgroundSecondary, borderColor: colors.cardBorder }]}>
            <Text style={[styles.delayBigNumber, txt]}>{selectedDelay || delaySec}</Text>
            <Text style={styles.delayBigLabel}>seconds delay interval active</Text>
          </View>

          <View style={styles.delayPresetsRow}>
            {[0, 5, 15, 30, 60].map((sec) => {
              const isActive = (selectedDelay || delaySec) === sec;
              return (
                <Pressable
                  key={sec}
                  style={[
                    styles.delayPresetBtn,
                    {
                      backgroundColor: isActive ? '#0284C7' : colors.backgroundSecondary,
                      borderColor: isActive ? '#0284C7' : colors.cardBorder,
                    },
                  ]}
                  onPress={() => setSelectedDelay(sec)}
                >
                  <Text
                    style={[
                      styles.delayPresetText,
                      txt,
                      isActive && { color: '#FFFFFF' },
                      isSmallScreen && { fontSize: 11 },
                    ]}
                    numberOfLines={1}
                  >
                    {sec === 0 ? 'Instant' : `${sec}s`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      )}

      {/* SECTION 5: HEADERS */}
      {afSection === 'headers' && (
        <View style={[styles.sectionCard, card]}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionIconCircle, { backgroundColor: 'rgba(16,185,129,0.12)' }]}>
              <Ionicons name="text-outline" size={14} color="#10B981" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.sectionTitle, txt]} numberOfLines={1}>Prefix & Suffix Headers</Text>
              <Text style={styles.sectionSub} numberOfLines={1}>Brand messages with custom headers & signatures</Text>
            </View>
          </View>

          <View style={[styles.previewBox, { backgroundColor: isDark ? 'rgba(2,132,199,0.08)' : 'rgba(2,132,199,0.05)', borderColor: 'rgba(2,132,199,0.2)' }]}>
            {(() => {
              const ruleWithHeader = forwardRules.find(r => r.header);
              const ruleWithFooter = forwardRules.find(r => r.footer);
              const header = dbSettings?.header_text || ruleWithHeader?.header || '(No custom header configured)';
              const footer = dbSettings?.footer_text || ruleWithFooter?.footer || '(No custom footer configured)';
              return (
                <>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#0284C7', marginBottom: 4 }}>{header}</Text>
                  <Text style={[styles.previewText, txt]}>Buy BankNifty 51,200 CE at 340-350 | Target 420 | SL 290. Strict trailing.</Text>
                  <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981', marginTop: 4 }}>{footer}</Text>
                </>
              );
            })()}
          </View>

          <Pressable style={styles.primaryBtn} onPress={() => onOpenModal('autoforward')}>
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
            <Text style={styles.primaryBtnText}>Customize Header & Footer</Text>
          </Pressable>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  sectionCard: {
    padding: 14,
    borderRadius: 16,
    // borderWidth: 1,
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
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
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
  mappingRow: {
    padding: 12,
    borderRadius: 12,
  },
  routeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  routeFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  routeChannelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
    minWidth: 0,
  },
  channelIconMini: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(2,132,199,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  channelTitleText: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  targetTitleText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  activeTagMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(16,185,129,0.12)',
    flexShrink: 0,
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  activeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10B981',
  },
  delayTagMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(245,158,11,0.12)',
    flexShrink: 0,
  },
  delayTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginVertical: 6,
    paddingHorizontal: 2,
  },
  connectorLine: {
    flex: 1,
    height: 1,
  },
  connectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(2,132,199,0.1)',
  },
  connectorPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  filterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  filterChipFrom: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  filterFrom: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  filterChipTo: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(16,185,129,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
  },
  filterTo: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '700',
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  blockedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.08)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.2)',
  },
  blockedChipText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '600',
    flexShrink: 1,
  },
  delayBigBox: {
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    borderWidth: 1,
  },
  delayBigNumber: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  delayBigLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  delayPresetsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  delayPresetBtn: {
    flex: 1,
    minWidth: 48,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  delayPresetText: {
    fontSize: 12,
    fontWeight: '700',
  },
  previewBox: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    borderWidth: 1,
  },
  previewText: {
    fontSize: 12,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    borderRadius: 12,
    paddingVertical: 12,
    marginTop: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

