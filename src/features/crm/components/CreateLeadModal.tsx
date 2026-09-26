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
import { CRMContact, ContactStatus } from '../types';
import { useMembers } from '../hooks/useMembers';
import { useTheme, getColors } from '@/theme';

interface CreateLeadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (lead: Partial<CRMContact>) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: Array<{ key: ContactStatus; label: string }> = [
  { key: 'lead', label: 'Lead' },
  { key: 'prospect', label: 'Prospect' },
  { key: 'customer', label: 'Customer' },
];

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState<ContactStatus>('lead');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: members } = useMembers();

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setJobTitle('');
    setStatus('lead');
    setAssignedTo('');
    setNotes('');
    setErrorMessage('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setErrorMessage('First name is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        job_title: jobTitle.trim() || null,
        status,
        assigned_to: assignedTo || null,
        notes: notes.trim() || null,
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create lead');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalContent, isDark ? styles.modalContentDark : styles.modalContentLight]}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.headerTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Add New Lead</Text>
              <Text style={[styles.headerSubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Capture contact and qualification details</Text>
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
            {/* Name Row */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>First Name *</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="e.g. John"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Last Name</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="e.g. Doe"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Contact Row */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Email Address</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="john@example.com"
                placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Company & Role */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Company</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="Acme Corp"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Job Title</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  placeholder="VP Sales"
                  placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                  value={jobTitle}
                  onChangeText={setJobTitle}
                />
              </View>
            </View>

            {/* Status Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Status</Text>
              <View style={styles.statusRow}>
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    style={[
                      styles.statusOption,
                      { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                      status === opt.key && (isDark ? styles.statusOptionSelectedDark : styles.statusOptionSelectedLight),
                    ]}
                    onPress={() => setStatus(opt.key)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        { color: isDark ? '#9CA3AF' : '#64748B' },
                        status === opt.key && styles.statusOptionTextSelected,
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Assignee Selector */}
            {members && members.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Assign to Team Member</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.memberScroll}>
                  <Pressable
                    style={[
                      styles.memberChip,
                      { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                      assignedTo === '' && (isDark ? styles.memberChipSelectedDark : styles.memberChipSelectedLight),
                    ]}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text
                      style={[
                        styles.memberChipText,
                        { color: isDark ? '#9CA3AF' : '#64748B' },
                        assignedTo === '' && styles.memberChipTextSelected,
                      ]}
                    >
                      Unassigned
                    </Text>
                  </Pressable>
                  {members.map((m) => (
                    <Pressable
                      key={m.id}
                      style={[
                        styles.memberChip,
                        { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                        assignedTo === m.id && (isDark ? styles.memberChipSelectedDark : styles.memberChipSelectedLight),
                      ]}
                      onPress={() => setAssignedTo(m.id)}
                    >
                      <Text
                        style={[
                          styles.memberChipText,
                          { color: isDark ? '#9CA3AF' : '#64748B' },
                          assignedTo === m.id && styles.memberChipTextSelected,
                        ]}
                      >
                        {m.name || m.email}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Initial Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? '#D1D5DB' : '#334155' }]}>Initial Notes / Source</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight, styles.textArea]}
                placeholder="How did this lead contact us? Any specific requirements..."
                placeholderTextColor={isDark ? '#6B7280' : '#94A3B8'}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
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
                <Text style={styles.submitBtnText}>Create Lead</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
  },
  modalContentDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
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
    letterSpacing: -0.3,
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
  row: {
    flexDirection: 'row',
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
  inputDark: {
    backgroundColor: '#121316',
    borderColor: '#262A34',
    color: '#FFFFFF',
  },
  inputLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    color: '#0F172A',
  },
  textArea: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  statusOptionSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  statusOptionSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusOptionTextSelected: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  memberScroll: {
    flexDirection: 'row',
  },
  memberChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  memberChipSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  memberChipSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  memberChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  memberChipTextSelected: {
    color: '#3B82F6',
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
