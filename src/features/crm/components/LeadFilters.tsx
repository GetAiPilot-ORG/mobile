import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

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
    <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-grow-0 mb-3">
      {statuses.map((st) => {
        const isSelected = selectedStatus === st.id;
        return (
          <Pressable
            key={st.id}
            className={`px-3.5 py-1.5 rounded-full mr-2 border ${
              isSelected
                ? 'bg-[#0084FF] border-[#0084FF]'
                : 'bg-[#181A1F] border-[#262930] active:bg-[#262930]'
            }`}
            onPress={() => onSelectStatus(st.id)}
          >
            <Text className={`text-xs font-semibold ${isSelected ? 'text-white font-bold' : 'text-slate-400'}`}>
              {st.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};
