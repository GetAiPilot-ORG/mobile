import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WhatsAppContact } from '../types';

interface ContactCardProps {
  contact: WhatsAppContact;
  onOpenChat?: (contact: WhatsAppContact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onOpenChat,
}) => {
  const initial = (contact.name || contact.phone || 'W').charAt(0).toUpperCase();

  return (
    <Pressable
      className="bg-[#181A1F] border border-[#262930] rounded-2xl p-3.5 mb-2.5 active:bg-[#262930]"
      onPress={() => onOpenChat && onOpenChat(contact)}
    >
      <View className="flex-row items-center">
        {/* Refined Initials Avatar */}
        <View className="w-10 h-10 rounded-full bg-[#0084FF]/15 items-center justify-center mr-3">
          <Text className="text-base font-bold text-[#0084FF]">
            {initial}
          </Text>
        </View>

        <View className="flex-1 justify-center mr-2">
          <Text
            className="text-sm font-bold text-white mb-0.5"
            numberOfLines={1}
          >
            {contact.name || 'WhatsApp Contact'}
          </Text>
          <Text className="text-xs text-slate-400">
            {contact.phone}
          </Text>
        </View>

        {onOpenChat ? (
          <View className="flex-row items-center bg-[#0084FF]/15 px-3 py-1.5 rounded-full">
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={14}
              color="#0084FF"
              style={{ marginRight: 4 }}
            />
            <Text className="text-xs font-bold text-[#0084FF]">
              Chat
            </Text>
          </View>
        ) : null}
      </View>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5 mt-2.5 ml-13">
          {contact.tags.map((tag) => (
            <View key={tag} className="bg-[#111317] border border-[#262930] px-2 py-0.5 rounded-md">
              <Text className="text-[10px] font-semibold text-slate-300">
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
};
