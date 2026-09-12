import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Image,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

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
  isLoading,
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
                <Ionicons name="link" size={20} color="#3b82f6" />
              </View>
              <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Connected Social Channels
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {accountList.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="cloud-offline" size={36} color={isDark ? '#475569' : '#cbd5e1'} />
                <Text style={[styles.emptyText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  No active social channels connected yet.
                </Text>
                <Text style={[styles.emptySub, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  Connect Instagram, YouTube, Facebook, LinkedIn or X on the web portal.
                </Text>
              </View>
            ) : (
              accountList.map((acc, index) => {
                const isLive = acc.connected !== false;
                const username = acc.username || acc.name || acc.channelTitle || 'Connected Account';
                const provider = acc.provider || acc.platform || 'channel';
                const followers = acc.followers || acc.subscriberCount;

                return (
                  <View
                    key={index}
                    style={[
                      styles.accountCard,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                      },
                    ]}
                  >
                    <View style={styles.cardLeft}>
                      {acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl ? (
                        <Image
                          source={{ uri: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl }}
                          style={styles.avatar}
                        />
                      ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: '#ec4899' }]}>
                          <Text style={styles.avatarInitial}>{username[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <View style={styles.providerRow}>
                          <Text style={styles.providerBadge}>{provider.toUpperCase()}</Text>
                          <View
                            style={[
                              styles.liveDot,
                              { backgroundColor: isLive ? '#22c55e' : '#ef4444' },
                            ]}
                          />
                        </View>
                        <Text
                          style={[styles.accountName, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          numberOfLines={1}
                        >
                          {username}
                        </Text>
                        {followers != null && (
                          <Text style={styles.followersText}>
                            {Number(followers).toLocaleString()} audience reach
                          </Text>
                        )}
                      </View>
                    </View>

                    {onDisconnect && (
                      <Pressable
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          onDisconnect(provider, acc.id || acc.account_id);
                        }}
                        style={styles.disconnectBtn}
                      >
                        <Ionicons name="trash-outline" size={16} color="#ef4444" />
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <Pressable onPress={onClose} style={styles.doneBtn}>
              <Text style={styles.doneBtnText}>Close</Text>
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
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
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
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    maxHeight: 400,
  },
  emptyWrap: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 6,
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
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
  cardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  providerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  providerBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ec4899',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '700',
  },
  followersText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  disconnectBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.1)',
  },
  doneBtn: {
    backgroundColor: '#3b82f6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
