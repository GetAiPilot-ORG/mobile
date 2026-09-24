import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { KycStatusResponse } from '../api/voiceApi';

interface KycRequestModalProps {
  visible: boolean;
  kycData?: KycStatusResponse;
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
  'GST Certificate (GSTIN)',
  'PAN Card of Enterprise',
  'DigiLocker Verified Aadhaar',
  'Company Incorporation Certificate (MCA)',
];

export const KycRequestModal: React.FC<KycRequestModalProps> = ({
  visible,
  kycData,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isVerified = kycData?.status === 'verified';
  const [showEditForm, setShowEditForm] = useState(!isVerified);

  const [businessName, setBusinessName] = useState(kycData?.businessName || '');
  const [documentType, setDocumentType] = useState(kycData?.documentType || DOC_TYPES[0]);
  const [idNumber, setIdNumber] = useState('');
  const [comments, setComments] = useState('');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setShowEditForm(!isVerified);
      if (kycData?.businessName) setBusinessName(kycData.businessName);
    }
  }, [visible, isVerified, kycData]);

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
      setShowEditForm(false);
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
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>
              {isVerified && !showEditForm ? 'KYC Verification Status' : 'Business KYC Verification'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {isVerified && !showEditForm ? 'TRAI & DigiLocker Compliance' : 'Mandatory for Dedicated Indian Virtual Numbers'}
            </Text>
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

          {/* VERIFIED STATE CARD */}
          {isVerified && !showEditForm ? (
            <View style={styles.verifiedContainer}>
              <View style={[styles.verifiedCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={styles.shieldBox}>
                  <Ionicons name="shield-checkmark" size={36} color="#30D158" />
                </View>
                <Text style={[styles.verifiedTitle, isDark && styles.textDark]}>
                  Business KYC Verified
                </Text>
                <Text style={styles.verifiedDesc}>
                  Your workspace enterprise identity has been verified via DigiLocker & TRAI compliance standards.
                </Text>

                <View style={[styles.detailsBox, isDark ? styles.detailsBoxDark : styles.detailsBoxLight]}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Verified Entity</Text>
                    <Text style={[styles.detailVal, isDark && styles.textDark]}>
                      {kycData?.businessName || 'Enterprise Workspace'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Method</Text>
                    <Text style={[styles.detailVal, { color: '#8B5CF6' }]}>
                      {kycData?.documentType || 'DigiLocker / PAN Verified'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Document ID</Text>
                    <Text style={[styles.detailVal, isDark && styles.textDark]}>
                      {kycData?.idNumber || 'Verified Record'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Outbound Status</Text>
                    <Text style={[styles.detailVal, { color: '#30D158' }]}>
                      Full Access Enabled
                    </Text>
                  </View>
                </View>
              </View>

              <Pressable
                style={[styles.updateBtn, isDark ? styles.secondaryBtnDark : styles.secondaryBtnLight]}
                onPress={() => setShowEditForm(true)}
              >
                <Ionicons name="create-outline" size={16} color={isDark ? '#FFFFFF' : '#0F172A'} />
                <Text style={[styles.updateBtnText, isDark && styles.textDark]}>Update Business Documents</Text>
              </Pressable>
            </View>
          ) : (
            /* SUBMISSION FORM */
            <View style={styles.formContainer}>
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

              {/* Actions */}
              <View style={styles.actionsRow}>
                {isVerified && (
                  <Pressable
                    style={[styles.cancelBtn, isDark ? styles.secondaryBtnDark : styles.secondaryBtnLight]}
                    onPress={() => setShowEditForm(false)}
                  >
                    <Text style={[styles.cancelBtnText, isDark && styles.textDark]}>Cancel</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[styles.submitBtn, { backgroundColor: '#8B5CF6' }, isLoading && { opacity: 0.7 }]}
                  onPress={handleSubmit}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                      <Text style={styles.submitBtnText}>Submit KYC for Approval</Text>
                    </>
                  )}
                </Pressable>
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#FFFFFF' },
  containerDark: { backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerLight: { borderBottomColor: '#E2E8F0' },
  headerDark: { borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 18, fontWeight: '800' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#1E293B' },
  content: { flex: 1 },
  contentContainer: { padding: 20, gap: 16 },
  textDark: { color: '#F8FAFC' },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    padding: 12,
    borderRadius: 12,
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  verifiedContainer: { gap: 16, alignItems: 'center' },
  verifiedCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#1E293B', borderColor: '#334155' },
  shieldBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(48, 209, 88, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  verifiedTitle: { fontSize: 18, fontWeight: '800', marginBottom: 6 },
  verifiedDesc: { fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18, marginBottom: 16 },
  detailsBox: {
    width: '100%',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  detailsBoxLight: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' },
  detailsBoxDark: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B' },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailKey: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  detailVal: { fontSize: 13, fontWeight: '700' },
  updateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
  },
  updateBtnText: { fontSize: 13.5, fontWeight: '700', color: '#0F172A' },
  formContainer: { gap: 16 },
  noticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  noticeCardLight: { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' },
  noticeCardDark: { backgroundColor: 'rgba(10, 132, 255, 0.1)', borderColor: 'rgba(10, 132, 255, 0.25)' },
  noticeText: { fontSize: 12.5, color: '#1E3A8A', flex: 1, lineHeight: 17 },
  fieldGroup: { gap: 6 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  input: {
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 14,
    borderWidth: 1,
  },
  inputLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0', color: '#0F172A' },
  inputDark: { backgroundColor: '#1E293B', borderColor: '#334155', color: '#F8FAFC' },
  textArea: { height: 76, paddingTop: 12 },
  docOptionsGrid: { gap: 8 },
  docChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  docChipLight: { backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
  docChipDark: { backgroundColor: '#1E293B', borderColor: '#334155' },
  docChipSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  docChipText: { fontSize: 12.5, color: '#64748B', fontWeight: '500' },
  docChipTextSelected: { color: '#8B5CF6', fontWeight: '700' },
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  submitBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  secondaryBtnLight: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  secondaryBtnDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
});
