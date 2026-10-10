import React from 'react';
import { Text, View, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/theme';
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
  const { isDark } = useTheme();

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
          bg: isDark ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.1)',
          border: isDark ? 'rgba(99, 102, 241, 0.3)' : 'rgba(99, 102, 241, 0.2)',
          iconColor: isDark ? '#818cf8' : '#4f46e5',
          label: 'Marketing',
        };
      case 'AUTHENTICATION':
      case 'OTP':
        return {
          bg: isDark ? 'rgba(168, 85, 247, 0.15)' : 'rgba(168, 85, 247, 0.1)',
          border: isDark ? 'rgba(168, 85, 247, 0.3)' : 'rgba(168, 85, 247, 0.2)',
          iconColor: isDark ? '#c084fc' : '#9333ea',
          label: 'Authentication',
        };
      case 'UTILITY':
      default:
        return {
          bg: isDark ? 'rgba(37, 211, 102, 0.15)' : 'rgba(37, 211, 102, 0.12)',
          border: isDark ? 'rgba(37, 211, 102, 0.3)' : 'rgba(37, 211, 102, 0.25)',
          iconColor: isDark ? '#25d366' : '#16a34a',
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
      <Text className={`text-xs leading-[18px] font-normal ${isDark ? 'text-[#e9edef]' : 'text-[#111b21]'}`}>
        {parts.map((part, index) => {
          if (/^\{\{\d+\}\}$/.test(part)) {
            return (
              <Text
                key={`${part}-${index}`}
                className="font-bold text-[11px] rounded px-0.5"
                style={{
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
                  backgroundColor: isDark ? 'rgba(0, 168, 132, 0.2)' : 'rgba(0, 168, 132, 0.12)',
                  color: isDark ? '#25d366' : '#008069',
                }}
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
      className={`w-full rounded-2xl p-3.5 border mb-3.5 shadow-sm active:opacity-85 ${
        isDark ? 'bg-[#0f172a] border-[#1e293b]' : 'bg-white border-[#e2e8f0]'
      }`}
      onPress={handlePress}
      disabled={!handlePress}
    >
      {/* 1. Header Row */}
      <View className="flex-row items-center mb-3">
        <View
          className="w-10 h-10 rounded-xl border items-center justify-center mr-2.5"
          style={{ backgroundColor: theme.bg, borderColor: theme.border }}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.iconColor} />
        </View>

        <View className="flex-1">
          <Text
            className={`text-sm font-bold mb-0.5 ${
              isDark ? 'text-[#f8fafc]' : 'text-[#0f172a]'
            }`}
            numberOfLines={1}
          >
            {template.name}
          </Text>
          <Text
            className={`text-[11px] font-medium ${
              isDark ? 'text-[#94a3b8]' : 'text-[#64748b]'
            }`}
          >
            {theme.label} • {formatLanguage(template.language)}
          </Text>
        </View>
      </View>

      {/* 2. Pending Alert if undergoing Meta verification */}
      {isPending && (
        <View className="flex-row items-center bg-amber-500/15 border border-amber-500/25 px-2.5 py-1 rounded-lg mb-2.5">
          <View className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5" />
          <Text className="text-[10.5px] font-semibold text-amber-400">Meta review in progress</Text>
        </View>
      )}

      {/* 3. WhatsApp Mock Chat Wallpaper Canvas */}
      <View
        className={`rounded-xl p-3 border mb-3 relative overflow-hidden ${
          isDark
            ? 'bg-[#0b141a] border-[#1e293b]'
            : 'bg-[#efeae2] border-[#e2e8f0]'
        }`}
      >
        {/* WhatsApp Chat Bubble */}
        <View
          className={`rounded-xl p-3 pb-1.5 border shadow-sm ${
            isDark
              ? 'bg-[#1f2c34] border-[#2a3942]'
              : 'bg-white border-[#e2e8f0]'
          }`}
        >
          {/* Header */}
          {headerText ? (
            <View
              className={`border-b pb-1.5 mb-1.5 ${
                isDark ? 'border-[#2a3942]' : 'border-slate-100'
              }`}
            >
              <Text
                className={`text-[12.5px] font-extrabold ${
                  isDark ? 'text-[#e9edef]' : 'text-[#111b21]'
                }`}
              >
                {headerText}
              </Text>
            </View>
          ) : null}

          {/* Body Content with Variable Badges */}
          <View className="mb-1">{renderBodyText()}</View>

          {/* Footer Text */}
          {footerText ? (
            <Text
              className={`text-[9.5px] mt-1 ${
                isDark ? 'text-[#8696a0]' : 'text-[#667781]'
              }`}
            >
              {footerText}
            </Text>
          ) : null}

          {/* Timestamp & Sky Blue Double Ticks */}
          <View className="flex-row items-center justify-end mt-1">
            <Text
              className={`text-[9px] font-medium ${
                isDark ? 'text-[#8696a0]' : 'text-[#667781]'
              }`}
            >
              10:38 AM
            </Text>
            <Ionicons
              name={isApproved ? 'checkmark-done' : 'checkmark'}
              size={13}
              color={isApproved ? '#38bdf8' : isDark ? '#8696a0' : '#94a3b8'}
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
                  className={`flex-row items-center justify-center border rounded-lg py-1.5 px-3 shadow-xs ${
                    isDark
                      ? 'bg-[#182229] border-[#2a3942]'
                      : 'bg-white border-[#e2e8f0]'
                  }`}
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
                    color={isDark ? '#38bdf8' : '#0284c7'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className={`text-[11.5px] font-bold ${
                      isDark ? 'text-[#38bdf8]' : 'text-[#0284c7]'
                    }`}
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
          <Ionicons name="calendar-outline" size={13} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginRight: 4 }} />
          <Text className="text-[11px] font-medium text-slate-500">{formatDate(template)}</Text>
        </View>

        <View
          className={`flex-row items-center px-2 py-0.5 rounded-md border ${
            isApproved
              ? 'bg-emerald-500/15 border-emerald-500/25'
              : isPending
              ? 'bg-amber-500/15 border-amber-500/25'
              : 'bg-red-500/15 border-red-500/25'
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
            color={isApproved ? '#25d366' : isPending ? '#fbbf24' : '#f87171'}
            style={{ marginRight: 4 }}
          />
          <Text
            className="text-[11px] font-semibold"
            style={{ color: isApproved ? '#25d366' : isPending ? '#fbbf24' : '#f87171' }}
          >
            {isApproved ? 'Approved' : isPending ? 'Pending' : isRejected ? 'Rejected' : (template.status || 'Approved')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};
