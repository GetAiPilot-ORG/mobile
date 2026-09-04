import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  Pressable,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery } from '@tanstack/react-query';

type ActivityFilter = 'all' | 'bots' | 'payments' | 'system';

export default function ActivityScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ActivityFilter>('all');

  // Fetch recent payments or activity
  const {
    data: payments,
    isLoading: loadingPayments,
    refetch: refetchPayments,
    isRefetching,
  } = useQuery({
    queryKey: ['user-activity-payments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.log('Payments fetch notice:', error.message);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch joins or stats
  const { data: joins, refetch: refetchJoins } = useQuery({
    queryKey: ['user-activity-joins'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('joins')
        .select('*')
        .order('joined_at', { ascending: false })
        .limit(10);

      if (error) {
        return [];
      }
      return data || [];
    },
  });

  const onRefresh = async () => {
    await Promise.all([refetchPayments(), refetchJoins()]);
  };

  // Mock initial event feed if newly registered
  const defaultEvents = [
    {
      id: 'evt-1',
      title: 'Account Initialized',
      desc: 'Security tokens and dashboard configured',
      time: 'Just now',
      type: 'system',
    },
    {
      id: 'evt-2',
      title: 'WhatsApp Automation Gateway',
      desc: 'Bot listener registered on secure cluster',
      time: '1 hour ago',
      type: 'bots',
    },
    {
      id: 'evt-3',
      title: 'Subscription Status',
      desc: 'GAP Core Plan active with unlimited workflows',
      time: 'Today',
      type: 'payments',
    },
  ];

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Activity Stream</Text>
          <Text style={styles.subtitle}>Real-time system events, bots, and billing records</Text>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterContainer}>
          {(['all', 'bots', 'payments', 'system'] as ActivityFilter[]).map((f) => (
            <Pressable
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Payment Logs if any */}
        {(filter === 'all' || filter === 'payments') && payments && payments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Transactions</Text>
            {payments.map((p: any) => (
              <View key={p.id} style={styles.eventCard}>
                <View style={[styles.eventIcon, { backgroundColor: 'rgba(22, 184, 130, 0.15)' }]}>
                  <Text style={[styles.eventIconText, { color: '#16b882' }]}>₹</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>Payment Received: ₹{p.amount || 0}</Text>
                  <Text style={styles.eventDesc}>Status: {p.status} • {p.provider || 'Razorpay'}</Text>
                </View>
                <Text style={styles.eventTime}>
                  {new Date(p.created_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Subscriber Joins if any */}
        {(filter === 'all' || filter === 'bots') && joins && joins.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Telegram Bot Joins</Text>
            {joins.map((j: any) => (
              <View key={j.id} style={styles.eventCard}>
                <View style={[styles.eventIcon, { backgroundColor: 'rgba(56, 189, 248, 0.15)' }]}>
                  <Text style={[styles.eventIconText, { color: '#38bdf8' }]}>TG</Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>
                    {j.joined_username ? `@${j.joined_username}` : `User ${j.joined_user_id}`}
                  </Text>
                  <Text style={styles.eventDesc}>Joined chat: {j.chat_id}</Text>
                </View>
                <Text style={styles.eventTime}>
                  {new Date(j.joined_at).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Default Stream Feed */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Log</Text>
          {defaultEvents
            .filter((e) => filter === 'all' || e.type === filter)
            .map((evt) => (
              <View key={evt.id} style={styles.eventCard}>
                <View
                  style={[
                    styles.eventIcon,
                    {
                      backgroundColor:
                        evt.type === 'bots'
                          ? 'rgba(56, 189, 248, 0.15)'
                          : evt.type === 'payments'
                          ? 'rgba(22, 184, 130, 0.15)'
                          : 'rgba(245, 158, 11, 0.15)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.eventIconText,
                      {
                        color:
                          evt.type === 'bots'
                            ? '#38bdf8'
                            : evt.type === 'payments'
                            ? '#16b882'
                            : '#f59e0b',
                      },
                    ]}
                  >
                    {evt.type === 'bots' ? '⚡' : evt.type === 'payments' ? '₹' : '⚙'}
                  </Text>
                </View>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{evt.title}</Text>
                  <Text style={styles.eventDesc}>{evt.desc}</Text>
                </View>
                <Text style={styles.eventTime}>{evt.time}</Text>
              </View>
            ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 14,
    color: colors.mutedForeground,
    marginTop: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  filterTextActive: {
    color: colors.primaryForeground,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 12,
  },
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eventIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventIconText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventInfo: {
    flex: 1,
    marginRight: 8,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  eventDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  eventTime: {
    fontSize: 11,
    color: colors.mutedForeground,
  },
});
