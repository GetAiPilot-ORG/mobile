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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* 1. Top Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <Pressable style={styles.backButton} onPress={handleBack} hitSlop={10}>
              <Ionicons name="arrow-back" size={20} color="#f8fafc" />
            </Pressable>

            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Message Templates</Text>
              <Text style={styles.subtitle}>Manage your WhatsApp message templates</Text>
            </View>

            <Pressable
              style={styles.newTemplateBtn}
              onPress={() => {
                // Navigate or alert
              }}
            >
              <Ionicons name="add" size={16} color="#020617" style={{ marginRight: 2 }} />
              <Text style={styles.newTemplateBtnText}>New</Text>
            </Pressable>
          </View>
        </View>

        {/* 2. Filter & Search Controls Card */}
        <View style={styles.filterCard}>
          {/* Search Bar */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color="#64748b" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search template name or message..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={16} color="#64748b" />
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
                  style={[styles.categoryTab, isSelected && styles.categoryTabActive]}
                  onPress={() => setActiveCategory(cat.val)}
                >
                  <Text
                    style={[
                      styles.categoryTabText,
                      isSelected && styles.categoryTabTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Stats Badges & Sync Bar */}
          <View style={styles.statsRow}>
            <View style={styles.badgesGroup}>
              {/* Approved Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  activeStatus === 'APPROVED' && styles.countBadgeActive,
                ]}
                onPress={() => setActiveStatus(activeStatus === 'APPROVED' ? 'ALL' : 'APPROVED')}
              >
                <Ionicons name="checkmark-circle" size={13} color="#25d366" />
                <Text style={[styles.countBadgeText, { color: '#25d366' }]}>
                  {stats.approved}
                </Text>
              </Pressable>

              {/* Pending Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  activeStatus === 'PENDING' && styles.countBadgeActive,
                ]}
                onPress={() => setActiveStatus(activeStatus === 'PENDING' ? 'ALL' : 'PENDING')}
              >
                <Ionicons name="time" size={13} color="#fbbf24" />
                <Text style={[styles.countBadgeText, { color: '#fbbf24' }]}>
                  {stats.pending}
                </Text>
              </Pressable>

              {/* Rejected/Draft Badge */}
              <Pressable
                style={[
                  styles.countBadge,
                  activeStatus === 'REJECTED' && styles.countBadgeActive,
                ]}
                onPress={() => setActiveStatus(activeStatus === 'REJECTED' ? 'ALL' : 'REJECTED')}
              >
                <Ionicons name="document-text-outline" size={13} color="#94a3b8" />
                <Text style={[styles.countBadgeText, { color: '#94a3b8' }]}>
                  {stats.rejected}
                </Text>
              </Pressable>
            </View>

            {/* Sync Status Button */}
            <Pressable
              style={styles.syncBtn}
              onPress={() => refetch()}
              disabled={isRefetching}
            >
              <Ionicons
                name="refresh-outline"
                size={14}
                color="#25d366"
                style={isRefetching ? { transform: [{ rotate: '45deg' }] } : {}}
              />
              <Text style={styles.syncBtnText}>Sync Status</Text>
            </Pressable>
          </View>
        </View>

        {/* 3. Templates List */}
        {isLoading && !templates ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#25d366" />
            <Text style={styles.loadingText}>Loading Meta templates...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredTemplates}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <TemplateCard template={item} />}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#25d366" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="file-tray-outline" size={48} color="#334155" />
                <Text style={styles.emptyTitle}>No templates found</Text>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? `No templates matching "${searchQuery}"`
                    : 'Templates approved by Meta for utility, marketing, or authentication will appear here.'}
                </Text>
              </View>
            }
          />
        )}

        {/* 4. Bottom Meta Live Footer */}
        <View style={styles.metaLiveFooter}>
          <Text style={styles.footerCountText}>
            {filteredTemplates.length} templates shown · {stats.total} total synced
          </Text>

          <View style={styles.metaLiveBadge}>
            <View style={styles.metaGreenDot} />
            <Text style={styles.metaLiveText}>Live from Meta</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: '#020617',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
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
    backgroundColor: '#0f172a',
    marginHorizontal: 14,
    marginTop: 12,
    marginBottom: 6,
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 1,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    marginBottom: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#f8fafc',
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
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  categoryTabActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  categoryTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
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
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  countBadgeActive: {
    backgroundColor: '#1e293b',
    borderColor: '#475569',
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
    color: '#94a3b8',
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
    color: '#f8fafc',
    marginTop: 12,
  },
  emptyText: {
    color: '#64748b',
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
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  footerCountText: {
    fontSize: 11.5,
    color: '#64748b',
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

