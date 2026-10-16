import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  AppState,
  AppStateStatus,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useProductPalette, ProductTone, ProductRow } from '@/components/ProductUI';
import { useTheme } from '@/theme';
import { openDirectSocialConnect } from '../utils/socialHandoff';

export interface ConnectChannelModalProps {
  visible: boolean;
  onClose: () => void;
  connectedCount: number;
  channelLimit: number;
  planName?: string;
  onChannelConnected?: () => void;
}

interface PlatformOption {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  tone: ProductTone;
  comingSoon?: boolean;
}

const PLATFORMS: PlatformOption[] = [
  // --- Available To Connect Now ---
  {
    id: 'instagram',
    name: 'Instagram',
    subtitle: 'Posts, Reels & Stories',
    icon: 'logo-instagram',
    tone: 'pink',
  },
  {
    id: 'threads',
    name: 'Threads',
    subtitle: 'Text & Media Posts',
    icon: 'at-circle',
    tone: 'lavender',
  },
  {
    id: 'facebook',
    name: 'Facebook Pages',
    subtitle: 'Pages & Communities',
    icon: 'logo-facebook',
    tone: 'mint',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    subtitle: 'Shorts & Long Videos',
    icon: 'logo-youtube',
    tone: 'peach',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    subtitle: 'Personal & Company Pages',
    icon: 'logo-linkedin',
    tone: 'lavender',
  },

  // --- Coming Soon ---
  {
    id: 'x',
    name: 'X (Twitter)',
    subtitle: 'Tweets & Thread Storms',
    icon: 'logo-twitter',
    tone: 'mint',
    comingSoon: true,
  },
  {
    id: 'reddit',
    name: 'Reddit',
    subtitle: 'Subreddits & Communities',
    icon: 'logo-reddit',
    tone: 'peach',
    comingSoon: true,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    subtitle: 'Pins & Idea Boards',
    icon: 'logo-pinterest',
    tone: 'pink',
    comingSoon: true,
  },
  {
    id: 'googleBusiness',
    name: 'Google Business',
    subtitle: 'Local Business Profiles',
    icon: 'business-outline',
    tone: 'peach',
    comingSoon: true,
  },
  {
    id: 'bluesky',
    name: 'Bluesky',
    subtitle: 'Open Social Network',
    icon: 'cloudy',
    tone: 'mint',
    comingSoon: true,
  },
  {
    id: 'mastodon',
    name: 'Mastodon',
    subtitle: 'Decentralized Social Feed',
    icon: 'logo-mastodon',
    tone: 'lavender',
    comingSoon: true,
  },
];

export const ConnectChannelModal: React.FC<ConnectChannelModalProps> = ({
  visible,
  onClose,
  connectedCount,
  channelLimit,
  planName = 'Current',
  onChannelConnected,
}) => {
  const { isDark } = useTheme();
  const colors = useProductPalette();
  const router = useRouter();
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);

  // Auto-refresh and dismiss browser when user returns to app from browser
  useEffect(() => {
    if (!visible) return;
    const sub = AppState.addEventListener('change', async (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        try {
          WebBrowser.dismissBrowser();
          WebBrowser.dismissAuthSession();
        } catch {}

        if (onChannelConnected) {
          await onChannelConnected();
        }

        if (connectingPlatform) {
          setConnectingPlatform(null);
          onClose();
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert(
            'Account Connected',
            'Your social account has been successfully linked to GetAiPilot.'
          );
        }
      }
    });
    return () => sub.remove();
  }, [visible, connectingPlatform, onChannelConnected, onClose]);

  if (!visible) return null;

  const isLimitReached = connectedCount >= channelLimit;

  const handleSelectPlatform = async (p: PlatformOption) => {
    if (p.comingSoon) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      Alert.alert(
        'Coming Soon',
        `${p.name} integration is currently under development and will be available in an upcoming update.`
      );
      return;
    }

    if (isLimitReached) {
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
      Alert.alert(
        'Channel Limit Reached',
        `Your ${planName} plan supports ${channelLimit} channels. Please upgrade your plan or disconnect an inactive channel.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'View Plans',
            onPress: () => {
              onClose();
              router.push('/products/social/plans' as any);
            },
          },
        ]
      );
      return;
    }

    try {
      setConnectingPlatform(p.id);
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      // Direct OAuth authorization call via BFF & auto-dismiss auth session
      const res = await openDirectSocialConnect(p.id);

      if (onChannelConnected) {
        await onChannelConnected();
      }

      onClose();

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      const displayName = res?.username ? `@${res.username}` : p.name;
      Alert.alert(
        'Account Connected',
        `Your ${p.name} account ${res?.username ? `(${displayName})` : ''} has been connected successfully to GetAiPilot.`
      );
    } catch (err: any) {
      console.warn('[ConnectChannelModal] Error connecting platform:', err);
    } finally {
      setConnectingPlatform(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.background }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextCol}>
              <Text style={[styles.title, { color: colors.text }]}>
                Connect channel
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {connectedCount} of {channelLimit} active
              </Text>
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onClose();
              }}
              style={[styles.closeBtn, { backgroundColor: colors.card }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Ionicons name="close" size={19} color={colors.text} />
            </Pressable>
          </View>

          {/* Platform List in Project Style */}
          <ScrollView
            style={styles.scrollBody}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {PLATFORMS.map((p) => {
              const isConnectingThis = connectingPlatform === p.id;

              return (
                <ProductRow
                  key={p.id}
                  title={p.name}
                  detail={p.subtitle}
                  tone={p.tone}
                  icon={p.icon}
                  onPress={connectingPlatform ? undefined : () => handleSelectPlatform(p)}
                  trailing={
                    isConnectingThis ? (
                      <ActivityIndicator size="small" color={colors.accent || '#EC4899'} />
                    ) : p.comingSoon ? (
                      <View
                        style={[
                          styles.comingSoonBadge,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)' },
                        ]}
                      >
                        <Text style={[styles.comingSoonText, { color: colors.textSecondary }]}>
                          Coming soon
                        </Text>
                      </View>
                    ) : undefined
                  }
                />
              );
            })}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '85%',
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 26,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  headerTextCol: {
    gap: 3,
  },
  title: {
    fontSize: 21,
    fontWeight: '600',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '400',
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollBody: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingBottom: 16,
  },
  comingSoonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  comingSoonText: {
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: -0.2,
    textTransform: 'uppercase',
  },
});
