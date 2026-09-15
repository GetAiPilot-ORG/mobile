import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useColorScheme,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TriggerCallModalProps {
  visible: boolean;
  assistants: any[];
  onClose: () => void;
  onSubmit: (payload: {
    customerNumber: string;
    customerName?: string;
    assistantId?: string;
  }) => Promise<void>;
  isLoading: boolean;
}

export const TriggerCallModal: React.FC<TriggerCallModalProps> = ({
  visible,
  assistants,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [selectedAssistantId, setSelectedAssistantId] = useState<string>(
    assistants[0]?.id || ''
  );
  const [error, setError] = useState<string | null>(null);

  // Sync default assistant when available
  React.useEffect(() => {
    if (!selectedAssistantId && assistants.length > 0) {
      setSelectedAssistantId(assistants[0].id);
    }
  }, [assistants]);

  const handleTrigger = async () => {
    setError(null);
    if (!phone.trim()) {
      setError('Please enter a valid phone number.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await onSubmit({
        customerNumber: phone.trim(),
        customerName: name.trim() || undefined,
        assistantId: selectedAssistantId || undefined,
      });
      setPhone('');
      setName('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to initiate AI call.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View>
            <Text style={[styles.headerTitle, isDark && styles.textDark]}>Trigger AI Outbound Call</Text>
            <Text style={styles.headerSubtitle}>Real-time Voice Pilot Telecalling</Text>
          </View>
          <Pressable
            style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]}
            onPress={onClose}
          >
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

          {/* Form Card */}
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={styles.inputLabel}>RECIPIENT PHONE NUMBER *</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="+91 98765 43210"
              placeholderTextColor="#8E8E93"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
              autoCapitalize="none"
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>PROSPECT / CONTACT NAME</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. Rahul Sharma"
              placeholderTextColor="#8E8E93"
              value={name}
              onChangeText={setName}
            />

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>ASSIGNED AI VOICE AGENT</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.assistantScroll}>
              {assistants.map((ast) => {
                const isSelected = selectedAssistantId === ast.id;
                return (
                  <Pressable
                    key={ast.id}
                    style={[
                      styles.assistantChip,
                      isDark ? styles.assistantChipDark : styles.assistantChipLight,
                      isSelected && styles.assistantChipSelected,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedAssistantId(ast.id);
                    }}
                  >
                    <Ionicons
                      name="mic"
                      size={14}
                      color={isSelected ? '#FFFFFF' : isDark ? '#A78BFA' : '#8B5CF6'}
                    />
                    <Text
                      style={[
                        styles.assistantChipText,
                        isSelected && styles.assistantChipTextSelected,
                        !isSelected && (isDark ? styles.textDark : { color: '#000000' }),
                      ]}
                    >
                      {ast.name}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Action CTA */}
          <Pressable
            style={[styles.submitBtn, (!phone.trim() || isLoading) && styles.submitBtnDisabled]}
            disabled={!phone.trim() || isLoading}
            onPress={handleTrigger}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="call" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>Start Live AI Call Now</Text>
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
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputLight: { backgroundColor: '#F9FAFB', borderColor: '#E5E7EB', color: '#000000' },
  inputDark: { backgroundColor: '#0D1117', borderColor: '#262C36', color: '#FFFFFF' },
  assistantScroll: { gap: 8, paddingVertical: 4 },
  assistantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  assistantChipLight: { backgroundColor: '#F3F4F6', borderColor: '#E5E7EB' },
  assistantChipDark: { backgroundColor: '#1E242E', borderColor: '#262C36' },
  assistantChipSelected: { backgroundColor: '#8B5CF6', borderColor: '#8B5CF6' },
  assistantChipText: { fontSize: 12, fontWeight: '600' },
  assistantChipTextSelected: { color: '#FFFFFF' },
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
