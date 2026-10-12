import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import {
  ActivitySubTab,
  InstapilotConversation,
  SystemProductStatus,
  SystemSettings,
  YoutubeChannelAccount,
} from '../types';
import { ActivityAutoDMSubTab } from './activity/ActivityAutoDMSubTab';
import { ActivityInstapilotSubTab } from './activity/ActivityInstapilotSubTab';
import { ActivityQueueSubTab } from './activity/ActivityQueueSubTab';
import { ActivityYouTubeSubTab } from './activity/ActivityYouTubeSubTab';
import { useTheme, getColors } from '@/theme';

export interface SocialActivityTabProps {
  queueLoading: boolean;
  queueList: any[];
  connectedAccounts: any[];
  onOpenCreateModal: () => void;
  onSelectPost: (post: any) => void;
  onCancelPost: (postId: string) => Promise<void>;
  onRetryPost?: (postId: string) => Promise<void>;
  entitlementsData?: any;
  instapilotConversations?: InstapilotConversation[];
  instapilotLoading?: boolean;
  isSyncingInstapilot?: boolean;
  onSyncInstapilot?: () => Promise<void>;
  onSelectInstapilotConv?: (conv: InstapilotConversation) => void;
  systemSettings?: SystemSettings[];
  systemProduct?: SystemProductStatus[];
  youtubeAccounts?: YoutubeChannelAccount[];
  youtubeAccountsLoading?: boolean;
  onRefreshYoutubeAccounts?: () => Promise<any>;
}

export const SocialActivityTab: React.FC<SocialActivityTabProps> = ({
  queueLoading,
  queueList,
  connectedAccounts,
  onOpenCreateModal,
  onSelectPost,
  onCancelPost,
  onRetryPost,
  entitlementsData,
  instapilotConversations = [],
  instapilotLoading = false,
  isSyncingInstapilot = false,
  onSyncInstapilot,
  onSelectInstapilotConv,
  systemSettings = [],
  systemProduct = [],
  youtubeAccounts = [],
  youtubeAccountsLoading = false,
  onRefreshYoutubeAccounts,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const [activeSubTab, setActiveSubTab] = useState<ActivitySubTab>('queue');

  return (
    <View className="gap-4">
      {/* Sub-Tabs Top Segmented Navigation (Horizontally scrollable for small screens) */}
      <View
        className="rounded-xl p-[3px]"
        style={{ backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: '100%' }}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('queue');
            }}
            className={`flex-1 min-w-[85px] flex-row items-center justify-center py-2 px-2.5 rounded-[9px] gap-1.5 ${
              activeSubTab === 'queue' ? 'shadow-sm shadow-black/10' : ''
            }`}
            style={{
              backgroundColor: activeSubTab === 'queue'
                ? (isDark ? '#0f172a' : '#ffffff')
                : 'transparent',
            }}
          >
            <Ionicons
              name="time"
              size={14}
              color={activeSubTab === 'queue' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              className="text-xs font-bold"
              style={{ color: activeSubTab === 'queue' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b' }}
              numberOfLines={1}
            >
              Queue ({queueList.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('instapilot');
            }}
            className={`flex-1 min-w-[85px] flex-row items-center justify-center py-2 px-2.5 rounded-[9px] gap-1.5 ${
              activeSubTab === 'instapilot' ? 'shadow-sm shadow-black/10' : ''
            }`}
            style={{
              backgroundColor: activeSubTab === 'instapilot'
                ? (isDark ? '#0f172a' : '#ffffff')
                : 'transparent',
            }}
          >
            <Ionicons
              name="logo-instagram"
              size={14}
              color={activeSubTab === 'instapilot' ? '#e1306c' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              className="text-xs font-bold"
              style={{ color: activeSubTab === 'instapilot' ? '#e1306c' : isDark ? '#94a3b8' : '#64748b' }}
              numberOfLines={1}
            >
              Instapilot
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('youtube');
            }}
            className={`flex-1 min-w-[85px] flex-row items-center justify-center py-2 px-2.5 rounded-[9px] gap-1.5 ${
              activeSubTab === 'youtube' ? 'shadow-sm shadow-black/10' : ''
            }`}
            style={{
              backgroundColor: activeSubTab === 'youtube'
                ? (isDark ? '#0f172a' : '#ffffff')
                : 'transparent',
            }}
          >
            <Ionicons
              name="logo-youtube"
              size={14}
              color={activeSubTab === 'youtube' ? '#ff0000' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              className="text-xs font-bold"
              style={{ color: activeSubTab === 'youtube' ? '#ff0000' : isDark ? '#94a3b8' : '#64748b' }}
              numberOfLines={1}
            >
              YouTube
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('autodm');
            }}
            className={`flex-1 min-w-[85px] flex-row items-center justify-center py-2 px-2.5 rounded-[9px] gap-1.5 ${
              activeSubTab === 'autodm' ? 'shadow-sm shadow-black/10' : ''
            }`}
            style={{
              backgroundColor: activeSubTab === 'autodm'
                ? (isDark ? '#0f172a' : '#ffffff')
                : 'transparent',
            }}
          >
            <Ionicons
              name="flash"
              size={14}
              color={activeSubTab === 'autodm' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              className="text-xs font-bold"
              style={{ color: activeSubTab === 'autodm' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b' }}
              numberOfLines={1}
            >
              AutoDM
            </Text>
          </Pressable>
        </ScrollView>
      </View>

      {/* Subtab Contents */}
      {activeSubTab === 'queue' && (
        <ActivityQueueSubTab
          queueLoading={queueLoading}
          queueList={queueList}
          entitlementsData={entitlementsData}
          onSelectPost={onSelectPost}
          onCancelPost={onCancelPost}
          onRetryPost={onRetryPost}
        />
      )}

      {activeSubTab === 'instapilot' && (
        <ActivityInstapilotSubTab
          connectedAccounts={connectedAccounts}
          instapilotConversations={instapilotConversations}
          instapilotLoading={instapilotLoading}
          isSyncingInstapilot={isSyncingInstapilot}
          onSyncInstapilot={onSyncInstapilot}
          onSelectInstapilotConv={onSelectInstapilotConv}
        />
      )}

      {activeSubTab === 'youtube' && (
        <ActivityYouTubeSubTab
          youtubeAccounts={youtubeAccounts}
          youtubeAccountsLoading={youtubeAccountsLoading}
          onRefreshYoutubeAccounts={onRefreshYoutubeAccounts}
          connectedAccounts={connectedAccounts}
          queueList={queueList}
          systemSettings={systemSettings}
          systemProduct={systemProduct}
        />
      )}

      {activeSubTab === 'autodm' && (
        <ActivityAutoDMSubTab
          connectedAccounts={connectedAccounts}
          entitlementsData={entitlementsData}
        />
      )}
    </View>
  );
};
