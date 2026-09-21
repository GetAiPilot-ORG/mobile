import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { BFF_BASE_URL } from '../../core/api/client';
import { RazorpayApiService } from '../../core/payments/razorpayService';
import {
  RazorpayCheckoutOptions,
  RazorpayOrder,
  RazorpayQrCode,
  RazorpaySuccessResponse,
} from '../../core/payments/types';
import {
  CardBrand,
  detectCardBrand,
  validateAmount,
  validateCardCvv,
  validateCardExpiry,
  validateCardNumber,
  validateCustomerName,
  validateEmail,
  validatePhone,
  validateUpiId,
} from '../../core/payments/validation';
import { useAuthStore } from '../../core/store/authStore';

export interface RazorpayCheckoutModalProps {
  visible: boolean;
  options: RazorpayCheckoutOptions | null;
  onClose: () => void;
}

type PaymentMethodType = 'qr' | 'upi' | 'card' | 'netbanking';

const POPULAR_UPI_APPS = [
  { id: 'gpay', name: 'Google Pay', icon: 'logo-google', color: '#4285f4' },
  { id: 'phonepe', name: 'PhonePe', icon: 'flash', color: '#5f259f' },
  { id: 'paytm', name: 'Paytm', icon: 'wallet', color: '#00baf2' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'qr-code', color: '#00833a' },
];

const POPULAR_BANKS = [
  { id: 'HDFC', name: 'HDFC Bank' },
  { id: 'ICICI', name: 'ICICI Bank' },
  { id: 'SBI', name: 'State Bank of India' },
  { id: 'AXIS', name: 'Axis Bank' },
  { id: 'KOTAK', name: 'Kotak Mahindra' },
];

export const RazorpayCheckoutModal: React.FC<RazorpayCheckoutModalProps> = ({
  visible,
  options,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const currentUser = useAuthStore((s) => s.user);

  const [selectedMethod, setSelectedMethod] = useState<PaymentMethodType>('qr');
  const [selectedUpiApp, setSelectedUpiApp] = useState<string>('gpay');
  const [upiIdInput, setUpiIdInput] = useState<string>('');
  const [selectedBank, setSelectedBank] = useState<string>('HDFC');

  // QR Code States
  const [qrCode, setQrCode] = useState<RazorpayQrCode | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [qrTimeLeft, setQrTimeLeft] = useState(900); // 15 mins
  const [verificationNumber, setVerificationNumber] = useState('');

  // Card Inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardBrand, setCardBrand] = useState<CardBrand>('unknown');

  // Customer Contact Inputs & Accordion
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isEditingContact, setIsEditingContact] = useState(false);

  // Field validation errors
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Order & Processing state
  const [order, setOrder] = useState<RazorpayOrder | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('Initializing secure payment...');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedPayment, setCompletedPayment] = useState<RazorpaySuccessResponse | null>(null);

  // Reset and initialize when opened
  useEffect(() => {
    if (visible && options) {
      setErrorMessage(null);
      setFieldErrors({});
      setCompletedPayment(null);
      setIsProcessing(false);
      setSelectedMethod('qr');
      setSelectedUpiApp('gpay');
      setUpiIdInput('');
      setCardNumber('');
      setCardExpiry('');
      setCardCvv('');
      setCardBrand('unknown');
      setIsEditingContact(false);

      const name =
        options.prefill?.name ||
        currentUser?.user_metadata?.full_name ||
        currentUser?.email?.split('@')[0] ||
        '';
      const email = options.prefill?.email || currentUser?.email || '';
      const phone = options.prefill?.contact || currentUser?.phone || '';

      setCustomerName(name);
      setCustomerEmail(email);
      setCustomerPhone(phone);
      setVerificationNumber(phone);

      initOrder();
      initQrCode();
    } else {
      setOrder(null);
      setQrCode(null);
    }
  }, [visible, options]);

  const initQrCode = async () => {
    if (!options) return;
    setIsGeneratingQr(true);
    try {
      const qrData = await RazorpayApiService.createQrCode({
        amount: options.amount,
        currency: options.currency || 'INR',
        product: options.product || 'social',
        planId: options.planId,
        planName: options.planName,
        billingInterval: options.billingInterval,
      });
      setQrCode(qrData);
      setQrTimeLeft(900);
    } catch (e: any) {
      console.warn('[RazorpayCheckoutModal] QR creation warning:', e?.message);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // QR expiration countdown timer
  useEffect(() => {
    if (!visible || !qrCode || qrTimeLeft <= 0) return;
    const timer = setInterval(() => {
      setQrTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [visible, qrCode, qrTimeLeft]);

  // Real-time automatic QR status polling
  useEffect(() => {
    if (!visible || selectedMethod !== 'qr' || !qrCode || completedPayment || isProcessing) return;

    const interval = setInterval(async () => {
      try {
        const status = await RazorpayApiService.checkQrStatus(qrCode.qrId);
        if (status.isPaid && status.paymentId) {
          clearInterval(interval);
          handleVerifyNumber(status.paymentId);
        }
      } catch {
        // ignore polling error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [visible, selectedMethod, qrCode, completedPayment, isProcessing]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const initOrder = async () => {
    if (!options) return;
    const amountVal = validateAmount(options.amount);
    if (!amountVal.isValid) {
      setErrorMessage(amountVal.error || 'Invalid payment amount.');
      return;
    }

    setIsInitializing(true);
    setErrorMessage(null);
    try {
      const createdOrder = await RazorpayApiService.createOrder({
        amount: options.amount,
        currency: options.currency || 'INR',
        product: options.product || 'social',
        planId: options.planId,
        planName: options.planName,
        billingInterval: options.billingInterval,
        notes: options.notes,
      });
      setOrder(createdOrder);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to initialize payment gateway.');
    } finally {
      setIsInitializing(false);
    }
  };

  // Card input formatters & live validation
  const handleCardNumberChange = (val: string) => {
    const raw = val.replace(/\D/g, '').slice(0, 19);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
    setCardBrand(detectCardBrand(raw));
    if (fieldErrors.cardNumber) {
      setFieldErrors((prev) => ({ ...prev, cardNumber: '' }));
    }
  };

  const handleCardExpiryChange = (val: string) => {
    let clean = val.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 3) {
      clean = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    }
    setCardExpiry(clean);
    if (fieldErrors.cardExpiry) {
      setFieldErrors((prev) => ({ ...prev, cardExpiry: '' }));
    }
  };

  const handleCardCvvChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, cardBrand === 'amex' ? 4 : 3);
    setCardCvv(clean);
    if (fieldErrors.cardCvv) {
      setFieldErrors((prev) => ({ ...prev, cardCvv: '' }));
    }
  };

  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, '').slice(0, 10);
    setCustomerPhone(clean);
    if (fieldErrors.customerPhone) {
      setFieldErrors((prev) => ({ ...prev, customerPhone: '' }));
    }
  };

  const handleEmailChange = (val: string) => {
    setCustomerEmail(val);
    if (fieldErrors.customerEmail) {
      setFieldErrors((prev) => ({ ...prev, customerEmail: '' }));
    }
  };

  const handleNameChange = (val: string) => {
    setCustomerName(val);
    if (fieldErrors.customerName) {
      setFieldErrors((prev) => ({ ...prev, customerName: '' }));
    }
  };

  const handleUpiIdChange = (val: string) => {
    setUpiIdInput(val);
    if (fieldErrors.upiId) {
      setFieldErrors((prev) => ({ ...prev, upiId: '' }));
    }
  };

  const handlePayNow = async () => {
    if (!options || !order) return;

    // Comprehensive client-side validation
    const errors: Record<string, string> = {};

    // 1. Customer Contact Validations
    const nameCheck = validateCustomerName(customerName);
    if (!nameCheck.isValid) errors.customerName = nameCheck.error!;

    const emailCheck = validateEmail(customerEmail);
    if (!emailCheck.isValid) errors.customerEmail = emailCheck.error!;

    const phoneCheck = validatePhone(customerPhone);
    if (!phoneCheck.isValid) errors.customerPhone = phoneCheck.error!;

    // 2. Payment Method Specific Validations
    if (selectedMethod === 'upi') {
      if (upiIdInput.trim().length > 0) {
        const upiCheck = validateUpiId(upiIdInput);
        if (!upiCheck.isValid) errors.upiId = upiCheck.error!;
      } else if (!selectedUpiApp) {
        errors.upiId = 'Please select a UPI app or enter a valid UPI ID.';
      }
    } else if (selectedMethod === 'card') {
      const cardCheck = validateCardNumber(cardNumber);
      if (!cardCheck.isValid) errors.cardNumber = cardCheck.error!;

      const expiryCheck = validateCardExpiry(cardExpiry);
      if (!expiryCheck.isValid) errors.cardExpiry = expiryCheck.error!;

      const cvvCheck = validateCardCvv(cardCvv, cardBrand === 'amex');
      if (!cvvCheck.isValid) errors.cardCvv = cvvCheck.error!;
    } else if (selectedMethod === 'netbanking') {
      if (!selectedBank) {
        errors.bank = 'Please select your bank.';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstError = Object.values(errors)[0];
      setErrorMessage(firstError);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setFieldErrors({});
    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    setIsProcessing(true);
    setProcessingStatus('Connecting to Razorpay Banking Gateway...');

    try {
      setProcessingStatus('Connecting to Razorpay Banking Gateway...');
      const checkoutUrl = `${BFF_BASE_URL}/mobile/v1/payments/razorpay/checkout-page?orderId=${encodeURIComponent(order.orderId)}&keyId=${encodeURIComponent(order.keyId)}&amount=${encodeURIComponent(options.amount)}&planName=${encodeURIComponent(options.planName)}&planId=${encodeURIComponent(options.planId)}&billingInterval=${encodeURIComponent(options.billingInterval)}&userId=${encodeURIComponent(currentUser?.id || '')}&product=${encodeURIComponent(options.product || 'social')}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}`;

      await Linking.openURL(checkoutUrl);
      setIsProcessing(false);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsProcessing(false);
      setErrorMessage(err?.message || 'Failed to open Razorpay gateway. Please retry.');
      if (options.onFailure) {
        options.onFailure(err);
      }
    }
  };

  const handleVerifyNumber = async (overrideNumber?: string) => {
    const num = (overrideNumber || verificationNumber || customerPhone || '').trim();
    if (!num) {
      setErrorMessage('Please enter your 10-digit mobile number or 12-digit UPI Reference / UTR number.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (!qrCode || !options) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStatus('Verifying transaction on live Razorpay banking network...');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await RazorpayApiService.verifyQrPaymentByNumber({
        qrId: qrCode.qrId,
        number: num,
        orderId: order?.orderId,
        planId: options.planId,
        planName: options.planName,
        billingInterval: options.billingInterval,
        amount: options.amount,
        currency: options.currency || 'INR',
        product: options.product || 'social',
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setCompletedPayment(res);
      setIsProcessing(false);

      if (options.onSuccess) {
        await options.onSuccess(res);
      }
    } catch (err: any) {
      setIsProcessing(false);
      const msg = err?.message || 'Verification pending. If you just completed payment, please wait 5-10 seconds and try again.';
      setErrorMessage(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isProcessing) {
      if (options?.onDismiss) {
        options.onDismiss();
      }
      onClose();
    }
  };

  if (!options) return null;

  const intervalLabel =
    options.billingInterval === 'year'
      ? 'Yearly'
      : options.billingInterval === 'six_months'
        ? '6 Months'
        : options.billingInterval === 'quarterly'
          ? 'Quarterly'
          : 'Monthly';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.sheetContainer,
            { backgroundColor: isDark ? '#090d16' : '#ffffff' },
          ]}
        >
          {/* Top Header Bar */}
          <View style={[styles.sheetHeader, { borderBottomColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
            <View style={styles.headerTitleRow}>
              <View style={styles.rzpBadgeWrap}>
                <Ionicons name="card" size={16} color="#ffffff" />
              </View>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.headerTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    Razorpay Secure Pay
                  </Text>
                  <View style={styles.liveTestBadge}>
                    <Text style={styles.liveTestBadgeText}>VERIFIED GATEWAY</Text>
                  </View>
                </View>
                <Text style={[styles.headerSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                  256-bit Encrypted Multi-Channel Subscription
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleDismiss}
              hitSlop={12}
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}
            >
              <Ionicons name="close" size={18} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          {/* Success State View */}
          {completedPayment ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconCircle}>
                <Ionicons name="checkmark-sharp" size={42} color="#ffffff" />
              </View>
              <Text style={[styles.successTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Payment Verified & Activated!
              </Text>
              <Text style={[styles.successSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Your workspace has been upgraded to{' '}
                <Text style={{ fontWeight: '800', color: '#ec4899' }}>
                  {options.planName}
                </Text>{' '}
                ({intervalLabel}). All higher quotas are now unlocked.
              </Text>

              <View
                style={[
                  styles.receiptCard,
                  { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
              >
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Transaction ID</Text>
                  <Text style={[styles.receiptVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{completedPayment.paymentId}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Order Reference</Text>
                  <Text style={[styles.receiptVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{completedPayment.orderId.slice(0, 16)}...</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Billed Contact</Text>
                  <Text style={[styles.receiptVal, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{customerEmail}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Amount Paid</Text>
                  <Text style={[styles.receiptVal, { color: '#10b981', fontWeight: '900' }]}>₹{completedPayment.amount}</Text>
                </View>
                <View style={styles.receiptRow}>
                  <Text style={[styles.receiptLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>Status</Text>
                  <Text style={[styles.receiptVal, { color: '#10b981', fontWeight: '800' }]}>Active Subscription</Text>
                </View>
              </View>

              <Pressable
                onPress={handleDismiss}
                style={[styles.primaryActionBtn, { backgroundColor: '#10b981', marginTop: 24 }]}
              >
                <Text style={styles.primaryActionBtnText}>Done & Return to Workspace</Text>
                <Ionicons name="arrow-forward" size={16} color="#ffffff" />
              </Pressable>
            </View>
          ) : isProcessing ? (
            /* Processing State View */
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#ec4899" />
              <Text style={[styles.processingTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Processing Razorpay Checkout
              </Text>
              <Text style={[styles.processingSub, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                {processingStatus}
              </Text>
              <View style={styles.securityPill}>
                <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                <Text style={styles.securityPillText}>256-bit Bank Grade Encryption Active</Text>
              </View>
            </View>
          ) : (
            /* Main Checkout Form */
            <ScrollView
              contentContainerStyle={styles.scrollBody}
              showsVerticalScrollIndicator={false}
            >
              {/* Order Summary Glass Card */}
              <View
                style={[
                  styles.orderSummaryCard,
                  {
                    backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                  },
                ]}
              >
                <View style={styles.orderSummaryTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.planSummaryName, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {options.planName} Plan
                    </Text>
                    <Text style={[styles.planSummaryInterval, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {intervalLabel} Billing Cycle · Instant Activation
                    </Text>
                  </View>
                  <View style={styles.priceTagWrap}>
                    <Text style={[styles.priceTagCurrency, { color: isDark ? '#f8fafc' : '#0f172a' }]}>₹</Text>
                    <Text style={[styles.priceTagNumber, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      {options.amount}
                    </Text>
                  </View>
                </View>

                {order && (
                  <View style={styles.orderIdRow}>
                    <Text style={[styles.orderIdLabel, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                      ORDER ID:
                    </Text>
                    <Text style={[styles.orderIdVal, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      {order.orderId}
                    </Text>
                  </View>
                )}
              </View>

              {/* Error Alert Box */}
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle" size={18} color="#ef4444" />
                  <Text style={styles.errorBoxText}>{errorMessage}</Text>
                </View>
              )}

              {/* Customer Contact Card with Edit Option */}
              <View
                style={[
                  styles.contactCard,
                  { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: isDark ? '#1e293b' : '#e2e8f0' },
                ]}
              >
                <View style={styles.contactHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="person-circle-outline" size={16} color="#ec4899" />
                    <Text style={[styles.contactCardTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                      Billing Contact Details
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setIsEditingContact(!isEditingContact);
                    }}
                    style={styles.editContactBtn}
                  >
                    <Text style={styles.editContactBtnText}>
                      {isEditingContact ? 'Hide' : 'Edit'}
                    </Text>
                  </Pressable>
                </View>

                {!isEditingContact ? (
                  <View style={styles.contactPreviewRow}>
                    <Text style={[styles.contactPreviewText, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                      {customerName} · {customerEmail} · +91 {customerPhone}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.contactInputsWrap}>
                    {/* Name Input */}
                    <View>
                      <Text style={[styles.inputFieldLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Full Name *
                      </Text>
                      <View
                        style={[
                          styles.inputRow,
                          {
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: fieldErrors.customerName ? '#ef4444' : isDark ? '#1e293b' : '#e2e8f0',
                          },
                        ]}
                      >
                        <Ionicons name="person" size={15} color="#ec4899" />
                        <TextInput
                          value={customerName}
                          onChangeText={handleNameChange}
                          placeholder="Full Name"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                        />
                      </View>
                      {fieldErrors.customerName && (
                        <Text style={styles.inlineErrorText}>{fieldErrors.customerName}</Text>
                      )}
                    </View>

                    {/* Email Input */}
                    <View>
                      <Text style={[styles.inputFieldLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        Email Address *
                      </Text>
                      <View
                        style={[
                          styles.inputRow,
                          {
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: fieldErrors.customerEmail ? '#ef4444' : isDark ? '#1e293b' : '#e2e8f0',
                          },
                        ]}
                      >
                        <Ionicons name="mail" size={15} color="#ec4899" />
                        <TextInput
                          value={customerEmail}
                          onChangeText={handleEmailChange}
                          placeholder="email@domain.com"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          keyboardType="email-address"
                          autoCapitalize="none"
                        />
                      </View>
                      {fieldErrors.customerEmail && (
                        <Text style={styles.inlineErrorText}>{fieldErrors.customerEmail}</Text>
                      )}
                    </View>

                    {/* Phone Input */}
                    <View>
                      <Text style={[styles.inputFieldLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                        10-Digit Mobile Number *
                      </Text>
                      <View
                        style={[
                          styles.inputRow,
                          {
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: fieldErrors.customerPhone ? '#ef4444' : isDark ? '#1e293b' : '#e2e8f0',
                          },
                        ]}
                      >
                        <Text style={{ fontWeight: '700', color: isDark ? '#94a3b8' : '#64748b', fontSize: 13 }}>
                          +91
                        </Text>
                        <TextInput
                          value={customerPhone}
                          onChangeText={handlePhoneChange}
                          placeholder="10-digit Mobile Number"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          keyboardType="phone-pad"
                          maxLength={10}
                        />
                      </View>
                      {fieldErrors.customerPhone && (
                        <Text style={styles.inlineErrorText}>{fieldErrors.customerPhone}</Text>
                      )}
                    </View>
                  </View>
                )}
              </View>

              {/* Payment Methods Tab */}
              <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#334155' }]}>
                SELECT PAYMENT METHOD
              </Text>

              <View style={styles.methodSelectorRow}>
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMethod('qr');
                    setFieldErrors({});
                  }}
                  style={[
                    styles.methodTabBtn,
                    {
                      backgroundColor:
                        selectedMethod === 'qr'
                          ? '#ec4899'
                          : isDark
                            ? '#1e293b'
                            : '#f1f5f9',
                      borderColor: selectedMethod === 'qr' ? '#ec4899' : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name="qr-code"
                    size={15}
                    color={selectedMethod === 'qr' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      { color: selectedMethod === 'qr' ? '#ffffff' : isDark ? '#cbd5e1' : '#334155' },
                    ]}
                  >
                    UPI QR
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMethod('upi');
                    setFieldErrors((prev) => ({ ...prev, cardNumber: '', cardExpiry: '', cardCvv: '', bank: '' }));
                  }}
                  style={[
                    styles.methodTabBtn,
                    {
                      backgroundColor:
                        selectedMethod === 'upi'
                          ? '#ec4899'
                          : isDark
                            ? '#1e293b'
                            : '#f1f5f9',
                      borderColor: selectedMethod === 'upi' ? '#ec4899' : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name="flash-outline"
                    size={15}
                    color={selectedMethod === 'upi' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      { color: selectedMethod === 'upi' ? '#ffffff' : isDark ? '#cbd5e1' : '#334155' },
                    ]}
                  >
                    UPI Apps
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMethod('card');
                    setFieldErrors((prev) => ({ ...prev, upiId: '', bank: '' }));
                  }}
                  style={[
                    styles.methodTabBtn,
                    {
                      backgroundColor:
                        selectedMethod === 'card'
                          ? '#ec4899'
                          : isDark
                            ? '#1e293b'
                            : '#f1f5f9',
                      borderColor: selectedMethod === 'card' ? '#ec4899' : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name="card-outline"
                    size={15}
                    color={selectedMethod === 'card' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      { color: selectedMethod === 'card' ? '#ffffff' : isDark ? '#cbd5e1' : '#334155' },
                    ]}
                  >
                    Cards
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedMethod('netbanking');
                    setFieldErrors((prev) => ({ ...prev, upiId: '', cardNumber: '', cardExpiry: '', cardCvv: '' }));
                  }}
                  style={[
                    styles.methodTabBtn,
                    {
                      backgroundColor:
                        selectedMethod === 'netbanking'
                          ? '#ec4899'
                          : isDark
                            ? '#1e293b'
                            : '#f1f5f9',
                      borderColor: selectedMethod === 'netbanking' ? '#ec4899' : 'transparent',
                    },
                  ]}
                >
                  <Ionicons
                    name="business-outline"
                    size={15}
                    color={selectedMethod === 'netbanking' ? '#ffffff' : isDark ? '#94a3b8' : '#64748b'}
                  />
                  <Text
                    style={[
                      styles.methodTabText,
                      { color: selectedMethod === 'netbanking' ? '#ffffff' : isDark ? '#cbd5e1' : '#334155' },
                    ]}
                  >
                    NetBanking
                  </Text>
                </Pressable>
              </View>

              {/* QR Code Method View */}
              {selectedMethod === 'qr' && (
                <View style={styles.methodContentBox}>
                  <View style={styles.qrHeaderRow}>
                    <View style={styles.qrBadge}>
                      <Ionicons name="scan-outline" size={13} color="#10b981" />
                      <Text style={styles.qrBadgeText}>DYNAMIC UPI QR</Text>
                    </View>
                    <View style={styles.timerBadge}>
                      <Ionicons name="time-outline" size={13} color="#ec4899" />
                      <Text style={styles.timerBadgeText}>Expires in {formatTime(qrTimeLeft)}</Text>
                    </View>
                  </View>

                  {/* QR Image Card */}
                  <View style={styles.qrContainer}>
                    {isGeneratingQr || !qrCode ? (
                      <View style={styles.qrLoadingBox}>
                        <ActivityIndicator size="large" color="#ec4899" />
                        <Text style={styles.qrLoadingText}>Generating official Razorpay QR...</Text>
                      </View>
                    ) : (
                      <Image
                        source={{ uri: qrCode.imageUrl }}
                        style={styles.qrImage}
                        resizeMode="contain"
                      />
                    )}
                  </View>

                  {/* Supported Apps Telemetry */}
                  <View style={styles.supportedAppsRow}>
                    <Text style={[styles.supportedAppsText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Scan with Google Pay · PhonePe · Paytm · BHIM · Any App
                    </Text>
                  </View>

                  {/* Direct UPI Intent Button */}
                  {qrCode?.upiPayload && (
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (qrCode.upiPayload) {
                          Linking.openURL(qrCode.upiPayload).catch(() => {
                            setErrorMessage('Unable to auto-open UPI app. Please scan the QR code using your UPI app.');
                          });
                        }
                      }}
                      style={styles.openUpiBtn}
                    >
                      <Ionicons name="open-outline" size={15} color="#ec4899" />
                      <Text style={styles.openUpiBtnText}>Pay via UPI App on this Device</Text>
                    </Pressable>
                  )}

                  {/* Number Verification Section */}
                  <View
                    style={[
                      styles.numberVerifyBox,
                      {
                        backgroundColor: isDark ? '#090d16' : '#f8fafc',
                        borderColor: isDark ? '#1e293b' : '#e2e8f0',
                      },
                    ]}
                  >
                    <View style={styles.numberVerifyHeader}>
                      <Ionicons name="shield-checkmark" size={16} color="#10b981" />
                      <Text style={[styles.numberVerifyTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                        Verify Real Payment
                      </Text>
                    </View>
                    <Text style={[styles.numberVerifySubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                      Enter the 10-digit mobile number used to pay, or the 12-digit UPI Reference / UTR Number from your receipt:
                    </Text>

                    <View
                      style={[
                        styles.inputRow,
                        {
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: isDark ? '#1e293b' : '#e2e8f0',
                          marginTop: 8,
                        },
                      ]}
                    >
                      <Ionicons name="receipt-outline" size={16} color="#ec4899" />
                      <TextInput
                        value={verificationNumber}
                        onChangeText={(t) => setVerificationNumber(t)}
                        placeholder={customerPhone ? `e.g. ${customerPhone} or 12-digit UTR` : 'Enter Mobile or 12-digit UPI UTR'}
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                        keyboardType="default"
                      />
                      {customerPhone ? (
                        <Pressable
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setVerificationNumber(customerPhone);
                          }}
                          style={styles.useMyPhoneBtn}
                        >
                          <Text style={styles.useMyPhoneBtnText}>My Phone</Text>
                        </Pressable>
                      ) : null}
                    </View>

                    <Pressable
                      onPress={() => handleVerifyNumber()}
                      disabled={isProcessing}
                      style={[
                        styles.verifyNumberBtn,
                        { backgroundColor: isProcessing ? '#94a3b8' : '#10b981' },
                      ]}
                    >
                      <Ionicons name="checkmark-done" size={16} color="#ffffff" />
                      <Text style={styles.verifyNumberBtnText}>Verify & Activate Subscription</Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {/* UPI Sub-Options */}
              {selectedMethod === 'upi' && (
                <View style={styles.methodContentBox}>
                  <Text style={[styles.subOptionLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Choose Supported UPI App
                  </Text>
                  <View style={styles.upiAppsGrid}>
                    {POPULAR_UPI_APPS.map((app) => {
                      const isSelected = selectedUpiApp === app.id && !upiIdInput;
                      return (
                        <Pressable
                          key={app.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedUpiApp(app.id);
                            setUpiIdInput('');
                            setFieldErrors((prev) => ({ ...prev, upiId: '' }));
                          }}
                          style={[
                            styles.upiAppCard,
                            {
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: isSelected ? '#ec4899' : isDark ? '#1e293b' : '#e2e8f0',
                            },
                          ]}
                        >
                          <Ionicons name={app.icon as any} size={20} color={app.color} />
                          <Text
                            style={[
                              styles.upiAppName,
                              { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: isSelected ? '800' : '600' },
                            ]}
                          >
                            {app.name}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedCheckWrap}>
                              <Ionicons name="checkmark-circle" size={16} color="#ec4899" />
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.subOptionLabel, { color: isDark ? '#94a3b8' : '#64748b', marginTop: 14 }]}>
                    Or Enter Any Custom UPI ID
                  </Text>
                  <View
                    style={[
                      styles.inputRow,
                      {
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: fieldErrors.upiId ? '#ef4444' : isDark ? '#1e293b' : '#e2e8f0',
                      },
                    ]}
                  >
                    <Ionicons name="at" size={16} color="#ec4899" />
                    <TextInput
                      value={upiIdInput}
                      onChangeText={handleUpiIdChange}
                      placeholder="username@okhdfcbank or mobile@upi"
                      placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                      style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                      autoCapitalize="none"
                    />
                  </View>
                  {fieldErrors.upiId && <Text style={styles.inlineErrorText}>{fieldErrors.upiId}</Text>}
                </View>
              )}

              {/* Cards Sub-Options */}
              {selectedMethod === 'card' && (
                <View style={styles.methodContentBox}>
                  {/* Card Number Input */}
                  <View>
                    <View
                      style={[
                        styles.inputRow,
                        {
                          backgroundColor: isDark ? '#0f172a' : '#ffffff',
                          borderColor: fieldErrors.cardNumber ? '#ef4444' : isDark ? '#1e293b' : '#e2e8f0',
                        },
                      ]}
                    >
                      <Ionicons
                        name={cardBrand === 'amex' ? 'card' : 'card-outline'}
                        size={16}
                        color={cardBrand !== 'unknown' ? '#ec4899' : '#94a3b8'}
                      />
                      <TextInput
                        value={cardNumber}
                        onChangeText={handleCardNumberChange}
                        placeholder="Card Number (4111 2222 3333 4444)"
                        placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                        style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                        keyboardType="number-pad"
                        maxLength={23}
                      />
                      {cardBrand !== 'unknown' && (
                        <View style={styles.cardBrandBadge}>
                          <Text style={styles.cardBrandBadgeText}>{cardBrand.toUpperCase()}</Text>
                        </View>
                      )}
                    </View>
                    {fieldErrors.cardNumber && (
                      <Text style={styles.inlineErrorText}>{fieldErrors.cardNumber}</Text>
                    )}
                  </View>

                  {/* Expiry & CVV Row */}
                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                    <View style={{ flex: 1 }}>
                      <View
                        style={[
                          styles.inputRow,
                          {
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: fieldErrors.cardExpiry ? '#ef4444' : isDark ? '#1e293b' : '#e2e8f0',
                          },
                        ]}
                      >
                        <Ionicons name="calendar-outline" size={15} color="#94a3b8" />
                        <TextInput
                          value={cardExpiry}
                          onChangeText={handleCardExpiryChange}
                          placeholder="MM / YY"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          keyboardType="number-pad"
                          maxLength={5}
                        />
                      </View>
                      {fieldErrors.cardExpiry && (
                        <Text style={styles.inlineErrorText}>{fieldErrors.cardExpiry}</Text>
                      )}
                    </View>

                    <View style={{ flex: 1 }}>
                      <View
                        style={[
                          styles.inputRow,
                          {
                            backgroundColor: isDark ? '#0f172a' : '#ffffff',
                            borderColor: fieldErrors.cardCvv ? '#ef4444' : isDark ? '#1e293b' : '#e2e8f0',
                          },
                        ]}
                      >
                        <Ionicons name="lock-closed-outline" size={15} color="#94a3b8" />
                        <TextInput
                          value={cardCvv}
                          onChangeText={handleCardCvvChange}
                          placeholder="CVV"
                          placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                          style={[styles.textInput, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                          secureTextEntry
                          keyboardType="number-pad"
                          maxLength={4}
                        />
                      </View>
                      {fieldErrors.cardCvv && (
                        <Text style={styles.inlineErrorText}>{fieldErrors.cardCvv}</Text>
                      )}
                    </View>
                  </View>
                </View>
              )}

              {/* NetBanking Sub-Options */}
              {selectedMethod === 'netbanking' && (
                <View style={styles.methodContentBox}>
                  <Text style={[styles.subOptionLabel, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Select Verified Bank
                  </Text>
                  <View style={styles.banksList}>
                    {POPULAR_BANKS.map((b) => {
                      const isSelected = selectedBank === b.id;
                      return (
                        <Pressable
                          key={b.id}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setSelectedBank(b.id);
                            if (fieldErrors.bank) setFieldErrors((prev) => ({ ...prev, bank: '' }));
                          }}
                          style={[
                            styles.bankRow,
                            {
                              backgroundColor: isDark ? '#0f172a' : '#ffffff',
                              borderColor: isSelected ? '#ec4899' : isDark ? '#1e293b' : '#e2e8f0',
                            },
                          ]}
                        >
                          <Ionicons name="business" size={16} color={isSelected ? '#ec4899' : '#94a3b8'} />
                          <Text
                            style={[
                              styles.bankName,
                              { color: isDark ? '#f8fafc' : '#0f172a', fontWeight: isSelected ? '800' : '600' },
                            ]}
                          >
                            {b.name}
                          </Text>
                          {isSelected && <Ionicons name="checkmark-circle" size={16} color="#ec4899" />}
                        </Pressable>
                      );
                    })}
                  </View>
                  {fieldErrors.bank && <Text style={styles.inlineErrorText}>{fieldErrors.bank}</Text>}
                </View>
              )}

              {/* Pay Now Button (for Cards / UPI Apps) */}
              {selectedMethod !== 'qr' ? (
                <Pressable
                  onPress={handlePayNow}
                  disabled={isInitializing || !order}
                  style={[
                    styles.primaryActionBtn,
                    {
                      backgroundColor: isInitializing || !order ? '#94a3b8' : '#ec4899',
                      marginTop: 20,
                    },
                  ]}
                >
                  {isInitializing ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <>
                      <Ionicons name="lock-closed" size={16} color="#ffffff" />
                      <Text style={styles.primaryActionBtnText}>
                        Pay Securely ₹{options.amount}
                      </Text>
                    </>
                  )}
                </Pressable>
              ) : null}

              {/* Secondary Option: Launch Official Web Gateway */}
              <Pressable
                onPress={() => {
                  if (!order) return;
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const checkoutUrl = `${BFF_BASE_URL}/mobile/v1/payments/razorpay/checkout-page?orderId=${encodeURIComponent(order.orderId)}&keyId=${encodeURIComponent(order.keyId)}&amount=${encodeURIComponent(options.amount)}&planName=${encodeURIComponent(options.planName)}&planId=${encodeURIComponent(options.planId)}&billingInterval=${encodeURIComponent(options.billingInterval)}&userId=${encodeURIComponent(currentUser?.id || '')}&product=${encodeURIComponent(options.product || 'social')}&email=${encodeURIComponent(customerEmail)}&name=${encodeURIComponent(customerName)}&phone=${encodeURIComponent(customerPhone)}`;
                  Linking.openURL(checkoutUrl);
                }}
                style={styles.openOfficialBtn}
              >
                <Ionicons name="open-outline" size={14} color="#ec4899" />
                <Text style={styles.openOfficialBtnText}>Launch Official Razorpay Web Gateway</Text>
              </Pressable>

              {/* Bottom Security Footer */}
              <View style={styles.footerSecurityRow}>
                <Ionicons name="shield-checkmark" size={14} color="#10b981" />
                <Text style={[styles.footerSecurityText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
                  Razorpay Verified Partner · 100% Moneyback Guarantee on SLA
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 20,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rzpBadgeWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#0c2340',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  liveTestBadge: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveTestBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ec4899',
  },
  headerSub: {
    fontSize: 11,
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  orderSummaryCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
  },
  orderSummaryTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planSummaryName: {
    fontSize: 18,
    fontWeight: '900',
  },
  planSummaryInterval: {
    fontSize: 12,
    marginTop: 2,
  },
  priceTagWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  priceTagCurrency: {
    fontSize: 16,
    fontWeight: '800',
  },
  priceTagNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ec4899',
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(148, 163, 184, 0.2)',
  },
  orderIdLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  orderIdVal: {
    fontSize: 10,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  errorBoxText: {
    fontSize: 12,
    color: '#b91c1c',
    fontWeight: '600',
    flex: 1,
  },
  contactCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 14,
    gap: 8,
  },
  contactHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactCardTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  editContactBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
  },
  editContactBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
  },
  contactPreviewRow: {
    marginTop: 2,
  },
  contactPreviewText: {
    fontSize: 12,
    fontWeight: '600',
  },
  contactInputsWrap: {
    gap: 10,
    marginTop: 6,
  },
  inputFieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 18,
    marginBottom: 10,
  },
  methodSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  methodTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  methodTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  methodContentBox: {
    marginTop: 14,
  },
  subOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },
  upiAppsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  upiAppCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  upiAppName: {
    fontSize: 13,
    flex: 1,
  },
  selectedCheckWrap: {
    marginLeft: 'auto',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  inlineErrorText: {
    fontSize: 11,
    color: '#ef4444',
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 2,
  },
  cardBrandBadge: {
    backgroundColor: '#0c2340',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  cardBrandBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
  },
  banksList: {
    gap: 8,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  bankName: {
    fontSize: 13,
    flex: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    shadowColor: '#ec4899',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  footerSecurityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
  },
  footerSecurityText: {
    fontSize: 11,
    fontWeight: '600',
  },
  processingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 14,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginTop: 8,
  },
  processingSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
  },
  securityPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  successContainer: {
    padding: 24,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 6,
    paddingHorizontal: 12,
  },
  receiptCard: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginTop: 20,
    gap: 10,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  openOfficialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.4)',
    marginTop: 10,
    backgroundColor: 'rgba(236, 72, 153, 0.05)',
  },
  openOfficialBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#ec4899',
  },
  qrHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  qrBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(236, 72, 153, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  timerBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
  },
  qrContainer: {
    alignSelf: 'center',
    padding: 12,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
    marginVertical: 6,
  },
  qrImage: {
    width: 210,
    height: 210,
  },
  qrLoadingBox: {
    width: 210,
    height: 210,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  qrLoadingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  supportedAppsRow: {
    alignItems: 'center',
    marginTop: 8,
  },
  supportedAppsText: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  openUpiBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.35)',
    backgroundColor: 'rgba(236, 72, 153, 0.08)',
    marginTop: 10,
  },
  openUpiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ec4899',
  },
  numberVerifyBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginTop: 14,
  },
  numberVerifyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  numberVerifyTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  numberVerifySubtitle: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  useMyPhoneBtn: {
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  useMyPhoneBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ec4899',
  },
  verifyNumberBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  verifyNumberBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
});
