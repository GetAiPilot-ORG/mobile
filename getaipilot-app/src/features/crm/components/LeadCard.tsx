import React from 'react';
import { Text, View, Pressable, Linking } from 'react-native';
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
      className="rounded-2xl p-4 mb-3 border shadow-sm shadow-black/5 active:opacity-90"
      style={({ pressed }) => [
        { backgroundColor: colors.card, borderColor: colors.cardBorder },
        pressed && { backgroundColor: colors.cardHover, borderColor: colors.primary },
      ]}
      onPress={onPress}
    >
      <View className="flex-row items-center mb-2.5">
        <View
          className="w-10 h-10 rounded-xl items-center justify-center mr-3"
          style={{ backgroundColor: colors.surfaceSecondary }}
        >
          <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>
            {(lead.first_name?.[0] || lead.name?.[0] || 'L').toUpperCase()}
            {(lead.last_name?.[0] || '').toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 mr-2 min-w-0">
          <Text
            className="text-base font-semibold tracking-tight"
            style={{ color: colors.text }}
            numberOfLines={1}
          >
            {lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim() || 'Unnamed Lead'}
          </Text>
          {lead.company || lead.job_title ? (
            <Text
              className="text-xs mt-0.5"
              style={{ color: colors.mutedText }}
              numberOfLines={1}
            >
              {[lead.job_title, lead.company].filter(Boolean).join(' • ')}
            </Text>
          ) : null}
        </View>

        <View className="items-end gap-1">
          {formattedValue && (
            <View className="px-2 py-0.5 rounded-md" style={{ backgroundColor: colors.warningSoft }}>
              <Text className="text-[#B8863B] text-[11px] font-bold">{formattedValue}</Text>
            </View>
          )}
          <View
            className="flex-row items-center gap-1.5 px-2 py-1 rounded-lg"
            style={{ backgroundColor: statusCfg.bg }}
          >
            <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusCfg.dot }} />
            <Text className="text-[11px] font-semibold" style={{ color: statusCfg.text }}>
              {statusCfg.label}
            </Text>
          </View>
        </View>
      </View>

      {/* Meta Contact Information */}
      {(lead.phone || lead.email) ? (
        <View
          className="flex-row flex-wrap gap-3 py-1.5 border-t"
          style={{ borderTopColor: colors.divider }}
        >
          {lead.phone ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="call-outline" size={13} color={colors.iconMuted} />
              <Text className="text-xs" style={{ color: colors.mutedText }} numberOfLines={1}>
                {lead.phone}
              </Text>
            </View>
          ) : null}

          {lead.email ? (
            <View className="flex-row items-center gap-1.5">
              <Ionicons name="mail-outline" size={13} color={colors.iconMuted} />
              <Text className="text-xs" style={{ color: colors.mutedText }} numberOfLines={1}>
                {lead.email}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Footer: Assignee & 1-Tap Quick Touchpoints */}
      <View
        className="flex-row items-center justify-between pt-2 border-t"
        style={{ borderTopColor: colors.divider }}
      >
        <View className="flex-row items-center gap-1.5 flex-1 min-w-0">
          <Ionicons name="person-circle-outline" size={16} color={colors.iconMuted} />
          <Text className="text-xs" style={{ color: colors.mutedText }} numberOfLines={1}>
            {lead.assignee?.name || 'Unassigned'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          {lead.phone ? (
            <Pressable
              className="w-8 h-8 rounded-lg items-center justify-center active:opacity-75"
              style={{ backgroundColor: isDark ? 'rgba(37, 211, 102, 0.15)' : '#DCFCE7' }}
              onPress={handleWhatsApp}
              hitSlop={6}
            >
              <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
            </Pressable>
          ) : null}

          {lead.phone ? (
            <Pressable
              className="w-8 h-8 rounded-lg items-center justify-center active:opacity-75"
              style={{ backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#D1FAE5' }}
              onPress={handleCall}
              hitSlop={6}
            >
              <Ionicons name="call" size={14} color="#10B981" />
            </Pressable>
          ) : null}

          {lead.email ? (
            <Pressable
              className="w-8 h-8 rounded-lg items-center justify-center active:opacity-75"
              style={{ backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#DBEAFE' }}
              onPress={handleEmail}
              hitSlop={6}
            >
              <Ionicons name="mail" size={14} color="#3B82F6" />
            </Pressable>
          ) : null}

          <View className="ml-1">
            <Ionicons name="chevron-forward" size={16} color={colors.iconMuted} />
          </View>
        </View>
      </View>
    </Pressable>
  );
};
