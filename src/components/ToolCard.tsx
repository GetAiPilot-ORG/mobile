import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../theme/colors';

interface ToolCardProps {
  title: string;
  category: string;
  description: string;
  icon: string;
  badge?: string;
  onPress: () => void;
}

export const ToolCard: React.FC<ToolCardProps> = ({
  title,
  category,
  description,
  icon,
  badge,
  onPress,
}) => {
  const { isDark } = useTheme();

  return (
    <Pressable style={[styles.card, isDark && styles.cardDark]} onPress={onPress}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconBox,
            { backgroundColor: isDark ? 'rgba(10, 132, 255, 0.16)' : colors.accentSoft },
          ]}
        >
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.category, isDark && styles.categoryDark]}>{category}</Text>
          <Text style={[styles.title, isDark && styles.titleDark]} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {badge ? (
          <View style={[styles.badge, isDark && styles.badgeDark]}>
            <Text style={[styles.badgeText, isDark && styles.badgeTextDark]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.desc, isDark && styles.descDark]} numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 18,
  },
  headerInfo: {
    flex: 1,
  },
  category: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8E8E93',
    letterSpacing: -0.1,
  },
  categoryDark: {
    color: '#8E8E93',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000000',
    marginTop: 1,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  badge: {
    backgroundColor: '#F2F4F7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeDark: {
    backgroundColor: '#2C2C2E',
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
  },
  badgeTextDark: {
    color: '#8E8E93',
  },
  desc: {
    fontSize: 12.5,
    color: '#6B7280',
    lineHeight: 17,
  },
  descDark: {
    color: '#8E8E93',
  },
});
