import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
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
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        isDone && { opacity: 0.6, backgroundColor: colors.surfaceSecondary },
        pressed && { backgroundColor: colors.cardHover },
      ]}
      onPress={onPress}
    >
      <View style={styles.contentRow}>
        {/* Interactive Checkbox */}
        <Pressable
          style={[styles.checkbox, isDone && styles.checkboxDone]}
          onPress={() => onToggle(!isDone)}
          hitSlop={8}
        >
          {isDone ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
        </Pressable>

        {/* Info */}
        <View style={styles.textBlock}>
          <Text
            style={[
              styles.title,
              { color: colors.text },
              isDone && { textDecorationLine: 'line-through', color: colors.mutedText },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[
                styles.description,
                { color: colors.mutedText },
                isDone && styles.descDone,
              ]}
              numberOfLines={1}
            >
              {task.description}
            </Text>
          ) : null}

          {/* Context pill: Contact or Deal link */}
          {task.contact || task.deal ? (
            <View style={styles.contextRow}>
              {task.contact ? (
                <View style={[styles.contextPill, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="person-outline" size={10} color={colors.iconMuted} />
                  <Text style={[styles.contextText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {`${task.contact.first_name || ''} ${task.contact.last_name || ''}`.trim()}
                  </Text>
                </View>
              ) : null}

              {task.deal ? (
                <View style={[styles.contextPill, { backgroundColor: colors.surfaceSecondary }]}>
                  <Ionicons name="briefcase-outline" size={10} color={colors.iconMuted} />
                  <Text style={[styles.contextText, { color: colors.textSecondary }]} numberOfLines={1}>
                    {task.deal.title}
                  </Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>

        {/* Priority Badge */}
        <View style={[styles.priorityBadge, { backgroundColor: priorityCfg.bg }]}>
          <Text style={[styles.priorityText, { color: priorityCfg.color }]}>
            {priorityCfg.label}
          </Text>
        </View>
      </View>

      {/* Bottom info row */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <View style={styles.dueRow}>
          {task.due_date ? (
            <View
              style={[
                styles.dueBadge,
                { backgroundColor: colors.surfaceSecondary },
                isOverdue && styles.dueOverdue,
                isToday && styles.dueToday,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={11}
                color={isOverdue ? colors.destructive : isToday ? colors.warning : colors.iconMuted}
              />
              <Text
                style={[
                  styles.dueText,
                  { color: colors.mutedText },
                  isOverdue && { color: colors.destructive, fontWeight: '600' },
                  isToday && { color: colors.warning, fontWeight: '600' },
                ]}
              >
                {isOverdue ? `Overdue: ${task.due_date}` : isToday ? 'Due Today' : task.due_date}
              </Text>
            </View>
          ) : (
            <Text style={[styles.noDueDate, { color: colors.textMuted }]}>No due date</Text>
          )}

          {task.assignee ? (
            <View style={styles.assigneePill}>
              <Ionicons name="person-circle-outline" size={12} color={colors.iconMuted} />
              <Text style={[styles.assigneeText, { color: colors.mutedText }]} numberOfLines={1}>
                {task.assignee.name}
              </Text>
            </View>
          ) : null}
        </View>

        {onDelete ? (
          <Pressable style={styles.deleteBtn} onPress={onDelete} hitSlop={8}>
            <Ionicons name="trash-outline" size={14} color="#EF4444" />
          </Pressable>
        ) : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#6B7280',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxDone: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  textBlock: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  titleDoneDark: {
    textDecorationLine: 'line-through' as const,
  },
  titleDoneLight: {
    textDecorationLine: 'line-through' as const,
  },
  description: {
    fontSize: 12,
    marginTop: 3,
  },
  descDone: {
    textDecorationLine: 'line-through',
  },
  contextRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  contextPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  contextText: {
    fontSize: 11,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    marginTop: 8,
    borderTopWidth: 1,
  },
  dueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dueOverdue: {
    backgroundColor: 'rgba(184, 92, 92, 0.15)',
  },
  dueToday: {
    backgroundColor: 'rgba(184, 134, 59, 0.15)',
  },
  dueText: {
    fontSize: 11,
  },
  dueTextOverdue: {
    color: '#B85C5C',
    fontWeight: '600' as const,
  },
  dueTextToday: {
    color: '#B8863B',
    fontWeight: '600' as const,
  },
  noDueDate: {
    fontSize: 11,
  },
  assigneePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  assigneeText: {
    fontSize: 11,
  },
  deleteBtn: {
    padding: 4,
  },
});
