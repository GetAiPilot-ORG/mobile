import React, { useState } from 'react';
import { FlatList, RefreshControl, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { LeadCard, PipelineStage } from '../components';
import { useLeads } from '../hooks/useLeads';
import { usePipelines } from '../hooks/usePipelines';
import { LeadDetailScreen } from './LeadDetailScreen';

export const PipelineScreen: React.FC = () => {
  const [selectedStageId, setSelectedStageId] = useState<string>('lead');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);

  const { data: pipelines } = usePipelines();
  const { data: leadsData, refetch, isRefetching } = useLeads({
    stage_id: selectedStageId,
  });

  if (selectedLeadId) {
    return <LeadDetailScreen leadId={selectedLeadId} onBack={() => setSelectedLeadId(null)} />;
  }

  const stages = pipelines?.[0]?.stages || [];
  const leads = leadsData?.leads || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Pipeline Board</Text>
          <Text style={styles.subtitle}>Stage by Stage Conversion</Text>
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={stages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <PipelineStage
              stage={item}
              isSelected={selectedStageId === item.id}
              onPress={() => setSelectedStageId(item.id)}
            />
          )}
          style={styles.stageList}
        />

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
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No leads in this stage</Text>
            </View>
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
  stageList: { flexGrow: 0, marginBottom: 14 },
  listContent: { paddingBottom: 24 },
  empty: { padding: 32, alignItems: 'center' },
  emptyText: { color: '#64748b', fontSize: 14 },
});
