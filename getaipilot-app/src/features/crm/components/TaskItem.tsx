import React from 'react';
import { Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMTask, TaskPriority } from '../types';
import { useTheme, getColors } from '@/theme';

interface TaskItemProps {
  task: CRMTask;
  onToggle: (done: boolean) => void;
  onPress?: () => void;
  onDelete?: () => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#8A8D91', bg: 'rgba(138, 141, 145, 0.15)' },
  medium: { label: 'Medium', color: '#647D8C', bg: 'rgba(100, 125, 140, 0.15)' },
  high: { label: 'High', color: '#B8863B', bg: 'rgba(184, 134, 59, 0.15)' },
  urgent: { label: 'Urgent', color: '#B85C5C', bg: 'rgba(184, 92, 92, 0.15)' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onPress, onDelete }) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const isDone = task.status === 'done';
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !isDone && task.due_date && task.due_date < todayStr;
  const isToday = !isDone && task.due_date === todayStr;

  return (
    <Pressable
      className={`rounded-[14px] p-3.5 mb-2.5 border shadow-sm shadow-black/5 active:opacity-90 ${
        isDone ? 'opacity-60' : ''
      }`}
      style={({ pressed }) => [
        {
          backgroundColor: isDone ? colors.surfaceSecondary : colors.card,
          borderColor: colors.cardBorder,
        },
        pressed && { backgroundColor: colors.cardHover },
      ]}
      onPress={onPress}
    >
      <View className="flex-row items-start">
        {/* Interactive Checkbox */}
        <Pressable
          className={`w-5 h-5 rounded-md border-2 items-center justify-center mr-3 mt-0.5 ${
            isDone ? 'bg-[#10B981] border-[#10B981]' : 'border-[#6B7280]'
          }`}
          onPress={() => onToggle(!isDone)}
          hitSlop={8}
        >
          {isDone ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        </Pressable>

        {/* Info */}
        <View className="flex-1 mr-2 min-w-0">
          <Text
            className={`text-[15px] font-semibold tracking-tight ${
              isDone ? 'line-through' : ''
            }`}
            style={{ color: isDone ? colors.mutedText : colors.text }}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              className={`text-xs mt-1 ${isDone ? 'line-through' : ''}`}
              style={{ color: colors.mutedText }}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}

          {/* Context pill: Contact or Deal link */}
          {task.contact || task.deal ? (
            <View className="flex-row flex-wrap gap-1.5 mt-1.5">
              {task.contact ? (
                <View
                  className="flex-row items-center gap-1 px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: colors.surfaceSecondary }}
                >
                  <Ionicons name="person-outline" size={10} color={colors.iconMuted} />
                  <Text
                    className="text-[11px]"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {`${task.contact.first_name || ''} ${task.contact.last_name || ''}`.trim()}
                  </Text>
                </View>
              ) : null}

              {task.deal ? (
                <View
                  className="flex-row items-center gap-1 px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: colors.surfaceSecondary }}
                >
                  <Ionicons name="briefcase-outline" size={10} color={colors.iconMuted} />
                  <Text
                    className="text-[11px]"
                    style={{ color: colors.textSecondary }}
                    numberOfLines={1}
                  >
                    {task.deal.title}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Priority Badge */}
        <View
          className="px-1.5 py-0.5 rounded-md self-start"
          style={{ backgroundColor: priorityCfg.bg }}
        >
          <Text
            className="text-[10.5px] font-semibold"
            style={{ color: priorityCfg.color }}
          >
            {priorityCfg.label}
          </Text>
        </View>
      </View>

      {/* Bottom info row */}
      <View
        className="flex-row items-center justify-between pt-2 mt-2 border-t"
        style={{ borderTopColor: colors.divider }}
      >
        <View className="flex-row items-center gap-2">
          {task.due_date ? (
            <View
              className="flex-row items-center gap-1 px-1.5 py-0.5 rounded"
              style={{
                backgroundColor: isOverdue
                  ? 'rgba(184, 92, 92, 0.15)'
                  : isToday
                    ? 'rgba(184, 134, 59, 0.15)'
                    : colors.surfaceSecondary,
              }}
            >
              <Ionicons
                name="calendar-outline"
                size={11}
                color={isOverdue ? colors.destructive : isToday ? colors.warning : colors.iconMuted}
              />
              <Text
                className={`text-[11px] ${
                  isOverdue || isToday ? 'font-semibold' : ''
                }`}
                style={{
                  color: isOverdue
                    ? colors.destructive
                    : isToday
                      ? colors.warning
                      : colors.mutedText,
                }}
              >
                {isOverdue ? `Overdue: ${task.due_date}` : isToday ? 'Due Today' : task.due_date}
              </Text>
            </View>
          ) : (
            <Text className="text-[11px]" style={{ color: colors.textMuted }}>
              No due date
            </Text>
          )}

          {task.assignee ? (
            <View className="flex-row items-center gap-1">
              <Ionicons name="person-circle-outline" size={12} color={colors.iconMuted} />
              <Text
                className="text-[11px]"
                style={{ color: colors.mutedText }}
                numberOfLines={1}
              >
                {task.assignee.name}
              </Text>
            </View>
          ) : null}
        </View>

        {onDelete ? (
          <Pressable className="p-1" onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
};
