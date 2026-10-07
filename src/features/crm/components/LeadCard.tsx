import React from 'react';
import { StyleSheet, Text, View, Pressable, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CRMContact, ContactStatus } from '../types';
import { useTheme, getColors } from '@/theme';

interface LeadCardProps {
  lead: CRMContact;
  onPress: () => void;
  onQuickCall?: () => void;
  onQuickWhatsApp?: () => void;
  onQuickEmail?: () => void;
  dealValue?: string | number;
}

const STATUS_CONFIG: Partial<Record<ContactStatus, { label: string; bg: string; text: string; dot: string }>> = {
  lead: { label: 'New Lead', bg: 'rgba(202, 191, 171, 0.22)', text: '#9B8F70', dot: '#CABFAB' },
  prospect: { label: 'Prospect', bg: 'rgba(184, 134, 59, 0.15)', text: '#B8863B', dot: '#B8863B' },
  customer: { label: 'Customer', bg: 'rgba(79, 138, 104, 0.15)', text: '#4F8A68', dot: '#4F8A68' },
  churned: { label: 'Churned', bg: 'rgba(184, 92, 92, 0.15)', text: '#B85C5C', dot: '#B85C5C' },
  open: { label: 'Open', bg: 'rgba(202, 191, 171, 0.22)', text: '#9B8F70', dot: '#CABFAB' },
  active: { label: 'Active', bg: 'rgba(79, 138, 104, 0.15)', text: '#4F8A68', dot: '#4F8A68' },
  archived: { label: 'Archived', bg: 'rgba(138, 141, 145, 0.15)', text: '#8A8D91', dot: '#8A8D91' },
};

export const LeadCard: React.FC<LeadCardProps> = ({
  lead,
  onPress,
  onQuickCall,
  onQuickWhatsApp,
  onQuickEmail,
  dealValue,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const statusCfg = STATUS_CONFIG[lead.status] || {
    label: lead.status || 'Lead',
    bg: 'rgba(202, 191, 171, 0.22)',
    text: '#9B8F70',
    dot: '#CABFAB',
  };

  const handleCall = () => {
    if (onQuickCall) {
      onQuickCall();
    } else if (lead.phone) {
      Linking.openURL(`tel:${lead.phone}`);
    }
  };

  const handleWhatsApp = () => {
    if (onQuickWhatsApp) {
      onQuickWhatsApp();
    } else if (lead.phone) {
      const cleanNumber = lead.phone.replace(/[^0-9+]/g, '');
      Linking.openURL(`https://wa.me/${cleanNumber.replace('+', '')}`).catch(() => {
        Linking.openURL(`whatsapp://send?phone=${cleanNumber}`);
      });
    }
  };

  const handleEmail = () => {
    if (onQuickEmail) {
      onQuickEmail();
    } else if (lead.email) {
      Linking.openURL(`mailto:${lead.email}`);
    }
  };

  // Format deal value display if provided or present on lead
  const formattedValue = dealValue != null
    ? typeof dealValue === 'number'
      ? dealValue >= 100000
        ? `₹${(dealValue / 100000).toFixed(1)}L`
        : `₹${dealValue.toLocaleString()}`
      : String(dealValue)
    : (lead as any).lead_value
      ? `₹${Number((lead as any).lead_value).toLocaleString()}`
      : null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed && { backgroundColor: colors.cardHover, borderColor: colors.primary },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.surfaceSecondary }]}>
          <Text style={[styles.avatarText, { color: colors.textPrimary }]}>
            {(lead.first_name?.[0] || lead.name?.[0] || 'L').toUpperCase()}
            {(lead.last_name?.[0] || '').toUpperCase()}
          </Text>
        </View>

        <View style={styles.nameBlock}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed Lead'}
          </Text>
          {lead.company || lead.job_title ? (
            <Text style={[styles.company, { color: colors.mutedText }]} numberOfLines={1}>
              {[lead.job_title, lead.company].filter(Boolean).join(' • ')}
            </Text>
          ) : null}
        </View>

        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          {formattedValue && (
            <View style={[styles.dealBadge, { backgroundColor: colors.warningSoft }]}>
              <Text style={styles.dealBadgeText}>{formattedValue}</Text>
            </View>
          )}
          <View style={[styles.statusBadge, { backgroundColor: statusCfg.bg }]}>
            <View style={[styles.statusDot, { backgroundColor: statusCfg.dot }]} />
            <Text style={[styles.statusText, { color: statusCfg.text }]}>{statusCfg.label}</Text>
          </View>
        </View>
      </View>

      {/* Meta Contact Information */}
      {(lead.phone || lead.email) ? (
        <View style={[styles.metaRow, { borderTopColor: colors.divider }]}>
          {lead.phone ? (
            <View style={styles.metaItem}>
              <Ionicons name="call-outline" size={13} color={colors.iconMuted} />
              <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
                {lead.phone}
              </Text>
            </View>
          ) : null}

          {lead.email ? (
            <View style={styles.metaItem}>
              <Ionicons name="mail-outline" size={13} color={colors.iconMuted} />
              <Text style={[styles.metaText, { color: colors.mutedText }]} numberOfLines={1}>
                {lead.email}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Footer: Assignee & 1-Tap Quick Touchpoints */}
      <View style={[styles.footer, { borderTopColor: colors.divider }]}>
        <View style={styles.assigneeBlock}>
          <Ionicons name="person-circle-outline" size={16} color={colors.iconMuted} />
          <Text style={[styles.assigneeText, { color: colors.mutedText }]} numberOfLines={1}>
            {lead.assignee?.name || 'Unassigned'}
          </Text>
        </View>

        <View style={styles.actionButtons}>
          {lead.phone ? (
            <Pressable
              style={[styles.touchpointBtn, { backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : '#DCFCE7' }]}
              onPress={handleWhatsApp}
              hitSlop={6}
            >
              <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
            </Pressable>
          ) : null}

          {lead.phone ? (
            <Pressable
              style={[styles.touchpointBtn, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5' }]}
              onPress={handleCall}
              hitSlop={6}
            >
              <Ionicons name="call" size={14} color="#10B981" />
            </Pressable>
          ) : null}

          {lead.email ? (
            <Pressable
              style={[styles.touchpointBtn, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE' }]}
              onPress={handleEmail}
              hitSlop={6}
            >
              <Ionicons name="mail" size={14} color="#3B82F6" />
            </Pressable>
          ) : null}

          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={16} color={colors.iconMuted} />
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
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
  dealBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dealBadgeText: {
    color: '#B8863B',
    fontSize: 11,
    fontWeight: '700',
  },
  touchpointBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
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
