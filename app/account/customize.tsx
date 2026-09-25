import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { AppScreen } from '../../src/components/AppScreen';
import { useTheme, ThemeMode } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { radius } from '../../src/theme/radius';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ShortcutConfig {
  id: string;
  name: string;
  category: 'automation' | 'tools' | 'account';
  enabled: boolean;
  desc: string;
}

const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  // Products
  { id: 'whatsapp', name: 'GAP WhatsApp Hub', category: 'automation', enabled: true, desc: 'Meta Cloud API & Auto-reply triggers' },
  { id: 'telegram', name: 'GAP Telegram Auto-Forwarder', category: 'automation', enabled: true, desc: 'Sanitization filters & live routing' },
  { id: 'voice', name: 'GAP Voice Pilot', category: 'automation', enabled: true, desc: 'Autonomous AI phone agents' },
  { id: 'crm', name: 'GAP Smart CRM', category: 'automation', enabled: true, desc: 'Visual sales pipelines & lead scoring' },
  { id: 'social', name: 'GAP Social Hub', category: 'automation', enabled: true, desc: '6-network publisher & scheduler' },
  // Tools
  { id: 'my-designs', name: 'My Designs', category: 'tools', enabled: true, desc: 'Personal landing pages and canvas assets' },
  { id: 'bio-templates', name: 'Bio Templates', category: 'tools', enabled: true, desc: 'Mobile bio link presets' },
  { id: 'landing-templates', name: 'Landing Templates', category: 'tools', enabled: true, desc: 'High-converting sales landers' },
  { id: 'quick-forms', name: 'QuickForms', category: 'tools', enabled: true, desc: 'Lead capture & custom forms' },
  { id: 'whatsapp-link', name: 'WhatsApp Link Generator', category: 'tools', enabled: true, desc: 'Custom prefilled wa.me links' },
  { id: 'link-shortener', name: 'Link Shortener', category: 'tools', enabled: true, desc: 'Branded short URLs & tracking' },
  { id: 'file-linker', name: 'File Linker', category: 'tools', enabled: true, desc: 'Direct downloadable asset links' },
  { id: 'event-links', name: 'Event Links', category: 'tools', enabled: true, desc: 'Calendar & webinar invite pages' },
  { id: 'speech-to-text', name: 'AI Speech to Text', category: 'tools', enabled: true, desc: 'Audio recording & smart AI transcription' },
  { id: 'qr-code', name: 'QR Generator', category: 'tools', enabled: true, desc: 'Custom QR codes with colors & logos' },
];

const PREF_STORAGE_KEY = '@gap_app_customize_shortcuts';

const THEME_OPTIONS: { id: ThemeMode; label: string; icon: string; desc: string }[] = [
  { id: 'light', label: 'Light', icon: 'sunny', desc: 'Crisp white canvas' },
  { id: 'dark', label: 'Dark', icon: 'moon', desc: 'OLED pitch black' },
  { id: 'system', label: 'System', icon: 'phone-portrait', desc: 'Follows OS appearance' },
];

export default function CustomizeAppScreen() {
  const router = useRouter();
  const { themeMode, setThemeMode, isDark, colors } = useTheme();

  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(DEFAULT_SHORTCUTS);
  const [compactView, setCompactView] = useState(false);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  useEffect(() => {
    async function loadPreferences() {
      try {
        const saved = await AsyncStorage.getItem(PREF_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          setShortcuts(parsed);
        }
      } catch {
        // ignore
      }
    }
    loadPreferences();
  }, []);

  const handleToggleShortcut = async (id: string) => {
    const updated = shortcuts.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setShortcuts(updated);
    try {
      await AsyncStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleToggleCompact = (value: boolean) => {
    setCompactView(value);
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Shortcuts',
      'Reset all dashboard shortcut preferences to defaults?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setShortcuts(DEFAULT_SHORTCUTS);
            await AsyncStorage.removeItem(PREF_STORAGE_KEY);
          },
        },
      ]
    );
  };

  const automationItems = shortcuts.filter((s) => s.category === 'automation');
  const toolItems = shortcuts.filter((s) => s.category === 'tools');

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={[
              styles.backButton,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#F2F4F7',
                borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
              },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.backButtonText, { color: isDark ? '#FFFFFF' : '#000000' }]}>
              ← Back
            </Text>
          </Pressable>
          <View style={styles.titleRow}>
            <View>
              <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Customize App
              </Text>
              <Text style={[styles.subtitle, { color: isDark ? '#8E8E93' : '#64748B' }]}>
                Personalize theme appearance, dashboard shortcuts, and layout preferences.
              </Text>
            </View>
          </View>
        </View>

        {/* 1. Theme & Appearance Mode Switcher */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Appearance & Theme
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#8E8E93' : '#64748B' }]}>
            Choose your preferred color theme across all workspaces, dialogs, and tools.
          </Text>

          <View style={styles.themeCardsRow}>
            {THEME_OPTIONS.map((opt) => {
              const isSelected = themeMode === opt.id;
              return (
                <Pressable
                  key={opt.id}
                  style={[
                    styles.themeCard,
                    isDark ? styles.themeCardDark : styles.themeCardLight,
                    isSelected && styles.themeCardSelected,
                    isSelected && { borderColor: colors.primary },
                  ]}
                  onPress={async () => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    await setThemeMode(opt.id);
                  }}
                >
                  <View
                    style={[
                      styles.themeIconBox,
                      {
                        backgroundColor: isSelected
                          ? colors.primaryMuted
                          : isDark
                          ? '#2C2C2E'
                          : '#F2F4F7',
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon as any}
                      size={20}
                      color={isSelected ? colors.primary : isDark ? '#FFFFFF' : '#475569'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.themeCardTitle,
                      { color: isSelected ? colors.primary : isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={[
                      styles.themeCardDesc,
                      { color: isDark ? '#8E8E93' : '#64748B' },
                    ]}
                    numberOfLines={1}
                  >
                    {opt.desc}
                  </Text>
                  {isSelected && (
                    <View style={[styles.themeCheckmark, { backgroundColor: colors.primary }]}>
                      <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Display Settings Card */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
              borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
            },
          ]}
        >
          <Text style={[styles.cardTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Layout & Display
          </Text>
          <View
            style={[
              styles.row,
              { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' },
            ]}
          >
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Compact Dashboard Mode
              </Text>
              <Text style={[styles.rowSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                Use condensed product cards to view more items on screen
              </Text>
            </View>
            <Switch
              value={compactView}
              onValueChange={handleToggleCompact}
              trackColor={{ false: isDark ? '#333' : '#CBD5E1', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Haptic Touch Feedback
              </Text>
              <Text style={[styles.rowSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                Vibrate device on quick tool launches and bot interactions
              </Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: isDark ? '#333' : '#CBD5E1', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Automation Hub Shortcuts */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Automation Products Visibility
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            Toggled items appear on your Home Dashboard quick launcher.
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
              },
            ]}
          >
            {automationItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' },
                  idx === automationItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    {item.desc}
                  </Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleShortcut(item.id)}
                  trackColor={{ false: isDark ? '#333' : '#CBD5E1', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Free Tools Visibility */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            Free Tools Hub Visibility
          </Text>
          <Text style={[styles.sectionSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            Control which tools are prioritized in your Tools shortcuts.
          </Text>

          <View
            style={[
              styles.card,
              {
                backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
                borderColor: isDark ? '#2C2C2E' : '#E5E7EB',
              },
            ]}
          >
            {toolItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  { borderBottomColor: isDark ? '#2C2C2E' : '#E5E7EB' },
                  idx === toolItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.rowTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.rowSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                    {item.desc}
                  </Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleShortcut(item.id)}
                  trackColor={{ false: isDark ? '#333' : '#CBD5E1', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Reset Defaults */}
        <Pressable style={styles.resetButton} onPress={handleReset}>
          <Text style={styles.resetButtonText}>Restore Default Preferences</Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    marginBottom: spacing.xl,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  rowSubtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  resetButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resetButtonText: {
    color: '#DC2626',
    fontWeight: 'bold',
    fontSize: 14,
  },
  // Theme Switcher Cards
  themeCardsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  themeCard: {
    flex: 1,
    borderRadius: radius.xl,
    padding: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    position: 'relative',
    minHeight: 120,
    justifyContent: 'center',
  },
  themeCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  themeCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  themeCardSelected: {
    borderWidth: 2,
  },
  themeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  themeCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 3,
  },
  themeCardDesc: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 13,
  },
  themeCheckmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
