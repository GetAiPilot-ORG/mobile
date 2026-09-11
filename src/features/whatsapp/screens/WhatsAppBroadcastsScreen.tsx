import React, { useState } from 'react';
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

import { BroadcastCard } from '../components';
import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { WhatsAppBroadcast } from '../types';
import { CreateBroadcastScreen } from './CreateBroadcastScreen';
import { WhatsAppBroadcastDetailScreen } from './WhatsAppBroadcastDetailScreen';

interface WhatsAppBroadcastsScreenProps {
  onBack?: () => void;
}

export const WhatsAppBroadcastsScreen: React.FC<WhatsAppBroadcastsScreenProps> = ({ onBack }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBroadcast, setSelectedBroadcast] = useState<WhatsAppBroadcast | null>(null);
  const [showCreateScreen, setShowCreateScreen] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppBroadcasts({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  if (showCreateScreen) {
    return (
      <CreateBroadcastScreen
        onBack={() => setShowCreateScreen(false)}
        onCreated={() => {
          setShowCreateScreen(false);
          refetch();
        }}
      />
    );
  }

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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {onBack ? (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          ) : null}
          <View style={styles.titleContainer}>
            <Text style={styles.title}>Broadcast Campaigns</Text>
            <Text style={styles.subtitle}>High-Scale WhatsApp Outreach</Text>
          </View>
          <Pressable style={styles.newButton} onPress={() => setShowCreateScreen(true)}>
            <Text style={styles.newButtonText}>+ New</Text>
          </Pressable>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          {statusTabs.map((tab) => {
            const isSelected = selectedStatus === tab;
            return (
              <Pressable
                key={tab}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setSelectedStatus(tab)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {tab.toUpperCase()}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Broadcasts List */}
        {isLoading && !data ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#25d366" />
            <Text style={styles.loadingText}>Loading broadcasts...</Text>
          </View>
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
                <Text style={styles.emptyText}>No broadcast campaigns found</Text>
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
    backgroundColor: '#020617',
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
    borderBottomColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginRight: 12,
  },
  backText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
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
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  filterChipActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  filterChipText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#020617',
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
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
});
