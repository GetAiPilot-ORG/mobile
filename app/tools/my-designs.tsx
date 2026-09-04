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
import { useAuth } from '../../src/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../src/lib/supabase';

export default function MyDesignsScreen() {
  const { user } = useAuth();

  const { data: landingPages, isLoading } = useQuery({
    queryKey: ['my-designs-pages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('landing_pages')
        .select('*')
        .eq('user_id', user.id);
      if (error || !data) return [];
      return data;
    },
    enabled: !!user?.id,
  });

  const demoDesigns = [
    { id: '1', title: 'Creator Bio Portfolio', theme: 'Minimalist Dark', views: '1,240', status: 'Published' },
    { id: '2', title: 'Agency Lead Magnet', theme: 'Emerald Pro', views: '480', status: 'Draft' },
  ];

  const designs = (landingPages && landingPages.length > 0) ? landingPages : demoDesigns;

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="My Designs" subtitle="Custom Bio & Landing Pages" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Your Canvas Library</Text>
          <Text style={styles.heroSub}>
            Manage, publish, and track analytics for your custom bio sites and campaign landing pages.
          </Text>
          <Pressable
            style={styles.newDesignBtn}
            onPress={() => Alert.alert('New Page', 'Select a Bio or Landing Template to initialize a new canvas.')}
          >
            <Text style={styles.newDesignBtnText}>+ Create New Design</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Active Projects ({designs.length})</Text>

        <View style={styles.grid}>
          {designs.map((d: any) => (
            <View key={d.id} style={styles.designCard}>
              <View style={styles.previewBox}>
                <Text style={styles.previewIcon}>🎨</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>{d.title || 'Untitled Design'}</Text>
                <Text style={styles.cardMeta}>{d.theme || 'Default Theme'} • {d.status || 'Active'}</Text>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.actionBtnEdit}
                  onPress={() => Alert.alert('Editor', `Opening canvas editor for ${d.title}`)}
                >
                  <Text style={styles.actionBtnText}>Edit</Text>
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
  heroCard: {
    backgroundColor: colors.primary,
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
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
    marginBottom: 14,
  },
  newDesignBtn: {
    backgroundColor: '#16B882',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  newDesignBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 12,
  },
  grid: {
    gap: 12,
  },
  designCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  previewIcon: {
    fontSize: 22,
  },
  cardInfo: {
    flex: 1,
    marginRight: 8,
  },
  cardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.foreground,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionBtnEdit: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
