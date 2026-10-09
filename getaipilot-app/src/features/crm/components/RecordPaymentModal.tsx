import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { DatePickerField } from '../../../components/DatePickerModal';
import { useBillingProfiles } from '../hooks/useBillingProfiles';
import { CRMPayment } from '../types';

interface RecordPaymentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payment: Partial<CRMPayment>) => Promise<void>;
  defaultInvoiceId?: string;
  defaultBillingProfileId?: string;
  defaultAmount?: number;
  isLoading?: boolean;
  orgId?: string;
}

const PAYMENT_METHODS = [
  { key: 'BANK_TRANSFER', label: 'Bank Transfer', icon: 'business-outline' },
  { key: 'UPI', label: 'UPI', icon: 'phone-portrait-outline' },
  { key: 'CASH', label: 'Cash', icon: 'cash-outline' },
  { key: 'CHEQUE', label: 'Cheque', icon: 'document-outline' },
  { key: 'CARD', label: 'Card', icon: 'card-outline' },
];

export const RecordPaymentModal: React.FC<RecordPaymentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultInvoiceId,
  defaultBillingProfileId,
  defaultAmount,
  isLoading = false,
  orgId,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [amount, setAmount] = useState(defaultAmount ? String(defaultAmount) : '');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMethod, setPaymentMethod] = useState('BANK_TRANSFER');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [billingProfileId, setBillingProfileId] = useState(defaultBillingProfileId || '');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: profilesData } = useBillingProfiles({ limit: 50 });

  const resetForm = () => {
    setAmount(defaultAmount ? String(defaultAmount) : '');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setPaymentMethod('BANK_TRANSFER');
    setReferenceNumber('');
    setBillingProfileId(defaultBillingProfileId || '');
    setNotes('');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('Please enter a valid payment amount');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        amount: parsedAmount,
        payment_date: paymentDate || new Date().toISOString().slice(0, 10),
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || '',
        billing_profile_id: billingProfileId || null,
        invoice_id: defaultInvoiceId || null,
        notes: notes.trim() || '',
        status: 'COMPLETED',
        ...(orgId ? { org_id: orgId } : {}),
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to record payment');
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
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Record Payment</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Add received client payment transaction
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Amount */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Amount Received (₹) <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.amountInput,
                  {
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Payment Date & Reference */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <DatePickerField
                  label="Payment Date *"
                  value={paymentDate}
                  onChangeDate={setPaymentDate}
                  placeholder="Select date"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Ref / UTR Number</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="e.g. UTR123456"
                  placeholderTextColor={colors.textMuted}
                  value={referenceNumber}
                  onChangeText={setReferenceNumber}
                />
              </View>
            </View>

            {/* Payment Method Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Payment Method</Text>
              <View style={styles.methodsRow}>
                {PAYMENT_METHODS.map((m) => {
                  const isSelected = paymentMethod === m.key;
                  return (
                    <Pressable
                      key={m.key}
                      style={[
                        styles.methodChip,
                        {
                          backgroundColor: isSelected ? '#EC4899' : isDark ? '#1F2937' : '#F3F4F6',
                          borderColor: isSelected ? '#DB2777' : colors.border,
                        },
                      ]}
                      onPress={() => setPaymentMethod(m.key)}
                    >
                      <Ionicons
                        name={m.icon as any}
                        size={14}
                        color={isSelected ? '#FFF' : colors.text}
                      />
                      <Text
                        style={[
                          styles.methodText,
                          { color: isSelected ? '#FFF' : colors.text, fontWeight: isSelected ? '700' : '500' },
                        ]}
                      >
                        {m.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Billing Profile Selector */}
            {profilesData?.profiles && profilesData.profiles.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Client Billing Profile</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: billingProfileId === '' ? '#EC4899' : isDark ? '#1F2937' : '#F3F4F6',
                        borderColor: billingProfileId === '' ? '#DB2777' : colors.border,
                      },
                    ]}
                    onPress={() => setBillingProfileId('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: billingProfileId === '' ? '#FFF' : colors.text },
                      ]}
                    >
                      None
                    </Text>
                  </Pressable>
                  {profilesData.profiles.map((p) => (
                    <Pressable
                      key={p.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: billingProfileId === p.id ? '#EC4899' : isDark ? '#1F2937' : '#F3F4F6',
                          borderColor: billingProfileId === p.id ? '#DB2777' : colors.border,
                        },
                      ]}
                      onPress={() => setBillingProfileId(p.id)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: billingProfileId === p.id ? '#FFF' : colors.text },
                        ]}
                      >
                        {p.legal_name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Notes / Remarks</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  {
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Bank name, branch or client message..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, { backgroundColor: '#EC4899', opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Record Payment</Text>
                </>
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
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 460,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  amountInput: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  methodsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  methodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  methodText: {
    fontSize: 12,
  },
  chipScroll: {
    flexDirection: 'row',
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  textArea: {
    minHeight: 64,
    textAlignVertical: 'top',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
