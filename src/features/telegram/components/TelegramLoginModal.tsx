import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
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
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl max-h-[85%] pt-5 px-5">
          {/* Header */}
          <View className="flex-row justify-between items-center pb-3.5 mb-4 border-b border-[#262930]">
            <View className="flex-row items-center gap-3">
              <View className="w-10 h-10 rounded-xl bg-[#0084FF]/10 items-center justify-center">
                <Ionicons name="paper-plane-outline" size={20} color="#0084FF" />
              </View>
              <View>
                <Text className="text-base font-bold text-white">
                  Connect Telegram Account
                </Text>
                <Text className="text-xs text-slate-400">
                  MTProto Session Authorization
                </Text>
              </View>
            </View>
            <Pressable onPress={handleClose} hitSlop={10} className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center">
              <Ionicons name="close" size={18} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView className="flex-1" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
            {errorMsg ? (
              <View className="flex-row items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-4">
                <Ionicons name="alert-circle-outline" size={16} color="#EF4444" />
                <Text className="text-xs font-semibold text-rose-400 flex-1">{errorMsg}</Text>
              </View>
            ) : null}

            {step === 'phone' && (
              <View>
                <Text className="text-xs text-slate-400 leading-relaxed mb-4">
                  Enter the phone number associated with your Telegram account. A verification code will be sent directly to your Telegram app.
                </Text>

                <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">
                  Telegram Phone Number
                </Text>
                <View className="flex-row items-center bg-[#111317] border border-[#262930] rounded-xl px-3.5 py-3 mb-4">
                  <Ionicons name="call-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    className="flex-1 text-sm text-white"
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+919876543210"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    autoCapitalize="none"
                  />
                </View>

                <Pressable
                  className={`bg-[#0084FF] h-12 rounded-xl flex-row items-center justify-center gap-2 ${loading ? 'opacity-60' : 'active:opacity-80'}`}
                  onPress={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text className="text-xs font-extrabold text-white uppercase tracking-wider">Send Verification Code</Text>
                      <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {step === 'otp' && (
              <View>
                <Text className="text-xs text-slate-400 leading-relaxed mb-4">
                  We sent a 5-digit verification code to your Telegram app on <Text className="font-bold text-white">{phone}</Text>.
                </Text>

                <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">
                  Telegram Login Code
                </Text>
                <View className="flex-row items-center bg-[#111317] border border-[#262930] rounded-xl px-3.5 py-3 mb-4">
                  <Ionicons name="key-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    className="flex-1 text-base text-white text-center font-extrabold tracking-widest"
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="12345"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                </View>

                <Pressable
                  className={`bg-[#0084FF] h-12 rounded-xl flex-row items-center justify-center gap-2 mb-3 ${loading ? 'opacity-60' : 'active:opacity-80'}`}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text className="text-xs font-extrabold text-white uppercase tracking-wider">Verify & Authorize</Text>
                      <Ionicons name="checkmark-circle-outline" size={16} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>

                <Pressable className="items-center py-2" onPress={() => setStep('phone')}>
                  <Text className="text-xs font-bold text-[#0084FF]">Change Phone Number</Text>
                </Pressable>
              </View>
            )}

            {step === 'password' && (
              <View>
                <Text className="text-xs text-slate-400 leading-relaxed mb-4">
                  Your Telegram account has Two-Step Verification enabled. Enter your cloud password to complete sign in.
                </Text>

                <Text className="text-[10px] font-bold text-slate-400 mb-1.5 tracking-wider uppercase">
                  2FA Cloud Password
                </Text>
                <View className="flex-row items-center bg-[#111317] border border-[#262930] rounded-xl px-3.5 py-3 mb-4">
                  <Ionicons name="lock-closed-outline" size={16} color="#94A3B8" style={{ marginRight: 8 }} />
                  <TextInput
                    className="flex-1 text-sm text-white"
                    value={password}
                    onChangeText={setPassword}
                    placeholder="Enter 2FA password"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    autoFocus
                  />
                </View>

                <Pressable
                  className={`bg-[#0084FF] h-12 rounded-xl flex-row items-center justify-center gap-2 ${loading ? 'opacity-60' : 'active:opacity-80'}`}
                  onPress={handleSubmitPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Text className="text-xs font-extrabold text-white uppercase tracking-wider">Submit Password</Text>
                      <Ionicons name="shield-checkmark-outline" size={16} color="#FFFFFF" />
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {step === 'success' && (
              <View className="items-center py-8">
                <View className="w-16 h-16 rounded-full bg-emerald-500 items-center justify-center mb-3">
                  <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
                </View>
                <Text className="text-lg font-bold text-white mb-1.5">
                  Telegram Connected!
                </Text>
                <Text className="text-xs text-slate-400 text-center leading-relaxed px-4">
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
