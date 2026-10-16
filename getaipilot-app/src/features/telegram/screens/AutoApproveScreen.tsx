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
  summary?: any;
  onOpenModal?: (key: TelegramToolKey) => void;
}

export const AutoApproveScreen: React.FC<Props> = () => {
  const colors = useProductPalette();
  const user = useAuthStore((s) => s.user);

  const telegramUserId =
    (user as any)?.telegram_user_id ||
    (user as any)?.user_metadata?.telegram_user_id ||
    null;

  const handleConnect = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const url = 'https://t.me/Gapautoapprovebot?start=true';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL('https://t.me/Gapautoapprovebot?start=true');
      }
    } catch {
      await Linking.openURL('https://t.me/Gapautoapprovebot?start=true');
    }
  };

  return (
    <View>
      <ProductHeading title="Welcome people in" />
      <View style={{ backgroundColor: colors.mint, borderRadius: 26, padding: 26, gap: 22, marginBottom: 26 }}>
        <Ionicons name="checkmark-done-outline" size={46} color={colors.text} />
        <Text style={{ color: colors.text, fontSize: 23, fontWeight: '500' }}>Auto approve</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 22 }}>Add the bot as a channel administrator to approve join requests automatically.</Text>
        <ProductButton label="Open in Telegram" icon="open-outline" onPress={handleConnect} />
      </View>
      {telegramUserId && <ProductRow title="Your Telegram account" detail={String(telegramUserId)} icon="person-outline" />}
    </View>
  );
};
