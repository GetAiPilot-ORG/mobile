import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
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
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheetContent}>
          <View style={styles.dragHandle} />
          <View style={styles.header}>
            <Text style={styles.title}>Update Pipeline Stage</Text>
            <Pressable style={styles.closeBtn} onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          <View style={styles.stageList}>
            {STAGES.map((s) => {
              const isSelected = currentStage === s.key;
              return (
                <Pressable
                  key={s.key}
                  style={[styles.stageItem, isSelected && styles.stageItemSelected]}
                  onPress={() => {
                    onSelectStage(s.key);
                    onClose();
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: s.color }]} />
                  <View style={styles.stageInfo}>
                    <Text style={[styles.stageLabel, isSelected && { color: s.color, fontWeight: '700' }]}>
                      {s.label}
                    </Text>
                    <Text style={styles.stageDesc}>{s.desc}</Text>
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

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#181A20',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#374151',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#262A34',
  },
  stageList: {
    gap: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#121316',
    borderWidth: 1,
    borderColor: '#262A34',
  },
  stageItemSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderColor: '#3B82F6',
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  stageInfo: {
    flex: 1,
  },
  stageLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  stageDesc: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 2,
  },
});
