import React, { useState } from 'react';
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

const BIO_TEMPLATES = [
  { id: '1', title: 'Creator & Influencer', style: 'Dark Glassmorphic', tags: ['Instagram', 'YouTube'], color: '#E1306C' },
  { id: '2', title: 'Agency Portfolio', style: 'Forest Clean', tags: ['Services', 'Booking'], color: '#003C33' },
  { id: '3', title: 'Developer & Tech', style: 'Minimalist Terminal', tags: ['GitHub', 'Portfolio'], color: '#229ED9' },
  { id: '4', title: 'E-commerce & Store', style: 'Vibrant Showcase', tags: ['Products', 'Discounts'], color: '#F59E0B' },
];

export default function BioTemplatesScreen() {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const handleUseTemplate = (template: typeof BIO_TEMPLATES[0]) => {
    setSelectedTemplate(template.id);
    Alert.alert(
      'Template Selected',
      `Ready to launch ${template.title}. Canvas initialized with ${template.style} presets.`
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Bio Link Templates" subtitle="High-Converting Profile Themes" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mobile Bio Presets</Text>
          <Text style={styles.cardSubtitle}>
            Select a verified responsive template to launch your single-link profile across Instagram, TikTok, and Twitter.
          </Text>
        </View>

        <View style={styles.templateList}>
          {BIO_TEMPLATES.map((tpl) => (
            <View key={tpl.id} style={styles.templateCard}>
              <View style={[styles.colorBar, { backgroundColor: tpl.color }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.tplTitle}>{tpl.title}</Text>
                  <Text style={styles.tplStyle}>{tpl.style}</Text>
                </View>

                <View style={styles.tagsRow}>
                  {tpl.tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>

                <Pressable
                  style={[styles.useBtn, { backgroundColor: tpl.color }]}
                  onPress={() => handleUseTemplate(tpl)}
                >
                  <Text style={styles.useBtnText}>Use Template →</Text>
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
  templateList: {
    gap: 14,
  },
  templateCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  colorBar: {
    height: 6,
    width: '100%',
  },
  cardBody: {
    padding: 16,
  },
  cardTop: {
    marginBottom: 10,
  },
  tplTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
  },
  tplStyle: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: colors.muted,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
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
