import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TelegramConnectModalProps {
  visible: boolean;
  onClose: () => void;
  onStartLogin: (phone: string) => Promise<any>;
  onVerifyOtp: (otp: string) => Promise<any>;
  onVerifyPassword: (password: string, phone?: string) => Promise<any>;
  onLogout: () => Promise<any>;
  isConnected: boolean;
  connectedPhone?: string | null;
}

export const TelegramConnectModal: React.FC<TelegramConnectModalProps> = ({
  visible,
  onClose,
  onStartLogin,
  onVerifyOtp,
  onVerifyPassword,
  onLogout,
  isConnected,
  connectedPhone,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState<'phone' | 'otp' | 'password'>(isConnected ? 'phone' : 'phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!visible) return null;

  const handleStartLogin = async () => {
    if (!phone.trim() || phone.length < 8) {
      setError('Please enter a valid international phone number (e.g. +919876543210)');
      return;
    }
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await onStartLogin(phone.trim());
      if (res?.status === 'already_connected') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        setStep('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code. Please check phone format.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter the code sent to your Telegram app.');
      return;
    }
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await onVerifyOtp(otp.trim());
      if (res?.status === 'needs_password' || res?.next === 'password_required') {
        setStep('password');
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPassword = async () => {
    if (!password.trim()) {
      setError('Please enter your 2-Step Verification password.');
      return;
    }
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onVerifyPassword(password.trim(), phone.trim());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Incorrect 2FA password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setError(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onLogout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to disconnect account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.iconWrap, { backgroundColor: 'rgba(14, 165, 233, 0.15)' }]}>
                <Ionicons name="paper-plane" size={20} color="#0ea5e9" />
              </View>
              <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                {isConnected ? 'Telegram Account' : 'Connect Telegram'}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
            </Pressable>
          </View>

          {/* Error Message */}
          {error && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Body */}
          {isConnected ? (
            <View style={styles.connectedWrap}>
              <View style={styles.accountBadge}>
                <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                <View>
                  <Text style={[styles.accountPhone, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                    {connectedPhone || 'Telegram Active'}
                  </Text>
                  <Text style={styles.accountStatus}>MTProto Session Connected</Text>
                </View>
              </View>
              <Pressable
                onPress={handleLogout}
                disabled={loading}
                style={[styles.disconnectBtn, loading && { opacity: 0.7 }]}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ef4444" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                    <Text style={styles.disconnectBtnText}>Disconnect Account</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View style={styles.formWrap}>
              {step === 'phone' && (
                <View>
                  <Text style={[styles.stepHint, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Enter your international phone number with country code to connect your Telegram account.
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+919876543210"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    keyboardType="phone-pad"
                    autoFocus
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                      },
                    ]}
                  />
                  <Pressable
                    onPress={handleStartLogin}
                    disabled={loading}
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Send Verification Code</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {step === 'otp' && (
                <View>
                  <Text style={[styles.stepHint, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Enter the login code sent directly to your Telegram mobile or desktop application.
                  </Text>
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="12345"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    keyboardType="number-pad"
                    autoFocus
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                      },
                    ]}
                  />
                  <Pressable
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Verify Code</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {step === 'password' && (
                <View>
                  <Text style={[styles.stepHint, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                    Your Telegram account is protected by 2-Step Verification. Enter your cloud password.
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="2FA Password"
                    placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
                    secureTextEntry
                    autoFocus
                    style={[
                      styles.input,
                      {
                        backgroundColor: isDark ? '#1e293b' : '#f8fafc',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        borderColor: isDark ? '#334155' : '#e2e8f0',
                      },
                    ]}
                  />
                  <Pressable
                    onPress={handleVerifyPassword}
                    disabled={loading}
                    style={[styles.submitBtn, loading && { opacity: 0.7 }]}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                      <Text style={styles.submitBtnText}>Complete Authentication</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          )}
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
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    flex: 1,
  },
  formWrap: {
    gap: 12,
  },
  stepHint: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 14,
  },
  submitBtn: {
    backgroundColor: '#0ea5e9',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
  connectedWrap: {
    gap: 16,
  },
  accountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
  },
  accountPhone: {
    fontSize: 15,
    fontWeight: '700',
  },
  accountStatus: {
    fontSize: 12,
    color: '#22c55e',
    fontWeight: '600',
  },
  disconnectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  disconnectBtnText: {
    color: '#ef4444',
    fontSize: 13,
    fontWeight: '700',
  },
});
