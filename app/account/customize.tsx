import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen } from '../../src/components/AppScreen';
import { colors } from '../../src/theme/colors';
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

export default function CustomizeAppScreen() {
  const router = useRouter();
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
        const savedCompact = await AsyncStorage.getItem('@gap_compact_view');
        if (savedCompact !== null) setCompactView(savedCompact === 'true');
      } catch (err) {
        console.error('Error loading customization preferences:', err);
      }
    }
    loadPreferences();
  }, []);

  const handleToggleShortcut = async (id: string) => {
    const updated = shortcuts.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s));
    setShortcuts(updated);
    try {
      await AsyncStorage.setItem(PREF_STORAGE_KEY, JSON.stringify(updated));
    } catch (err) {
      console.error('Error saving shortcut toggle:', err);
    }
  };

  const handleToggleCompact = async (val: boolean) => {
    setCompactView(val);
    try {
      await AsyncStorage.setItem('@gap_compact_view', String(val));
    } catch (err) {
      console.error('Error saving compact view pref:', err);
    }
  };

  const handleReset = async () => {
    Alert.alert(
      'Reset Customizations',
      'Restore all dashboard shortcuts and display settings to default?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            setShortcuts(DEFAULT_SHORTCUTS);
            setCompactView(false);
            try {
              await AsyncStorage.removeItem(PREF_STORAGE_KEY);
              await AsyncStorage.removeItem('@gap_compact_view');
              Alert.alert('Restored', 'Default shortcut preferences restored.');
            } catch (err) {
              console.error('Error resetting preferences:', err);
            }
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
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Back</Text>
          </Pressable>
          <View style={styles.titleRow}>
            <View>
              <Text style={styles.title}>Customize App</Text>
              <Text style={styles.subtitle}>
                Personalize dashboard shortcuts, active modules, and layout preferences.
              </Text>
            </View>
          </View>
        </View>

        {/* Display Settings Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Layout & Display</Text>
          <View style={styles.row}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Compact Dashboard Mode</Text>
              <Text style={styles.rowSubtitle}>Use condensed product cards to view more items on screen</Text>
            </View>
            <Switch
              value={compactView}
              onValueChange={handleToggleCompact}
              trackColor={{ false: '#333', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
          <View style={[styles.row, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={styles.rowTitle}>Haptic Touch Feedback</Text>
              <Text style={styles.rowSubtitle}>Vibrate device on quick tool launches and bot interactions</Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: '#333', true: colors.primary }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Automation Hub Shortcuts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Automation Products Visibility</Text>
          <Text style={styles.sectionSubtitle}>
            Toggled items appear on your Home Dashboard quick launcher.
          </Text>

          <View style={styles.card}>
            {automationItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  idx === automationItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSubtitle}>{item.desc}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleShortcut(item.id)}
                  trackColor={{ false: '#333', true: colors.primary }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Free Tools Visibility */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Free Tools Hub Visibility</Text>
          <Text style={styles.sectionSubtitle}>
            Control which tools are prioritized in your Tools shortcuts.
          </Text>

          <View style={styles.card}>
            {toolItems.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.row,
                  idx === toolItems.length - 1 && { borderBottomWidth: 0 },
                ]}
              >
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={styles.rowTitle}>{item.name}</Text>
                  <Text style={styles.rowSubtitle}>{item.desc}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleShortcut(item.id)}
                  trackColor={{ false: '#333', true: colors.primary }}
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
    backgroundColor: colors.secondary,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backButtonText: {
    color: colors.foreground,
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
    color: colors.foreground,
  },
  subtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    lineHeight: 18,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.foreground,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.foreground,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.foreground,
  },
  rowSubtitle: {
    fontSize: 12,
    color: colors.mutedForeground,
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
    color: colors.destructive,
    fontWeight: 'bold',
    fontSize: 14,
  },
});
