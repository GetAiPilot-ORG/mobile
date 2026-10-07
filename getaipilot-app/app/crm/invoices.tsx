import React from 'react';
import { useRouter } from 'expo-router';
import { InvoicesScreen } from '../../src/features/crm/screens/InvoicesScreen';

export default function InvoicesPage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };
  return <InvoicesScreen onBack={handleBack} />;
}
