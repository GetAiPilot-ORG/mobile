import {
  Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React,
  { useState } from 'react';
import { Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
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
    <View style={styles.container}>
      {/* Sub-Tabs Top Segmented Navigation (Horizontally scrollable for small screens) */}
      <View style={[styles.segmentedWrapper, { backgroundColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.segmentedScroll}
        >
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveSubTab('queue');
            }}
            style={[
              styles.segmentItem,
              activeSubTab === 'queue' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="time"
              size={14}
              color={activeSubTab === 'queue' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'queue' ? '#ec4899' : isDark ? '#94a3b8' : '#64748b' },
              ]}
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
            style={[
              styles.segmentItem,
              activeSubTab === 'instapilot' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="logo-instagram"
              size={14}
              color={activeSubTab === 'instapilot' ? '#e1306c' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'instapilot' ? '#e1306c' : isDark ? '#94a3b8' : '#64748b' },
              ]}
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
            style={[
              styles.segmentItem,
              activeSubTab === 'youtube' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="logo-youtube"
              size={14}
              color={activeSubTab === 'youtube' ? '#ff0000' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'youtube' ? '#ff0000' : isDark ? '#94a3b8' : '#64748b' },
              ]}
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
            style={[
              styles.segmentItem,
              activeSubTab === 'autodm' && [
                styles.segmentItemActive,
                { backgroundColor: isDark ? '#0f172a' : '#ffffff' },
              ],
            ]}
          >
            <Ionicons
              name="flash"
              size={14}
              color={activeSubTab === 'autodm' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b'}
            />
            <Text
              style={[
                styles.segmentText,
                { color: activeSubTab === 'autodm' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b' },
              ]}
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

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  segmentedWrapper: {
    borderRadius: 12,
    padding: 3,
  },
  segmentedScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minWidth: '100%',
  },
  segmentItem: {
    flex: 1,
    minWidth: 85,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 9,
    gap: 5,
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
