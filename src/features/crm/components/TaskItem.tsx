import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMTask, TaskPriority } from '../types';

interface TaskItemProps {
  task: CRMTask;
  onToggle: (done: boolean) => void;
  onPress?: () => void;
  onDelete?: () => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#94A3B8', bg: 'bg-slate-700/20' },
  medium: { label: 'Medium', color: '#0084FF', bg: 'bg-[#0084FF]/20' },
  high: { label: 'High', color: '#F59E0B', bg: 'bg-amber-500/20' },
  urgent: { label: 'Urgent', color: '#EF4444', bg: 'bg-rose-500/20' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onPress, onDelete }) => {
  const isDone = task.status === 'done';
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !isDone && task.due_date && task.due_date < todayStr;
  const isToday = !isDone && task.due_date === todayStr;

  return (
    <Pressable
      className={`bg-[#181A1F] border border-[#262930] rounded-2xl p-3.5 mb-2.5 active:bg-[#262930] ${
        isDone ? 'opacity-60 bg-[#111317]' : ''
      }`}
      onPress={onPress}
    >
      <View className="flex-row items-start">
        {/* Interactive Checkbox */}
        <Pressable
          className={`w-5 h-5 rounded-md border-2 items-center justify-center mr-3 mt-0.5 ${
            isDone ? 'bg-emerald-500 border-emerald-500' : 'border-slate-500'
          }`}
          onPress={() => onToggle(!isDone)}
          hitSlop={8}
        >
          {isDone ? <Ionicons name="checkmark" size={13} color="#FFFFFF" /> : null}
        </Pressable>

        {/* Info */}
        <View className="flex-1 mr-2">
          <Text
            className={`text-sm font-bold text-white ${
              isDone ? 'line-through text-slate-500' : ''
            }`}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              className={`text-xs text-slate-400 mt-0.5 ${
                isDone ? 'line-through text-slate-600' : ''
              }`}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}

          {/* Context pill */}
          {task.contact || task.deal ? (
            <View className="flex-row flex-wrap gap-1.5 mt-1.5">
              {task.contact ? (
                <View className="flex-row items-center gap-1 bg-[#111317] border border-[#262930] px-1.5 py-0.5 rounded">
                  <Ionicons name="person-outline" size={10} color="#94A3B8" />
                  <Text className="text-[10px] text-slate-300" numberOfLines={1}>
                    {`${task.contact.first_name || ''} ${task.contact.last_name || ''}`.trim()}
                  </Text>
                </View>
              ) : null}

              {task.deal ? (
                <View className="flex-row items-center gap-1 bg-[#111317] border border-[#262930] px-1.5 py-0.5 rounded">
                  <Ionicons name="briefcase-outline" size={10} color="#94A3B8" />
                  <Text className="text-[10px] text-slate-300" numberOfLines={1}>
                    {task.deal.title}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Priority Badge */}
        <View className={`px-2 py-0.5 rounded-md ${priorityCfg.bg}`}>
          <Text className="text-[10px] font-bold" style={{ color: priorityCfg.color }}>
            {priorityCfg.label}
          </Text>
        </View>
      </View>

      {/* Bottom info row */}
      <View className="flex-row items-center justify-between pt-2 border-t border-[#262930] mt-2">
        <View className="flex-row items-center gap-2">
          {task.due_date ? (
            <View
              className={`flex-row items-center gap-1 px-1.5 py-0.5 rounded ${
                isOverdue
                  ? 'bg-rose-500/15'
                  : isToday
                  ? 'bg-amber-500/15'
                  : 'bg-[#111317]'
              }`}
            >
              <Ionicons
                name="calendar-outline"
                size={11}
                color={isOverdue ? '#EF4444' : isToday ? '#F59E0B' : '#94A3B8'}
              />
              <Text
                className={`text-[10px] ${
                  isOverdue
                    ? 'text-rose-400 font-bold'
                    : isToday
                    ? 'text-amber-400 font-bold'
                    : 'text-slate-400'
                }`}
              >
                {isOverdue ? `Overdue: ${task.due_date}` : isToday ? 'Due Today' : task.due_date}
              </Text>
            </View>
          ) : (
            <Text className="text-[10px] text-slate-500">No due date</Text>
          )}

          {task.assignee ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="person-circle-outline" size={12} color="#94A3B8" />
              <Text className="text-[10px] text-slate-400" numberOfLines={1}>
                {task.assignee.name}
              </Text>
            </View>
          ) : null}
        </View>

        {onDelete ? (
          <Pressable className="p-1" onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
};
