import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { CanvasTemplateId, CANVAS_TEMPLATES, CanvasTemplateMeta, CanvasConfig, QRStyles } from './types';
import { NativeCanvasTemplate } from './NativeCanvasTemplate';
import { TEMPLATE_RASTER_IMAGES, TEMPLATE_SVG_STRINGS } from './templateAssets';
import { useTheme, getColors } from '@/theme';
import * as Haptics from 'expo-haptics';

interface CanvasGalleryProps {
  selectedCanvas: CanvasTemplateId;
  onSelectCanvas: (id: CanvasTemplateId) => void;
  onNextStep: () => void;
  config: CanvasConfig;
  styles: QRStyles;
  qrContent: string;
}

const CATEGORIES = [
  'All',
  'Retail, Storefronts & Offers',
  'Restaurants, Cafes & Bars',
  'Wellness, Spas & Beauty',
  'Fine Dining & Wineries',
  'Specialty Cafes & Bakeries',
  'Tech Startups & Web3',
  'Influencers & Musicians',
  'Fashion & Retail',
  'Influencers & Creators',
  'Salons, Cafes & Studios',
  'Creative & Art',
  'Florists, Spas & Salons',
  'Organic & Wellness',
  'Character & Gaming',
  'Real Estate & Architecture',
  'Nightlife & Dining',
  'Hospitality & Retail',
  'Creative & Posters',
  'Cafes & Bakeries',
  'General Purpose',
];

export const CanvasGallery: React.FC<CanvasGalleryProps> = ({
  selectedCanvas,
  onSelectCanvas,
  onNextStep,
  config,
  styles: qrStyles,
  qrContent,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTemplates = useMemo(() => {
    return CANVAS_TEMPLATES.filter((t) => {
      const matchesCategory =
        activeCategory === 'All' || t.category === activeCategory;
      const matchesSearch =
        searchQuery.trim() === '' ||
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.tagline.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  const handleSelect = (id: CanvasTemplateId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectCanvas(id);
  };

  return (
    <View style={styles.container}>
      {/* Step Header */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Step 1: Select Canvas Design
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Choose the physical standee or tabletop format for your business.
          </Text>
        </View>
        <Pressable
          style={[styles.nextButton, { backgroundColor: '#0A4737' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onNextStep();
          }}
        >
          <Text style={styles.nextButtonText}>Next: Edit Content</Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Search Input */}
      <View
        style={[
          styles.searchBox,
          {
            backgroundColor: isDark ? '#1C1B24' : '#F4F5F7',
            borderColor: colors.border,
          },
        ]}
      >
        <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search canvas styles (e.g. menu, acrylic, cafe, pay)..."
          placeholderTextColor={colors.mutedForeground}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Category Filter Pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScroll}
      >
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <Pressable
              key={cat}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveCategory(cat);
              }}
              style={[
                styles.categoryChip,
                {
                  backgroundColor: isActive
                    ? '#0A4737'
                    : isDark
                    ? '#1E1D27'
                    : '#FFFFFF',
                  borderColor: isActive
                    ? '#0A4737'
                    : isDark
                    ? '#2D2B3B'
                    : '#E5E7EB',
                },
              ]}
            >
              <Text
                style={[
                  styles.categoryText,
                  {
                    color: isActive
                      ? '#FFFFFF'
                      : isDark
                      ? '#E2E8F0'
                      : '#475569',
                    fontWeight: isActive ? '700' : '500',
                  },
                ]}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Template Cards Grid */}
      <View style={styles.grid}>
        {filteredTemplates.map((item) => {
          const isSelected = selectedCanvas === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => handleSelect(item.id)}
              style={[
                styles.card,
                {
                  backgroundColor: isDark ? '#181722' : '#FFFFFF',
                  borderColor: isSelected
                    ? '#0A4737'
                    : isDark
                    ? '#262435'
                    : '#E2E8F0',
                  borderWidth: isSelected ? 2 : 1,
                  shadowColor: isSelected ? '#0A4737' : '#000000',
                  shadowOpacity: isSelected ? 0.18 : 0.05,
                },
              ]}
            >
              {/* Card Badges Row */}
              <View style={styles.badgeRow}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: isDark ? '#262435' : '#F1F5F9' },
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryBadgeText,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    {item.category}
                  </Text>
                </View>
                <View
                  style={[
                    styles.featureBadge,
                    {
                      backgroundColor: isSelected
                        ? '#0A4737'
                        : isDark
                        ? '#143126'
                        : '#ECFDF5',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.featureBadgeText,
                      {
                        color: isSelected
                          ? '#FFFFFF'
                          : isDark
                          ? '#6EE7B7'
                          : '#065F46',
                      },
                    ]}
                  >
                    {item.badge}
                  </Text>
                </View>
              </View>

              {/* Visual Live Template Mockup Box */}
              <View
                style={[
                  styles.mockupContainer,
                  {
                    backgroundColor: isDark ? '#111018' : '#F8FAFC',
                    borderColor: isSelected
                      ? isDark
                        ? '#1E3A2F'
                        : '#A7F3D0'
                      : isDark
                      ? '#242232'
                      : '#E2E8F0',
                  },
                ]}
              >
                {TEMPLATE_SVG_STRINGS[item.id] ? (
                  <View style={{ width: '100%', height: '100%', padding: 6, alignItems: 'center', justifyContent: 'center' }}>
                    <SvgXml
                      xml={TEMPLATE_SVG_STRINGS[item.id]}
                      width="100%"
                      height="100%"
                    />
                  </View>
                ) : TEMPLATE_RASTER_IMAGES[item.id] ? (
                  <Image
                    source={TEMPLATE_RASTER_IMAGES[item.id]}
                    style={styles.templateImage}
                    resizeMode="contain"
                  />
                ) : (
                  <NativeCanvasTemplate
                    canvasId={item.id}
                    config={config}
                    styles={qrStyles}
                    qrContent={qrContent}
                    scale={0.52}
                  />
                )}
              </View>

              {/* Title & Tagline */}
              <View style={{ marginTop: 10 }}>
                <Text
                  style={[
                    styles.cardTitle,
                    {
                      color: isSelected
                        ? '#0A4737'
                        : isDark
                        ? '#F8FAFC'
                        : '#0F172A',
                    },
                  ]}
                >
                  {item.name}
                </Text>
                <Text
                  style={[
                    styles.cardTagline,
                    { color: isDark ? '#34D399' : '#0A4737' },
                  ]}
                >
                  {item.tagline}
                </Text>
                <Text
                  style={[
                    styles.cardDesc,
                    { color: colors.mutedForeground },
                  ]}
                  numberOfLines={3}
                >
                  {item.description}
                </Text>
              </View>

              {/* Footer Selection Status */}
              <View
                style={[
                  styles.cardFooter,
                  { borderTopColor: isDark ? '#262435' : '#F1F5F9' },
                ]}
              >
                <View style={styles.statusRow}>
                  <Ionicons
                    name={
                      isSelected
                        ? 'checkmark-circle'
                        : 'radio-button-off-outline'
                    }
                    size={18}
                    color={isSelected ? '#0A4737' : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.statusText,
                      {
                        color: isSelected
                          ? '#0A4737'
                          : colors.mutedForeground,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {isSelected ? 'Active Canvas' : 'Select this Canvas'}
                  </Text>
                </View>
                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={isSelected ? '#0A4737' : colors.mutedForeground}
                />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
  },
  categoryScroll: {
    paddingBottom: 12,
    gap: 6,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  categoryText: {
    fontSize: 11,
  },
  grid: {
    gap: 12,
  },
  card: {
    padding: 16,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  featureBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  featureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  mockupContainer: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  templateImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardTagline: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  cardDesc: {
    fontSize: 11.5,
    marginTop: 6,
    lineHeight: 16,
  },
  cardFooter: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 12,
  },
});
