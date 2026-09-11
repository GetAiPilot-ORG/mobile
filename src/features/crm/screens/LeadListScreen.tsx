import React, { useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LeadCard, LeadFilters } from '../components';
import { useLeads } from '../hooks/useLeads';
import { LeadDetailScreen } from './LeadDetailScreen';

export const LeadListScreen: React.FC = () => {
  const [status, setStatus] = useState<string>('all');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: leadsData, refetch, isRefetching } = useLeads({
    status: status !== 'all' ? status : undefined,
  });

  if (selectedLeadId) {
    return <LeadDetailScreen leadId={selectedLeadId} onBack={() => setSelectedLeadId(null)} />;
  }

  const leads = leadsData?.leads || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>All Opportunities</Text>
          <Text style={styles.subtitle}>Full Lead Directory ({leadsData?.total_count || leads.length})</Text>
        </View>

        <LeadFilters selectedStatus={status} onSelectStatus={setStatus} />

        <FlatList
          data={leads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <LeadCard lead={item} onPress={() => setSelectedLeadId(item.id)} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#6366f1" />
          }
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#020617' },
  container: { flex: 1, paddingHorizontal: 16 },
  header: { marginTop: 8, marginBottom: 12 },
  title: { color: '#f8fafc', fontSize: 24, fontWeight: '800' },
  subtitle: { color: '#64748b', fontSize: 13, marginTop: 2 },
  listContent: { paddingBottom: 24 },
});
