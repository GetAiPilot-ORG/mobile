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
import { CRMDeal, DealStage } from '../types';
import { useMembers } from '../hooks/useMembers';
import { useContacts } from '../hooks/useContacts';

interface CreateDealModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (deal: Partial<CRMDeal>) => Promise<void>;
  defaultContactId?: string;
  defaultStage?: DealStage;
  isLoading?: boolean;
}

const STAGES: Array<{ key: DealStage; label: string; color: string }> = [
  { key: 'lead', label: 'Lead', color: '#94A3B8' },
  { key: 'qualified', label: 'Qualified', color: '#0084FF' },
  { key: 'proposal', label: 'Proposal', color: '#F59E0B' },
  { key: 'negotiation', label: 'Negotiation', color: '#A855F7' },
  { key: 'closed_won', label: 'Closed Won', color: '#10B981' },
  { key: 'closed_lost', label: 'Closed Lost', color: '#EF4444' },
];

export const CreateDealModal: React.FC<CreateDealModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultStage = 'lead',
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [value, setValue] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [stage, setStage] = useState<DealStage>(defaultStage);
  const [contactId, setContactId] = useState<string>(defaultContactId || '');
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [probability, setProbability] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: members } = useMembers();
  const { data: contactsData } = useContacts({ limit: 50 });

  const handleClose = () => {
    setTitle('');
    setValue('');
    setCurrency('INR');
    setStage(defaultStage);
    setContactId(defaultContactId || '');
    setExpectedCloseDate('');
    setProbability('');
    setAssignedTo('');
    setNotes('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Deal title is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        title: title.trim(),
        value: value ? Number(value) : 0,
        currency,
        stage,
        contact_id: contactId || null,
        expected_close_date: expectedCloseDate.trim() || null,
        probability: probability ? Number(probability) : null,
        assigned_to: assignedTo || null,
        notes: notes.trim() || null,
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create deal');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/70 justify-end"
      >
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl px-5 pt-5 pb-8 max-h-[88%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-lg font-bold text-white">Create New Deal</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Add deal to pipeline with value & stage</Text>
            </View>
            <Pressable
              className="w-8 h-8 rounded-full bg-[#262930] items-center justify-center"
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={18} color="#94A3B8" />
            </Pressable>
          </View>

          {errorMessage ? (
            <View className="flex-row items-center gap-2 bg-rose-500/15 border border-rose-500/30 p-2.5 rounded-xl mb-3">
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text className="text-xs text-rose-400 flex-1">{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView className="mb-4" showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View className="mb-3">
              <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Deal Title *</Text>
              <TextInput
                className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                placeholder="e.g. Enterprise Software License"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Value & Currency */}
            <View className="flex-row gap-2 mb-3">
              <View className="flex-2">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Deal Value *</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                  placeholder="50000"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={value}
                  onChangeText={setValue}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Currency</Text>
                <View className="flex-row gap-1">
                  {['INR', 'USD'].map((c) => (
                    <Pressable
                      key={c}
                      className={`flex-1 py-2.5 rounded-xl items-center border ${
                        currency === c
                          ? 'bg-[#0084FF] border-[#0084FF]'
                          : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                      }`}
                      onPress={() => setCurrency(c)}
                    >
                      <Text
                        className={`text-xs font-bold ${
                          currency === c ? 'text-white' : 'text-slate-400'
                        }`}
                      >
                        {c}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            </View>

            {/* Stage Selector */}
            <View className="mb-3">
              <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Pipeline Stage</Text>
              <View className="flex-row flex-wrap gap-1.5">
                {STAGES.map((s) => (
                  <Pressable
                    key={s.key}
                    className={`px-3 py-1.5 rounded-xl border ${
                      stage === s.key
                        ? 'bg-[#0084FF]/20 border-[#0084FF]'
                        : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                    }`}
                    onPress={() => setStage(s.key)}
                  >
                    <Text
                      className={`text-xs ${
                        stage === s.key ? 'text-[#0084FF] font-bold' : 'text-slate-400 font-semibold'
                      }`}
                    >
                      {s.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Link Contact */}
            {contactsData?.contacts && contactsData.contacts.length > 0 ? (
              <View className="mb-3">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Link Contact / Lead</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  <Pressable
                    className={`px-3 py-2 rounded-xl border ${
                      contactId === ''
                        ? 'bg-[#0084FF]/20 border-[#0084FF]'
                        : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                    }`}
                    onPress={() => setContactId('')}
                  >
                    <Text
                      className={`text-xs ${
                        contactId === '' ? 'text-[#0084FF] font-bold' : 'text-slate-400'
                      }`}
                    >
                      None
                    </Text>
                  </Pressable>
                  {contactsData.contacts.map((c) => (
                    <Pressable
                      key={c.id}
                      className={`px-3 py-2 rounded-xl border ${
                        contactId === c.id
                          ? 'bg-[#0084FF]/20 border-[#0084FF]'
                          : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                      }`}
                      onPress={() => setContactId(c.id)}
                    >
                      <Text
                        className={`text-xs ${
                          contactId === c.id ? 'text-[#0084FF] font-bold' : 'text-slate-400'
                        }`}
                      >
                        {c.name || `${c.first_name} ${c.last_name}`}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Expected Close & Probability */}
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Expected Close (YYYY-MM-DD)</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                  placeholder="2026-09-30"
                  placeholderTextColor="#64748B"
                  value={expectedCloseDate}
                  onChangeText={setExpectedCloseDate}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Probability (%)</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                  placeholder="80"
                  placeholderTextColor="#64748B"
                  keyboardType="numeric"
                  value={probability}
                  onChangeText={setProbability}
                />
              </View>
            </View>

            {/* Assignee */}
            {members && members.length > 0 ? (
              <View className="mb-3">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Assignee</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
                  <Pressable
                    className={`px-3 py-2 rounded-xl border ${
                      assignedTo === ''
                        ? 'bg-[#0084FF]/20 border-[#0084FF]'
                        : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                    }`}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text
                      className={`text-xs ${
                        assignedTo === '' ? 'text-[#0084FF] font-bold' : 'text-slate-400'
                      }`}
                    >
                      Unassigned
                    </Text>
                  </Pressable>
                  {members.map((m) => (
                    <Pressable
                      key={m.id}
                      className={`px-3 py-2 rounded-xl border ${
                        assignedTo === m.id
                          ? 'bg-[#0084FF]/20 border-[#0084FF]'
                          : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                      }`}
                      onPress={() => setAssignedTo(m.id)}
                    >
                      <Text
                        className={`text-xs ${
                          assignedTo === m.id ? 'text-[#0084FF] font-bold' : 'text-slate-400'
                        }`}
                      >
                        {m.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Notes */}
            <View className="mb-2">
              <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Deal Notes</Text>
              <TextInput
                className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white min-h-[70px]"
                placeholder="Key requirements, client expectations, milestones..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                value={notes}
                onChangeText={setNotes}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View className="flex-row gap-3">
            <Pressable
              className="flex-1 py-3 rounded-xl bg-[#262930] items-center justify-center active:bg-[#333742]"
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text className="text-xs font-bold text-slate-300">Cancel</Text>
            </Pressable>
            <Pressable
              className="flex-2 py-3 rounded-xl bg-[#0084FF] items-center justify-center active:opacity-80"
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text className="text-xs font-bold text-white">Create Deal</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
