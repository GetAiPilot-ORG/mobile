import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { GlobalErrorBoundary } from '../src/components/GlobalErrorBoundary';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    },
  },
});

// This component handles the routing based on auth and onboarding state
function RootLayoutNav() {
  const { session, isLoading, onboardingComplete } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = (segments[0] as string) === '(auth)';
    const inOnboarding = (segments[0] as string) === 'onboarding';

    if (!session && !inAuthGroup) {
      // Unauthenticated -> redirect to login
      router.replace('/(auth)/login' as any);
    } else if (session) {
      if (!onboardingComplete && !inOnboarding) {
        // Needs onboarding -> redirect to onboarding
        router.replace('/onboarding' as any);
      } else if ((inAuthGroup || (inOnboarding && onboardingComplete))) {
        // Logged in & completed -> redirect to main tabs
        router.replace('/(tabs)' as any);
      }
    }
  }, [session, isLoading, onboardingComplete, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <GlobalErrorBoundary>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RootLayoutNav />
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GlobalErrorBoundary>
  );
}
