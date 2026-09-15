import React, { useState } from 'react';
import {
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useActivities, useCreateActivity } from '../hooks/useActivities';
import { ActivityTimelineItem } from '../components/ActivityTimelineItem';
import { LogActivityModal } from '../components/LogActivityModal';
import { ActivityType } from '../types';
import { CrmActivitySkeleton } from '../../../components/skeletonScreen';

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
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showLogModal, setShowLogModal] = useState(false);

  const { data: activities = [], isLoading, isRefetching, refetch } = useActivities({
    type: selectedType !== 'all' ? (selectedType as ActivityType) : undefined,
  });

  const createActivity = useCreateActivity();

  return (
    <SafeAreaView className="flex-1 bg-[#0B0D10]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-2.5">
          {onBack ? (
            <Pressable
              className="p-1.5 rounded-lg bg-[#181A1F] border border-[#262930]"
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <View>
            <Text className="text-white text-xl font-bold tracking-tight">Activity Stream</Text>
            <Text className="text-slate-400 text-xs mt-0.5">Full chronological history of client touchpoints</Text>
          </View>
        </View>

        <Pressable
          className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl"
          onPress={() => setShowLogModal(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">Log Event</Text>
        </Pressable>
      </View>

      {/* Filter Chips */}
      <View className="flex-row px-4 gap-1.5 mb-3 mt-1">
        {ACTIVITY_FILTER_TABS.map((tab) => {
          const isSelected = selectedType === tab.key;
          return (
            <Pressable
              key={tab.key}
              className={`px-3 py-1.5 rounded-lg border ${
                isSelected
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-[#181A1F] border-[#262930]'
              }`}
              onPress={() => setSelectedType(tab.key)}
            >
              <Text
                className={`text-xs ${
                  isSelected ? 'text-blue-400 font-bold' : 'text-slate-400 font-medium'
                }`}
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
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="time-outline" size={48} color="#475569" />
          <Text className="text-white text-base font-semibold mt-3">No events recorded</Text>
          <Text className="text-slate-400 text-xs text-center mt-1.5 mb-5">
            {selectedType !== 'all'
              ? `No ${selectedType} activities logged yet.`
              : 'Log calls, meetings, notes, and emails to build a unified timeline.'}
          </Text>
          <Pressable
            className="bg-[#0084FF] px-4 py-2.5 rounded-xl"
            onPress={() => setShowLogModal(true)}
          >
            <Text className="text-white text-sm font-semibold">+ Log First Event</Text>
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
          contentContainerClassName="px-4 pb-28 pt-2"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#0084FF"
              colors={['#0084FF']}
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
