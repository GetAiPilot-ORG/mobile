import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TelegramLoginModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onStartLogin: (phone: string) => Promise<{ success: boolean; message: string; phone_code_hash?: string }>;
  onVerifyOtp: (payload: { phone: string; otp: string; phone_code_hash?: string }) => Promise<{ success: boolean; message: string; requires_password?: boolean }>;
  onSubmitPassword: (password: string) => Promise<{ success: boolean; message: string }>;
}

type LoginStep = 'phone' | 'otp' | 'password' | 'success';

export const TelegramLoginModal: React.FC<TelegramLoginModalProps> = ({
  visible,
  onClose,
  onSuccess,
  onStartLogin,
  onVerifyOtp,
  onSubmitPassword,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [step, setStep] = useState<LoginStep>('phone');
  const [phone, setPhone] = useState('+91');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [phoneCodeHash, setPhoneCodeHash] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const resetState = () => {
    setStep('phone');
    setPhone('+91');
    setOtp('');
    setPassword('');
    setPhoneCodeHash(undefined);
    setLoading(false);
    setErrorMsg(null);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const handleSendOtp = async () => {
    if (!phone || phone.trim().length < 8) {
      setErrorMsg('Please enter a valid international phone number (e.g. +919876543210)');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const res = await onStartLogin(phone.trim());
      if (res.phone_code_hash) {
        setPhoneCodeHash(res.phone_code_hash);
      }
      setStep('otp');
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to send OTP. Please check the phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 4) {
      setErrorMsg('Please enter the verification code sent to your Telegram app.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const res = await onVerifyOtp({
        phone: phone.trim(),
        otp: otp.trim(),
        phone_code_hash: phoneCodeHash,
      });

      if (res.requires_password) {
        setStep('password');
      } else {
        setStep('success');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          onSuccess();
          handleClose();
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Invalid OTP code. Please verify the code in your Telegram app.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitPassword = async () => {
    if (!password) {
      setErrorMsg('Please enter your Telegram 2FA Cloud Password.');
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await onSubmitPassword(password);
      setStep('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        onSuccess();
        handleClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Incorrect 2FA password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.overlay}>
        <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : 'rgba(2,132,199,0.1)' }]}>
                <Ionicons name="paper-plane-outline" size={22} color="#0284C7" />
              </View>
              <View>
                <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>
                  Connect Telegram Account
                </Text>
                <Text style={[styles.subtitle, isDark ? styles.subDark : styles.subLight]}>
                  MTProto Session Authorization
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} hitSlop={10} style={styles.closeBtn}>
              <Ionicons name="close" size={20} color={isDark ? '#94A3B8' : '#64748B'} />
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={{ paddingBottom: 24 }}>
            {errorMsg ? (
              <View style={[styles.errorBanner, isDark ? styles.errorBannerDark : styles.errorBannerLight]}>
                <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            ) : null}

            {step === 'phone' && (
              <View>
                <Text style={[styles.infoText, isDark ? styles.subDark : styles.subLight]}>
                  Enter the phone number associated with your Telegram account. A verification code will be sent directly to your Telegram app.
                </Text>

                <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>
                  Telegram Phone Number
                </Text>
                <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
                  <Ionicons name="call-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, isDark ? styles.textDark : styles.textLight]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+919876543210"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>

                <Pressable
                  style={[styles.actionBtn, loading && styles.btnDisabled]}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionBtnText}>Send Verification Code</Text>
                      <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {step === 'otp' && (
              <View>
                <Text style={[styles.infoText, isDark ? styles.subDark : styles.subLight]}>
                  We sent a 5-digit verification code to your Telegram app on <Text style={{ fontWeight: '700' }}>{phone}</Text>.
                </Text>

                <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>
                  Telegram Login Code
                </Text>
                <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
                  <Ionicons name="key-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, isDark ? styles.textDark : styles.textLight, { letterSpacing: 4, fontSize: 18, fontWeight: '700' }]}
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="12345"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <Pressable
                  style={[styles.actionBtn, loading && styles.btnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionBtnText}>Verify & Authorize</Text>
                      <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>

                <Pressable style={styles.backBtn} onPress={() => setStep('phone')}>
                  <Text style={[styles.backBtnText, { color: '#0284C7' }]}>Change Phone Number</Text>
                </Pressable>
              </View>
            )}

            {step === 'password' && (
              <View>
                <Text style={[styles.infoText, isDark ? styles.subDark : styles.subLight]}>
                  Your Telegram account has Two-Step Verification enabled. Enter your cloud password to complete sign in.
                </Text>

                <Text style={[styles.label, isDark ? styles.textDark : styles.textLight]}>
                  2FA Cloud Password
                </Text>
                <View style={[styles.inputBox, isDark ? styles.inputDark : styles.inputLight]}>
                  <Ionicons name="lock-closed-outline" size={18} color={isDark ? '#94A3B8' : '#64748B'} style={{ marginRight: 8 }} />
                  <TextInput
                    style={[styles.input, isDark ? styles.textDark : styles.textLight]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter 2FA password"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    secureTextEntry
                    autoFocus
                  />
                </View>

                <Pressable
                  style={[styles.actionBtn, loading && styles.btnDisabled]}
                  onPress={handleSubmitPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text style={styles.actionBtnText}>Submit Password</Text>
                      <Ionicons name="shield-checkmark-outline" size={18} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {step === 'success' && (
              <View style={styles.successBox}>
                <View style={styles.successIcon}>
                  <Ionicons name="checkmark-done" size={36} color="#FFFFFF" />
                </View>
                <Text style={[styles.successTitle, isDark ? styles.textDark : styles.textLight]}>
                  Telegram Connected!
                </Text>
                <Text style={[styles.successSubtitle, isDark ? styles.subDark : styles.subLight]}>
                  Your MTProto Telegram session is now active. Synced channels and autoforwarding are live.
                </Text>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
  },
  containerDark: {
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  textLight: {
    color: '#0F172A',
  },
  textDark: {
    color: '#F8FAFC',
  },
  subLight: {
    color: '#64748B',
  },
  subDark: {
    color: '#94A3B8',
  },
  body: {
    paddingTop: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 20,
  },
  inputLight: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  inputDark: {
    borderColor: '#334155',
    backgroundColor: '#0F172A',
  },
  input: {
    flex: 1,
    fontSize: 15,
  },
  actionBtn: {
    backgroundColor: '#0284C7',
    borderRadius: 12,
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 4,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  backBtn: {
    alignItems: 'center',
    marginTop: 16,
    padding: 8,
  },
  backBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorBannerLight: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorBannerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    flex: 1,
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  successIcon: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
});
