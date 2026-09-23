import React from 'react';
import {
  Image,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { InstapilotConversation } from '../types';

interface InstapilotConversationModalProps {
  visible: boolean;
  conversation: InstapilotConversation | null;
  onClose: () => void;
}

export const InstapilotConversationModal: React.FC<InstapilotConversationModalProps> = ({
  visible,
  conversation,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!conversation) return null;

  const messages = conversation.instagram_messages || [];
  const lead = conversation.lead_data || {};
  const hasLead = Boolean(lead.email || lead.phone);
  const isBotActive = conversation.status === 'bot_active' && !conversation.bot_paused;

  const openInstagramProfile = () => {
    if (conversation.instagram_username) {
      Linking.openURL(`https://instagram.com/${conversation.instagram_username}`);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={[styles.modalCard, { backgroundColor: isDark ? '#0f172a' : '#ffffff' }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.profileRow}>
              {conversation.profile_pic_url ? (
                <Image
                  source={{ uri: conversation.profile_pic_url }}
                  style={styles.avatar}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Ionicons name="logo-instagram" size={24} color="#ffffff" />
                </View>
              )}

              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text
                    style={[styles.displayName, { color: isDark ? '#f8fafc' : '#0f172a' }]}
                    numberOfLines={1}
                  >
                    {conversation.instagram_name || conversation.instagram_username}
                  </Text>
                  <View
                    style={[
                      styles.botBadge,
                      { backgroundColor: isBotActive ? 'rgba(34, 197, 94, 0.15)' : 'rgba(234, 179, 8, 0.15)' },
                    ]}
                  >
                    <Ionicons
                      name={isBotActive ? 'hardware-chip' : 'pause-circle'}
                      size={11}
                      color={isBotActive ? '#22c55e' : '#eab308'}
                    />
                    <Text
                      style={[
                        styles.botBadgeText,
                        { color: isBotActive ? '#22c55e' : '#eab308' },
                      ]}
                    >
                      {isBotActive ? 'Bot Active' : 'Bot Paused'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.usernameText}>@{conversation.instagram_username}</Text>

                {/* Sub-badges: Followers & Follows */}
                <View style={styles.metaBadgesRow}>
                  <View style={styles.metaBadge}>
                    <Ionicons name="people-outline" size={11} color="#94a3b8" />
                    <Text style={styles.metaBadgeText}>
                      {conversation.follower_count ?? 0} followers
                    </Text>
                  </View>

                  {conversation.is_business_follow_user && (
                    <View style={[styles.metaBadge, { backgroundColor: 'rgba(225, 48, 108, 0.12)' }]}>
                      <Text style={[styles.metaBadgeText, { color: '#e1306c' }]}>Follows you</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <Pressable onPress={openInstagramProfile} style={styles.igProfileBtn}>
                <Ionicons name="logo-instagram" size={16} color="#e1306c" />
              </Pressable>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Ionicons name="close" size={20} color={isDark ? '#94a3b8' : '#64748b'} />
              </Pressable>
            </View>
          </View>

          <ScrollView style={styles.scrollBody} showsVerticalScrollIndicator={false}>
            {/* Captured Lead Dossier Card if present */}
            {hasLead && (
              <View
                style={[
                  styles.leadCard,
                  {
                    backgroundColor: isDark ? '#1e293b' : '#f0fdf4',
                    borderColor: isDark ? '#334155' : '#86efac',
                  },
                ]}
              >
                <View style={styles.leadHeader}>
                  <View style={styles.leadIconCircle}>
                    <Ionicons name="sparkles" size={14} color="#16a34a" />
                  </View>
                  <Text style={[styles.leadTitle, { color: isDark ? '#f8fafc' : '#166534' }]}>
                    Captured Lead Contact
                  </Text>
                </View>

                <View style={styles.leadFieldsList}>
                  {lead.email && (
                    <Pressable
                      onPress={() => Linking.openURL(`mailto:${lead.email}`)}
                      style={styles.leadItemRow}
                    >
                      <Ionicons name="mail" size={14} color="#3b82f6" />
                      <Text style={[styles.leadValue, { color: isDark ? '#93c5fd' : '#1d4ed8' }]}>
                        {lead.email}
                      </Text>
                    </Pressable>
                  )}
                  {lead.phone && (
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${lead.phone}`)}
                      style={styles.leadItemRow}
                    >
                      <Ionicons name="call" size={14} color="#10b981" />
                      <Text style={[styles.leadValue, { color: isDark ? '#86efac' : '#15803d' }]}>
                        {lead.phone}
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            )}

            {/* Conversation Messages Timeline */}
            <View style={styles.messagesSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={[styles.sectionTitle, { color: isDark ? '#cbd5e1' : '#475569' }]}>
                  Direct Messages History ({messages.length})
                </Text>
                {conversation.last_message_at && (
                  <Text style={styles.lastActiveText}>
                    Last: {new Date(conversation.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                )}
              </View>

              {messages.length === 0 ? (
                <View style={styles.emptyMessages}>
                  <Ionicons name="chatbubbles-outline" size={32} color="#94a3b8" />
                  <Text style={styles.emptyMessagesText}>No message history available.</Text>
                </View>
              ) : (
                <View style={styles.messagesList}>
                  {messages.map((msg, index) => {
                    const isInbound = msg.direction === 'inbound';
                    return (
                      <View
                        key={index}
                        style={[
                          styles.messageRow,
                          isInbound ? styles.messageRowInbound : styles.messageRowOutbound,
                        ]}
                      >
                        <View
                          style={[
                            styles.messageBubble,
                            isInbound
                              ? [
                                  styles.bubbleInbound,
                                  { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' },
                                ]
                              : styles.bubbleOutbound,
                          ]}
                        >
                          <Text
                            style={[
                              styles.messageText,
                              isInbound
                                ? { color: isDark ? '#f8fafc' : '#0f172a' }
                                : { color: '#ffffff' },
                            ]}
                          >
                            {msg.message_text}
                          </Text>
                          <Text
                            style={[
                              styles.messageTimestamp,
                              isInbound
                                ? { color: isDark ? '#94a3b8' : '#64748b' }
                                : { color: 'rgba(255, 255, 255, 0.75)' },
                            ]}
                          >
                            {msg.created_at
                              ? new Date(msg.created_at).toLocaleString([], {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : ''}
                          </Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}
            </View>

            {/* Conversation Telemetry Info */}
            <View style={[styles.metaCard, { backgroundColor: isDark ? '#1e293b' : '#f8fafc' }]}>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Conversation ID</Text>
                <Text style={styles.metaVal}>{conversation.id}</Text>
              </View>
              <View style={styles.metaRow}>
                <Text style={styles.metaLabel}>Instagram User ID</Text>
                <Text style={styles.metaVal}>{conversation.instagram_user_id || 'N/A'}</Text>
              </View>
              {conversation.created_at && (
                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Connected Since</Text>
                  <Text style={styles.metaVal}>
                    {new Date(conversation.created_at).toLocaleDateString([], {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Footer with Actions */}
          <View style={styles.modalFooter}>
            <Pressable
              onPress={openInstagramProfile}
              style={[styles.primaryActionBtn, { backgroundColor: '#e1306c' }]}
            >
              <Ionicons name="logo-instagram" size={16} color="#ffffff" />
              <Text style={styles.primaryActionBtnText}>Open on Instagram</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.dismissBtn}>
              <Text style={[styles.dismissBtnText, { color: isDark ? '#94a3b8' : '#64748b' }]}>
                Close
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(148, 163, 184, 0.15)',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e1306c',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  displayName: {
    fontSize: 16,
    fontWeight: '800',
  },
  botBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  botBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  usernameText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metaBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(148, 163, 184, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaBadgeText: {
    fontSize: 10,
    color: '#94a3b8',
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  igProfileBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(225, 48, 108, 0.1)',
  },
  closeBtn: {
    padding: 6,
  },
  scrollBody: {
    maxHeight: 460,
    marginTop: 14,
  },
  leadCard: {
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  leadHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(22, 163, 74, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  leadTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  leadFieldsList: {
    gap: 6,
  },
  leadItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  leadValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  messagesSection: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  lastActiveText: {
    fontSize: 11,
    color: '#94a3b8',
  },
  emptyMessages: {
    paddingVertical: 32,
    alignItems: 'center',
    gap: 8,
  },
  emptyMessagesText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  messagesList: {
    gap: 10,
  },
  messageRow: {
    flexDirection: 'row',
  },
  messageRowInbound: {
    justifyContent: 'flex-start',
  },
  messageRowOutbound: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '82%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    gap: 4,
  },
  bubbleInbound: {
    borderBottomLeftRadius: 4,
  },
  bubbleOutbound: {
    backgroundColor: '#ec4899',
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTimestamp: {
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  metaCard: {
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  metaVal: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(148, 163, 184, 0.15)',
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  dismissBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dismissBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
