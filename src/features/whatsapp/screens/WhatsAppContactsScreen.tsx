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
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          {onBack ? (
            <Pressable style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          ) : null}
          <View>
            <Text style={styles.title}>WhatsApp Contacts</Text>
            <Text style={styles.subtitle}>Audience & CRM Federation</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts by name or phone..."
            placeholderTextColor="#64748b"
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
                style={[styles.tagChip, isSelected && styles.tagChipActive]}
                onPress={() => setSelectedTag(item === 'All' ? undefined : item)}
              >
                <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>
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
            <Text style={styles.loadingText}>Loading contacts...</Text>
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
                <Text style={styles.emptyText}>No contacts found matching your query</Text>
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
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Convert to CRM Deal</Text>
              <Text style={styles.modalSubtitle}>
                Create a high-value sales lead from this WhatsApp contact.
              </Text>

              {leadCreatedSuccess ? (
                <View style={styles.successBox}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>CRM Lead Created & Linked!</Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Customer Name</Text>
                  <View style={styles.readOnlyInput}>
                    <Text style={styles.readOnlyText}>{selectedContactForCRM?.name || 'Contact'}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Phone Number</Text>
                  <View style={styles.readOnlyInput}>
                    <Text style={styles.readOnlyText}>{selectedContactForCRM?.phone}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Estimated Deal Value (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 50000"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={dealValue}
                    onChangeText={setDealValue}
                  />

                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => setSelectedContactForCRM(null)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
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
    backgroundColor: '#020617',
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
    borderBottomColor: '#1e293b',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginRight: 12,
  },
  backText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    fontSize: 11,
    color: '#94a3b8',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tagList: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tagChipActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  tagChipText: {
    color: '#94a3b8',
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
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 18,
  },
  formGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  readOnlyInput: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  readOnlyText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
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
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
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
