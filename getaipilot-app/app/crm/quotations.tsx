import React from 'react';
import { useRouter } from 'expo-router';
import { QuotationsScreen } from '../../src/features/crm/screens/QuotationsScreen';

export default function QuotationsPage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };
  return <QuotationsScreen onBack={handleBack} />;
}
