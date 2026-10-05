import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, getColors } from '@/theme';
import { ThemeSelector } from '../components/ThemeSelector';
import { ProductThemeBadge } from '../components/ProductThemeBadge';
import { getProductThemes } from '../constants/productThemes';

interface ThemeCustomizationScreenProps {
  onBack?: () => void;
}

export const ThemeCustomizationScreen: React.FC<ThemeCustomizationScreenProps> = ({ onBack }) => {
  const { isDark, themeMode } = useTheme();
  const colors = getColors(isDark);
  const productThemes = getProductThemes(isDark);

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { backgroundColor: colors.background },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Bar */}
      {onBack && (
        <Pressable
          style={[
            styles.backButton,
            {
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
            },
          ]}
          onPress={onBack}
        >
          <Ionicons name="arrow-back" size={16} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>
            Back
          </Text>
        </Pressable>
      )}

      {/* Screen Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>
          Theme & UI Appearance
        </Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          GetAiPilot HIG Design Tokens — OLED Pitch Black, Crisp Light & Product Accents
        </Text>
      </View>

      {/* Theme Selector Section */}
      <ThemeSelector showTitle={true} />

      {/* Active Theme Summary Card */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.card,
            borderColor: colors.cardBorder,
          },
        ]}
      >
        <View style={styles.summaryRow}>
          <View style={styles.summaryTextContainer}>
            <Text style={[styles.summaryTitle, { color: colors.text }]}>
              Active Mode: {themeMode.toUpperCase()}
            </Text>
            <Text style={[styles.summaryDesc, { color: colors.textMuted }]}>
              Canvas Color: {colors.background} • Surface: {colors.surface}
            </Text>
          </View>
          <View
            style={[
              styles.colorChip,
              { backgroundColor: colors.primary, borderColor: colors.border },
            ]}
          />
        </View>
      </View>

      {/* Product Suite Accent Palette Showcase */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Product Accent Palette
        </Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          Dedicated theme accents automatically tuned for each AI product module.
        </Text>

        <View style={styles.productBadgesGrid}>
          {Object.keys(productThemes).map((key) => (
            <ProductThemeBadge key={key} productKey={key} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  backText: {
    fontSize: 13,
    fontWeight: '600',
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginVertical: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  summaryDesc: {
    fontSize: 12,
    marginTop: 3,
  },
  colorChip: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 12.5,
    marginBottom: 12,
  },
  productBadgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
});
