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
  return (
    <Pressable
      style={[styles.container, isSelected && styles.selected]}
      onPress={onPress}
    >
      <View style={styles.topRow}>
        <Text style={[styles.name, isSelected && styles.selectedText]}>{stage.name}</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{stage.lead_count}</Text>
        </View>
      </View>
      <Text style={styles.totalValue}>
        ₹{(stage.total_value >= 100000 ? `${(stage.total_value / 100000).toFixed(1)}L` : stage.total_value.toLocaleString())}
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
    backgroundColor: '#1e293b',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  countText: {
    color: '#f8fafc',
    fontSize: 10,
    fontWeight: '800',
  },
  totalValue: {
    color: '#34d399',
    fontSize: 13,
    fontWeight: '700',
  },
});
