import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCrmTheme } from '../hooks/useCrmTheme';
import { getColors } from '@/theme';
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
  const { isDark, accentColor } = useCrmTheme();
  const colors = getColors(isDark);

  const stageCfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.lead;
  const currencySymbol = deal.currency === 'INR' ? '₹' : '$';

  return (
    <Pressable
      className="rounded-2xl p-4 mb-3 border shadow-sm shadow-black/5 active:opacity-90 active:scale-[0.99]"
      style={{
        backgroundColor: colors.card,
        borderColor: colors.border,
      }}
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2.5 min-w-0">
          <Text
            className="text-base font-semibold tracking-tight"
            style={{ color: colors.textPrimary }}
            numberOfLines={1}
          >
            {deal.title}
          </Text>
          {deal.contact ? (
            <Text
              className="text-xs mt-1"
              style={{ color: colors.textSecondary }}
              numberOfLines={1}
            >
              <Ionicons name="person-outline" size={11} color={colors.textSecondary} />{' '}
              {`${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim()}
              {deal.contact.company ? ` • ${deal.contact.company}` : ''}
            </Text>
          ) : null}
        </View>

        <Pressable
          className="flex-row items-center gap-1 px-2 py-1 rounded-lg"
          style={{ backgroundColor: stageCfg.bg }}
          onPress={onStageChange || onPress}
          hitSlop={6}
        >
          <Text className="text-[11px] font-bold" style={{ color: stageCfg.color }}>
            {stageCfg.label}
          </Text>
          <Ionicons name="swap-horizontal" size={12} color={stageCfg.color} />
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between my-1.5">
        <Text className="text-xl font-bold tracking-tight" style={{ color: accentColor }}>
          {currencySymbol}
          {Number(deal.value || 0).toLocaleString()}
        </Text>
        {deal.probability !== undefined && deal.probability !== null ? (
          <View
            className="px-2 py-1 rounded-md"
            style={{ backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' }}
          >
            <Text className="text-[11px] font-medium" style={{ color: colors.textSecondary }}>
              {deal.probability}% Win Prob
            </Text>
          </View>
        ) : null}
      </View>

      <View
        className="flex-row items-center justify-between pt-2 border-t mt-1"
        style={{ borderTopColor: colors.border }}
      >
        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text className="text-[11px]" style={{ color: colors.textMuted }}>
            {deal.expected_close_date ? `Close: ${deal.expected_close_date}` : 'No date'}
          </Text>
        </View>

        {deal.assignee ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="person-circle-outline" size={13} color={colors.textMuted} />
            <Text className="text-[11px]" style={{ color: colors.textMuted }}>
              {deal.assignee.name}
            </Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};
