import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramHubTool } from '../types';

interface ToolCardProps {
  tool: TelegramHubTool;
  onPress: () => void;
}

interface ToolVisualConfig {
  gradient: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
}

const TOOL_VISUAL_MAP: Record<string, ToolVisualConfig> = {
  reactions: {
    gradient: ['#8B5CF6', '#6366F1'],
    icon: 'sparkles',
  },
  tracker: {
    gradient: ['#0284C7', '#0369A1'],
    icon: 'share-social',
  },
  autoforward: {
    gradient: ['#0EA5E9', '#0284C7'],
    icon: 'paper-plane',
  },
  sub_manager: {
    gradient: ['#F43F5E', '#DB2777'],
    icon: 'wallet',
  },
  report_bot: {
    gradient: ['#10B981', '#047857'],
    icon: 'shield-checkmark',
  },
  broadcast: {
    gradient: ['#F59E0B', '#D97706'],
    icon: 'megaphone',
  },
  auto_approve: {
    gradient: ['#14B8A6', '#0F766E'],
    icon: 'checkmark-circle',
  },
  chatbot: {
    gradient: ['#6366F1', '#4F46E5'],
    icon: 'hardware-chip',
  },
};

const DEFAULT_VISUAL: ToolVisualConfig = {
  gradient: ['#0284C7', '#0369A1'],
  icon: 'apps',
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const visual = TOOL_VISUAL_MAP[tool.key] || DEFAULT_VISUAL;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      {/* Left: Rich Gradient App Icon */}
      <LinearGradient
        colors={visual.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.iconContainer}
      >
        <Ionicons name={visual.icon} size={22} color="#FFFFFF" />
      </LinearGradient>

      {/* Middle: Title & Description */}
      <View style={styles.infoCol}>
        <Text
          style={[styles.title, isDark ? styles.textDark : styles.textLight]}
          numberOfLines={1}
        >
          {tool.title}
        </Text>
        <Text style={styles.description} numberOfLines={2}>
          {tool.description}
        </Text>
      </View>

      {/* Right: Sleek Chevron Arrow */}
      <Ionicons
        name="chevron-forward"
        size={18}
        color={isDark ? '#475569' : '#94A3B8'}
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 10,
    gap: 12,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardDark: {
    backgroundColor: '#161B26',
    borderColor: '#262C36',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
    marginBottom: 2,
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  description: {
    color: '#94A3B8',
    fontSize: 12,
    lineHeight: 16,
  },
});
