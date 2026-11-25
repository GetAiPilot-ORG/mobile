import React, { memo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Pin,
  BellOff,
  Clock,
  Check,
  CheckCheck,
  UserCheck,
  Sparkles,
} from 'lucide-react-native';

import { NormalizedConversation } from '../types';
import { DeterministicAvatar } from './DeterministicAvatar';
import { ChannelBadge } from './ChannelBadge';
import { useTheme, getColors } from '@/theme';
import {
  formatSmartTime,
  calculateSlaStatus,
  renderHighlightedText,
  resolveContactProfile,
} from '../utils/inboxHelpers';

interface ConversationCardProps {
  conversation: NormalizedConversation;
  onPress: () => void;
  onLongPress?: () => void;
  searchQuery?: string;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onMarkRead?: () => void;
  onAssign?: () => void;
  onResolve?: () => void;
}

export const ConversationCard: React.FC<ConversationCardProps> = memo(({
  conversation,
  onPress,
  onLongPress,
  searchQuery = '',
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const profileInfo = resolveContactProfile(conversation.contact, conversation.channel);
  const contactName = profileInfo.displayName;
  const isDefaultProfile = profileInfo.isDefaultTitle;
  const lastMsg = conversation.last_message;
  const isUnread = (conversation.unread_count || 0) > 0;
  const isBotActive =
    conversation.bot_enabled !== false && !conversation.bot_paused;

  // Format smart timestamp & calculate SLA indicator
  const timeFormatted = formatSmartTime(lastMsg.created_at);
  const sla = calculateSlaStatus(
    lastMsg.created_at,
    conversation.unread_count,
    lastMsg.direction
  );

  // Assignee label resolution
  const assignedAgentName = conversation.assigned_agent_name;
  const hasAssignee = !!assignedAgentName || !!conversation.assigned_to;
  const assigneeDisplay = assignedAgentName
    ? assignedAgentName.split(' ')[0]
    : 'Assigned';

  // Mock / extracted tags from metadata (fallback to sensible demo tags)
  const tags: string[] = Array.isArray(conversation.metadata?.tags)
    ? conversation.metadata!.tags
    : conversation.metadata?.lead_score
    ? ['High Intent', 'Lead']
    : [];

  const isPinned = !!conversation.metadata?.pinned;
  const isMuted = !!conversation.metadata?.muted;

  // Direction & sender prefix
  const isOutbound = lastMsg.direction === 'outbound';
  const isAiReply = isOutbound && isBotActive;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    if (isSelectionMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onPress();
    }
  };

  const handleLongPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {}
    }
    if (onLongPress) {
      onLongPress();
    }
  };

  // Card background & border based on unread state
  const cardBg = isUnread
    ? isDark
      ? 'rgba(112, 85, 232, 0.10)'
      : 'rgba(112, 85, 232, 0.04)'
    : colors.card;

  const cardBorder = isUnread
    ? isDark
      ? 'rgba(129, 140, 248, 0.32)'
      : 'rgba(112, 85, 232, 0.22)'
    : isDark
    ? 'rgba(255, 255, 255, 0.06)'
    : 'rgba(0, 0, 0, 0.05)';

  return (
    <Pressable
      cssInterop={false}
      onPress={handlePress}
      onLongPress={handleLongPress}
      accessibilityRole="button"
      accessibilityLabel={`${contactName}, ${conversation.channel}, ${
        isUnread ? `${conversation.unread_count} unread` : 'read'
      }, ${assignedAgentName ? `assigned to ${assignedAgentName}` : 'unassigned'}, ${timeFormatted}`}
      style={({ pressed }) => [
        styles.cardContainer,
        {
          backgroundColor: isSelected
            ? isDark
              ? 'rgba(129, 140, 248, 0.18)'
              : 'rgba(112, 85, 232, 0.12)'
            : cardBg,
          borderColor: isSelected
            ? '#7055E8'
            : cardBorder,
          transform: [{ scale: pressed ? 0.98 : 1 }],
          opacity: pressed ? 0.92 : 1,
        },
      ]}
    >
      {/* Multi-Select Checkbox */}
      {isSelectionMode && (
        <View style={styles.selectionColumn}>
          <View
            style={[
              styles.checkboxCircle,
              isSelected && {
                backgroundColor: colors.accent,
                borderColor: colors.accent,
              },
            ]}
          >
            {isSelected && <Check size={12} color="#FFFFFF" strokeWidth={3} />}
          </View>
        </View>
      )}

      {/* Deterministic Pastel Avatar + Badges */}
      <View style={styles.avatarWrapper}>
        <DeterministicAvatar
          name={contactName}
          phoneOrHandle={conversation.contact?.handle_or_phone}
          avatarUrl={profileInfo.avatarUrl}
          channel={conversation.channel}
          isBotActive={isBotActive}
          isDefaultProfile={isDefaultProfile}
          size={46}
        />
      </View>

      {/* Main Content Column */}
      <View style={styles.contentColumn}>
        {/* Top Header: Contact Name + Pinned/Muted + Timestamp & SLA */}
        <View style={styles.headerRow}>
          <View style={styles.nameContainer}>
            {renderHighlightedText(
              contactName,
              searchQuery,
              [
                styles.contactName,
                {
                  color: colors.textPrimary,
                  fontWeight: isUnread ? '700' : '600',
                },
              ],
              [styles.highlightedText, { backgroundColor: colors.accentSoft }]
            )}

            {isPinned && (
              <Pin
                size={12}
                color={colors.accent}
                strokeWidth={2.4}
                style={{ marginLeft: 5 }}
              />
            )}
            {isMuted && (
              <BellOff
                size={12}
                color={colors.textSecondary}
                strokeWidth={2}
                style={{ marginLeft: 5 }}
              />
            )}
          </View>

          {/* Time & SLA Indicator */}
          <View style={styles.timeContainer}>
            {sla.isOverdue || sla.isWarning ? (
              <View
                style={[
                  styles.slaBadge,
                  {
                    backgroundColor: sla.isOverdue
                      ? 'rgba(239, 68, 68, 0.12)'
                      : 'rgba(245, 158, 11, 0.12)',
                  },
                ]}
              >
                <Clock
                  size={10}
                  color={sla.isOverdue ? '#EF4444' : '#F59E0B'}
                  strokeWidth={2.2}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[
                    styles.slaText,
                    { color: sla.isOverdue ? '#EF4444' : '#F59E0B' },
                  ]}
                >
                  {timeFormatted}
                </Text>
              </View>
            ) : (
              <Text
                style={[
                  styles.timestamp,
                  {
                    color: isUnread ? colors.accent : colors.textSecondary,
                    fontWeight: isUnread ? '600' : '500',
                  },
                ]}
              >
                {timeFormatted}
              </Text>
            )}
          </View>
        </View>

        {/* Message Preview (Two Lines Max) */}
        <View style={styles.previewRow}>
          <Text
            style={[
              styles.previewText,
              {
                color: isUnread ? colors.textPrimary : colors.textSecondary,
                fontWeight: isUnread ? '500' : '400',
              },
            ]}
            numberOfLines={2}
          >
            {isOutbound && (
              <Text style={{ fontWeight: '600', color: colors.textPrimary }}>
                {isAiReply ? 'AI: ' : 'You: '}
              </Text>
            )}
            {lastMsg.content || 'Media attachment'}
          </Text>
        </View>

        {/* Bottom Meta Row: Channel + Assignee + Tags + Unread Pill */}
        <View style={styles.metaRow}>
          <View style={styles.metaChipsLeft}>
            {/* Channel Badge */}
            <ChannelBadge channel={conversation.channel} />

            {/* Telegram Bot Chip if Applicable */}
            {conversation.bot_name ? (
              <View
                style={[
                  styles.botChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(2, 132, 199, 0.16)'
                      : '#E0F2FE',
                    borderColor: isDark
                      ? 'rgba(2, 132, 199, 0.32)'
                      : '#BAE6FD',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.botChipText,
                    { color: isDark ? '#38BDF8' : '#0284C7' },
                  ]}
                  numberOfLines={1}
                >
                  {conversation.bot_name}
                </Text>
              </View>
            ) : null}

            {/* Assignee Chip: Mini avatar/dot + Name or Amber Unassigned Chip */}
            {hasAssignee ? (
              <View
                style={[
                  styles.assigneeChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : 'rgba(0, 0, 0, 0.04)',
                  },
                ]}
              >
                <UserCheck
                  size={11}
                  color={colors.textSecondary}
                  strokeWidth={2}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.assigneeText,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                >
                  {assigneeDisplay}
                </Text>
              </View>
            ) : (
              <View
                style={[
                  styles.unassignedChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(245, 158, 11, 0.10)'
                      : 'rgba(245, 158, 11, 0.08)',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                  },
                ]}
              >
                <Text style={styles.unassignedText}>Unassigned</Text>
              </View>
            )}

            {/* Label Chips (Up to 2 with overflow) */}
            {tags.slice(0, 2).map((t, idx) => (
              <View
                key={idx}
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(112, 85, 232, 0.14)'
                      : 'rgba(112, 85, 232, 0.08)',
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.accent }]}>
                  {t}
                </Text>
              </View>
            ))}
            {tags.length > 2 && (
              <View
                style={[
                  styles.tagChip,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  +{tags.length - 2}
                </Text>
              </View>
            )}
          </View>

          {/* Unread Pill Badge (Capped at 99+) */}
          {isUnread && (
            <View
              style={[
                styles.unreadBadge,
                { backgroundColor: colors.accent },
              ]}
            >
              <Text style={styles.unreadBadgeText}>
                {conversation.unread_count > 99
                  ? '99+'
                  : conversation.unread_count}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    padding: 13,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  avatarWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  selectionColumn: {
    marginRight: 10,
    justifyContent: 'center',
    alignSelf: 'center',
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.8,
    borderColor: '#A1A1AA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentColumn: {
    flex: 1,
    minWidth: 0,
    marginLeft: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  contactName: {
    fontSize: 15.5,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  highlightedText: {
    fontWeight: '800',
    borderRadius: 4,
  },
  timeContainer: {
    flexShrink: 0,
    alignItems: 'flex-end',
  },
  timestamp: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  slaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  slaText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  previewRow: {
    marginBottom: 8,
  },
  previewText: {
    fontSize: 13.5,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  metaChipsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  botChip: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  botChipText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  assigneeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  assigneeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  unassignedChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
    borderWidth: 0.8,
  },
  unassignedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D97706',
  },
  tagChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 7,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    lineHeight: 14,
  },
});

export default ConversationCard;
