import React from 'react';
import { StyleSheet, Text, View, Pressable, Linking, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMContact, ContactStatus } from '../types';

interface LeadCardProps {
  lead: CRMContact;
  onPress: () => void;
  onQuickCall?: () => void;
  onQuickEmail?: () => void;
}

const STATUS_CONFIG: Partial<Record<ContactStatus, { label: string; bg: string; text: string; dot: string }>> = {
  lead: { label: 'New Lead', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', dot: '#3B82F6' },
  prospect: { label: 'Prospect', bg: 'rgba(245, 158, 11, 0.15)', text: '#D97706', dot: '#F59E0B' },
  customer: { label: 'Customer', bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', dot: '#10B981' },
  churned: { label: 'Churned', bg: 'rgba(239, 68, 68, 0.15)', text: '#DC2626', dot: '#EF4444' },
  open: { label: 'Open', bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', dot: '#3B82F6' },
  active: { label: 'Active', bg: 'rgba(16, 185, 129, 0.15)', text: '#059669', dot: '#10B981' },
  archived: { label: 'Archived', bg: 'rgba(156, 163, 175, 0.15)', text: '#6B7280', dot: '#6B7280' },
};

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onPress, onQuickCall, onQuickEmail }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const statusCfg = STATUS_CONFIG[lead.status] || {
    label: lead.status || 'Lead',
    bg: 'rgba(59, 130, 246, 0.15)',
    text: '#3B82F6',
    dot: '#3B82F6',
  };

  const handleCall = () => {
    if (onQuickCall) {
      onQuickCall();
    } else if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  };

  const handleEmail = () => {
    if (onQuickEmail) {
      onQuickEmail();
    } else if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        pressed && (isDark ? styles.cardPressedDark : styles.cardPressedLight),
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: isDark ? '#2B303C' : '#E2E8F0' }]}>
          <Text style={[styles.avatarText, { color: isDark ? '#F3F4F6' : '#1E293B' }]}>
            {(lead.first_name?.[0] || 'L').toUpperCase()}
            {(lead.last_name?.[0] || '').toUpperCase()}
          </Text>
        </View>

        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: isDark ? '#FFFFFF' : '#0F172A' }]} numberOfLines={1}>
            {lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed Lead'}
          </Text>
          {lead.company || lead.job_title ? (
            <Text style={[styles.company, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
              {[lead.job_title, lead.company].filter(Boolean).join(' • ')}
            </Text>
          ) : null}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
          <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
          <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Meta Row */}
      <View style={[styles.metaRow, { borderTopColor: isDark ? '#222630' : '#F1F5F9' }]}>
        {lead.phone ? (
          <View style={styles.metaItem}>
            <Ionicons name="call-outline" size={13} color={isDark ? '#9CA3AF' : '#64748B'} />
            <Text style={[styles.metaText, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
              {lead.phone}
            </Text>
          </View>
        ) : null}

        {lead.email ? (
          <View style={styles.metaItem}>
            <Ionicons name="mail-outline" size={13} color={isDark ? '#9CA3AF' : '#64748B'} />
            <Text style={[styles.metaText, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
              {lead.email}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Footer: Assignee & Action Buttons */}
      <View style={[styles.footer, { borderTopColor: isDark ? '#222630' : '#F1F5F9' }]}>
        <View style={styles.assigneeBlock}>
          <Ionicons name="person-circle-outline" size={16} color={isDark ? '#9CA3AF' : '#64748B'} />
          <Text style={[styles.assigneeText, { color: isDark ? '#9CA3AF' : '#64748B' }]} numberOfLines={1}>
            {lead.assignee?.name || 'Unassigned'}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {lead.phone ? (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={handleCall}
              hitSlop={8}
            >
              <Ionicons name="call" size={14} color="#10B981" />
            </Pressable>
          ) : null}
          {lead.email ? (
            <Pressable
              style={[styles.actionBtn, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}
              onPress={handleEmail}
              hitSlop={8}
            >
              <Ionicons name="mail" size={14} color="#3B82F6" />
            </Pressable>
          ) : null}
          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={16} color={isDark ? '#6B7280' : '#94A3B8'} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardPressedDark: {
    backgroundColor: '#20232B',
    borderColor: '#3B82F6',
  },
  cardPressedLight: {
    backgroundColor: '#F8FAFC',
    borderColor: '#3B82F6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  nameBlock: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  company: {
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  metaText: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  assigneeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  assigneeText: {
    fontSize: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    marginLeft: 4,
  },
});
