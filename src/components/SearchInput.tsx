import React from 'react';
import { View, TextInput, StyleSheet, Pressable, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { colors } from '../theme/colors';

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

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <Text style={styles.searchIcon}>🔍</Text>
      <TextInput
        style={[styles.input, isDark && styles.inputDark]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          style={[styles.clearBtn, isDark && styles.clearBtnDark]}
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          hitSlop={8}
        >
          <Text style={[styles.clearText, isDark && styles.clearTextDark]}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    marginBottom: 14,
  },
  containerDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  searchIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    paddingVertical: 0,
  },
  inputDark: {
    color: '#FFFFFF',
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F2F4F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearBtnDark: {
    backgroundColor: '#2C2C2E',
  },
  clearText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  clearTextDark: {
    color: '#8E8E93',
  },
});
