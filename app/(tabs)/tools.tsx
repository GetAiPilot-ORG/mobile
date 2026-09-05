import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { ToolCard } from '../../src/components/ToolCard';
import { SearchInput } from '../../src/components/SearchInput';
import { colors } from '../../src/theme/colors';
import { useRouter } from 'expo-router';

interface ToolItem {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: string;
  badge?: string;
  route: string;
}

const ALL_10_FREE_TOOLS: ToolItem[] = [
  {
    id: 'my-designs',
    title: 'My Designs',
    category: 'Templates',
    description: 'Manage and customize your saved bio websites and campaign landing pages.',
    icon: '🎨',
    badge: 'Canvas',
    route: '/tools/my-designs',
  },
  {
    id: 'bio-templates',
    title: 'Bio Templates',
    category: 'Templates',
    description: 'Pick mobile bio site themes optimized for creators, agencies, and businesses.',
    icon: '🔗',
    badge: 'Popular',
    route: '/tools/bio-templates',
  },
  {
    id: 'landing-templates',
    title: 'Landing Templates',
    category: 'Templates',
    description: 'Pre-built high-converting lead capture funnels and product waitlist pages.',
    icon: '🚀',
    badge: 'Ready',
    route: '/tools/landing-templates',
  },
  {
    id: 'quick-forms',
    title: 'QuickForms',
    category: 'Utilities',
    description: 'Embeddable survey forms and customer consultation intake funnels.',
    icon: '📝',
    badge: 'CRM Sync',
    route: '/tools/quick-forms',
  },
  {
    id: 'wa-link',
    title: 'WhatsApp Link',
    category: 'Messaging',
    description: 'Direct click-to-chat links with custom prefilled messages & QR codes.',
    icon: '💬',
    badge: 'Popular',
    route: '/tools/whatsapp-link',
  },
  {
    id: 'shortener',
    title: 'Link Shortener',
    category: 'Utilities',
    description: 'Shorten long URLs into branded links with real-time click tracking.',
    icon: '⚡',
    badge: 'Fast',
    route: '/tools/link-shortener',
  },
  {
    id: 'file-linker',
    title: 'File Linker',
    category: 'Utilities',
    description: 'Generate trackable public direct download links for PDFs and media assets.',
    icon: '📁',
    badge: 'Cloud',
    route: '/tools/file-linker',
  },
  {
    id: 'event-links',
    title: 'Event Links',
    category: 'Utilities',
    description: '1-click calendar invites for Google Calendar, Apple iCal, and webinars.',
    icon: '📅',
    badge: 'Calendar',
    route: '/tools/event-links',
  },
  {
    id: 'speech-to-text',
    title: 'AI Speech to Text',
    category: 'AI Audio',
    description: 'Transcribe customer voice notes, audio meetings, and voice memos to text.',
    icon: '🎙️',
    badge: 'AI Powered',
    route: '/tools/speech-to-text',
  },
  {
    id: 'qr-gen',
    title: 'QR Generator',
    category: 'Utilities',
    description: 'High-resolution custom QR codes for websites, text, and Wi-Fi credentials.',
    icon: '📱',
    badge: 'Free',
    route: '/tools/qr-code',
  },
  {
    id: 'website-audit',
    title: 'Website Health Audit',
    category: 'AI Audio',
    description: 'Instantly audit SEO, performance, UX, and conversion with an AI health score.',
    icon: '🔍',
    badge: 'AI Score',
    route: '/tools/website-audit',
  },
];

const CATEGORIES = ['All', 'Templates', 'Messaging', 'Utilities', 'AI Audio'];

export default function FreeToolsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredTools = ALL_10_FREE_TOOLS.filter((tool) => {
    const matchesSearch =
      tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' || tool.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Free Tools Hub" subtitle="Complete Utility Inventory (10 Tools)" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Production Utilities</Text>
          <Text style={styles.heroSub}>
            Zero-cost growth tools powered by GetAIPilot infrastructure. No credit card required.
          </Text>
        </View>

        {/* Search Bar */}
        <SearchInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search all 10 tools..."
        />

        {/* Category Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.categoryChip, selectedCategory === cat && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text
                style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}
              >
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Tools Grid */}
        <View style={styles.toolsList}>
          {filteredTools.map((tool) => (
            <ToolCard
              key={tool.id}
              title={tool.title}
              category={tool.category}
              description={tool.description}
              icon={tool.icon}
              badge={tool.badge}
              onPress={() => router.push(tool.route as any)}
            />
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
    lineHeight: 18,
  },
  categoryScroll: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  categoryTextActive: {
    color: colors.primaryForeground,
  },
  toolsList: {
    marginTop: 4,
  },
});
