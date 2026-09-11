import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { TelegramChat } from '../types';

interface SubManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
  chats?: TelegramChat[];
}

export const SubManagerModal: React.FC<SubManagerModalProps> = ({
  visible,
  onClose,
  onSubmit,
  isLoading,
  chats = [],
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [tierName, setTierName] = useState('VIP Monthly Membership');
  const [price, setPrice] = useState('1499');
  const [durationDays, setDurationDays] = useState('30');
  const [channelId, setChannelId] = useState(chats[0]?.username ? `@${chats[0].username}` : '@premium_club_vip');

  const handleCreate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await onSubmit({
      tierName,
      price: parseFloat(price) || 0,
      currency: 'INR',
      durationDays: parseInt(durationDays, 10) || 30,
      channelId,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Sub Manager</Text>
            <Text style={styles.subtitle}>Monetize VIP community & auto-manage access</Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={[styles.statsCard, isDark ? styles.cardDark : styles.cardLight]}>
            <View>
              <Text style={styles.statsLabel}>MONTHLY RECURRING REVENUE</Text>
              <Text style={styles.statsVal}>₹92,500</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>185 Active VIPs</Text>
            </View>
          </View>

          <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
            Create New Membership Plan
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>TIER / PLAN NAME</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="e.g. VIP Quarterly Access"
              placeholderTextColor="#94A3B8"
              value={tierName}
              onChangeText={setTierName}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>PRICE (₹ INR)</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="1499"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>
            <View style={[styles.field, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>DURATION (DAYS)</Text>
              <TextInput
                style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                placeholder="30"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={durationDays}
                onChangeText={setDurationDays}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>PROTECTED CHANNEL / COMMUNITY</Text>
            {chats.length > 0 && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {chats.map((c, idx) => {
                    const cVal = c.username ? `@${c.username}` : c.title;
                    const isSelected = channelId === cVal || channelId === `@${c.username}`;
                    return (
                      <Pressable
                        key={`sub_chat_${c.id || c.title || 'chat'}_${idx}`}
                        style={[
                          styles.chatPill,
                          isDark ? styles.chatPillDark : styles.chatPillLight,
                          isSelected && styles.chatPillSelected,
                        ]}
                        onPress={() => setChannelId(cVal)}
                      >
                        <Ionicons
                          name="radio-button-on"
                          size={12}
                          color={isSelected ? '#FFFFFF' : '#0284C7'}
                        />
                        <Text
                          style={[
                            styles.chatPillText,
                            isDark ? styles.textDark : styles.textLight,
                            isSelected && { color: '#FFFFFF', fontWeight: '700' },
                          ]}
                          numberOfLines={1}
                        >
                          {c.title}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </ScrollView>
            )}
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              placeholder="@premium_channel or Channel Name"
              placeholderTextColor="#94A3B8"
              value={channelId}
              onChangeText={setChannelId}
            />
            <Text style={styles.hint}>Members receive instant 1-time invite link & auto-removed upon expiry</Text>
          </View>
        </ScrollView>

        <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight]}>
          <Pressable style={styles.submitBtn} onPress={handleCreate} disabled={isLoading}>
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons name="link-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitText}>Create Plan & Generate Link</Text>
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
  borderLight: { borderBottomColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#262C36' },
  title: { fontSize: 18, fontWeight: '700' },
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
  closeBtnDark: { backgroundColor: '#262C36' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  statsCard: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#161B26', borderColor: '#262C36' },
  statsLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 0.5 },
  statsVal: { color: '#0284C7', fontSize: 22, fontWeight: '800', marginTop: 4 },
  badge: {
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  badgeText: { color: '#0284C7', fontSize: 12, fontWeight: '700' },
  sectionHeader: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  field: { marginBottom: 16 },
  row: { flexDirection: 'row' },
  label: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
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
    backgroundColor: '#161B26',
    borderColor: '#262C36',
    color: '#F8FAFC',
  },
  hint: { color: '#94A3B8', fontSize: 11, marginTop: 4 },
  chatPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    maxWidth: 160,
  },
  chatPillLight: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  chatPillDark: { backgroundColor: '#1E2430', borderColor: '#262C36' },
  chatPillSelected: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  chatPillText: { fontSize: 11, fontWeight: '600' },
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
