import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export const DashboardAnalyticsCharts: React.FC = () => {
  const chartWidth = 320;
  const chartHeight = 90;

  return (
    <View className="gap-3 mb-4">
      {/* 1. Channel Join Tracking Card */}
      <View className="rounded-2xl border p-3.5 bg-[#181A1F] border-[#262930]">
        <View className="flex-row justify-between items-center mb-0.5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="trending-up-outline" size={16} color="#10B981" />
            <Text className="text-sm font-bold text-white">
              Channel Join Tracking
            </Text>
          </View>
          <View className="bg-emerald-500/10 px-2 py-0.5 rounded-md">
            <Text className="text-emerald-400 text-xs font-bold">20 recent joins</Text>
          </View>
        </View>
        <Text className="text-xs text-slate-400 mb-2">Tracked member joins across your deep invite links.</Text>

        <View className="items-center justify-center mt-1">
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="joinGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            <Line x1="25" y1="15" x2="310" y2="15" stroke="#262930" strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="40" x2="310" y2="40" stroke="#262930" strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="65" x2="310" y2="65" stroke="#262930" strokeWidth="1" />

            {/* Y Axis Labels */}
            <SvgText x="8" y="18" fill="#94A3B8" fontSize="9" fontWeight="600">4</SvgText>
            <SvgText x="8" y="43" fill="#94A3B8" fontSize="9" fontWeight="600">2</SvgText>
            <SvgText x="8" y="68" fill="#94A3B8" fontSize="9" fontWeight="600">0</SvgText>

            {/* Gradient Fill under Path */}
            <Path
              d="M 30 65 L 50 65 L 75 60 L 100 65 L 125 45 L 150 65 L 175 65 L 200 65 L 225 35 L 250 65 L 275 65 L 305 65 L 305 65 L 30 65 Z"
              fill="url(#joinGradient)"
            />

            {/* Smooth Trend Line */}
            <Path
              d="M 30 65 L 50 65 L 75 60 L 100 65 L 125 45 L 150 65 L 175 65 L 200 65 L 225 35 L 250 65 L 275 65 L 305 65"
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
            />

            {/* Active Data Points */}
            <Circle cx="125" cy="45" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
            <Circle cx="225" cy="35" r="3.5" fill="#10B981" stroke="#FFFFFF" strokeWidth="1.5" />
          </Svg>
        </View>

        {/* X Axis Dates */}
        <View className="flex-row justify-between px-6 mt-1">
          <Text className="text-[10px] text-slate-400 font-semibold">Fri 28</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Sun 30</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Tue 1</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Thu 3</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Sat 5</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Mon 7</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Thu 10</Text>
        </View>
      </View>

      {/* 2. TeleSub Revenue Analytics Card */}
      <View className="rounded-2xl border p-3.5 bg-[#181A1F] border-[#262930]">
        <View className="flex-row justify-between items-center mb-0.5">
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="card-outline" size={16} color="#0084FF" />
            <Text className="text-sm font-bold text-white">
              TeleSub Revenue Analytics
            </Text>
          </View>
          <View className="bg-[#0084FF]/10 px-2 py-0.5 rounded-md">
            <Text className="text-[#0084FF] text-xs font-bold">₹0</Text>
          </View>
        </View>
        <Text className="text-xs text-slate-400 mb-2">Real payment earnings from your subscription pages.</Text>

        <View className="items-center justify-center mt-1">
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0084FF" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#0084FF" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            <Line x1="25" y1="15" x2="310" y2="15" stroke="#262930" strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="40" x2="310" y2="40" stroke="#262930" strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="65" x2="310" y2="65" stroke="#262930" strokeWidth="1" />

            {/* Y Axis Labels */}
            <SvgText x="8" y="18" fill="#94A3B8" fontSize="9" fontWeight="600">₹4</SvgText>
            <SvgText x="8" y="43" fill="#94A3B8" fontSize="9" fontWeight="600">₹2</SvgText>
            <SvgText x="8" y="68" fill="#94A3B8" fontSize="9" fontWeight="600">₹0</SvgText>

            {/* Baseline Path */}
            <Path
              d="M 30 65 L 305 65 L 305 65 L 30 65 Z"
              fill="url(#revenueGradient)"
            />
            <Line x1="30" y1="65" x2="305" y2="65" stroke="#0084FF" strokeWidth="2.5" />
          </Svg>
        </View>

        {/* X Axis Dates */}
        <View className="flex-row justify-between px-6 mt-1">
          <Text className="text-[10px] text-slate-400 font-semibold">Fri 28</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Sun 30</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Tue 1</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Thu 3</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Sat 5</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Mon 7</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">Thu 10</Text>
        </View>
      </View>
    </View>
  );
};

