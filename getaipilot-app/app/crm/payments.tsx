import React from 'react';
import { useRouter } from 'expo-router';
import { PaymentsScreen } from '../../src/features/crm/screens/PaymentsScreen';

export default function PaymentsPage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };
  return <PaymentsScreen onBack={handleBack} />;
}
