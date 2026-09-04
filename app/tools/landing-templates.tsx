import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

const LANDING_TEMPLATES = [
  { id: '1', name: 'SaaS Waitlist & Beta Launch', category: 'Software', conversionRate: '18.4%', color: '#003C33' },
  { id: '2', name: 'Direct Sales Lead Capture', category: 'Services', conversionRate: '24.1%', color: '#16B882' },
  { id: '3', name: 'Webinar & Live Event', category: 'Education', conversionRate: '31.0%', color: '#8B5CF6' },
  { id: '4', name: 'Product Early Access', category: 'E-commerce', conversionRate: '15.8%', color: '#F59E0B' },
];

export default function LandingTemplatesScreen() {
  const handleSelect = (name: string) => {
    Alert.alert('Landing Template Loaded', `Initialized canvas with ${name}. Ready for customization.`);
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Landing Page Templates" subtitle="Pre-built High-Converting Layouts" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ready-to-Deploy Landers</Text>
          <Text style={styles.cardSubtitle}>
            Full-width mobile-responsive sales pages and lead capture funnels optimized for ad campaigns.
          </Text>
        </View>

        <View style={styles.list}>
          {LANDING_TEMPLATES.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.badgeStrip, { backgroundColor: item.color }]} />
              <View style={styles.itemBody}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemCategory}>{item.category.toUpperCase()}</Text>
                  <Text style={styles.itemName}>{item.name}</Text>
                </View>

                <View style={styles.itemStats}>
                  <Text style={styles.statText}>Avg Conversion: <Text style={{ color: '#16B882', fontWeight: '800' }}>{item.conversionRate}</Text></Text>
                </View>

                <Pressable
                  style={[styles.useBtn, { backgroundColor: item.color }]}
                  onPress={() => handleSelect(item.name)}
                >
                  <Text style={styles.useBtnText}>Deploy Template →</Text>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
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
    height: 6,
    width: '100%',
  },
  itemBody: {
    padding: 16,
  },
  itemTop: {
    marginBottom: 8,
  },
  itemCategory: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.mutedForeground,
    letterSpacing: 0.5,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginTop: 2,
  },
  itemStats: {
    marginBottom: 14,
  },
  statText: {
    fontSize: 12,
    color: colors.mutedForeground,
  },
  useBtn: {
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  useBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});
