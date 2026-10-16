import { ProductHeading,useProductPalette } from "@/components/ProductUI";
import React,{ useState } from 'react';
import { Pressable,ScrollView,Text,View } from 'react-native';
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
  const colors = useProductPalette();
  const [activeSubTab, setActiveSubTab] = useState<ActivitySubTab>('queue');

  return (
    <View className="gap-4">
      <ProductHeading title="Your publishing" action="Create a post" onAction={onOpenCreateModal} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 10 }}>
        {([{ key: 'queue', title: 'Queue' }, { key: 'instapilot', title: 'Instagram' }, { key: 'youtube', title: 'YouTube' }, { key: 'autodm', title: 'Auto replies' }] as const).map((tab) => <Pressable key={tab.key} onPress={() => setActiveSubTab(tab.key)} accessibilityRole="button" accessibilityState={{ selected: activeSubTab === tab.key }} style={{ borderRadius: 24, paddingHorizontal: 18, minHeight: 44, justifyContent: 'center', backgroundColor: activeSubTab === tab.key ? colors.lavender : colors.card }}><Text style={{ color: activeSubTab === tab.key ? colors.accent : colors.textSecondary, fontSize: 13 }}>{tab.title}</Text></Pressable>)}
      </ScrollView>

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
