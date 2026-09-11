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
import { ActivityType, CRMActivity } from '../types';

interface LogActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (activity: Partial<CRMActivity>) => Promise<void>;
  defaultContactId?: string;
  defaultDealId?: string;
  isLoading?: boolean;
}

const ACTIVITY_TYPES: Array<{ key: ActivityType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { key: 'call', label: 'Call', icon: 'call', color: '#10B981' },
  { key: 'email', label: 'Email', icon: 'mail', color: '#3B82F6' },
  { key: 'meeting', label: 'Meeting', icon: 'calendar', color: '#8B5CF6' },
  { key: 'note', label: 'Note', icon: 'document-text', color: '#F59E0B' },
  { key: 'follow_up', label: 'Follow Up', icon: 'alarm', color: '#EC4899' },
];

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultDealId,
  isLoading,
}) => {
  const [type, setType] = useState<ActivityType>('note');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setType('note');
    setSubject('');
    setDescription('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setErrorMessage('Subject is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        type,
        subject: subject.trim(),
        description: description.trim() || null,
        contact_id: defaultContactId || null,
        deal_id: defaultDealId || null,
        status: 'completed',
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to log activity');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Log Activity</Text>
              <Text style={styles.headerSubtitle}>Record a call, meeting, note or email</Text>
            </View>
            <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView style={styles.formScroll} showsVerticalScrollIndicator={false}>
            {/* Type selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Activity Type</Text>
              <View style={styles.typeRow}>
                {ACTIVITY_TYPES.map((t) => (
                  <Pressable
                    key={t.key}
                    style={[styles.typeOption, type === t.key && styles.typeOptionSelected]}
                    onPress={() => setType(t.key)}
                  >
                    <Ionicons
                      name={t.icon}
                      size={18}
                      color={type === t.key ? t.color : '#9CA3AF'}
                    />
                    <Text
                      style={[
                        styles.typeText,
                        type === t.key && { color: t.color, fontWeight: '700' },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Subject / Summary *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Discussed pricing proposal & contract terms"
                placeholderTextColor="#6B7280"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Description / Content */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Details & Outcome</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Client agreed on annual billing, requested updated quote by Friday..."
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.modalFooter}>
            <Pressable style={styles.cancelBtn} onPress={handleClose} disabled={isLoading}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.submitBtn} onPress={handleSubmit} disabled={isLoading}>
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.submitBtnText}>Log Event</Text>
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
    maxHeight: '80%',
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
    minHeight: 80,
    textAlignVertical: 'top',
  },
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#222630',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  typeOptionSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#3B82F6',
  },
  typeText: {
    color: '#9CA3AF',
    fontSize: 12,
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
