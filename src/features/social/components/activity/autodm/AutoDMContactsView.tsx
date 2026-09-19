import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { AutoDMContactItem } from '../../../types';

export interface AutoDMContactsViewProps {
  dynamicContacts: AutoDMContactItem[];
  isLoading: boolean;
  onExportContacts: (contacts: AutoDMContactItem[]) => Promise<void>;
  onRefreshContacts: () => void;
}

export const AutoDMContactsView: React.FC<AutoDMContactsViewProps> = ({
  dynamicContacts,
  isLoading,
  onExportContacts,
  onRefreshContacts,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [contactSearch, setContactSearch] = useState('');
  const [contactFilter, setContactFilter] = useState<'all' | 'synced' | 'with_dms'>('all');

  const filteredContacts = useMemo(() => {
    let list = Array.isArray(dynamicContacts) ? dynamicContacts : [];
    if (contactSearch.trim()) {
      const q = contactSearch.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.username?.toLowerCase().includes(q) ||
          (c.full_name && c.full_name.toLowerCase().includes(q)) ||
          (c.canonical_contact_id && c.canonical_contact_id.toLowerCase().includes(q))
      );
    }
    if (contactFilter === 'synced') {
      list = list.filter((c) => c.ecosystem_sync_status === 'synced' || Boolean(c.canonical_contact_id));
    } else if (contactFilter === 'with_dms') {
      list = list.filter((c) => (c.total_messages_sent || 0) + (c.total_messages_received || 0) > 0);
    }
    return list;
  }, [dynamicContacts, contactSearch, contactFilter]);

  return (
    <View style={{ gap: 12 }}>
      {/* TOP EXPORT BANNER - Explicitly at top of list */}
      <View
        style={[
          styles.contactTopExportBar,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
          },
        ]}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.contactListTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
              Captured Contacts
            </Text>
            <View
              style={[
                styles.contactCountBadge,
                {
                  backgroundColor: isDark ? '#1e293b' : '#eff6ff',
                  borderColor: isDark ? '#334155' : '#bfdbfe',
                },
              ]}
            >
              <Text style={{ fontSize: 11, fontWeight: '800', color: '#3b82f6' }}>
                {dynamicContacts.length}
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', marginTop: 2 }}>
            Instagram AutoDM audience & CRM synced contacts
          </Text>
        </View>

        {/* Prominent Export Button at top of list */}
        <Pressable
          onPress={() => onExportContacts(filteredContacts.length > 0 ? filteredContacts : dynamicContacts)}
          disabled={dynamicContacts.length === 0}
          style={({ pressed }) => [
            styles.contactExportButton,
            {
              backgroundColor: dynamicContacts.length === 0 ? (isDark ? '#334155' : '#cbd5e1') : '#3b82f6',
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="download-outline" size={16} color="#ffffff" />
          <Text style={styles.contactExportButtonText}>
            Export List ({dynamicContacts.length})
          </Text>
        </Pressable>
      </View>

      {/* Filter / Search Bar Layout */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#0f172a' : '#ffffff',
            borderColor: isDark ? '#1e293b' : '#e2e8f0',
            padding: 12,
            gap: 10,
          },
        ]}
      >
        <View
          style={[
            styles.inboxSearchInputBox,
            {
              backgroundColor: isDark ? '#1e293b' : '#f8fafc',
              borderColor: isDark ? '#334155' : '#cbd5e1',
            },
          ]}
        >
          <Ionicons name="search" size={15} color={isDark ? '#94a3b8' : '#64748b'} />
          <TextInput
            style={[styles.inboxSearchInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
            placeholder="Search by username, full name, CRM ID..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={contactSearch}
            onChangeText={setContactSearch}
          />
          {contactSearch.length > 0 && (
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                setContactSearch('');
              }}
            >
              <Ionicons name="close-circle" size={16} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          )}
        </View>

        {/* Filter Chips Bar */}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setContactFilter('all');
            }}
            style={[
              styles.statusChip,
              contactFilter === 'all'
                ? { backgroundColor: 'rgba(59, 130, 246, 0.14)', borderColor: '#3b82f6' }
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color: contactFilter === 'all' ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b',
                  fontWeight: contactFilter === 'all' ? '700' : '500',
                },
              ]}
            >
              All ({dynamicContacts.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setContactFilter('synced');
            }}
            style={[
              styles.statusChip,
              contactFilter === 'synced'
                ? { backgroundColor: 'rgba(16, 185, 129, 0.14)', borderColor: '#10b981' }
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color: contactFilter === 'synced' ? '#10b981' : isDark ? '#94a3b8' : '#64748b',
                  fontWeight: contactFilter === 'synced' ? '700' : '500',
                },
              ]}
            >
              CRM Synced
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              setContactFilter('with_dms');
            }}
            style={[
              styles.statusChip,
              contactFilter === 'with_dms'
                ? { backgroundColor: 'rgba(139, 92, 246, 0.14)', borderColor: '#8b5cf6' }
                : { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
            ]}
          >
            <Text
              style={[
                styles.statusChipText,
                {
                  color: contactFilter === 'with_dms' ? '#8b5cf6' : isDark ? '#94a3b8' : '#64748b',
                  fontWeight: contactFilter === 'with_dms' ? '700' : '500',
                },
              ]}
            >
              With Activity
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Loading State */}
      {isLoading && (
        <View style={{ paddingVertical: 40, alignItems: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ fontSize: 13, color: isDark ? '#94a3b8' : '#64748b' }}>
            Loading captured contacts...
          </Text>
        </View>
      )}

      {/* Empty State */}
      {!isLoading && dynamicContacts.length === 0 && (
        <View
          style={[
            styles.autodmEmptyCard,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
            },
          ]}
        >
          <View style={[styles.autodmEmptyIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.12)' }]}>
            <Ionicons name="people" size={32} color="#3b82f6" />
          </View>
          <Text style={[styles.autodmEmptyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            No Contacts Captured Yet
          </Text>
          <Text style={[styles.autodmEmptyDesc, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            When users comment on your Instagram posts with trigger keywords or respond to your automated DMs, their profile data and lead tags will be organized here.
          </Text>

          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRefreshContacts();
            }}
            style={[styles.primaryActionBtn, { backgroundColor: '#3b82f6', marginTop: 8 }]}
          >
            <Ionicons name="refresh" size={14} color="#ffffff" />
            <Text style={styles.primaryActionBtnText}>Refresh Contacts</Text>
          </Pressable>
        </View>
      )}

      {/* Filtered Empty State */}
      {!isLoading && dynamicContacts.length > 0 && filteredContacts.length === 0 && (
        <View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? '#0f172a' : '#ffffff',
              borderColor: isDark ? '#1e293b' : '#e2e8f0',
              alignItems: 'center',
              paddingVertical: 32,
              gap: 8,
            },
          ]}
        >
          <Ionicons name="search" size={28} color={isDark ? '#64748b' : '#94a3b8'} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#f8fafc' : '#0f172a' }}>
            No Matching Contacts
          </Text>
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
            Try clearing your search query or changing the filter.
          </Text>
          <Pressable
            onPress={() => {
              setContactSearch('');
              setContactFilter('all');
            }}
            style={{ marginTop: 8 }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#3b82f6' }}>Clear Filters</Text>
          </Pressable>
        </View>
      )}

      {/* Contact Cards List */}
      {!isLoading &&
        filteredContacts.map((contact) => {
          const isSynced = contact.ecosystem_sync_status === 'synced' || Boolean(contact.canonical_contact_id);
          const totalInteractions = (contact.total_messages_sent || 0) + (contact.total_messages_received || 0);

          const firstSeenFormatted = contact.first_interaction_at
            ? new Date(contact.first_interaction_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          const lastActiveFormatted = contact.last_interaction_at
            ? new Date(contact.last_interaction_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          const syncedAtFormatted = contact.ecosystem_synced_at
            ? new Date(contact.ecosystem_synced_at).toLocaleDateString([], {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : null;

          return (
            <View
              key={contact.id}
              style={[
                styles.contactCard,
                {
                  backgroundColor: isDark ? '#0f172a' : '#ffffff',
                  borderColor: isDark ? '#1e293b' : '#e2e8f0',
                },
              ]}
            >
              {/* Header: Avatar, Handle, Names, CRM Sync Badge */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ position: 'relative' }}>
                  {contact.profile_picture_url ? (
                    <Image
                      source={{ uri: contact.profile_picture_url }}
                      style={styles.contactAvatar}
                    />
                  ) : (
                    <View style={[styles.contactAvatarFallback, { backgroundColor: isDark ? '#1e293b' : '#fdf2f8' }]}>
                      <Text style={{ fontSize: 18, fontWeight: '800', color: '#e1306c' }}>
                        {(contact.username || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View style={styles.contactInstagramBadge}>
                    <Ionicons name="logo-instagram" size={10} color="#e1306c" />
                  </View>
                </View>

                <View style={{ flex: 1 }}>
                  <Pressable
                    onPress={() => {
                      Haptics.selectionAsync();
                      Linking.openURL(`https://instagram.com/${contact.username}`);
                    }}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  >
                    <Text style={[styles.contactUsername, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      @{contact.username}
                    </Text>
                    <Ionicons name="open-outline" size={13} color="#3b82f6" />
                  </Pressable>
                  {contact.full_name ? (
                    <Text style={[styles.contactFullName, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {contact.full_name}
                    </Text>
                  ) : null}
                </View>

                {/* Sync Status Badge */}
                <View
                  style={[
                    styles.contactSyncedBadge,
                    isSynced
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.12)' }
                      : { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                  ]}
                >
                  <Ionicons
                    name={isSynced ? 'checkmark-circle' : 'time-outline'}
                    size={12}
                    color={isSynced ? '#10b981' : '#f59e0b'}
                  />
                  <Text
                    style={[
                      styles.contactSyncedText,
                      { color: isSynced ? '#10b981' : '#f59e0b' },
                    ]}
                  >
                    {isSynced ? 'CRM Synced' : 'Pending'}
                  </Text>
                </View>
              </View>

              {/* Relationship & Audience Meta Pills */}
              <View style={styles.contactRelationshipPillsRow}>
                <View
                  style={[
                    styles.contactRelationshipPill,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                    },
                  ]}
                >
                  <Ionicons name="people" size={12} color={isDark ? '#94a3b8' : '#64748b'} />
                  <Text style={[styles.contactRelationshipPillText, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                    {contact.follower_count ?? 0} followers
                  </Text>
                </View>

                <View
                  style={[
                    styles.contactRelationshipPill,
                    contact.is_following_you
                      ? { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: 'rgba(16, 185, 129, 0.25)' }
                      : { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                  ]}
                >
                  <Ionicons
                    name={contact.is_following_you ? 'checkmark-circle' : 'close-circle-outline'}
                    size={12}
                    color={contact.is_following_you ? '#10b981' : isDark ? '#64748b' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.contactRelationshipPillText,
                      { color: contact.is_following_you ? '#10b981' : isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {contact.is_following_you ? 'Follows You' : 'Not Following You'}
                  </Text>
                </View>

                <View
                  style={[
                    styles.contactRelationshipPill,
                    contact.you_are_following
                      ? { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderColor: 'rgba(59, 130, 246, 0.25)' }
                      : { backgroundColor: isDark ? '#1e293b' : '#f8fafc', borderColor: isDark ? '#334155' : '#e2e8f0' },
                  ]}
                >
                  <Ionicons
                    name={contact.you_are_following ? 'person-add' : 'person-remove-outline'}
                    size={12}
                    color={contact.you_are_following ? '#3b82f6' : isDark ? '#64748b' : '#94a3b8'}
                  />
                  <Text
                    style={[
                      styles.contactRelationshipPillText,
                      { color: contact.you_are_following ? '#3b82f6' : isDark ? '#94a3b8' : '#64748b' },
                    ]}
                  >
                    {contact.you_are_following ? 'You Follow' : 'Not Following'}
                  </Text>
                </View>
              </View>

              {/* Engagement & Telemetry Grid */}
              <View style={styles.contactStatsGrid}>
                <View style={[styles.contactStatBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                  <Ionicons name="paper-plane" size={15} color="#3b82f6" />
                  <Text style={[styles.contactStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {contact.total_messages_sent ?? 0}
                  </Text>
                  <Text style={styles.contactStatLabel}>DMs Sent</Text>
                </View>

                <View style={[styles.contactStatBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                  <Ionicons name="chatbubble-ellipses" size={15} color="#10b981" />
                  <Text style={[styles.contactStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {contact.total_messages_received ?? 0}
                  </Text>
                  <Text style={styles.contactStatLabel}>Received</Text>
                </View>

                <View style={[styles.contactStatBox, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
                  <Ionicons name="swap-horizontal" size={15} color="#8b5cf6" />
                  <Text style={[styles.contactStatVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {totalInteractions}
                  </Text>
                  <Text style={styles.contactStatLabel}>Touchpoints</Text>
                </View>
              </View>

              {/* Interaction Timeline */}
              {(firstSeenFormatted || lastActiveFormatted) && (
                <View
                  style={[
                    styles.contactTimelineContainer,
                    {
                      borderTopColor: isDark ? '#1e293b' : '#f1f5f9',
                      borderBottomColor: isDark ? '#1e293b' : '#f1f5f9',
                    },
                  ]}
                >
                  {firstSeenFormatted && (
                    <View style={styles.contactTimelineItem}>
                      <Ionicons name="calendar-outline" size={13} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={[styles.contactTimelineText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        First:{' '}
                        <Text style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                          {firstSeenFormatted}
                        </Text>
                      </Text>
                    </View>
                  )}

                  {lastActiveFormatted && (
                    <View style={styles.contactTimelineItem}>
                      <Ionicons name="time-outline" size={13} color={isDark ? '#64748b' : '#94a3b8'} />
                      <Text style={[styles.contactTimelineText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Last:{' '}
                        <Text style={{ color: isDark ? '#cbd5e1' : '#334155' }}>
                          {lastActiveFormatted}
                        </Text>
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* CRM Hub Integration Details */}
              <View
                style={[
                  styles.contactCrmStrip,
                  {
                    backgroundColor: isDark ? '#131e32' : '#f1f5f9',
                    borderColor: isDark ? '#1e293b' : '#e2e8f0',
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                    <Ionicons name="git-network-outline" size={13} color="#6366f1" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: isDark ? '#e0e7ff' : '#4338ca' }}>
                      CRM Canonical Profile
                    </Text>
                  </View>
                  {contact.ecosystem_sync_source && (
                    <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
                      Source: {contact.ecosystem_sync_source}
                    </Text>
                  )}
                </View>

                {contact.canonical_contact_id ? (
                  <Text
                    style={[
                      styles.contactCrmIdText,
                      { color: isDark ? '#94a3b8' : '#64748b' },
                    ]}
                    numberOfLines={1}
                  >
                    ID: {contact.canonical_contact_id}
                  </Text>
                ) : null}

                {syncedAtFormatted && (
                  <Text style={{ fontSize: 10, color: isDark ? '#64748b' : '#94a3b8' }}>
                    Last synced: {syncedAtFormatted}
                  </Text>
                )}
              </View>

              {/* Quick Actions Bar */}
              <View style={styles.contactActionsRow}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    Linking.openURL(`https://instagram.com/${contact.username}`);
                  }}
                  style={[
                    styles.contactActionBtn,
                    {
                      backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                      borderColor: isDark ? '#334155' : '#e2e8f0',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <Ionicons name="logo-instagram" size={13} color="#e1306c" />
                  <Text style={[styles.contactActionBtnText, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    View on Instagram
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactTopExportBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  contactListTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  contactCountBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  contactExportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    alignSelf: 'center',
  },
  contactExportButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  inboxSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
    gap: 6,
  },
  inboxSearchInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 0,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
  },
  autodmEmptyCard: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 36,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  autodmEmptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  autodmEmptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  autodmEmptyDesc: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 320,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  contactCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    gap: 10,
  },
  contactAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#00000010',
  },
  contactAvatarFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactInstagramBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  contactUsername: {
    fontSize: 14,
    fontWeight: '700',
  },
  contactFullName: {
    fontSize: 12,
    marginTop: 2,
  },
  contactSyncedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  contactSyncedText: {
    fontSize: 10,
    fontWeight: '700',
  },
  contactRelationshipPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  contactRelationshipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  contactRelationshipPillText: {
    fontSize: 11,
    fontWeight: '600',
  },
  contactStatsGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  contactStatBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 2,
  },
  contactStatVal: {
    fontSize: 14,
    fontWeight: '800',
  },
  contactStatLabel: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '500',
  },
  contactTimelineContainer: {
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: 4,
  },
  contactTimelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactTimelineText: {
    fontSize: 11,
    fontWeight: '500',
  },
  contactCrmStrip: {
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    gap: 4,
  },
  contactCrmIdText: {
    fontSize: 10,
    fontFamily: 'Courier',
    fontWeight: '600',
  },
  contactActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  contactActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 7,
    borderRadius: 8,
  },
  contactActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
});
