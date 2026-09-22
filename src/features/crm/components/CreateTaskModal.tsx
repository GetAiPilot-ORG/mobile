import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMTask, TaskPriority } from '../types';
import { useMembers } from '../hooks/useMembers';
import { useContacts } from '../hooks/useContacts';
import { DatePickerField } from '../../../components/DatePickerModal';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<CRMTask>) => Promise<void>;
  defaultContactId?: string;
  defaultDealId?: string;
  isLoading?: boolean;
}

const PRIORITIES: Array<{ key: TaskPriority; label: string; color: string }> = [
  { key: 'low', label: 'Low', color: '#9CA3AF' },
  { key: 'medium', label: 'Medium', color: '#60A5FA' },
  { key: 'high', label: 'High', color: '#FBBF24' },
  { key: 'urgent', label: 'Urgent', color: '#F87171' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultDealId,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [contactId, setContactId] = useState<string>(defaultContactId || '');
  const [dealId] = useState<string>(defaultDealId || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: members } = useMembers();
  const { data: contactsData } = useContacts({ limit: 50 });

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setContactId(defaultContactId || '');
    setAssignedTo('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Task title is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: 'todo',
        due_date: dueDate.trim() || null,
        contact_id: contactId || null,
        deal_id: dealId || null,
        assigned_to: assignedTo || null,
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create task');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)' }]}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: isDark ? '#181A20' : '#FFFFFF',
              borderColor: isDark ? '#262A34' : '#E2E8F0',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Create Task</Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
                Set follow-ups and action items
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#64748B'} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Task Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#121316' : '#F8FAFC',
                    borderColor: isDark ? '#262A34' : '#CBD5E1',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                  },
                ]}
                placeholder="e.g. Follow up on demo feedback"
                placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Priority */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      style={[
                        styles.priorityOption,
                        {
                          backgroundColor: isSelected
                            ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                            : isDark ? '#222630' : '#F1F5F9',
                          borderColor: isSelected ? '#3B82F6' : 'transparent',
                        },
                      ]}
                      onPress={() => setPriority(p.key)}
                    >
                      <Text
                        style={[
                          styles.priorityOptionText,
                          {
                            color: isSelected ? p.color : isDark ? '#9CA3AF' : '#64748B',
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Due Date Picker */}
            <DatePickerField
              label="Due Date"
              value={dueDate}
              onChangeDate={setDueDate}
              placeholder="Pick a due date..."
            />

            {/* Link Contact */}
            {contactsData?.contacts && contactsData.contacts.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Link Contact / Lead</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: contactId === ''
                          ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                          : isDark ? '#222630' : '#F1F5F9',
                        borderColor: contactId === '' ? '#3B82F6' : 'transparent',
                      },
                    ]}
                    onPress={() => setContactId('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: contactId === '' ? '#3B82F6' : isDark ? '#9CA3AF' : '#64748B',
                          fontWeight: contactId === '' ? '600' : '500',
                        },
                      ]}
                    >
                      None
                    </Text>
                  </Pressable>
                  {contactsData.contacts.map((c) => {
                    const isSelected = contactId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected
                              ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                              : isDark ? '#222630' : '#F1F5F9',
                            borderColor: isSelected ? '#3B82F6' : 'transparent',
                          },
                        ]}
                        onPress={() => setContactId(c.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? '#3B82F6' : isDark ? '#9CA3AF' : '#64748B',
                              fontWeight: isSelected ? '600' : '500',
                            },
                          ]}
                        >
                          {c.name || `${c.first_name} ${c.last_name}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Assignee */}
            {members && members.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Assign to</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: assignedTo === ''
                          ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                          : isDark ? '#222630' : '#F1F5F9',
                        borderColor: assignedTo === '' ? '#3B82F6' : 'transparent',
                      },
                    ]}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: assignedTo === '' ? '#3B82F6' : isDark ? '#9CA3AF' : '#64748B',
                          fontWeight: assignedTo === '' ? '600' : '500',
                        },
                      ]}
                    >
                      Myself
                    </Text>
                  </Pressable>
                  {members.map((m) => {
                    const isSelected = assignedTo === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected
                              ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                              : isDark ? '#222630' : '#F1F5F9',
                            borderColor: isSelected ? '#3B82F6' : 'transparent',
                          },
                        ]}
                        onPress={() => setAssignedTo(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? '#3B82F6' : isDark ? '#9CA3AF' : '#64748B',
                              fontWeight: isSelected ? '600' : '500',
                            },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Description */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Description & Notes</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? '#121316' : '#F8FAFC',
                    borderColor: isDark ? '#262A34' : '#CBD5E1',
                    color: isDark ? '#FFFFFF' : '#0F172A',
                  },
                ]}
                placeholder="Details of what needs to be discussed or prepared..."
                placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: isDark ? '#D1D5DB' : '#475569' }]}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Add Task</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#181A20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#262A34',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    flex: 1,
  },
  formScroll: {
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    color: '#D1D5DB',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#121316',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#262A34',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 14,
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#222630',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  priorityOptionSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  priorityOptionText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '600',
  },
  chipScroll: {
    flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#222630',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#262A34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
