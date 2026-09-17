import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { TelegramChat, CreateForwardRulePayload } from '../types';

interface AutoforwardModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: CreateForwardRulePayload) => Promise<any>;
  isLoading: boolean;
  chats?: TelegramChat[];
  onRefreshChats?: () => void;
}

export const AutoforwardModal: React.FC<AutoforwardModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  chats = [],
  onRefreshChats,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [selectedSourceChat, setSelectedSourceChat] = useState<TelegramChat | null>(null);
  const [selectedTargetChat, setSelectedTargetChat] = useState<TelegramChat | null>(null);
  const [customSource, setCustomSource] = useState('');
  const [customTarget, setCustomTarget] = useState('');

  const [whitelistKeywords, setWhitelistKeywords] = useState('');
  const [blacklistKeywords, setBlacklistKeywords] = useState('');
  const [delaySec, setDelaySec] = useState<number>(0);
  const [replaceHeader, setReplaceHeader] = useState('');
  const [replaceFooter, setReplaceFooter] = useState('');
  const [addBranding, setAddBranding] = useState(false);

  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSave = async () => {
    const sourceTitle = selectedSourceChat ? selectedSourceChat.title : customSource.trim();
    const targetTitle = selectedTargetChat ? selectedTargetChat.title : customTarget.trim();

    if (!sourceTitle) {
      setErrorMessage('Please select or specify a source channel.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!targetTitle) {
      setErrorMessage('Please select or specify a destination target channel.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    await onSubmit({
      sourceChannel: sourceTitle,
      targetChannel: targetTitle,
      sourceChannelId: selectedSourceChat?.id,
      targetChannelId: selectedTargetChat?.id,
      keywordsFilter: whitelistKeywords ? whitelistKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
      blacklistKeywords: blacklistKeywords ? blacklistKeywords.split(',').map((k) => k.trim()).filter(Boolean) : [],
      addHeaderFooter: addBranding,
      replaceHeader: addBranding && replaceHeader.trim() ? replaceHeader.trim() : undefined,
      replaceFooter: addBranding && replaceFooter.trim() ? replaceFooter.trim() : undefined,
      delaySeconds: delaySec,
    });
    onClose();
  };

  const delayOptions = [0, 3, 5, 10, 30];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.iconBox, { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : 'rgba(2,132,199,0.1)' }]}>
              <Ionicons name="git-compare-outline" size={22} color="#0284C7" />
            </View>
            <View>
              <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Autoforwarding</Text>
              <Text style={styles.subtitle}>Real-time automated message routing engine</Text>
            </View>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* SOURCE CHANNEL PICKER */}
          <View style={styles.field}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>1. SOURCE CHANNEL / GROUP (FROM)</Text>
              {onRefreshChats && (
                <Pressable onPress={onRefreshChats} hitSlop={8} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="sync-outline" size={12} color="#0284C7" />
                  <Text style={{ fontSize: 11, color: '#0284C7', fontWeight: '600' }}>Sync Chats</Text>
                </Pressable>
              )}
            </View>

            <Pressable
              style={[styles.pickerBtn, isDark ? styles.inputDark : styles.inputLight]}
              onPress={() => {
                setShowSourcePicker(!showSourcePicker);
                setShowTargetPicker(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name="radio-button-on" size={16} color="#0284C7" />
                <Text style={[styles.pickerValue, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                  {selectedSourceChat ? selectedSourceChat.title : (customSource || 'Select a synced Telegram channel')}
                </Text>
              </View>
              <Ionicons name={showSourcePicker ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
            </Pressable>

            {showSourcePicker && (
              <View style={[styles.dropdown, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={styles.dropdownHeader}>YOUR SYNCED CHANNELS</Text>
                {chats.length === 0 ? (
                  <Text style={styles.emptyText}>No channels synced yet. Type a channel name below.</Text>
                ) : (
                  chats.map((c, idx) => (
                    <Pressable
                      key={`source_chat_${c.id || c.title || 'chat'}_${idx}`}
                      style={[
                        styles.chatItem,
                        selectedSourceChat?.id === c.id && { backgroundColor: isDark ? 'rgba(2,132,199,0.2)' : 'rgba(2,132,199,0.1)' },
                      ]}
                      onPress={() => {
                        setSelectedSourceChat(c);
                        setShowSourcePicker(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.chatTitle, isDark ? styles.textDark : styles.textLight]}>{c.title}</Text>
                        <Text style={styles.chatMeta}>{c.type ? c.type.charAt(0).toUpperCase() + c.type.slice(1).toLowerCase() : ''} • {c.member_count || 0} members</Text>
                      </View>
                      {selectedSourceChat?.id === c.id && <Ionicons name="checkmark" size={18} color="#0284C7" />}
                    </Pressable>
                  ))
                )}
                <View style={{ paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.15)' }}>
                  <Text style={styles.dropdownHeader}>Or enter custom handle</Text>
                  <TextInput
                    style={[styles.customInput, isDark ? styles.inputDark : styles.inputLight]}
                    placeholder="@channel_or_link"
                    placeholderTextColor="#94A3B8"
                    value={customSource}
                    onChangeText={(val) => {
                      setCustomSource(val);
                      setSelectedSourceChat(null);
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* TARGET CHANNEL PICKER */}
          <View style={styles.field}>
            <Text style={styles.label}>2. TARGET CHANNEL / GROUP (FORWARD TO)</Text>
            <Pressable
              style={[styles.pickerBtn, isDark ? styles.inputDark : styles.inputLight]}
              onPress={() => {
                setShowTargetPicker(!showTargetPicker);
                setShowSourcePicker(false);
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                <Ionicons name="arrow-redo" size={16} color="#10B981" />
                <Text style={[styles.pickerValue, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
                  {selectedTargetChat ? selectedTargetChat.title : (customTarget || 'Select target destination channel')}
                </Text>
              </View>
              <Ionicons name={showTargetPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
            </Pressable>

            {showTargetPicker && (
              <View style={[styles.dropdown, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={styles.dropdownHeader}>YOUR SYNCED CHANNELS</Text>
                {chats.length === 0 ? (
                  <Text style={styles.emptyText}>No channels synced yet. Type a target channel below.</Text>
                ) : (
                  chats.map((c, idx) => (
                    <Pressable
                      key={`target_chat_${c.id || c.title || 'chat'}_${idx}`}
                      style={[
                        styles.chatItem,
                        selectedTargetChat?.id === c.id && { backgroundColor: isDark ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.1)' },
                      ]}
                      onPress={() => {
                        setSelectedTargetChat(c);
                        setShowTargetPicker(false);
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.chatTitle, isDark ? styles.textDark : styles.textLight]}>{c.title}</Text>
                        <Text style={styles.chatMeta}>{c.type ? c.type.charAt(0).toUpperCase() + c.type.slice(1).toLowerCase() : ''} • {c.member_count || 0} members</Text>
                      </View>
                      {selectedTargetChat?.id === c.id && <Ionicons name="checkmark" size={18} color="#10B981" />}
                    </Pressable>
                  ))
                )}
                <View style={{ paddingHorizontal: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(148,163,184,0.15)' }}>
                  <Text style={styles.dropdownHeader}>Or enter custom target</Text>
                  <TextInput
                    style={[styles.customInput, isDark ? styles.inputDark : styles.inputLight]}
                    placeholder="@target_channel"
                    placeholderTextColor="#94A3B8"
                    value={customTarget}
                    onChangeText={(val) => {
                      setCustomTarget(val);
                      setSelectedTargetChat(null);
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* KEYWORD WHITELIST */}
          <View style={styles.field}>
            <Text style={styles.label}>3. KEYWORD WHITELIST (REQUIRED TO MATCH)</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="BUY, SELL, TARGET, STOPLOSS..."
              placeholderTextColor="#94A3B8"
              value={whitelistKeywords}
              onChangeText={setWhitelistKeywords}
            />
            <Text style={styles.hint}>Only messages containing at least one of these words will be forwarded.</Text>
          </View>

          {/* KEYWORD BLACKLIST */}
          <View style={styles.field}>
            <Text style={styles.label}>4. KEYWORD BLACKLIST (SKIP MESSAGE IF FOUND)</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="SPAM, AD, JOIN, PROMO..."
              placeholderTextColor="#94A3B8"
              value={blacklistKeywords}
              onChangeText={setBlacklistKeywords}
            />
            <Text style={styles.hint}>Messages containing any blacklist words will be automatically ignored.</Text>
          </View>

          {/* DELAY SETTINGS */}
          <View style={styles.field}>
            <Text style={styles.label}>5. FORWARDING DELAY</Text>
            <View style={styles.delayRow}>
              {delayOptions.map((sec) => (
                <Pressable
                  key={sec}
                  style={[
                    styles.delayPill,
                    isDark ? styles.pillDark : styles.pillLight,
                    delaySec === sec && styles.pillActive,
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setDelaySec(sec);
                  }}
                >
                  <Text
                    style={[
                      styles.delayText,
                      isDark ? styles.textDark : styles.textLight,
                      delaySec === sec && styles.delayTextActive,
                    ]}
                  >
                    {sec === 0 ? 'Instant (0s)' : `${sec}s delay`}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* CUSTOM BRANDING SWITCH */}
          <View style={[styles.switchRow, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchLabel, isDark ? styles.textDark : styles.textLight]}>
                Add Header & Footer Branding
              </Text>
              <Text style={styles.switchDesc}>Prepend header and append community links to forwarded posts</Text>
            </View>
            <Switch
              value={addBranding}
              onValueChange={setAddBranding}
              trackColor={{ false: '#CBD5E1', true: '#0284C7' }}
            />
          </View>

          {addBranding && (
            <View style={styles.brandingBox}>
              <View style={styles.field}>
                <Text style={styles.label}>HEADER TEXT</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  value={replaceHeader}
                  onChangeText={setReplaceHeader}
                />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>FOOTER LINK / CTA</Text>
                <TextInput
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                  value={replaceFooter}
                  onChangeText={setReplaceFooter}
                />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight]}>
          <Pressable style={styles.submitBtn} onPress={handleSave} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="flash-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Save & Activate Forwarding Rule</Text>
              </>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#0B0F19' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  headerTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  borderLight: { borderBottomColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#27272A' },
  title: { fontSize: 17, fontWeight: '700' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#27272A' },
  body: { flex: 1 },
  bodyContent: { padding: 16, paddingBottom: 32 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: { color: '#EF4444', fontSize: 13, fontWeight: '600', flex: 1 },
  field: { marginBottom: 16 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  label: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
  },
  pickerValue: { fontSize: 14, fontWeight: '600', flex: 1 },
  dropdown: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 6,
    paddingVertical: 8,
  },
  dropdownHeader: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    paddingHorizontal: 12,
    paddingVertical: 4,
    letterSpacing: 0.5,
  },
  emptyText: {
    fontSize: 12,
    color: '#94A3B8',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chatTitle: { fontSize: 14, fontWeight: '600' },
  chatMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  customInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  inputLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    color: '#0F172A',
  },
  inputDark: {
    backgroundColor: '#121212',
    borderColor: '#27272A',
    color: '#F8FAFC',
  },
  hint: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  delayRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  delayPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  pillDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  pillActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  delayText: { fontSize: 12, fontWeight: '600' },
  delayTextActive: { color: '#FFFFFF' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#121212', borderColor: '#27272A' },
  switchLabel: { fontSize: 14, fontWeight: '600' },
  switchDesc: { color: '#64748B', fontSize: 12, marginTop: 2 },
  brandingBox: { marginBottom: 16 },
  footer: { padding: 16, borderTopWidth: 1 },
  submitBtn: {
    backgroundColor: '#0284C7',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
