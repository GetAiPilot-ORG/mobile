import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { useCrmTheme } from '../hooks/useCrmTheme';

interface LeadFiltersProps {
  selectedStatus: string;
  onSelectStatus: (status: string) => void;
}

export const LeadFilters: React.FC<LeadFiltersProps> = ({
  selectedStatus,
  onSelectStatus,
}) => {
  const { colors, accentColor, accentSoft, accentBorder } = useCrmTheme();

  const statuses = [
    { id: 'all', label: 'All Deals' },
    { id: 'active', label: 'Active Pipeline' },
    { id: 'won', label: 'Closed Won 🏆' },
    { id: 'lost', label: 'Closed Lost' },
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      {statuses.map((st) => {
        const isActive = selectedStatus === st.id;
        return (
          <Pressable
            key={st.id}
            style={[
              styles.pill,
              {
                backgroundColor: isActive ? accentColor : colors.surface,
                borderColor: isActive ? accentColor : colors.border,
              },
            ]}
            onPress={() => onSelectStatus(st.id)}
          >
            <Text
              style={[
                styles.text,
                {
                  color: isActive ? '#FFFFFF' : colors.textSecondary,
                  fontWeight: isActive ? '700' : '600',
                },
              ]}
            >
              {st.label}
            </Text>
          </Pressable>
        );
      })}
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
    marginRight: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 12,
  },
});
