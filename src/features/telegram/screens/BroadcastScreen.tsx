import React, { useState } from 'react';
import { Platform, Pressable, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface Props {
  chats: any[];
  isBroadcasting: boolean;
  onOpenModal: (key: TelegramToolKey) => void;
}

const BROADCAST_TEMPLATES = [
  { id: 'signal', icon: '📈', label: 'Trading Signal', preview: '🔥 BUY BankNifty 51,200 CE | Target: 420 | SL: 290' },
  { id: 'event', icon: '📅', label: 'Event Alert', preview: '⚡️ LIVE Webinar Tonight 8PM - Join Now!' },
  { id: 'update', icon: '📣', label: 'Channel Update', preview: '🎯 New VIP Subscription Plan launched! Limited slots.' },
];

export const BroadcastScreen: React.FC<Props> = ({ chats, isBroadcasting, onOpenModal }) => {
  const [message, setMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  return (
    <>
      {/* Hero */}
      <View className="flex-row items-center gap-3.5 p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3.5">
        <View className="w-12 h-12 rounded-xl bg-amber-500/10 items-center justify-center">
          <Ionicons name="megaphone" size={26} color="#F59E0B" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">Broadcast Message</Text>
          <Text className="text-xs text-slate-400 mt-0.5 leading-4">Mass message delivery to {(chats || []).length} channels & groups</Text>
          <View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-2 py-0.5 rounded-full mt-2 self-start">
            <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <Text className="text-[11px] font-bold text-emerald-400">System Online</Text>
          </View>
        </View>
      </View>

      {/* Stats Row */}
      <View className="flex-row flex-wrap justify-between gap-y-2 mb-3.5">
        {[
          { label: 'CHANNELS', val: (chats || []).length, color: '#0284C7', icon: 'megaphone-outline', bg: 'rgba(2,132,199,0.12)', hint: 'Target channels' },
          { label: 'GROUPS', val: 0, color: '#8B5CF6', icon: 'people-outline', bg: 'rgba(139,92,246,0.12)', hint: 'Target groups' },
          { label: 'TOTAL REACH', val: (chats || []).length, color: '#10B981', icon: 'globe-outline', bg: 'rgba(16,185,129,0.12)', hint: 'Estimated users' },
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

      {/* Templates */}
      <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
        <Text className="text-sm font-bold text-white">Quick Templates</Text>
        <View className="gap-2 mt-2.5">
          {BROADCAST_TEMPLATES.map((t) => (
            <Pressable
              key={t.id}
              className={`flex-row items-center gap-2.5 p-3 rounded-xl border bg-[#111317] ${
                selectedTemplate === t.id ? 'border-[#0084FF] bg-sky-500/10' : 'border-[#262930]'
              }`}
              onPress={() => {
                setSelectedTemplate(t.id);
                setMessage(t.preview);
              }}
            >
              <Text className="text-xl">{t.icon}</Text>
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-white">{t.label}</Text>
                <Text className="text-[11px] text-slate-400 mt-0.5" numberOfLines={1}>{t.preview}</Text>
              </View>
              {selectedTemplate === t.id && <Ionicons name="checkmark-circle" size={18} color="#0084FF" />}
            </Pressable>
          ))}
        </View>
      </View>

      {/* Compose */}
      <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
        <Text className="text-sm font-bold text-white">Compose Message</Text>
        <TextInput
          className="rounded-xl border border-[#262930] bg-[#111317] text-white p-3 text-[13px] mt-2.5 min-h-[110px]"
          multiline
          numberOfLines={5}
          placeholder="Type your broadcast message here..."
          placeholderTextColor="#94A3B8"
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />
        <Text className="text-[10px] text-slate-400 text-right mt-1.5">{message.length}/4096 characters</Text>
      </View>

      {/* Send */}
      <Pressable
        className={`flex-row items-center justify-center gap-2 bg-amber-500 rounded-xl py-3.5 active:opacity-80 ${
          (isBroadcasting || !message.trim()) ? 'opacity-50' : ''
        }`}
        disabled={isBroadcasting || !message.trim()}
        onPress={() => {
          if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onOpenModal('broadcast');
        }}
      >
        <Ionicons name={isBroadcasting ? 'hourglass-outline' : 'send'} size={16} color="#FFFFFF" />
        <Text className="text-white text-sm font-extrabold">{isBroadcasting ? 'Sending...' : `Send to ${(chats || []).length} Channels`}</Text>
      </Pressable>
    </>
  );
};
