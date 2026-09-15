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
import { CRMContact, ContactStatus } from '../types';
import { useMembers } from '../hooks/useMembers';

interface CreateLeadModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (lead: Partial<CRMContact>) => Promise<void>;
  isLoading?: boolean;
}

const STATUS_OPTIONS: Array<{ key: ContactStatus; label: string }> = [
  { key: 'lead', label: 'Lead' },
  { key: 'prospect', label: 'Prospect' },
  { key: 'customer', label: 'Customer' },
];

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState<ContactStatus>('lead');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: members } = useMembers();

  const handleReset = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setCompany('');
    setJobTitle('');
    setStatus('lead');
    setAssignedTo('');
    setNotes('');
    setErrorMessage('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setErrorMessage('First name is required');
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || null,
        phone: phone.trim() || null,
        company: company.trim() || null,
        job_title: jobTitle.trim() || null,
        status,
        assigned_to: assignedTo || null,
        notes: notes.trim() || null,
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create lead');
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
              <Text className="text-lg font-bold text-white">Add New Lead</Text>
              <Text className="text-xs text-slate-400 mt-0.5">Capture contact and qualification details</Text>
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
            {/* Name Row */}
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">First Name *</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                  placeholder="e.g. John"
                  placeholderTextColor="#64748B"
                  value={firstName}
                  onChangeText={setFirstName}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Last Name</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                  placeholder="e.g. Doe"
                  placeholderTextColor="#64748B"
                  value={lastName}
                  onChangeText={setLastName}
                />
              </View>
            </View>

            {/* Contact Row */}
            <View className="mb-3">
              <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Phone Number</Text>
              <TextInput
                className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                placeholder="+1 (555) 000-0000"
                placeholderTextColor="#64748B"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={setPhone}
              />
            </View>

            <View className="mb-3">
              <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Email Address</Text>
              <TextInput
                className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                placeholder="john@example.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            {/* Company & Role */}
            <View className="flex-row gap-2 mb-3">
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Company</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                  placeholder="Acme Corp"
                  placeholderTextColor="#64748B"
                  value={company}
                  onChangeText={setCompany}
                />
              </View>
              <View className="flex-1">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Job Title</Text>
                <TextInput
                  className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white"
                  placeholder="VP Sales"
                  placeholderTextColor="#64748B"
                  value={jobTitle}
                  onChangeText={setJobTitle}
                />
              </View>
            </View>

            {/* Status Selector */}
            <View className="mb-3">
              <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Status</Text>
              <View className="flex-row gap-2">
                {STATUS_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.key}
                    className={`flex-1 py-2 rounded-xl items-center border ${
                      status === opt.key
                        ? 'bg-[#0084FF]/20 border-[#0084FF]'
                        : 'bg-[#111317] border-[#262930] active:bg-[#262930]'
                    }`}
                    onPress={() => setStatus(opt.key)}
                  >
                    <Text
                      className={`text-xs ${
                        status === opt.key ? 'text-[#0084FF] font-bold' : 'text-slate-400 font-semibold'
                      }`}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Assignee Selector */}
            {members && members.length > 0 ? (
              <View className="mb-3">
                <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Assign to Team Member</Text>
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
                        {m.name || m.email}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* Initial Notes */}
            <View className="mb-2">
              <Text className="text-[10px] font-bold text-slate-400 mb-1 tracking-wider uppercase">Initial Notes / Source</Text>
              <TextInput
                className="bg-[#111317] border border-[#262930] rounded-xl px-3 py-2.5 text-xs text-white min-h-[70px]"
                placeholder="How did this lead contact us? Any specific requirements..."
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
                <Text className="text-xs font-bold text-white">Create Lead</Text>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
