import React, { useState } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BroadcastCard } from '../components';
import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { WhatsAppBroadcast } from '../types';
import { WhatsAppBroadcastDetailScreen } from './WhatsAppBroadcastDetailScreen';
import { WhatsAppBroadcastsSkeleton } from '../../../components/skeletonScreen';

interface WhatsAppBroadcastsScreenProps {
  onBack?: () => void;
}

export const WhatsAppBroadcastsScreen: React.FC<WhatsAppBroadcastsScreenProps> = ({ onBack }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBroadcast, setSelectedBroadcast] = useState<WhatsAppBroadcast | null>(null);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppBroadcasts({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  if (selectedBroadcast) {
    return (
      <WhatsAppBroadcastDetailScreen
        broadcast={selectedBroadcast}
        onBack={() => setSelectedBroadcast(null)}
      />
    );
  }

  const broadcasts = data?.broadcasts || [];
  const statusTabs = ['all', 'completed', 'queued', 'scheduled'];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          {onBack ? (
            <Pressable
              style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
              onPress={onBack}
            >
              <Text style={[styles.backText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>← Back</Text>
            </Pressable>
          ) : null}
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Broadcast Campaigns</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              WhatsApp Outreach Directory
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {statusTabs.map((tab) => {
            const isSelected = selectedStatus === tab;
            return (
              <Pressable
                key={tab}
                style={[
                  styles.filterChip,
                  isDark ? styles.filterChipDark : styles.filterChipLight,
                  isSelected && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatus(tab)}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? '#020617' : isDark ? '#94a3b8' : '#64748b' },
                    isSelected && styles.filterChipTextActive,
                  ]}
                >
                  {tab.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Broadcasts List */}
        {isLoading && !data ? (
          <WhatsAppBroadcastsSkeleton />
        ) : (
          <FlatList
            data={broadcasts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <BroadcastCard
                broadcast={item}
                onPress={(b) => setSelectedBroadcast(b)}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#25d366" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>No broadcast campaigns found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerDark: {
    backgroundColor: '#0b1329',
    borderBottomColor: '#1e293b',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  backButtonDark: {
    backgroundColor: '#1e293b',
  },
  backButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
  },
  newButton: {
    backgroundColor: '#25d366',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
  },
  newButtonText: {
    color: '#020617',
    fontSize: 13,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterChipDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  filterChipLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  filterChipActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 130,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
