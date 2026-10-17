import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme } from '@/theme';

interface AccountsModalProps {
  visible: boolean;
  accounts: any;
  onClose: () => void;
  onDisconnect?: (provider: string, accountId?: string) => Promise<void>;
  onOpenConnectModal?: () => void;
  isLoading?: boolean;
}

export const AccountsModal: React.FC<AccountsModalProps> = ({
  visible,
  accounts,
  onClose,
  onDisconnect,
  onOpenConnectModal,
}) => {
  const { isDark } = useTheme();
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);

  if (!visible) return null;

  // Flatten accounts from groups or list
  const accountList: any[] = [];
  if (Array.isArray(accounts)) {
    accountList.push(...accounts);
  } else if (accounts && typeof accounts === 'object') {
    Object.entries(accounts).forEach(([key, val]) => {
      if (Array.isArray(val)) {
        accountList.push(...val);
      } else if (val && typeof val === 'object' && (val as any).connected) {
        accountList.push({ ...(val as any), provider: key });
      }
    });
  }

  const getProviderIcon = (provider: string) => {
    const p = (provider || '').toLowerCase();
    if (p.includes('instagram')) return { icon: 'logo-instagram' as const, color: '#EC4899' };
    if (p.includes('threads')) return { icon: 'at-circle' as const, color: '#1C1A25' };
    if (p.includes('youtube')) return { icon: 'logo-youtube' as const, color: '#EF4444' };
    if (p.includes('facebook')) return { icon: 'logo-facebook' as const, color: '#3B82F6' };
    if (p.includes('twitter') || p.includes('x')) return { icon: 'logo-twitter' as const, color: '#38BDF8' };
    if (p.includes('linkedin')) return { icon: 'logo-linkedin' as const, color: '#0A66C2' };
    if (p.includes('bluesky')) return { icon: 'cloudy' as const, color: '#0285FF' };
    if (p.includes('mastodon')) return { icon: 'logo-mastodon' as const, color: '#6364FF' };
    if (p.includes('reddit')) return { icon: 'logo-reddit' as const, color: '#FF4500' };
    if (p.includes('google')) return { icon: 'business-outline' as const, color: '#4285F4' };
    if (p.includes('pinterest')) return { icon: 'logo-pinterest' as const, color: '#E60023' };
    return { icon: 'globe-outline' as const, color: '#8E8E93' };
  };

  const handleDisconnectPress = (acc: any, username: string, provider: string) => {
    const accountId = acc.id || acc.accountId || acc.account_id || acc.pageId || acc.page_id;
    const targetKey = accountId || provider;

    const executeDisconnect = async () => {
      if (!onDisconnect) return;
      try {
        setDisconnectingId(targetKey);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
        await onDisconnect(provider, accountId);
      } catch (err: any) {
        Alert.alert('Disconnect Failed', err?.message || 'Could not disconnect channel. Please try again.');
      } finally {
        setDisconnectingId(null);
      }
    };

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`Are you sure you want to disconnect ${username} (${provider.toUpperCase()})?`)) {
        executeDisconnect();
      }
    } else {
      Alert.alert(
        'Disconnect Channel',
        `Are you sure you want to disconnect ${username} (${provider.toUpperCase()})?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Disconnect', style: 'destructive', onPress: executeDisconnect },
        ]
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, isDark ? styles.modalCardDark : styles.modalCardLight]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
                <Ionicons name="link-outline" size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.title, isDark ? styles.textLight : styles.textDark]}>
                Connected Channels
              </Text>
            </View>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onClose();
              }}
              style={styles.closeBtn}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={isDark ? '#777383' : '#64748B'} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {accountList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="cloud-offline-outline" size={40} color={isDark ? '#475569' : '#CBD5E1'} />
                <Text style={[styles.emptyText, isDark ? styles.textLight : styles.textDark]}>
                  No active channels connected
                </Text>
                <Text style={[styles.emptySub, { color: isDark ? '#8E8E93' : '#64748B' }]}>
                  Connect your Instagram, Threads, YouTube, Facebook, LinkedIn or X channels to start broadcasting.
                </Text>
                {onOpenConnectModal && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onOpenConnectModal();
                    }}
                    style={styles.emptyConnectBtn}
                  >
                    <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
                    <Text style={styles.emptyConnectBtnText}>Connect a Channel</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <>
                {accountList.map((acc, index) => {
                  const isLive = acc.connected !== false;
                  const username = acc.username || acc.name || acc.channelTitle || 'Connected Account';
                  const provider = acc.provider || acc.platform || 'channel';
                  const followers = acc.followers || acc.subscriberCount;
                  const provInfo = getProviderIcon(provider);
                  const accountId = acc.id || acc.accountId || acc.account_id || acc.pageId || acc.page_id;
                  const targetKey = accountId || provider;
                  const isDisconnectingThis = disconnectingId === targetKey;

                  return (
                    <View
                      key={index}
                      style={[
                        styles.accountCard,
                        isDark ? styles.accountCardDark : styles.accountCardLight,
                      ]}
                    >
                      <View style={styles.cardLeft}>
                        {acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl ? (
                          <Image
                            source={{ uri: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl }}
                            style={styles.avatar}
                          />
                        ) : (
                          <View style={[styles.avatarPlaceholder, { backgroundColor: provInfo.color }]}>
                            <Text style={styles.avatarInitial}>{username[0]?.toUpperCase()}</Text>
                          </View>
                        )}
                        <View style={styles.infoCol}>
                          <View style={styles.nameRow}>
                            <Text
                              style={[styles.accountName, isDark ? styles.textLight : styles.textDark]}
                              numberOfLines={1}
                            >
                              {username}
                            </Text>
                            <View
                              style={[
                                styles.liveDot,
                                { backgroundColor: isLive ? '#22C55E' : '#EF4444' },
                              ]}
                            />
                          </View>
                          <Text style={[styles.providerSubText, { color: isDark ? '#8E8E93' : '#64748B' }]}>
                            {provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()}
                            {followers != null ? ` • ${Number(followers).toLocaleString()} audience` : ''}
                          </Text>
                        </View>
                      </View>

                      {/* Disconnect Action Button */}
                      {onDisconnect && (
                        <Pressable
                          onPress={() => handleDisconnectPress(acc, username, provider)}
                          disabled={isDisconnectingThis}
                          style={[
                            styles.disconnectBtn,
                            isDisconnectingThis && { opacity: 0.6 },
                          ]}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel={`Disconnect ${username}`}
                        >
                          {isDisconnectingThis ? (
                            <ActivityIndicator size="small" color="#EF4444" />
                          ) : (
                            <View style={styles.disconnectInner}>
                              <Ionicons name="trash-outline" size={14} color="#EF4444" />
                              <Text style={styles.disconnectBtnText}>Disconnect</Text>
                            </View>
                          )}
                        </Pressable>
                      )}
                    </View>
                  );
                })}

                {/* In-Modal Connect Channel Prompt */}
                {onOpenConnectModal && (
                  <Pressable
                    onPress={() => {
                      onClose();
                      onOpenConnectModal();
                    }}
                    style={[
                      styles.addNewChannelRow,
                      { borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' },
                    ]}
                  >
                    <Ionicons name="add" size={18} color="#EC4899" />
                    <Text style={styles.addNewChannelText}>Connect another channel</Text>
                  </Pressable>
                )}
              </>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onClose();
              }}
              style={styles.doneBtn}
            >
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 0,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  modalCardDark: {
    backgroundColor: '#1E1B28',
    borderColor: '#3A3549',
  },
  modalCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E9E6F2',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    maxHeight: 420,
  },
  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 13.5,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 19,
  },
  emptyConnectBtn: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EC4899',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  emptyConnectBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
  },
  accountCardDark: {
    backgroundColor: '#272335',
  },
  accountCardLight: {
    backgroundColor: '#F7F5FC',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  accountName: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  providerSubText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  disconnectBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disconnectInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  disconnectBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  addNewChannelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginTop: 6,
    marginBottom: 10,
  },
  addNewChannelText: {
    color: '#EC4899',
    fontSize: 13.5,
    fontWeight: '600',
  },
  footer: {
    marginTop: 12,
    paddingTop: 8,
  },
  doneBtn: {
    backgroundColor: '#1C1A25',
    paddingVertical: 13,
    borderRadius: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  textLight: {
    color: '#F5F3FB',
  },
  textDark: {
    color: '#1C1A25',
  },
});
