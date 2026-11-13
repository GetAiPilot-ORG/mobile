import React from 'react';
import { View, TextInput, Pressable, StyleSheet, Text, Platform } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, Cancel01Icon } from '@/constants/icons';
import { SlidersHorizontal } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

interface InboxSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  onOpenFilterSheet: () => void;
  activeFilterCount: number;
}

export const InboxSearchBar: React.FC<InboxSearchBarProps> = ({
  value,
  onChangeText,
  onClear,
  onOpenFilterSheet,
  activeFilterCount,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={styles.container}>
      {/* Search Input Box */}
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.card,
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.08)'
              : 'rgba(0, 0, 0, 0.06)',
          },
        ]}
      >
        <HugeiconsIcon
          icon={Search01Icon}
          size={18}
          color={colors.textSecondary}
          strokeWidth={2}
          style={{ marginRight: 8 }}
        />
        <TextInput
          style={[styles.input, { color: colors.textPrimary }]}
          placeholder="Search conversations..."
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
          returnKeyType="search"
          autoCorrect={false}
          accessibilityLabel="Search conversations by name, handle, or message content"
        />
        {value.length > 0 && (
          <Pressable
            onPress={onClear}
            hitSlop={8}
            style={styles.clearBtn}
            accessibilityRole="button"
            accessibilityLabel="Clear search text"
          >
            <HugeiconsIcon
              icon={Cancel01Icon}
              size={15}
              color={colors.textSecondary}
              strokeWidth={2}
            />
          </Pressable>
        )}
      </View>

      {/* Filter Button with Count Badge */}
      <Pressable
        cssInterop={false}
        onPress={() => {
          if (Platform.OS !== 'web') {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch { }
          }
          onOpenFilterSheet();
        }}
        accessibilityRole="button"
        accessibilityLabel={`Open conversation filters, ${activeFilterCount} active`}
        style={({ pressed }) => [
          styles.filterBtn,
          {
            backgroundColor: activeFilterCount > 0
              ? colors.accentSoft
              : colors.card,
            borderColor: activeFilterCount > 0
              ? colors.accent
              : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : 'rgba(0, 0, 0, 0.06)',
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <SlidersHorizontal
          size={16}
          color={activeFilterCount > 0 ? colors.accent : colors.textPrimary}
          strokeWidth={2.2}
        />
        {activeFilterCount > 0 && (
          <View
            style={[
              styles.filterBadge,
              { backgroundColor: colors.accent },
            ]}
          >
            <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  inputContainer: {
    flex: 1,
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 14,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    padding: 0,
  },
  clearBtn: {
    padding: 4,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
});


