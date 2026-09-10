import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { crmApi } from '../../crm/api/crm.api';
import { ContactCard } from '../components/ContactCard';
import { useWhatsAppContacts } from '../hooks/useWhatsAppContacts';
import { WhatsAppContact } from '../types';

interface WhatsAppContactsScreenProps {
  onBack?: () => void;
  onOpenChat?: (contact: WhatsAppContact) => void;
}

export const WhatsAppContactsScreen: React.FC<WhatsAppContactsScreenProps> = ({
  onBack,
  onOpenChat,
}) => {
  const queryClient = useQueryClient();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);

  // CRM Lead Convert Modal
  const [selectedContactForCRM, setSelectedContactForCRM] = useState<WhatsAppContact | null>(null);
  const [dealValue, setDealValue] = useState('35000');
  const [leadCreatedSuccess, setLeadCreatedSuccess] = useState(false);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppContacts({
    search: searchQuery || undefined,
    tag: selectedTag,
  });

  const createCrmLeadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedContactForCRM) return;
      return await crmApi.createLead({
        name: selectedContactForCRM.name || selectedContactForCRM.phone,
        phone: selectedContactForCRM.phone,
        value: parseFloat(dealValue) || 35000,
        source: 'WHATSAPP',
        status: 'open',
      });
    },
    onSuccess: () => {
      setLeadCreatedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['whatsapp_contacts'] });
      queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
      queryClient.invalidateQueries({ queryKey: ['unified_dashboard'] });
      setTimeout(() => {
        setSelectedContactForCRM(null);
        setLeadCreatedSuccess(false);
      }, 1500);
    },
  });

  const tags = ['All', 'VIP', 'Enterprise', 'Lead', 'Retail', 'High-Value', 'Agency', 'Creator'];

  const contacts = data?.contacts || [];

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          {onBack ? (
            <Pressable
              style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
              onPress={onBack}
            >
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          ) : null}
          <View>
            <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>WhatsApp Contacts</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Audience & CRM Federation
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
            placeholder="Search contacts by name or phone..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tag Filters */}
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={tags}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.tagList}
          renderItem={({ item }) => {
            const isSelected = item === 'All' ? !selectedTag : selectedTag === item;
            return (
              <Pressable
                style={[
                  styles.tagChip,
                  isDark ? styles.tagChipDark : styles.tagChipLight,
                  isSelected && styles.tagChipActive,
                ]}
                onPress={() => setSelectedTag(item === 'All' ? undefined : item)}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    { color: isDark ? '#94a3b8' : '#64748b' },
                    isSelected && styles.tagChipTextActive,
                  ]}
                >
                  {item}
                </Text>
              </Pressable>
            );
          }}
        />

        {/* Contacts List */}
        {isLoading && !data ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#25d366" />
            <Text style={[styles.loadingText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
              Loading contacts...
            </Text>
          </View>
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactCard
                contact={item}
                onOpenCRM={(c) => setSelectedContactForCRM(c)}
                onOpenChat={onOpenChat}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#25d366" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  No contacts found matching your query
                </Text>
              </View>
            }
          />
        )}

        {/* Convert to CRM Lead Modal */}
        <Modal
          visible={!!selectedContactForCRM}
          transparent
          animationType="fade"
          onRequestClose={() => setSelectedContactForCRM(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark ? styles.modalContentDark : styles.modalContentLight]}>
              <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Convert to CRM Deal
              </Text>
              <Text style={[styles.modalSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Create a high-value sales lead from this WhatsApp contact.
              </Text>

              {leadCreatedSuccess ? (
                <View style={styles.successBox}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>CRM Lead Created & Linked!</Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={[styles.inputLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Customer Name
                  </Text>
                  <View style={[styles.readOnlyInput, isDark ? styles.inputBgDark : styles.inputBgLight]}>
                    <Text style={[styles.readOnlyText, { color: isDark ? '#e2e8f0' : '#0f172a' }]}>
                      {selectedContactForCRM?.name || 'Contact'}
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Phone Number
                  </Text>
                  <View style={[styles.readOnlyInput, isDark ? styles.inputBgDark : styles.inputBgLight]}>
                    <Text style={[styles.readOnlyText, { color: isDark ? '#e2e8f0' : '#0f172a' }]}>
                      {selectedContactForCRM?.phone}
                    </Text>
                  </View>

                  <Text style={[styles.inputLabel, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                    Estimated Deal Value (₹)
                  </Text>
                  <TextInput
                    style={[styles.modalInput, isDark ? styles.inputBgDark : styles.inputBgLight, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    placeholder="e.g. 50000"
                    placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                    keyboardType="numeric"
                    value={dealValue}
                    onChangeText={setDealValue}
                  />

                  <View style={styles.modalActions}>
                    <Pressable
                      style={[styles.cancelButton, isDark ? styles.cancelButtonDark : styles.cancelButtonLight]}
                      onPress={() => setSelectedContactForCRM(null)}
                    >
                      <Text style={[styles.cancelButtonText, { color: isDark ? '#94a3b8' : '#64748b' }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.confirmButton,
                        createCrmLeadMutation.isPending && styles.confirmButtonDisabled,
                      ]}
                      disabled={createCrmLeadMutation.isPending}
                      onPress={() => createCrmLeadMutation.mutate()}
                    >
                      {createCrmLeadMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.confirmButtonText}>Create CRM Lead</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
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
    borderBottomWidth: 1,
  },
  headerDark: {
    borderBottomColor: '#1e293b',
  },
  headerLight: {
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  backButtonDark: {
    backgroundColor: '#1e293b',
  },
  backButtonLight: {
    backgroundColor: '#e2e8f0',
  },
  backText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  searchInputDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  searchInputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  tagList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tagChipDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  tagChipLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  tagChipActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagChipTextActive: {
    color: '#020617',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
  },
  modalContentDark: {
    backgroundColor: '#0b1329',
    borderColor: '#1e293b',
  },
  modalContentLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    marginBottom: 18,
  },
  formGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  readOnlyInput: {
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
  },
  inputBgDark: {
    backgroundColor: '#020617',
    borderColor: '#1e293b',
  },
  inputBgLight: {
    backgroundColor: '#f8fafc',
    borderColor: '#e2e8f0',
  },
  readOnlyText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    borderWidth: 1,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  cancelButtonDark: {
    backgroundColor: '#1e293b',
  },
  cancelButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#25d366',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#020617',
    fontSize: 14,
    fontWeight: '800',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 36,
    color: '#10b981',
    marginBottom: 10,
  },
  successText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
  },
});

