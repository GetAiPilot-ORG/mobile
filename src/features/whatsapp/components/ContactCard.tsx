import React from 'react';
import { Pressable, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { WhatsAppContact } from '../types';

interface ContactCardProps {
  contact: WhatsAppContact;
  onOpenCRM?: (contact: WhatsAppContact) => void;
  onOpenChat?: (contact: WhatsAppContact) => void;
}

export const ContactCard: React.FC<ContactCardProps> = ({
  contact,
  onOpenCRM,
  onOpenChat,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const hasCrmLead = !!contact.crm_lead_id;

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(contact.name || contact.phone || 'W')[0].toUpperCase()}
          </Text>
        </View>

        <View style={styles.details}>
          <Text style={[styles.name, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
            {contact.name || 'WhatsApp Contact'}
          </Text>
          <Text style={[styles.phone, { color: isDark ? '#94a3b8' : '#64748b' }]}>{contact.phone}</Text>
        </View>

        {onOpenChat ? (
          <Pressable
            style={[styles.chatButton, isDark ? styles.chatButtonDark : styles.chatButtonLight]}
            onPress={() => onOpenChat(contact)}
          >
            <Text style={styles.chatButtonText}>Chat 💬</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {contact.tags.map((tag) => (
            <View key={tag} style={[styles.tagBadge, isDark ? styles.tagBadgeDark : styles.tagBadgeLight]}>
              <Text style={[styles.tagText, { color: isDark ? '#a5b4fc' : '#4f46e5' }]}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* CRM Federation Status */}
      <View style={[styles.footerRow, isDark ? styles.borderDark : styles.borderLight]}>
        {hasCrmLead ? (
          <View style={styles.crmLinkedBadge}>
            <Text style={styles.crmLinkedText}>✓ CRM Deal Attached</Text>
          </View>
        ) : (
          <Pressable
            style={styles.crmLinkButton}
            onPress={() => onOpenCRM && onOpenCRM(contact)}
          >
            <Text style={styles.crmLinkButtonText}>+ Create CRM Lead</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25d366',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '800',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  phone: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  chatButton: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chatButtonDark: {
    backgroundColor: '#1e293b',
  },
  chatButtonLight: {
    backgroundColor: '#f1f5f9',
  },
  chatButtonText: {
    color: '#6366f1',
    fontSize: 12,
    fontWeight: '700',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  tagBadgeDark: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  tagBadgeLight: {
    backgroundColor: '#eef2ff',
    borderColor: '#c7d2fe',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  footerRow: {
    borderTopWidth: 1,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  borderDark: {
    borderTopColor: '#1e293b',
  },
  borderLight: {
    borderTopColor: '#e2e8f0',
  },
  crmLinkedBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  crmLinkedText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '700',
  },
  crmLinkButton: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  crmLinkButtonText: {
    color: '#6366f1',
    fontSize: 11,
    fontWeight: '700',
  },
});
