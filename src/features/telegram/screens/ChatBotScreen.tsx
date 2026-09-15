import React, { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

interface Props { onOpenModal: (key: TelegramToolKey) => void; }

const QUICK_REPLIES = [
  { id: 'qr1', trigger: '/start', response: '👋 Welcome! I\'m your AI assistant. How can I help you today?', active: true },
  { id: 'qr2', trigger: 'price', response: '📊 Check our latest plans at getaipilot.in/plans', active: true },
  { id: 'qr3', trigger: 'support', response: '🎧 Our team responds within 2 hours. Email: support@getaipilot.in', active: false },
];

export const ChatBotScreen: React.FC<Props> = ({ onOpenModal }) => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [replies, setReplies] = useState(QUICK_REPLIES);

  const toggleReply = (id: string) => {
    setReplies((prev) => prev.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <>
      {/* Hero */}
      <View className="flex-row items-center gap-3 p-4 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3.5">
        <View className="w-12 h-12 rounded-xl bg-purple-500/10 items-center justify-center">
          <Ionicons name="chatbubbles" size={28} color="#8B5CF6" />
        </View>
        <View className="flex-1">
          <Text className="text-lg font-bold text-white">AI ChatBot</Text>
          <Text className="text-xs text-slate-400 leading-4 mt-0.5">AI auto-replies & conversational flows for Telegram communities</Text>
        </View>
        <Switch value={aiEnabled} onValueChange={setAiEnabled} trackColor={{ false: '#334155', true: '#8B5CF6' }} thumbColor="#FFFFFF" />
      </View>

      {/* Stats */}
      <View className="flex-row flex-wrap justify-between gap-y-2 mb-3.5">
        {[
          { label: 'ACTIVE FLOWS', val: replies.filter(r => r.active).length, color: '#8B5CF6', icon: 'git-branch-outline', bg: 'rgba(139,92,246,0.12)', hint: 'Configured rules' },
          { label: 'REPLIES SENT', val: 247, color: '#0284C7', icon: 'chatbubbles-outline', bg: 'rgba(2,132,199,0.12)', hint: 'Total automated' },
          { label: 'RESPONSE RATE', val: '98%', color: '#10B981', icon: 'flash-outline', bg: 'rgba(16,185,129,0.12)', hint: 'Accuracy' },
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

      {/* Capabilities */}
      <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
        <Text className="text-sm font-bold text-white">AI Capabilities</Text>
        <View className="gap-2.5 mt-2.5">
          {[
            { icon: 'flash-outline', color: '#F59E0B', title: 'Instant Keyword Triggers', desc: 'Detect keywords and respond instantly with pre-set messages.' },
            { icon: 'bulb-outline', color: '#8B5CF6', title: 'GPT-Powered Replies', desc: 'AI generates contextual responses for complex queries.' },
            { icon: 'git-branch-outline', color: '#0284C7', title: 'Conversation Flows', desc: 'Multi-step guided conversations with decision trees.' },
          ].map((cap, i) => (
            <View key={i} className="flex-row items-start gap-2.5 pb-2.5 border-b border-[#262930] last:border-b-0">
              <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: `${cap.color}20` }}>
                <Ionicons name={cap.icon as any} size={16} color={cap.color} />
              </View>
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-white">{cap.title}</Text>
                <Text className="text-[11px] text-slate-400 mt-0.5 leading-4">{cap.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Replies */}
      <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930] mb-3">
        <View className="flex-row justify-between items-center mb-2.5">
          <Text className="text-sm font-bold text-white">Auto-Reply Rules</Text>
          <Pressable className="flex-row items-center gap-1 bg-purple-600 px-2.5 py-1.5 rounded-lg active:opacity-80" onPress={() => onOpenModal('chatbot')}>
            <Ionicons name="add" size={14} color="#FFFFFF" />
            <Text className="text-white text-xs font-bold">Add Rule</Text>
          </Pressable>
        </View>
        {replies.map((r) => (
          <View key={r.id} className="p-2.5 rounded-xl mb-2 bg-[#111317] border border-[#262930]">
            <View className="flex-row justify-between items-center mb-1">
              <View className="bg-purple-500/15 px-2.5 py-1 rounded-lg">
                <Text className="text-xs font-bold text-purple-400 font-mono">{r.trigger}</Text>
              </View>
              <Switch value={r.active} onValueChange={() => toggleReply(r.id)} trackColor={{ false: '#334155', true: '#8B5CF6' }} thumbColor="#FFFFFF" style={{ transform: [{ scale: 0.85 }] }} />
            </View>
            <Text className="text-xs leading-4 text-slate-300" numberOfLines={2}>{r.response}</Text>
          </View>
        ))}
      </View>

      <Pressable className="flex-row items-center justify-center gap-2 bg-purple-600 rounded-xl py-3.5 active:opacity-80" onPress={() => onOpenModal('chatbot')}>
        <Ionicons name="create-outline" size={16} color="#FFFFFF" />
        <Text className="text-white text-sm font-bold">Open Full ChatBot Console</Text>
      </Pressable>
    </>
  );
};
