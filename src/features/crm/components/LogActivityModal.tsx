import React, { useState } from 'react';
import {
  Text,
  View,
  Modal,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ActivityType, CRMActivity } from '../types';

interface LogActivityModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (activity: Partial<CRMActivity>) => Promise<void>;
  defaultContactId?: string;
  defaultDealId?: string;
  isLoading?: boolean;
}

const ACTIVITY_TYPES: Array<{ key: ActivityType; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = [
  { key: 'call', label: 'Call', icon: 'call', color: '#10B981' },
  { key: 'email', label: 'Email', icon: 'mail', color: '#3B82F6' },
  { key: 'meeting', label: 'Meeting', icon: 'calendar', color: '#8B5CF6' },
  { key: 'note', label: 'Note', icon: 'document-text', color: '#F59E0B' },
  { key: 'follow_up', label: 'Follow Up', icon: 'alarm', color: '#EC4899' },
];

export const LogActivityModal: React.FC<LogActivityModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultDealId,
  isLoading,
}) => {
  const [type, setType] = useState<ActivityType>('note');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleClose = () => {
    setType('note');
    setSubject('');
    setDescription('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      setErrorMessage('Subject is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        type,
        subject: subject.trim(),
        description: description.trim() || null,
        contact_id: defaultContactId || null,
        deal_id: defaultDealId || null,
        status: 'completed',
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to log activity');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/80 justify-end"
      >
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl px-5 pt-5 pb-8 max-h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-lg font-bold">Log Activity</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Record a call, meeting, note or email
              </Text>
            </View>
            <Pressable
              className="p-1.5 rounded-lg bg-[#262930]"
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color="#94A3B8" />
            </Pressable>
          </View>

          {errorMessage ? (
            <View className="flex-row items-center gap-2 bg-red-500/15 p-2.5 rounded-lg mb-3">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-red-400 text-xs flex-1">{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
            {/* Type selector */}
            <View className="mb-3.5">
              <Text className="text-slate-300 text-xs font-semibold mb-1.5">Activity Type</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {ACTIVITY_TYPES.map((t) => {
                  const isSelected = type === t.key;
                  return (
                    <Pressable
                      key={t.key}
                      className={`flex-row items-center gap-1.5 px-3 py-2 rounded-lg border ${
                        isSelected
                          ? 'bg-blue-500/15 border-blue-500'
                          : 'bg-[#111317] border-[#262930]'
                      }`}
                      onPress={() => setType(t.key)}
                    >
                      <Ionicons
                        name={t.icon}
                        size={16}
                        color={isSelected ? t.color : '#94A3B8'}
                      />
                      <Text
                        className="text-xs"
                        style={{
                          color: isSelected ? t.color : '#94A3B8',
                          fontWeight: isSelected ? '700' : '600',
                        }}
                      >
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Subject */}
            <View className="mb-3.5">
              <Text className="text-slate-300 text-xs font-semibold mb-1.5">Subject / Summary *</Text>
              <TextInput
                className="bg-[#111317] rounded-xl border border-[#262930] px-3 py-2.5 text-white text-sm"
                placeholder="e.g. Discussed pricing proposal & contract terms"
                placeholderTextColor="#64748B"
                value={subject}
                onChangeText={setSubject}
              />
            </View>

            {/* Description / Content */}
            <View className="mb-3.5">
              <Text className="text-slate-300 text-xs font-semibold mb-1.5">Details & Outcome</Text>
              <TextInput
                className="bg-[#111317] rounded-xl border border-[#262930] px-3 py-2.5 text-white text-sm min-h-[80px] text-top"
                placeholder="Client agreed on annual billing, requested updated quote by Friday..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={4}
                value={description}
                onChangeText={setDescription}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 py-3 rounded-xl bg-[#262930] items-center justify-center"
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text className="text-slate-300 text-sm font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              className="flex-[2] py-3 rounded-xl bg-[#0084FF] items-center justify-center"
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-white text-sm font-semibold">Log Event</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
