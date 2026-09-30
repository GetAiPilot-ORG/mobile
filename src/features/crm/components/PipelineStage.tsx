import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useCrmTheme } from '../hooks/useCrmTheme';
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
  const { colors, accentColor, accentSoft, isDark } = useCrmTheme();
  const name = stage.label || stage.name || stage.stage || 'Stage';
  const count = stage.count ?? stage.lead_count ?? 0;
  const val = Number(stage.totalValue ?? stage.total_value ?? 0);

  return (
    <Pressable
      style={[
        styles.container,
        {
          backgroundColor: isSelected ? accentSoft : colors.card,
          borderColor: isSelected ? accentColor : colors.border,
        },
      ]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <Text
          style={[
            styles.name,
            { color: isSelected ? accentColor : colors.textSecondary },
          ]}
          numberOfLines={1}
        >
          {name}
        </Text>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: isSelected ? accentColor : isDark ? '#2C2C2E' : '#E5E7EB' },
          ]}
        >
          <Text
            style={[
              styles.countText,
              { color: isSelected ? '#FFFFFF' : colors.textPrimary },
            ]}
          >
            {count}
          </Text>
        </View>
      </View>
      <Text style={[styles.totalValue, { color: colors.textPrimary }]}>
        ₹{val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val.toLocaleString()}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 12,
    minWidth: 125,
    marginRight: 8,
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  countBadge: {
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '700',
  },
});
