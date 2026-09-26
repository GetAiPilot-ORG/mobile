import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../../core/store/authStore';
import { TelegramToolKey } from '../types';
import { useTheme, getColors } from '@/theme';

interface Props {
  chats?: any[];
  isBroadcasting?: boolean;
  onOpenModal?: (key: TelegramToolKey) => void;
}

export const BroadcastScreen: React.FC<Props> = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const user = useAuthStore((s) => s.user);

  const telegramUserId =
    (user as any)?.telegram_user_id ||
    (user as any)?.user_metadata?.telegram_user_id ||
    null;

  const card = isDark ? styles.cardDark : styles.cardLight;
  const txt = isDark ? styles.textDark : styles.textLight;

  const handleOpenBot = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = 'https://t.me/Gapgrowbot?start=true';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/Gapgrowbot?start=true');
      }
    } catch {
      await Linking.openURL('https://t.me/Gapgrowbot?start=true');
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.card, card]}>
        {/* App Icon */}
        <View style={[styles.iconWrapper, isDark ? styles.iconWrapperDark : styles.iconWrapperLight]}>
          <Image
            source={require('../../../../assets/images/growimage.jpg')}
            style={styles.botIcon}
            resizeMode="cover"
          />
        </View>

        {/* Category Eyebrow */}
        <Text style={styles.eyebrow}>TELEGRAM BROADCAST</Text>

        {/* Title */}
        <Text style={[styles.title, txt]}>GAP Broadcast</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Send bulk messages to your audience instantly.
        </Text>

        {/* Description */}
        <Text style={styles.description}>
          Reach all users who joined your channels through GAP bots. Perfect for announcements, signals, or daily updates.
        </Text>

        {/* Connected Telegram ID Pill */}
        {telegramUserId ? (
          <View style={[styles.idPill, isDark ? styles.idPillDark : styles.idPillLight]}>
            <Ionicons name="hardware-chip-outline" size={16} color="#024AD8" />
            <Text style={[styles.idPillText, txt]}>
              Connected Telegram ID: {telegramUserId}
            </Text>
          </View>
        ) : null}

        {/* Connect Action Button */}
        <Pressable style={styles.primaryBtn} onPress={handleOpenBot}>
          <Ionicons name="hardware-chip-outline" size={18} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>
            {telegramUserId ? 'OPEN GAP GROW BOT' : 'CONNECT TO TELEGRAM BOT'}
          </Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </Pressable>

        {/* Secure Redirect Note */}
        <View style={styles.footerNote}>
          <Ionicons name="open-outline" size={14} color="#64748B" />
          <Text style={styles.footerNoteText}>Redirects securely to Telegram app</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    alignItems: 'center',
    width: '100%',
  },
  card: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    textAlign: 'center',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#121212',
    borderColor: '#27272A',
  },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 20,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrapperLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  iconWrapperDark: {
    backgroundColor: '#1E2430',
    borderColor: '#27272A',
  },
  botIcon: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  eyebrow: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#024AD8',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14.5,
    fontWeight: '600',
    color: '#334155',
    textAlign: 'center',
    marginBottom: 12,
    maxWidth: 320,
  },
  description: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 24,
    maxWidth: 340,
  },
  idPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  idPillLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  idPillDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  idPillText: {
    fontSize: 13,
    fontWeight: '700',
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#024AD8',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#024AD8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 20,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingTop: 16,
    width: '100%',
    justifyContent: 'center',
  },
  footerNoteText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
});
