import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TriggerCallModalProps {
  visible: boolean;
  assistants: any[];
  onClose: () => void;
  onSubmit: (payload: {
    customerNumber: string;
    customerName?: string;
    assistantId?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const TriggerCallModal: React.FC<TriggerCallModalProps> = ({
  visible,
  assistants,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(
    assistants[0]?.id || ''
  );
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!selectedAssistantId && assistants.length > 0) {
      setSelectedAssistantId(assistants[0].id);
    }
  }, [assistants]);

  const handleTrigger = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit({
        customerNumber: phone.trim(),
        customerName: name.trim() || undefined,
        assistantId: selectedAssistantId || undefined,
      });
      setPhone('');
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate AI call.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0B0D10]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-4 pb-3.5 bg-[#181A1F] border-b border-[#262930]">
          <View>
            <Text className="text-lg font-bold text-white">Trigger AI Outbound Call</Text>
            <Text className="text-xs text-slate-400 mt-0.5">Real-time Voice Pilot Telecalling</Text>
          </View>
          <Pressable
            className="w-8 h-8 rounded-full justify-center items-center bg-[#262930]"
            onPress={onClose}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-4" showsVerticalScrollIndicator={false}>
          {error ? (
            <View className="flex-row items-center gap-2 bg-red-500/10 p-3 rounded-xl">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-red-400 text-xs font-semibold flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Form Card */}
          <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
            <Text className="text-[11px] font-bold text-slate-400 mb-1.5">RECIPIENT PHONE NUMBER *</Text>
            <TextInput
              className="rounded-xl px-3 py-2.5 text-sm bg-[#111317] border border-[#262930] text-white"
              placeholder="+91 98765 43210"
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />

            <Text className="text-[11px] font-bold text-slate-400 mt-3.5 mb-1.5">PROSPECT / CONTACT NAME</Text>
            <TextInput
              className="rounded-xl px-3 py-2.5 text-sm bg-[#111317] border border-[#262930] text-white"
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text className="text-[11px] font-bold text-slate-400 mt-3.5 mb-1.5">ASSIGNED AI VOICE AGENT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-1">
              {assistants.map((ast) => {
                const isSelected = selectedAssistantId === ast.id;
                return (
                  <Pressable
                    key={ast.id}
                    className={`flex-row items-center gap-1.5 px-3 py-2 rounded-xl border ${
                      isSelected
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-[#111317] border-[#262930]'
                    }`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAssistantId(ast.id);
                    }}
                  >
                    <Ionicons
                      name="mic"
                      size={14}
                      color={isSelected ? '#0084FF' : '#94A3B8'}
                    />
                    <Text
                      className={`text-xs ${
                        isSelected ? 'text-white font-bold' : 'text-slate-400 font-medium'
                      }`}
                    >
                      {ast.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Action CTA */}
          <Pressable
            className={`flex-row items-center justify-center gap-2 bg-[#0084FF] rounded-xl py-3.5 ${
              !phone.trim() || isLoading ? 'opacity-50' : ''
            }`}
            disabled={!phone.trim() || isLoading}
            onPress={handleTrigger}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text className="text-white text-[15px] font-bold">Start Live AI Call Now</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};
