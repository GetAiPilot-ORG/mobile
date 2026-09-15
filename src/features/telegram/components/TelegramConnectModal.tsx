import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
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
  const [step, setStep] = useState<'phone' | 'otp' | 'password'>('phone');
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
      <View className="flex-1 bg-black/70 justify-end">
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl p-5 pb-9">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-row items-center gap-2.5">
              <View className="w-9 h-9 rounded-xl bg-[#0084FF]/10 items-center justify-center">
                <Ionicons name="paper-plane" size={18} color="#0084FF" />
              </View>
              <Text className="text-base font-extrabold text-white">
                {isConnected ? 'Telegram Account' : 'Connect Telegram'}
              </Text>
            </View>
            <Pressable onPress={onClose} className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center">
              <Ionicons name="close" size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {/* Error Message */}
          {error && (
            <View className="flex-row items-center gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl mb-3">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-xs font-semibold text-rose-400 flex-1">{error}</Text>
            </View>
          )}

          {/* Body */}
          {isConnected ? (
            <View className="gap-4">
              <View className="flex-row items-center gap-3 p-3.5 rounded-xl bg-[#111317] border border-[#262930]">
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                <View className="flex-1">
                  <Text className="text-sm font-bold text-white">
                    {connectedPhone || 'Telegram Active'}
                  </Text>
                  <Text className="text-xs text-emerald-400 font-semibold mt-0.5">MTProto Session Connected</Text>
                </View>
              </View>
              <Pressable
                onPress={handleLogout}
                disabled={loading}
                className={`flex-row items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/30 bg-rose-500/10 ${loading ? 'opacity-70' : 'active:bg-rose-500/20'}`}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#EF4444" />
                ) : (
                  <>
                    <Ionicons name="log-out-outline" size={18} color="#EF4444" />
                    <Text className="text-xs font-bold text-rose-400">Disconnect Account</Text>
                  </>
                )}
              </Pressable>
            </View>
          ) : (
            <View className="gap-3">
              {step === 'phone' && (
                <View>
                  <Text className="text-xs text-slate-400 leading-relaxed mb-3">
                    Enter your international phone number with country code to connect your Telegram account.
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+919876543210"
                    placeholderTextColor="#64748B"
                    keyboardType="phone-pad"
                    autoFocus
                    className="bg-[#111317] border border-[#262930] rounded-xl px-3.5 py-3 text-sm text-white mb-3"
                  />
                  <Pressable
                    onPress={handleStartLogin}
                    disabled={loading}
                    className={`bg-[#0084FF] py-3.5 rounded-xl items-center justify-center ${loading ? 'opacity-70' : 'active:opacity-80'}`}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-xs font-extrabold text-white uppercase tracking-wider">Send Verification Code</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {step === 'otp' && (
                <View>
                  <Text className="text-xs text-slate-400 leading-relaxed mb-3">
                    Enter the login code sent directly to your Telegram mobile or desktop application.
                  </Text>
                  <TextInput
                    value={otp}
                    onChangeText={setOtp}
                    placeholder="12345"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    autoFocus
                    className="bg-[#111317] border border-[#262930] rounded-xl px-3.5 py-3 text-base text-white text-center font-bold tracking-widest mb-3"
                  />
                  <Pressable
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    className={`bg-[#0084FF] py-3.5 rounded-xl items-center justify-center ${loading ? 'opacity-70' : 'active:opacity-80'}`}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-xs font-extrabold text-white uppercase tracking-wider">Verify Code</Text>
                    )}
                  </Pressable>
                </View>
              )}

              {step === 'password' && (
                <View>
                  <Text className="text-xs text-slate-400 leading-relaxed mb-3">
                    Your Telegram account is protected by 2-Step Verification. Enter your cloud password.
                  </Text>
                  <TextInput
                    value={password}
                    onChangeText={setPassword}
                    placeholder="2FA Password"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    autoFocus
                    className="bg-[#111317] border border-[#262930] rounded-xl px-3.5 py-3 text-sm text-white mb-3"
                  />
                  <Pressable
                    onPress={handleVerifyPassword}
                    disabled={loading}
                    className={`bg-[#0084FF] py-3.5 rounded-xl items-center justify-center ${loading ? 'opacity-70' : 'active:opacity-80'}`}
                  >
                    {loading ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text className="text-xs font-extrabold text-white uppercase tracking-wider">Complete Authentication</Text>
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
