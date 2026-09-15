import React, { useState } from 'react';
import {
  Text,
  View,
  FlatList,
  Pressable,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTasks, useCreateTask, useToggleTask, useDeleteTask } from '../hooks/useTasks';
import { TaskItem } from '../components/TaskItem';
import { CreateTaskModal } from '../components/CreateTaskModal';
import { CRMTask } from '../types';
import { CrmTaskSkeleton } from '../../../components/skeletonScreen';

const TIMEFRAME_TABS: Array<{ key: 'all' | 'today' | 'upcoming' | 'overdue' | 'completed'; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'completed', label: 'Completed' },
  { key: 'all', label: 'All Tasks' },
];

interface TasksScreenProps {
  onBack?: () => void;
}

export const TasksScreen: React.FC<TasksScreenProps> = ({ onBack }) => {
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
    <SafeAreaView className="flex-1 bg-[#0B0D10]" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3">
        <View className="flex-row items-center gap-2.5">
          {onBack ? (
            <Pressable
              className="p-1.5 rounded-lg bg-[#181A1F] border border-[#262930]"
              onPress={onBack}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={20} color="#FFFFFF" />
            </Pressable>
          ) : null}
          <View>
            <Text className="text-white text-xl font-bold tracking-tight">Tasks & Follow-ups</Text>
            <Text className="text-slate-400 text-xs mt-0.5">Daily schedule, reminders & client action items</Text>
          </View>
        </View>

        <Pressable
          className="flex-row items-center gap-1 bg-[#0084FF] px-3 py-2 rounded-xl"
          onPress={() => setShowAddTask(true)}
          hitSlop={8}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text className="text-white text-xs font-semibold">New Task</Text>
        </Pressable>
      </View>

      {/* Timeframe Segment Tabs */}
      <View className="flex-row px-4 gap-1.5 mb-3 mt-1">
        {TIMEFRAME_TABS.map((tab) => {
          const isSelected = selectedTimeframe === tab.key;
          return (
            <Pressable
              key={tab.key}
              className={`flex-1 py-2 rounded-xl items-center border ${
                isSelected
                  ? 'bg-blue-500/20 border-blue-500'
                  : 'bg-[#181A1F] border-[#262930]'
              }`}
              onPress={() => setSelectedTimeframe(tab.key)}
            >
              <Text
                className={`text-[11px] ${
                  isSelected ? 'text-blue-400 font-bold' : 'text-slate-400 font-medium'
                }`}
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
        <View className="flex-1 items-center justify-center px-8">
          <Ionicons name="checkbox-outline" size={48} color="#475569" />
          <Text className="text-white text-base font-semibold mt-3">No {selectedTimeframe} tasks</Text>
          <Text className="text-slate-400 text-xs text-center mt-1.5 mb-5">
            {selectedTimeframe === 'completed'
              ? 'No completed tasks recorded yet.'
              : 'You have no open tasks in this view. Great job keeping up!'}
          </Text>
          <Pressable
            className="bg-[#0084FF] px-4 py-2.5 rounded-xl"
            onPress={() => setShowAddTask(true)}
          >
            <Text className="text-white text-sm font-semibold">+ Create Task</Text>
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
          contentContainerClassName="px-4 pb-28"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#0084FF"
              colors={['#0084FF']}
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
