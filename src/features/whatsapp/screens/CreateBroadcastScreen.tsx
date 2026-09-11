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
  useColorScheme,
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
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
  const walletBalance = usage?.credits_balance ?? 0;
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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <Pressable
          style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
          onPress={handleBack}
        >
          <Text style={[styles.backText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>← Cancel</Text>
        </Pressable>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>New Broadcast</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Meta Verified Delivery</Text>
        </View>
      </View>

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {/* Field 1: Name */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>Campaign Name</Text>
          <TextInput
            style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
            placeholder="e.g. Festive Product Launch Announcement"
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={name}
            onChangeText={setName}
          />
        </View>

        {/* Field 2: Audience Segment */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>Audience Segment</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tagRow}>
            {tags.map((tag) => {
              const isSelected = selectedTag === tag;
              return (
                <Pressable
                  key={tag}
                  style={[
                    styles.tagChip,
                    isDark ? styles.tagChipDark : styles.tagChipLight,
                    isSelected && styles.tagChipActive,
                  ]}
                  onPress={() => setSelectedTag(tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      { color: isSelected ? '#020617' : isDark ? '#94a3b8' : '#64748b' },
                      isSelected && styles.tagTextActive,
                    ]}
                  >
                    {tag}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Field 3: Template Selector */}
        <View style={styles.formGroup}>
          <Text style={[styles.label, { color: isDark ? '#cbd5e1' : '#334155' }]}>Select Approved Meta Template</Text>
          {templatesLoading ? (
            <ActivityIndicator size="small" color="#25d366" />
          ) : (
            <View style={styles.templateList}>
              {(templates || []).map((tpl) => {
                const isSelected = selectedTemplate?.id === tpl.id;
                return (
                  <Pressable
                    key={tpl.id}
                    style={[
                      styles.templateOption,
                      isDark ? styles.templateOptionDark : styles.templateOptionLight,
                      isSelected && (isDark ? styles.templateOptionActiveDark : styles.templateOptionActiveLight),
                    ]}
                    onPress={() => setSelectedTemplate(tpl)}
                  >
                    <View style={styles.templateRadio}>
                      <View
                        style={[
                          styles.radioOuter,
                          { borderColor: isSelected ? '#25d366' : isDark ? '#475569' : '#cbd5e1' },
                        ]}
                      >
                        {isSelected ? <View style={styles.radioInner} /> : null}
                      </View>
                    </View>
                    <View style={styles.templateTextContainer}>
                      <Text style={[styles.templateName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{tpl.name}</Text>
                      <Text style={[styles.templateCategory, { color: isDark ? '#94a3b8' : '#64748b' }]}>
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
        <View style={[styles.estimateCard, isDark ? styles.estimateCardDark : styles.estimateCardLight]}>
          <Text style={[styles.estimateTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Billing & Delivery Estimate</Text>
          <View style={styles.estimateRow}>
            <Text style={[styles.estimateLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Estimated Audience</Text>
            <Text style={[styles.estimateValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{estimatedRecipients} Contacts</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={[styles.estimateLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Estimated Cost</Text>
            <Text style={[styles.estimateValue, { color: isDark ? '#f8fafc' : '#0f172a' }]}>₹{estimatedCostInRupees}</Text>
          </View>
          <View style={styles.estimateRow}>
            <Text style={[styles.estimateLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Available Balance</Text>
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerDark: {
    backgroundColor: '#0b1329',
    borderBottomColor: '#1e293b',
  },
  headerLight: {
    backgroundColor: '#ffffff',
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
    backgroundColor: '#f1f5f9',
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 130,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  inputDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  inputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  tagRow: {
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
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
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tagTextActive: {
    fontWeight: '800',
  },
  templateList: {
    gap: 10,
  },
  templateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  templateOptionDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  templateOptionLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  templateOptionActiveDark: {
    borderColor: '#25d366',
    backgroundColor: '#0a1a14',
  },
  templateOptionActiveLight: {
    borderColor: '#25d366',
    backgroundColor: '#f0fdf4',
  },
  templateRadio: {
    marginRight: 12,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  templateCategory: {
    fontSize: 11,
  },
  estimateCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  estimateCardDark: {
    backgroundColor: '#0b1329',
    borderColor: '#1e293b',
  },
  estimateCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  estimateTitle: {
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
    fontSize: 13,
  },
  estimateValue: {
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
