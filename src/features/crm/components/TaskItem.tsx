import React from 'react';
import { StyleSheet, Text, View, Pressable, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMTask, TaskPriority } from '../types';

interface TaskItemProps {
  task: CRMTask;
  onToggle: (done: boolean) => void;
  onPress?: () => void;
  onDelete?: () => void;
}

const PRIORITY_CONFIG: Record<TaskPriority, { label: string; color: string; bg: string }> = {
  low: { label: 'Low', color: '#6B7280', bg: 'rgba(156, 163, 175, 0.15)' },
  medium: { label: 'Medium', color: '#3B82F6', bg: 'rgba(59, 130, 246, 0.15)' },
  high: { label: 'High', color: '#D97706', bg: 'rgba(245, 158, 11, 0.15)' },
  urgent: { label: 'Urgent', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' },
};

export const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onPress, onDelete }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isDone = task.status === 'done';
  const priorityCfg = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  const todayStr = new Date().toISOString().split('T')[0];
  const isOverdue = !isDone && task.due_date && task.due_date < todayStr;
  const isToday = !isDone && task.due_date === todayStr;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        isDone && (isDark ? styles.cardDoneDark : styles.cardDoneLight),
        pressed && (isDark ? styles.cardPressedDark : styles.cardPressedLight),
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
              { color: isDark ? '#FFFFFF' : '#0F172A' },
              isDone && (isDark ? styles.titleDoneDark : styles.titleDoneLight),
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>

          {task.description ? (
            <Text
              style={[
                styles.description,
                { color: isDark ? '#9CA3AF' : '#64748B' },
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
                <View style={[styles.contextPill, { backgroundColor: isDark ? '#222630' : '#F1F5F9' }]}>
                  <Ionicons name="person-outline" size={10} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <Text style={[styles.contextText, { color: isDark ? '#D1D5DB' : '#334155' }]} numberOfLines={1}>
                    {`${task.contact.first_name || ''} ${task.contact.last_name || ''}`.trim()}
                  </Text>
                </View>
              ) : null}

              {task.deal ? (
                <View style={[styles.contextPill, { backgroundColor: isDark ? '#222630' : '#F1F5F9' }]}>
                  <Ionicons name="briefcase-outline" size={10} color={isDark ? '#9CA3AF' : '#64748B'} />
                  <Text style={[styles.contextText, { color: isDark ? '#D1D5DB' : '#334155' }]} numberOfLines={1}>
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
      <View style={[styles.footer, { borderTopColor: isDark ? '#222630' : '#F1F5F9' }]}>
        <View style={styles.dueRow}>
          {task.due_date ? (
            <View
              style={[
                styles.dueBadge,
                { backgroundColor: isDark ? '#222630' : '#F1F5F9' },
                isOverdue && styles.dueOverdue,
                isToday && styles.dueToday,
              ]}
            >
              <Ionicons
                name="calendar-outline"
                size={11}
                color={isOverdue ? '#EF4444' : isToday ? '#F59E0B' : isDark ? '#9CA3AF' : '#64748B'}
              />
              <Text
                style={[
                  styles.dueText,
                  { color: isDark ? '#9CA3AF' : '#64748B' },
                  isOverdue && styles.dueTextOverdue,
                  isToday && styles.dueTextToday,
                ]}
              >
                {isOverdue ? `Overdue: ${task.due_date}` : isToday ? 'Due Today' : task.due_date}
              </Text>
            </View>
          ) : (
            <Text style={[styles.noDueDate, { color: isDark ? '#6B7280' : '#94A3B8' }]}>No due date</Text>
          )}

          {task.assignee ? (
            <View style={styles.assigneePill}>
              <Ionicons name="person-circle-outline" size={12} color={isDark ? '#9CA3AF' : '#64748B'} />
              <Text style={[styles.assigneeText, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
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
  },
  cardDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardDoneDark: {
    opacity: 0.6,
    backgroundColor: '#14161B',
  },
  cardDoneLight: {
    opacity: 0.6,
    backgroundColor: '#F8FAFC',
  },
  cardPressedDark: {
    backgroundColor: '#20232B',
  },
  cardPressedLight: {
    backgroundColor: '#F1F5F9',
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
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  titleDoneLight: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
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
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
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
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  dueToday: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  dueText: {
    fontSize: 11,
  },
  dueTextOverdue: {
    color: '#EF4444',
    fontWeight: '600',
  },
  dueTextToday: {
    color: '#F59E0B',
    fontWeight: '600',
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
