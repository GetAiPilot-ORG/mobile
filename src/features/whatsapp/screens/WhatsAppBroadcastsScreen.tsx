import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WhatsAppBroadcastsSkeleton } from '../../../components/skeletonScreen';
import { BroadcastCard } from '../components';
import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { WhatsAppBroadcast } from '../types';
import { WhatsAppBroadcastDetailScreen } from './WhatsAppBroadcastDetailScreen';

interface WhatsAppBroadcastsScreenProps {
  onBack?: () => void;
}

export const WhatsAppBroadcastsScreen: React.FC<WhatsAppBroadcastsScreenProps> = ({ onBack }) => {
  const router = useRouter();

  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedBroadcast, setSelectedBroadcast] = useState<WhatsAppBroadcast | null>(null);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppBroadcasts({
    status: selectedStatus !== 'all' ? selectedStatus : undefined,
  });

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/whatsapp');
    }
  };

  const handleStatusSelect = (tab: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedStatus(tab);
  };

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
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-[#0B0D10]"
    >
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-[#262930] bg-[#181A1F]">
          <Pressable
            className="w-10 h-10 rounded-full bg-[#111317] border border-[#262930] items-center justify-center mr-3 active:opacity-70"
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="#F8FAFC"
            />
          </Pressable>
          <Text className="text-lg font-bold text-white tracking-tight">
            Broadcast Campaigns
          </Text>
        </View>

        {/* Filter Pills */}
        <View className="flex-row px-4 py-3 gap-2 border-b border-[#262930] bg-[#111317]">
          {statusTabs.map((tab) => {
            const isSelected = selectedStatus === tab;
            return (
              <Pressable
                key={tab}
                className={`px-4 py-2 rounded-full border ${
                  isSelected
                    ? 'bg-[#0084FF] border-[#0084FF]'
                    : 'bg-[#181A1F] border-[#262930] active:bg-[#262930]'
                }`}
                onPress={() => handleStatusSelect(tab)}
              >
                <Text
                  className={`text-xs font-bold ${
                    isSelected ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
            contentContainerClassName="p-4 pb-32"
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0084FF" />
            }
            ListEmptyComponent={
              <View className="py-12 items-center">
                <Text className="text-xs text-slate-400">No broadcast campaigns found</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};
