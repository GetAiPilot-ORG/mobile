import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { LeadDetailScreen } from '../../../../src/features/crm/screens/LeadDetailScreen';

export default function CRMLeadDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <LeadDetailScreen leadId={id || ''} />;
}
