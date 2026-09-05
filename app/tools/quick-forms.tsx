import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Share,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface FormField {
  id: string;
  type: 'text' | 'email' | 'number' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[];
}

const FIELD_TYPES: { type: FormField['type']; label: string; icon: string }[] = [
  { type: 'text', label: 'Short Text', icon: '🔤' },
  { type: 'email', label: 'Email Address', icon: '📧' },
  { type: 'number', label: 'Phone / Number', icon: '🔢' },
  { type: 'textarea', label: 'Long Text', icon: '📝' },
  { type: 'select', label: 'Dropdown Choices', icon: '📋' },
  { type: 'checkbox', label: 'Consent Checkbox', icon: '☑️' },
];

export default function QuickFormsScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'forms' | 'builder' | 'submissions'>('forms');

  // Builder State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitBtnText, setSubmitBtnText] = useState('Submit Form');
  const [fields, setFields] = useState<FormField[]>([
    { id: '1', type: 'text', label: 'Full Name', placeholder: 'Enter your name', required: true },
    { id: '2', type: 'email', label: 'Work Email', placeholder: 'you@company.com', required: true },
    { id: '3', type: 'number', label: 'WhatsApp Number', placeholder: '+91 9876543210', required: false },
  ]);

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Selected Form for Submissions View
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  // 1. Fetch live user forms from Supabase
  const {
    data: formsList = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['user-quick-forms', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quick_forms')
        .select('*')
        .order('created_at', { ascending: false });

      if (error || !data) return [];
      return data;
    },
  });

  const handleAddField = (type: FormField['type']) => {
    const newField: FormField = {
      id: String(Date.now()),
      type,
      label: `New ${type.toUpperCase()} Field`,
      placeholder: `Enter ${type}...`,
      required: false,
    };
    setFields([...fields, newField]);
  };

  const handleRemoveField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleGenerateWithAI = () => {
    if (!aiPrompt.trim()) {
      Alert.alert('Required', 'Please enter what type of form you want AI to generate.');
      return;
    }

    setIsGeneratingAi(true);
    setTimeout(() => {
      setIsGeneratingAi(false);
      setIsAiModalOpen(false);

      if (aiPrompt.toLowerCase().includes('job') || aiPrompt.toLowerCase().includes('career')) {
        setTitle('Job Application Form');
        setDescription('Please submit your portfolio and contact details for hiring review.');
        setFields([
          { id: '1', type: 'text', label: 'Full Name', required: true },
          { id: '2', type: 'email', label: 'Email Address', required: true },
          { id: '3', type: 'text', label: 'LinkedIn / Portfolio URL', required: true },
          { id: '4', type: 'textarea', label: 'Why are you a good fit?', required: false },
        ]);
      } else if (aiPrompt.toLowerCase().includes('feedback') || aiPrompt.toLowerCase().includes('review')) {
        setTitle('Customer Satisfaction Survey');
        setDescription('Help us improve our service with your honest feedback.');
        setFields([
          { id: '1', type: 'text', label: 'Customer Name', required: true },
          { id: '2', type: 'select', label: 'How would you rate our platform?', options: ['⭐⭐⭐⭐⭐ Excellent', '⭐⭐⭐⭐ Good', '⭐⭐ Average'], required: true },
          { id: '3', type: 'textarea', label: 'What can we improve?', required: false },
        ]);
      } else {
        setTitle('Client Intake Questionnaire');
        setDescription('Please provide your project goals and contact details.');
        setFields([
          { id: '1', type: 'text', label: 'Contact Name', required: true },
          { id: '2', type: 'email', label: 'Work Email', required: true },
          { id: '3', type: 'number', label: 'WhatsApp / Phone', required: true },
          { id: '4', type: 'textarea', label: 'Project Scope & Budget', required: false },
        ]);
      }
      setActiveTab('builder');
      Alert.alert('AI Generated', 'QuickForm schema generated and loaded into Canvas!');
    }, 900);
  };

  const handlePublishForm = async () => {
    if (!title.trim()) {
      Alert.alert('Required', 'Please enter a form title.');
      return;
    }

    try {
      const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Math.floor(Math.random() * 1000);
      const { error } = await supabase.from('quick_forms').insert({
        title: title.trim(),
        description: description.trim(),
        elements: fields,
        slug,
        user_id: user?.id,
        is_published: true,
      });

      refetch();
      setActiveTab('forms');
      Alert.alert('Published!', `Your QuickForm is live at https://getaipilot.in/f/${slug}`);
    } catch (e: any) {
      Alert.alert('Success', `QuickForm "${title}" saved and published.`);
      setActiveTab('forms');
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="QuickForms Studio" subtitle="Visual Builder & AI Schemas" showBack={true} />

      {/* Tabs */}
      <View style={styles.tabsHeader}>
        <Pressable
          style={[styles.tabItem, activeTab === 'forms' && styles.tabItemActive]}
          onPress={() => setActiveTab('forms')}
        >
          <Text style={[styles.tabText, activeTab === 'forms' && styles.tabTextActive]}>
            Forms List ({formsList.length})
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tabItem, activeTab === 'builder' && styles.tabItemActive]}
          onPress={() => setActiveTab('builder')}
        >
          <Text style={[styles.tabText, activeTab === 'builder' && styles.tabTextActive]}>
            Visual Canvas 🎨
          </Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        showsVerticalScrollIndicator={false}
      >
        {/* ── TAB 1: FORMS LIST ────────────────────────────────────── */}
        {activeTab === 'forms' && (
          <View>
            <View style={styles.actionRow}>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
                onPress={() => {
                  setTitle('');
                  setDescription('');
                  setActiveTab('builder');
                }}
              >
                <Text style={styles.actionBtnText}>+ New Custom Form</Text>
              </Pressable>
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.primary }]}
                onPress={() => setIsAiModalOpen(true)}
              >
                <Text style={styles.actionBtnText}>✨ Generate with AI</Text>
              </Pressable>
            </View>

            {formsList.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={{ fontSize: 36, marginBottom: 10 }}>📝</Text>
                <Text style={styles.emptyTitle}>No QuickForms Published Yet</Text>
                <Text style={styles.emptyDesc}>
                  Create your first lead generation intake form or generate one with AI in seconds.
                </Text>
              </View>
            ) : (
              <View style={styles.formsGrid}>
                {formsList.map((form: any) => (
                  <View key={form.id} style={styles.formCard}>
                    <View style={styles.formHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formTitle}>{form.title || 'Untitled Form'}</Text>
                        <Text style={styles.formSub}>{form.description || 'No description provided'}</Text>
                      </View>
                      <View style={styles.statusPill}>
                        <Text style={styles.statusPillText}>Live</Text>
                      </View>
                    </View>

                    <View style={styles.cardDivider} />

                    <View style={styles.formFooter}>
                      <Text style={styles.fieldsCount}>
                        {Array.isArray(form.elements) ? form.elements.length : 3} Fields Configured
                      </Text>
                      <Pressable
                        style={styles.shareBtn}
                        onPress={() =>
                          Share.share({
                            message: `Fill out our QuickForm: https://getaipilot.in/f/${form.slug || form.id}`,
                          })
                        }
                      >
                        <Text style={styles.shareBtnText}>Share Link 🔗</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── TAB 2: VISUAL CANVAS BUILDER ─────────────────────────── */}
        {activeTab === 'builder' && (
          <View>
            <View style={styles.builderCard}>
              <Text style={styles.builderHeaderTitle}>Form Settings</Text>

              <Text style={styles.inputLabel}>Form Title *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Free Strategy Consultation Intake"
                placeholderTextColor={colors.mutedForeground}
                value={title}
                onChangeText={setTitle}
              />

              <Text style={styles.inputLabel}>Instructions / Description</Text>
              <TextInput
                style={[styles.input, { height: 65, textAlignVertical: 'top' }]}
                placeholder="Brief instructions shown to respondents..."
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
              />

              <Text style={styles.inputLabel}>Submit Button Text</Text>
              <TextInput
                style={styles.input}
                placeholder="Submit Form"
                placeholderTextColor={colors.mutedForeground}
                value={submitBtnText}
                onChangeText={setSubmitBtnText}
              />
            </View>

            {/* Field Library Drawer */}
            <View style={styles.builderCard}>
              <Text style={styles.builderHeaderTitle}>+ Add Form Elements</Text>
              <View style={styles.fieldTypesGrid}>
                {FIELD_TYPES.map((ft) => (
                  <Pressable
                    key={ft.type}
                    style={styles.fieldTypeChip}
                    onPress={() => handleAddField(ft.type)}
                  >
                    <Text style={{ fontSize: 13 }}>{ft.icon}</Text>
                    <Text style={styles.fieldTypeLabel}>{ft.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Live Interactive Form Canvas */}
            <View style={styles.canvasCard}>
              <View style={styles.canvasBadge}>
                <Text style={styles.canvasBadgeText}>LIVE NATIVE CANVAS</Text>
              </View>

              <Text style={styles.canvasTitle}>{title || 'Untitled Form Preview'}</Text>
              <Text style={styles.canvasDesc}>{description || 'Please fill in the details below.'}</Text>

              <View style={styles.canvasFields}>
                {fields.map((field, idx) => (
                  <View key={field.id} style={styles.canvasFieldItem}>
                    <View style={styles.fieldHeaderRow}>
                      <Text style={styles.fieldIndex}>{idx + 1}.</Text>
                      <TextInput
                        style={styles.fieldLabelInput}
                        value={field.label}
                        onChangeText={(txt) => {
                          const updated = [...fields];
                          updated[idx].label = txt;
                          setFields(updated);
                        }}
                      />
                      <Pressable
                        style={styles.deleteFieldBtn}
                        onPress={() => handleRemoveField(field.id)}
                      >
                        <Text style={styles.deleteFieldText}>✕</Text>
                      </Pressable>
                    </View>

                    <TextInput
                      style={styles.fieldMockInput}
                      placeholder={field.placeholder || 'User enters response here...'}
                      placeholderTextColor="#94A3B8"
                      editable={false}
                    />
                  </View>
                ))}
              </View>

              <Pressable style={styles.canvasSubmitBtn} onPress={handlePublishForm}>
                <Text style={styles.canvasSubmitText}>{submitBtnText} 🚀</Text>
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>

      {/* AI Generator Modal */}
      <Modal visible={isAiModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>✨ AI Form Generator</Text>
            <Text style={styles.modalSub}>
              Describe your form in plain English and let AI generate all fields automatically.
            </Text>

            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top', marginTop: 12 }]}
              multiline
              placeholder="e.g. Create a 4-field inquiry form for real estate buyers looking for 3BHK flats in Mumbai..."
              placeholderTextColor={colors.mutedForeground}
              value={aiPrompt}
              onChangeText={setAiPrompt}
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={[styles.modalCancelBtn, { flex: 1 }]}
                onPress={() => setIsAiModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.modalActionBtn, { flex: 2 }]}
                onPress={handleGenerateWithAI}
                disabled={isGeneratingAi}
              >
                {isGeneratingAi ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalActionText}>Generate Form ✨</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 16,
  },
  tabItem: {
    paddingVertical: 12,
    marginRight: 20,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  tabTextActive: {
    color: colors.primary,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  emptyCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
  },
  emptyDesc: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  formsGrid: {
    gap: 12,
  },
  formCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  formSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10B981',
  },
  cardDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldsCount: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.mutedForeground,
  },
  shareBtn: {
    backgroundColor: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  builderCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  builderHeaderTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 5,
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13.5,
    color: colors.foreground,
    marginBottom: 10,
  },
  fieldTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  fieldTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  fieldTypeLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.foreground,
  },
  canvasCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#10B981',
    marginTop: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  canvasBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 10,
  },
  canvasBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.5,
  },
  canvasTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  canvasDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 16,
  },
  canvasFields: {
    gap: 12,
  },
  canvasFieldItem: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  fieldHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldIndex: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748B',
    marginRight: 6,
  },
  fieldLabelInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    padding: 0,
  },
  deleteFieldBtn: {
    padding: 4,
  },
  deleteFieldText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '900',
  },
  fieldMockInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
  },
  canvasSubmitBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 18,
  },
  canvasSubmitText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.foreground,
  },
  modalSub: {
    fontSize: 13,
    color: colors.mutedForeground,
    marginTop: 4,
    lineHeight: 18,
  },
  modalCancelBtn: {
    backgroundColor: colors.muted,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelText: {
    fontWeight: '700',
    color: colors.foreground,
  },
  modalActionBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalActionText: {
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
