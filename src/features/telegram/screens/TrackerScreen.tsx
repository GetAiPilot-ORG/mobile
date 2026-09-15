import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { TelegramToolKey } from '../types';
import { StatCard } from '../components/ui/StatCard';

type TrackerSection = 'joins' | 'connect' | 'links';

interface TrackerScreenProps {
  botsList: any[];
  trackerDash: any;
  trackerLinks: any[];
  onOpenModal: (key: TelegramToolKey) => void;
}

export const TrackerScreen: React.FC<TrackerScreenProps> = ({ botsList, trackerDash, trackerLinks, onOpenModal }) => {
  const [trackerSection, setTrackerSection] = useState<TrackerSection>('joins');
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'All' | 'Active' | 'Bot Start' | 'Leave' | 'Pending'>('All');
  const [copiedLinkId, setCopiedLinkId] = useState<string | null>(null);

  const filteredUsers = (trackerDash?.newUsers || []).filter((u: any) => {
    const matchesSearch =
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.channel_name.toLowerCase().includes(userSearch.toLowerCase()) ||
      String(u.telegram_user_id).includes(userSearch);
    const matchesFilter = userFilter === 'All' || u.status === userFilter;
    return matchesSearch && matchesFilter;
  });

  const handleCopyLink = async (url: string, id: string) => {
    if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await Clipboard.setStringAsync(url);
    setCopiedLinkId(id);
    setTimeout(() => setCopiedLinkId(null), 2500);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'Active': return { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' };
      case 'Bot Start': return { bg: 'bg-sky-500/10', text: 'text-sky-400', border: 'border-sky-500/30' };
      case 'Leave': return { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30' };
      default: return { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' };
    }
  };

  const kpis = trackerDash?.kpis || { totalJoins: 0, todaysJoins: 0, thisMonthJoins: 0, botStarts: 0, pendingJoins: 0, conversionRate: 0 };

  return (
    <>
      {/* Header */}
      <View className="flex-row items-start justify-between mb-3.5 gap-3">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5 flex-wrap">
            <Text className="text-lg font-extrabold text-white mb-0.5">GAP Tracker</Text>
            <View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-full">
              <View className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <Text className="text-[11px] font-bold text-emerald-400">{botsList.length} Bots Connected</Text>
            </View>
          </View>
          <Text className="text-xs text-slate-400 font-medium">Connect bots, map channels & generate deep link trackers</Text>
        </View>
        <Pressable className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl active:opacity-80" onPress={() => onOpenModal('tracker')}>
          <Ionicons name="open-outline" size={13} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold">Console</Text>
        </Pressable>
      </View>

      {/* 3-Tab Segmented Bar */}
      <View className="flex-row rounded-2xl p-1 mb-4 bg-[#181A1F] border border-[#262930] gap-1">
        {([
          { key: 'connect', icon: 'link-outline', label: 'Connect', badge: botsList.length },
          { key: 'links', icon: 'globe-outline', label: 'Join Links', badge: (trackerLinks || []).length },
          { key: 'joins', icon: 'analytics-outline', label: 'Analytics', badge: null },
        ] as { key: TrackerSection; icon: string; label: string; badge: number | null }[]).map((tab) => (
          <Pressable
            key={tab.key}
            className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-xl ${
              trackerSection === tab.key ? 'bg-[#0084FF]' : 'active:bg-[#20232A]'
            }`}
            onPress={() => {
              if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setTrackerSection(tab.key);
            }}
          >
            <Ionicons name={tab.icon as any} size={14} color={trackerSection === tab.key ? '#FFFFFF' : '#94A3B8'} />
            <Text className={`text-xs ${trackerSection === tab.key ? 'text-white font-bold' : 'text-slate-300 font-semibold'}`}>{tab.label}</Text>
            {tab.badge !== null && (
              <View className={`rounded-full px-1.5 py-0.5 ${trackerSection === tab.key ? 'bg-white/20' : 'bg-[#111317]'}`}>
                <Text className={`text-[9px] font-extrabold ${trackerSection === tab.key ? 'text-white' : 'text-slate-400'}`}>{tab.badge}</Text>
              </View>
            )}
          </Pressable>
        ))}
      </View>

      {/* ANALYTICS */}
      {trackerSection === 'joins' && (
        <View className="gap-3.5">
          {/* 6 KPI Cards */}
          <View className="flex-row flex-wrap justify-between gap-y-2">
            {[
              { icon: 'people', color: '#0284C7', bg: 'rgba(2,132,199,0.12)', val: kpis.totalJoins, label: 'TOTAL JOINS', hint: 'Active Channel Members' },
              { icon: 'calendar', color: '#10B981', bg: 'rgba(16,185,129,0.12)', val: `+${kpis.todaysJoins}`, label: "TODAY'S JOINS", hint: 'New joins today' },
              { icon: 'calendar-outline', color: '#10B981', bg: 'rgba(16,185,129,0.12)', val: `+${kpis.thisMonthJoins}`, label: 'THIS MONTH', hint: 'New joins this month' },
              { icon: 'sparkles-outline', color: '#2563EB', bg: 'rgba(37,99,235,0.12)', val: kpis.botStarts, label: 'BOT STARTS', hint: 'Total bot interactions' },
              { icon: 'time-outline', color: '#D97706', bg: 'rgba(217,119,6,0.12)', val: kpis.pendingJoins, label: 'PENDING JOINS', hint: 'Started but not joined' },
              { icon: 'trending-up-outline', color: '#DB2777', bg: 'rgba(219,39,119,0.12)', val: `${kpis.conversionRate}%`, label: 'CONVERSION', hint: 'Starts to Joins' },
            ].map((k, i) => (
              <StatCard
                key={i}
                label={k.label}
                value={k.val}
                icon={k.icon}
                color={k.color}
                bg={k.bg}
                sub={k.hint}
              />
            ))}
          </View>

          {/* Channel Breakdown */}
          <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930]">
            <View className="flex-row justify-between items-center flex-wrap gap-2 mb-3.5">
              <View className="flex-row items-center gap-2">
                <Ionicons name="newspaper-outline" size={18} color="#0084FF" />
                <Text className="text-sm font-extrabold text-white">Channel & Links Breakdown</Text>
              </View>
              {Boolean(trackerDash?.period?.startDate) && (
                <View className="flex-row items-center gap-1 bg-sky-500/10 px-2 py-1 rounded-lg border border-sky-500/20">
                  <Ionicons name="calendar-outline" size={12} color="#0084FF" />
                  <Text className="text-[10px] font-bold text-sky-400">
                    {trackerDash?.period?.startDate} - {trackerDash?.period?.endDate}
                  </Text>
                </View>
              )}
            </View>
            {(trackerDash?.channels || []).length === 0 ? (
              <View className="py-5 items-center">
                <Ionicons name="newspaper-outline" size={28} color="#64748B" className="mb-1.5" />
                <Text className="text-xs font-semibold text-slate-300">No Channel Breakdowns</Text>
                <Text className="text-[11px] text-slate-400 mt-0.5 text-center">
                  Channels mapped with tracker links will display join and leave analytics here.
                </Text>
              </View>
            ) : (
              (trackerDash?.channels || []).map((chan: any) => (
                <View key={chan.channel_id} className="rounded-xl p-3 mb-2 bg-[#111317] border border-[#262930]">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-[13px] font-bold text-white flex-1">{chan.channel_name}</Text>
                    <View className="bg-sky-500/10 px-2 py-0.5 rounded-md">
                      <Text className="text-[10px] font-bold text-sky-400">+{chan.period_joins} Joins (7 Days)</Text>
                    </View>
                  </View>
                  <View className="flex-row gap-3 mb-2">
                    {[
                      { label: 'JOINED', val: chan.joined, color: 'text-white' },
                      { label: 'PERIOD', val: `+${chan.period_joins}`, color: 'text-emerald-400' },
                      { label: 'LEFT', val: chan.left, color: 'text-red-400' },
                      { label: 'ALL ACTIVE', val: chan.all_active, color: 'text-[#0084FF]' },
                    ].map((s, idx) => (
                      <View key={idx} className="items-center">
                        <Text className="text-[9px] font-extrabold text-slate-400">{s.label}</Text>
                        <Text className={`text-sm font-extrabold mt-0.5 ${s.color}`}>{s.val}</Text>
                      </View>
                    ))}
                  </View>
                  <View className="flex-row flex-wrap gap-1.5">
                    {chan.links.map((link: any) => (
                      <View key={link.id} className="flex-row items-center gap-1.5 bg-sky-500/10 px-2 py-1 rounded-lg">
                        <Ionicons name="link-outline" size={12} color="#0084FF" />
                        <Text className="text-[11px] font-semibold text-slate-300 max-w-[120px]">{link.title}</Text>
                        <View className="bg-[#0084FF] px-1.5 py-0.5 rounded">
                          <Text className="text-white text-[9px] font-bold">+{link.joins} joins</Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Users Table */}
          <View className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930]">
            <View className="flex-row justify-between items-center mb-2.5">
              <View className="flex-row items-center gap-2">
                <Ionicons name="people-outline" size={18} color="#0084FF" />
                <Text className="text-sm font-extrabold text-white">New Users Data</Text>
              </View>
              <Text className="text-[11px] text-slate-400 font-semibold">{filteredUsers.length} total events</Text>
            </View>
            <View className="flex-row items-center gap-2 rounded-xl px-3 py-2 bg-[#111317] border border-[#262930] mb-2.5">
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                className="flex-1 text-xs text-white"
                placeholder="Search by name, ID or channel..."
                placeholderTextColor="#94A3B8"
                value={userSearch}
                onChangeText={setUserSearch}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-2">
              <View className="flex-row gap-2">
                {(['All', 'Active', 'Bot Start', 'Leave', 'Pending'] as const).map((st) => (
                  <Pressable
                    key={st}
                    className={`px-3 py-1.5 rounded-full border ${
                      userFilter === st
                        ? 'bg-[#0084FF] border-[#0084FF]'
                        : 'bg-[#111317] border-[#262930] active:bg-[#20232A]'
                    }`}
                    onPress={() => {
                      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setUserFilter(st);
                    }}
                  >
                    <Text className={`text-xs ${userFilter === st ? 'text-white font-bold' : 'text-slate-400 font-semibold'}`}>{st}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
            {filteredUsers.length === 0 ? (
              <View className="py-5 items-center">
                <Text className="text-slate-400 text-xs font-medium">No user events found</Text>
              </View>
            ) : (
              filteredUsers.map((user: any) => {
                const sc = statusColor(user.status);
                return (
                  <View key={user.id} className="flex-row items-center justify-between p-2.5 rounded-xl bg-[#111317] border border-[#262930] mb-1.5">
                    <View className="flex-row items-center gap-2.5 flex-1 mr-2">
                      <View className="w-9 h-9 rounded-full bg-[#0084FF] items-center justify-center">
                        <Text className="text-white text-xs font-black">{user.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] font-bold text-white">{user.name}</Text>
                        <Text className="text-[11px] text-slate-400 mt-0.5">Id: {user.telegram_user_id} • {user.channel_name}</Text>
                        <Text className="text-[10px] text-slate-500 mt-0.5">{user.time_ago}</Text>
                      </View>
                    </View>
                    <View className={`px-2 py-1 rounded-full border ${sc.bg} ${sc.border}`}>
                      <Text className={`text-[10px] font-bold ${sc.text}`}>{user.status}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      )}

      {/* CONNECTED BOTS */}
      {trackerSection === 'connect' && (
        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-extrabold text-white">Connected Bots ({botsList.length})</Text>
            <Pressable className="flex-row items-center gap-1.5 bg-[#0084FF] px-3 py-2 rounded-xl active:opacity-80" onPress={() => onOpenModal('tracker')}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">Connect Bot</Text>
            </Pressable>
          </View>
          {botsList.map((bot) => (
            <View key={bot.id} className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930]">
              <View className="flex-row items-center gap-2.5">
                <View className="w-9 h-9 rounded-full bg-[#0084FF] items-center justify-center">
                  <Text className="text-white text-sm font-black">{(bot.bot_name || 'B').charAt(0).toUpperCase()}</Text>
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-1.5">
                    <Text className="text-[13px] font-bold text-white" numberOfLines={1}>{bot.bot_name}</Text>
                    <View className="bg-emerald-500/15 px-1.5 py-0.5 rounded">
                      <Text className="text-[9px] font-extrabold text-emerald-400">{bot.status || 'ACTIVE'}</Text>
                    </View>
                  </View>
                  <Text className="text-[11px] text-slate-400 mt-0.5">@{bot.bot_username}</Text>
                </View>
                <Pressable className="bg-sky-500/10 px-2.5 py-1.5 rounded-lg active:opacity-80" onPress={() => onOpenModal('tracker')}>
                  <Text className="text-sky-400 text-xs font-bold">Create Link</Text>
                </Pressable>
              </View>
              <View className="flex-row items-center gap-2 mt-2.5 pt-2 border-t border-[#262930]">
                <Text className="text-[9px] font-extrabold text-slate-400">MAPPED CHANNELS:</Text>
                {bot.channel_name ? (
                  <View className="flex-row items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded">
                    <Ionicons name="radio-button-on" size={10} color="#10B981" />
                    <Text className="text-[11px] font-semibold text-emerald-400" numberOfLines={1}>{bot.channel_name}</Text>
                  </View>
                ) : (
                  <Text className="text-[11px] text-slate-400">No channels mapped</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* JOIN LINKS */}
      {trackerSection === 'links' && (
        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <Text className="text-sm font-extrabold text-white">Tracking Links ({(trackerLinks || []).length || 4})</Text>
            <Pressable className="flex-row items-center gap-1.5 bg-[#0084FF] px-3 py-2 rounded-xl active:opacity-80" onPress={() => onOpenModal('tracker')}>
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold">Create Link</Text>
            </Pressable>
          </View>
          {(trackerLinks || [
            { id: 'bab7d8c7', title: 'Premuimchannel', bot_username: 'GapAutoPilotBot', channel_name: 'Subs Manager', bot_starts: 35, joined: 24, conversion_rate: 68, deep_link_url: 'https://t.me/GapAutoPilotBot?start=premuimchannel' },
            { id: '63785fbc', title: 'hello', bot_username: 'GapAutoPilotBot', channel_name: 'New new gameX', bot_starts: 12, joined: 8, conversion_rate: 66, deep_link_url: 'https://t.me/GapAutoPilotBot?start=hello' },
            { id: '76ffaf4d', title: 'testing', bot_username: 'GapAutoPilotBot', channel_name: 'New new gameX', bot_starts: 5, joined: 3, conversion_rate: 60, deep_link_url: 'https://t.me/GapAutoPilotBot?start=testing' },
          ]).map((link: any) => (
            <View key={link.id} className="p-3.5 rounded-2xl bg-[#181A1F] border border-[#262930]">
              <View className="flex-row justify-between items-center">
                <View className="flex-1 mr-2">
                  <Text className="text-[13px] font-bold text-white">{link.title}</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">@{link.bot_username} • {link.channel_name}</Text>
                </View>
                <Pressable className="flex-row gap-1 items-center bg-sky-500/10 px-2.5 py-1.5 rounded-lg active:opacity-80" onPress={() => handleCopyLink(link.deep_link_url, link.id)}>
                  <Ionicons name={copiedLinkId === link.id ? 'checkmark' : 'copy-outline'} size={13} color="#0084FF" />
                  <Text className="text-sky-400 text-xs font-bold">{copiedLinkId === link.id ? 'Copied' : 'Copy'}</Text>
                </Pressable>
              </View>
              <View className="flex-row gap-3 mt-2.5 pt-2 border-t border-[#262930]">
                <Text className="text-[11px] text-slate-400">Starts: <Text className="font-bold text-[#0084FF]">{link.bot_starts}</Text></Text>
                <Text className="text-[11px] text-slate-400">Joins: <Text className="font-bold text-emerald-400">{link.joined}</Text></Text>
                <Text className="text-[11px] text-slate-400">Conv: <Text className="font-bold text-pink-400">{link.conversion_rate}%</Text></Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </>
  );
};
