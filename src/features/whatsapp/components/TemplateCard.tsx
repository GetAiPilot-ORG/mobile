import React from 'react';
import { Text, View, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WhatsAppTemplate } from '../types';

interface TemplateCardProps {
  template: WhatsAppTemplate;
  onSelect?: (template: WhatsAppTemplate) => void;
  onPress?: (template: WhatsAppTemplate) => void;
}

function formatLanguage(lang?: string): string {
  if (!lang) return 'English (US)';
  const map: Record<string, string> = {
    en: 'English',
    en_US: 'English (US)',
    en_GB: 'English (UK)',
    hi: 'Hindi',
    es: 'Spanish',
    es_LA: 'Spanish (LATAM)',
    pt_BR: 'Portuguese (BR)',
    fr: 'French',
    de: 'German',
    ar: 'Arabic',
    id: 'Indonesian',
  };
  return map[lang] || lang;
}

function formatDate(template: WhatsAppTemplate): string {
  const rawDate = template.approved_at || template.submitted_at || template.updated_at || template.created_at;
  if (!rawDate) return 'Sep 9, 2026';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Sep 9, 2026';
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    const prefix = template.status === 'APPROVED' ? 'Approved' : template.status === 'PENDING' ? 'Submitted' : 'Updated';
    return `${prefix} ${month} ${day}, ${year}`;
  } catch {
    return 'Sep 9, 2026';
  }
}

export const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, onPress }) => {
  const isApproved = template.status === 'APPROVED';
  const isPending = template.status === 'PENDING';
  const isRejected = template.status === 'REJECTED';

  const category = (template.category || 'UTILITY').toUpperCase();
  const handlePress = onSelect ? () => onSelect(template) : onPress ? () => onPress(template) : undefined;

  // Category Icon & Accent Colors
  const getCategoryTheme = () => {
    switch (category) {
      case 'MARKETING':
        return {
          bg: 'bg-indigo-500/10',
          border: 'border-indigo-500/20',
          iconColor: '#818cf8',
          label: 'Marketing',
        };
      case 'AUTHENTICATION':
      case 'OTP':
        return {
          bg: 'bg-purple-500/10',
          border: 'border-purple-500/20',
          iconColor: '#c084fc',
          label: 'Authentication',
        };
      case 'UTILITY':
      default:
        return {
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/20',
          iconColor: '#25d366',
          label: 'Utility',
        };
    }
  };

  const theme = getCategoryTheme();

  // Parse Components
  const comps = Array.isArray(template.components) ? template.components : [];
  const headerComp = comps.find((c: any) => c.type === 'HEADER');
  const bodyComp = comps.find((c: any) => c.type === 'BODY');
  const footerComp = comps.find((c: any) => c.type === 'FOOTER');
  const buttonsComp = comps.find((c: any) => c.type === 'BUTTONS');

  const headerText = headerComp?.text || '';
  const bodyText = bodyComp?.text || 'Template content preview';
  const footerText = footerComp?.text || '';
  const buttons = Array.isArray(buttonsComp?.buttons) ? buttonsComp.buttons : [];

  // Split body text by variables {{1}}, {{2}}, etc.
  const renderBodyText = () => {
    const parts = String(bodyText).split(/(\{\{\d+\}\})/g);
    return (
      <Text className="text-xs leading-relaxed text-slate-200">
        {parts.map((part, index) => {
          if (/^\{\{\d+\}\}$/.test(part)) {
            return (
              <Text
                key={`${part}-${index}`}
                className="font-bold text-[#0084FF] bg-[#0084FF]/20 px-1 rounded"
              >
                {` ${part} `}
              </Text>
            );
          }
          return <Text key={index}>{part}</Text>;
        })}
      </Text>
    );
  };

  return (
    <Pressable
      className="bg-[#181A1F] border border-[#262930] rounded-2xl p-4 mb-3.5 active:bg-[#262930]"
      onPress={handlePress}
      disabled={!handlePress}
    >
      {/* 1. Header Row */}
      <View className="flex-row items-center mb-3">
        <View className={`w-10 h-10 rounded-xl border items-center justify-center mr-2.5 ${theme.bg} ${theme.border}`}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.iconColor} />
        </View>

        <View className="flex-1">
          <Text className="text-sm font-bold text-white mb-0.5" numberOfLines={1}>
            {template.name}
          </Text>
          <Text className="text-xs text-slate-400">
            {theme.label} • {formatLanguage(template.language)}
          </Text>
        </View>
      </View>

      {/* 2. Pending Alert if undergoing Meta verification */}
      {isPending && (
        <View className="flex-row items-center bg-amber-500/10 border border-amber-500/25 px-2.5 py-1.5 rounded-lg mb-2.5">
          <View className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-1.5" />
          <Text className="text-[11px] font-semibold text-amber-300">Meta review in progress</Text>
        </View>
      )}

      {/* 3. WhatsApp Mock Chat Canvas */}
      <View className="bg-[#111317] border border-[#262930] rounded-xl p-3 mb-3">
        {/* Chat Bubble */}
        <View className="bg-[#181A1F] border border-[#262930] rounded-xl p-3 pb-1.5">
          {/* Header */}
          {headerText ? (
            <View className="border-b border-[#262930] pb-1.5 mb-1.5">
              <Text className="text-xs font-bold text-white">{headerText}</Text>
            </View>
          ) : null}

          {/* Body Content */}
          <View className="mb-1">{renderBodyText()}</View>

          {/* Footer Text */}
          {footerText ? (
            <Text className="text-[10px] text-slate-400 mt-1">{footerText}</Text>
          ) : null}

          {/* Timestamp & Sky Blue Double Ticks */}
          <View className="flex-row items-center justify-end mt-1">
            <Text className="text-[9px] font-medium text-slate-500">10:38 AM</Text>
            <Ionicons
              name={isApproved ? 'checkmark-done' : 'checkmark'}
              size={13}
              color={isApproved ? '#38bdf8' : '#64748B'}
              style={{ marginLeft: 3 }}
            />
          </View>
        </View>

        {/* Action / CTA Buttons Below Bubble */}
        {buttons.length > 0 && (
          <View className="mt-2 gap-1.5">
            {buttons.slice(0, 2).map((btn: any, idx: number) => {
              const isUrl = btn.type === 'URL';
              const isPhone = btn.type === 'PHONE_NUMBER';
              return (
                <Pressable
                  key={idx}
                  className="flex-row items-center justify-center bg-[#181A1F] border border-[#262930] py-2 px-3 rounded-lg active:bg-[#262930]"
                  onPress={() => {
                    if (isUrl && btn.url) {
                      Linking.openURL(btn.url).catch(() => {});
                    } else if (isPhone && btn.phone_number) {
                      Linking.openURL(`tel:${btn.phone_number}`).catch(() => {});
                    }
                  }}
                >
                  <Ionicons
                    name={isUrl ? 'open-outline' : isPhone ? 'call-outline' : 'chatbubble-outline'}
                    size={13}
                    color="#0084FF"
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className="text-xs font-bold text-[#0084FF]"
                    numberOfLines={1}
                  >
                    {btn.text || 'Action'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* 4. Bottom Footer Status & Date */}
      <View className="flex-row items-center justify-between pt-0.5">
        <View className="flex-row items-center">
          <Ionicons name="calendar-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
          <Text className="text-[11px] font-medium text-slate-400">{formatDate(template)}</Text>
        </View>

        <View
          className={`flex-row items-center px-2 py-0.5 rounded-md border ${
            isApproved
              ? 'bg-emerald-500/10 border-emerald-500/20'
              : isPending
              ? 'bg-amber-500/10 border-amber-500/20'
              : 'bg-rose-500/10 border-rose-500/20'
          }`}
        >
          <Ionicons
            name={
              isApproved
                ? 'checkmark-circle'
                : isPending
                ? 'time-outline'
                : 'close-circle'
            }
            size={11}
            color={isApproved ? '#10B981' : isPending ? '#F59E0B' : '#EF4444'}
            style={{ marginRight: 4 }}
          />
          <Text
            className={`text-[11px] font-bold ${
              isApproved ? 'text-emerald-400' : isPending ? 'text-amber-400' : 'text-rose-400'
            }`}
          >
            {isApproved ? 'Approved' : isPending ? 'Pending' : isRejected ? 'Rejected' : (template.status || 'Approved')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
