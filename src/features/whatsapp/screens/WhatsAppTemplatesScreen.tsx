import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { TemplateCard } from '../components';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';

interface WhatsAppTemplatesScreenProps {
  onBack?: () => void;
}

export const WhatsAppTemplatesScreen: React.FC<WhatsAppTemplatesScreenProps> = ({ onBack }) => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const handleBack = onBack || (() => router.back());

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
      style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}
      edges={['top', 'left', 'right']}
    >
      <View style={[styles.container, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
        {/* 1. Top Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View style={styles.headerTitleRow}>
            <Pressable
              style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
              onPress={handleBack}
              hitSlop={10}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#f8fafc' : '#0f172a'} />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Message Templates</Text>
              <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Manage your WhatsApp message templates
              </Text>
            </View>

            <Pressable
              style={styles.newTemplateBtn}
              onPress={() => {
                router.push('/products/whatsapp/create-broadcast' as any);
              }}
            >
              <Ionicons name="add" size={16} color="#020617" style={{ marginRight: 2 }} />
              <Text style={styles.newTemplateBtnText}>New</Text>
            </Pressable>
          </View>
        </View>

        {/* 2. Filter & Search Controls Card */}
        <View style={[styles.filterCard, isDark ? styles.filterCardDark : styles.filterCardLight]}>
          {/* Search Bar */}
          <View style={[styles.searchBar, isDark ? styles.searchBarDark : styles.searchBarLight]}>
            <Ionicons name="search-outline" size={16} color={isDark ? '#64748b' : '#94a3b8'} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
              placeholder="Search template name or message..."
              placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color={isDark ? '#64748b' : '#94a3b8'} />
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
                  onPress={() => setActiveCategory(cat.val)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      { color: isDark ? '#94a3b8' : '#64748b' },
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
                onPress={() => setActiveStatus('ALL')}
              >
                <Text style={[styles.countBadgeText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  All: <Text style={{ fontWeight: '800', color: isDark ? '#f8fafc' : '#0f172a' }}>{stats.total}</Text>
                </Text>
              </Pressable>

              {/* Approved Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  isDark ? styles.countBadgeDark : styles.countBadgeLight,
                  activeStatus === 'APPROVED' && (isDark ? styles.countBadgeActiveDark : styles.countBadgeActiveLight),
                ]}
                onPress={() => setActiveStatus(activeStatus === 'APPROVED' ? 'ALL' : 'APPROVED')}
              >
                <Ionicons name="checkmark-circle" size={12} color="#25d366" />
                <Text style={[styles.countBadgeText, { color: '#25d366' }]}>{stats.approved}</Text>
              </Pressable>

              {/* Pending Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  isDark ? styles.countBadgeDark : styles.countBadgeLight,
                  activeStatus === 'PENDING' && (isDark ? styles.countBadgeActiveDark : styles.countBadgeActiveLight),
                ]}
                onPress={() => setActiveStatus(activeStatus === 'PENDING' ? 'ALL' : 'PENDING')}
              >
                <Ionicons name="time-outline" size={12} color="#fbbf24" />
                <Text style={[styles.countBadgeText, { color: '#fbbf24' }]}>{stats.pending}</Text>
              </Pressable>

              {/* Rejected Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  isDark ? styles.countBadgeDark : styles.countBadgeLight,
                  activeStatus === 'REJECTED' && (isDark ? styles.countBadgeActiveDark : styles.countBadgeActiveLight),
                ]}
                onPress={() => setActiveStatus(activeStatus === 'REJECTED' ? 'ALL' : 'REJECTED')}
              >
                <Ionicons name="close-circle" size={12} color="#f87171" />
                <Text style={[styles.countBadgeText, { color: '#f87171' }]}>{stats.rejected}</Text>
              </Pressable>
            </View>

            {/* Sync Meta Templates Button */}
            <Pressable
              style={styles.syncBtn}
              onPress={() => refetch()}
              disabled={isRefetching}
            >
              <Ionicons
                name="refresh-outline"
                size={13}
                color="#25d366"
                style={isRefetching ? { transform: [{ rotate: '45deg' }] } : {}}
              />
              <Text style={styles.syncBtnText}>{isRefetching ? 'Syncing...' : 'Sync'}</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Templates FlatList / Grid */}
        {isLoading && !templates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#25d366" />
            <Text style={[styles.loadingText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Syncing Meta WhatsApp templates...
            </Text>
          </View>
        ) : (
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id || item.name}
            renderItem={({ item }) => (
              <TemplateCard
                template={item}
                onSelect={() => {
                  router.push({
                    pathname: '/products/whatsapp/create-broadcast',
                    params: { templateName: item.name },
                  });
                }}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#25d366"
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="document-text-outline" size={48} color={isDark ? '#334155' : '#cbd5e1'} />
                <Text style={[styles.emptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                  No WhatsApp Templates Found
                </Text>
                <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  {searchQuery || activeCategory !== 'ALL' || activeStatus !== 'ALL'
                    ? 'No templates match your active filters. Try clearing filters or search query.'
                    : 'Create and submit your first WhatsApp message template to Meta for approval.'}
                </Text>
              </View>
            }
          />
        )}

        {/* 4. Meta Status Bar Footer */}
        <View style={[styles.metaLiveFooter, isDark ? styles.footerDark : styles.footerLight]}>
          <Text style={[styles.footerCountText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerDark: {
    backgroundColor: '#020617',
    borderBottomColor: '#1e293b',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  backButtonDark: {
    backgroundColor: '#1e293b',
  },
  backButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 1,
  },
  newTemplateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#25d366',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    shadowColor: '#25d366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  newTemplateBtnText: {
    color: '#020617',
    fontSize: 12.5,
    fontWeight: '700',
  },
  filterCard: {
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
  },
  filterCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  filterCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  searchBarDark: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  searchBarLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    paddingVertical: 0,
  },
  categoryScroll: {
    gap: 6,
    paddingBottom: 10,
  },
  categoryTab: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 7,
    borderWidth: 1,
  },
  categoryTabDark: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  categoryTabLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  categoryTabActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryTabTextActive: {
    color: '#020617',
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: 8,
  },
  borderDark: {
    borderTopColor: '#1e293b',
  },
  borderLight: {
    borderTopColor: '#e2e8f0',
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
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  countBadgeLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  countBadgeActiveDark: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
  },
  countBadgeActiveLight: {
    backgroundColor: '#e2e8f0',
    borderColor: '#cbd5e1',
  },
  countBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.25)',
    gap: 4,
  },
  syncBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#25d366',
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
    borderTopWidth: 1,
  },
  footerDark: {
    backgroundColor: '#020617',
    borderTopColor: '#1e293b',
  },
  footerLight: {
    backgroundColor: '#ffffff',
    borderTopColor: '#e2e8f0',
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
    backgroundColor: '#25d366',
    marginRight: 5,
  },
  metaLiveText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#25d366',
  },
});
