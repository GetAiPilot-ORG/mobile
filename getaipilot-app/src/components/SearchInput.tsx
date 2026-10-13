import React from 'react';
import { View, TextInput, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value, onChangeText, placeholder = 'Search…', onClear,
}) => {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 24, paddingHorizontal: 16, minHeight: 50, marginBottom: 16, gap: 10 }}>
      <Ionicons name="search-outline" size={19} color={colors.textSecondary} />
      <TextInput
        style={{ flex: 1, fontSize: 14, color: colors.text, paddingVertical: 12 }}
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        accessibilityLabel={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        autoCapitalize="none" autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable accessibilityRole="button" accessibilityLabel="Clear search"
          style={{ width: 32, height: 40, alignItems: 'center', justifyContent: 'center' }}
          onPress={() => { onChangeText(''); onClear?.(); }} hitSlop={6}>
          <Ionicons name="close-circle" size={19} color={colors.textSecondary} />
        </Pressable>
      )}
    </View>
  );
};
