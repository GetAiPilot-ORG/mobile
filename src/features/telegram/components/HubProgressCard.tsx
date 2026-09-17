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
            <Ionicons name="apps" size={18} color="#0284C7" />
          </View>
          <View style={styles.titleTextWrap}>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
              Connected Platforms Hub
            </Text>
            <Text style={styles.subtitle} numberOfLines={1}>
              {completed}/{total} platform modules configured
            </Text>
          </View>
        </View>
        <Pressable
          style={[styles.refreshBtn, isRefreshing && styles.refreshBtnDisabled]}
          onPress={handleRefresh}
          disabled={isRefreshing}
          hitSlop={6}
        >
          <Ionicons name="refresh" size={12} color="#0284C7" />
          <Text style={styles.refreshText}>{isRefreshing ? 'Checking...' : 'Refresh'}</Text>
        </Pressable>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressHeader}>
          <Text style={styles.progressLabel}>SETUP PROGRESS</Text>
          <Text style={[styles.progressVal, percentage === 100 && { color: '#10B981' }]}>
            {completed}/{total} Completed ({percentage}%)
          </Text>
        </View>
        <View style={[styles.progressBarBg, isDark ? styles.progressBarBgDark : styles.progressBarBgLight]}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentage}%` },
              percentage === 100 && { backgroundColor: '#10B981' },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
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
    backgroundColor: '#121212',
    borderColor: '#27272A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  titleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minWidth: 0,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  titleTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  subtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 1,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(2, 132, 199, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.2)',
    flexShrink: 0,
  },
  refreshBtnDisabled: {
    opacity: 0.6,
  },
  refreshText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  progressVal: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarBgLight: { backgroundColor: '#E2E8F0' },
  progressBarBgDark: { backgroundColor: '#27272A' },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#0284C7',
    borderRadius: 3,
  },
});
