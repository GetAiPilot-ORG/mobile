
import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ConversationScreen } from '../../src/features/inbox/screens/ConversationScreen';

export default function InboxConversationRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ConversationScreen conversationId={id} />;
}
