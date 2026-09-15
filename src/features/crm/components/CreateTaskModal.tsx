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
import { CRMTask, TaskPriority } from '../types';
import { useMembers } from '../hooks/useMembers';
import { useContacts } from '../hooks/useContacts';

interface CreateTaskModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: Partial<CRMTask>) => Promise<void>;
  defaultContactId?: string;
  defaultDealId?: string;
  isLoading?: boolean;
}

const PRIORITIES: Array<{ key: TaskPriority; label: string; color: string }> = [
  { key: 'low', label: 'Low', color: '#9CA3AF' },
  { key: 'medium', label: 'Medium', color: '#60A5FA' },
  { key: 'high', label: 'High', color: '#FBBF24' },
  { key: 'urgent', label: 'Urgent', color: '#F87171' },
];

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  defaultDealId,
  isLoading,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [contactId, setContactId] = useState<string>(defaultContactId || '');
  const [dealId] = useState<string>(defaultDealId || '');
  const [assignedTo, setAssignedTo] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: members } = useMembers();
  const { data: contactsData } = useContacts({ limit: 50 });

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setPriority('medium');
    setDueDate('');
    setContactId(defaultContactId || '');
    setAssignedTo('');
    setErrorMessage('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setErrorMessage('Task title is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
        priority,
        status: 'todo',
        due_date: dueDate.trim() || null,
        contact_id: contactId || null,
        deal_id: dealId || null,
        assigned_to: assignedTo || null,
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create task');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-black/80 justify-end"
      >
        <View className="bg-[#181A1F] border-t border-[#262930] rounded-t-3xl px-5 pt-5 pb-8 max-h-[88%]">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-white text-lg font-bold">Create Task</Text>
              <Text className="text-slate-400 text-xs mt-0.5">
                Set follow-ups and action items
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
            {/* Title */}
            <View className="mb-3.5">
              <Text className="text-slate-300 text-xs font-semibold mb-1.5">Task Title *</Text>
              <TextInput
                className="bg-[#111317] rounded-xl border border-[#262930] px-3 py-2.5 text-white text-sm"
                placeholder="e.g. Follow up on demo feedback"
                placeholderTextColor="#64748B"
                value={title}
                onChangeText={setTitle}
              />
            </View>

            {/* Priority */}
            <View className="mb-3.5">
              <Text className="text-slate-300 text-xs font-semibold mb-1.5">Priority</Text>
              <View className="flex-row gap-2">
                {PRIORITIES.map((p) => {
                  const isSelected = priority === p.key;
                  return (
                    <Pressable
                      key={p.key}
                      className={`flex-1 py-2 rounded-lg items-center border ${
                        isSelected
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'bg-[#111317] border-[#262930]'
                      }`}
                      onPress={() => setPriority(p.key)}
                    >
                      <Text
                        className="text-xs"
                        style={{
                          color: isSelected ? p.color : '#94A3B8',
                          fontWeight: isSelected ? '700' : '600',
                        }}
                      >
                        {p.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Due Date */}
            <View className="mb-3.5">
              <Text className="text-slate-300 text-xs font-semibold mb-1.5">Due Date (YYYY-MM-DD)</Text>
              <TextInput
                className="bg-[#111317] rounded-xl border border-[#262930] px-3 py-2.5 text-white text-sm"
                placeholder={new Date().toISOString().split('T')[0]}
                placeholderTextColor="#64748B"
                value={dueDate}
                onChangeText={setDueDate}
              />
            </View>

            {/* Link Contact */}
            {contactsData?.contacts && contactsData.contacts.length > 0 ? (
              <View className="mb-3.5">
                <Text className="text-slate-300 text-xs font-semibold mb-1.5">Link Contact / Lead</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  <Pressable
                    className={`px-3 py-2 rounded-lg mr-2 border ${
                      contactId === ''
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-[#111317] border-[#262930]'
                    }`}
                    onPress={() => setContactId('')}
                  >
                    <Text
                      className={`text-xs ${
                        contactId === '' ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                      }`}
                    >
                      None
                    </Text>
                  </Pressable>
                  {contactsData.contacts.map((c) => {
                    const isSelected = contactId === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        className={`px-3 py-2 rounded-lg mr-2 border ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-[#111317] border-[#262930]'
                        }`}
                        onPress={() => setContactId(c.id)}
                      >
                        <Text
                          className={`text-xs ${
                            isSelected ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {c.name || `${c.first_name} ${c.last_name}`}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Assignee */}
            {members && members.length > 0 ? (
              <View className="mb-3.5">
                <Text className="text-slate-300 text-xs font-semibold mb-1.5">Assign to</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
                  <Pressable
                    className={`px-3 py-2 rounded-lg mr-2 border ${
                      assignedTo === ''
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'bg-[#111317] border-[#262930]'
                    }`}
                    onPress={() => setAssignedTo('')}
                  >
                    <Text
                      className={`text-xs ${
                        assignedTo === '' ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                      }`}
                    >
                      Myself
                    </Text>
                  </Pressable>
                  {members.map((m) => {
                    const isSelected = assignedTo === m.id;
                    return (
                      <Pressable
                        key={m.id}
                        className={`px-3 py-2 rounded-lg mr-2 border ${
                          isSelected
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-[#111317] border-[#262930]'
                        }`}
                        onPress={() => setAssignedTo(m.id)}
                      >
                        <Text
                          className={`text-xs ${
                            isSelected ? 'text-blue-400 font-semibold' : 'text-slate-400 font-medium'
                          }`}
                        >
                          {m.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            {/* Description */}
            <View className="mb-3.5">
              <Text className="text-slate-300 text-xs font-semibold mb-1.5">Description & Notes</Text>
              <TextInput
                className="bg-[#111317] rounded-xl border border-[#262930] px-3 py-2.5 text-white text-sm min-h-[70px] text-top"
                placeholder="Details of what needs to be discussed or prepared..."
                placeholderTextColor="#64748B"
                multiline
                numberOfLines={3}
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
                <Text className="text-white text-sm font-semibold">Add Task</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
