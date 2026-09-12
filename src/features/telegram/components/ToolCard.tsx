import React from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramHubTool } from '../types';

interface ToolCardProps {
  tool: TelegramHubTool;
  onPress: () => void;
}

const BADGE_THEMES: Record<string, { bg: string; text: string; iconColor: string; iconBg: string }> = {
  ENGAGEMENT: {
    bg: 'rgba(139, 92, 246, 0.12)',
    text: '#8B5CF6',
    iconColor: '#8B5CF6',
    iconBg: 'rgba(139, 92, 246, 0.1)',
  },
  POPULAR: {
    bg: 'rgba(2, 132, 199, 0.12)',
    text: '#0284C7',
    iconColor: '#0284C7',
    iconBg: 'rgba(2, 132, 199, 0.1)',
  },
  SEBI: {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#059669',
    iconColor: '#059669',
    iconBg: 'rgba(16, 185, 129, 0.1)',
  },
  AUTOMATION: {
    bg: 'rgba(2, 132, 199, 0.12)',
    text: '#0284C7',
    iconColor: '#0284C7',
    iconBg: 'rgba(2, 132, 199, 0.1)',
  },
  MONETIZE: {
    bg: 'rgba(168, 85, 247, 0.12)',
    text: '#A855F7',
    iconColor: '#A855F7',
    iconBg: 'rgba(168, 85, 247, 0.1)',
  },
  'SMART GATE': {
    bg: 'rgba(16, 185, 129, 0.12)',
    text: '#059669',
    iconColor: '#059669',
    iconBg: 'rgba(16, 185, 129, 0.1)',
  },
  'AI DRIVEN': {
    bg: 'rgba(239, 68, 68, 0.12)',
    text: '#EF4444',
    iconColor: '#EF4444',
    iconBg: 'rgba(239, 68, 68, 0.1)',
  },
  BROADCAST: {
    bg: 'rgba(245, 158, 11, 0.12)',
    text: '#D97706',
    iconColor: '#D97706',
    iconBg: 'rgba(245, 158, 11, 0.1)',
  },
};

export const ToolCard: React.FC<ToolCardProps> = ({ tool, onPress }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const badgeTheme = (tool.badge && BADGE_THEMES[tool.badge]) || {
    bg: 'rgba(2, 132, 199, 0.12)',
    text: '#0284C7',
    iconColor: '#0284C7',
    iconBg: 'rgba(2, 132, 199, 0.1)',
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
      onPress={handlePress}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: badgeTheme.iconBg }]}>
          <Ionicons name={(tool.icon as any) || 'hardware-chip-outline'} size={18} color={badgeTheme.iconColor} />
        </View>
        {tool.badge && (
          <View style={[styles.badge, { backgroundColor: badgeTheme.bg }]}>
            <Text style={[styles.badgeText, { color: badgeTheme.text }]}>{tool.badge}</Text>
          </View>
        )}
      </View>

      <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>{tool.title}</Text>

      <Text style={styles.description} numberOfLines={3}>
        {tool.description}
      </Text>

      <View style={[styles.footer, isDark ? styles.footerDark : styles.footerLight]}>
        <View style={styles.actionRow}>
          <Text style={styles.actionText}>Launch Module</Text>
          <Ionicons name="arrow-forward-outline" size={13} color="#0284C7" />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6,
  },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  description: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerLight: { borderTopColor: '#F1F5F9' },
  footerDark: { borderTopColor: '#262C36' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '700',
  },
});
