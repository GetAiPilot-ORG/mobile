import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { apiClient } from '../../../core/api/client';
import { useTheme, getColors } from '@/theme';

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
  const { isDark } = useTheme();
  const colors = getColors(isDark);

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
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Create AI Voice Agent</Text>
            <Text style={styles.headerSubtitle}>Vomyra Ultra-Low Latency Telecalling Pilot</Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {error ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={styles.inputLabel}>ASSISTANT NAME *</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Priya - Real Estate Qualifier"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>ROLE / DOMAIN TOPIC</Text>
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="e.g. Inbound Luxury Villa Sales"
                placeholderTextColor="#8E8E93"
                value={topic}
                onChangeText={setTopic}
              />
              <Pressable
                style={[styles.generateBtn, (!topic.trim() || isGenerating) && styles.generateBtnDisabled]}
                disabled={!topic.trim() || isGenerating}
                onPress={handleGeneratePrompt}
              >
                {isGenerating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                    <Text style={styles.generateBtnText}>AI Prompt</Text>
                  </>
                )}
              </Pressable>
            </View>

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>SYSTEM INSTRUCTION / PROMPT *</Text>
            <TextInput
              style={[styles.textArea, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="Enter voice assistant instructions, persona, and conversation guardrails..."
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={6}
              value={prompt}
              onChangeText={setPrompt}
            />
          </View>

          <Pressable
            style={[styles.submitBtn, (!name.trim() || !prompt.trim() || isLoading) && styles.submitBtnDisabled]}
            disabled={!name.trim() || !prompt.trim() || isLoading}
            onPress={handleCreate}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Save & Deploy Assistant</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLight: { backgroundColor: '#FFFFFF', borderBottomColor: '#E5E7EB' },
  headerDark: { backgroundColor: '#161B22', borderBottomColor: '#262C36' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000000' },
  headerSubtitle: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  textDark: { color: '#FFFFFF' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#E5E7EB' },
  closeBtnDark: { backgroundColor: '#262C36' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 16 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: 12,
    borderRadius: 10,
  },
  errorText: { color: '#EF4444', fontSize: 12.5, fontWeight: '600', flex: 1 },
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' },
  cardDark: { backgroundColor: '#161B22', borderColor: '#262C36' },
  inputLabel: { fontSize: 10.5, fontWeight: '700', color: '#8E8E93', marginBottom: 6 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  textArea: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    height: 120,
    textAlignVertical: 'top',
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputLight: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', color: '#000000' },
  inputDark: { backgroundColor: '#0D1117', borderColor: '#262C36', color: '#FFFFFF' },
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { color: '#FFFFFF', fontSize: 12.5, fontWeight: '700' },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#8B5CF6',
    borderRadius: 12,
    paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
