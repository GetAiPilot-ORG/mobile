import {
  Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React,
  { useMemo,
  useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AutoDMAccount, AutoDMInstagramMediaItem } from '../../../types';
import { useTheme, getColors } from '@/theme';

export interface AutoDMProfileViewProps {
  profileAccount?: AutoDMAccount;
  allAccounts?: AutoDMAccount[];
  onSelectAccount?: (id: string) => void;
  instagramMediaList: AutoDMInstagramMediaItem[];
  automationsCount: number;
  contactsCount: number;
  isLoadingMedia: boolean;
  onRefreshProfile: () => void;
  onSelectMediaPost: (item: AutoDMInstagramMediaItem) => void;
  onTriggerAutoDM: (item: AutoDMInstagramMediaItem) => void;
}

export const AutoDMProfileView: React.FC<AutoDMProfileViewProps> = ({
  profileAccount,
  allAccounts = [],
  onSelectAccount,
  instagramMediaList,
  automationsCount,
  contactsCount,
  isLoadingMedia,
  onRefreshProfile,
  onSelectMediaPost,
  onTriggerAutoDM,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [mediaFilter, setMediaFilter] = useState<'all' | 'video' | 'image'>('all');

  const mediaFilterCounts = useMemo(() => {
    const all = instagramMediaList.length;
    const reels = instagramMediaList.filter((m) => m.media_type === 'VIDEO').length;
    const photos = instagramMediaList.filter(
      (m) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM'
    ).length;
    return { all, reels, photos };
  }, [instagramMediaList]);

  const filteredMediaList = useMemo(() => {
    if (mediaFilter === 'video') {
      return instagramMediaList.filter((m) => m.media_type === 'VIDEO');
    }
    if (mediaFilter === 'image') {
      return instagramMediaList.filter(
        (m) => m.media_type === 'IMAGE' || m.media_type === 'CAROUSEL_ALBUM'
      );
    }
    return instagramMediaList;
  }, [instagramMediaList, mediaFilter]);

  return (
    <View style={{ gap: 14 }}>
      {/* Profile Switcher Chips (when multiple profiles connected) */}
      {allAccounts.length > 1 && (
        <View style={styles.profileSwitcherRow}>
          <Text style={[styles.profileSwitcherLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            Profiles:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            {allAccounts.map((acc) => {
              const isSelected = profileAccount?.id === acc.id;
              const handle = acc.username ? `@${acc.username}` : acc.full_name || 'Profile';
              return (
                <Pressable
                  key={acc.id}
                  onPress={() => {
                    if (onSelectAccount) {
                      Haptics.selectionAsync();
                      onSelectAccount(acc.id);
                    }
                  }}
                  style={[
                    styles.profileSwitcherChip,
                    {
                      backgroundColor: isSelected
                        ? '#e1306c'
                        : isDark
                          ? '#1e293b'
                          : '#f1f5f9',
                      borderColor: isSelected ? '#e1306c' : isDark ? '#334155' : '#cbd5e1',
                    },
                  ]}
                >
                  {acc.profile_picture_url ? (
                    <Image source={{ uri: acc.profile_picture_url }} style={styles.profileSwitcherAvatar} />
                  ) : (
                    <Ionicons name="logo-instagram" size={13} color={isSelected ? '#ffffff' : '#e1306c'} />
                  )}
                  <Text
                    style={[
                      styles.profileSwitcherText,
                      { color: isSelected ? '#ffffff' : isDark ? '#f8fafc' : '#0f172a' },
                    ]}
                  >
                    {handle}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={14} color="#ffffff" />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 1. Hero Instagram Profile Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            padding: 16,
            gap: 16,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          {/* Profile Avatar with Status Dot */}
          <View style={styles.profileAvatarWrapper}>
            {profileAccount?.profile_picture_url ? (
              <Image
                source={{ uri: profileAccount.profile_picture_url }}
                style={styles.profileAvatarImage}
              />
            ) : (
              <View style={[styles.profileAvatarFallback, { backgroundColor: isDark ? '#1e293b' : '#fdf2f8' }]}>
                <Ionicons name="logo-instagram" size={30} color="#e1306c" />
              </View>
            )}
            <View style={styles.profileOnlineDot} />
          </View>

          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
              <Text style={[styles.profileDisplayName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {profileAccount?.full_name || profileAccount?.page_name || profileAccount?.username || (profileAccount ? 'Instagram Account' : 'No Account Linked')}
              </Text>
              <Ionicons name="shield-checkmark" size={16} color="#10b981" />
            </View>

            {profileAccount?.username ? (
              <Pressable
                onPress={() => {
                  Haptics.selectionAsync();
                  Linking.openURL(`https://instagram.com/${profileAccount.username}`);
                }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}
              >
                <Text style={{ fontSize: 13, color: '#e1306c', fontWeight: '700' }}>
                  @{profileAccount.username}
                </Text>
                <Ionicons name="open-outline" size={12} color="#e1306c" />
              </Pressable>
            ) : null}

            <View style={styles.profileBadgeRow}>
              <View style={[styles.profileAccountTypeChip, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <Text style={[styles.profileAccountTypeText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  {profileAccount?.account_type || 'BUSINESS'}
                </Text>
              </View>
              <View style={styles.profileActiveStatusPill}>
                <View style={styles.profileActiveStatusDot} />
                <Text style={styles.profileActiveStatusText}>Connected</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4-Stat Performance Telemetry Strip */}
        <View style={[styles.profileStatsRow, { borderTopColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <View style={styles.profileStatItem}>
            <Text style={[styles.profileStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {profileAccount?.media_count ?? instagramMediaList.length}
            </Text>
            <Text style={styles.profileStatLbl}>Posts</Text>
          </View>

          <View style={[styles.profileStatDivider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

          <View style={styles.profileStatItem}>
            <Text style={[styles.profileStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              {profileAccount?.followers_count ?? 0}
            </Text>
            <Text style={styles.profileStatLbl}>Followers</Text>
          </View>

          <View style={[styles.profileStatDivider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

          <View style={styles.profileStatItem}>
            <Text style={[styles.profileStatVal, { color: '#3b82f6' }]}>
              {automationsCount}
            </Text>
            <Text style={styles.profileStatLbl}>Automations</Text>
          </View>

          <View style={[styles.profileStatDivider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

          <View style={styles.profileStatItem}>
            <Text style={[styles.profileStatVal, { color: '#10b981' }]}>
              {contactsCount}
            </Text>
            <Text style={styles.profileStatLbl}>Contacts</Text>
          </View>
        </View>

        {/* Profile Actions: Open on Instagram & Refresh Media */}
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            onPress={() => {
              if (profileAccount?.username) {
                Haptics.selectionAsync();
                Linking.openURL(`https://instagram.com/${profileAccount.username}`);
              }
            }}
            disabled={!profileAccount?.username}
            style={({ pressed }) => [
              styles.profileHeroActionBtn,
              {
                backgroundColor: '#e1306c',
                opacity: pressed || !profileAccount?.username ? 0.7 : 1,
              },
            ]}
          >
            <Ionicons name="logo-instagram" size={15} color="#ffffff" />
            <Text style={styles.profileHeroActionBtnText}>Open Instagram Profile</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRefreshProfile();
            }}
            style={({ pressed }) => [
              styles.profileHeroSecondaryBtn,
              {
                backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                borderColor: isDark ? '#334155' : '#cbd5e1',
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="refresh" size={15} color={isDark ? '#f8fafc' : '#0f172a'} />
          </Pressable>
        </View>
      </View>

      {/* 2. Webhook & Automation Health Card */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            padding: 14,
            gap: 12,
          },
        ]}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="shield-checkmark" size={16} color="#10b981" />
            <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 0 }]}>
              Gateway & Webhook Health
            </Text>
          </View>
          <View style={styles.profileActiveStatusPill}>
            <Text style={styles.profileActiveStatusText}>Healthy</Text>
          </View>
        </View>

        <View style={styles.autodmPermissionRow}>
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.autodmPermissionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Realtime Comments Ingestion
            </Text>
            <Text style={styles.autodmPermissionDesc}>
              instagram_manage_comments • Realtime webhook listener active
            </Text>
          </View>
          <View style={styles.autodmActivePill}>
            <Text style={styles.autodmActivePillText}>Active</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

        <View style={styles.autodmPermissionRow}>
          <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
          <View style={{ flex: 1 }}>
            <Text style={[styles.autodmPermissionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Direct Message Dispatch Service
            </Text>
            <Text style={styles.autodmPermissionDesc}>
              instagram_manage_messages • Meta 24-hr messaging standard
            </Text>
          </View>
          <View style={styles.autodmActivePill}>
            <Text style={styles.autodmActivePillText}>Active</Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]} />

        {/* Meta Graph IDs Box */}
        <View
          style={[
            styles.profileMetaBox,
            {
              backgroundColor: isDark ? '#131e32' : '#f8fafc',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
            },
          ]}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.profileMetaLabel}>Business Account ID</Text>
            <Text style={[styles.profileMetaVal, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              {profileAccount?.instagram_business_account_id || '--'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
            <Text style={styles.profileMetaLabel}>Webhook User ID</Text>
            <Text style={[styles.profileMetaVal, { color: isDark ? '#cbd5e1' : '#334155' }]}>
              {profileAccount?.webhook_instagram_user_id || '--'}
            </Text>
          </View>
        </View>
      </View>

      {/* 3. Published Media & Automation Triggers Grid */}
      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Text style={[styles.cardSectionTitle, { color: isDark ? '#f8fafc' : '#0f172a', marginBottom: 2 }]}>
              Published Media & Triggers
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
              Attach automated reply flows to your live posts & reels
            </Text>
          </View>
          <View style={[styles.contactCountBadge, { backgroundColor: isDark ? '#1e293b' : '#eff6ff', borderColor: isDark ? '#334155' : '#bfdbfe' }]}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#3b82f6' }}>
              {filteredMediaList.length} items
            </Text>
          </View>
        </View>

        {/* Media Category Filter Chips */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setMediaFilter('all');
            }}
            style={[
              styles.statusChip,
              mediaFilter === 'all'
                ? { backgroundColor: 'rgba(59, 130, 246, 0.14)', borderColor: '#3b82f6' }
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color: mediaFilter === 'all' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b',
                  fontWeight: mediaFilter === 'all' ? '700' : '500',
                },
              ]}
            >
              All ({mediaFilterCounts.all})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setMediaFilter('video');
            }}
            style={[
              styles.statusChip,
              mediaFilter === 'video'
                ? { backgroundColor: 'rgba(239, 68, 68, 0.14)', borderColor: '#ef4444' }
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color: mediaFilter === 'video' ? '#ef4444' : isDark ? '#94a3b8' : '#64748b',
                  fontWeight: mediaFilter === 'video' ? '700' : '500',
                },
              ]}
            >
              🎬 Reels ({mediaFilterCounts.reels})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setMediaFilter('image');
            }}
            style={[
              styles.statusChip,
              mediaFilter === 'image'
                ? { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: '#10b981' }
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color: mediaFilter === 'image' ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                  fontWeight: mediaFilter === 'image' ? '700' : '500',
                },
              ]}
            >
              📷 Photos ({mediaFilterCounts.photos})
            </Text>
          </Pressable>
        </View>

        {/* Media Loading */}
        {isLoadingMedia && (
          <View style={{ paddingVertical: 40, alignItems: 'center', gap: 10 }}>
            <ActivityIndicator size="large" color="#e1306c" />
            <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
              Fetching Instagram posts & reels...
            </Text>
          </View>
        )}

        {/* Media Grid */}
        {!isLoadingMedia && filteredMediaList.length > 0 && (
          <View style={styles.mediaGridContainer}>
            {filteredMediaList.map((item) => {
              const isVideo = item.media_type === 'VIDEO';
              const imgUri = item.thumbnail_url || item.media_url;
              const formattedDate = item.timestamp
                ? new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : '';

              return (
                <Pressable
                  key={item.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSelectMediaPost(item);
                  }}
                  style={[
                    styles.mediaGridItemCard,
                    {
                      backgroundColor: isDark ? '#0f172a' : '#ffffff',
                      borderColor: isDark ? '#1e293b' : '#e2e8f0',
                    },
                  ]}
                >
                  <View style={styles.mediaGridThumbWrapper}>
                    {imgUri ? (
                      <Image source={{ uri: imgUri }} style={styles.mediaGridImage} resizeMode="cover" />
                    ) : (
                      <View style={[styles.mediaGridPlaceholder, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                        <Ionicons name={isVideo ? 'videocam' : 'image'} size={24} color="#e1306c" />
                      </View>
                    )}

                    {/* Badges on top of image */}
                    <View style={styles.mediaGridTypeBadge}>
                      <Ionicons name={isVideo ? 'videocam' : 'image'} size={10} color="#ffffff" />
                      <Text style={styles.mediaGridTypeBadgeText}>{isVideo ? 'Reel' : 'Post'}</Text>
                    </View>

                    {formattedDate ? (
                      <View style={styles.mediaGridDateBadge}>
                        <Text style={styles.mediaGridDateBadgeText}>{formattedDate}</Text>
                      </View>
                    ) : null}

                    {/* Likes / Comments Overlay */}
                    <View style={styles.mediaGridStatsBar}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="heart" size={10} color="#ffffff" />
                        <Text style={styles.mediaGridStatVal}>{item.like_count ?? 0}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                        <Ionicons name="chatbubble" size={10} color="#ffffff" />
                        <Text style={styles.mediaGridStatVal}>{item.comments_count ?? 0}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Caption preview & Action */}
                  <View style={styles.mediaGridBody}>
                    <Text
                      numberOfLines={2}
                      style={[styles.mediaGridCaption, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    >
                      {item.caption || 'Instagram Post'}
                    </Text>

                    <Pressable
                      onPress={() => onTriggerAutoDM(item)}
                      style={({ pressed }) => [
                        styles.mediaGridTriggerBtn,
                        {
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          borderColor: 'rgba(59, 130, 246, 0.3)',
                          opacity: pressed ? 0.8 : 1,
                        },
                      ]}
                    >
                      <Ionicons name="flash" size={12} color="#3b82f6" />
                      <Text style={styles.mediaGridTriggerBtnText}>Set AutoDM</Text>
                    </Pressable>
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}

        {/* Empty State for Media */}
        {!isLoadingMedia && filteredMediaList.length === 0 && (
          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#0f172a' : '#ffffff',
                borderColor: isDark ? '#1e293b' : '#e2e8f0',
                alignItems: 'center',
                paddingVertical: 32,
                gap: 8,
              },
            ]}
          >
            <Ionicons name="images-outline" size={32} color={isDark ? '#64748b' : '#94a3b8'} />
            <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
              No Media Found
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
              Ensure your Instagram account has published posts or reels.
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  profileAvatarWrapper: {
    position: 'relative',
  },
  profileAvatarImage: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#e1306c',
  },
  profileAvatarFallback: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e1306c',
  },
  profileOnlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  profileDisplayName: {
    fontSize: 15,
    fontWeight: '800',
  },
  profileBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  profileAccountTypeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  profileAccountTypeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  profileActiveStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  profileActiveStatusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
  },
  profileActiveStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  profileStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
  },
  profileStatItem: {
    alignItems: 'center',
    gap: 2,
  },
  profileStatVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  profileStatLbl: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
  profileStatDivider: {
    width: 1,
    height: 24,
  },
  profileHeroActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  profileHeroActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  profileHeroSecondaryBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  autodmPermissionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  autodmPermissionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  autodmPermissionDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  autodmActivePill: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  autodmActivePillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#16a34a',
  },
  divider: {
    height: 1,
  },
  profileMetaBox: {
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
  },
  profileMetaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  profileMetaVal: {
    fontSize: 11,
    fontFamily: 'Courier',
    fontWeight: '700',
  },
  contactCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
  },
  mediaGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mediaGridItemCard: {
    width: '48%',
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  mediaGridThumbWrapper: {
    width: '100%',
    height: 140,
    backgroundColor: '#00000010',
    position: 'relative',
  },
  mediaGridImage: {
    width: '100%',
    height: '100%',
  },
  mediaGridPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaGridTypeBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaGridTypeBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#ffffff',
  },
  mediaGridDateBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mediaGridDateBadgeText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#ffffff',
  },
  mediaGridStatsBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  mediaGridStatVal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#ffffff',
  },
  mediaGridBody: {
    padding: 8,
    gap: 6,
  },
  mediaGridCaption: {
    fontSize: 11,
    fontWeight: '600',
    lineHeight: 15,
    minHeight: 30,
  },
  mediaGridTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  mediaGridTriggerBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
  },
  profileSwitcherRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  profileSwitcherLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  profileSwitcherChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  profileSwitcherAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },
  profileSwitcherText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
