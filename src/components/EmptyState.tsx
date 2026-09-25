import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useTheme, getColors } from '@/theme';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description: string;
  actionText?: string;
  onActionPress?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = '📂',
  title,
  description,
  actionText,
  onActionPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: colors.mutedForeground }]}>{description}</Text>
      {actionText && onActionPress && (
        <Pressable style={[styles.button, { backgroundColor: colors.primary }]} onPress={onActionPress}>
          <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{actionText}</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 12,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  icon: {
    fontSize: 28,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    fontWeight: '700',
    fontSize: 13.5,
  },
});
