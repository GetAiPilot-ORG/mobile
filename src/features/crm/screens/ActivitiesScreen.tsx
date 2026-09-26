import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActivities, useCreateActivity } from '../hooks/useActivities';
import { ActivityTimelineItem } from '../components/ActivityTimelineItem';
import { LogActivityModal } from '../components/LogActivityModal';
import { ActivityType } from '../types';
import { CrmActivitySkeleton } from '../../../components/skeletonScreen';
import { useTheme, getColors } from '@/theme';

const ACTIVITY_FILTER_TABS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All Events' },
  { key: 'call', label: 'Calls' },
  { key: 'meeting', label: 'Meetings' },
  { key: 'note', label: 'Notes' },
  { key: 'email', label: 'Emails' },
];

interface ActivitiesScreenProps {
  onBack?: () => void;
}

export const ActivitiesScreen: React.FC<ActivitiesScreenProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [selectedType, setSelectedType] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  const { data: activities = [], isLoading, isRefetching, refetch } = useActivities({
    type: selectedType !== 'all' ? (selectedType as ActivityType) : undefined,
  });

  const createActivity = useCreateActivity();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              style={[styles.backBtn, { backgroundColor: isDark ? '#1E2028' : '#F1F5F9' }]}
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </Pressable>
          ) : null}
          <View>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Activity Stream</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Full chronological history of client touchpoints</Text>
          </View>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setShowLogModal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Log Event</Text>
        </Pressable>
      </View>

      {/* Filter Chips */}
      <View style={styles.tabContainer}>
        {ACTIVITY_FILTER_TABS.map((tab) => {
          const isSelected = selectedType === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tabChip,
                { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' },
                isSelected && (isDark ? styles.tabChipSelectedDark : styles.tabChipSelectedLight),
              ]}
              onPress={() => setSelectedType(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isDark ? '#9CA3AF' : '#64748B' },
                  isSelected && styles.tabTextSelected,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Activity List */}
      {isLoading && !activities ? (
        <CrmActivitySkeleton />
      ) : activities.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="time-outline" size={48} color={isDark ? '#4B5563' : '#CBD5E1'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>No events recorded</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            {selectedType !== 'all'
              ? `No ${selectedType} activities logged yet.`
              : 'Log calls, meetings, notes, and emails to build a unified timeline.'}
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => setShowLogModal(true)}>
            <Text style={styles.emptyBtnText}>+ Log First Event</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={activities}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <ActivityTimelineItem
              activity={item}
              isLast={index === activities.length - 1}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        />
      )}

      {/* Log Modal */}
      <LogActivityModal
        visible={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSubmit={async (act) => {
          await createActivity.mutateAsync(act);
        }}
        isLoading={createActivity.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E2028',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  tabChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tabChipSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  tabChipSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    paddingTop: 8,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
