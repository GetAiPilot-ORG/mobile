import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Image,
  Platform,
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
}) => {
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
    if (p.includes('facebook')) return { icon: 'logo-facebook', color: '#0084FF' };
    if (p.includes('twitter') || p.includes('x')) return { icon: 'logo-twitter', color: '#38BDF8' };
    if (p.includes('linkedin')) return { icon: 'logo-linkedin', color: '#0A66C2' };
    return { icon: 'globe-outline', color: '#94A3B8' };
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl max-h-[80%] p-5">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2.5">
              <View className="w-8 h-8 rounded-full justify-center items-center bg-blue-500/15">
                <Ionicons name="link-outline" size={18} color="#0084FF" />
              </View>
              <Text className="text-base font-bold text-white tracking-tight">
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
              className="w-8 h-8 rounded-full justify-center items-center bg-[#262930]"
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView className="max-h-96" showsVerticalScrollIndicator={false}>
            {accountList.length === 0 ? (
              <View className="py-9 items-center gap-2">
                <Ionicons name="cloud-offline-outline" size={40} color="#475569" />
                <Text className="text-[15px] font-semibold text-white mt-1.5">
                  No active channels connected
                </Text>
                <Text className="text-xs text-center px-5 text-slate-400 leading-4">
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
                    className="flex-row items-center justify-between p-3 rounded-2xl border border-[#262930] bg-[#111317] mb-2.5"
                  >
                    <View className="flex-row items-center gap-3 flex-1">
                      {acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl ? (
                        <Image
                          source={{ uri: acc.profilePicture || acc.profile_picture_url || acc.thumbnailUrl }}
                          className="w-10 h-10 rounded-full border border-white/10"
                        />
                      ) : (
                        <View className="w-10 h-10 rounded-full justify-center items-center" style={{ backgroundColor: provInfo.color }}>
                          <Text className="text-white text-base font-bold">{username[0]?.toUpperCase()}</Text>
                        </View>
                      )}
                      <View className="flex-1 justify-center">
                        <View className="flex-row items-center gap-1.5 mb-0.5">
                          <Text
                            className="text-sm font-semibold text-white tracking-tight"
                            numberOfLines={1}
                          >
                            {username}
                          </Text>
                          <View
                            className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-red-500'}`}
                          />
                        </View>
                        <Text className="text-xs font-medium text-slate-400">
                          {provider.charAt(0).toUpperCase() + provider.slice(1).toLowerCase()}
                          {followers != null ? ` • ${Number(followers).toLocaleString()} audience` : ''}
                        </Text>
                      </View>
                    </View>

                    {onDisconnect && (
                      <Pressable
                        onPress={() => {
                          if (Platform.OS !== 'web') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                          }
                          onDisconnect(provider, acc.id || acc.account_id);
                        }}
                        className="p-2 rounded-lg bg-red-500/10"
                        hitSlop={6}
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </Pressable>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Footer */}
          <View className="mt-3.5 pt-3">
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                onClose();
              }}
              className="bg-[#0084FF] py-3 rounded-xl items-center"
            >
              <Text className="text-white text-[15px] font-semibold">Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
