import 'react-native-gesture-handler';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import React, { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GlobalErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { AuthProvider } from '../src/contexts/AuthContext';
import { useAuthStore } from '../src/core/store/authStore';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      retry: (failureCount, error: any) => {
        // Do not retry 400, 401, 403, 404 or 502 errors to prevent request storms
        const msg = (error?.message || '').toLowerCase();
        const status = error?.status || error?.statusCode || (error?.response ? error.response.status : undefined);
        if (
          status === 400 ||
          status === 401 ||
          status === 403 ||
          status === 404 ||
          status === 502 ||
          msg.includes('400') ||
          msg.includes('401') ||
          msg.includes('403') ||
          msg.includes('404') ||
          msg.includes('forbidden') ||
          msg.includes('not authenticated') ||
          msg.includes('session expired') ||
          msg.includes('unauthorized') ||
          msg.includes('unavailable')
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
  },
});

/**
 * Authoritative, single-point auth route guard.
 * Listens exclusively to [authStatus, segments] and performs redirects
 * ONLY after session hydration has resolved.
 */
function AuthRouteGuard() {
  const authStatus = useAuthStore((s) => s.authStatus);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. NEVER navigate during hydration
    if (authStatus === 'hydrating') return;

    // 2. Identify active route group
    const segment0 = segments[0] as string | undefined;
    const inAuthGroup = segment0 === '(auth)';

    if (authStatus === 'unauthenticated' && !inAuthGroup) {
      if (__DEV__) {
        console.log('[AuthGuard] Unauthenticated user on protected route -> navigating to login');
      }
      router.replace('/(auth)/login' as any);
    } else if (authStatus === 'authenticated' && inAuthGroup) {
      if (__DEV__) {
        console.log('[AuthGuard] Authenticated user on auth route -> navigating to tabs');
      }
      router.replace('/(tabs)' as any);
    }
  }, [authStatus, segments]);

  return null;
}

function SplashOverlay() {
  const authStatus = useAuthStore((s) => s.authStatus);

  if (authStatus !== 'hydrating') {
    return null;
  }

  return (
    <View style={[StyleSheet.absoluteFill, styles.splashContainer]}>
      <ActivityIndicator size="large" color="#6366f1" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GlobalErrorBoundary>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AuthRouteGuard />
              {/* Native Stack for iOS screen transitions & gesture-driven back navigations */}
              <Stack
                screenOptions={{
                  headerShown: false,
                  gestureEnabled: true,
                  fullScreenGestureEnabled: true,
                  gestureDirection: 'horizontal',
                  animation: 'default',
                  animationDuration: 250,
                }}
              >
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen
                  name="account/plans"
                  options={{
                    headerShown: false,
                    presentation: 'modal',
                    gestureEnabled: true,
                  }}
                />
              </Stack>
              <SplashOverlay />
            </AuthProvider>
          </QueryClientProvider>
        </SafeAreaProvider>
      </GlobalErrorBoundary>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    backgroundColor: '#020617',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
});

