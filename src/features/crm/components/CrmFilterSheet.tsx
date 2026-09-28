import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '../hooks/useMembers';
import { useTheme, getColors } from '@/theme';

interface CrmFilterSheetProps {
  visible: boolean;
  selectedStatus?: string;
  selectedAssignee?: string;
  onApply: (filters: { status?: string; assigned_to?: string }) => void;
  onReset: () => void;
  onClose: () => void;
}

const STATUS_FILTERS: Array<{ key: string; label: string }> = [
  { key: 'all', label: 'All Statuses' },
  { key: 'lead', label: 'Leads' },
  { key: 'prospect', label: 'Prospects' },
  { key: 'customer', label: 'Customers' },
  { key: 'churned', label: 'Churned' },
];

export const CrmFilterSheet: React.FC<CrmFilterSheetProps> = ({
  visible,
  selectedStatus = 'all',
  selectedAssignee = 'all',
  onApply,
  onReset,
  onClose,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [tempStatus, setTempStatus] = React.useState(selectedStatus);
  const [tempAssignee, setTempAssignee] = React.useState(selectedAssignee);

  const { data: members } = useMembers();

  React.useEffect(() => {
    setTempStatus(selectedStatus);
    setTempAssignee(selectedAssignee);
  }, [selectedStatus, selectedAssignee, visible]);

  const handleApply = () => {
    onApply({
      status: tempStatus !== 'all' ? tempStatus : undefined,
      assigned_to: tempAssignee !== 'all' ? tempAssignee : undefined,
    });
    onClose();
  };

  const handleReset = () => {
    setTempStatus('all');
    setTempAssignee('all');
    onReset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay }]}>
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
            <Text style={[styles.title, { color: colors.modalTitle }]}>Filter Records</Text>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: colors.surfaceSecondary }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.iconMuted} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Status Section */}
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Status</Text>
            <View style={styles.chipGrid}>
              {STATUS_FILTERS.map((s) => {
                const isSelected = tempStatus === s.key;
                return (
                  <Pressable
                    key={s.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? colors.accentSoft : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => setTempStatus(s.key)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? colors.primary : colors.mutedText,
                          fontWeight: isSelected ? '600' : '500',
                        },
                      ]}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Assignee Section */}
            {members && members.length > 0 ? (
              <>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Assignee</Text>
                <View style={styles.chipGrid}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: tempAssignee === 'all' ? colors.accentSoft : colors.surfaceSecondary,
                        borderColor: tempAssignee === 'all' ? colors.primary : 'transparent',
                      },
                    ]}
                    onPress={() => setTempAssignee('all')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: tempAssignee === 'all' ? colors.primary : colors.mutedText,
                          fontWeight: tempAssignee === 'all' ? '600' : '500',
                        },
                      ]}
                    >
                      All Assignees
                    </Text>
                  </Pressable>
                  {members.map((m) => {
                    const isSelected = tempAssignee === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isSelected ? colors.accentSoft : colors.surfaceSecondary,
                            borderColor: isSelected ? colors.primary : 'transparent',
                          },
                        ]}
                        onPress={() => setTempAssignee(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? colors.primary : colors.mutedText,
                              fontWeight: isSelected ? '600' : '500',
                            },
                          ]}
                        >
                          {m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            ) : null}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              style={[styles.resetBtn, { backgroundColor: colors.buttonSecondary }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetBtnText, { color: colors.buttonSecondaryForeground }]}>Reset</Text>
            </Pressable>
            <Pressable style={[styles.applyBtn, { backgroundColor: colors.primary }]} onPress={handleApply}>
              <Text style={[styles.applyBtnText, { color: colors.buttonPrimaryForeground }]}>Apply Filters</Text>
            </Pressable>
          </View>
        </View>
      </View>
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
    maxHeight: '80%',
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
  scroll: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
    marginTop: 12,
    marginBottom: 8,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
