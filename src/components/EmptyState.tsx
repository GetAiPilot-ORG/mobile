import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors } from '../theme/colors';

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
  return (
    <View style={styles.container}>
      <View style={styles.iconBox}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionText && onActionPress && (
        <Pressable style={styles.button} onPress={onActionPress}>
          <Text style={styles.buttonText}>{actionText}</Text>
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
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: 12,
  },
  iconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.muted,
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
    color: colors.foreground,
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 280,
  },
  button: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: colors.primaryForeground,
    fontWeight: '700',
    fontSize: 13.5,
  },
});
