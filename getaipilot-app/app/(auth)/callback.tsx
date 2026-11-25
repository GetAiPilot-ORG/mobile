import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/core/store/authStore';
import { useTheme, getColors } from '@/theme';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    code?: string;
    token_hash?: string;
    token?: string;
    type?: string;
    error_description?: string;
    error?: string;
  }>();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const syncSession = useAuthStore((s) => s.syncSession);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const isHandledRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const handleSuccess = async (session: any) => {
      if (isHandledRef.current || isCancelled) return;
      isHandledRef.current = true;

      await syncSession({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: session.user,
      });

      // Check whether user needs onboarding (matching bot-dashboard)
      try {
        const globalCached = await AsyncStorage.getItem('@onboarding_completed_global').catch(() => null);
        const cached = await AsyncStorage.getItem(`onboarding_completed_${session.user.id}`).catch(() => null);
        if (globalCached === 'true' || cached === 'true') {
          useAuthStore.getState().setOnboardingCompleted(true);
          router.replace('/(tabs)' as any);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed, account_type, business_name, full_name, first_name')
          .eq('id', session.user.id)
          .maybeSingle();

        const isDone = Boolean(
          profile?.onboarding_completed || profile?.account_type || profile?.business_name || profile?.full_name || profile?.first_name
        );

        if (isDone) {
          useAuthStore.getState().setOnboardingCompleted(true);
          await AsyncStorage.setItem(`onboarding_completed_${session.user.id}`, 'true').catch(() => {});
          await AsyncStorage.setItem('@onboarding_completed_global', 'true').catch(() => {});
          router.replace('/(tabs)' as any);
        } else {
          useAuthStore.getState().setOnboardingCompleted(false);
          router.replace('/onboarding' as any);
        }
      } catch (e) {
        console.warn('[Callback] Profile onboarding check fallback:', e);
        router.replace('/(tabs)' as any);
      }
    };

    async function handleAuth() {
      try {
        const errorDesc = params.error_description || params.error;
        if (errorDesc) {
          throw new Error(decodeURIComponent(errorDesc));
        }

        // 1. Check raw URL for hash parameters (#access_token=...&refresh_token=...)
        const rawUrl = await Linking.getInitialURL();
        if (rawUrl && rawUrl.includes('#')) {
          const hashString = rawUrl.split('#')[1];
          const hashParams = new URLSearchParams(hashString);
          const hashAccessToken = hashParams.get('access_token');
          const hashRefreshToken = hashParams.get('refresh_token');

          if (hashAccessToken) {
            const { data, error } = await supabase.auth.setSession({
              access_token: hashAccessToken,
              refresh_token: hashRefreshToken || '',
            });
            if (!error && data?.session) {
              await handleSuccess(data.session);
              return;
            }
          }
        }

        // 2. Direct token exchange from query parameters
        if (params.access_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token || '',
          });
          if (error) throw error;
          if (data.session) {
            await handleSuccess(data.session);
            return;
          }
        }

        // 3. PKCE Auth Code exchange
        if (params.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
          if (data.session) {
            await handleSuccess(data.session);
            return;
          }
        }

        // 4. Token Hash / Magic Link Confirmation (verifyOtp)
        const tokenHash = params.token_hash || params.token;
        const otpType = (params.type as any) || 'signup';
        if (tokenHash) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: otpType,
          });
          if (error) throw error;
          if (data?.session) {
            await handleSuccess(data.session);
            return;
          }
        }

        // 5. Fallback: Check existing session in Supabase client
        const { data: existingSessionData } = await supabase.auth.getSession();
        if (existingSessionData?.session) {
          await handleSuccess(existingSessionData.session);
          return;
        }

        throw new Error('Authentication parameters missing or expired. Please request a new confirmation link.');
      } catch (err: any) {
        if (!isCancelled && !isHandledRef.current) {
          setErrorMsg(err?.message || 'Failed to authenticate. Please return to login.');
          setTimeout(() => {
            if (!isCancelled && !isHandledRef.current) {
              router.replace('/(auth)/login');
            }
          }, 3500);
        }
      }
    }

    // Auth state listener for instant background login on magic link click
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await handleSuccess(session);
      }
    });

    handleAuth();

    return () => {
      isCancelled = true;
      authListener?.subscription?.unsubscribe();
    };
  }, [params]);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {errorMsg ? (
        <View style={styles.card}>
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={[styles.title, isDark && styles.titleDark]}>Authentication Error</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>{errorMsg}</Text>
          <Text style={styles.redirectText}>Redirecting to login...</Text>
        </View>
      ) : (
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#0A84FF" />
          <Text style={[styles.title, isDark && styles.titleDark]}>Signing you in...</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            Verifying your confirmation link and preparing your workspace.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F3FB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  card: {
    alignItems: 'center',
    maxWidth: 360,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  subtitleDark: {
    color: '#777383',
  },
  redirectText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 16,
    fontWeight: '600',
  },
});
