import { useQuery } from '@tanstack/react-query';
import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { apiClient } from '../../../core/api/client';

export const SocialScreen: React.FC = () => {
  const { data: accounts, isLoading: accountsLoading } = useQuery({
    queryKey: ['social_accounts'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/social/accounts'),
  });

  const { data: posts, isLoading: postsLoading, refetch, isRefetching } = useQuery({
    queryKey: ['social_posts'],
    queryFn: async () => apiClient.get<any[]>('/mobile/v1/social/posts'),
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>GAP SocialPilot</Text>
          <Text style={styles.subtitle}>Social Accounts & Multi-Channel Scheduler</Text>
        </View>

        {/* Connected Accounts */}
        <Text style={styles.sectionTitle}>Connected Channels</Text>
        <View style={styles.accountsGrid}>
          {(accounts || []).map((acc) => (
            <View key={acc.id} style={styles.accountCard}>
              <Text style={styles.accountUser}>{acc.username}</Text>
              <Text style={styles.accountMeta}>{(acc.followers || 0).toLocaleString()} Followers</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: acc.connected ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)' },
                ]}
              >
                <Text style={[styles.statusText, { color: acc.connected ? '#22c55e' : '#ef4444' }]}>
                  {acc.connected ? 'Live Sync' : 'Disconnected'}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Scheduled Posts */}
        <Text style={styles.sectionTitle}>Scheduled & Published Posts</Text>
        {postsLoading ? (
          <ActivityIndicator size="large" color="#ec4899" style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={posts || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.postCard}>
                <View style={styles.postHeader}>
                  <Text style={styles.platforms}>{item.platforms.join(' • ').toUpperCase()}</Text>
                  <View style={styles.postBadge}>
                    <Text style={styles.postBadgeText}>{item.status}</Text>
                  </View>
                </View>
                <Text style={styles.postCaption}>{item.caption}</Text>
                <Text style={styles.postDate}>
                  Scheduled for: {new Date(item.scheduledFor).toLocaleString()}
                </Text>
              </View>
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#ec4899" />
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { marginTop: 8, marginBottom: 16 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  sectionTitle: { color: '#cbd5e1', fontSize: 15, fontWeight: '700', marginBottom: 10 },
  accountsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 16 },
  accountCard: {
    width: '48%',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  accountUser: { color: '#f8fafc', fontSize: 14, fontWeight: '700' },
  accountMeta: { color: '#64748b', fontSize: 11, marginVertical: 4 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700' },
  listContent: { paddingBottom: 24 },
  postCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  platforms: { color: '#ec4899', fontSize: 11, fontWeight: '700' },
  postBadge: { backgroundColor: 'rgba(236, 72, 153, 0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  postBadgeText: { color: '#ec4899', fontSize: 10, fontWeight: '700', textTransform: 'uppercase' },
  postCaption: { color: '#e2e8f0', fontSize: 13, lineHeight: 18, marginBottom: 8 },
  postDate: { color: '#64748b', fontSize: 11 },
});
