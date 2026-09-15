import React from 'react';
import { View, TextInput, Pressable, Text, useColorScheme } from 'react-native';

interface SearchInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  className,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className={`flex-row items-center border rounded-xl px-3 h-11 mb-3.5 ${
        isDark ? "bg-[#181A1F] border-[#262930]" : "bg-white border-gray-200"
      } ${className || ''}`}
    >
      <Text className="text-sm mr-2">🔍</Text>
      <TextInput
        className={`flex-1 text-sm py-0 ${isDark ? "text-white" : "text-black"}`}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8E8E93"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Pressable
          className={`w-5 h-5 rounded-full justify-center items-center ${
            isDark ? "bg-[#262930]" : "bg-slate-100"
          }`}
          onPress={() => {
            onChangeText('');
            if (onClear) onClear();
          }}
          hitSlop={8}
        >
          <Text className={`text-[11px] font-bold ${isDark ? "text-slate-400" : "text-slate-500"}`}>✕</Text>
        </Pressable>
      )}
    </View>
  );
};
