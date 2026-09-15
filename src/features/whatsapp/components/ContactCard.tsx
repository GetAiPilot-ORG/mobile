import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const initial = (contact.name || contact.phone || 'W').charAt(0).toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        pressed && styles.cardPressed,
      ]}
      onPress={() => onOpenChat && onOpenChat(contact)}
    >
      <View style={styles.headerRow}>
        {/* iOS Refined Initials Avatar */}
        <View style={[styles.avatar, isDark ? styles.avatarDark : styles.avatarLight]}>
          <Text style={[styles.avatarText, isDark ? styles.avatarTextDark : styles.avatarTextLight]}>
            {initial}
          </Text>
        </View>

        <View style={styles.details}>
          <Text
            style={[styles.name, isDark ? styles.textPrimaryDark : styles.textPrimaryLight]}
            numberOfLines={1}
          >
            {contact.name || 'WhatsApp Contact'}
          </Text>
          <Text style={[styles.phone, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
            {contact.phone}
          </Text>
        </View>

        {onOpenChat ? (
          <View style={[styles.chatButton, isDark ? styles.chatButtonDark : styles.chatButtonLight]}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={15}
              color={isDark ? '#0A84FF' : '#007AFF'}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.chatButtonText, isDark ? styles.chatTextDark : styles.chatTextLight]}>
              Chat
            </Text>
          </View>
        ) : null}
      </View>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {contact.tags.map((tag) => (
            <View key={tag} style={[styles.tagBadge, isDark ? styles.tagBadgeDark : styles.tagBadgeLight]}>
              <Text style={[styles.tagText, isDark ? styles.tagTextDark : styles.tagTextLight]}>
                {tag}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 10,
  },
  cardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
  cardDark: {
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
  },
  avatarLight: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
  },
  avatarTextDark: {
    color: '#0A84FF',
  },
  avatarTextLight: {
    color: '#007AFF',
  },
  details: {
    flex: 1,
    justifyContent: 'center',
    marginRight: 8,
  },
  name: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.1,
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  chatButtonDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.15)',
  },
  chatButtonLight: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  chatButtonText: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  chatTextDark: {
    color: '#0A84FF',
  },
  chatTextLight: {
    color: '#007AFF',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginLeft: 54, // Align neatly with contact text after avatar
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagBadgeLight: {
    backgroundColor: '#F2F2F7',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  tagTextDark: {
    color: '#94A3B8',
  },
  tagTextLight: {
    color: '#64748B',
  },
  textPrimaryDark: {
    color: '#F8FAFC',
  },
  textPrimaryLight: {
    color: '#0F172A',
  },
  textSecondaryDark: {
    color: '#8E8E93',
  },
  textSecondaryLight: {
    color: '#64748B',
  },
});
