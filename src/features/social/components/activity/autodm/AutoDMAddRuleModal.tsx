import {
  Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTheme, getColors } from '@/theme';

export interface AutoDMAddRuleModalProps {
  visible: boolean;
  onClose: () => void;
  ruleName: string;
  setRuleName: (val: string) => void;
  ruleKeyword: string;
  setRuleKeyword: (val: string) => void;
  ruleReply: string;
  setRuleReply: (val: string) => void;
  ruleChannel: 'instagram' | 'facebook' | 'all';
  setRuleChannel: (val: 'instagram' | 'facebook' | 'all') => void;
  onSubmit: () => void;
}

export const AutoDMAddRuleModal: React.FC<AutoDMAddRuleModalProps> = ({
  visible,
  onClose,
  ruleName,
  setRuleName,
  ruleKeyword,
  setRuleKeyword,
  ruleReply,
  setRuleReply,
  ruleChannel,
  setRuleChannel,
  onSubmit,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalContainer, { backgroundColor: isDark ? '#0b0f19' : '#f8fafc' }]}
      >
        <View style={[styles.modalHeader, { borderBottomColor: isDark ? '#1e293b' : '#e2e8f0' }]}>
          <Text style={[styles.modalTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
            Create AutoDM Rule
          </Text>
          <Pressable onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={isDark ? '#cbd5e1' : '#64748b'} />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.modalScrollContent}>
          <View style={styles.modalCardWrapper}>
            <View style={styles.modalFieldGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Rule Title
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
                placeholder="e.g., Reel Pricing Auto-Responder"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={ruleName}
                onChangeText={setRuleName}
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Trigger Keyword
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                  },
                ]}
                placeholder="e.g., PRICE, LINK, DEMO"
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={ruleKeyword}
                onChangeText={setRuleKeyword}
                autoCapitalize="characters"
              />
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Target Channel
              </Text>
              <View style={styles.channelChipsRow}>
                {(['instagram', 'facebook', 'all'] as const).map((ch) => (
                  <Pressable
                    key={ch}
                    onPress={() => setRuleChannel(ch)}
                    style={[
                      styles.channelSelectChip,
                      {
                        backgroundColor:
                          ruleChannel === ch ? '#3b82f6' : isDark ? '#1e293b' : '#e2e8f0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.channelSelectText,
                        { color: ruleChannel === ch ? '#ffffff' : isDark ? '#94a3b8' : '#64748b' },
                      ]}
                    >
                      {ch.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalFieldGroup}>
              <Text style={[styles.inputLabel, { color: isDark ? '#f8fafc' : '#0f172a' }]}>
                Automated Direct Message
              </Text>
              <TextInput
                style={[
                  styles.modalInput,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    color: isDark ? '#f8fafc' : '#0f172a',
                    borderColor: isDark ? '#334155' : '#cbd5e1',
                    minHeight: 90,
                  },
                ]}
                placeholder="Hey! Thanks for commenting. Here is the link you requested..."
                placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                value={ruleReply}
                onChangeText={setRuleReply}
                multiline
              />
            </View>

            <Pressable onPress={onSubmit} style={styles.createRuleSubmitBtn}>
              <Text style={styles.createRuleSubmitText}>Save & Activate Rule</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 6,
  },
  modalScrollContent: {
    padding: 16,
    alignItems: 'center',
  },
  modalCardWrapper: {
    width: '100%',
    maxWidth: 500,
    gap: 14,
  },
  modalFieldGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
  },
  channelChipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  channelSelectChip: {
    flex: 1,
    minWidth: 80,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  channelSelectText: {
    fontSize: 12,
    fontWeight: '700',
  },
  createRuleSubmitBtn: {
    backgroundColor: '#3b82f6',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
  },
  createRuleSubmitText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
