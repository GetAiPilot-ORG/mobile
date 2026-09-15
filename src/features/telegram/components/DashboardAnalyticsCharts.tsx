import React from 'react';
import { StyleSheet, Text, View, useColorScheme } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Line, Text as SvgText, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';

export const DashboardAnalyticsCharts: React.FC = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const chartWidth = 320;
  const chartHeight = 90;

  return (
    <View style={styles.container}>
      {/* 1. Channel Join Tracking Card */}
      <View style={[styles.chartCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.chartHeaderRow}>
          <View style={styles.chartTitleGroup}>
            <Ionicons name="trending-up-outline" size={16} color="#10B981" />
            <Text style={[styles.chartTitle, isDark ? styles.textDark : styles.textLight]}>
              Channel Join Tracking
            </Text>
          </View>
          <View style={styles.badgeGreen}>
            <Text style={styles.badgeGreenText}>20 recent joins</Text>
          </View>
        </View>
        <Text style={styles.chartSubtitle}>Tracked member joins across your deep invite links.</Text>

        <View style={styles.svgContainer}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="joinGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <Stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            <Line x1="25" y1="15" x2="310" y2="15" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="40" x2="310" y2="40" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="65" x2="310" y2="65" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" />

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
        <View style={styles.xAxisRow}>
          <Text style={styles.axisLabel}>Fri 28</Text>
          <Text style={styles.axisLabel}>Sun 30</Text>
          <Text style={styles.axisLabel}>Tue 1</Text>
          <Text style={styles.axisLabel}>Thu 3</Text>
          <Text style={styles.axisLabel}>Sat 5</Text>
          <Text style={styles.axisLabel}>Mon 7</Text>
          <Text style={styles.axisLabel}>Thu 10</Text>
        </View>
      </View>

      {/* 2. TeleSub Revenue Analytics Card */}
      <View style={[styles.chartCard, isDark ? styles.cardDark : styles.cardLight]}>
        <View style={styles.chartHeaderRow}>
          <View style={styles.chartTitleGroup}>
            <Ionicons name="card-outline" size={16} color="#0284C7" />
            <Text style={[styles.chartTitle, isDark ? styles.textDark : styles.textLight]}>
              TeleSub Revenue Analytics
            </Text>
          </View>
          <View style={styles.badgeBlue}>
            <Text style={styles.badgeBlueText}>₹0</Text>
          </View>
        </View>
        <Text style={styles.chartSubtitle}>Real payment earnings from your subscription pages.</Text>

        <View style={styles.svgContainer}>
          <Svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
            <Defs>
              <LinearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0284C7" stopOpacity="0.2" />
                <Stop offset="100%" stopColor="#0284C7" stopOpacity="0.0" />
              </LinearGradient>
            </Defs>

            {/* Grid lines */}
            <Line x1="25" y1="15" x2="310" y2="15" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="40" x2="310" y2="40" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" strokeDasharray="3 3" />
            <Line x1="25" y1="65" x2="310" y2="65" stroke={isDark ? '#27272A' : '#F1F5F9'} strokeWidth="1" />

            {/* Y Axis Labels */}
            <SvgText x="8" y="18" fill="#94A3B8" fontSize="9" fontWeight="600">₹4</SvgText>
            <SvgText x="8" y="43" fill="#94A3B8" fontSize="9" fontWeight="600">₹2</SvgText>
            <SvgText x="8" y="68" fill="#94A3B8" fontSize="9" fontWeight="600">₹0</SvgText>

            {/* Baseline Path */}
            <Path
              d="M 30 65 L 305 65 L 305 65 L 30 65 Z"
              fill="url(#revenueGradient)"
            />
            <Line x1="30" y1="65" x2="305" y2="65" stroke="#0284C7" strokeWidth="2.5" />
          </Svg>
        </View>

        {/* X Axis Dates */}
        <View style={styles.xAxisRow}>
          <Text style={styles.axisLabel}>Fri 28</Text>
          <Text style={styles.axisLabel}>Sun 30</Text>
          <Text style={styles.axisLabel}>Tue 1</Text>
          <Text style={styles.axisLabel}>Thu 3</Text>
          <Text style={styles.axisLabel}>Sat 5</Text>
          <Text style={styles.axisLabel}>Mon 7</Text>
          <Text style={styles.axisLabel}>Thu 10</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
    marginBottom: 16,
  },
  chartCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#27272A',
  },
  chartHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chartTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 8,
  },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  badgeGreen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeGreenText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  badgeBlue: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeBlueText: {
    color: '#0284C7',
    fontSize: 11,
    fontWeight: '700',
  },
  svgContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  xAxisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  axisLabel: {
    fontSize: 9,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
