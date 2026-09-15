
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CrmListSkeleton } from '../../../components/skeletonScreen';
import { useAuthStore } from '../../../core/store/authStore';
import { inboxApi } from '../../inbox/api/inboxApi';
import { ConversationScreen } from '../../inbox/screens/ConversationScreen';
import { NormalizedConversation } from '../../inbox/types';
import { ContactCard } from '../components/ContactCard';
import { useWhatsAppContacts } from '../hooks/useWhatsAppContacts';
import { WhatsAppContact } from '../types';

interface WhatsAppContactsScreenProps {
  onBack?: () => void;
  onOpenChat?: (contact: WhatsAppContact) => void;
}

export const WhatsAppContactsScreen: React.FC<WhatsAppContactsScreenProps> = ({
  onBack,
  onOpenChat,
}) => {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [activeConversation, setActiveConversation] = useState<NormalizedConversation | null>(null);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppContacts({
    search: searchQuery || undefined,
    tag: selectedTag,
    limit: 250,
  });

  const handleBack = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onBack) {
      onBack();
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/products/whatsapp');
    }
  };

  const handleOpenChat = async (contact: WhatsAppContact) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (onOpenChat) {
      onOpenChat(contact);
      return;
    }
    try {
      const res = await inboxApi.startConversation(contact.id);
      const conv: NormalizedConversation = {
        id: res.id,
        organization_id: user?.organizationId || '',
        contact: {
          name: contact.name || contact.phone,
          handle_or_phone: contact.phone || '',
        },
        channel: 'whatsapp',
        last_message: {
          content: 'Conversation started',
          created_at: new Date().toISOString(),
          direction: 'inbound',
        },
        unread_count: 0,
        status: 'active',
        bot_enabled: true,
      };
      setActiveConversation(conv);
    } catch {
      const conv: NormalizedConversation = {
        id: `conv_${contact.id}`,
        organization_id: user?.organizationId || '',
        contact: {
          name: contact.name || contact.phone,
          handle_or_phone: contact.phone || '',
        },
        channel: 'whatsapp',
        last_message: {
          content: 'Conversation started',
          created_at: new Date().toISOString(),
          direction: 'inbound',
        },
        unread_count: 0,
        status: 'active',
        bot_enabled: true,
      };
      setActiveConversation(conv);
    }
  };

  const tags = ['All', 'VIP', 'Enterprise', 'Lead', 'Retail', 'High-Value', 'Agency', 'Creator'];

  const contacts = data?.contacts || [];
  const totalCount = data?.total_count ?? contacts.length;

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      className="flex-1 bg-[#0B0D10]"
    >
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b border-[#262930] bg-[#181A1F]">
          <Pressable
            className="w-10 h-10 rounded-full bg-[#111317] border border-[#262930] items-center justify-center mr-3 active:opacity-70"
            onPress={handleBack}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color="#F8FAFC"
            />
          </Pressable>
          <Text className="text-lg font-bold text-white tracking-tight">
            WhatsApp Contacts
          </Text>
        </View>

        {/* Search Bar */}
        <View className="px-4 pt-3 pb-2 bg-[#181A1F]">
          <View className="flex-row items-center bg-[#111317] border border-[#262930] rounded-xl px-3 h-10">
            <Ionicons
              name="search"
              size={16}
              color="#94A3B8"
              style={{ marginRight: 8 }}
            />
            <TextInput
              className="flex-1 text-xs text-white"
              placeholder="Search contacts by name or phone..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <Ionicons name="close-circle" size={16} color="#94A3B8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Tag Filters */}
        <View className="py-2 mb-1 border-b border-[#262930] bg-[#111317]">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-4 gap-2"
          >
            {tags.map((item) => {
              const isSelected = item === 'All' ? !selectedTag : selectedTag === item;
              return (
                <Pressable
                  key={item}
                  className={`px-3.5 py-1.5 rounded-full border ${isSelected
                      ? 'bg-[#0084FF] border-[#0084FF]'
                      : 'bg-[#181A1F] border-[#262930] active:bg-[#262930]'
                    }`}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setSelectedTag(item === 'All' ? undefined : item);
                  }}
                >
                  <Text
                    className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-400'
                      }`}
                  >
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Contacts List */}
        {isLoading && !data ? (
          <CrmListSkeleton />
        ) : (
          <FlatList
            className="flex-1"
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactCard
                contact={item}
                onOpenChat={handleOpenChat}
              />
            )}
            contentContainerClassName="p-4 pb-32"
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0084FF" />
            }
            ListEmptyComponent={
              <View className="py-12 items-center">
                <Text className="text-xs text-slate-400">
                  No contacts found matching your query
                </Text>
              </View>
            }
          />
        )}

        {/* Fullscreen WhatsApp Conversation Modal */}
        <Modal
          visible={!!activeConversation}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setActiveConversation(null)}
        >
          {activeConversation && (
            <ConversationScreen
              conversation={activeConversation}
              onBack={() => setActiveConversation(null)}
            />
          )}
        </Modal>
      </View>
    </SafeAreaView>
  );
};
