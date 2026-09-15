import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface ProductActionCardProps {
  title: string;
  description: string;
  icon: string;
  badge?: string;
  route: string;
  accentColor?: string;
}

export const ProductActionCard: React.FC<ProductActionCardProps> = ({
  title,
  description,
  icon,
  badge,
  route,
}) => {
  const router = useRouter();

  return (
    <Pressable
      className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930] mb-3 active:opacity-80 active:scale-[0.98]"
      onPress={() => router.push(route as any)}
    >
      <View className="flex-row justify-between items-center mb-3">
        <View className="w-10 h-10 rounded-xl justify-center items-center bg-[#111317]">
          <Text className="text-xl">{icon}</Text>
        </View>
        {badge ? (
          <View className="px-2 py-1 rounded-md bg-[#0084FF]/15">
            <Text className="text-[11px] font-semibold text-[#0084FF]">{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text className="text-base font-bold text-white mb-1">{title}</Text>
      <Text className="text-[13px] leading-[18px] text-slate-400" numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
};
