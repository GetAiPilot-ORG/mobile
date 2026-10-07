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
import { useTheme, getColors } from '@/theme';

interface LogActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (activity: Partial<CRMActivity>) => Promise<void>;
  defaultContactId?: string;
  defaultDealId?: string;
  isLoading?: boolean;
}

const ACTIVITY_TYPES: Array<{ key: ActivityType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { key: 'call', label: 'Call', icon: 'call', color: '#4F8A68' },
  { key: 'email', label: 'Email', icon: 'mail', color: '#647D8C' },
  { key: 'meeting', label: 'Meeting', icon: 'calendar', color: '#8B5CF6' },
  { key: 'note', label: 'Note', icon: 'document-text', color: '#B8863B' },
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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

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
              <Text style={[styles.headerTitle, { color: colors.modalTitle }]}>Log Activity</Text>
              <Text style={[styles.headerSubtitle, { color: colors.modalDescription }]}>
                Record a call, meeting, note or email
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
            {/* Type selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Activity Type</Text>
              <View style={styles.typeRow}>
                {ACTIVITY_TYPES.map((t) => {
                  const isSelected = type === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      style={[
                        styles.typeOption,
                        {
                          backgroundColor: isSelected ? colors.accentSoft : colors.surfaceSecondary,
                          borderColor: isSelected ? colors.primary : 'transparent',
                        },
                      ]}
                      onPress={() => setType(t.key)}
                    >
                      <Ionicons
                        name={t.icon}
                        size={18}
                        color={isSelected ? t.color : colors.iconMuted}
                      />
                      <Text
                        style={[
                          styles.typeText,
                          {
                            color: isSelected ? t.color : colors.mutedText,
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Subject / Summary *</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    borderColor: colors.inputBorder,
                    color: colors.inputForeground,
                  },
                ]}
                placeholder="e.g. Discussed pricing proposal & contract terms"
                placeholderTextColor={colors.inputPlaceholder}
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Description / Content */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Details & Outcome</Text>
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
                placeholder="Client agreed on annual billing, requested updated quote by Friday..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                numberOfLines={4}
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
                <Text style={[styles.submitBtnText, { color: colors.buttonPrimaryForeground }]}>Log Event</Text>
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
    maxHeight: '80%',
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
    borderWidth: 1,
  },
  typeText: {
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
