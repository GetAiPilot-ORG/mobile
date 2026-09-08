import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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
  const hasCrmLead = !!contact.crm_lead_id;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(contact.name || contact.phone || 'W')[0].toUpperCase()}
          </Text>
        </View>

        <View style={styles.details}>
          <Text style={styles.name} numberOfLines={1}>
            {contact.name || 'WhatsApp Contact'}
          </Text>
          <Text style={styles.phone}>{contact.phone}</Text>
        </View>

        {onOpenChat ? (
          <Pressable style={styles.chatButton} onPress={() => onOpenChat(contact)}>
            <Text style={styles.chatButtonText}>Chat 💬</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Tags */}
      {contact.tags && contact.tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {contact.tags.map((tag) => (
            <View key={tag} style={styles.tagBadge}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* CRM Federation Status */}
      <View style={styles.footerRow}>
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
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 10,
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
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  phone: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  chatButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  chatButtonText: {
    color: '#818cf8',
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
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.25)',
  },
  tagText: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '600',
  },
  footerRow: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#6366f1',
  },
  crmLinkButtonText: {
    color: '#818cf8',
    fontSize: 11,
    fontWeight: '700',
  },
});
