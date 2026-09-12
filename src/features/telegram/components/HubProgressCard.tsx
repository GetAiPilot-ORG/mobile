import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface HubProgressCardProps {
  total: number;
  completed: number;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const HubProgressCard: React.FC<HubProgressCardProps> = ({
  total,
  completed,
  onRefresh,
  isRefreshing,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const percentage = Math.round((completed / (total || 1)) * 100);

  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onRefresh();
  };

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <View style={styles.iconBox}>
            <Ionicons name="apps" size={20} color="#0284C7" />
          </View>
          <View>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
              Connected Platforms Hub
            </Text>
            <Text style={styles.subtitle}>All 8 platform modules configured</Text>
          </View>
        </View>
        <Pressable
          style={[styles.refreshBtn, isRefreshing && styles.refreshBtnDisabled]}
          onPress={handleRefresh}
          disabled={isRefreshing}
        >
          <Ionicons name="refresh" size={14} color="#0284C7" />
          <Text style={styles.refreshText}>{isRefreshing ? 'Checking...' : 'Refresh Status'}</Text>
        </Pressable>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>SETUP PROGRESS</Text>
          <Text style={styles.progressVal}>{completed}/{total} Completed ({percentage}%)</Text>
        </View>
        <View style={[styles.progressBarBg, isDark ? styles.progressBarBgDark : styles.progressBarBgLight]}>
          <View style={[styles.progressBarFill, { width: `${percentage}%` }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#161B26',
    borderColor: '#262C36',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  subtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
  },
  refreshBtnDisabled: {
    opacity: 0.6,
  },
  refreshText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    marginTop: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressVal: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarBgLight: { backgroundColor: '#E2E8F0' },
  progressBarBgDark: { backgroundColor: '#262C36' },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
});
