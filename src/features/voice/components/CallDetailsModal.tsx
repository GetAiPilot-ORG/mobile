import React from 'react';
import {
  Alert,
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface CallDetailsModalProps {
  visible: boolean;
  call: any | null;
  onClose: () => void;
}

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({ visible, call, onClose }) => {
  if (!call) return null;

  const messages: Array<{ role: string; content: string; timestamp?: string }> =
    call.transcriptMessages ||
    (call.transcript ? [{ role: 'assistant', content: call.transcript }] : []);

  const handleOpenRecording = async () => {
    let url = call.recordingUrl;
    if (!url) return;

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://api.vomyra.com/recordings/${url}`;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Recording Unavailable', 'No application found to stream this audio recording URL.');
      }
    } catch (err: any) {
      console.warn('[CallDetailsModal] Failed to open recording URL:', err?.message || err);
      Alert.alert('Playback Error', 'Could not open the call audio recording at this time.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-[#0B0D10]">
        {/* Modal Header */}
        <View className="flex-row justify-between items-center px-5 pt-4 pb-3.5 bg-[#181A1F] border-b border-[#262930]">
          <View>
            <Text className="text-lg font-bold text-white">Call Inspection</Text>
            <Text className="text-xs text-slate-400 mt-0.5">
              {call.customerNumber} • {call.duration || '0s'}
            </Text>
          </View>
          <Pressable
            className="w-8 h-8 rounded-full justify-center items-center bg-[#262930]"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onClose();
            }}
          >
            <Ionicons name="close" size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="p-4 gap-3.5 pb-10" showsVerticalScrollIndicator={false}>
          {/* Metadata Card */}
          <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-1">AI ASSISTANT</Text>
                <Text className="text-sm font-semibold text-white">{call.assistant || 'Voice Assistant'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-1">STATUS</Text>
                <View className={`self-start px-2 py-0.5 rounded-md ${call.status === 'completed' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                  <Text className={`text-[11px] font-semibold ${call.status === 'completed' ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {call.status || 'completed'}
                  </Text>
                </View>
              </View>
            </View>

            <View className="h-[1px] bg-[#262930] my-3" />

            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-1">DIRECTION</Text>
                <Text className="text-sm font-semibold text-white">{call.direction || 'Outbound'}</Text>
              </View>
              <View className="flex-1">
                <Text className="text-[11px] font-bold text-slate-400 mb-1">TIMESTAMP</Text>
                <Text className="text-sm font-semibold text-white">{call.time || 'Recent'}</Text>
              </View>
            </View>

            {call.recordingUrl ? (
              <>
                <View className="h-[1px] bg-[#262930] my-3" />
                <Pressable className="flex-row items-center gap-2 py-2" onPress={handleOpenRecording}>
                  <Ionicons name="play-circle" size={22} color="#0084FF" />
                  <Text className="text-[#0084FF] text-sm font-bold flex-1">Play Audio Recording</Text>
                  <Ionicons name="open-outline" size={16} color="#0084FF" />
                </Pressable>
              </>
            ) : null}
          </View>

          {/* AI Summary */}
          {call.summary ? (
            <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
              <View className="flex-row items-center gap-1.5 mb-3">
                <Ionicons name="sparkles" size={16} color="#0084FF" />
                <Text className="text-sm font-bold text-white">AI Telemetry Summary</Text>
              </View>
              <Text className="text-sm leading-5 text-slate-300">
                {call.summary}
              </Text>
            </View>
          ) : null}

          {/* Live Transcript Dialogue */}
          <View className="rounded-2xl p-4 bg-[#181A1F] border border-[#262930]">
            <View className="flex-row items-center gap-1.5 mb-3">
              <Ionicons name="chatbubbles" size={16} color="#0084FF" />
              <Text className="text-sm font-bold text-white">Conversation Dialogue</Text>
            </View>

            {messages.length > 0 ? (
              <View className="gap-2.5">
                {messages.map((m, idx) => {
                  const isAssistant = m.role === 'assistant' || m.role === 'bot';
                  return (
                    <View
                      key={idx}
                      className={`p-3 rounded-2xl ${
                        isAssistant
                          ? 'bg-blue-500/15 border-l-4 border-l-[#0084FF]'
                          : 'bg-[#111317] border-l-4 border-l-slate-600'
                      }`}
                    >
                      <View className="flex-row justify-between mb-1">
                        <Text className={`text-[11px] font-bold ${isAssistant ? 'text-[#0084FF]' : 'text-slate-400'}`}>
                          {isAssistant ? '🤖 Voice Pilot' : '👤 Caller'}
                        </Text>
                        {m.timestamp ? <Text className="text-[10px] text-slate-500">{m.timestamp}</Text> : null}
                      </View>
                      <Text className="text-sm leading-5 text-slate-200">
                        {m.content}
                      </Text>
                    </View>
                  );
                })}
              </View>
            ) : (
              <Text className="text-xs text-slate-500 italic text-center py-2.5">No conversation dialogue recorded for this session.</Text>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};
