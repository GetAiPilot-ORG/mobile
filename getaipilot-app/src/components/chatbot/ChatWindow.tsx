import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Send, Maximize2, Minimize2 } from 'lucide-react-native';
import { LiveOrb } from './LiveOrb';
import { useChatbot } from './useChatbot';
import { useTheme, getColors } from '@/theme';

const MOCK_ACTIONS = [
  'What is GetAIPilot?',
  'How does TeleSub work?',
  'Can I use it for free?',
  'Book a Demo',
];

interface ChatWindowProps {
  onClose: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ChatWindow: React.FC<ChatWindowProps> = ({
  onClose,
  isExpanded = false,
  onToggleExpand,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const screenHeight = Dimensions.get('window').height;

  const {
    messages,
    isLoading,
    isCapturingLead,
    setIsCapturingLead,
    sendMessage,
    submitLead,
  } = useChatbot();

  const [input, setInput] = useState('');
  const [showQuickActions, setShowQuickActions] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  const [leadName, setLeadName] = useState('');
  const [leadEmail, setLeadEmail] = useState('');
  const [leadPhone, setLeadPhone] = useState('');

  // Auto scroll to latest message
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, isLoading, isCapturingLead]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    setShowQuickActions(false);
  };

  const handleActionClick = (actionText: string) => {
    sendMessage(actionText);
    setShowQuickActions(false);
  };

  const handleLeadSubmit = () => {
    if (!leadName.trim() || !leadEmail.trim()) return;
    submitLead(leadName.trim(), leadEmail.trim(), leadPhone.trim());
    setLeadName('');
    setLeadEmail('');
    setLeadPhone('');
  };

  // Formatter for markdown-like text lines (bold, bullet points)
  const renderFormattedText = (text: string, isUser: boolean) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
      const cleanLine = isBullet ? line.trim().replace(/^[•-]\s*/, '') : line;

      // Simple parser for **bold** text segments
      const parts = cleanLine.split(/(\*\*[^*]+\*\*)/g);

      return (
        <View
          key={idx}
          style={[
            styles.textLineRow,
            isBullet && styles.bulletRow,
            idx > 0 && { marginTop: isBullet ? 4 : 6 },
          ]}
        >
          {isBullet && (
            <Text
              style={[
                styles.bulletDot,
                { color: isUser ? '#E0E7FF' : isDark ? '#818CF8' : '#6366F1' },
              ]}
            >
              •{' '}
            </Text>
          )}
          <Text
            style={[
              styles.messageText,
              { color: isUser ? '#FFFFFF' : isDark ? '#E2E8F0' : '#1E293B' },
            ]}
          >
            {parts.map((part, pIdx) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <Text key={pIdx} style={styles.boldText}>
                    {part.slice(2, -2)}
                  </Text>
                );
              }
              return <Text key={pIdx}>{part}</Text>;
            })}
          </Text>
        </View>
      );
    });
  };

  const windowHeight = isExpanded ? screenHeight * 0.94 : screenHeight * 0.78;

  return (
    <Modal
      transparent
      animationType="fade"
      visible
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        {/* Backdrop tap to close */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardContainer}
        >
          <View
            style={[
              styles.windowContainer,
              {
                height: windowHeight,
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                borderColor: isDark ? '#334155' : '#E2E8F0',
              },
            ]}
          >
            {/* Header */}
            <View
              style={[
                styles.header,
                {
                  borderBottomColor: isDark ? '#1E293B' : '#F1F5F9',
                  backgroundColor: isDark ? '#1E293B' : '#F8FAFC',
                },
              ]}
            >
              <View style={styles.headerTitleWrap}>
                <LiveOrb size={32} variant="black" interactive />
                <View style={styles.headerTextWrap}>
                  <Text
                    style={[
                      styles.headerTitle,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    GAP AI Assistant
                  </Text>
                  <View style={styles.onlineBadgeRow}>
                    <View style={styles.onlineDot} />
                    <Text style={styles.onlineStatusText}>Online • Instant Answers</Text>
                  </View>
                </View>
              </View>

              <View style={styles.headerButtons}>
                {onToggleExpand && (
                  <TouchableOpacity
                    onPress={onToggleExpand}
                    style={[
                      styles.iconButton,
                      { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                    ]}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    {isExpanded ? (
                      <Minimize2 size={18} color={isDark ? '#CBD5E1' : '#64748B'} />
                    ) : (
                      <Maximize2 size={18} color={isDark ? '#CBD5E1' : '#64748B'} />
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={onClose}
                  style={[
                    styles.iconButton,
                    { backgroundColor: isDark ? '#334155' : '#F1F5F9' },
                  ]}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={18} color={isDark ? '#CBD5E1' : '#64748B'} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Message History List */}
            <ScrollView
              ref={scrollViewRef}
              style={[
                styles.messageList,
                { backgroundColor: isDark ? '#0B0F19' : '#F8FAFC' },
              ]}
              contentContainerStyle={styles.messageListContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Timestamp */}
              <Text style={styles.timestampText}>
                Today{' '}
                {new Date().toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>

              {/* Privacy Notice */}
              <View
                style={[
                  styles.privacyCard,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <Text
                  style={[
                    styles.privacyTitle,
                    { color: isDark ? '#F1F5F9' : '#0F172A' },
                  ]}
                >
                  Privacy Notice
                </Text>
                <Text
                  style={[
                    styles.privacyText,
                    { color: isDark ? '#94A3B8' : '#64748B' },
                  ]}
                >
                  By using this automated assistant, you consent that your data may be
                  processed to assist your inquiries in accordance with the GetAiPilot
                  Privacy Policy.
                </Text>
              </View>

              {/* Message Bubbles */}
              {messages.map((msg, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.messageRow,
                    msg.role === 'user' ? styles.userRow : styles.assistantRow,
                  ]}
                >
                  {msg.role === 'assistant' && (
                    <View style={styles.avatarWrap}>
                      <LiveOrb size={28} variant="black" />
                    </View>
                  )}

                  {msg.role === 'user' ? (
                    <LinearGradient
                      colors={['#0EA5E9', '#6366F1', '#8B5CF6']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.userBubble}
                    >
                      {renderFormattedText(msg.content, true)}
                    </LinearGradient>
                  ) : (
                    <View
                      style={[
                        styles.assistantBubble,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                        },
                      ]}
                    >
                      {renderFormattedText(msg.content, false)}
                    </View>
                  )}
                </View>
              ))}

              {/* Quick Actions */}
              {showQuickActions && (
                <View style={styles.quickActionsContainer}>
                  <Text style={styles.quickActionsHeader}>Quick questions:</Text>
                  {MOCK_ACTIONS.map((action, aIdx) => (
                    <TouchableOpacity
                      key={aIdx}
                      onPress={() => handleActionClick(action)}
                      style={[
                        styles.quickActionPill,
                        {
                          backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                          borderColor: isDark ? '#334155' : '#CBD5E1',
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.quickActionText,
                          { color: isDark ? '#E2E8F0' : '#334155' },
                        ]}
                      >
                        {action}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Lead Capture Form Card */}
              {isCapturingLead && (
                <View
                  style={[
                    styles.leadFormCard,
                    {
                      backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                      borderColor: isDark ? '#334155' : '#CBD5E1',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.leadFormTitle,
                      { color: isDark ? '#FFFFFF' : '#0F172A' },
                    ]}
                  >
                    Would you like our team to reach out?
                  </Text>
                  <Text
                    style={[
                      styles.leadFormSub,
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}
                  >
                    Leave your details and we'll get back to you with pricing, demo
                    requests, and exclusive plan offers.
                  </Text>

                  <TextInput
                    placeholder="Your Name *"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    value={leadName}
                    onChangeText={setLeadName}
                    style={[
                      styles.leadInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      },
                    ]}
                  />

                  <TextInput
                    placeholder="Your Email *"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={leadEmail}
                    onChangeText={setLeadEmail}
                    style={[
                      styles.leadInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      },
                    ]}
                  />

                  <TextInput
                    placeholder="Phone Number (Optional)"
                    placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                    keyboardType="phone-pad"
                    value={leadPhone}
                    onChangeText={setLeadPhone}
                    style={[
                      styles.leadInput,
                      {
                        backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                        color: isDark ? '#FFFFFF' : '#0F172A',
                      },
                    ]}
                  />

                  <View style={styles.leadButtonRow}>
                    <TouchableOpacity
                      onPress={handleLeadSubmit}
                      style={styles.leadSubmitButton}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#0EA5E9', '#6366F1', '#8B5CF6']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.leadSubmitGradient}
                      >
                        <Text style={styles.leadSubmitText}>Submit Request</Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setIsCapturingLead(false)}
                      style={[
                        styles.leadCancelButton,
                        { borderColor: isDark ? '#334155' : '#CBD5E1' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.leadCancelText,
                          { color: isDark ? '#94A3B8' : '#64748B' },
                        ]}
                      >
                        Cancel
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Typing indicator */}
              {isLoading && (
                <View style={styles.typingRow}>
                  <View style={styles.avatarWrap}>
                    <LiveOrb size={28} variant="black" />
                  </View>
                  <View
                    style={[
                      styles.typingBubble,
                      {
                        backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#E2E8F0',
                      },
                    ]}
                  >
                    <View style={styles.dot} />
                    <View style={[styles.dot, { opacity: 0.7 }]} />
                    <View style={[styles.dot, { opacity: 0.4 }]} />
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View
              style={[
                styles.inputBarContainer,
                {
                  backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                  borderTopColor: isDark ? '#1E293B' : '#F1F5F9',
                },
              ]}
            >
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                    borderColor: isDark ? '#334155' : '#E2E8F0',
                  },
                ]}
              >
                <TextInput
                  value={input}
                  onChangeText={setInput}
                  placeholder="Ask anything about GetAiPilot..."
                  placeholderTextColor={isDark ? '#64748B' : '#94A3B8'}
                  style={[
                    styles.textInput,
                    { color: isDark ? '#FFFFFF' : '#0F172A' },
                  ]}
                  multiline={false}
                  onSubmitEditing={handleSend}
                  returnKeyType="send"
                  editable={!isLoading}
                />

                <TouchableOpacity
                  onPress={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={[
                    styles.sendButton,
                    input.trim() && !isLoading
                      ? styles.sendButtonActive
                      : styles.sendButtonDisabled,
                  ]}
                  activeOpacity={0.7}
                >
                  <Send
                    size={18}
                    color={input.trim() && !isLoading ? '#FFFFFF' : '#94A3B8'}
                  />
                </TouchableOpacity>
              </View>

              <Text style={styles.disclaimerText}>
                AI-generated responses may be inaccurate. By chatting, you agree to our Terms.
              </Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  keyboardContainer: {
    width: '100%',
  },
  windowContainer: {
    width: '100%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 18,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTextWrap: {
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  onlineBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  onlineStatusText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '500',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
    paddingBottom: 24,
  },
  timestampText: {
    textAlign: 'center',
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 12,
    fontWeight: '500',
  },
  privacyCard: {
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  privacyTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  privacyText: {
    fontSize: 11,
    lineHeight: 16,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 14,
    maxWidth: '100%',
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  avatarWrap: {
    marginRight: 8,
    marginTop: 2,
  },
  userBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: 3,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  assistantBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopLeftRadius: 3,
    borderWidth: 1,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  textLineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  bulletRow: {
    paddingLeft: 4,
  },
  bulletDot: {
    fontSize: 13,
    fontWeight: '700',
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  boldText: {
    fontWeight: '700',
  },
  quickActionsContainer: {
    marginLeft: 36,
    marginTop: 4,
    marginBottom: 12,
    gap: 8,
  },
  quickActionsHeader: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickActionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: 'flex-start',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
  },
  leadFormCard: {
    marginLeft: 36,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
  },
  leadFormTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  leadFormSub: {
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12,
  },
  leadInput: {
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    marginBottom: 8,
  },
  leadButtonRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  leadSubmitButton: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    overflow: 'hidden',
  },
  leadSubmitGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadSubmitText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  leadCancelButton: {
    paddingHorizontal: 14,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadCancelText: {
    fontSize: 12,
    fontWeight: '600',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    borderTopLeftRadius: 2,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6366F1',
  },
  inputBarContainer: {
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 46,
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    height: '100%',
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  sendButtonActive: {
    backgroundColor: '#6366F1',
  },
  sendButtonDisabled: {
    backgroundColor: 'transparent',
  },
  disclaimerText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
  },
});
