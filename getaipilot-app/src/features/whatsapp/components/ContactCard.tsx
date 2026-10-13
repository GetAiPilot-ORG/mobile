import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
import { WhatsAppContact } from '../types';

interface ContactCardProps {
  contact: WhatsAppContact;
  onOpenChat?: (contact: WhatsAppContact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onOpenChat,
}) => {
  const { isDark } = useTheme();

  const initial = (contact.name || contact.phone || 'W').charAt(0).toUpperCase();

  return (
    <Pressable
      className={`w-full rounded-2xl p-3.5 mb-2.5 active:opacity-75 active:scale-[0.99] shadow-sm ${
        isDark ? 'bg-[#1C1C1E]' : 'bg-white'
      }`}
      style={{
        borderWidth: 0,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.25 : 0.05,
        shadowRadius: 4,
      }}
      onPress={() => onOpenChat && onOpenChat(contact)}
    >
      <View className="flex-row items-center">
        {/* Initials Avatar with WhatsApp theme */}
        <View
          className={`w-10 h-10 rounded-full justify-center items-center mr-3 ${
            isDark ? 'bg-[#25D366]/20' : 'bg-[#25D366]/12'
          }`}
        >
          <Text
            className={`text-base font-bold ${
              isDark ? 'text-[#25D366]' : 'text-[#075E54]'
            }`}
          >
            {initial}
          </Text>
        </View>

        <View className="flex-1 justify-center mr-2">
          <Text
            className={`text-[15px] font-bold tracking-tight mb-0.5 ${
              isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'
            }`}
            numberOfLines={1}
          >
            {contact.name || 'WhatsApp Contact'}
          </Text>
          <Text
            className={`text-xs font-normal tracking-tight ${
              isDark ? 'text-[#8E8E93]' : 'text-[#64748B]'
            }`}
          >
            {contact.phone}
          </Text>
        </View>

        {onOpenChat ? (
          <View
            className={`flex-row items-center px-3 py-1.5 rounded-full ${
              isDark ? 'bg-[#25D366]/20' : 'bg-[#25D366]/12'
            }`}
          >
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={15}
              color={isDark ? '#25D366' : '#075E54'}
              style={{ marginRight: 4 }}
            />
            <Text
              className={`text-xs font-semibold ${
                isDark ? 'text-[#25D366]' : 'text-[#075E54]'
              }`}
            >
              Chat
            </Text>
          </View>
        ) : null}
      </View>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5 mt-2.5 ml-13">
          {contact.tags.map((tag) => (
            <View
              key={tag}
              className={`px-2 py-0.5 rounded-md ${
                isDark ? 'bg-white/[0.08]' : 'bg-[#F2F2F7]'
              }`}
            >
              <Text
                className={`text-[11px] font-semibold ${
                  isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
                }`}
              >
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
};
