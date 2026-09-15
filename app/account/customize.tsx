import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { AppScreen } from '../../src/components/AppScreen';
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
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="mb-6">
          <Pressable
            className="self-start py-1.5 px-3 rounded-lg border border-[#262930] bg-[#181A1F] mb-3"
            onPress={() => router.back()}
          >
            <Text className="text-xs font-bold text-white">← Back</Text>
          </Pressable>
          <View>
            <Text className="text-2xl font-black text-white">Customize App</Text>
            <Text className="text-xs text-slate-400 mt-1 leading-4">
              Personalize dashboard shortcuts, active modules, and layout preferences.
            </Text>
          </View>
        </View>

        {/* Display Settings Card */}
        <View className="rounded-2xl px-4 py-2 border border-[#262930] bg-[#181A1F] mb-6">
          <Text className="text-sm font-black text-white pt-2 pb-1">Layout & Display</Text>
          <View className="flex-row items-center justify-between py-3 border-b border-[#262930]">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-bold text-white">Compact Dashboard Mode</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">
                Use condensed product cards to view more items on screen
              </Text>
            </View>
            <Switch
              value={compactView}
              onValueChange={handleToggleCompact}
              trackColor={{ false: '#262930', true: '#0084FF' }}
              thumbColor="#fff"
            />
          </View>
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-bold text-white">Haptic Touch Feedback</Text>
              <Text className="text-[11px] text-slate-400 mt-0.5">
                Vibrate device on quick tool launches and bot interactions
              </Text>
            </View>
            <Switch
              value={hapticFeedback}
              onValueChange={setHapticFeedback}
              trackColor={{ false: '#262930', true: '#0084FF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Automation Hub Shortcuts */}
        <View className="mb-6">
          <Text className="text-sm font-black text-white mb-0.5">Automation Products Visibility</Text>
          <Text className="text-xs text-slate-400 mb-3">
            Toggled items appear on your Home Dashboard quick launcher.
          </Text>

          <View className="rounded-2xl px-4 py-1 border border-[#262930] bg-[#181A1F]">
            {automationItems.map((item, idx) => (
              <View
                key={item.id}
                className={`flex-row items-center justify-between py-3 ${
                  idx === automationItems.length - 1 ? '' : 'border-b border-[#262930]'
                }`}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-bold text-white">{item.name}</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">{item.desc}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleShortcut(item.id)}
                  trackColor={{ false: '#262930', true: '#0084FF' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Free Tools Visibility */}
        <View className="mb-6">
          <Text className="text-sm font-black text-white mb-0.5">Free Tools Hub Visibility</Text>
          <Text className="text-xs text-slate-400 mb-3">
            Control which tools are prioritized in your Tools shortcuts.
          </Text>

          <View className="rounded-2xl px-4 py-1 border border-[#262930] bg-[#181A1F]">
            {toolItems.map((item, idx) => (
              <View
                key={item.id}
                className={`flex-row items-center justify-between py-3 ${
                  idx === toolItems.length - 1 ? '' : 'border-b border-[#262930]'
                }`}
              >
                <View className="flex-1 pr-3">
                  <Text className="text-xs font-bold text-white">{item.name}</Text>
                  <Text className="text-[11px] text-slate-400 mt-0.5">{item.desc}</Text>
                </View>
                <Switch
                  value={item.enabled}
                  onValueChange={() => handleToggleShortcut(item.id)}
                  trackColor={{ false: '#262930', true: '#0084FF' }}
                  thumbColor="#fff"
                />
              </View>
            ))}
          </View>
        </View>

        {/* Reset Defaults */}
        <Pressable
          className="rounded-xl py-3.5 items-center border border-red-500/30 bg-red-500/10"
          onPress={handleReset}
        >
          <Text className="text-xs font-bold text-red-400">Restore Default Preferences</Text>
        </Pressable>
      </ScrollView>
    </AppScreen>
  );
}
