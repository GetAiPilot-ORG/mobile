import {
  Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React,
  { useEffect,
  useMemo,
  useRef,
  useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { InstapilotConversation } from '../../types';
import { openSocialHandoff } from '../../utils/socialHandoff';
import { useTheme, getColors } from '@/theme';
import { SocialInboxTab } from '../SocialInboxTab';

export interface ActivityInstapilotSubTabProps {
  connectedAccounts: any[];
  instapilotConversations?: InstapilotConversation[];
  instapilotLoading?: boolean;
  isSyncingInstapilot?: boolean;
  onSyncInstapilot?: () => Promise<void>;
  onSelectInstapilotConv?: (conv: InstapilotConversation) => void;
}

export const ActivityInstapilotSubTab: React.FC<ActivityInstapilotSubTabProps> = ({
  connectedAccounts,
  instapilotConversations = [],
  instapilotLoading = false,
  isSyncingInstapilot = false,
  onSyncInstapilot,
  onSelectInstapilotConv,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [instapilotSearch, setInstapilotSearch] = useState('');
  const [instapilotFilter, setInstapilotFilter] = useState<'all' | 'leads' | 'active'>('all');
  const [syncCountdown, setSyncCountdown] = useState(15);

  const [aiTopicInput, setAiTopicInput] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('');
  const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);

  const [selectedIgAccountId, setSelectedIgAccountId] = useState<string | null>(null);
  const igAccounts = useMemo(() => {
    return (connectedAccounts || []).filter(
      (a) =>
        (a.provider || a.platform || '').toLowerCase() === 'instagram' ||
        (a.account_type || '').toLowerCase().includes('instagram')
    );
  }, [connectedAccounts]);

  const igAccount = useMemo(() => {
    if (selectedIgAccountId) {
      const found = igAccounts.find((a) => a.id === selectedIgAccountId);
      if (found) return found;
    }
    return igAccounts[0] || null;
  }, [igAccounts, selectedIgAccountId]);

  const { leadsCount, activeBotsCount, filteredConversations } = useMemo(() => {
    const leads = instapilotConversations.filter(
      (c) => Boolean(c.lead_data?.email || c.lead_data?.phone)
    ).length;
    const activeBots = instapilotConversations.filter(
      (c) => c.status === 'bot_active' && !c.bot_paused
    ).length;

    const query = instapilotSearch.trim().toLowerCase();
    const filtered = instapilotConversations.filter((conv) => {
      const matchSearch =
        !query ||
        (conv.instagram_username || '').toLowerCase().includes(query) ||
        (conv.instagram_name || '').toLowerCase().includes(query) ||
        (conv.instagram_messages || []).some((m) =>
          (m.message_text || '').toLowerCase().includes(query)
        );

      if (!matchSearch) return false;

      if (instapilotFilter === 'leads') {
        return Boolean(conv.lead_data?.email || conv.lead_data?.phone);
      }
      if (instapilotFilter === 'active') {
        return conv.status === 'bot_active' && !conv.bot_paused;
      }
      return true;
    });

    return {
      leadsCount: leads,
      activeBotsCount: activeBots,
      filteredConversations: filtered,
    };
  }, [instapilotConversations, instapilotSearch, instapilotFilter]);

  const onSyncRef = useRef(onSyncInstapilot);
  useEffect(() => {
    onSyncRef.current = onSyncInstapilot;
  }, [onSyncInstapilot]);

  // 15-second Auto-Sync Loop
  useEffect(() => {
    let countdown = 15;
    setSyncCountdown(15);

    // Initial sync
    onSyncRef.current?.().catch(() => { });

    const timer = setInterval(() => {
      countdown -= 1;
      if (countdown <= 0) {
        countdown = 15;
        setSyncCountdown(15);
        onSyncRef.current?.().catch(() => { });
      } else {
        setSyncCountdown(countdown);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGenerateAiCaption = () => {
    if (!aiTopicInput.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsGeneratingCaption(true);
    setTimeout(() => {
      setGeneratedCaption(
        `Here is the secret to scaling your brand with ${aiTopicInput.trim()}:\n\n` +
        `1. Consistency beats intensity\n` +
        `2. Automate repetitive tasks with AI\n` +
        `3. Engage with comments within 10 minutes\n\n` +
        `Drop "SCALE" below and I will send you our step-by-step breakdown directly to your DMs!\n\n` +
        `#SocialMediaGrowth #ContentCreator #AIAutomation #InstaTips #${aiTopicInput.replace(/\s+/g, '')}`
      );
      setIsGeneratingCaption(false);
    }, 800);
  };

  return (
    <View style={styles.subContent}>
      <View style={styles.headerActionRow}>
        <View style={styles.headerTextCol}>
          <Text style={[styles.subTitle, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
            Gap Instapilot Hub
          </Text>
          <Text style={[styles.subDesc, { color: isDark ? '#777383' : '#64748b' }]}>
            Instagram growth engine, automated Reels, & AI hooks
          </Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openSocialHandoff('builder');
          }}
          style={[styles.primaryActionBtn, { backgroundColor: '#e1306c' }]}
        >
          <Ionicons name="sparkles" size={14} color="#ffffff" />
          <Text style={styles.primaryActionBtnText}>Builder</Text>
        </Pressable>
      </View>

      {/* Connected Instagram Profile Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1A25' : '#ffffff',
            borderColor: isDark ? '#252230' : '#E9E6F2',
          },
        ]}
      >
        {/* Profile Switcher Chips (when multiple Instagram accounts linked) */}
        {igAccounts.length > 1 && (
          <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#777383' : '#64748b' }}>
              Profile:
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
              {igAccounts.map((acc: any) => {
                const isSelected = igAccount?.id === acc.id;
                const avatar = acc.avatar || acc.profilePicture || acc.profile_picture_url;
                return (
                  <Pressable
                    key={acc.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedIgAccountId(acc.id);
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 6,
                      paddingVertical: 5,
                      paddingHorizontal: 10,
                      borderRadius: 16,
                      borderWidth: 1,
                      backgroundColor: isSelected ? '#e1306c' : (isDark ? '#252230' : '#F0EEF8'),
                      borderColor: isSelected ? '#e1306c' : (isDark ? '#334155' : '#cbd5e1'),
                    }}
                  >
                    {avatar ? (
                      <Image source={{ uri: avatar }} style={{ width: 16, height: 16, borderRadius: 8 }} />
                    ) : (
                      <Ionicons name="logo-instagram" size={12} color={isSelected ? '#ffffff' : '#e1306c'} />
                    )}
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: isSelected ? '#ffffff' : (isDark ? '#F5F3FB' : '#1C1A25'),
                      }}
                    >
                      @{acc.username || 'Profile'}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={12} color="#ffffff" />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.profileRow}>
          {(igAccount?.avatar || igAccount?.profilePicture || igAccount?.profile_picture_url) ? (
            <Image
              source={{ uri: igAccount.avatar || igAccount.profilePicture || igAccount.profile_picture_url }}
              style={[styles.profileAvatar, { borderWidth: 1.5, borderColor: '#e1306c' }]}
            />
          ) : (
            <View style={[styles.profileAvatar, { backgroundColor: 'rgba(225, 48, 108, 0.15)' }]}>
              <Ionicons name="logo-instagram" size={26} color="#e1306c" />
            </View>
          )}
          <View style={styles.profileInfoCol}>
            <Text style={[styles.profileName, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
              {igAccount?.account_name || igAccount?.username || 'Instagram Business Sync'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              <Ionicons
                name={igAccount?.connected ? 'checkmark-circle' : 'alert-circle-outline'}
                size={13}
                color={igAccount?.connected ? '#10B981' : '#6B7280'}
              />
              <Text style={styles.profileStatus}>
                {igAccount?.connected ? 'Synced via Meta Graph API' : 'Not Connected'}
                {igAccount?.followers != null ? ` • ${igAccount.followers} followers` : ''}
              </Text>
            </View>
          </View>
        </View>
      </View>

      {/* Instagram Social Inbox */}
      <SocialInboxTab defaultPlatform="instagram" hidePlatformFilter={true} />

      {/* AI Instagram Viral Caption Generator */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#1C1A25' : '#ffffff',
            borderColor: isDark ? '#252230' : '#E9E6F2',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles" size={16} color="#e1306c" />
            <Text style={[styles.cardSectionTitle, { color: isDark ? '#F5F3FB' : '#1C1A25', marginBottom: 0 }]}>
              AI Viral Caption & Hashtags
            </Text>
          </View>
        </View>

        <TextInput
          style={[
            styles.topicInput,
            {
              backgroundColor: isDark ? '#252230' : '#F5F3FB',
              color: isDark ? '#F5F3FB' : '#1C1A25',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
          placeholder="Enter Reel/Post topic (e.g., Summer Fashion, AI Productivity)..."
          placeholderTextColor={isDark ? '#64748b' : '#777383'}
          value={aiTopicInput}
          onChangeText={setAiTopicInput}
        />

        <Pressable
          onPress={handleGenerateAiCaption}
          disabled={isGeneratingCaption || !aiTopicInput.trim()}
          style={[
            styles.generateBtn,
            { opacity: !aiTopicInput.trim() || isGeneratingCaption ? 0.6 : 1 },
          ]}
        >
          {isGeneratingCaption ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Ionicons name="flash" size={14} color="#ffffff" />
              <Text style={styles.generateBtnText}>Generate Viral Hook</Text>
            </>
          )}
        </Pressable>

        {generatedCaption ? (
          <View style={[styles.resultBox, { backgroundColor: isDark ? '#252230' : '#fdf2f8' }]}>
            <Text style={[styles.resultText, { color: isDark ? '#F5F3FB' : '#1C1A25' }]}>
              {generatedCaption}
            </Text>
            <Pressable
              onPress={async () => {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                if (generatedCaption) {
                  await Clipboard.setStringAsync(generatedCaption);
                }
                await openSocialHandoff('upload-short');
              }}
              style={styles.useInPostBtn}
            >
              <Ionicons name="copy-outline" size={14} color="#e1306c" />
              <Text style={styles.useInPostBtnText}>Copy & Open Post Composer</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  subContent: {
    gap: 16,
  },
  headerActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
  },
  headerTextCol: {
    flex: 1,
    minWidth: 180,
  },
  subTitle: {
    fontSize: 17,
    fontWeight: '800',
  },
  subDesc: {
    fontSize: 13,
    marginTop: 2,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#17171C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28,
    alignSelf: 'center', minHeight: 44 , shadowOpacity: 0 },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  card: {
    borderRadius: 24,
    padding: 16,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfoCol: {
    flex: 1,
    minWidth: 130,
  },
  profileName: {
    fontSize: 15,
    fontWeight: '700',
  },
  profileStatus: {
    fontSize: 12,
    color: '#777383',
    marginTop: 2,
  },
  linkAccBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9E6F2',
    alignSelf: 'center',
  },
  linkAccBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
  },
  igMetricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  igMetricBox: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 4,
  },
  igMetricNum: {
    fontSize: 16,
    fontWeight: '800',
  },
  igMetricLabel: {
    fontSize: 11,
    color: '#777383',
    marginTop: 2,
    textAlign: 'center',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700', borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  inboxHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  inboxTitleCol: {
    flex: 1,
    gap: 2,
  },
  inboxTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  inboxSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  liveSyncBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveSyncBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  syncNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(225, 48, 108, 0.3)',
    backgroundColor: 'rgba(225, 48, 108, 0.08)',
  },
  syncNowBtnText: {
    color: '#e1306c',
    fontSize: 12,
    fontWeight: '700',
  },
  inboxSearchRow: {
    marginBottom: 10,
  },
  inboxSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  inboxSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  inboxFilterPillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  inboxFilterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  inboxFilterPillActive: {
    backgroundColor: '#e1306c',
  },
  inboxFilterPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  inboxLoadingBox: {
    paddingVertical: 24,
    alignItems: 'center',
    gap: 8,
  },
  inboxLoadingText: {
    fontSize: 12,
  },
  inboxEmptyBox: {
    paddingVertical: 28,
    alignItems: 'center',
    gap: 6,
  },
  inboxEmptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  inboxEmptyDesc: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  inboxConversationsList: {
    gap: 10,
  },
  convCard: {
    borderWidth: 0,
    borderRadius: 24,
    padding: 12,
    gap: 8, shadowOpacity: 0 },
  convCardHeader: {
    flexDirection: 'row',
    alignItems: 'center', borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  convAvatarContainer: {
    position: 'relative',
    marginRight: 10,
  },
  convAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#cbd5e1',
  },
  convAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  convInfoCol: {
    flex: 1,
    gap: 2,
  },
  convNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  convDisplayName: {
    fontSize: 13,
    fontWeight: '700',
    maxWidth: 160,
  },
  convLeadBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  convLeadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#16a34a',
  },
  convTimeText: {
    marginLeft: 'auto',
    fontSize: 10,
    color: '#777383',
    fontWeight: '500',
  },
  convHandleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  convHandleText: {
    fontSize: 11,
    color: '#e1306c',
    fontWeight: '600',
  },
  convDotSeparator: {
    fontSize: 10,
    color: '#777383',
  },
  convFollowerText: {
    fontSize: 10,
    color: '#777383',
  },
  convFollowsBadge: {
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 2,
  },
  convFollowsBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#e1306c',
  },
  convLastMsgRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    paddingTop: 2,
  },
  convLastMsgText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
  convCapturedChipsRow: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
    marginTop: 2,
  },
  convContactChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.3)',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  convContactChipText: {
    fontSize: 10,
    color: '#3b82f6',
    fontWeight: '600',
  },
  convFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  convBotStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  convBotStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  convMsgCountText: {
    fontSize: 10,
    color: '#777383',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  topicInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
  },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#e1306c',
    paddingVertical: 10,
    borderRadius: 10,
  },
  generateBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  resultBox: {
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  resultText: {
    fontSize: 12,
    lineHeight: 18,
  },
  useInPostBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
  },
  useInPostBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e1306c',
  },
});
