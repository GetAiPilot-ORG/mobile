import React from 'react';
import { useRouter } from 'expo-router';
import { PipelineScreen } from '../../src/features/crm/screens/PipelineScreen';

export default function DealsPage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };
  return <PipelineScreen onBack={handleBack} />;
}
