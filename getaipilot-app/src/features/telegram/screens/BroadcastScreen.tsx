import { ProductButton,ProductHeading,ProductRow,useProductPalette } from "@/components/ProductUI";
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React from 'react';
import {
Linking,
Text,
View
} from 'react-native';
import { useAuthStore } from '../../../core/store/authStore';
import { TelegramToolKey } from '../types';

interface Props {
  chats?: any[];
  isBroadcasting?: boolean;
  onOpenModal?: (key: TelegramToolKey) => void;
}

export const BroadcastScreen: React.FC<Props> = () => {
  const colors = useProductPalette();
  const user = useAuthStore((s) => s.user);

  const telegramUserId =
    (user as any)?.telegram_user_id ||
    (user as any)?.user_metadata?.telegram_user_id ||
    null;

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
    <View>
      <ProductHeading title="A message for everyone" />
      <View style={{ backgroundColor: colors.mint, borderRadius: 26, padding: 26, gap: 22, marginBottom: 26 }}>
        <Ionicons name="megaphone-outline" size={46} color={colors.text} />
        <Text style={{ color: colors.text, fontSize: 23, fontWeight: '500' }}>Telegram broadcasts</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>Open the bot to send announcements to your subscribers.</Text>
        <ProductButton label="Open in Telegram" icon="open-outline" onPress={handleOpenBot} />
      </View>
      {telegramUserId && <ProductRow title="Your Telegram account" detail={String(telegramUserId)} icon="person-outline" />}
    </View>
  );
};
