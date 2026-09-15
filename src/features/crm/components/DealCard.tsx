import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMDeal, DealStage } from '../types';

interface DealCardProps {
  deal: CRMDeal;
  onPress: () => void;
  onStageChange?: () => void;
}

const STAGE_CONFIG: Record<DealStage, { label: string; color: string; bg: string }> = {
  lead: { label: 'Lead', color: '#94A3B8', bg: 'bg-slate-700/20' },
  qualified: { label: 'Qualified', color: '#0084FF', bg: 'bg-[#0084FF]/20' },
  proposal: { label: 'Proposal', color: '#F59E0B', bg: 'bg-amber-500/20' },
  negotiation: { label: 'Negotiation', color: '#A855F7', bg: 'bg-purple-500/20' },
  closed_won: { label: 'Closed Won', color: '#10B981', bg: 'bg-emerald-500/20' },
  closed_lost: { label: 'Closed Lost', color: '#EF4444', bg: 'bg-rose-500/20' },
};

export const DealCard: React.FC<DealCardProps> = ({ deal, onPress, onStageChange }) => {
  const stageCfg = STAGE_CONFIG[deal.stage] || STAGE_CONFIG.lead;
  const currencySymbol = deal.currency === 'INR' ? '₹' : '$';

  return (
    <Pressable
      className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-3 active:bg-[#262930]"
      onPress={onPress}
    >
      <View className="flex-row items-start justify-between mb-2">
        <View className="flex-1 mr-2.5">
          <Text className="text-base font-bold text-white tracking-tight" numberOfLines={1}>
            {deal.title}
          </Text>
          {deal.contact ? (
            <Text className="text-xs text-slate-400 mt-1" numberOfLines={1}>
              <Ionicons name="person-outline" size={11} color="#94A3B8" />{' '}
              {`${deal.contact.first_name || ''} ${deal.contact.last_name || ''}`.trim()}
              {deal.contact.company ? ` • ${deal.contact.company}` : ''}
            </Text>
          ) : null}
        </View>

        <Pressable
          className={`flex-row items-center gap-1 px-2.5 py-1 rounded-lg ${stageCfg.bg}`}
          onPress={onStageChange || onPress}
          hitSlop={6}
        >
          <Text className="text-[11px] font-bold" style={{ color: stageCfg.color }}>{stageCfg.label}</Text>
          <Ionicons name="swap-horizontal" size={12} color={stageCfg.color} />
        </Pressable>
      </View>

      <View className="flex-row items-center justify-between my-1.5">
        <Text className="text-xl font-bold text-emerald-400 tracking-tight">
          {currencySymbol}
          {Number(deal.value || 0).toLocaleString()}
        </Text>
        {deal.probability !== undefined && deal.probability !== null ? (
          <View className="bg-[#111317] border border-[#262930] px-2 py-0.5 rounded-md">
            <Text className="text-[11px] font-semibold text-slate-300">{deal.probability}% Win Prob</Text>
          </View>
        ) : null}
      </View>

      <View className="flex-row items-center justify-between pt-2 border-t border-[#262930] mt-1">
        <View className="flex-row items-center gap-1">
          <Ionicons name="calendar-outline" size={12} color="#94A3B8" />
          <Text className="text-[11px] text-slate-400">
            {deal.expected_close_date ? `Close: ${deal.expected_close_date}` : 'No date'}
          </Text>
        </View>

        {deal.assignee ? (
          <View className="flex-row items-center gap-1">
            <Ionicons name="person-circle-outline" size={13} color="#94A3B8" />
            <Text className="text-[11px] text-slate-400">{deal.assignee.name}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
};
