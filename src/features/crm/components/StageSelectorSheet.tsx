import React from 'react';
import { Text, View, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DealStage } from '../types';

interface StageSelectorSheetProps {
  visible: boolean;
  currentStage: DealStage;
  onSelectStage: (stage: DealStage) => void;
  onClose: () => void;
}

const STAGES: Array<{ key: DealStage; label: string; desc: string; color: string }> = [
  { key: 'lead', label: 'Lead', desc: 'Initial contact, unqualified', color: '#9CA3AF' },
  { key: 'qualified', label: 'Qualified', desc: 'Needs confirmed, decision maker identified', color: '#60A5FA' },
  { key: 'proposal', label: 'Proposal', desc: 'Quote or proposal sent to client', color: '#FBBF24' },
  { key: 'negotiation', label: 'Negotiation', desc: 'Reviewing pricing and contract terms', color: '#A78BFA' },
  { key: 'closed_won', label: 'Closed Won', desc: 'Contract signed, deal won 🎉', color: '#34D399' },
  { key: 'closed_lost', label: 'Closed Lost', desc: 'Deal cancelled or lost to competitor', color: '#F87171' },
];

export const StageSelectorSheet: React.FC<StageSelectorSheetProps> = ({
  visible,
  currentStage,
  onSelectStage,
  onClose,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        className="flex-1 bg-black/80 justify-end"
        onPress={onClose}
      >
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl px-5 pt-3 pb-8">
          <View className="w-9 h-1 bg-[#262930] rounded-full self-center mb-3" />
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-lg font-bold">Update Pipeline Stage</Text>
            <Pressable
              className="p-1.5 rounded-lg bg-[#262930]"
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          <View className="gap-2">
            {STAGES.map((s) => {
              const isSelected = currentStage === s.key;
              return (
                <Pressable
                  key={s.key}
                  className={`flex-row items-center p-3 rounded-xl border ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500'
                      : 'bg-[#111317] border-[#262930]'
                  }`}
                  onPress={() => {
                    onSelectStage(s.key);
                    onClose();
                  }}
                >
                  <View className="w-2.5 h-2.5 rounded-full mr-3" style={{ backgroundColor: s.color }} />
                  <View className="flex-1">
                    <Text
                      className="text-[15px]"
                      style={{
                        color: isSelected ? s.color : '#FFFFFF',
                        fontWeight: isSelected ? '700' : '600',
                      }}
                    >
                      {s.label}
                    </Text>
                    <Text className="text-slate-400 text-xs mt-0.5">{s.desc}</Text>
                  </View>
                  {isSelected ? <Ionicons name="checkmark-circle" size={20} color={s.color} /> : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};
