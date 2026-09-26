import {
  Ionicons } from '@expo/vector-icons';
import React,
  { useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CrmTaskSkeleton } from '../../../components/skeletonScreen';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { TaskItem } from '../components/TaskItem';
import { useCreateTask, useDeleteTask, useTasks, useToggleTask } from '../hooks/useTasks';
import { CRMTask } from '../types';
import { useTheme, getColors } from '@/theme';

const TIMEFRAME_TABS: Array<{ key: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'; label: string }> = [
  { key: 'all', label: 'All Tasks' },
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' }
];

interface TasksScreenProps {
  onBack?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({ onBack }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [selectedTimeframe, setSelectedTimeframe] = useState<'all' | 'today' | 'upcoming' | 'overdue' | 'completed'>('today');
  const [showAddTask, setShowAddTask] = useState(false);

  const { data: tasks = [], isLoading, isRefetching, refetch } = useTasks({
    timeframe: selectedTimeframe,
  });

  const createTask = useCreateTask();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();

  const handleDelete = (task: CRMTask) => {
    Alert.alert('Delete Task', `Are you sure you want to delete "${task.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteTask.mutate(task.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {onBack ? (
            <Pressable
              style={[styles.backBtn, { backgroundColor: isDark ? '#1E2028' : '#F1F5F9' }]}
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
            </Pressable>
          ) : null}
          <View>
            <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Tasks & Follow-ups</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Daily schedule, reminders & client action items</Text>
          </View>
        </View>

        <Pressable
          style={styles.addBtn}
          onPress={() => setShowAddTask(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>New Task</Text>
        </Pressable>
      </View>

      {/* Timeframe Segment Tabs */}
      <View style={styles.tabContainer}>
        {TIMEFRAME_TABS.map((tab) => {
          const isSelected = selectedTimeframe === tab.key;
          return (
            <Pressable
              key={tab.key}
              style={[
                styles.tabChip,
                { backgroundColor: isDark ? '#181A20' : '#FFFFFF', borderColor: isDark ? '#262A34' : '#E2E8F0' },
                isSelected && (isDark ? styles.tabChipSelectedDark : styles.tabChipSelectedLight),
              ]}
              onPress={() => setSelectedTimeframe(tab.key)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isDark ? '#9CA3AF' : '#64748B' },
                  isSelected && styles.tabTextSelected,
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Tasks List */}
      {isLoading && !tasks ? (
        <CrmTaskSkeleton />
      ) : tasks.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="checkbox-outline" size={48} color={isDark ? '#4B5563' : '#CBD5E1'} />
          <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>No {selectedTimeframe} tasks</Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>
            {selectedTimeframe === 'completed'
              ? 'No completed tasks recorded yet.'
              : 'You have no open tasks in this view. Great job keeping up!'}
          </Text>
          <Pressable style={styles.emptyBtn} onPress={() => setShowAddTask(true)}>
            <Text style={styles.emptyBtnText}>+ Create Task</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TaskItem
              task={item}
              onToggle={(done) => toggleTask.mutate({ id: item.id, done })}
              onDelete={() => handleDelete(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#3B82F6"
              colors={['#3B82F6']}
            />
          }
        />
      )}

      {/* Add Task Modal */}
      <CreateTaskModal
        visible={showAddTask}
        onClose={() => setShowAddTask(false)}
        onSubmit={async (task) => {
          await createTask.mutateAsync(task);
        }}
        isLoading={createTask.isPending}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1E2028',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  tabChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabChipSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3B82F6',
  },
  tabChipSelectedLight: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
  },
  tabTextSelected: {
    color: '#3B82F6',
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  loaderBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderText: {
    fontSize: 13,
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
  },
  emptyBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
