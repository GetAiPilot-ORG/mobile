import React from 'react';
import { Pressable, StyleSheet, Text, View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { ThemeMode } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ThemeModeCardProps {
  mode: ThemeMode;
  title: string;
  description: string;
  iconName: keyof typeof Ionicons.glyphMap;
  selected: boolean;
  onSelect: (mode: ThemeMode) => void;
}

export const ThemeModeCard: React.FC<ThemeModeCardProps> = ({
  mode,
  title,
  description,
  iconName,
  selected,
  onSelect,
}) => {
  const { isDark, colors } = useTheme();

  const handlePress = async () => {
    if (Platform.OS !== 'web') {
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // ignore
      }
    }
    onSelect(mode);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        selected && styles.cardSelected,
        selected && { borderColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: selected
                ? colors.primaryMuted
                : isDark
                ? '#2C2C2E'
                : '#F2F4F7',
            },
          ]}
        >
          <Ionicons
            name={iconName}
            size={22}
            color={selected ? colors.primary : isDark ? '#FFFFFF' : '#475569'}
          />
        </View>

        {selected && (
          <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark" size={12} color="#FFFFFF" />
          </View>
        )}
      </View>

      <Text
        style={[
          styles.title,
          { color: selected ? colors.primary : isDark ? '#FFFFFF' : '#0F172A' },
        ]}
      >
        {title}
      </Text>

      <Text
        style={[
          styles.description,
          { color: isDark ? '#8E8E93' : '#64748B' },
        ]}
        numberOfLines={2}
      >
        {description}
      </Text>

      {/* Mini UI Canvas Preview Box */}
      <View
        style={[
          styles.previewCanvas,
          mode === 'light'
            ? styles.lightPreview
            : mode === 'dark'
            ? styles.darkPreview
            : isDark
            ? styles.darkPreview
            : styles.lightPreview,
        ]}
      >
        <View
          style={[
            styles.previewBar,
            {
              backgroundColor:
                mode === 'light'
                  ? '#0084FF'
                  : mode === 'dark'
                  ? '#0084FF'
                  : colors.primary,
            },
          ]}
        />
        <View
          style={[
            styles.previewLine,
            { backgroundColor: mode === 'dark' ? '#333336' : '#E2E8F0' },
          ]}
        />
        <View
          style={[
            styles.previewLineShort,
            { backgroundColor: mode === 'dark' ? '#242427' : '#CBD5E1' },
          ]}
        />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
    minHeight: 140,
    justifyContent: 'space-between',
    position: 'relative',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardSelected: {
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 10,
  },
  previewCanvas: {
    height: 34,
    borderRadius: 8,
    padding: 6,
    justifyContent: 'space-around',
    borderWidth: 1,
  },
  lightPreview: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E2E8F0',
  },
  darkPreview: {
    backgroundColor: '#000000',
    borderColor: '#2C2C2E',
  },
  previewBar: {
    height: 4,
    width: '40%',
    borderRadius: 2,
  },
  previewLine: {
    height: 3,
    width: '85%',
    borderRadius: 1.5,
  },
  previewLineShort: {
    height: 3,
    width: '60%',
    borderRadius: 1.5,
  },
});
