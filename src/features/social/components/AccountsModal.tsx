import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';

interface AccountsModalProps {
  visible: boolean;
  accounts: any;
  onClose: () => void;
  onDisconnect?: (provider: string, accountId?: string) => Promise<void>;
  isLoading?: boolean;
}

export const AccountsModal: React.FC<AccountsModalProps> = ({
  visible,
  accounts,
  onClose,
  onDisconnect,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
    const p = provider.toLowerCase();
    if (p.includes('instagram')) return { icon: 'logo-instagram', color: '#EC4899' };
    if (p.includes('youtube')) return { icon: 'logo-youtube', color: '#EF4444' };
    if (p.includes('facebook')) return { icon: 'logo-facebook', color: '#3B82F6' };
    if (p.includes('twitter') || p.includes('x')) return { icon: 'logo-twitter', color: '#38BDF8' };
    if (p.includes('linkedin')) return { icon: 'logo-linkedin', color: '#0A66C2' };
    return { icon: 'globe-outline', color: '#8E8E93' };
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
              <Ionicons name="close" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
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
                  Connect Instagram, YouTube, Facebook, LinkedIn or X on the GetAiPilot web portal.
                </Text>
              </View>
            ) : (
              accountList.map((acc, index) => {
                const isLive = acc.connected !== false;
                const username = acc.username || acc.name || acc.channelTitle || 'Connected Account';
                const provider = acc.provider || acc.platform || 'channel';
                const followers = acc.followers || acc.subscriberCount;
                const provInfo = getProviderIcon(provider);

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


                  </View>
                );
              })
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
  },
  modalCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  modalCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
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
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    maxHeight: 380,
  },
  emptyWrap: {
    paddingVertical: 36,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12.5,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 18,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  accountCardDark: {
    backgroundColor: '#121214',
    borderColor: '#2C2C2E',
  },
  accountCardLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
  },
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  avatarPlaceholder: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 16,
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
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  providerSubText: {
    fontSize: 12,
    fontWeight: '500',
  },
  disconnectBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
  },
  doneBtn: {
    backgroundColor: '#0A84FF',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  textLight: {
    color: '#F8FAFC',
  },
  textDark: {
    color: '#0F172A',
  },
});
