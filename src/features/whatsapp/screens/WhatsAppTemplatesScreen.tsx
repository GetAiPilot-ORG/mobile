import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { WhatsAppTemplatesSkeleton } from '../../../components/skeletonScreen';
import { TemplateCard } from '../components';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';

interface WhatsAppTemplatesScreenProps {
  onBack?: () => void;
}

export const WhatsAppTemplatesScreen: React.FC<WhatsAppTemplatesScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/whatsapp');
    }
  };

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeStatus, setActiveStatus] = useState<string>('ALL');

  const { data: templates, isLoading, refetch, isRefetching } = useWhatsAppTemplates();

  const categoryOptions = [
    { val: 'ALL', label: 'All Templates' },
    { val: 'UTILITY', label: 'Utility' },
    { val: 'MARKETING', label: 'Marketing' },
    { val: 'AUTHENTICATION', label: 'Authentication' },
  ];

  // Calculate Status Counts
  const stats = useMemo(() => {
    const list = templates || [];
    const approved = list.filter((t) => t.status === 'APPROVED').length;
    const pending = list.filter((t) => t.status === 'PENDING').length;
    const rejected = list.filter((t) => t.status === 'REJECTED' || t.status === 'PAUSED').length;
    return { approved, pending, rejected, total: list.length };
  }, [templates]);

  // Filter templates by category, status, and search query
  const filteredTemplates = useMemo(() => {
    let list = templates || [];

    if (activeCategory !== 'ALL') {
      list = list.filter((t) => (t.category || '').toUpperCase() === activeCategory);
    }

    if (activeStatus !== 'ALL') {
      list = list.filter((t) => (t.status || '').toUpperCase() === activeStatus);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((t) => {
        const nameMatch = t.name.toLowerCase().includes(q);
        const bodyComp = t.components?.find((c: any) => c.type === 'BODY');
        const bodyMatch = bodyComp?.text ? bodyComp.text.toLowerCase().includes(q) : false;
        return nameMatch || bodyMatch;
      });
    }

    return list;
  }, [templates, activeCategory, activeStatus, searchQuery]);

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#000000' : '#F8F9FA' }]}>
        {/* Top Header matching Overview Tab */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View style={styles.headerLeftRow}>
            <Pressable
              style={({ pressed }) => [
                styles.backButton,
                isDark ? styles.backButtonDark : styles.backButtonLight,
                pressed && styles.backButtonPressed,
              ]}
              onPress={handleBack}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Back"
            >
              <Ionicons
                name="chevron-back"
                size={20}
                color={isDark ? '#F8FAFC' : '#0F172A'}
              />
            </Pressable>

            <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>
              Message Templates
            </Text>
          </View>
        </View>

        {/* Filter & Search Controls Card */}
        <View style={[styles.filterCard, isDark ? styles.filterCardDark : styles.filterCardLight]}>
          {/* Search Bar */}
          <View style={[styles.searchBar, isDark ? styles.searchBarDark : styles.searchBarLight]}>
            <Ionicons
              name="search-outline"
              size={18}
              color={isDark ? '#64748B' : '#94A3B8'}
              style={styles.searchIcon}
            />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#F8FAFC' : '#0F172A' }]}
              placeholder="Search template name or message..."
              placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color={isDark ? '#64748B' : '#94A3B8'} />
              </Pressable>
            )}
          </View>

          {/* Category Tabs */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {categoryOptions.map((cat) => {
              const isSelected = activeCategory === cat.val;
              return (
                <Pressable
                  key={cat.val}
                  style={[
                    styles.categoryTab,
                    isDark ? styles.categoryTabDark : styles.categoryTabLight,
                    isSelected && styles.categoryTabActive,
                  ]}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setActiveCategory(cat.val);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      { color: isSelected ? '#000000' : isDark ? '#94A3B8' : '#64748B' },
                      isSelected && styles.categoryTabTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Status Stats Row with Clickable Badges */}
          <View style={[styles.statsRow, isDark ? styles.borderDark : styles.borderLight]}>
            <View style={styles.badgesGroup}>
              {/* All Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  isDark ? styles.countBadgeDark : styles.countBadgeLight,
                  activeStatus === 'ALL' && (isDark ? styles.countBadgeActiveDark : styles.countBadgeActiveLight),
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus('ALL');
                }}
              >
                <Text style={[styles.countBadgeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  All: <Text style={{ fontWeight: '700', color: isDark ? '#F8FAFC' : '#0F172A' }}>{stats.total}</Text>
                </Text>
              </Pressable>

              {/* Approved Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  isDark ? styles.countBadgeDark : styles.countBadgeLight,
                  activeStatus === 'APPROVED' && (isDark ? styles.countBadgeActiveDark : styles.countBadgeActiveLight),
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(activeStatus === 'APPROVED' ? 'ALL' : 'APPROVED');
                }}
              >
                <Ionicons name="checkmark-circle" size={12} color="#25D366" />
                <Text style={[styles.countBadgeText, { color: '#25D366' }]}>{stats.approved}</Text>
              </Pressable>

              {/* Pending Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  isDark ? styles.countBadgeDark : styles.countBadgeLight,
                  activeStatus === 'PENDING' && (isDark ? styles.countBadgeActiveDark : styles.countBadgeActiveLight),
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(activeStatus === 'PENDING' ? 'ALL' : 'PENDING');
                }}
              >
                <Ionicons name="time-outline" size={12} color="#FBBF24" />
                <Text style={[styles.countBadgeText, { color: '#FBBF24' }]}>{stats.pending}</Text>
              </Pressable>

              {/* Rejected Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  isDark ? styles.countBadgeDark : styles.countBadgeLight,
                  activeStatus === 'REJECTED' && (isDark ? styles.countBadgeActiveDark : styles.countBadgeActiveLight),
                ]}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setActiveStatus(activeStatus === 'REJECTED' ? 'ALL' : 'REJECTED');
                }}
              >
                <Ionicons name="close-circle" size={12} color="#F87171" />
                <Text style={[styles.countBadgeText, { color: '#F87171' }]}>{stats.rejected}</Text>
              </Pressable>
            </View>

            {/* Sync Meta Templates Button */}
            <Pressable
              style={styles.syncBtn}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                refetch();
              }}
              disabled={isRefetching}
            >
              <Ionicons
                name="refresh-outline"
                size={13}
                color="#25D366"
                style={isRefetching ? { transform: [{ rotate: '45deg' }] } : {}}
              />
              <Text style={styles.syncBtnText}>{isRefetching ? 'Syncing...' : 'Sync'}</Text>
            </Pressable>
          </View>
        </View>

        {/* Templates FlatList / Grid */}
        {isLoading && !templates ? (

          <WhatsAppTemplatesSkeleton />
        ) : (
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id || item.name}
            renderItem={({ item }) => <TemplateCard template={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#25D366"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={isDark ? '#334155' : '#CBD5E1'} />
                <Text style={[styles.emptyTitle, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                  No WhatsApp Templates Found
                </Text>
                <Text style={[styles.emptyText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
                  {searchQuery || activeCategory !== 'ALL' || activeStatus !== 'ALL'
                    ? 'No templates match your active filters. Try clearing filters or search query.'
                    : 'No WhatsApp message templates available for this account.'}
                </Text>
              </View>
            }
          />
        )}

        {/* Meta Status Bar Footer */}
        <View style={[styles.metaLiveFooter, isDark ? styles.footerDark : styles.footerLight]}>
          <Text style={[styles.footerCountText, { color: isDark ? '#64748B' : '#94A3B8' }]}>
            Showing {filteredTemplates.length} of {templates?.length || 0} templates
          </Text>

          <View style={styles.metaLiveBadge}>
            <View style={styles.metaGreenDot} />
            <Text style={styles.metaLiveText}>Meta Cloud Live</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerDark: {
    backgroundColor: '#000000',
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  backButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  backButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  titleLight: {
    color: '#0F172A',
  },
  titleDark: {
    color: '#F8FAFC',
  },
  filterCard: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 6,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
  },
  filterCardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  filterCardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
    borderWidth: 1,
  },
  searchBarDark: {
    backgroundColor: '#121214',
    borderColor: '#2C2C2E',
  },
  searchBarLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 10,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabDark: {
    backgroundColor: '#121214',
    borderColor: '#2C2C2E',
  },
  categoryTabLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
  },
  categoryTabActive: {
    backgroundColor: '#25D366',
    borderColor: '#25D366',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  borderDark: {
    borderTopColor: '#2C2C2E',
  },
  borderLight: {
    borderTopColor: '#E5E7EB',
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  countBadgeDark: {
    backgroundColor: '#121214',
    borderColor: '#2C2C2E',
  },
  countBadgeLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E5E7EB',
  },
  countBadgeActiveDark: {
    backgroundColor: '#2C2C2E',
    borderColor: '#3A3A3C',
  },
  countBadgeActiveLight: {
    backgroundColor: '#E5E7EB',
    borderColor: '#D1D5DB',
  },
  countBadgeText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
    gap: 4,
  },
  syncBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#25D366',
  },
  listContent: {
    padding: 14,
    paddingBottom: 130,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
    fontWeight: '500',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyText: {
    fontSize: 12.5,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  metaLiveFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerDark: {
    backgroundColor: '#000000',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerLight: {
    backgroundColor: '#FFFFFF',
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  footerCountText: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  metaLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#25D366',
    marginRight: 5,
  },
  metaLiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#25D366',
  },
});
