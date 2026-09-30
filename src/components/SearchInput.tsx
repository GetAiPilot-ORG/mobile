import React, { useMemo } from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { useTheme, getColors } from '@/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          style={styles.clearBtn}
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          hitSlop={8}
        >
          <Text style={styles.clearText}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

function createStyles(colors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 12,
      paddingHorizontal: 12,
      height: 44,
      marginBottom: 14,
    },
    searchIcon: {
      fontSize: 14,
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      paddingVertical: 0,
    },
    clearBtn: {
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: colors.muted,
      justifyContent: 'center',
      alignItems: 'center',
    },
    clearText: {
      fontSize: 11,
      color: colors.mutedForeground,
      fontWeight: 'bold',
    },
  });
}

