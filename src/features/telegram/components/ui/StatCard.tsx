import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  bg: string;
  sub: string;
  onPress?: () => void;
  isRevenue?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, icon, color, bg, sub, onPress, isRevenue }) => {
  return (
    <Pressable
      className="w-[48.5%] p-2.5 rounded-xl border border-[#262930] bg-[#181A1F] justify-between min-h-[88px] mb-2 active:opacity-75"
      onPress={onPress}
      disabled={!onPress}
    >
      <View className="flex-row justify-between items-center mb-1">
        <Text className="text-[9px] font-extrabold text-slate-400 tracking-wider flex-1" numberOfLines={1}>{label}</Text>
        <View className="w-5.5 h-5.5 rounded-md items-center justify-center" style={{ backgroundColor: bg }}>
          <Ionicons name={icon as any} size={13} color={color} />
        </View>
      </View>
      <Text className={`text-[22px] font-extrabold tracking-tight ${isRevenue ? 'text-[#0084FF]' : 'text-white'}`}>{value}</Text>
      <View className="flex-row justify-between items-center mt-1">
        <Text className="text-[10px] text-slate-400 font-medium flex-1" numberOfLines={1}>{sub}</Text>
        {onPress && <Ionicons name="chevron-forward" size={11} color={color} />}
      </View>
    </Pressable>
  );
};
