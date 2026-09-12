import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMDeal, DealStage } from '../types';

interface DealCardProps {
  deal: CRMDeal;
  onPress: () => void;
  onStageChange?: () => void;
}

const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bg: string }> = {
  lead: { label: 'Lead', color: '#9CA3AF', bg: 'rgba(156, 163, 175, 0.15)' },
  qualified: { label: 'Qualified', color: '#60A5FA', bg: 'rgba(59, 130, 246, 0.15)' },
  proposal: { label: 'Proposal', color: '#FBBF24', bg: 'rgba(245, 158, 11, 0.15)' },
  negotiation: { label: 'Negotiation', color: '#A78BFA', bg: 'rgba(139, 92, 246, 0.15)' },
  closed_won: { label: 'Closed Won', color: '#34D399', bg: 'rgba(16, 185, 129, 0.15)' },
  closed_lost: { label: 'Closed Lost', color: '#F87171', bg: 'rgba(239, 68, 68, 0.15)' },
};

export const DealCard: React.FC<DealCardProps> = ({ deal, onPress, onStageChange }) => {
  const stageCfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.lead;
  const currencySymbol = deal.currency === 'INR' ? '₹' : '$';

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>
            {deal.title}
          </Text>
          {deal.contact ? (
            <Text style={styles.contactName} numberOfLines={1}>
              <Ionicons name="person-outline" size={11} color="#9CA3AF" />{' '}
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
        <Text style={styles.value}>
          {currencySymbol}
          {Number(deal.value || 0).toLocaleString()}
        </Text>
        {deal.probability !== undefined && deal.probability !== null ? (
          <View style={styles.probBadge}>
            <Text style={styles.probText}>{deal.probability}% Win Prob</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Ionicons name="calendar-outline" size={12} color="#9CA3AF" />
          <Text style={styles.footerText}>
            {deal.expected_close_date ? `Close: ${deal.expected_close_date}` : 'No date'}
          </Text>
        </View>

        {deal.assignee ? (
          <View style={styles.footerItem}>
            <Ionicons name="person-circle-outline" size={13} color="#9CA3AF" />
            <Text style={styles.footerText}>{deal.assignee.name}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#262A34',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  cardPressed: {
    backgroundColor: '#20232B',
    borderColor: '#3B82F6',
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
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactName: {
    color: '#9CA3AF',
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
    color: '#10B981',
    letterSpacing: -0.5,
  },
  probBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  probText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#222630',
    marginTop: 4,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  footerText: {
    color: '#9CA3AF',
    fontSize: 11,
  },
});
