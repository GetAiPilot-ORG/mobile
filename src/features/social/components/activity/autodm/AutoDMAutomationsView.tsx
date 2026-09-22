import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { AutoDMAccount, AutoDMAutomationItem } from '../../../types';
import { openSocialHandoff } from '../../../utils/socialHandoff';

export interface AutoDMAutomationsViewProps {
  dynamicAutomations: AutoDMAutomationItem[];
  isLoading: boolean;
  activeAutoDMAccount?: AutoDMAccount;
  onToggleRule: (id: string, currentActive?: boolean) => void;
}

export const AutoDMAutomationsView: React.FC<AutoDMAutomationsViewProps> = ({
  dynamicAutomations,
  isLoading,
  activeAutoDMAccount,
  onToggleRule,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [autodmSearch, setAutodmSearch] = useState('');
  const [autodmStatusFilter, setAutodmStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const filteredAutomations = dynamicAutomations.filter((a) => {
    if (autodmStatusFilter === 'active' && !a.is_active) return false;
    if (autodmStatusFilter === 'inactive' && a.is_active) return false;
    if (autodmSearch.trim()) {
      const q = autodmSearch.toLowerCase().trim();
      const nameMatch = (a.name || '').toLowerCase().includes(q);
      const keyMatch = (a.keywords || [a.keyword]).some((k) =>
        (k || '').toLowerCase().includes(q)
      );
      const textMatch = (a.comment_reply_text || a.reply_text || '').toLowerCase().includes(q);
      if (!nameMatch && !keyMatch && !textMatch) return false;
    }
    return true;
  });

  return (
    <View style={{ gap: 12 }}>
      {/* Search & Filter Controls */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            padding: 12,
            gap: 10,
          },
        ]}
      >
        <View
          style={[
            styles.inboxSearchInputBox,
            {
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
        >
          <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            style={[styles.inboxSearchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="Search automations by keyword, title..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={autodmSearch}
            onChangeText={setAutodmSearch}
          />
          {Boolean(autodmSearch) && (
            <Pressable onPress={() => setAutodmSearch('')}>
              <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
        </View>

        {/* Status Chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {(['all', 'active', 'inactive'] as const).map((st) => {
            const isSelected = autodmStatusFilter === st;
            return (
              <Pressable
                key={st}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAutodmStatusFilter(st);
                }}
                style={[
                  styles.statusChip,
                  {
                    backgroundColor: isSelected
                      ? 'rgba(59, 130, 246, 0.14)'
                      : isDark
                        ? '#1e293b'
                        : '#f1f5f9',
                    borderColor: isSelected ? '#3b82f6' : 'transparent',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.statusChipText,
                    {
                      color: isSelected ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b',
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}
                >
                  {st === 'all' ? 'All Automations' : st === 'active' ? 'Active' : 'Paused'}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Dynamic Automations List */}
      {isLoading && dynamicAutomations.length === 0 ? (
        <View style={{ paddingVertical: 36, alignItems: 'center', gap: 8 }}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b', fontWeight: '500' }}>
            Loading active Instagram automations...
          </Text>
        </View>
      ) : dynamicAutomations.length > 0 ? (
        <View style={{ gap: 14 }}>
          {filteredAutomations.map((item) => {
            const keywordsList =
              item.keywords && item.keywords.length > 0
                ? item.keywords
                : item.keyword
                  ? [item.keyword]
                  : ['link'];

            const openingMsg =
              item.response_flow?.opening_message ||
              item.response_flow?.nodes?.[0]?.content;
            const openingBtn = item.response_flow?.opening_button;
            const buttonNodes: Array<{ id?: string; url?: string; title?: string }> = [];
            item.response_flow?.nodes?.forEach((node) => {
              if (node.buttons && Array.isArray(node.buttons)) {
                buttonNodes.push(...node.buttons);
              }
            });

            const formattedCreatedDate = new Date(item.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });
            const formattedEndDate = item.ends_at
              ? new Date(item.ends_at).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
              })
              : null;

            return (
              <View
                key={item.id}
                style={[
                  styles.autodmItemCard,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#ffffff',
                    borderColor: item.is_active
                      ? isDark
                        ? 'rgba(59, 130, 246, 0.4)'
                        : 'rgba(59, 130, 246, 0.3)'
                      : isDark
                        ? '#1e293b'
                        : '#e2e8f0',
                  },
                ]}
              >
                {/* Card Top Strip: Channel & Status & Toggle */}
                <View style={styles.autodmItemHeader}>
                  <View style={styles.autodmItemHeaderLeft}>
                    <View
                      style={[
                        styles.autodmItemIconCircle,
                        {
                          backgroundColor: item.is_active
                            ? 'rgba(225, 48, 108, 0.12)'
                            : isDark
                              ? '#1e293b'
                              : '#f1f5f9',
                        },
                      ]}
                    >
                      <Ionicons
                        name="logo-instagram"
                        size={20}
                        color={item.is_active ? '#e1306c' : isDark ? '#64748b' : '#94a3b8'}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text
                          style={[
                            styles.autodmItemTitle,
                            { color: isDark ? '#f8fafc' : '#0f172a' },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name || 'Untitled Automation'}
                        </Text>
                        <View
                          style={[
                            styles.autodmStatusTag,
                            {
                              backgroundColor: item.is_active
                                ? 'rgba(34, 197, 94, 0.12)'
                                : isDark
                                  ? '#1e293b'
                                  : '#f1f5f9',
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.autodmStatusDot,
                              { backgroundColor: item.is_active ? '#22c55e' : '#94a3b8' },
                            ]}
                          />
                          <Text
                            style={[
                              styles.autodmStatusTagText,
                              { color: item.is_active ? '#16a34a' : '#64748b' },
                            ]}
                          >
                            {item.is_active ? 'Active' : 'Paused'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.autodmItemSubDate}>
                        Created {formattedCreatedDate}
                        {formattedEndDate ? ` • Active until ${formattedEndDate}` : ''}
                      </Text>
                    </View>
                  </View>

                  <Switch
                    value={item.is_active}
                    onValueChange={() => onToggleRule(item.id, item.is_active)}
                    trackColor={{ false: isDark ? '#334155' : '#cbd5e1', true: '#3b82f6' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Trigger & Condition Badges Strip */}
                <View style={styles.autodmBadgesRow}>
                  <View style={styles.autodmTriggerPill}>
                    <Ionicons name="chatbubble-ellipses" size={12} color="#e1306c" />
                    <Text style={styles.autodmTriggerPillText}>Comment on Post</Text>
                  </View>

                  {keywordsList.map((kw, i) => (
                    <View key={i} style={styles.autodmKeywordBadge}>
                      <Text style={styles.autodmKeywordBadgeHash}>#</Text>
                      <Text style={styles.autodmKeywordBadgeText}>{kw}</Text>
                    </View>
                  ))}

                  <View style={[styles.autodmMetaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.autodmMetaPillText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {item.is_case_sensitive ? 'Aa Case Sensitive' : 'Case Insensitive'}
                    </Text>
                  </View>

                  <View style={[styles.autodmMetaPill, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                    <Text style={[styles.autodmMetaPillText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {item.require_follow ? '👤 Must Follow' : '👤 No Follow Req'}
                    </Text>
                  </View>
                </View>

                {/* 2-Step Interactive Themed Funnel Visualizer */}
                <View
                  style={[
                    styles.autodmFunnelContainer,
                    {
                      backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  {/* Step 1: Public Comment Trigger & Reply */}
                  <View style={styles.autodmStepBlock}>
                    <View style={styles.autodmStepHeader}>
                      <View style={styles.autodmStepNumberBadge}>
                        <Text style={styles.autodmStepNumberText}>1</Text>
                      </View>
                      <Text style={[styles.autodmStepTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        PUBLIC COMMENT AUTO-REPLY
                      </Text>
                    </View>

                    {Boolean(item.comment_reply_text) ? (
                      <View
                        style={[
                          styles.autodmCommentBubble,
                          {
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                          },
                        ]}
                      >
                        <View style={styles.autodmBubbleAuthorRow}>
                          <Ionicons name="logo-instagram" size={12} color="#e1306c" />
                          <Text style={[styles.autodmBubbleAuthor, { color: '#e1306c' }]}>
                            @{activeAutoDMAccount?.username || 'account'}
                          </Text>
                          <View style={styles.autodmBotTagPill}>
                            <Text style={styles.autodmBotTag}>BOT</Text>
                          </View>
                        </View>
                        <Text style={[styles.autodmBubbleText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                          &quot;{item.comment_reply_text}&quot;
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.autodmEmptyStepText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                        No public reply configured (Instant DM only)
                      </Text>
                    )}
                  </View>

                  {/* Connector Arrow */}
                  <View style={styles.autodmFunnelConnector}>
                    <View style={[styles.autodmFunnelLine, { backgroundColor: isDark ? '#1e293b' : '#cbd5e1' }]} />
                    <View
                      style={[
                        styles.autodmFunnelBadge,
                        {
                          backgroundColor: isDark ? '#1e293b' : '#ffffff',
                          borderColor: isDark ? '#334155' : '#cbd5e1',
                        },
                      ]}
                    >
                      <Ionicons name="arrow-down" size={11} color="#3b82f6" />
                      <Text style={styles.autodmFunnelBadgeText}>Instant DM Triggered</Text>
                    </View>
                    <View style={[styles.autodmFunnelLine, { backgroundColor: isDark ? '#1e293b' : '#cbd5e1' }]} />
                  </View>

                  {/* Step 2: Private DM Flow */}
                  <View style={styles.autodmStepBlock}>
                    <View style={styles.autodmStepHeader}>
                      <View style={[styles.autodmStepNumberBadge, { backgroundColor: '#3b82f6' }]}>
                        <Text style={styles.autodmStepNumberText}>2</Text>
                      </View>
                      <Text style={[styles.autodmStepTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                        INSTAGRAM DM FUNNEL
                      </Text>
                    </View>

                    {Boolean(openingMsg) ? (
                      <View
                        style={[
                          styles.autodmDMBubble,
                          {
                            backgroundColor: isDark ? '#1e293b' : '#ffffff',
                            borderColor: isDark ? '#334155' : '#e2e8f0',
                          },
                        ]}
                      >
                        <View style={styles.autodmBubbleAuthorRow}>
                          <Ionicons name="paper-plane" size={12} color="#3b82f6" />
                          <Text style={[styles.autodmBubbleAuthor, { color: '#3b82f6' }]}>
                            Direct Message Sequence
                          </Text>
                        </View>
                        <Text style={[styles.autodmBubbleText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                          &quot;{openingMsg}&quot;
                        </Text>

                        {/* Interactive Button Preview */}
                        {Boolean(openingBtn) && (
                          <View style={styles.autodmBtnPreviewPill}>
                            <Ionicons name="flash" size={12} color="#ffffff" />
                            <Text style={styles.autodmBtnPreviewText}>{openingBtn}</Text>
                          </View>
                        )}

                        {/* Node URL Button Preview */}
                        {buttonNodes.map((btn, bIdx) => (
                          <View key={bIdx} style={styles.autodmLinkBtnPreviewPill}>
                            <Ionicons name="link" size={12} color="#3b82f6" />
                            <Text style={styles.autodmLinkBtnPreviewText}>
                              {btn.title || 'Open link'} ({btn.url})
                            </Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.autodmEmptyStepText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                        No DM sequence configured
                      </Text>
                    )}
                  </View>
                </View>

                {/* Card Telemetry Details Grid */}
                <View
                  style={[
                    styles.autodmCardTelemetryGrid,
                    {
                      backgroundColor: isDark ? '#0b0f19' : '#f8fafc',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  <View style={styles.autodmCardTelemetryCol}>
                    <Text style={[styles.autodmCardTelemetryNum, { color: '#3b82f6' }]}>
                      {item.comments ?? 0}
                    </Text>
                    <Text style={styles.autodmCardTelemetryLabel}>Comments Replied</Text>
                  </View>
                  <View style={styles.autodmCardTelemetryCol}>
                    <Text style={[styles.autodmCardTelemetryNum, { color: '#22c55e' }]}>
                      {item.dms_sent ?? 0}
                    </Text>
                    <Text style={styles.autodmCardTelemetryLabel}>DMs Delivered</Text>
                  </View>
                  <View style={styles.autodmCardTelemetryCol}>
                    <Text style={[styles.autodmCardTelemetryNum, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {item.follower_count_at_create ?? 0}
                    </Text>
                    <Text style={styles.autodmCardTelemetryLabel}>Setup Followers</Text>
                  </View>
                  <View style={styles.autodmCardTelemetryCol}>
                    <Text style={[styles.autodmCardTelemetryNum, { color: '#e1306c' }]}>
                      {item.schedule_type ? '7 Days' : 'Active'}
                    </Text>
                    <Text style={styles.autodmCardTelemetryLabel}>Active Window</Text>
                  </View>
                </View>

                {/* Card Footer */}
                <View style={styles.autodmItemFooter}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="shield-checkmark" size={13} color="#16a34a" />
                    <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b' }}>
                      Verified Graph API Automation
                    </Text>
                  </View>

                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 6,
                      backgroundColor: item.is_active ? 'rgba(34, 197, 94, 0.12)' : isDark ? '#334155' : '#e2e8f0',
                    }}
                  >
                    <View
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: item.is_active ? '#22c55e' : '#94a3b8',
                      }}
                    />
                    <Text
                      style={{
                        fontSize: 10,
                        fontWeight: '700',
                        color: item.is_active ? '#22c55e' : isDark ? '#94a3b8' : '#64748b',
                      }}
                    >
                      {item.is_active ? 'Active' : 'Paused'}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              paddingVertical: 32,
              alignItems: 'center',
              gap: 8,
            },
          ]}
        >
          <Ionicons name="flash-outline" size={38} color={isDark ? '#475569' : '#cbd5e1'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            No Automations Found
          </Text>
          <Text style={[styles.emptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Create keyword triggers to automatically comment back and send instant Instagram DMs.
          </Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openSocialHandoff('new-automation');
            }}
            style={[styles.primaryActionBtn, { backgroundColor: '#3b82f6', marginTop: 6 }]}
          >
            <Ionicons name="add" size={14} color="#ffffff" />
            <Text style={styles.primaryActionBtnText}>Create Automation</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inboxSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  inboxSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
  },
  autodmItemCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  autodmItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  autodmItemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    marginRight: 10,
  },
  autodmItemIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  autodmItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    maxWidth: 180,
  },
  autodmStatusTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  autodmStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  autodmStatusTagText: {
    fontSize: 10,
    fontWeight: '700',
  },
  autodmItemSubDate: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  autodmBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  autodmTriggerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autodmTriggerPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e1306c',
  },
  autodmKeywordBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  autodmKeywordBadgeHash: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3b82f6',
  },
  autodmKeywordBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#3b82f6',
    textTransform: 'uppercase',
  },
  autodmMetaPill: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  autodmMetaPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  autodmFunnelContainer: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    gap: 8,
  },
  autodmStepBlock: {
    gap: 6,
  },
  autodmStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  autodmStepNumberBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  autodmStepNumberText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
  },
  autodmStepTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  autodmCommentBubble: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 4,
  },
  autodmBubbleAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  autodmBubbleAuthor: {
    fontSize: 11,
    fontWeight: '700',
  },
  autodmBotTagPill: {
    backgroundColor: 'rgba(225, 48, 108, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  autodmBotTag: {
    fontSize: 8,
    fontWeight: '900',
    color: '#e1306c',
  },
  autodmBubbleText: {
    fontSize: 12,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  autodmEmptyStepText: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  autodmFunnelConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginVertical: 2,
  },
  autodmFunnelLine: {
    flex: 1,
    height: 1,
  },
  autodmFunnelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  autodmFunnelBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#3b82f6',
  },
  autodmDMBubble: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  autodmBtnPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginTop: 2,
  },
  autodmBtnPreviewText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  autodmLinkBtnPreviewPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  autodmLinkBtnPreviewText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '600',
  },
  autodmCardTelemetryGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  autodmCardTelemetryCol: {
    alignItems: 'center',
  },
  autodmCardTelemetryNum: {
    fontSize: 14,
    fontWeight: '800',
  },
  autodmCardTelemetryLabel: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
  },
  autodmItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  autodmActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  autodmActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 18,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});
