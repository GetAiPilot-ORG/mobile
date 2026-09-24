import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TopUpCreditsModalProps {
  visible: boolean;
  currentBalance: number;
  onClose: () => void;
  onTopUp: (amount: number) => Promise<void>;
  isLoading?: boolean;
}

const PRESET_AMOUNTS = [
  { amount: 500, minutes: 500, tag: 'Starter' },
  { amount: 1000, minutes: 1000, tag: 'Popular', highlight: true },
  { amount: 2500, minutes: 2500, tag: 'Growth' },
  { amount: 5000, minutes: 5000, tag: 'Enterprise' },
];

export const TopUpCreditsModal: React.FC<TopUpCreditsModalProps> = ({
  visible,
  currentBalance,
  onClose,
  onTopUp,
  isLoading = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedAmount, setSelectedAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [useCustom, setUseCustom] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const activeAmount = useCustom ? Number(customAmount || 0) : selectedAmount;
  const estimatedMinutes = Math.floor(activeAmount);

  const handleSelectPreset = (amt: number) => {
    Haptics.selectionAsync();
    setSelectedAmount(amt);
    setUseCustom(false);
    setErrorMsg(null);
  };

  const handleCustomChange = (text: string) => {
    const numeric = text.replace(/[^0-9]/g, '');
    setCustomAmount(numeric);
    setUseCustom(true);
    setErrorMsg(null);
  };

  const handleSubmit = async () => {
    if (activeAmount < 100) {
      setErrorMsg('Minimum recharge amount is ₹100');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await onTopUp(activeAmount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to complete credit recharge');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.sheet, isDark ? styles.sheetDark : styles.sheetLight]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.15)' }]}>
                <Ionicons name="flash" size={20} color="#8B5CF6" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, isDark && styles.textDark]}>Top Up Telephony Credits</Text>
                <Text style={styles.subtitle}>Instant wallet recharge for inbound/outbound calls</Text>
              </View>
            </View>
            <Pressable
              hitSlop={10}
              onPress={() => {
                Haptics.selectionAsync();
                onClose();
              }}
              style={styles.closeBtn}
            >
              <Ionicons name="close-circle" size={24} color={isDark ? '#6B7280' : '#9CA3AF'} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Current Balance Banner */}
            <View style={[styles.balanceBanner, isDark ? styles.bannerDark : styles.bannerLight]}>
              <View>
                <Text style={styles.bannerLabel}>CURRENT AVAILABLE BALANCE</Text>
                <Text style={[styles.bannerBalance, isDark && styles.textDark]}>
                  ₹{currentBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={styles.rateBadge}>
                <Ionicons name="pricetag" size={12} color="#8B5CF6" />
                <Text style={styles.rateBadgeText}>₹1.00 / min</Text>
              </View>
            </View>

            {/* Presets Grid */}
            <Text style={styles.sectionHeading}>SELECT RECHARGE AMOUNT</Text>
            <View style={styles.presetGrid}>
              {PRESET_AMOUNTS.map((item) => {
                const isSelected = !useCustom && selectedAmount === item.amount;
                return (
                  <Pressable
                    key={item.amount}
                    style={[
                      styles.presetCard,
                      isDark ? styles.presetCardDark : styles.presetCardLight,
                      isSelected && styles.presetCardSelected,
                    ]}
                    onPress={() => handleSelectPreset(item.amount)}
                  >
                    {item.highlight && (
                      <View style={styles.tagBadge}>
                        <Text style={styles.tagText}>{item.tag}</Text>
                      </View>
                    )}
                    <Text
                      style={[
                        styles.presetAmount,
                        isDark && styles.textDark,
                        isSelected && { color: '#8B5CF6' },
                      ]}
                    >
                      ₹{item.amount.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.presetMinutes}>~{item.minutes} Mins</Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Custom Amount Input */}
            <Text style={styles.sectionHeading}>OR ENTER CUSTOM AMOUNT (₹)</Text>
            <View
              style={[
                styles.customInputBox,
                isDark ? styles.inputDark : styles.inputLight,
                useCustom && styles.inputFocused,
              ]}
            >
              <Text style={styles.currencySymbol}>₹</Text>
              <TextInput
                style={[styles.customInput, isDark && styles.textDark]}
                placeholder="Enter amount (min ₹100)"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={handleCustomChange}
              />
            </View>

            {/* Live Calculation Summary */}
            <View style={[styles.summaryCard, isDark ? styles.summaryDark : styles.summaryLight]}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Recharge Amount</Text>
                <Text style={[styles.summaryValue, isDark && styles.textDark]}>
                  ₹{activeAmount.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Estimated Talk Time</Text>
                <Text style={[styles.summaryValue, { color: '#30D158' }]}>
                  +{estimatedMinutes} Minutes
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>New Total Balance</Text>
                <Text style={[styles.summaryValue, { color: '#8B5CF6', fontWeight: '700' }]}>
                  ₹{(currentBalance + activeAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </Text>
              </View>
            </View>

            {errorMsg && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
              <Pressable
                style={[styles.payButton, isLoading && { opacity: 0.6 }]}
                disabled={isLoading}
                onPress={handleSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="shield-checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.payButtonText}>
                      Recharge ₹{activeAmount.toLocaleString('en-IN')}
                    </Text>
                  </>
                )}
              </Pressable>

              <Pressable style={styles.cancelBtn} onPress={onClose} disabled={isLoading}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 24,
  },
  sheetLight: {
    backgroundColor: '#FFFFFF',
  },
  sheetDark: {
    backgroundColor: '#161618',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(150, 150, 150, 0.1)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  textDark: {
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    padding: 20,
  },
  balanceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  bannerLight: {
    backgroundColor: '#F3F4F6',
  },
  bannerDark: {
    backgroundColor: '#202024',
  },
  bannerLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  bannerBalance: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
    marginTop: 4,
  },
  rateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(139, 92, 246, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  rateBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8B5CF6',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  presetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  presetCard: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
    position: 'relative',
  },
  presetCardLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  presetCardDark: {
    backgroundColor: '#202024',
    borderColor: '#2D2D35',
  },
  presetCardSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
  },
  tagBadge: {
    position: 'absolute',
    top: -8,
    right: 8,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  presetAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  presetMinutes: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  customInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    marginBottom: 20,
    height: 52,
  },
  inputLight: {
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
  },
  inputDark: {
    backgroundColor: '#202024',
    borderColor: '#2D2D35',
  },
  inputFocused: {
    borderColor: '#8B5CF6',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#8B5CF6',
    marginRight: 8,
  },
  customInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  summaryCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 10,
  },
  summaryLight: {
    backgroundColor: '#F3F4F6',
  },
  summaryDark: {
    backgroundColor: '#202024',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    color: '#EF4444',
    flex: 1,
  },
  actions: {
    gap: 10,
    marginTop: 4,
  },
  payButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderRadius: 14,
  },
  payButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  cancelBtnText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
