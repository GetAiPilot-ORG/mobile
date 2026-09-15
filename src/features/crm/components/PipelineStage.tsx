import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { PipelineStage as StageType } from '../types';

interface PipelineStageProps {
  stage: StageType;
  isSelected: boolean;
  onPress: () => void;
}

export const PipelineStage: React.FC<PipelineStageProps> = ({
  stage,
  isSelected,
  onPress,
}) => {
  const name = stage.label || stage.name || stage.stage || 'Stage';
  const count = stage.count ?? stage.lead_count ?? 0;
  const val = Number(stage.totalValue ?? stage.total_value ?? 0);

  return (
    <Pressable
      className={`rounded-xl p-3 min-w-[125px] mr-2 border ${
        isSelected
          ? 'bg-[#0084FF]/20 border-[#0084FF]'
          : 'bg-[#181A1F] border-[#262930] active:bg-[#262930]'
      }`}
      onPress={onPress}
    >
      <View className="flex-row justify-between items-center mb-1">
        <Text className={`text-xs font-bold ${isSelected ? 'text-[#0084FF]' : 'text-slate-400'}`}>{name}</Text>
        <View className="bg-white/10 rounded px-1.5 py-0.5">
          <Text className="text-[10px] font-bold text-white">{count}</Text>
        </View>
      </View>
      <Text className="text-sm font-extrabold text-white">
        ₹{val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val.toLocaleString()}
      </Text>
    </Pressable>
  );
};
