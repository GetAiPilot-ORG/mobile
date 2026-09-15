import React from 'react';
import { Text, View, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '../hooks/useMembers';

interface CrmFilterSheetProps {
  visible: boolean;
  selectedStatus?: string;
  selectedAssignee?: string;
  onApply: (filters: { status?: string; assigned_to?: string }) => void;
  onReset: () => void;
  onClose: () => void;
}

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All Statuses' },
  { key: 'lead', label: 'Leads' },
  { key: 'prospect', label: 'Prospects' },
  { key: 'customer', label: 'Customers' },
  { key: 'churned', label: 'Churned' },
];

export const CrmFilterSheet: React.FC<CrmFilterSheetProps> = ({
  visible,
  selectedStatus = 'all',
  selectedAssignee = 'all',
  onApply,
  onReset,
  onClose,
}) => {
  const [tempStatus, setTempStatus] = React.useState(selectedStatus);
  const [tempAssignee, setTempAssignee] = React.useState(selectedAssignee);

  const { data: members } = useMembers();

  React.useEffect(() => {
    setTempStatus(selectedStatus);
    setTempAssignee(selectedAssignee);
  }, [selectedStatus, selectedAssignee, visible]);

  const handleApply = () => {
    onApply({
      status: tempStatus !== 'all' ? tempStatus : undefined,
      assigned_to: tempAssignee !== 'all' ? tempAssignee : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setTempStatus('all');
    setTempAssignee('all');
    onReset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View className="flex-1 bg-black/80 justify-end">
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl px-5 pt-3 pb-8 max-h-[80%]">
          <View className="w-9 h-1 bg-[#262930] rounded-full self-center mb-3" />
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">Filter Records</Text>
            <Pressable
              className="p-1.5 rounded-lg bg-[#262930]"
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
            {/* Status Section */}
            <Text className="text-slate-300 text-xs font-semibold mt-3 mb-2">Status</Text>
            <View className="flex-row flex-wrap gap-2">
              {STATUS_FILTERS.map((s) => {
                const isSelected = tempStatus === s.key;
                return (
                  <Pressable
                    key={s.key}
                    className={`px-3 py-2 rounded-lg border ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-[#111317] border-[#262930]'
                    }`}
                    onPress={() => setTempStatus(s.key)}
                  >
                    <Text
                      className={`text-xs ${
                        isSelected ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                      }`}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Assignee Section */}
            {members && members.length > 0 ? (
              <>
                <Text className="text-slate-300 text-xs font-semibold mt-4 mb-2">Assignee</Text>
                <View className="flex-row flex-wrap gap-2">
                  <Pressable
                    className={`px-3 py-2 rounded-lg border ${
                      tempAssignee === 'all'
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-[#111317] border-[#262930]'
                    }`}
                    onPress={() => setTempAssignee('all')}
                  >
                    <Text
                      className={`text-xs ${
                        tempAssignee === 'all' ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                      }`}
                    >
                      All Assignees
                    </Text>
                  </Pressable>
                  {members.map((m) => {
                    const isSelected = tempAssignee === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        className={`px-3 py-2 rounded-lg border ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-[#111317] border-[#262930]'
                        }`}
                        onPress={() => setTempAssignee(m.id)}
                      >
                        <Text
                          className={`text-xs ${
                            isSelected ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 py-3 rounded-xl bg-[#262930] items-center justify-center"
              onPress={handleReset}
            >
              <Text className="text-slate-300 text-sm font-semibold">Reset</Text>
            </Pressable>
            <Pressable
              className="flex-[2] py-3 rounded-xl bg-[#0084FF] items-center justify-center"
              onPress={handleApply}
            >
              <Text className="text-white text-sm font-semibold">Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};
