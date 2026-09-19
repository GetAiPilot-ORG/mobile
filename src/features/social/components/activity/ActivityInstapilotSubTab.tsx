import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  useColorScheme,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { InstapilotConversation } from '../../types';
import { openSocialHandoff } from '../../utils/socialHandoff';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
        `🚀 Stop scrolling! Here is the secret to scaling your brand with ${aiTopicInput.trim()}:\n\n` +
        `1️⃣ Consistency beats intensity\n` +
        `2️⃣ Automate the repetitive tasks with AI\n` +
        `3️⃣ Engage with every single comment within 10 minutes\n\n` +
        `Drop "SCALE" below and I'll send you our step-by-step breakdown directly to your DMs! 👇\n\n` +
        `#SocialMediaGrowth #ContentCreator #AIAutomation #InstaTips #${aiTopicInput.replace(/\s+/g, '')}`
      );
      setIsGeneratingCaption(false);
    }, 800);
  };

  return (
    <View style={styles.subContent}>
      <View style={styles.headerActionRow}>
        <View style={styles.headerTextCol}>
          <Text style={[styles.subTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Gap Instapilot Hub
          </Text>
          <Text style={[styles.subDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Instagram growth engine, automated Reels, & AI hooks
          </Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openSocialHandoff('builder');
          }} style={[styles.brandBadge, { backgroundColor: '#e1306c' }]}>
          <Text style={[styles.brandBadgeText, { color: '#ffffff' }]}>Builder</Text>
        </Pressable>
      </View>

      {/* Connected Instagram Profile Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        {/* Profile Switcher Chips (when multiple Instagram accounts linked) */}
        {igAccounts.length > 1 && (
          <View style={{ marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b' }}>
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
                      backgroundColor: isSelected ? '#e1306c' : (isDark ? '#1e293b' : '#f1f5f9'),
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
                        color: isSelected ? '#ffffff' : (isDark ? '#f8fafc' : '#0f172a'),
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
            <Text style={[styles.profileName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {igAccount?.account_name || igAccount?.username || 'Instagram Business Sync'}
            </Text>
            <Text style={styles.profileStatus}>
              {igAccount?.connected ? '✅ Synced via Meta Graph API' : 'Not Connected'}
              {igAccount?.followers != null ? ` • 👥 ${igAccount.followers} followers` : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* InstaPilot Direct Conversations Card with 15s Auto-Sync */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        {/* Live Sync Status Header */}
        <View style={styles.inboxHeaderRow}>
          <View style={styles.inboxTitleCol}>
            <View style={styles.inboxTitleLine}>
              <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
                Direct Inbox & Leads
              </Text>
              <View style={[styles.liveSyncBadge, { backgroundColor: isSyncingInstapilot ? 'rgba(59, 130, 246, 0.12)' : 'rgba(34, 197, 94, 0.12)' }]}>
                <View style={[styles.pulsingDot, { backgroundColor: isSyncingInstapilot ? '#3b82f6' : '#22c55e' }]} />
                <Text style={[styles.liveSyncBadgeText, { color: isSyncingInstapilot ? '#3b82f6' : '#22c55e' }]}>
                  {isSyncingInstapilot ? 'Syncing...' : `Sync in ${syncCountdown}s`}
                </Text>
              </View>
            </View>
            <Text style={[styles.inboxSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Real-time Instagram DMs • Auto-syncing every 15 seconds
            </Text>
          </View>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onSyncInstapilot?.();
            }}
            disabled={isSyncingInstapilot}
            style={[styles.syncNowBtn, isSyncingInstapilot && { opacity: 0.6 }]}
          >
            {isSyncingInstapilot ? (
              <ActivityIndicator size="small" color="#e1306c" />
            ) : (
              <>
                <Ionicons name="sync" size={14} color="#e1306c" />
                <Text style={styles.syncNowBtnText}>Sync</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Search Box */}
        <View style={styles.inboxSearchRow}>
          <View
            style={[
              styles.inboxSearchInputBox,
              {
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#cbd5e1',
              },
            ]}
          >
            <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
            <TextInput
              style={[styles.inboxSearchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
              placeholder="Search name, @handle, or message..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={instapilotSearch}
              onChangeText={setInstapilotSearch}
            />
            {Boolean(instapilotSearch) && (
              <Pressable onPress={() => setInstapilotSearch('')}>
                <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.inboxFilterPillsRow}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setInstapilotFilter('all');
            }}
            style={[
              styles.inboxFilterPill,
              instapilotFilter === 'all'
                ? [styles.inboxFilterPillActive, { backgroundColor: '#e1306c' }]
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.inboxFilterPillText,
                { color: instapilotFilter === 'all' ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
              ]}
            >
              All ({instapilotConversations.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setInstapilotFilter('leads');
            }}
            style={[
              styles.inboxFilterPill,
              instapilotFilter === 'leads'
                ? [styles.inboxFilterPillActive, { backgroundColor: '#16a34a' }]
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Ionicons
              name="sparkles"
              size={12}
              color={instapilotFilter === 'leads' ? '#ffffff' : '#16a34a'}
            />
            <Text
              style={[
                styles.inboxFilterPillText,
                { color: instapilotFilter === 'leads' ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
              ]}
            >
              Leads ({leadsCount})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setInstapilotFilter('active');
            }}
            style={[
              styles.inboxFilterPill,
              instapilotFilter === 'active'
                ? [styles.inboxFilterPillActive, { backgroundColor: '#3b82f6' }]
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Ionicons
              name="hardware-chip"
              size={12}
              color={instapilotFilter === 'active' ? '#ffffff' : '#3b82f6'}
            />
            <Text
              style={[
                styles.inboxFilterPillText,
                { color: instapilotFilter === 'active' ? '#ffffff' : isDark ? '#cbd5e1' : '#64748b' },
              ]}
            >
              Active ({activeBotsCount})
            </Text>
          </Pressable>
        </View>

        {/* Conversation List */}
        {instapilotLoading && instapilotConversations.length === 0 ? (
          <View style={styles.inboxLoadingBox}>
            <ActivityIndicator size="small" color="#e1306c" />
            <Text style={[styles.inboxLoadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Loading Instagram conversations...
            </Text>
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.inboxEmptyBox}>
            <Ionicons name="chatbubbles-outline" size={32} color={isDark ? '#475569' : '#cbd5e1'} />
            <Text style={[styles.inboxEmptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              No conversations found
            </Text>
            <Text style={[styles.inboxEmptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              {instapilotSearch
                ? 'No direct messages match your search filter.'
                : 'Auto-syncing every 15 seconds for new Instagram DMs.'}
            </Text>
          </View>
        ) : (
          <View style={styles.inboxConversationsList}>
            {filteredConversations.map((conv) => {
              const msgs = conv.instagram_messages || [];
              const lastMsg = msgs.length > 0 ? msgs[msgs.length - 1] : null;
              const hasLead = Boolean(conv.lead_data?.email || conv.lead_data?.phone);
              const isBotActive = conv.status === 'bot_active' && !conv.bot_paused;

              return (
                <Pressable
                  key={conv.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectInstapilotConv?.(conv);
                  }}
                  style={({ pressed }) => [
                    styles.convCard,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                    pressed && { opacity: 0.8 },
                  ]}
                >
                  <View style={styles.convCardHeader}>
                    {/* Avatar */}
                    <View style={styles.convAvatarContainer}>
                      {conv.profile_pic_url ? (
                        <Image
                          source={{ uri: conv.profile_pic_url }}
                          style={styles.convAvatar}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.convAvatarFallback}>
                          <Ionicons name="logo-instagram" size={18} color="#ffffff" />
                        </View>
                      )}
                      <View style={styles.convAvatarBadge}>
                        <Ionicons name="logo-instagram" size={8} color="#ffffff" />
                      </View>
                    </View>

                    {/* Title & Info */}
                    <View style={styles.convInfoCol}>
                      <View style={styles.convNameRow}>
                        <Text
                          style={[styles.convDisplayName, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          numberOfLines={1}
                        >
                          {conv.instagram_name || conv.instagram_username}
                        </Text>

                        {hasLead && (
                          <View style={styles.convLeadBadge}>
                            <Ionicons name="sparkles" size={10} color="#16a34a" />
                            <Text style={styles.convLeadBadgeText}>Lead</Text>
                          </View>
                        )}

                        {conv.last_message_at && (
                          <Text style={styles.convTimeText}>
                            {new Date(conv.last_message_at).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        )}
                      </View>

                      <View style={styles.convHandleRow}>
                        <Text style={styles.convHandleText}>@{conv.instagram_username}</Text>
                        <Text style={styles.convDotSeparator}>•</Text>
                        <Text style={styles.convFollowerText}>
                          {conv.follower_count ?? 0} followers
                        </Text>
                        {conv.is_user_follow_business && (
                          <View style={styles.convFollowsBadge}>
                            <Text style={styles.convFollowsBadgeText}>Follows you</Text>
                          </View>
                        )}
                      </View>
                    </View>

                    {/* Chevron */}
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color={isDark ? '#64748b' : '#94a3b8'}
                      style={{ marginLeft: 6 }}
                    />
                  </View>

                  {/* Last Message Preview */}
                  {lastMsg && (
                    <View style={styles.convLastMsgRow}>
                      <Ionicons
                        name={lastMsg.direction === 'outbound' ? 'arrow-redo' : 'chatbubble-ellipses'}
                        size={12}
                        color={lastMsg.direction === 'outbound' ? '#3b82f6' : '#ec4899'}
                        style={{ marginTop: 2 }}
                      />
                      <Text
                        style={[
                          styles.convLastMsgText,
                          { color: isDark ? '#cbd5e1' : '#475569' },
                        ]}
                        numberOfLines={2}
                      >
                        {lastMsg.direction === 'outbound' ? 'You: ' : ''}
                        {lastMsg.message_text}
                      </Text>
                    </View>
                  )}

                  {/* Quick Contact Chips if captured */}
                  {hasLead && (
                    <View style={styles.convCapturedChipsRow}>
                      {conv.lead_data?.email && (
                        <View style={styles.convContactChip}>
                          <Ionicons name="mail" size={11} color="#3b82f6" />
                          <Text style={styles.convContactChipText}>
                            {conv.lead_data.email}
                          </Text>
                        </View>
                      )}
                      {conv.lead_data?.phone && (
                        <View style={[styles.convContactChip, { borderColor: 'rgba(34, 197, 94, 0.3)' }]}>
                          <Ionicons name="call" size={11} color="#16a34a" />
                          <Text style={[styles.convContactChipText, { color: '#16a34a' }]}>
                            {conv.lead_data.phone}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Footer: Bot Status & Total messages */}
                  <View style={styles.convFooterRow}>
                    <View
                      style={[
                        styles.convBotStatusPill,
                        {
                          backgroundColor: isBotActive
                            ? 'rgba(34, 197, 94, 0.12)'
                            : 'rgba(234, 179, 8, 0.12)',
                        },
                      ]}
                    >
                      <Ionicons
                        name={isBotActive ? 'hardware-chip' : 'pause-circle'}
                        size={10}
                        color={isBotActive ? '#22c55e' : '#eab308'}
                      />
                      <Text
                        style={[
                          styles.convBotStatusText,
                          { color: isBotActive ? '#22c55e' : '#eab308' },
                        ]}
                      >
                        {isBotActive ? 'Bot Active' : 'Bot Paused'}
                      </Text>
                    </View>

                    <Text style={styles.convMsgCountText}>
                      {msgs.length} {msgs.length === 1 ? 'message' : 'messages'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* AI Instagram Viral Caption Generator */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles" size={16} color="#e1306c" />
            <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
              AI Viral Caption & Hashtags
            </Text>
          </View>
        </View>

        <TextInput
          style={[
            styles.topicInput,
            {
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              color: isDark ? '#f8fafc' : '#0f172a',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
          placeholder="Enter Reel/Post topic (e.g., Summer Fashion, AI Productivity)..."
          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
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
          <View style={[styles.resultBox, { backgroundColor: isDark ? '#1e293b' : '#fdf2f8' }]}>
            <Text style={[styles.resultText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
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
    fontSize: 12,
    marginTop: 2,
  },
  brandBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
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
    color: '#94a3b8',
    marginTop: 2,
  },
  linkAccBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e2e8f0',
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
    color: '#94a3b8',
    marginTop: 2,
    textAlign: 'center',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
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
    fontSize: 11,
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
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  convCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
    color: '#94a3b8',
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
    color: '#94a3b8',
  },
  convFollowerText: {
    fontSize: 10,
    color: '#94a3b8',
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
    color: '#94a3b8',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
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
