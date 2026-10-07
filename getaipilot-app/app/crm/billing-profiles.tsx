import React from 'react';
import { useRouter } from 'expo-router';
import { ClientProfilesScreen } from '../../src/features/crm/screens/ClientProfilesScreen';

export default function ClientProfilesPage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };
  return <ClientProfilesScreen onBack={handleBack} />;
}
