import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  AccountCard,
  InputField,
  PrimaryButton,
  SecondaryButton,
  SectionHeading,
  getAccountPalette,
} from './AccountUIComponents';

interface BillingTabProps {
  subData: any;
  planLabel: string;
  isActive: boolean;
  profileSubscription?: string;
  daysLeft: number;
  invoicesData: any[];
  onSelectInvoice: (inv: any) => void;
  billingName: string;
  setBillingName: (val: string) => void;
  billingEmail: string;
  setBillingEmail: (val: string) => void;
  taxId: string;
  setTaxId: (val: string) => void;
  billingAddress1: string;
  setBillingAddress1: (val: string) => void;
  billingCity: string;
  setBillingCity: (val: string) => void;
  billingPostal: string;
  setBillingPostal: (val: string) => void;
  isSavingBilling: boolean;
  onSaveBilling: () => void;
  isDark: boolean;
}

export const BillingTab: React.FC<BillingTabProps> = ({
  subData,
  planLabel,
  isActive,
  profileSubscription,
  daysLeft,
  invoicesData,
  onSelectInvoice,
  billingName,
  setBillingName,
  billingEmail,
  setBillingEmail,
  taxId,
  setTaxId,
  billingAddress1,
  setBillingAddress1,
  billingCity,
  setBillingCity,
  billingPostal,
  setBillingPostal,
  isSavingBilling,
  onSaveBilling,
  isDark,
}) => {
  const router = useRouter();
  const palette = getAccountPalette(isDark);

  const displayPlanName =
    subData?.plan_label || planLabel || profileSubscription || 'Free Plan';

  const priceFormatted = subData?.plan_price_paise
    ? `₹${(subData.plan_price_paise / 100).toFixed(0)} / ${subData.billing_interval || 'month'}`
    : profileSubscription
      ? `${profileSubscription} Tier`
      : 'Active Platform Plan';

  const totalDurationDays = subData?.plan_duration_days || 180;
  const progressPercent = Math.min(
    100,
    Math.max(5, (daysLeft / totalDurationDays) * 100)
  );

  return (
    <View style={styles.container}>
      {/* 1. Active Subscription Summary Card */}
      <SectionHeading title="Active Subscription" isDark={isDark} />
      <AccountCard
        isDark={isDark}
        style={{
          borderColor: isDark ? 'rgba(112, 85, 232, 0.4)' : '#DDD4FA',
        }}
      >
        <View style={styles.planHeader}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text
              style={[styles.planTitle, { color: palette.textPrimary }]}
              numberOfLines={1}
            >
              {displayPlanName}
            </Text>
            <Text style={[styles.planPrice, { color: palette.textSecondary }]}>
              {priceFormatted}
            </Text>
          </View>
          <View
            style={[
              styles.activeStatusPill,
              {
                backgroundColor: isActive
                  ? 'rgba(22, 163, 74, 0.12)'
                  : isDark
                    ? '#252230'
                    : '#F0EEF8',
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isActive ? '#16A34A' : palette.textSecondary },
              ]}
            />
            <Text
              style={[
                styles.activeStatusText,
                { color: isActive ? '#16A34A' : palette.textSecondary },
              ]}
            >
              {isActive ? 'Active' : 'Free Trial'}
            </Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressLabelRow}>
            <Text style={[styles.progressLabel, { color: palette.textSecondary }]}>
              Current Billing Cycle
            </Text>
            <Text
              style={[
                styles.progressDays,
                { color: isDark ? '#B9A8FF' : '#7055E8' },
              ]}
            >
              {daysLeft} Days Remaining
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: isDark ? '#252230' : '#F0EEF8' },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: palette.primary,
                },
              ]}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.planActions}>
          <PrimaryButton
            label="Upgrade / Change Plan →"
            onPress={() => router.push('/account/plans' as any)}
            isDark={isDark}
          />
          <SecondaryButton
            label="Refer Friends for Discounts"
            onPress={() => router.push('/Referral' as any)}
            isDark={isDark}
            icon="gift-outline"
          />
        </View>
      </AccountCard>

      {/* 2. Payment Invoices History */}
      <SectionHeading title="Payment Invoices & Receipts" isDark={isDark} />
      <AccountCard isDark={isDark} noPadding>
        {invoicesData && invoicesData.length > 0 ? (
          invoicesData.map((inv: any, i: number) => {
            const isLast = i === invoicesData.length - 1;
            const amountVal = `₹${((inv.amount_paise || 0) / 100).toFixed(2)}`;
            const dateStr = new Date(
              inv.charged_at || inv.created_at
            ).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            });

            return (
              <Pressable
                key={inv.id || i}
                cssInterop={false}
                onPress={() => onSelectInvoice(inv)}
                style={({ pressed }) => [
                  styles.invoiceRow,
                  !isLast && {
                    borderBottomColor: palette.divider,
                    borderBottomWidth: 1,
                  },
                  { opacity: pressed ? 0.75 : 1 },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    style={[styles.invoiceTitle, { color: palette.textPrimary }]}
                    numberOfLines={1}
                  >
                    {inv.plan_label || 'Subscription Payment'}
                  </Text>
                  <Text
                    style={[styles.invoiceDate, { color: palette.textSecondary }]}
                  >
                    {dateStr} • {inv.payment_id || 'Direct Verified'}
                  </Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Text
                    style={[styles.invoiceAmount, { color: palette.textPrimary }]}
                  >
                    {amountVal}
                  </Text>
                  <View style={styles.paidBadge}>
                    <Text style={styles.paidBadgeText}>
                      {inv.payment_status || 'Paid'}
                    </Text>
                  </View>
                </View>
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyInvoicesBox}>
            <Ionicons
              name="receipt-outline"
              size={24}
              color={palette.textSecondary}
            />
            <Text
              style={[styles.emptyInvoicesText, { color: palette.textSecondary }]}
            >
              No previous invoice records found.
            </Text>
          </View>
        )}
      </AccountCard>

      {/* 3. GST & Invoice Details Form */}
      <SectionHeading title="GST & Invoice Details" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <InputField
          label="Billing / Company Name"
          value={billingName}
          onChangeText={setBillingName}
          placeholder="Business or Legal Name"
          isDark={isDark}
          autoCapitalize="words"
        />
        <InputField
          label="Billing Email"
          value={billingEmail}
          onChangeText={setBillingEmail}
          placeholder="billing@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          isDark={isDark}
        />
        <InputField
          label="GSTIN / Tax ID"
          value={taxId}
          onChangeText={setTaxId}
          placeholder="27AAAAA0000A1Z5 (Optional)"
          autoCapitalize="characters"
          isDark={isDark}
        />
        <InputField
          label="Billing Address"
          value={billingAddress1}
          onChangeText={setBillingAddress1}
          placeholder="Street address / Suite"
          isDark={isDark}
        />

        <View style={styles.twoColRow}>
          <View style={{ flex: 1 }}>
            <InputField
              label="City"
              value={billingCity}
              onChangeText={setBillingCity}
              placeholder="City"
              isDark={isDark}
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 1 }}>
            <InputField
              label="Postal Code"
              value={billingPostal}
              onChangeText={setBillingPostal}
              placeholder="e.g. 400001"
              keyboardType="numeric"
              isDark={isDark}
            />
          </View>
        </View>

        <View style={{ marginTop: 6 }}>
          <PrimaryButton
            label="Save Billing Information"
            onPress={onSaveBilling}
            isLoading={isSavingBilling}
            isDark={isDark}
            icon="checkmark-outline"
          />
        </View>
      </AccountCard>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  planTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  planPrice: {
    fontSize: 13,
    fontWeight: '500',
  },
  activeStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressContainer: {
    marginTop: 14,
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: 12,
  },
  progressDays: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  planActions: {
    marginTop: 14,
    gap: 8,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  invoiceTitle: {
    fontSize: 13.5,
    fontWeight: '600',
  },
  invoiceDate: {
    fontSize: 11.5,
  },
  invoiceAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  paidBadge: {
    backgroundColor: 'rgba(22, 163, 74, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  paidBadgeText: {
    color: '#16A34A',
    fontSize: 10,
    fontWeight: '700',
  },
  emptyInvoicesBox: {
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyInvoicesText: {
    fontSize: 12.5,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
});

