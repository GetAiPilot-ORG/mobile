import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  WhatsappIcon,
  TelegramIcon,
  InstagramIcon,
  Facebook01Icon,
} from '@/constants/icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

export type ChannelFilterId = 'all' | 'whatsapp' | 'telegram' | 'instagram' | 'facebook';

interface ChannelChipsProps {
  selectedChannel: ChannelFilterId;
  onSelectChannel: (channel: ChannelFilterId) => void;
  channelCounts: {
    all: number;
    whatsapp: number;
    telegram: number;
    instagram: number;
    facebook: number;
  };
  telegramBots?: Array<{ id: string; name: string; count: number }>;
  selectedTelegramBot?: string;
  onSelectTelegramBot?: (botId: string) => void;
}

const CHANNELS: Array<{
  id: ChannelFilterId;
  label: string;
  icon: any;
  activeColor: string;
  activeBgLight: string;
  activeBgDark: string;
}> = [
    {
      id: 'all',
      label: 'All',
      icon: null,
      activeColor: '#7055E8',
      activeBgLight: 'rgba(112, 85, 232, 0.12)',
      activeBgDark: 'rgba(112, 85, 232, 0.22)',
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: WhatsappIcon,
      activeColor: '#16A34A',
      activeBgLight: 'rgba(34, 197, 94, 0.12)',
      activeBgDark: 'rgba(34, 197, 94, 0.22)',
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: TelegramIcon,
      activeColor: '#0284C7',
      activeBgLight: 'rgba(14, 165, 233, 0.12)',
      activeBgDark: 'rgba(14, 165, 233, 0.22)',
    },
    {
      id: 'instagram',
      label: 'InstaPilot',
      icon: InstagramIcon,
      activeColor: '#DB2777',
      activeBgLight: 'rgba(236, 72, 153, 0.12)',
      activeBgDark: 'rgba(236, 72, 153, 0.22)',
    },
    {
      id: 'facebook',
      label: 'Facebook',
      icon: Facebook01Icon,
      activeColor: '#2563EB',
      activeBgLight: 'rgba(59, 130, 246, 0.12)',
      activeBgDark: 'rgba(59, 130, 246, 0.22)',
    },
  ];

export const ChannelChips: React.FC<ChannelChipsProps> = ({
  selectedChannel,
  onSelectChannel,
  channelCounts,
  telegramBots = [],
  selectedTelegramBot = 'all',
  onSelectTelegramBot,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const flatListRef = useRef<FlatList>(null);

  // Auto-scroll selected channel chip into view
  useEffect(() => {
    const index = CHANNELS.findIndex((c) => c.id === selectedChannel);
    if (index > 0 && flatListRef.current) {
      try {
        flatListRef.current.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.3,
        });
      } catch { }
    }
  }, [selectedChannel]);

  return (
    <View style={styles.wrapper}>
      {/* Scrollable Channel Chips */}
      <View style={styles.scrollWrapper}>
        <FlatList<typeof CHANNELS[number]>
          ref={flatListRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CHANNELS}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.contentContainer}
          onScrollToIndexFailed={() => { }}
          renderItem={({ item: ch }) => {
            const isSelected = selectedChannel === ch.id;
            const count = channelCounts[ch.id] || 0;
            const activeBg = isDark ? ch.activeBgDark : ch.activeBgLight;

            return (
              <Pressable
                cssInterop={false}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    try {
                      Haptics.selectionAsync();
                    } catch { }
                  }
                  onSelectChannel(ch.id);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: isSelected }}
                accessibilityLabel={`${ch.label} channel, ${count} conversations`}
                style={[
                  styles.chip,
                  {
                    backgroundColor: isSelected ? activeBg : colors.card,
                    borderColor: isSelected
                      ? ch.activeColor
                      : isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.06)',
                  },
                ]}
              >
                {ch.icon ? (
                  <HugeiconsIcon
                    icon={ch.icon}
                    size={14}
                    color={isSelected ? ch.activeColor : colors.textSecondary}
                    strokeWidth={2}
                    style={{ marginRight: 6 }}
                  />
                ) : null}

                <Text
                  style={[
                    styles.chipLabel,
                    {
                      color: isSelected ? ch.activeColor : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}
                >
                  {ch.label}
                </Text>

                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isSelected
                        ? ch.activeColor
                        : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </Pressable>
            );
          }}
        />

        {/* Soft Right-Edge Gradient Fade to indicate horizontal scrollability */}
        <LinearGradient
          colors={[
            'transparent',
            isDark ? 'rgba(13, 11, 20, 0.85)' : 'rgba(247, 246, 251, 0.85)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rightFade}
          pointerEvents="none"
        />
      </View>

      {/* Secondary Telegram Chatbot Pills (if Telegram active and has bots) */}
      {selectedChannel === 'telegram' && telegramBots.length > 1 && onSelectTelegramBot && (
        <View style={styles.botRowWrapper}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[
              { id: 'all', name: 'All Bots', count: channelCounts.telegram },
              ...telegramBots,
            ]}
            keyExtractor={(b) => b.id}
            contentContainerStyle={styles.botScrollContent}
            renderItem={({ item: bot }) => {
              const isSelected = selectedTelegramBot === bot.id;
              return (
                <Pressable
                  onPress={() => onSelectTelegramBot(bot.id)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: isSelected }}
                  style={[
                    styles.botChip,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(2, 132, 199, 0.25)'
                          : '#E0F2FE'
                        : colors.card,
                      borderColor: isSelected
                        ? '#0284C7'
                        : isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.06)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.botName,
                      { color: isSelected ? '#0284C7' : colors.textSecondary },
                    ]}
                  >
                    {bot.name}
                  </Text>
                  <View
                    style={[
                      styles.botCountBadge,
                      {
                        backgroundColor: isSelected
                          ? '#0284C7'
                          : isDark
                            ? 'rgba(255, 255, 255, 0.1)'
                            : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.botCountText,
                        { color: isSelected ? '#FFFFFF' : colors.textSecondary },
                      ]}
                    >
                      {bot.count}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 12,
  },
  scrollWrapper: {
    position: 'relative',
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingRight: 32,
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 13,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 12.5,
    marginRight: 6,
    letterSpacing: -0.1,
  },
  countBadge: {
    minWidth: 19,
    height: 19,
    borderRadius: 9.5,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    fontSize: 10,
    fontWeight: '800',
  },
  rightFade: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: 28,
  },
  botRowWrapper: {
    marginTop: 8,
  },
  botScrollContent: {
    paddingHorizontal: 16,
    paddingRight: 24,
    gap: 6,
  },
  botChip: {
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  botName: {
    fontSize: 11,
    fontWeight: '600',
    marginRight: 5,
  },
  botCountBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botCountText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
});


