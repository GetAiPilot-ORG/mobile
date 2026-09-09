import { useMutation, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { whatsappApi } from '../api/whatsapp.api';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';
import { useWhatsAppUsage } from '../hooks/useWhatsAppUsage';
import { WhatsAppTemplate } from '../types';

interface CreateBroadcastScreenProps {
  onBack?: () => void;
  onCreated?: () => void;
}

export const CreateBroadcastScreen: React.FC<CreateBroadcastScreenProps> = ({
  onBack,
  onCreated,
}) => {
  const router = useRouter();
  const handleBack = onBack || (() => router.back());
  const handleCreated = onCreated || (() => router.back());
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate | null>(null);
  const [selectedTag, setSelectedTag] = useState('All');
  const [scheduleTime, setScheduleTime] = useState('');

  const { data: templates, isLoading: templatesLoading } = useWhatsAppTemplates('APPROVED');
  const { data: usage } = useWhatsAppUsage();

  const tags = ['All', 'VIP', 'Enterprise', 'Lead', 'Retail', 'High-Value', 'Agency', 'Creator'];

  const estimatedRecipients = selectedTag === 'All' ? 850 : 150;
  const estimatedCostInRupees = (estimatedRecipients * 0.8).toFixed(2);
  const walletBalance = usage?.credits_balance || 2500;
  const hasSufficientBalance = walletBalance >= parseFloat(estimatedCostInRupees);

  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error('Please enter a campaign name');
      if (!selectedTemplate) throw new Error('Please select an approved template');

      const idempotencyKey = `mobile_bc_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      return await whatsappApi.createBroadcast(
        {
          name: name.trim(),
          template_name: selectedTemplate.name,
          template_language: selectedTemplate.language,
          audience_tag: selectedTag === 'All' ? undefined : selectedTag,
          audience_type: selectedTag === 'All' ? 'all' : 'tag',
          scheduled_at: scheduleTime ? scheduleTime : undefined,
        },
        idempotencyKey
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp_broadcasts'] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp_usage'] });
      queryClient.invalidateQueries({ queryKey: ['unified_dashboard'] });
      handleCreated();
    },
    onError: (err: any) => {
      Alert.alert('Campaign Creation Failed', err.message || 'An error occurred while creating broadcast');
    },
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backText}>← Cancel</Text>
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.title}>New Broadcast</Text>
          <Text style={styles.subtitle}>Meta Verified Delivery</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Field 1: Name */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Campaign Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Festive Product Launch Announcement"
            placeholderTextColor="#64748b"
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Field 2: Audience Segment */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Audience Segment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
            {tags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <Pressable
                  key={tag}
                  style={[styles.tagChip, isSelected && styles.tagChipActive]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text style={[styles.tagText, isSelected && styles.tagTextActive]}>{tag}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Field 3: Template Selector */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Select Approved Meta Template</Text>
          {templatesLoading ? (
            <ActivityIndicator size="small" color="#25d366" />
          ) : (
            <View style={styles.templateList}>
              {(templates || []).map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <Pressable
                    key={tpl.id}
                    style={[styles.templateOption, isSelected && styles.templateOptionActive]}
                    onPress={() => setSelectedTemplate(tpl)}
                  >
                    <View style={styles.templateRadio}>
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterActive]}>
                        {isSelected ? <View style={styles.radioInner} /> : null}
                      </View>
                    </View>
                    <View style={styles.templateTextContainer}>
                      <Text style={styles.templateName}>{tpl.name}</Text>
                      <Text style={styles.templateCategory}>
                        {tpl.category} • {tpl.language} • {tpl.status}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        {/* Cost & Wallet Card */}
        <View style={styles.estimateCard}>
          <Text style={styles.estimateTitle}>Billing & Delivery Estimate</Text>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Estimated Audience</Text>
            <Text style={styles.estimateValue}>{estimatedRecipients} Contacts</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Estimated Cost</Text>
            <Text style={styles.estimateValue}>₹{estimatedCostInRupees}</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={styles.estimateLabel}>Available Balance</Text>
            <Text style={[styles.estimateValue, { color: hasSufficientBalance ? '#10b981' : '#ef4444' }]}>
              ₹{walletBalance.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <Pressable
          style={[
            styles.submitButton,
            (!name.trim() || !selectedTemplate || createMutation.isPending || !hasSufficientBalance) &&
              styles.submitButtonDisabled,
          ]}
          disabled={!name.trim() || !selectedTemplate || createMutation.isPending || !hasSufficientBalance}
          onPress={() => createMutation.mutate()}
        >
          {createMutation.isPending ? (
            <ActivityIndicator size="small" color="#020617" />
          ) : (
            <Text style={styles.submitButtonText}>
              {hasSufficientBalance ? 'Launch Broadcast Campaign' : 'Insufficient Balance'}
            </Text>
          )}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
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
  headerTitleContainer: {
    flex: 1,
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
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 14,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tagRow: {
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#0f172a',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tagChipActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  tagText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    color: '#020617',
    fontWeight: '800',
  },
  templateList: {
    gap: 10,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  templateOptionActive: {
    borderColor: '#25d366',
    backgroundColor: '#0a1a14',
  },
  templateRadio: {
    marginRight: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#475569',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterActive: {
    borderColor: '#25d366',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#25d366',
  },
  templateTextContainer: {
    flex: 1,
  },
  templateName: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  templateCategory: {
    color: '#94a3b8',
    fontSize: 11,
  },
  estimateCard: {
    backgroundColor: '#0b1329',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 24,
  },
  estimateTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  estimateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  estimateLabel: {
    color: '#94a3b8',
    fontSize: 13,
  },
  estimateValue: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  submitButton: {
    backgroundColor: '#25d366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: '#020617',
    fontSize: 15,
    fontWeight: '800',
  },
});
