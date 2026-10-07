import React from 'react';
import { useRouter } from 'expo-router';
import { ContactsScreen } from '../../src/features/crm/screens/ContactsScreen';

export default function ContactsPage() {
  const router = useRouter();
  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/crm');
    }
  };
  return <ContactsScreen onSelectContact={() => {}} onBack={handleBack} />;
}
