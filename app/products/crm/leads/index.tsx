import React from 'react';
import { useRouter } from 'expo-router';
import { LeadListScreen } from '../../../../src/features/crm/screens/LeadListScreen';

export default function CRMLeadsRoute() {
  const router = useRouter();
  return (
    <LeadListScreen
      onSelectLead={(id) => router.push(`/products/crm/leads/${id}` as any)}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/products/crm');
        }
      }}
    />
  );
}
