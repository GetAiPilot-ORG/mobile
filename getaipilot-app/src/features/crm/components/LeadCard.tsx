import { useProductPalette } from "@/components/ProductUI";
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Linking,Pressable,Text,View } from 'react-native';
import { CRMContact,ContactStatus } from '../types';

interface LeadCardProps {
  lead: CRMContact;
  onPress: () => void;
  onQuickCall?: () => void;
  onQuickWhatsApp?: () => void;
  onQuickEmail?: () => void;
  dealValue?: string | number;
}

const STATUS_CONFIG: Partial<Record<ContactStatus, { label: string; bg: string; text: string; dot: string }>> = {
  lead: { label: 'New Lead', bg: 'rgba(202, 191, 171, 0.22)', text: '#9B8F70', dot: '#E7DEFA' },
  prospect: { label: 'Prospect', bg: 'rgba(184, 134, 59, 0.15)', text: '#B8863B', dot: '#B8863B' },
  customer: { label: 'Customer', bg: 'rgba(79, 138, 104, 0.15)', text: '#4F8A68', dot: '#4F8A68' },
  churned: { label: 'Churned', bg: 'rgba(184, 92, 92, 0.15)', text: '#B85C5C', dot: '#B85C5C' },
  open: { label: 'Open', bg: 'rgba(202, 191, 171, 0.22)', text: '#9B8F70', dot: '#E7DEFA' },
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
  const colors = useProductPalette();

  const statusCfg = STATUS_CONFIG[lead.status] || {
    label: lead.status || 'Lead',
    bg: 'rgba(202, 191, 171, 0.22)',
    text: '#9B8F70',
    dot: '#E7DEFA',
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

  const rawName = lead.name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed lead';
  const name = rawName.replace(/\s*-\s*$/, '').trim() || 'Unnamed lead';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={"Open " + name}
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border || 'transparent',
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        {/* Avatar */}
        <View
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: colors.peach,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>

        {/* Info Column */}
        <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
          {/* Name & Status Pill Row */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 14,
                color: colors.text,
                fontWeight: '600',
                flexShrink: 1,
              }}
            >
              {name}
            </Text>
            <View
              style={{
                backgroundColor: colors.lavender,
                borderRadius: 8,
                paddingHorizontal: 7,
                paddingVertical: 1.5,
              }}
            >
              <Text
                style={{
                  color: colors.text,
                  fontSize: 10,
                  fontWeight: '600',
                }}
              >
                {statusCfg.label}
              </Text>
            </View>
            {Boolean(formattedValue) ? (
              <Text
                style={{
                  color: colors.accent || colors.text,
                  fontSize: 11,
                  fontWeight: '700',
                  marginLeft: 'auto',
                }}
              >
                {formattedValue}
              </Text>
            ) : null}
          </View>

          {/* Subtitle: Phone / Email / Company */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
            {lead.phone ? (
              <Text
                numberOfLines={1}
                style={{ fontSize: 11, color: colors.textSecondary }}
              >
                {lead.phone}
              </Text>
            ) : null}
            {lead.email ? (
              <Text
                numberOfLines={1}
                style={{
                  fontSize: 11,
                  color: colors.textSecondary,
                  flex: 1,
                }}
              >
                {lead.email}
              </Text>
            ) : null}
            {!lead.phone && !lead.email && Boolean(lead.company) ? (
              <Text
                numberOfLines={1}
                style={{ fontSize: 11, color: colors.textSecondary }}
              >
                {lead.company}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Action Buttons (Compact 30x30 rounded badges) */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
          {lead.phone ? (
            <Pressable
              onPress={handleWhatsApp}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={"Message " + name}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.mint,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="logo-whatsapp" size={15} color={colors.text} />
            </Pressable>
          ) : null}
          {lead.phone ? (
            <Pressable
              onPress={handleCall}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={"Call " + name}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.lavender,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="call-outline" size={14} color={colors.text} />
            </Pressable>
          ) : null}
          {lead.email ? (
            <Pressable
              onPress={handleEmail}
              hitSlop={6}
              accessibilityRole="button"
              accessibilityLabel={"Email " + name}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: colors.peach,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="mail-outline" size={14} color={colors.text} />
            </Pressable>
          ) : null}
          <Ionicons name="chevron-forward" size={15} color={colors.iconSecondary || colors.textSecondary} />
        </View>
      </View>
    </Pressable>
  );
};
