import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  Search01Icon,
  UserIcon,
  WhatsappIcon,
  TelegramIcon,
  InstagramIcon,
  ArrowRight01Icon,
  Add01Icon,
} from '@/constants/icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';
import { ContactItem, InboxChannel, MetaTemplate } from '../types';

interface NewChatBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  contacts: ContactItem[];
  isLoadingContacts?: boolean;
  onStartChat: (contact: ContactItem, channel: InboxChannel, initialMessage?: string) => void;
  templates?: MetaTemplate[];
}

export const NewChatBottomSheet: React.FC<NewChatBottomSheetProps> = ({
  visible,
  onClose,
  contacts,
  isLoadingContacts = false,
  onStartChat,
  templates = [],
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [selectedChannel, setSelectedChannel] = useState<InboxChannel>('whatsapp');
  const [searchQuery, setSearchQuery] = useState('');
  const [customPhone, setCustomPhone] = useState('');

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts.slice(0, 30);
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter((c) => {
      const name = (c.name || c.custom_name || '').toLowerCase();
      const phone = c.phone || c.wa_id || '';
      return name.includes(q) || phone.includes(q);
    });
  }, [contacts, searchQuery]);

  const handleSelectContact = (c: ContactItem) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch { }
    }
    onStartChat(c, selectedChannel);
  };

  const handleStartCustomPhone = () => {
    const clean = customPhone.replace(/[^\d+]/g, '');
    if (!clean) return;
    const fakeContact: ContactItem = {
      id: `custom_${Date.now()}`,
      name: `+${clean.replace(/^\+/, '')}`,
      phone: clean.replace(/^\+/, ''),
    };
    onStartChat(fakeContact, selectedChannel);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <View
            style={[
              styles.sheetContainer,
              {
                backgroundColor: colors.card,
                borderTopColor: isDark
                  ? 'rgba(255, 255, 255, 0.12)'
                  : 'rgba(0, 0, 0, 0.08)',
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={[styles.title, { color: colors.textPrimary }]}>
                  Start New Chat
                </Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                  Select a channel and contact to start a live conversation
                </Text>
              </View>

              <Pressable
                onPress={onClose}
                hitSlop={8}
                style={styles.closeBtn}
                accessibilityRole="button"
                accessibilityLabel="Close new chat sheet"
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={20}
                  color={colors.textSecondary}
                  strokeWidth={2}
                />
              </Pressable>
            </View>

            {/* Channel Selection Chips */}
            <View style={styles.channelRow}>
              {[
                { id: 'whatsapp' as const, label: 'WhatsApp', icon: WhatsappIcon, color: '#16A34A', bg: 'rgba(34, 197, 94, 0.12)' },
                { id: 'telegram' as const, label: 'Telegram', icon: TelegramIcon, color: '#0284C7', bg: 'rgba(14, 165, 233, 0.12)' },
                { id: 'instagram' as const, label: 'InstaPilot', icon: InstagramIcon, color: '#DB2777', bg: 'rgba(236, 72, 153, 0.12)' },
              ].map((ch) => {
                const isSelected = selectedChannel === ch.id;
                return (
                  <Pressable
                    key={ch.id}
                    onPress={() => setSelectedChannel(ch.id)}
                    style={[
                      styles.channelChip,
                      {
                        backgroundColor: isSelected ? ch.bg : isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
                        borderColor: isSelected ? ch.color : isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                      },
                    ]}
                  >
                    <HugeiconsIcon
                      icon={ch.icon}
                      size={15}
                      color={isSelected ? ch.color : colors.textSecondary}
                      strokeWidth={2}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.channelChipText,
                        {
                          color: isSelected ? ch.color : colors.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}
                    >
                      {ch.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Direct Number Input */}
            <View
              style={[
                styles.directInputRow,
                {
                  backgroundColor: colors.background,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <TextInput
                style={[styles.directInput, { color: colors.textPrimary }]}
                placeholder="Enter phone with country code (e.g. +91 9876543210)..."
                placeholderTextColor={colors.textSecondary}
                value={customPhone}
                onChangeText={setCustomPhone}
                keyboardType="phone-pad"
              />
              {customPhone.length > 5 && (
                <Pressable
                  onPress={handleStartCustomPhone}
                  style={[
                    styles.directSubmitBtn,
                    { backgroundColor: colors.primary },
                  ]}
                >
                  <Text style={styles.directSubmitText}>Chat</Text>
                </Pressable>
              )}
            </View>

            {/* Contact Search Input */}
            <View
              style={[
                styles.searchBox,
                {
                  backgroundColor: colors.background,
                  borderColor: isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <HugeiconsIcon
                icon={Search01Icon}
                size={16}
                color={colors.textSecondary}
                strokeWidth={2}
                style={{ marginRight: 8 }}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.textPrimary }]}
                placeholder="Search workspace contacts by name or phone..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Contacts Scrollable List */}
            <ScrollView
              style={styles.contactList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredContacts.length === 0 ? (
                <View style={styles.emptyContacts}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No contacts found matching "{searchQuery}"
                  </Text>
                </View>
              ) : (
                filteredContacts.map((cnt) => (
                  <Pressable
                    key={cnt.id}
                    onPress={() => handleSelectContact(cnt)}
                    style={[
                      styles.contactRow,
                      {
                        backgroundColor: colors.card,
                        borderColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.contactAvatar,
                        {
                          backgroundColor: isDark
                            ? 'rgba(112, 85, 232, 0.20)'
                            : '#EDE9FE',
                        },
                      ]}
                    >
                      <HugeiconsIcon
                        icon={UserIcon}
                        size={18}
                        color="#7055E8"
                        strokeWidth={2}
                      />
                    </View>

                    <View style={styles.contactInfo}>
                      <Text
                        style={[
                          styles.contactName,
                          { color: colors.textPrimary },
                        ]}
                      >
                        {cnt.name || cnt.custom_name || 'Contact'}
                      </Text>
                      <Text
                        style={[
                          styles.contactPhone,
                          { color: colors.textSecondary },
                        ]}
                      >
                        +{cnt.phone || cnt.wa_id}
                      </Text>
                    </View>

                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={16}
                      color={colors.textSecondary}
                      strokeWidth={2}
                    />
                  </Pressable>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 28,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  channelRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  channelChip: {
    flex: 1,
    height: 38,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  channelChipText: {
    fontSize: 12,
  },
  directInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    marginBottom: 10,
  },
  directInput: {
    flex: 1,
    fontSize: 12.5,
    padding: 0,
  },
  directSubmitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 6,
  },
  directSubmitText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 42,
    borderWidth: 1,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    padding: 0,
  },
  contactList: {
    maxHeight: 280,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactAvatar: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactInfo: {
    flex: 1,
    minWidth: 0,
  },
  contactName: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  contactPhone: {
    fontSize: 11,
    marginTop: 2,
  },
  emptyContacts: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 12.5,
  },
});


