import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { WhatsAppBroadcastDetailScreen } from '../../../../src/features/whatsapp/screens/WhatsAppBroadcastDetailScreen';

export default function WhatsAppBroadcastDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <WhatsAppBroadcastDetailScreen broadcastId={id} />;
}
