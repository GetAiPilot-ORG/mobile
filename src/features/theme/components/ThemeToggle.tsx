import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';

interface ThemeToggleProps {
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ showLabel = false, size = 'md' }) => {
  const { isDark, toggleTheme, themeMode } = useTheme();

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // ignore
      }
    }
    await toggleTheme();
  };

  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 24 : 20;

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.button,
        isDark ? styles.buttonDark : styles.buttonLight,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Toggle theme mode. Current mode is ${themeMode}`}
    >
      <Ionicons
        name={isDark ? 'moon' : 'sunny'}
        size={iconSize}
        color={isDark ? '#F59E0B' : '#EAB308'}
      />
      {showLabel && (
        <Text style={[styles.label, { color: isDark ? '#F7F3EA' : '#41444B' }]}>
          {isDark ? 'Dark Mode' : 'Light Mode'}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  buttonLight: {
    backgroundColor: '#F4F0E8',
    borderColor: '#D2CABA',
  },
  buttonDark: {
    backgroundColor: '#52575D',
    borderColor: '#686D72',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
  },
});
