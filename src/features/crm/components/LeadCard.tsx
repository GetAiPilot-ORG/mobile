import React from 'react';
import { Text, View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMContact, ContactStatus } from '../types';

interface LeadCardProps {
  lead: CRMContact;
  onPress: () => void;
  onQuickCall?: () => void;
  onQuickEmail?: () => void;
}

const STATUS_CONFIG: Partial<Record<ContactStatus, { label: string; bg: string; text: string; dot: string }>> = {
  lead: { label: 'New Lead', bg: 'bg-[#0084FF]/15', text: 'text-[#0084FF]', dot: 'bg-[#0084FF]' },
  prospect: { label: 'Prospect', bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  customer: { label: 'Customer', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  churned: { label: 'Churned', bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400' },
  open: { label: 'Open', bg: 'bg-[#0084FF]/15', text: 'text-[#0084FF]', dot: 'bg-[#0084FF]' },
  active: { label: 'Active', bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
  archived: { label: 'Archived', bg: 'bg-slate-700/20', text: 'text-slate-400', dot: 'bg-slate-400' },
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onPress, onQuickCall, onQuickEmail }) => {
  const statusCfg = STATUS_CONFIG[lead.status] || {
    label: lead.status || 'Lead',
    bg: 'bg-[#0084FF]/15',
    text: 'text-[#0084FF]',
    dot: 'bg-[#0084FF]',
  };

  const handleCall = () => {
    if (onQuickCall) {
      onQuickCall();
    } else if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  };

  const handleEmail = () => {
    if (onQuickEmail) {
      onQuickEmail();
    } else if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  return (
    <Pressable
      className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-3 active:bg-[#262930]"
      onPress={onPress}
    >
      <View className="flex-row items-center mb-2.5">
        <View className="w-10 h-10 rounded-xl bg-[#111317] border border-[#262930] items-center justify-center mr-3">
          <Text className="text-sm font-bold text-white">
            {(lead.first_name?.[0] || 'L').toUpperCase()}
            {(lead.last_name?.[0] || '').toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 mr-2">
          <Text className="text-base font-bold text-white tracking-tight" numberOfLines={1}>
            {lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed Lead'}
          </Text>
          {lead.company || lead.job_title ? (
            <Text className="text-xs text-slate-400 mt-0.5" numberOfLines={1}>
              {[lead.job_title, lead.company].filter(Boolean).join(' • ')}
            </Text>
          ) : null}
        </View>

        <View className={`flex-row items-center gap-1.5 px-2 py-1 rounded-lg ${statusCfg.bg}`}>
          <View className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
          <Text className={`text-[11px] font-bold ${statusCfg.text}`}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Meta Row */}
      <View className="flex-row flex-wrap gap-3 py-1.5 border-t border-[#262930]">
        {lead.phone ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="call-outline" size={13} color="#94A3B8" />
            <Text className="text-xs text-slate-400" numberOfLines={1}>
              {lead.phone}
            </Text>
          </View>
        ) : null}

        {lead.email ? (
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="mail-outline" size={13} color="#94A3B8" />
            <Text className="text-xs text-slate-400" numberOfLines={1}>
              {lead.email}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer */}
      <View className="flex-row items-center justify-between pt-2 border-t border-[#262930]">
        <View className="flex-row items-center gap-1.5 flex-1">
          <Ionicons name="person-circle-outline" size={15} color="#94A3B8" />
          <Text className="text-xs text-slate-400" numberOfLines={1}>
            {lead.assignee?.name || 'Unassigned'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {lead.phone ? (
            <Pressable
              className="w-7 h-7 rounded-lg bg-[#111317] border border-[#262930] items-center justify-center active:bg-[#262930]"
              onPress={handleCall}
              hitSlop={8}
            >
              <Ionicons name="call" size={13} color="#10B981" />
            </Pressable>
          ) : null}
          {lead.email ? (
            <Pressable
              className="w-7 h-7 rounded-lg bg-[#111317] border border-[#262930] items-center justify-center active:bg-[#262930]"
              onPress={handleEmail}
              hitSlop={8}
            >
              <Ionicons name="mail" size={13} color="#0084FF" />
            </Pressable>
          ) : null}
          <Ionicons name="chevron-forward" size={15} color="#64748B" />
        </View>
      </View>
    </Pressable>
  );
};
