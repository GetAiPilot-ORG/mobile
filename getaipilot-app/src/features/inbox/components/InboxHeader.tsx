import React from 'react';
import { View, Text, Pressable, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  BubbleChatAddIcon,
  Cancel01Icon,
  CheckmarkCircle01Icon,
  Delete02Icon,
  UserAdd01Icon,
} from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

interface InboxHeaderProps {
  unreadTotal: number;
  onNewChat: () => void;
  isSelectionMode: boolean;
  selectedCount: number;
  onCancelSelection: () => void;
  onBatchMarkRead: () => void;
  onBatchAssign: () => void;
  onBatchResolve: () => void;
  onBatchDelete: () => void;
}

export const InboxHeader: React.FC<InboxHeaderProps> = ({
  unreadTotal,
  onNewChat,
  isSelectionMode,
  selectedCount,
  onCancelSelection,
  onBatchMarkRead,
  onBatchAssign,
  onBatchResolve,
  onBatchDelete,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  if (isSelectionMode) {
    return (
      <View
        style={[
          styles.selectionBar,
          {
            backgroundColor: isDark ? '#1C1A25' : '#FFFFFF',
            borderBottomColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <View style={styles.selectionLeft}>
          <Pressable
            onPress={onCancelSelection}
            hitSlop={8}
            style={styles.cancelBtn}
            accessibilityRole="button"
            accessibilityLabel="Cancel selection mode"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={18}
              color={colors.textPrimary}
              strokeWidth={2}
            />
          </Pressable>
          <Text style={[styles.selectionCount, { color: colors.textPrimary }]}>
            {selectedCount} selected
          </Text>
        </View>

        <View style={styles.selectionActions}>
          <Pressable
            onPress={onBatchMarkRead}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Mark selected conversations as read"
          >
            <HugeiconsIcon
              icon={CheckmarkCircle01Icon}
              size={17}
              color={colors.accent}
              strokeWidth={2}
            />
          </Pressable>

          <Pressable
            onPress={onBatchAssign}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Assign selected conversations"
          >
            <HugeiconsIcon
              icon={UserAdd01Icon}
              size={17}
              color={colors.textPrimary}
              strokeWidth={2}
            />
          </Pressable>

          <Pressable
            onPress={onBatchDelete}
            style={styles.actionBtn}
            accessibilityRole="button"
            accessibilityLabel="Delete selected conversations"
          >
            <HugeiconsIcon
              icon={Delete02Icon}
              size={17}
              color="#EF4444"
              strokeWidth={2}
            />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.headerContainer}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Inbox</Text>
        {unreadTotal > 0 && (
          <View
            style={[
              styles.totalUnreadBadge,
              { backgroundColor: colors.accentSoft },
            ]}
          >
            <Text style={[styles.totalUnreadText, { color: colors.accent }]}>
              {unreadTotal > 99 ? '99+' : unreadTotal}
            </Text>
          </View>
        )}
      </View>

      <TouchableOpacity
        cssInterop={false}
        style={[
          styles.newChatBtn,
          {
            backgroundColor: colors.buttonPrimary
          },
        ]}
        onPress={() => {
          if (Platform.OS !== 'web') {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch { }
          }
          onNewChat();
        }}
        accessibilityRole="button"
        accessibilityLabel="Start a new chat"
      >
        <HugeiconsIcon
          icon={BubbleChatAddIcon}
          size={16}
          color={colors.buttonPrimaryForeground}
          strokeWidth={2.2}
        />
        <Text
          style={[
            styles.newChatText,
            { color: colors.buttonPrimaryForeground },
          ]}
        >
          New chat
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  totalUnreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    paddingHorizontal: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  totalUnreadText: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  newChatBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  newChatText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 52,
    borderBottomWidth: 1,
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    padding: 4,
  },
  selectionCount: {
    fontSize: 15,
    fontWeight: '700',
  },
  selectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    padding: 6,
    borderRadius: 8,
  },
});


