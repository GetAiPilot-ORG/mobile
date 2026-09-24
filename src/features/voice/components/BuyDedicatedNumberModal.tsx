import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { getColors } from '../../../theme/colors';

interface BuyDedicatedNumberModalProps {
  visible: boolean;
  availableNumbers: Array<{ id: string; phone_number: string; price?: number }>;
  onClose: () => void;
  onClaim: (phoneNumber: string) => Promise<void>;
  isLoading: boolean;
}

export const BuyDedicatedNumberModal: React.FC<BuyDedicatedNumberModalProps> = ({
  visible,
  availableNumbers,
  onClose,
  onClaim,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const colors = getColors(isDark);

  const [selectedNumber, setSelectedNumber] = useState<string>(
    availableNumbers[0]?.phone_number || '+91 80 4735 9101'
  );
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (availableNumbers.length > 0 && !selectedNumber) {
      setSelectedNumber(availableNumbers[0].phone_number);
    }
  }, [availableNumbers]);

  const handleClaim = async () => {
    setError(null);
    if (!selectedNumber) {
      setError('Please select a dedicated virtual number.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onClaim(selectedNumber);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to claim dedicated number.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: isDark ? colors.background : colors.surface }]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Get Dedicated Number</Text>
            <Text style={styles.headerSubtitle}>Enterprise Voice Caller ID • ₹1,499/month</Text>
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

          {/* Value Banner */}
          <View style={[styles.pricingCard, isDark ? styles.pricingCardDark : styles.pricingCardLight]}>
            <View style={styles.badgeRow}>
              <View style={styles.proPill}>
                <Ionicons name="sparkles" size={12} color="#8B5CF6" />
                <Text style={styles.proPillText}>EXCLUSIVE CALLER ID</Text>
              </View>
              <Text style={styles.priceTag}>₹1,499<Text style={styles.periodText}>/mo</Text></Text>
            </View>
            <Text style={[styles.pricingTitle, isDark && styles.textDark]}>Dedicated Business Phone Number</Text>
            <Text style={styles.pricingDesc}>
              Assign a dedicated virtual line to your AI voice agents. Boost answer rates, build brand trust, and receive inbound callbacks directly.
            </Text>

            <View style={styles.featuresList}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#30D158" />
                <Text style={[styles.featureText, isDark && styles.textDark]}>Consistent Outbound Caller ID</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#30D158" />
                <Text style={[styles.featureText, isDark && styles.textDark]}>Direct Inbound Call Forwarding</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#30D158" />
                <Text style={[styles.featureText, isDark && styles.textDark]}>TRAI & DND Compliant Routing</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={16} color="#30D158" />
                <Text style={[styles.featureText, isDark && styles.textDark]}>Instant KYC Verification Linkage</Text>
              </View>
            </View>
          </View>

          {/* Number Selection */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>SELECT AVAILABLE NUMBER</Text>
          </View>

          <View style={styles.numbersGrid}>
            {(availableNumbers.length > 0 ? availableNumbers : [
              { id: '1', phone_number: '+91 80 4735 9101' },
              { id: '2', phone_number: '+91 80 4735 9102' },
              { id: '3', phone_number: '+91 80 4735 9103' },
              { id: '4', phone_number: '+91 80 4735 9104' },
            ]).map((num) => {
              const isSelected = selectedNumber === num.phone_number;
              return (
                <Pressable
                  key={num.id || num.phone_number}
                  style={[
                    styles.numberOption,
                    isDark ? styles.numberOptionDark : styles.numberOptionLight,
                    isSelected && styles.numberOptionSelected,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedNumber(num.phone_number);
                  }}
                >
                  <View style={styles.optionLeft}>
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? '#8B5CF6' : '#8E8E93'}
                    />
                    <Text style={[styles.numberText, isDark && styles.textDark, isSelected && styles.numberTextSelected]}>
                      {num.phone_number}
                    </Text>
                  </View>
                  <View style={styles.statusPill}>
                    <Text style={styles.statusPillText}>Available</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Action Button */}
          <Pressable
            style={[styles.claimButton, isLoading && styles.btnDisabled]}
            onPress={handleClaim}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="card" size={18} color="#FFFFFF" />
                <Text style={styles.claimBtnText}>Claim Number (₹1,499/mo)</Text>
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
  contentContainer: { padding: 16, gap: 14, paddingBottom: 40 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
  },
  errorText: { color: '#EF4444', fontSize: 12.5, fontWeight: '600', flex: 1 },
  pricingCard: {
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
  },
  pricingCardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  pricingCardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  badgeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  proPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  proPillText: { fontSize: 10, fontWeight: '800', color: '#8B5CF6', letterSpacing: 0.5 },
  priceTag: { fontSize: 20, fontWeight: '800', color: '#8B5CF6' },
  periodText: { fontSize: 12, color: '#64748B', fontWeight: '500' },
  pricingTitle: { fontSize: 16, fontWeight: '700', marginBottom: 6 },
  pricingDesc: { fontSize: 12.5, color: '#64748B', lineHeight: 18, marginBottom: 16 },
  featuresList: { gap: 8 },
  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { fontSize: 12.5, fontWeight: '500' },
  sectionHeader: { marginTop: 6 },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5 },
  numbersGrid: { gap: 8 },
  numberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  numberOptionLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  numberOptionDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  numberOptionSelected: { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.08)' },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  numberText: { fontSize: 14, fontWeight: '600' },
  numberTextSelected: { color: '#8B5CF6', fontWeight: '700' },
  statusPill: {
    backgroundColor: 'rgba(48, 209, 88, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusPillText: { fontSize: 11, color: '#30D158', fontWeight: '700' },
  claimButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
  },
  claimBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  btnDisabled: { opacity: 0.6 },
});
