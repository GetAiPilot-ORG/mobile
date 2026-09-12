import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <Text style={[styles.name, isSelected && styles.selectedText]}>{name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{count}</Text>
        </View>
      </View>
      <Text style={styles.totalValue}>
        ₹{val >= 100000 ? `${(val / 100000).toFixed(1)}L` : val.toLocaleString()}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    minWidth: 125,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  selected: {
    backgroundColor: '#1e1b4b',
    borderColor: '#6366f1',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedText: {
    color: '#818cf8',
  },
  countBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  countText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  totalValue: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
