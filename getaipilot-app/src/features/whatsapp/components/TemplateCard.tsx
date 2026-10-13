import React from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { ProductButton, useProductPalette } from '@/components/ProductUI';
import { WhatsAppTemplate } from '../types';

interface TemplateCardProps {
  template: WhatsAppTemplate; onSelect?: (template: WhatsAppTemplate) => void;
  onPress?: (template: WhatsAppTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, onPress }) => {
  const colors = useProductPalette();
  const select = onSelect || onPress;
  const components = Array.isArray(template.components) ? template.components : [];
  const header = components.find((component) => component.type === 'HEADER')?.text;
  const body = components.find((component) => component.type === 'BODY')?.text;
  const footer = components.find((component) => component.type === 'FOOTER')?.text;
  const buttons = components.find((component) => component.type === 'BUTTONS')?.buttons || [];
  return <Pressable cssInterop={false} disabled={!select} onPress={() => select?.(template)} accessibilityRole={select ? 'button' : undefined} accessibilityLabel={template.name}
    style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: 24, padding: 20, marginBottom: 16, gap: 14, opacity: pressed ? 0.75 : 1 })}>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
      <View style={{ flex: 1, gap: 6 }}><Text style={{ fontSize: 16, fontWeight: '500', color: colors.text }}>{template.name.replace(/_/g, ' ')}</Text><Text style={{ fontSize: 12, color: colors.textSecondary }}>{template.category.toLowerCase()} · {template.language}</Text></View>
      <View style={{ borderRadius: 18, paddingHorizontal: 10, paddingVertical: 6, backgroundColor: template.status === 'APPROVED' ? colors.mint : template.status === 'REJECTED' ? colors.pink : colors.peach }}><Text style={{ fontSize: 11, color: colors.text }}>{template.status.charAt(0) + template.status.slice(1).toLowerCase()}</Text></View>
    </View>
    <View style={{ backgroundColor: colors.surfaceSecondary, padding: 18, borderRadius: 18, gap: 8 }}>
      {header && <Text style={{ fontSize: 14, fontWeight: '500', color: colors.text }}>{header}</Text>}
      <Text style={{ fontSize: 14, lineHeight: 21, color: colors.text }}>{body || 'No message preview available'}</Text>
      {footer && <Text style={{ fontSize: 12, color: colors.textSecondary }}>{footer}</Text>}
    </View>
    {buttons.slice(0, 2).map((button: any, index: number) =>
      <ProductButton key={index} label={button.text || 'Action'} secondary
        onPress={() => { if (button.type === 'URL' && button.url) Linking.openURL(button.url).catch(() => {}); else if (button.type === 'PHONE_NUMBER' && button.phone_number) Linking.openURL('tel:' + button.phone_number).catch(() => {}); }}
        disabled={!((button.type === 'URL' && button.url) || (button.type === 'PHONE_NUMBER' && button.phone_number))} />)}
    {template.rejection_reason && <Text style={{ fontSize: 12, lineHeight: 18, color: colors.destructive }}>{template.rejection_reason}</Text>}
  </Pressable>;
};
