import React from 'react';
import { View, TextInput, Pressable, Text } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

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
    <View
      className={`flex-row items-center rounded-xl px-3 h-11 mb-3.5 border ${
        isDark ? 'bg-[#0A1420] border-[#1B334A]' : 'bg-white border-[#E5E7EB]'
      }`}
    >
      <Text className="text-sm mr-2">🔍</Text>
      <TextInput
        className={`flex-1 text-sm py-0 ${isDark ? 'text-[#F7FAFC]' : 'text-black'}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={isDark ? '#72869A' : '#9CA3AF'}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          className={`w-5 h-5 rounded-full justify-center items-center active:opacity-75 ${
            isDark ? 'bg-[#101C2A]' : 'bg-[#F2F4F7]'
          }`}
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          hitSlop={8}
        >
          <Text
            className={`text-[11px] font-bold ${
              isDark ? 'text-[#8FA3B8]' : 'text-[#6B7280]'
            }`}
          >
            ✕
          </Text>
        </Pressable>
      )}
    </View>
  );
};
