import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { openAuthenticatedTemplate } from '../../src/lib/template-deep-link';
import { colors } from '../../src/theme/colors';

interface LandingTemplate {
  id: string;
  name: string;
  category: 'Business' | 'Crypto' | 'Real Estate' | 'Fitness' | 'E-Commerce' | 'Travel';
  conversionRate: string;
  color: string;
  desc: string;
  tags: string[];
}

const CATEGORIES = ['All', 'Business', 'Crypto', 'Real Estate', 'Fitness', 'E-Commerce', 'Travel'] as const;

const LANDING_TEMPLATES_CATALOG: LandingTemplate[] = [
  {
    id: 'axnix-saas',
    name: 'Axnix SaaS & AI Suite',
    category: 'Business',
    conversionRate: '26.4%',
    color: '#003C33',
    desc: 'High-converting dark modern SaaS hero with live metric counters & pricing toggle.',
    tags: ['AI Engine', 'Waitlist', 'SaaS'],
  },
  {
    id: 'threadly-fashion',
    name: 'Threadly Apparel & Brand',
    category: 'E-Commerce',
    conversionRate: '22.8%',
    color: '#EC4899',
    desc: 'Minimalist boutique clothing showcase with lookbook carousel and instant WhatsApp checkout.',
    tags: ['E-Commerce', 'Lookbook', 'Store'],
  },
  {
    id: 'bull-run-crypto',
    name: 'Bull Run Crypto & Options',
    category: 'Crypto',
    conversionRate: '31.2%',
    color: '#0284C7',
    desc: 'Telegram VIP channel lead capture funnel for crypto trading signals and market alpha.',
    tags: ['Trading', 'Telegram', 'VIP Signals'],
  },
  {
    id: 'dark-luxury-estates',
    name: 'Aura Luxury Real Estate',
    category: 'Real Estate',
    conversionRate: '19.5%',
    color: '#D97706',
    desc: 'Premium gold & onyx architectural portfolio with property walkthrough request forms.',
    tags: ['Villas', 'Brochures', 'Luxury'],
  },
  {
    id: 'pulse-forge-gym',
    name: 'Pulse Forge Fitness & Gym',
    category: 'Fitness',
    conversionRate: '28.0%',
    color: '#DC2626',
    desc: 'High-energy transformation showcase with membership tier selection and free trial booking.',
    tags: ['Gym', 'Free Pass', 'Coaching'],
  },
  {
    id: 'omni-resort-travel',
    name: 'Omni Luxury Resort & Escape',
    category: 'Travel',
    conversionRate: '24.7%',
    color: '#10B981',
    desc: 'Scenic getaway booking lander with seasonal discounts, photo galleries and reviews.',
    tags: ['Resort', 'Booking', 'Vacation'],
  },
];

export default function LandingTemplatesScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [openingTemplateId, setOpeningTemplateId] = useState<string | null>(null);

  const filtered = LANDING_TEMPLATES_CATALOG.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.desc.toLowerCase().includes(search.toLowerCase()) ||
      item.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()));
    return matchesCat && matchesSearch;
  });

  const handleOpenCanvas = async (item: LandingTemplate) => {
    try {
      setOpeningTemplateId(item.id);
      await openAuthenticatedTemplate('landing-builder', item.id);
    } catch (error) {
      console.error('Failed to open authenticated landing template:', error);
      Alert.alert('Unable to open canvas', 'Please check your connection and try again.');
    } finally {
      setOpeningTemplateId(null);
    }
  };

  const handleDeploy = (item: LandingTemplate) => {
    Alert.alert(
      'Deploy Landing Page',
      `Deploying ${item.name}. Would you like to launch the visual editor or copy the share link?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Share Link 🔗',
          onPress: () => {
            Share.share({
              message: `Check out our landing page template: https://getaipilot.in/lp/${item.id}`,
            });
          },
        },
        {
          text: 'Open in Canvas 🚀',
          onPress: () => {
            void handleOpenCanvas(item);
          },
        },
      ]
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Landing Templates" subtitle="100+ Category Layouts" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search */}
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 Search templates (SaaS, Crypto, Gym, Real Estate)..."
          placeholderTextColor={colors.mutedForeground}
          value={search}
          onChangeText={setSearch}
        />

        {/* Category horizontal scroll */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.catChip, selectedCategory === cat && styles.catChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.catText, selectedCategory === cat && styles.catTextActive]}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.resultsCount}>
          Showing {filtered.length} high-converting template{filtered.length !== 1 ? 's' : ''}
        </Text>

        <View style={styles.list}>
          {filtered.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.badgeStrip, { backgroundColor: item.color }]} />
              <View style={styles.itemBody}>
                <View style={styles.itemHeaderRow}>
                  <Text style={styles.itemCategory}>{item.category.toUpperCase()}</Text>
                  <View style={styles.convPill}>
                    <Text style={styles.convText}>Avg CVR: {item.conversionRate}</Text>
                  </View>
                </View>

                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDesc}>{item.desc}</Text>

                <View style={styles.tagRow}>
                  {item.tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>#{t}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={[styles.useBtn, { backgroundColor: item.color }]}
                  onPress={() => handleDeploy(item)}
                  disabled={openingTemplateId === item.id}
                >
                  {openingTemplateId === item.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.useBtnText}>Deploy Template →</Text>
                  )}
                </Pressable>
              </View>
            </View>
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
  searchInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13.5,
    color: colors.foreground,
    marginBottom: 12,
  },
  catScroll: {
    marginBottom: 12,
  },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  catTextActive: {
    color: '#FFFFFF',
  },
  resultsCount: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginBottom: 12,
    fontWeight: '600',
  },
  list: {
    gap: 14,
  },
  itemCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  badgeStrip: {
    height: 5,
    width: '100%',
  },
  itemBody: {
    padding: 16,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  itemCategory: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.mutedForeground,
    letterSpacing: 0.5,
  },
  convPill: {
    backgroundColor: 'rgba(22, 184, 130, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  convText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#16B882',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
  },
  itemDesc: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    marginTop: 4,
    lineHeight: 17,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginVertical: 12,
  },
  tag: {
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    color: colors.mutedForeground,
    fontWeight: '600',
  },
  useBtn: {
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
  },
  useBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
});
