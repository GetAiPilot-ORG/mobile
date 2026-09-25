import React, { useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { teamApi } from '../api/team.api';
import { BirthdayEntry, CompanyHoliday } from '../../crm/types';
import { useTheme, getColors } from '@/theme';

type TabType = 'birthdays' | 'holidays';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function PlannerScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [activeTab, setActiveTab] = useState<TabType>('birthdays');

  const bg = isDark ? '#0F1015' : '#F8FAFC';
  const card = isDark ? '#1A1D26' : '#FFFFFF';
  const text = isDark ? '#FFFFFF' : '#0F172A';
  const sub = isDark ? '#9CA3AF' : '#64748B';
  const border = isDark ? '#262A34' : '#E2E8F0';

  const { data: bdayData, isLoading: bdayLoading, refetch: refetchBday, isRefetching: bdayRefetching } = useQuery({
    queryKey: ['team-birthdays'],
    queryFn: teamApi.getBirthdays,
    enabled: activeTab === 'birthdays',
  });

  const { data: holidayData, isLoading: holidayLoading, refetch: refetchHolidays, isRefetching: holidayRefetching } = useQuery({
    queryKey: ['team-holidays'],
    queryFn: teamApi.getHolidays,
    enabled: activeTab === 'holidays',
  });

  const isLoading = activeTab === 'birthdays' ? bdayLoading : holidayLoading;
  const isRefetching = activeTab === 'birthdays' ? bdayRefetching : holidayRefetching;
  const onRefresh = () => activeTab === 'birthdays' ? refetchBday() : refetchHolidays();

  const renderBirthday = ({ item }: { item: BirthdayEntry }) => {
    const bday = new Date(item.birthday);
    const isToday = item.days_until === 0;
    const isSoon = item.days_until <= 7;
    return (
      <View style={[s.card, { backgroundColor: card, borderColor: isToday ? '#EC4899' : border }]}>
        <View style={[s.dateBox, { backgroundColor: isToday ? '#FDF2F8' : isSoon ? '#FFF7F0' : (isDark ? '#262A34' : '#F8FAFC') }]}>
          <Text style={[s.dateDay, { color: isToday ? '#EC4899' : isSoon ? '#F59E0B' : sub }]}>{bday.getDate()}</Text>
          <Text style={[s.dateMonth, { color: sub }]}>{MONTH_NAMES[bday.getMonth()]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.name, { color: text }]}>{item.name}</Text>
          <Text style={[s.roleText, { color: sub }]}>{item.role}</Text>
          <Text style={[s.roleText, { color: sub }]}>{item.email}</Text>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          {isToday ? (
            <View style={[s.badge, { backgroundColor: '#FDF2F8' }]}>
              <Text style={{ color: '#EC4899', fontSize: 11, fontWeight: '700' }}>🎂 Today!</Text>
            </View>
          ) : (
            <View style={[s.badge, { backgroundColor: isSoon ? '#FFF7F0' : (isDark ? '#262A34' : '#F8FAFC') }]}>
              <Text style={{ color: isSoon ? '#F59E0B' : sub, fontSize: 11, fontWeight: '600' }}>
                in {item.days_until}d
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHoliday = ({ item }: { item: CompanyHoliday }) => {
    const hdate = new Date(item.holiday_date);
    const daysUntil = Math.ceil((hdate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    const isUpcoming = daysUntil <= 7;
    return (
      <View style={[s.card, { backgroundColor: card, borderColor: isUpcoming ? '#F59E0B' : border }]}>
        <View style={[s.dateBox, { backgroundColor: isUpcoming ? '#FFFBEB' : (isDark ? '#262A34' : '#F8FAFC') }]}>
          <Text style={[s.dateDay, { color: isUpcoming ? '#F59E0B' : sub }]}>{hdate.getDate()}</Text>
          <Text style={[s.dateMonth, { color: sub }]}>{MONTH_NAMES[hdate.getMonth()]}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.name, { color: text }]}>{item.title}</Text>
          {item.description && <Text style={[s.roleText, { color: sub }]} numberOfLines={2}>{item.description}</Text>}
          {item.category && (
            <View style={[s.badge, { backgroundColor: isDark ? '#262A34' : '#F1F5F9', alignSelf: 'flex-start', marginTop: 4 }]}>
              <Text style={{ color: sub, fontSize: 10 }}>{item.category}</Text>
            </View>
          )}
        </View>
        {daysUntil >= 0 && (
          <View style={[s.badge, { backgroundColor: isUpcoming ? '#FFFBEB' : (isDark ? '#262A34' : '#F8FAFC') }]}>
            <Text style={{ color: isUpcoming ? '#F59E0B' : sub, fontSize: 11, fontWeight: '600' }}>
              {daysUntil === 0 ? 'Today' : `in ${daysUntil}d`}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const data = activeTab === 'birthdays'
    ? (bdayData?.birthdays || [])
    : (holidayData?.holidays || []);

  return (
    <SafeAreaView style={[{ flex: 1, backgroundColor: bg }]} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={[s.title, { color: text }]}>Annual Planner</Text>
          <Text style={[s.subtitle, { color: sub }]}>Team birthdays & company holidays</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={[s.tabRow, { backgroundColor: card, borderColor: border }]}>
        {(['birthdays', 'holidays'] as TabType[]).map((tab) => (
          <Pressable
            key={tab}
            style={[s.tabBtn, activeTab === tab && s.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'birthdays' ? 'gift' : 'sunny'}
              size={16}
              color={activeTab === tab ? '#FFF' : sub}
            />
            <Text style={[s.tabBtnText, { color: activeTab === tab ? '#FFF' : sub }]}>
              {tab === 'birthdays' ? 'Birthdays' : 'Holidays'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Summary Row */}
      <View style={s.summaryRow}>
        {activeTab === 'birthdays' ? (
          <>
            <View style={[s.summaryCard, { backgroundColor: '#FDF2F8', borderColor: '#FBCFE8' }]}>
              <Text style={[s.summaryValue, { color: '#EC4899' }]}>
                {bdayData?.birthdays.filter(b => b.days_until === 0).length ?? 0}
              </Text>
              <Text style={[s.summaryLabel, { color: '#BE185D' }]}>Today</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: '#FFF7F0', borderColor: '#FED7AA' }]}>
              <Text style={[s.summaryValue, { color: '#F59E0B' }]}>
                {bdayData?.birthdays.filter(b => b.days_until <= 7 && b.days_until > 0).length ?? 0}
              </Text>
              <Text style={[s.summaryLabel, { color: '#D97706' }]}>This Week</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: '#F5F3FF', borderColor: '#DDD6FE' }]}>
              <Text style={[s.summaryValue, { color: '#8B5CF6' }]}>
                {bdayData?.birthdays.length ?? 0}
              </Text>
              <Text style={[s.summaryLabel, { color: '#7C3AED' }]}>Total</Text>
            </View>
          </>
        ) : (
          <>
            <View style={[s.summaryCard, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
              <Text style={[s.summaryValue, { color: '#F59E0B' }]}>
                {holidayData?.holidays.filter(h => Math.ceil((new Date(h.holiday_date).getTime() - Date.now()) / 86400000) <= 7).length ?? 0}
              </Text>
              <Text style={[s.summaryLabel, { color: '#D97706' }]}>This Week</Text>
            </View>
            <View style={[s.summaryCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={[s.summaryValue, { color: '#10B981' }]}>
                {holidayData?.holidays.length ?? 0}
              </Text>
              <Text style={[s.summaryLabel, { color: '#059669' }]}>Upcoming</Text>
            </View>
          </>
        )}
      </View>

      {isLoading ? (
        <View style={s.center}><ActivityIndicator color="#EC4899" /></View>
      ) : data.length === 0 ? (
        <View style={s.center}>
          <Ionicons name={activeTab === 'birthdays' ? 'gift-outline' : 'sunny-outline'} size={48} color={sub} />
          <Text style={[s.emptyText, { color: text }]}>
            {activeTab === 'birthdays' ? 'No upcoming birthdays' : 'No upcoming holidays'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item: any) => item.id}
          renderItem={activeTab === 'birthdays' ? renderBirthday : renderHoliday as any}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor="#EC4899" />}
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 16, paddingVertical: 12 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, marginTop: 2 },
  tabRow: { flexDirection: 'row', marginHorizontal: 16, borderRadius: 14, padding: 4, borderWidth: 1, marginBottom: 12 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#EC4899' },
  tabBtnText: { fontSize: 14, fontWeight: '700' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 12 },
  summaryCard: { flex: 1, borderRadius: 12, borderWidth: 1, padding: 12, alignItems: 'center' },
  summaryValue: { fontSize: 24, fontWeight: '800' },
  summaryLabel: { fontSize: 11, marginTop: 2, fontWeight: '600' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  dateBox: { width: 52, height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  dateDay: { fontSize: 20, fontWeight: '800' },
  dateMonth: { fontSize: 10, fontWeight: '600', marginTop: -2 },
  name: { fontSize: 14, fontWeight: '700' },
  roleText: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { fontSize: 15, fontWeight: '600' },
});
