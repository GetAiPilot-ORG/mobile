import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { useTheme, getColors } from '@/theme';
import { TelegramHubTool } from '../types';

interface ToolCardProps {
  tool: TelegramHubTool;
  onPress: () => void;
}

interface ToolVisualConfig {
  gradient: readonly [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  badge: string;
  badgeColor: string;
  badgeBg: string;
}

const TOOL_VISUAL_MAP: Record<string, ToolVisualConfig> = {
  reactions: {
    gradient: ['#6366F1', '#8B5CF6'],
    icon: 'sparkles',
    badge: 'ENGAGEMENT',
    badgeColor: '#818CF8',
    badgeBg: 'rgba(99, 102, 241, 0.15)',
  },
  tracker: {
    gradient: ['#0284C7', '#0369A1'],
    icon: 'share-social',
    badge: 'POPULAR',
    badgeColor: '#38BDF8',
    badgeBg: 'rgba(2, 132, 199, 0.15)',
  },
  report_bot: {
    gradient: ['#10B981', '#059669'],
    icon: 'document-text',
    badge: 'SEBI',
    badgeColor: '#34D399',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
  },
  autoforward: {
    gradient: ['#3B82F6', '#1D4ED8'],
    icon: 'git-compare-outline',
    badge: 'AUTOMATION',
    badgeColor: '#60A5FA',
    badgeBg: 'rgba(59, 130, 246, 0.15)',
  },
  sub_manager: {
    gradient: ['#A855F7', '#7E22CE'],
    icon: 'card',
    badge: 'MONETIZE',
    badgeColor: '#C084FC',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
  },
  auto_approve: {
    gradient: ['#14B8A6', '#0D9488'],
    icon: 'checkmark-circle-outline',
    badge: 'SMART GATE',
    badgeColor: '#2DD4BF',
    badgeBg: 'rgba(20, 184, 166, 0.15)',
  },
  chatbot: {
    gradient: ['#F43F5E', '#E11D48'],
    icon: 'chatbubbles',
    badge: 'AI DRIVEN',
    badgeColor: '#FB7185',
    badgeBg: 'rgba(244, 63, 94, 0.15)',
  },
  broadcast: {
    gradient: ['#F59E0B', '#D97706'],
    icon: 'megaphone',
    badge: 'BROADCAST',
    badgeColor: '#FBBF24',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
  },
};

const DEFAULT_VISUAL: ToolVisualConfig = {
  gradient: ['#64748B', '#475569'],
  icon: 'cube-outline',
  badge: 'MODULE',
  badgeColor: '#94A3B8',
  badgeBg: 'rgba(100, 116, 139, 0.15)',
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onPress }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark)

  const visual = TOOL_VISUAL_MAP[tool.key] || DEFAULT_VISUAL;
  const badgeText = tool.badge || visual.badge;

  const handlePress = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
        pressed && styles.cardPressed,
      ]}
      onPress={handlePress}
    >
      {/* Top Row: Icon + Title & Badge */}
      <View style={styles.topRow}>
        <View style={styles.leftMeta}>
          <LinearGradient
            colors={visual.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconContainer}
          >
            <Ionicons name={visual.icon} size={22} color="#FFFFFF" />
          </LinearGradient>
          <View style={styles.titleWrap}>
            <Text
              style={[styles.title, isDark ? styles.textDark : styles.textLight]}
              numberOfLines={1}
            >
              {tool.title}
            </Text>
            <Text style={styles.subtitleCategory}>
              Telegram Integration
            </Text>
          </View>
        </View>

        {badgeText ? (
          <View style={[styles.badgePill, { backgroundColor: visual.badgeBg }]}>
            <Text style={[styles.badgeText, { color: visual.badgeColor }]}>
              {badgeText}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Description */}
      <Text style={styles.description} numberOfLines={2}>
        {tool.description}
      </Text>

      {/* Bottom Footer: Launch action button */}
      <View style={[styles.footerRow, isDark ? styles.footerBorderDark : styles.footerBorderLight]}>
        <Text style={[styles.launchText, { color: visual.badgeColor }]}>
          Launch Module
        </Text>
        <View style={[styles.arrowWrap, { backgroundColor: visual.badgeBg }]}>
          <Ionicons
            name="arrow-forward"
            size={13}
            color={visual.badgeColor}
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#121214',
    borderColor: '#27272A',
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  leftMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 8,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  titleWrap: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitleCategory: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  description: {
    color: '#94A3B8',
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  footerBorderLight: {
    borderTopColor: '#F1F5F9',
  },
  footerBorderDark: {
    borderTopColor: '#27272A',
  },
  launchText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  arrowWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
