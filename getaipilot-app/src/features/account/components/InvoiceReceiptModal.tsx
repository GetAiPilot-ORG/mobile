import React from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import {
  PrimaryButton,
  getAccountPalette,
} from './AccountUIComponents';

interface InvoiceReceiptModalProps {
  invoice: any | null;
  onClose: () => void;
  isDark: boolean;
}

export const InvoiceReceiptModal: React.FC<InvoiceReceiptModalProps> = ({
  invoice,
  onClose,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  if (!invoice) return null;

  const invoiceNo = `GAP-2026-${String(invoice.id || '001').padStart(6, '0')}`;
  const amountStr = `₹${((invoice.amount_paise || 0) / 100).toFixed(2)}`;

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const receiptText = `GetAiPilot Invoice\nReceipt #: ${invoiceNo}\nPlan: ${invoice.plan_label || 'Subscription'}\nAmount: ${amountStr}\nStatus: ${invoice.payment_status || 'Paid'}`;
    await Clipboard.setStringAsync(receiptText);
    Alert.alert('Receipt Copied', 'Receipt details have been copied to your clipboard.');
    onClose();
  };

  return (
    <Modal
      visible={Boolean(invoice)}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <Pressable cssInterop={false} style={styles.overlayPress} onPress={onClose} />
        <View
          style={[
            styles.modalContent,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}
        >
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              { borderBottomColor: palette.divider, borderBottomWidth: 1 },
            ]}
          >
            <View style={{ gap: 2 }}>
              <Text style={[styles.modalTitle, { color: palette.textPrimary }]}>
                Tax Invoice Receipt
              </Text>
              <Text style={[styles.modalSub, { color: palette.textSecondary }]}>
                Official payment receipt
              </Text>
            </View>
            <Pressable
              cssInterop={false}
              onPress={onClose}
              hitSlop={8}
              style={({ pressed }) => [{ opacity: pressed ? 0.7 : 1 }]}
            >
              <Ionicons name="close-circle" size={24} color={palette.textSecondary} />
            </Pressable>
          </View>

          {/* Details */}
          <View style={styles.detailsBody}>
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                Invoice Number
              </Text>
              <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                {invoiceNo}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                Plan
              </Text>
              <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                {invoice.plan_label || 'GetAiPilot Subscription'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                Payment Reference
              </Text>
              <Text
                style={[styles.detailValue, { color: palette.textPrimary }]}
                numberOfLines={1}
              >
                {invoice.payment_id || 'Direct Verified'}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                Date
              </Text>
              <Text style={[styles.detailValue, { color: palette.textPrimary }]}>
                {new Date(invoice.charged_at || invoice.created_at).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: palette.textSecondary }]}>
                Status
              </Text>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={12} color="#16A34A" />
                <Text style={styles.statusBadgeText}>
                  {invoice.payment_status || 'Paid'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: palette.divider }]} />

            {/* Total Paid */}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: palette.textPrimary }]}>
                Total Paid
              </Text>
              <Text style={[styles.totalAmount, { color: palette.primary }]}>
                {amountStr}
              </Text>
            </View>
          </View>

          {/* Action */}
          <View style={{ marginTop: 16 }}>
            <PrimaryButton
              label="Share / Save Receipt"
              onPress={handleShare}
              isDark={isDark}
              icon="share-outline"
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  overlayPress: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  modalContent: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  modalSub: {
    fontSize: 12,
  },
  detailsBody: {
    paddingVertical: 14,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  divider: {
    height: 1,
    marginVertical: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  totalAmount: {
    fontSize: 18,
    fontWeight: '800',
  },
});

