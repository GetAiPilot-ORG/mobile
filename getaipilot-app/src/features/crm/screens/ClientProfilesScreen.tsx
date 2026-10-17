import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CrmListSkeleton } from '../../../components/skeletonScreen';
import { crmApi } from '../api/crm.api';
import { CreateBillingProfileModal } from '../components/CreateBillingProfileModal';
import { useCreateBillingProfile } from '../hooks/useBillingProfiles';
import { CRMBillingProfile } from '../types';

const WEB_APP_URL = 'https://getaipilot.in';

export interface ClientProfilesScreenProps {
  onBack?: () => void;
}

export function ClientProfilesScreen({ onBack }: ClientProfilesScreenProps = {}) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const router = useRouter();

  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const createProfile = useCreateBillingProfile();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };

  const { data, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['crm-billing-profiles'],
    queryFn: () => crmApi.getBillingProfiles(),
  });

  const profiles = data?.profiles || [];

  const filteredProfiles = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter((p) => {
      const name = (p.legal_name || '').toLowerCase();
      const gstin = (p.gstin || '').toLowerCase();
      const pan = (p.pan || '').toLowerCase();
      const city = (p.billing_address_city || '').toLowerCase();
      const state = (p.billing_address_state || '').toLowerCase();
      const contact = p.contact
        ? `${p.contact.first_name || ''} ${p.contact.last_name || ''}`.toLowerCase()
        : '';
      return (
        name.includes(q) ||
        gstin.includes(q) ||
        pan.includes(q) ||
        city.includes(q) ||
        state.includes(q) ||
        contact.includes(q)
      );
    });
  }, [profiles, search]);

  const open = (p: CRMBillingProfile) => {
    Linking.openURL(`${WEB_APP_URL}/dashboard/crm/billing-profiles/${p.id}`).catch(() => {});
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Pressable
            style={[styles.backBtn, { backgroundColor: colors.surface }]}
            onPress={handleBack}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </Pressable>
          <View>
            <View style={styles.titleRow}>
              <Text style={[styles.title, { color: colors.text }]}>Your clients</Text>
              <View style={[styles.countBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.countText, { color: colors.textMuted }]}>
                  {data?.total_count ?? profiles.length}
                </Text>
              </View>
            </View>

          </View>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => {
            if (Platform.OS !== 'web') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            }
            setShowCreateModal(true);
          }}
          hitSlop={8}
        >
          <Ionicons name="add" size={16} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Profile</Text>
        </Pressable>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search profiles by name, GST, city..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
          clearButtonMode="while-editing"
        />
        {search ? (
          <Pressable onPress={() => setSearch('')} hitSlop={6}>
            <Ionicons name="close-circle" size={16} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {/* Content */}
      {isLoading && !data ? (
        <CrmListSkeleton />
      ) : filteredProfiles.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="business-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            {search ? 'No matching profiles' : 'No Client Profiles'}
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            {search
              ? `No billing profiles matching "${search}"`
              : 'Add legal entity and GST billing details for your clients.'}
          </Text>
          {!search && (
            <Pressable
              style={styles.emptyBtn}
              onPress={() => {
                if (Platform.OS !== 'web') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                }
                setShowCreateModal(true);
              }}
            >
              <Ionicons name="add" size={16} color="#FFFFFF" />
              <Text style={styles.emptyBtnText}>Create Profile</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredProfiles}
          keyExtractor={(p) => p.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const displayName = item.legal_name || 'Client';
            const initial = (displayName.trim().charAt(0) || 'C').toUpperCase();
            const location = [item.billing_address_city, item.billing_address_state]
              .filter(Boolean)
              .join(', ');
            const contactName = item.contact
              ? `${item.contact.first_name || ''} ${item.contact.last_name || ''}`.trim()
              : null;

            return (
              <Pressable cssInterop={false}
                style={({ pressed }) => [
                  styles.card,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                  pressed && { opacity: 0.9, borderColor: '#3B82F6' },
                ]}
                onPress={() => open(item)}
              >
                <View style={styles.cardHeader}>
                  <View
                    style={[
                      styles.avatar,
                      {
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF',
                      },
                    ]}
                  >
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>

                  <View style={styles.cardMain}>
                    <View style={styles.cardTopRow}>
                      <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
                        {displayName}
                      </Text>
                      <Ionicons name="open-outline" size={14} color={colors.textMuted} />
                    </View>

                    {contactName ? (
                      <Text style={[styles.contactName, { color: colors.textMuted }]} numberOfLines={1}>
                        Contact: {contactName}
                      </Text>
                    ) : null}
                  </View>
                </View>

                {(Boolean(item.gstin) || Boolean(item.pan) || Boolean(location)) && (
                  <View style={[styles.metaRow, { borderTopColor: colors.border }]}>
                    {Boolean(item.gstin) && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF',
                          },
                        ]}
                      >
                        <Ionicons name="receipt-outline" size={11} color="#3B82F6" />
                        <Text style={[styles.badgeText, { color: '#3B82F6' }]}>
                          GST: {item.gstin}
                        </Text>
                      </View>
                    )}
                    {Boolean(item.pan) && (
                      <View
                        style={[
                          styles.badge,
                          {
                            backgroundColor: isDark ? 'rgba(139, 92, 246, 0.12)' : '#F5F3FF',
                          },
                        ]}
                      >
                        <Ionicons name="card-outline" size={11} color="#8B5CF6" />
                        <Text style={[styles.badgeText, { color: '#8B5CF6' }]}>
                          PAN: {item.pan}
                        </Text>
                      </View>
                    )}
                    {Boolean(location) && (
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={12} color={colors.textMuted} />
                        <Text style={[styles.locationText, { color: colors.textMuted }]} numberOfLines={1}>
                          {location}
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            );
          }}
        />
      )}

      {/* Create Billing Profile Modal */}
      <CreateBillingProfileModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={async (profile) => {
          try {
            await createProfile.mutateAsync(profile);
            if (Platform.OS !== 'web') {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            Alert.alert('Profile Created', `${profile.legal_name || 'Billing profile'} was added.`);
          } catch (err: any) {
            Alert.alert('Error', err?.message || 'Failed to create billing profile');
            throw err;
          }
        }}
        isLoading={createProfile.isPending}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '500',
    letterSpacing: -0.5, lineHeight: 36 },
  countBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 0.5,
  },
  countText: {
    fontSize: 12,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#17171C',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 28, minHeight: 44 , shadowOpacity: 0 },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 0, minHeight: 48 },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 24,
    borderWidth: 0,
    padding: 14,
    marginBottom: 10, shadowOpacity: 0 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12, borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  cardMain: {
    flex: 1,
    minWidth: 0, borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8, borderRadius: 24 , borderWidth: 0 , shadowOpacity: 0 },
  name: {
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  contactName: {
    fontSize: 12,
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  locationText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
