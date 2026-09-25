import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Pressable,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { voiceApi, VoiceContact } from '../api/voiceApi';
import {
  CreateContactModal,
  EditContactModal,
  ContactDetailsModal,
  TriggerCallModal,
  CallDetailsModal,
} from '../components';
import { useTheme, getColors } from '@/theme';

type ContactFilter = 'all' | 'called' | 'uncalled';

export const ContactsScreen: React.FC = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<ContactFilter>('all');
  const [selectedContact, setSelectedContact] = useState<VoiceContact | null>(null);
  const [editingContact, setEditingContact] = useState<VoiceContact | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [callTarget, setCallTarget] = useState<{ phone: string; name: string } | null>(null);
  const [inspectedCall, setInspectedCall] = useState<any | null>(null);

  // Queries
  const {
    data: contactsData,
    isLoading: isContactsLoading,
    refetch: refetchContacts,
    isRefetching: isContactsRefetching,
  } = useQuery({
    queryKey: ['voice', 'contacts'],
    queryFn: () => voiceApi.getContacts(),
  });

  const {
    data: assistantsData,
  } = useQuery({
    queryKey: ['voice', 'assistants'],
    queryFn: () => voiceApi.getAssistants(),
  });

  // Mutations
  const createContactMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.createContact(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'contacts'] });
    },
  });

  const updateContactMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      voiceApi.updateContact(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'contacts'] });
    },
  });

  const deleteContactMutation = useMutation({
    mutationFn: (id: string) => voiceApi.deleteContact(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'contacts'] });
    },
  });

  const triggerCallMutation = useMutation({
    mutationFn: (payload: any) => voiceApi.triggerOutboundCall(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['voice', 'calls'] });
      queryClient.invalidateQueries({ queryKey: ['voice', 'contacts'] });
    },
  });

  const handleRefresh = () => {
    refetchContacts();
  };

  const contacts: VoiceContact[] = contactsData || [];
  const assistants = assistantsData || [];

  const filteredContacts = contacts.filter((cnt) => {
    // Search query filter
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      cnt.name.toLowerCase().includes(q) ||
      cnt.phone.toLowerCase().includes(q) ||
      (cnt.company && cnt.company.toLowerCase().includes(q));

    if (!matchesSearch) return false;

    // Filter tab
    if (activeFilter === 'called') return (cnt.calls_count || 0) > 0;
    if (activeFilter === 'uncalled') return !cnt.calls_count || cnt.calls_count === 0;
    return true;
  });

  return (
    <ScrollView
      style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isContactsRefetching}
          onRefresh={handleRefresh}
          tintColor={isDark ? '#FFFFFF' : '#8B5CF6'}
        />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header & New Contact Button */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.sectionHeaderTitle}>LEAD & RECIPIENT REGISTRY</Text>
          <Text style={[styles.mainTitle, isDark && styles.textDark]}>
            Voice Contacts ({contacts.length})
          </Text>
        </View>
        <Pressable
          style={[styles.createBtn, { backgroundColor: '#8B5CF6' }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsCreateModalOpen(true);
          }}
        >
          <Ionicons name="person-add" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnText}>Add Contact</Text>
        </Pressable>
      </View>

      {/* Search Input */}
      <View style={[styles.searchBar, isDark ? styles.searchBarDark : styles.searchBarLight]}>
        <Ionicons name="search" size={16} color="#8E8E93" />
        <TextInput
          style={[styles.searchInput, isDark && styles.textDark]}
          placeholder="Search by name, phone number, company..."
          placeholderTextColor="#8E8E93"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={16} color="#8E8E93" />
          </Pressable>
        )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {(
          [
            { key: 'all', label: 'All Contacts' },
            { key: 'called', label: 'Previously Called' },
            { key: 'uncalled', label: 'Unreached Leads' },
          ] as const
        ).map((tab) => {
          const isSelected = activeFilter === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.filterChip,
                isDark ? styles.chipDark : styles.chipLight,
                isSelected && styles.chipSelected,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveFilter(tab.key);
              }}
            >
              <Text
                style={[
                  styles.filterChipText,
                  isDark && styles.textDark,
                  isSelected && styles.filterChipTextSelected,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Contacts Cards Stack */}
      {isContactsLoading ? (
        <ActivityIndicator size="large" color="#8B5CF6" style={{ marginTop: 32 }} />
      ) : (
        <View style={styles.cardsStack}>
          {filteredContacts.map((cnt) => (
            <Pressable
              key={cnt.id}
              style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedContact(cnt);
              }}
            >
              <View style={styles.cardHeaderRow}>
                <View style={[styles.avatarBox, { backgroundColor: 'rgba(139, 92, 246, 0.12)' }]}>
                  <Ionicons name="person" size={20} color="#8B5CF6" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.cntName, isDark && styles.textDark]}>{cnt.name}</Text>
                  <Text style={styles.cntPhone}>{cnt.phone}</Text>
                </View>

                {/* Direct Call Button */}
                <Pressable
                  style={[styles.callBtn, { backgroundColor: '#8B5CF6' }]}
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setCallTarget({ phone: cnt.phone, name: cnt.name });
                  }}
                >
                  <Ionicons name="call" size={14} color="#FFFFFF" />
                  <Text style={styles.callBtnText}>Call</Text>
                </Pressable>
              </View>

              {cnt.company || cnt.email ? (
                <View style={styles.metaRow}>
                  {cnt.company ? (
                    <View style={styles.metaBadge}>
                      <Ionicons name="business-outline" size={12} color="#64748B" />
                      <Text style={styles.metaBadgeText}>{cnt.company}</Text>
                    </View>
                  ) : null}
                  {cnt.email ? (
                    <View style={styles.metaBadge}>
                      <Ionicons name="mail-outline" size={12} color="#64748B" />
                      <Text style={styles.metaBadgeText}>{cnt.email}</Text>
                    </View>
                  ) : null}
                </View>
              ) : null}

              {cnt.notes ? (
                <Text style={styles.notesSnippet} numberOfLines={2}>
                  "{cnt.notes}"
                </Text>
              ) : null}

              <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

              <View style={styles.cardFooter}>
                <Text style={styles.footerStat}>
                  {cnt.campaigns_count || 0} Campaigns • {cnt.calls_count || 0} Calls
                </Text>
                <View style={styles.footerActions}>
                  <Pressable
                    style={styles.iconBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setEditingContact(cnt);
                    }}
                  >
                    <Ionicons name="create-outline" size={16} color="#8E8E93" />
                  </Pressable>
                  <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                </View>
              </View>
            </Pressable>
          ))}

          {filteredContacts.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={42} color="#8E8E93" />
              <Text style={styles.emptyTitle}>No Contacts Found</Text>
              <Text style={styles.emptySub}>
                {searchQuery ? 'Try matching a different contact name or phone.' : 'Add your first voice telecalling lead or customer.'}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Modals */}
      <CreateContactModal
        visible={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={async (payload) => {
          await createContactMutation.mutateAsync(payload);
        }}
        isLoading={createContactMutation.isPending}
      />

      <EditContactModal
        visible={Boolean(editingContact)}
        contact={editingContact}
        onClose={() => setEditingContact(null)}
        onSubmit={async (contactId, payload) => {
          await updateContactMutation.mutateAsync({ id: contactId, payload });
        }}
        isLoading={updateContactMutation.isPending}
      />

      <ContactDetailsModal
        visible={Boolean(selectedContact)}
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onCall={(cnt) => {
          setSelectedContact(null);
          setCallTarget({ phone: cnt.phone, name: cnt.name });
        }}
        onEdit={(cnt) => {
          setSelectedContact(null);
          setEditingContact(cnt);
        }}
        onDelete={async (id) => {
          await deleteContactMutation.mutateAsync(id);
        }}
        onInspectCall={(call) => setInspectedCall(call)}
      />

      {/* Direct Outbound Trigger Modal */}
      <TriggerCallModal
        visible={Boolean(callTarget)}
        assistants={assistants}
        initialPhone={callTarget?.phone || ''}
        initialName={callTarget?.name || ''}
        onClose={() => setCallTarget(null)}
        onSubmit={async (payload) => {
          await triggerCallMutation.mutateAsync(payload);
        }}
        isLoading={triggerCallMutation.isPending}
      />

      <CallDetailsModal
        visible={Boolean(inspectedCall)}
        call={inspectedCall}
        onClose={() => setInspectedCall(null)}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#020617' },
  contentContainer: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 130, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeaderTitle: { fontSize: 10.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  mainTitle: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  textDark: { color: '#F8FAFC' },
  createBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  createBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingHorizontal: 12, borderRadius: 12, borderWidth: 1 },
  searchBarLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  searchBarDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  searchInput: { flex: 1, fontSize: 13.5 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  chipLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  chipDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  chipSelected: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#64748B' },
  filterChipTextSelected: { color: '#FFFFFF', fontWeight: '700' },
  cardsStack: { gap: 10 },
  card: { borderRadius: 16, padding: 14, borderWidth: 1 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  cntName: { fontSize: 15, fontWeight: '700' },
  cntPhone: { fontSize: 12.5, color: '#64748B', marginTop: 2 },
  callBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  callBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  metaRow: { flexDirection: 'row', gap: 8, marginTop: 10, flexWrap: 'wrap' },
  metaBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(100, 116, 139, 0.1)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  metaBadgeText: { fontSize: 11, color: '#64748B', fontWeight: '500' },
  notesSnippet: { fontSize: 11.5, color: '#94A3B8', fontStyle: 'italic', marginTop: 8, lineHeight: 16 },
  divider: { height: 1, marginVertical: 10 },
  dividerLight: { backgroundColor: '#E2E8F0' },
  dividerDark: { backgroundColor: '#1E293B' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  footerStat: { fontSize: 11.5, color: '#64748B', fontWeight: '500' },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  iconBtn: { padding: 4 },
  emptyContainer: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#64748B' },
  emptySub: { fontSize: 12.5, color: '#94A3B8', textAlign: 'center' },
});
