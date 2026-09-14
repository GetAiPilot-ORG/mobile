import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)' }]}
        onPress={onClose}
      >
        <View
          style={[
            styles.sheetContent,
            {
              backgroundColor: isDark ? '#181A20' : '#FFFFFF',
              borderColor: isDark ? '#262A34' : '#E2E8F0',
            },
          ]}
        >
          <View style={[styles.dragHandle, { backgroundColor: isDark ? '#374151' : '#CBD5E1' }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Update Pipeline Stage</Text>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#64748B'} />
            </Pressable>
          </View>

          <View style={styles.stageList}>
            {STAGES.map((s) => {
              const isSelected = currentStage === s.key;
              return (
                <Pressable
                  key={s.key}
                  style={[
                    styles.stageItem,
                    {
                      backgroundColor: isSelected
                        ? isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)'
                        : isDark ? '#121316' : '#F8FAFC',
                      borderColor: isSelected ? '#3B82F6' : isDark ? '#262A34' : '#E2E8F0',
                    },
                  ]}
                  onPress={() => {
                    onSelectStage(s.key);
                    onClose();
                  }}
                >
                  <View style={[styles.colorDot, { backgroundColor: s.color }]} />
                  <View style={styles.stageInfo}>
                    <Text
                      style={[
                        styles.stageLabel,
                        {
                          color: isSelected ? s.color : isDark ? '#FFFFFF' : '#0F172A',
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                    <Text style={[styles.stageDesc, { color: isDark ? '#9CA3AF' : '#64748B' }]}>{s.desc}</Text>
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
