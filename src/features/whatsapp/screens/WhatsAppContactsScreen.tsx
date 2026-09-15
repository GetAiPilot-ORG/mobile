import React, { useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '../../../core/store/authStore';
import { inboxApi } from '../../inbox/api/inboxApi';
import { ConversationScreen } from '../../inbox/screens/ConversationScreen';
import { NormalizedConversation } from '../../inbox/types';
import { ContactCard } from '../components/ContactCard';
import { useWhatsAppContacts } from '../hooks/useWhatsAppContacts';
import { WhatsAppContact } from '../types';
import { CrmListSkeleton } from '../../../components/skeletonScreen';

interface WhatsAppContactsScreenProps {
  onBack?: () => void;
  onOpenChat?: (contact: WhatsAppContact) => void;
}

export const WhatsAppContactsScreen: React.FC<WhatsAppContactsScreenProps> = ({
  onBack,
  onOpenChat,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const user = useAuthStore((s) => s.user);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | undefined>(undefined);
  const [activeConversation, setActiveConversation] = useState<NormalizedConversation | null>(null);

  const { data, isLoading, refetch, isRefetching } = useWhatsAppContacts({
    search: searchQuery || undefined,
    tag: selectedTag,
  });

  const handleOpenChat = async (contact: WhatsAppContact) => {
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

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
      <View style={styles.container}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          {onBack ? (
            <Pressable
              style={[styles.backButton, isDark ? styles.backButtonDark : styles.backButtonLight]}
              onPress={onBack}
            >
              <Text style={styles.backText}>← Back</Text>
            </Pressable>
          ) : null}
          <View>
            <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>WhatsApp Contacts</Text>
            <Text style={[styles.subtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
              Audience & Customer Directory
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, isDark ? styles.searchInputDark : styles.searchInputLight]}
            placeholder="Search contacts by name or phone..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Tag Filters */}
        <View style={styles.tagWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagList}
          >
            {tags.map((item) => {
              const isSelected = item === 'All' ? !selectedTag : selectedTag === item;
              return (
                <Pressable
                  key={item}
                  style={[
                    styles.tagChip,
                    isDark ? styles.tagChipDark : styles.tagChipLight,
                    isSelected && styles.tagChipActive,
                  ]}
                  onPress={() => setSelectedTag(item === 'All' ? undefined : item)}
                >
                  <Text
                    style={[
                      styles.tagChipText,
                      { color: isSelected ? '#020617' : isDark ? '#94a3b8' : '#64748b' },
                      isSelected && styles.tagChipTextActive,
                    ]}
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
            style={styles.contactsFlatList}
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactCard
                contact={item}
                onOpenChat={handleOpenChat}
              />
            )}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#25d366" />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: isDark ? '#64748b' : '#94a3b8' }]}>
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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerDark: {
    borderBottomColor: '#1e293b',
  },
  headerLight: {
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  backButtonDark: {
    backgroundColor: '#1e293b',
  },
  backButtonLight: {
    backgroundColor: '#e2e8f0',
  },
  backText: {
    color: '#6366f1',
    fontSize: 13,
    fontWeight: '700',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  searchInput: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    borderWidth: 1,
  },
  searchInputDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
    color: '#f8fafc',
  },
  searchInputLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    color: '#0f172a',
  },
  tagWrapper: {
    height: 44,
    minHeight: 44,
    maxHeight: 44,
    flexShrink: 0,
    flexGrow: 0,
    justifyContent: 'center',
    marginBottom: 6,
  },
  tagList: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagChipDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  tagChipLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  tagChipActive: {
    backgroundColor: '#25d366',
    borderColor: '#25d366',
  },
  tagChipText: {
    fontSize: 12.5,
    fontWeight: '600',
    lineHeight: 16,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  tagChipTextActive: {
    color: '#020617',
    fontWeight: '800',
  },
  contactsFlatList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 130,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: 10,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
});
