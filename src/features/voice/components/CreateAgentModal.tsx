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
import { apiClient } from '../../../core/api/client';

interface CreateAgentModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    name: string;
    prompt: string;
    language?: string;
    first_message?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const CreateAgentModal: React.FC<CreateAgentModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [prompt, setPrompt] = useState('');
  const [language, setLanguage] = useState('hi-IN');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGeneratePrompt = async () => {
    if (!topic.trim()) {
      setError('Please enter an assistant role/topic to generate system prompt.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGenerating(true);
    setError(null);

    try {
      const res = await apiClient.post<{ prompt: string }>('/mobile/v1/voice/agents/generate-prompt', {
        topic: topic.trim(),
        name: name.trim() || 'Virtual Assistant',
      });
      if (res?.prompt) {
        setPrompt(res.prompt);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to auto-generate prompt.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreate = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Please enter an assistant name.');
      return;
    }
    if (!prompt.trim()) {
      setError('System prompt is required.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit({
        name: name.trim(),
        prompt: prompt.trim(),
        language,
        first_message: `Hello! I am ${name.trim()}, how may I assist you today?`,
      });
      setName('');
      setTopic('');
      setPrompt('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create voice assistant.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0B0D10]">
        {/* Header */}
        <View className="flex-row justify-between items-center px-5 pt-4 pb-3.5 bg-[#181A1F] border-b border-[#262930]">
          <View>
            <Text className="text-lg font-bold text-white">Create AI Voice Agent</Text>
            <Text className="text-xs text-slate-400 mt-0.5">Vomyra Ultra-Low Latency Telecalling Pilot</Text>
          </View>
          <Pressable className="w-8 h-8 rounded-full justify-center items-center bg-[#262930]" onPress={onClose}>
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

          <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
            <Text className="text-[11px] font-bold text-slate-400 mb-1.5">ASSISTANT NAME *</Text>
            <TextInput
              className="rounded-xl px-3 py-2.5 text-sm bg-[#111317] border border-[#262930] text-white"
              placeholder="e.g. Priya - Real Estate Qualifier"
              placeholderTextColor="#64748B"
              value={name}
              onChangeText={setName}
            />

            <Text className="text-[11px] font-bold text-slate-400 mt-3.5 mb-1.5">ROLE / DOMAIN TOPIC</Text>
            <View className="flex-row gap-2 items-center">
              <TextInput
                className="flex-1 rounded-xl px-3 py-2.5 text-sm bg-[#111317] border border-[#262930] text-white"
                placeholder="e.g. Inbound Luxury Villa Sales"
                placeholderTextColor="#64748B"
                value={topic}
                onChangeText={setTopic}
              />
              <Pressable
                className={`flex-row items-center gap-1 bg-[#0084FF] px-3 py-2.5 rounded-xl ${
                  !topic.trim() || isGenerating ? 'opacity-50' : ''
                }`}
                disabled={!topic.trim() || isGenerating}
                onPress={handleGeneratePrompt}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <Text className="text-white text-xs font-bold">AI Prompt</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Text className="text-[11px] font-bold text-slate-400 mt-3.5 mb-1.5">SYSTEM INSTRUCTION / PROMPT *</Text>
            <TextInput
              className="rounded-xl px-3 py-2.5 text-sm h-32 text-top bg-[#111317] border border-[#262930] text-white"
              placeholder="Enter voice assistant instructions, persona, and conversation guardrails..."
              placeholderTextColor="#64748B"
              multiline
              numberOfLines={6}
              value={prompt}
              onChangeText={setPrompt}
            />
          </View>

          <Pressable
            className={`flex-row items-center justify-center gap-2 bg-[#0084FF] rounded-xl py-3.5 ${
              !name.trim() || !prompt.trim() || isLoading ? 'opacity-50' : ''
            }`}
            disabled={!name.trim() || !prompt.trim() || isLoading}
            onPress={handleCreate}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text className="text-white text-[15px] font-bold">Save & Deploy Assistant</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};
