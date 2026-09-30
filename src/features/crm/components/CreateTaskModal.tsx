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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMTask, TaskPriority } from '../types';
import { useMembers } from '../hooks/useMembers';
import { useContacts } from '../hooks/useContacts';
import { DatePickerField } from '../../../components/DatePickerModal';
import { useTheme, getColors } from '@/theme';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<CRMTask>) => Promise<void>;
  defaultContactId?: string;
  defaultDealId?: string;
  isLoading?: boolean;
}

const PRIORITIES: Array<{ key: TaskPriority; label: string; color: string }> = [
  { key: 'low', label: 'Low', color: '#8A8D91' },
  { key: 'medium', label: 'Medium', color: '#647D8C' },
  { key: 'high', label: 'High', color: '#B8863B' },
  { key: 'urgent', label: 'Urgent', color: '#B85C5C' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultDealId,
  isLoading,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

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
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
      >
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: colors.modalBackground,
              borderColor: colors.modalBorder,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.modalTitle }]}>Create Task</Text>
              <Text style={[styles.headerSubtitle, { color: colors.modalDescription }]}>
                Set follow-ups and action items
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.iconMuted} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructiveSoft }]}>
              <Ionicons name="alert-circle" size={16} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Task Title *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputForeground,
                  },
                ]}
                placeholder="e.g. Follow up on demo feedback"
                placeholderTextColor={colors.inputPlaceholder}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Priority */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
              <View style={styles.priorityRow}>
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      style={[
                        styles.priorityOption,
                        {
                          backgroundColor: isSelected ? colors.accentSoft : colors.surfaceSecondary,
                          borderColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setPriority(p.key)}
                    >
                      <Text
                        style={[
                          styles.priorityOptionText,
                          {
                            color: isSelected ? p.color : colors.mutedText,
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Link Contact / Lead</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: contactId === '' ? colors.accentSoft : colors.surfaceSecondary,
                        borderColor: contactId === '' ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => setContactId('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: contactId === '' ? colors.primary : colors.mutedText,
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
                            backgroundColor: isSelected ? colors.accentSoft : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                        onPress={() => setContactId(c.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? colors.primary : colors.mutedText,
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
                <Text style={[styles.label, { color: colors.textSecondary }]}>Assign to</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: assignedTo === '' ? colors.accentSoft : colors.surfaceSecondary,
                        borderColor: assignedTo === '' ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: assignedTo === '' ? colors.primary : colors.mutedText,
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
                            backgroundColor: isSelected ? colors.accentSoft : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                        onPress={() => setAssignedTo(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? colors.primary : colors.mutedText,
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
              <Text style={[styles.label, { color: colors.textSecondary }]}>Description & Notes</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputForeground,
                  },
                ]}
                placeholder="Details of what needs to be discussed or prepared..."
                placeholderTextColor={colors.inputPlaceholder}
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
              style={[styles.cancelBtn, { backgroundColor: colors.buttonSecondary }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: colors.buttonSecondaryForeground }]}>Cancel</Text>
            </Pressable>
            <Pressable style={[styles.submitBtn, { backgroundColor: colors.primary }]} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.buttonPrimaryForeground} />
              ) : (
                <Text style={[styles.submitBtnText, { color: colors.buttonPrimaryForeground }]}>Add Task</Text>
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '88%',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
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
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    alignItems: 'center',
    borderWidth: 1,
  },
  priorityOptionText: {
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
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
