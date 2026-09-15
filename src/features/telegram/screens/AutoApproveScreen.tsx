import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface Props {
  chats: any[];
  summary: any;
  onOpenModal: (key: TelegramToolKey) => void;
}

export const AutoApproveScreen: React.FC<Props> = ({ chats, summary, onOpenModal }) => {
  const [globalEnabled, setGlobalEnabled] = useState(true);
  const [channelEnabled, setChannelEnabled] = useState<Record<string, boolean>>({});

  const displayChats = chats?.length > 0 ? chats : [
    { id: 'ch-1', title: 'Trading Guru VIP', members: 420 },
    { id: 'ch-2', title: 'Zero To Hero Trading', members: 890 },
    { id: 'ch-3', title: 'BankNifty Option Hub', members: 310 },
  ];

  return (
    <>
      {/* Hero */}
      <View className="flex-row items-center gap-3 p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3.5">
        <View className="w-12 h-12 rounded-xl bg-emerald-500/10 items-center justify-center">
          <Ionicons name="checkmark-done-circle" size={28} color="#10B981" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Auto Approve</Text>
          <Text className="text-xs text-slate-400 leading-4 mt-0.5">Instant approval of private channel join requests — zero manual work</Text>
        </View>
        <Switch
          value={globalEnabled}
          onValueChange={setGlobalEnabled}
          trackColor={{ false: '#334155', true: '#10B981' }}
          thumbColor="#FFFFFF"
        />
      </View>

      {/* Stats */}
      <View className="flex-row flex-wrap justify-between gap-y-2 mb-3.5">
        {[
          { label: 'CHANNELS', val: displayChats.length, color: '#0284C7', icon: 'megaphone-outline', bg: 'rgba(2,132,199,0.12)', hint: 'Target channels' },
          { label: 'APPROVED TODAY', val: summary?.autoApprovedToday ?? 0, color: '#10B981', icon: 'checkmark-circle-outline', bg: 'rgba(16,185,129,0.12)', hint: 'Approved' },
          { label: 'PENDING', val: summary?.pendingRequests ?? 0, color: '#F59E0B', icon: 'time-outline', bg: 'rgba(245,158,11,0.12)', hint: 'Waitlist' },
        ].map((s, i) => (
          <StatCard
            key={i}
            label={s.label}
            value={s.val}
            icon={s.icon}
            color={s.color}
            bg={s.bg}
            sub={s.hint}
          />
        ))}
      </View>

      {/* How it Works */}
      <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
        <Text className="text-sm font-bold text-white">How it Works</Text>
        <View className="gap-2.5 mt-2.5">
          {[
            { step: '1', text: 'User clicks join request on your private Telegram channel', color: '#0284C7' },
            { step: '2', text: 'GAP Auto Approve Bot detects the request in real-time', color: '#8B5CF6' },
            { step: '3', text: 'Request instantly approved — user enters channel automatically', color: '#10B981' },
          ].map((item) => (
            <View key={item.step} className="flex-row items-start gap-2.5">
              <View className="w-7 h-7 rounded-full items-center justify-center bg-[#111317] border border-[#262930]">
                <Text className="text-xs font-black" style={{ color: item.color }}>{item.step}</Text>
              </View>
              <Text className="text-[13px] leading-5 flex-1 pt-1 text-slate-300">{item.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Channel Toggles */}
      <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
        <Text className="text-sm font-bold text-white">Channel Configuration</Text>
        <View className="gap-2 mt-2.5">
          {displayChats.map((ch: any) => {
            const enabled = channelEnabled[ch.id] !== undefined ? channelEnabled[ch.id] : globalEnabled;
            return (
              <View key={ch.id} className="flex-row items-center gap-2.5 p-2.5 rounded-xl bg-[#111317] border border-[#262930]">
                <View className="w-8 h-8 rounded-full bg-[#0084FF] items-center justify-center">
                  <Text className="text-white font-bold text-xs">{(ch.title || 'C').charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold text-white" numberOfLines={1}>{ch.title}</Text>
                  <Text className="text-[10px] text-slate-400 mt-0.5">{enabled ? '🟢 Auto Approve Active' : '🔴 Manual Mode'}</Text>
                </View>
                <Switch
                  value={enabled}
                  onValueChange={(val) => setChannelEnabled((prev) => ({ ...prev, [ch.id]: val }))}
                  trackColor={{ false: '#334155', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            );
          })}
        </View>
      </View>

      {/* Bot Setup CTA */}
      <Pressable className="flex-row items-center justify-center gap-2 bg-emerald-600 rounded-xl py-3.5 active:opacity-80" onPress={() => onOpenModal('auto_approve')}>
        <Ionicons name="settings-outline" size={16} color="#FFFFFF" />
        <Text className="text-white text-sm font-bold">Configure Bot Settings</Text>
      </Pressable>
    </>
  );
};
