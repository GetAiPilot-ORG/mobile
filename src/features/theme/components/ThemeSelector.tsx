import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemeModeCard } from './ThemeModeCard';
import { ThemeMode } from '../types';

interface ThemeSelectorProps {
  showTitle?: boolean;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({ showTitle = true }) => {
  const { themeMode, setThemeMode, isDark } = useTheme();

  return (
    <View style={styles.container}>
      {showTitle && (
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Theme & Appearance
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#8E8E93' : '#64748B' }]}>
            Select your preferred color theme across all tools, screens, and modals.
          </Text>
        </View>
      )}

      <View style={styles.cardsRow}>
        <ThemeModeCard
          mode="light"
          title="Light Mode"
          description="Crisp white canvas with soft slate borders"
          iconName="sunny"
          selected={themeMode === 'light'}
          onSelect={setThemeMode}
        />
        <ThemeModeCard
          mode="dark"
          title="Dark Mode"
          description="OLED pitch black with neutral gray cards"
          iconName="moon"
          selected={themeMode === 'dark'}
          onSelect={setThemeMode}
        />
        <ThemeModeCard
          mode="system"
          title="System Sync"
          description="Automatically adapts to device appearance"
          iconName="phone-portrait"
          selected={themeMode === 'system'}
          onSelect={setThemeMode}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12.5,
    lineHeight: 17,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
});
