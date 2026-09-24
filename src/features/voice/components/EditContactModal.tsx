import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VoiceContact } from '../api/voiceApi';

interface EditContactModalProps {
  visible: boolean;
  contact: VoiceContact | null;
  onClose: () => void;
  onSubmit: (contactId: string, payload: Partial<VoiceContact>) => Promise<void>;
  isLoading: boolean;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  visible,
  contact,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setEmail(contact.email || '');
      setCompany(contact.company || '');
      setNotes(contact.notes || '');
    }
  }, [contact]);

  const handleSave = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter contact full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter contact phone number.');
      return;
    }
    if (!contact) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit(contact.id, {
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        company: company.trim() || undefined,
        notes: notes.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update contact details.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Edit Contact</Text>
            <Text style={styles.headerSubtitle}>Update Voice Contact Details</Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {error && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>FULL NAME *</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Aarav Sharma"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />
          </View>

          {/* Phone Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>PHONE NUMBER *</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. +91 98765 43210"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          {/* Email Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EMAIL ADDRESS</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. aarav.sharma@example.com"
              placeholderTextColor="#8E8E93"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Company Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>COMPANY / ORGANIZATION</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Apex Tech Labs"
              placeholderTextColor="#8E8E93"
              value={company}
              onChangeText={setCompany}
            />
          </View>

          {/* Notes Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>NOTES / CONTEXT</Text>
            <TextInput
              style={[styles.input, styles.textArea, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Add key talking points, campaign notes or follow-up preferences..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
            />
          </View>

          {/* Action */}
          <Pressable
            style={[styles.saveButton, isLoading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLight: { backgroundColor: '#FFFFFF', borderBottomColor: '#E2E8F0' },
  headerDark: { backgroundColor: '#0F172A', borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000000' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  textDark: { color: '#F8FAFC' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#E2E8F0' },
  closeBtnDark: { backgroundColor: '#1E293B' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16, paddingBottom: 40 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  errorText: { color: '#EF4444', fontSize: 12.5, fontWeight: '600', flex: 1 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  inputLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0', color: '#000000' },
  inputDark: { backgroundColor: '#0F172A', borderColor: '#1E293B', color: '#F8FAFC' },
  textArea: { height: 80, paddingTop: 12, textAlignVertical: 'top' },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  saveBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
