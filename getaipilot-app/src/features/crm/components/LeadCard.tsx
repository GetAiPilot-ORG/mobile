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

  const name = lead.name || [lead.first_name, lead.last_name].filter(Boolean).join(' ') || 'Unnamed lead';
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 14, gap: 16 }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={"Open " + name} style={{ flexDirection: 'row', gap: 14, alignItems: 'center' }}>
        <View style={{ width: 46, height: 46, borderRadius: 18, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}><Text style={{ fontSize: 18, color: colors.text }}>{name.charAt(0).toUpperCase()}</Text></View>
        <View style={{ flex: 1, gap: 5 }}><Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{name}</Text>{lead.company && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{lead.company}</Text>}</View>
        <Ionicons name="chevron-forward" size={17} color={colors.iconSecondary} />
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <View style={{ backgroundColor: colors.lavender, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 }}><Text style={{ color: colors.text, fontSize: 12 }}>{statusCfg.label}</Text></View>
        {formattedValue && <Text style={{ color: colors.text, fontSize: 13 }}>{formattedValue}</Text>}
        {lead.assignee?.name && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{lead.assignee.name}</Text>}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 4 }}>
          {lead.phone && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{lead.phone}</Text>}
          {lead.email && <Text numberOfLines={1} style={{ fontSize: 12, color: colors.textSecondary }}>{lead.email}</Text>}
        </View>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {lead.phone && <Pressable onPress={handleWhatsApp} accessibilityRole="button" accessibilityLabel={"Message " + name} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.mint, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="logo-whatsapp" size={19} color={colors.text} /></Pressable>}
          {lead.phone && <Pressable onPress={handleCall} accessibilityRole="button" accessibilityLabel={"Call " + name} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.lavender, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="call-outline" size={19} color={colors.text} /></Pressable>}
          {lead.email && <Pressable onPress={handleEmail} accessibilityRole="button" accessibilityLabel={"Email " + name} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.peach, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="mail-outline" size={19} color={colors.text} /></Pressable>}
        </View>
      </View>
    </View>
  );
};
