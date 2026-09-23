import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, useColorScheme } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../src/lib/supabase';
import { useAuthStore } from '../../src/core/store/authStore';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    access_token?: string;
    refresh_token?: string;
    code?: string;
    error_description?: string;
  }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const syncSession = useAuthStore((s) => s.syncSession);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function handleAuth() {
      try {
        if (params.error_description) {
          throw new Error(decodeURIComponent(params.error_description));
        }

        // Direct token exchange from deep link fragment or query
        if (params.access_token) {
          const { data, error } = await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token || '',
          });
          if (error) throw error;
          if (data.session) {
            await syncSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user: data.session.user,
            });
            if (!isCancelled) {
              router.replace('/(tabs)');
            }
            return;
          }
        }

        // PKCE Auth Code exchange
        if (params.code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
          if (data.session) {
            await syncSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
              user: data.session.user,
            });
            if (!isCancelled) {
              router.replace('/(tabs)');
            }
            return;
          }
        }

        // Fallback: Check existing session in Supabase client
        const { data: existingSessionData } = await supabase.auth.getSession();
        if (existingSessionData?.session) {
          await syncSession({
            access_token: existingSessionData.session.access_token,
            refresh_token: existingSessionData.session.refresh_token,
            user: existingSessionData.session.user,
          });
          if (!isCancelled) {
            router.replace('/(tabs)');
          }
          return;
        }

        throw new Error('Authentication parameters missing or expired. Please request a new login link.');
      } catch (err: any) {
        if (!isCancelled) {
          setErrorMsg(err?.message || 'Failed to authenticate. Please return to login.');
          setTimeout(() => {
            if (!isCancelled) {
              router.replace('/(auth)/login');
            }
          }, 3500);
        }
      }
    }

    handleAuth();

    return () => {
      isCancelled = true;
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
            Verifying your security credentials and preparing workspace.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#9CA3AF',
  },
  redirectText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 16,
    fontWeight: '600',
  },
});
