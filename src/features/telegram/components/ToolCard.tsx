import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../contexts/ThemeContext';
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
    gradient: ['#EC4899', '#D946EF'],
    icon: 'git-compare-outline',
  },
  sub_manager: {
    gradient: ['#F59E0B', '#D97706'],
    icon: 'card',
  },
  report_bot: {
    gradient: ['#EF4444', '#DC2626'],
    icon: 'shield-checkmark',
  },
  broadcast: {
    gradient: ['#10B981', '#059669'],
    icon: 'megaphone',
  },
  auto_approve: {
    gradient: ['#06B6D4', '#0891B2'],
    icon: 'checkmark-circle-outline',
  },
  chatbot: {
    gradient: ['#6366F1', '#4F46E5'],
    icon: 'chatbubbles',
  },
};

const DEFAULT_VISUAL: ToolVisualConfig = {
  gradient: ['#64748B', '#475569'],
  icon: 'cube-outline',
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onPress }) => {
  const { isDark } = useTheme();

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
    backgroundColor: '#121212',
    borderColor: '#27272A',
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
