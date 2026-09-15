import React from 'react';
import { StyleSheet, Text, View, Modal, Pressable, ScrollView, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '../hooks/useMembers';

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(0, 0, 0, 0.5)' }]}>
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
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Filter Records</Text>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={onClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={isDark ? '#9CA3AF' : '#64748B'} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            {/* Status Section */}
            <Text style={[styles.sectionTitle, { color: isDark ? '#D1D5DB' : '#475569' }]}>Status</Text>
            <View style={styles.chipGrid}>
              {STATUS_FILTERS.map((s) => {
                const isSelected = tempStatus === s.key;
                return (
                  <Pressable
                    key={s.key}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected
                          ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                          : isDark ? '#222630' : '#F1F5F9',
                        borderColor: isSelected ? '#3B82F6' : 'transparent',
                      },
                    ]}
                    onPress={() => setTempStatus(s.key)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: isSelected ? '#3B82F6' : isDark ? '#9CA3AF' : '#64748B',
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
                <Text style={[styles.sectionTitle, { color: isDark ? '#D1D5DB' : '#475569' }]}>Assignee</Text>
                <View style={styles.chipGrid}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: tempAssignee === 'all'
                          ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                          : isDark ? '#222630' : '#F1F5F9',
                        borderColor: tempAssignee === 'all' ? '#3B82F6' : 'transparent',
                      },
                    ]}
                    onPress={() => setTempAssignee('all')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        {
                          color: tempAssignee === 'all' ? '#3B82F6' : isDark ? '#9CA3AF' : '#64748B',
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
                            backgroundColor: isSelected
                              ? isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(59, 130, 246, 0.12)'
                              : isDark ? '#222630' : '#F1F5F9',
                            borderColor: isSelected ? '#3B82F6' : 'transparent',
                          },
                        ]}
                        onPress={() => setTempAssignee(m.id)}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            {
                              color: isSelected ? '#3B82F6' : isDark ? '#9CA3AF' : '#64748B',
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
              style={[styles.resetBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={handleReset}
            >
              <Text style={[styles.resetBtnText, { color: isDark ? '#D1D5DB' : '#475569' }]}>Reset</Text>
            </Pressable>
            <Pressable style={styles.applyBtn} onPress={handleApply}>
              <Text style={styles.applyBtnText}>Apply Filters</Text>
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
    maxHeight: '80%',
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
  scroll: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#D1D5DB',
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
    backgroundColor: '#222630',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderColor: '#3B82F6',
  },
  chipText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
  },
  resetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#262A34',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  applyBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
