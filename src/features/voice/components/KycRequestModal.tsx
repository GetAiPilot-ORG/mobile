import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

interface KycRequestModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    businessName: string;
    documentType: string;
    idNumber: string;
    comments?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

const DOC_TYPES = [
  'GST Certificate',
  'Company Incorporation Certificate',
  'Aadhaar / Passport of Director',
  'PAN Card of Enterprise',
];

export const KycRequestModal: React.FC<KycRequestModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [businessName, setBusinessName] = useState('');
  const [documentType, setDocumentType] = useState(DOC_TYPES[0]);
  const [idNumber, setIdNumber] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    if (!businessName.trim()) {
      setError('Please enter your registered Business / Organization name.');
      return;
    }
    if (!idNumber.trim()) {
      setError('Please provide the identification number / GSTIN for verification.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit({
        businessName: businessName.trim(),
        documentType,
        idNumber: idNumber.trim(),
        comments: comments.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to submit KYC verification request.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Business KYC Verification</Text>
            <Text style={styles.headerSubtitle}>Mandatory for Dedicated Indian Virtual Numbers</Text>
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

          {/* Compliance Notice Card */}
          <View style={[styles.noticeCard, isDark ? styles.noticeCardDark : styles.noticeCardLight]}>
            <Ionicons name="shield-checkmark" size={20} color="#0A84FF" />
            <Text style={[styles.noticeText, isDark && styles.textDark]}>
              As per DoT & TRAI regulations, all dedicated telecalling lines require enterprise identity verification before active outbound calling is unlocked.
            </Text>
          </View>

          {/* Business Name Field */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>LEGAL BUSINESS NAME</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Acme Technologies Private Limited"
              placeholderTextColor="#8E8E93"
              value={businessName}
              onChangeText={setBusinessName}
            />
          </View>

          {/* Document Type Selector */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>VERIFICATION DOCUMENT TYPE</Text>
            <View style={styles.docOptionsGrid}>
              {DOC_TYPES.map((dt) => {
                const isSelected = documentType === dt;
                return (
                  <Pressable
                    key={dt}
                    style={[
                      styles.docChip,
                      isDark ? styles.docChipDark : styles.docChipLight,
                      isSelected && styles.docChipSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDocumentType(dt);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                      size={14}
                      color={isSelected ? '#8B5CF6' : '#8E8E93'}
                    />
                    <Text
                      style={[
                        styles.docChipText,
                        isDark && styles.textDark,
                        isSelected && styles.docChipTextSelected,
                      ]}
                    >
                      {dt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Document ID Number */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>DOCUMENT / GSTIN NUMBER</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. 29ABCDE1234F1Z5"
              placeholderTextColor="#8E8E93"
              autoCapitalize="characters"
              value={idNumber}
              onChangeText={setIdNumber}
            />
          </View>

          {/* Remarks */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>ADDITIONAL REMARKS (OPTIONAL)</Text>
            <TextInput
              style={[styles.input, styles.textArea, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Authorized signatory details or notes..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={3}
              value={comments}
              onChangeText={setComments}
            />
          </View>

          {/* Submit Action */}
          <Pressable
            style={[styles.submitButton, isLoading && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Submit KYC Application</Text>
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
  noticeCard: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  noticeCardLight: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  noticeCardDark: { backgroundColor: 'rgba(10, 132, 255, 0.1)', borderColor: 'rgba(10, 132, 255, 0.2)' },
  noticeText: { fontSize: 12, color: '#1E40AF', lineHeight: 17, flex: 1 },
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
  docOptionsGrid: { gap: 8 },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  docChipLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  docChipDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  docChipSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  docChipText: { fontSize: 13, fontWeight: '500' },
  docChipTextSelected: { color: '#8B5CF6', fontWeight: '700' },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  submitBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
