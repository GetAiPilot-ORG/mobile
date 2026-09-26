import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, getColors } from '@/theme';

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
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <Text style={styles.iconText}>{icon}</Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.category}>{category}</Text>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
        </View>
        {badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={styles.desc} numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
};

function createStyles(colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: 14,
      padding: 14,
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
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
      backgroundColor: colors.accentSoft,
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
      color: colors.mutedForeground,
      letterSpacing: -0.1,
    },
    title: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.foreground,
      marginTop: 1,
    },
    badge: {
      backgroundColor: colors.badgeNeutral,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.badgeNeutralText,
    },
    desc: {
      fontSize: 12.5,
      color: colors.mutedForeground,
      lineHeight: 17,
    },
  });
}

