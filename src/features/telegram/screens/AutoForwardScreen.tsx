import React, { useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

type AfSection = 'mappings' | 'filters' | 'blocked' | 'delays' | 'headers';

interface AutoForwardScreenProps {
  forwardRules: any[];
  onOpenModal: (key: TelegramToolKey) => void;
}

export const AutoForwardScreen: React.FC<AutoForwardScreenProps> = ({ forwardRules, onOpenModal }) => {
  const [afSection, setAfSection] = useState<AfSection>('mappings');
  const [selectedDelay, setSelectedDelay] = useState(0);

  const kpis = [
    { key: 'mappings', label: 'Active Mappings', value: (forwardRules || []).length, icon: 'arrow-redo', color: '#0284C7', bg: 'rgba(2,132,199,0.12)' },
    { key: 'filters', label: 'Text Filters', value: 0, icon: 'filter-outline', color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' },
    { key: 'blocked', label: 'Blocked Words', value: 0, icon: 'shield-outline', color: '#EF4444', bg: 'rgba(239,68,68,0.12)' },
    { key: 'delays', label: 'Delay (sec)', value: 0, icon: 'time-outline', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' },
  ];

  return (
    <>
      {/* Hero Card */}
      <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3.5">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center gap-2.5 flex-1">
            <View className="w-10 h-10 rounded-xl bg-sky-500/10 items-center justify-center">
              <Ionicons name="flash" size={20} color="#0084FF" />
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-base font-extrabold text-white" numberOfLines={1}>AutoForward Control</Text>
              <View className="flex-row items-center gap-1.5 mt-0.5">
                <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <Text className="text-slate-400 text-[11px] font-semibold">System Active</Text>
              </View>
            </View>
          </View>
          <Pressable
            className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl active:opacity-80"
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Linking.openURL('https://t.me/Gapautoforwardingbot');
            }}
          >
            <Ionicons name="logo-android" size={15} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Open Bot</Text>
          </Pressable>
        </View>
      </View>

      {/* KPI Grid */}
      <View className="flex-row flex-wrap justify-between gap-y-2 mb-3">
        {kpis.map((k) => (
          <StatCard
            key={k.key}
            label={k.label.toUpperCase()}
            value={k.value}
            icon={k.icon}
            color={k.color}
            bg={k.bg}
            sub={k.label}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setAfSection(k.key as AfSection);
            }}
          />
        ))}
        <StatCard
          label="TEXT ACTIONS"
          value="None"
          icon="text-outline"
          color="#10B981"
          bg="rgba(16,185,129,0.12)"
          sub="Text Actions"
          onPress={() => {
            if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAfSection('headers');
          }}
        />
      </View>

      {/* New Rule Button */}
      <Pressable className="flex-row items-center justify-center gap-1.5 bg-[#0084FF] rounded-xl py-3.5 mb-3 active:opacity-80" onPress={() => onOpenModal('autoforward')}>
        <Ionicons name="add" size={16} color="#FFFFFF" />
        <Text className="text-white text-xs font-bold">Configure New Forwarding Rule</Text>
      </Pressable>

      {/* MAPPINGS */}
      {afSection === 'mappings' && (
        <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
          <View className="flex-row items-center gap-2.5 mb-1">
            <View className="w-8 h-8 rounded-lg bg-sky-500/10 items-center justify-center">
              <Ionicons name="arrow-redo" size={14} color="#0084FF" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">Active Routing Rules</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">{Math.max((forwardRules || []).length, 2)} source-to-target forwarding channels configured</Text>
            </View>
          </View>
          <View className="gap-2 mt-2">
            {(forwardRules || []).map((rule, idx) => (
              <View key={`rule_${rule.id || idx}`} className="flex-row items-center p-2.5 rounded-xl bg-[#111317] border border-[#262930]">
                <View className="flex-row items-center gap-1.5 flex-1">
                  <View className="w-5 h-5 rounded-full bg-sky-500/10 items-center justify-center">
                    <Ionicons name="arrow-redo" size={12} color="#0084FF" />
                  </View>
                  <Text className="text-xs font-semibold text-white flex-1" numberOfLines={1}>{rule.source_chat_title || 'Source Channel'}</Text>
                </View>
                <Ionicons name="arrow-forward" size={14} color="#94A3B8" className="mx-2" />
                <View className="px-2 py-1 rounded-lg border bg-sky-500/10 border-sky-500/20 max-w-[45%]">
                  <Text className="text-[11px] font-semibold text-sky-400" numberOfLines={1}>{rule.target_chat_title || 'Target Channel'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* FILTERS */}
      {afSection === 'filters' && (
        <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
          <View className="flex-row items-center gap-2.5 mb-1">
            <View className="w-8 h-8 rounded-lg bg-purple-500/10 items-center justify-center">
              <Ionicons name="filter-outline" size={14} color="#8B5CF6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">Word Filters & Text Replacements</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Automatic link and username replacement rules</Text>
            </View>
          </View>
          <View className="gap-2 mt-2">
            {[
              { from: 't.me/old_channel', to: 't.me/TradingGuruVIP' },
              { from: '@competitor_bot', to: '@GetAiPilotBot' },
              { from: 'Call 9876543210', to: 'Visit getaipilot.in' },
            ].map((item, idx) => (
              <View key={idx} className="flex-row items-center gap-2 py-2 border-b border-[#262930] last:border-b-0">
                <Text className="text-[11px] text-red-400 font-semibold flex-1">{item.from}</Text>
                <Ionicons name="arrow-forward" size={14} color="#94A3B8" />
                <Text className="text-[11px] text-emerald-400 font-semibold flex-1">{item.to}</Text>
              </View>
            ))}
          </View>
          <Pressable className="flex-row items-center justify-center gap-1.5 bg-[#0084FF] rounded-xl py-3 mt-3 active:opacity-80" onPress={() => onOpenModal('autoforward')}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Add Replacement Rule</Text>
          </Pressable>
        </View>
      )}

      {/* BLOCKED */}
      {afSection === 'blocked' && (
        <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
          <View className="flex-row items-center gap-2.5 mb-1">
            <View className="w-8 h-8 rounded-lg bg-red-500/10 items-center justify-center">
              <Ionicons name="shield-outline" size={14} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">Blacklisted Keywords</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Messages with these keywords are automatically dropped</Text>
            </View>
          </View>
          <View className="flex-row flex-wrap gap-2 mt-2">
            {['spam', 'forex scam', '100x pump', 'wa.me/', 'dm for paid', 'free giveaway', 'binance scam'].map((chip, idx) => (
              <View key={idx} className="flex-row items-center gap-1 bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                <Text className="text-[11px] text-red-400 font-semibold">{chip}</Text>
                <Ionicons name="close-circle" size={12} color="#EF4444" />
              </View>
            ))}
          </View>
          <Pressable className="flex-row items-center justify-center gap-1.5 bg-[#0084FF] rounded-xl py-3 mt-3 active:opacity-80" onPress={() => onOpenModal('autoforward')}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Add Blocked Keyword</Text>
          </Pressable>
        </View>
      )}

      {/* DELAYS */}
      {afSection === 'delays' && (
        <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
          <View className="flex-row items-center gap-2.5 mb-1">
            <View className="w-8 h-8 rounded-lg bg-amber-500/10 items-center justify-center">
              <Ionicons name="time-outline" size={14} color="#F59E0B" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">Forwarding Delay Interval</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Prevent Telegram rate-limiting & simulate natural typing</Text>
            </View>
          </View>
          <View className="items-center p-5 rounded-xl my-3 bg-[#111317]">
            <Text className="text-5xl font-black text-white tracking-tighter">{selectedDelay}</Text>
            <Text className="text-xs text-slate-400 font-semibold mt-1">seconds delay active</Text>
          </View>
          <View className="flex-row gap-2 flex-wrap">
            {[0, 5, 15, 30, 60].map((sec) => (
              <Pressable
                key={sec}
                className={`flex-1 py-2.5 rounded-xl border items-center ${
                  selectedDelay === sec
                    ? 'bg-[#0084FF] border-[#0084FF]'
                    : 'bg-[#111317] border-[#262930] active:bg-[#20232A]'
                }`}
                onPress={() => setSelectedDelay(sec)}
              >
                <Text className={`text-xs font-bold ${selectedDelay === sec ? 'text-white' : 'text-slate-300'}`}>
                  {sec === 0 ? 'Instant' : `${sec}s`}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      {/* HEADERS */}
      {afSection === 'headers' && (
        <View className="p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
          <View className="flex-row items-center gap-2.5 mb-1">
            <View className="w-8 h-8 rounded-lg bg-emerald-500/10 items-center justify-center">
              <Ionicons name="text-outline" size={14} color="#10B981" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-white">Prefix & Suffix Headers</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">Brand your forwarded messages with custom headers & signatures</Text>
            </View>
          </View>
          <View className="bg-[#111317] border border-[#262930] rounded-xl p-3 my-3">
            <Text className="text-[11px] font-bold text-[#0084FF] mb-1">🔥 [VIP SIGNAL ALERT - FORWARDED]</Text>
            <Text className="text-xs text-slate-300 leading-4">Buy BankNifty 51,200 CE at 340-350 | Target 420 | SL 290. Strict trailing.</Text>
            <Text className="text-[10px] font-semibold text-emerald-400 mt-1">📈 Verified by SEBI Analyst • Powered by @GetAiPilot</Text>
          </View>
          <Pressable className="flex-row items-center justify-center gap-1.5 bg-[#0084FF] rounded-xl py-3 active:opacity-80" onPress={() => onOpenModal('autoforward')}>
            <Ionicons name="create-outline" size={15} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Customize Header & Footer</Text>
          </Pressable>
        </View>
      )}
    </>
  );
};
