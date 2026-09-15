import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

interface LeadFiltersProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  selectedStatus,
  onSelectStatus,
}) => {
  const statuses = [
    { id: 'all', label: 'All Deals' },
    { id: 'active', label: 'Active Pipeline' },
    { id: 'won', label: 'Closed Won 🏆' },
    { id: 'lost', label: 'Closed Lost' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {statuses.map((st) => (
        <Pressable
          key={st.id}
          style={[styles.pill, selectedStatus === st.id && styles.activePill]}
          onPress={() => onSelectStatus(st.id)}
        >
          <Text style={[styles.text, selectedStatus === st.id && styles.activeText]}>
            {st.label}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 0,
    marginBottom: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: '#0f172a',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  activePill: {
    backgroundColor: '#6366f1',
    borderColor: '#6366f1',
  },
  text: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  },
  activeText: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
