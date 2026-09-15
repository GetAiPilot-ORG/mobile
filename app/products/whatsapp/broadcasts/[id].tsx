import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WhatsAppBroadcastDetailScreen } from '../../../../src/features/whatsapp/screens/WhatsAppBroadcastDetailScreen';

export default function WhatsAppBroadcastDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  return (
    <WhatsAppBroadcastDetailScreen
      broadcastId={id}
      onBack={() => {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/products/whatsapp');
        }
      }}
    />
  );
}
