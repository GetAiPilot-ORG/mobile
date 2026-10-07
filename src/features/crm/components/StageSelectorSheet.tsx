import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DealStage } from '../types';
import { useTheme, getColors } from '@/theme';

interface StageSelectorSheetProps {
  visible: boolean;
  currentStage: DealStage;
  onSelectStage: (stage: DealStage) => void;
  onClose: () => void;
}

const STAGES: Array<{ key: DealStage; label: string; desc: string; color: string }> = [
  { key: 'lead', label: 'Lead', desc: 'Initial contact, unqualified', color: '#8A8D91' },
  { key: 'qualified', label: 'Qualified', desc: 'Needs confirmed, decision maker identified', color: '#647D8C' },
  { key: 'proposal', label: 'Proposal', desc: 'Quote or proposal sent to client', color: '#B8863B' },
  { key: 'negotiation', label: 'Negotiation', desc: 'Reviewing pricing and contract terms', color: '#8B5CF6' },
  { key: 'closed_won', label: 'Closed Won', desc: 'Contract signed, deal won 🎉', color: '#4F8A68' },
  { key: 'closed_lost', label: 'Closed Lost', desc: 'Deal cancelled or lost to competitor', color: '#B85C5C' },
];

export const StageSelectorSheet: React.FC<StageSelectorSheetProps> = ({
  visible,
  currentStage,
  onSelectStage,
  onClose,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <Pressable
        style={[styles.backdrop, { backgroundColor: colors.overlay }]}
        onPress={onClose}
      >
        <View
          style={[
            styles.sheetContent,
            {
              backgroundColor: colors.modalBackground,
              borderColor: colors.modalBorder,
            },
          ]}
        >
          <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.modalTitle }]}>Update Pipeline Stage</Text>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.iconMuted} />
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
                      backgroundColor: isSelected ? colors.accentSoft : colors.surfaceSecondary,
                      borderColor: isSelected ? colors.primary : colors.border,
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
                          color: isSelected ? s.color : colors.text,
                          fontWeight: isSelected ? '700' : '600',
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                    <Text style={[styles.stageDesc, { color: colors.mutedText }]}>{s.desc}</Text>
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
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 32,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  dragHandle: {
    width: 36,
    height: 4,
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
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
  },
  stageList: {
    gap: 8,
  },
  stageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: '600',
  },
  stageDesc: {
    fontSize: 11,
    marginTop: 2,
  },
});
