import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCrmTheme } from '../hooks/useCrmTheme';
import { CRMDeal, DealStage } from '../types';

interface DealCardProps {
  deal: CRMDeal;
  onPress: () => void;
  onStageChange?: () => void;
}

const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bg: string }> = {
  lead: { label: 'Lead', color: '#6B7280', bg: 'rgba(156, 163, 175, 0.15)' },
  qualified: { label: 'Qualified', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  proposal: { label: 'Proposal', color: '#D97706', bg: 'rgba(245, 158, 11, 0.15)' },
  negotiation: { label: 'Negotiation', color: '#8B5CF6', bg: 'rgba(139, 92, 246, 0.15)' },
  closed_won: { label: 'Closed Won', color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' },
  closed_lost: { label: 'Closed Lost', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export const DealCard: React.FC<DealCardProps> = ({ deal, onPress, onStageChange }) => {
  const { isDark, colors, accentColor } = useCrmTheme();

  const stageCfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.lead;
  const currencySymbol = deal.currency === 'INR' ? '₹' : '$';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {deal.title}
          </Text>
          {deal.contact ? (
            <Text style={[styles.contactName, { color: colors.textSecondary }]} numberOfLines={1}>
              <Ionicons name="person-outline" size={11} color={colors.textSecondary} />{' '}
              {`${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim()}
              {deal.contact.company ? ` • ${deal.contact.company}` : ''}
            </Text>
          ) : null}
        </View>

        <Pressable
          style={[styles.stageBadge, { backgroundColor: stageCfg.bg }]}
          onPress={onStageChange || onPress}
          hitSlop={6}
        >
          <Text style={[styles.stageText, { color: stageCfg.color }]}>{stageCfg.label}</Text>
          <Ionicons name="swap-horizontal" size={12} color={stageCfg.color} />
        </Pressable>
      </View>

      <View style={styles.middleRow}>
        <Text style={[styles.value, { color: accentColor }]}>
          {currencySymbol}
          {Number(deal.value || 0).toLocaleString()}
        </Text>
        {deal.probability !== undefined && deal.probability !== null ? (
          <View style={[styles.probBadge, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }]}>
            <Text style={[styles.probText, { color: colors.textSecondary }]}>{deal.probability}% Win Prob</Text>
          </View>
        ) : null}
      </View>

      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={[styles.footerText, { color: colors.textMuted }]}>
            {deal.expected_close_date ? `Close: ${deal.expected_close_date}` : 'No date'}
          </Text>
        </View>

        {deal.assignee ? (
          <View style={styles.footerItem}>
            <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
            <Text style={[styles.footerText, { color: colors.textMuted }]}>{deal.assignee.name}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleBlock: {
    flex: 1,
    marginRight: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactName: {
    fontSize: 12,
    marginTop: 3,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stageText: {
    fontSize: 11,
    fontWeight: '700',
  },
  middleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  probBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  probText: {
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    fontSize: 11,
  },
});
