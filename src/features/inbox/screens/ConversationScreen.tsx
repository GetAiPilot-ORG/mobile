import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../../core/store/authStore';
import { crmApi } from '../../crm/api/crm.api';
import { inboxApi } from '../api/inboxApi';
import { ChannelBadge } from '../components/ChannelBadge';
import { MessageBubble } from '../components/MessageBubble';
import { useInboxWebSocket } from '../hooks/useInboxWebSocket';
import { NormalizedConversation } from '../types';

interface ConversationScreenProps {
  conversation?: NormalizedConversation;
  conversationId?: string;
  onBack?: () => void;
}

export const ConversationScreen: React.FC<ConversationScreenProps> = ({
  conversation: initialConversation,
  conversationId,
  onBack,
}) => {
  const router = useRouter();
  const handleBack = onBack || (() => router.back());
  const queryClient = useQueryClient();
  const [inputText, setInputText] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const activeId = initialConversation?.id || conversationId || '';

  // Realtime WebSocket Subscription for this conversation
  useInboxWebSocket(activeId);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['conversation_details', activeId],
    queryFn: () => inboxApi.getConversationDetails(activeId),
    staleTime: 5000,
    enabled: isAuthenticated && !!activeId,
  });

  const conversation = initialConversation || data?.conversation;

  const sendMutation = useMutation({
    mutationFn: (text: string) => {
      if (!conversation) throw new Error('No active conversation');
      return inboxApi.sendMessage({
        conversation_id: conversation.id,
        message: text,
      });
    },
    onSuccess: (newMessage) => {
      setInputText('');
      if (conversation) {
        queryClient.setQueryData(
          ['conversation_details', conversation.id],
          (old: any) => {
            if (!old) return { conversation, messages: [newMessage] };
            return {
              ...old,
              messages: [...old.messages, newMessage],
            };
          }
        );
      }
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || sendMutation.isPending) return;
    sendMutation.mutate(trimmed);
  };

  // CRM Lead Quick-Create State
  const [showCrmModal, setShowCrmModal] = useState<boolean>(false);
  const [leadDealValue, setLeadDealValue] = useState<string>('25000');
  const [leadCreatedSuccess, setLeadCreatedSuccess] = useState<boolean>(false);

  const createLeadFromContactMutation = useMutation({
    mutationFn: async () => {
      if (!conversation) throw new Error('No active conversation');
      const isEmail = conversation.contact.handle_or_phone.includes('@');
      return await crmApi.createLead({
        name: conversation.contact.name,
        phone: isEmail ? undefined : conversation.contact.handle_or_phone,
        email: isEmail ? conversation.contact.handle_or_phone : undefined,
        value: parseFloat(leadDealValue) || 25000,
        source: conversation.channel.toUpperCase(),
        status: 'open',
      });
    },
    onSuccess: () => {
      setLeadCreatedSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['crm_leads'] });
      queryClient.invalidateQueries({ queryKey: ['crm_pipelines'] });
      queryClient.invalidateQueries({ queryKey: ['unified_dashboard'] });
      setTimeout(() => {
        setShowCrmModal(false);
        setLeadCreatedSuccess(false);
      }, 1500);
    },
  });

  if (isLoading && !conversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={{ color: '#64748b', marginTop: 12 }}>Loading conversation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: '#f8fafc', fontSize: 16, fontWeight: '700', marginBottom: 12 }}>Conversation not found</Text>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backText}>← Return to Inbox</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const messages = data?.messages || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header Bar */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={handleBack}>
            <Text style={styles.backText}>← Back</Text>
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.contactName} numberOfLines={1}>
              {conversation.contact.name}
            </Text>
            <View style={styles.headerSub}>
              <Text style={styles.handleText}>{conversation.contact.handle_or_phone}</Text>
              <ChannelBadge channel={conversation.channel} showLabel={false} />
            </View>
          </View>

          <Pressable style={styles.crmButton} onPress={() => setShowCrmModal(true)}>
            <Text style={styles.crmButtonText}>+ CRM</Text>
          </Pressable>
        </View>

        {/* Message Thread */}
        {isLoading && !data ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>Loading message history...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <MessageBubble message={item} />}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No messages in this conversation yet</Text>
              </View>
            }
          />
        )}

        {/* Message Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder={`Reply on ${conversation.channel.toUpperCase()}...`}
            placeholderTextColor="#64748b"
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <Pressable
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || sendMutation.isPending}
            onPress={handleSend}
          >
            {sendMutation.isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </Pressable>
        </View>

        {/* CRM Lead Integration Modal */}
        <Modal
          visible={showCrmModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowCrmModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Convert Contact to Lead</Text>
              <Text style={styles.modalSubtitle}>
                Create a high-priority CRM opportunity from this {conversation.channel.toUpperCase()} conversation.
              </Text>

              {leadCreatedSuccess ? (
                <View style={styles.successBox}>
                  <Text style={styles.successIcon}>✓</Text>
                  <Text style={styles.successText}>Lead Created & Linked Successfully!</Text>
                </View>
              ) : (
                <View style={styles.formGroup}>
                  <Text style={styles.inputLabel}>Lead Name</Text>
                  <View style={styles.readOnlyInput}>
                    <Text style={styles.readOnlyText}>{conversation.contact.name}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Contact Handle / Phone</Text>
                  <View style={styles.readOnlyInput}>
                    <Text style={styles.readOnlyText}>{conversation.contact.handle_or_phone}</Text>
                  </View>

                  <Text style={styles.inputLabel}>Estimated Deal Value (₹)</Text>
                  <TextInput
                    style={styles.modalInput}
                    placeholder="e.g. 50000"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={leadDealValue}
                    onChangeText={setLeadDealValue}
                  />

                  <View style={styles.modalActions}>
                    <Pressable
                      style={styles.cancelButton}
                      onPress={() => setShowCrmModal(false)}
                    >
                      <Text style={styles.cancelButtonText}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.confirmButton,
                        createLeadFromContactMutation.isPending && styles.confirmButtonDisabled,
                      ]}
                      disabled={createLeadFromContactMutation.isPending}
                      onPress={() => createLeadFromContactMutation.mutate()}
                    >
                      {createLeadFromContactMutation.isPending ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                      ) : (
                        <Text style={styles.confirmButtonText}>Create CRM Lead</Text>
                      )}
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020617',
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0b1329',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  backText: {
    color: '#818cf8',
    fontSize: 13,
    fontWeight: '700',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  contactName: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSub: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  handleText: {
    color: '#64748b',
    fontSize: 11,
    marginRight: 6,
  },
  crmButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  crmButtonText: {
    color: '#818cf8',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#64748b',
    fontSize: 13,
    marginTop: 10,
  },
  messagesList: {
    padding: 16,
    paddingBottom: 24,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#64748b',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    color: '#f8fafc',
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#6366f1',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#0b1329',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f8fafc',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 18,
    lineHeight: 18,
  },
  formGroup: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 4,
  },
  readOnlyInput: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  readOnlyText: {
    color: '#e2e8f0',
    fontSize: 14,
    fontWeight: '600',
  },
  modalInput: {
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 12,
    color: '#f8fafc',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#6366f1',
    alignItems: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIcon: {
    fontSize: 36,
    color: '#10b981',
    marginBottom: 10,
  },
  successText: {
    color: '#10b981',
    fontSize: 15,
    fontWeight: '700',
  },
});

