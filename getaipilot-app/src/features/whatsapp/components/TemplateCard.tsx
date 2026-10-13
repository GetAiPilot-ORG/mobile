import React, { useState } from 'react';
import { Text, View, Pressable, Linking, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';
import { WhatsAppTemplate } from '../types';

export interface TemplateCardProps {
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
  const rawDate =
    template.approved_at ||
    template.submitted_at ||
    template.updated_at ||
    template.created_at;
  if (!rawDate) return 'Recent';
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return 'Recent';
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    const day = d.getDate();
    const year = d.getFullYear();
    const prefix =
      template.status === 'APPROVED'
        ? 'Approved'
        : template.status === 'PENDING'
        ? 'Submitted'
        : 'Updated';
    return `${prefix} ${month} ${day}, ${year}`;
  } catch {
    return 'Recent';
  }
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onSelect,
  onPress,
}) => {
  const { isDark } = useTheme();
  const color = getColors(isDark);
  const [copied, setCopied] = useState(false);

  const isApproved = template.status === 'APPROVED';
  const isPending = template.status === 'PENDING';
  const isRejected = template.status === 'REJECTED' || template.status === 'PAUSED';

  const category = (template.category || 'UTILITY').toUpperCase();
  const handlePress = onSelect
    ? () => onSelect(template)
    : onPress
    ? () => onPress(template)
    : undefined;

  // Category Configuration
  const getCategoryMeta = () => {
    switch (category) {
      case 'MARKETING':
        return {
          icon: 'megaphone' as const,
          bg: isDark ? 'rgba(99, 102, 241, 0.16)' : 'rgba(99, 102, 241, 0.10)',
          text: isDark ? '#A5B4FC' : '#4F46E5',
          label: 'Marketing',
        };
      case 'AUTHENTICATION':
      case 'OTP':
        return {
          icon: 'shield-checkmark' as const,
          bg: isDark ? 'rgba(168, 85, 247, 0.16)' : 'rgba(168, 85, 247, 0.10)',
          text: isDark ? '#D8B4FE' : '#9333EA',
          label: 'Auth (OTP)',
        };
      case 'UTILITY':
      default:
        return {
          icon: 'build' as const,
          bg: isDark ? 'rgba(37, 211, 102, 0.16)' : 'rgba(37, 211, 102, 0.10)',
          text: isDark ? '#25D366' : '#075E54',
          label: 'Utility',
        };
    }
  };

  const catMeta = getCategoryMeta();

  // Parse Components
  const comps = Array.isArray(template.components) ? template.components : [];
  const headerComp = comps.find((c: any) => c.type === 'HEADER');
  const bodyComp = comps.find((c: any) => c.type === 'BODY');
  const footerComp = comps.find((c: any) => c.type === 'FOOTER');
  const buttonsComp = comps.find((c: any) => c.type === 'BUTTONS');

  const headerFormat = headerComp?.format || 'TEXT';
  const headerText = headerComp?.text || '';
  const bodyText = bodyComp?.text || 'Template content preview';
  const footerText = footerComp?.text || '';
  const buttons = Array.isArray(buttonsComp?.buttons) ? buttonsComp.buttons : [];

  const handleCopy = async () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await Clipboard.setStringAsync(bodyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render Body Text with WhatsApp Token Badges
  const renderBodyText = () => {
    const parts = String(bodyText).split(/(\{\{\d+\}\})/g);
    return (
      <Text
        style={{
          fontSize: 13,
          lineHeight: 20,
          color: isDark ? '#E9EDEF' : '#111B21',
        }}
      >
        {parts.map((part, index) => {
          if (/^\{\{\d+\}\}$/.test(part)) {
            return (
              <Text
                key={`${part}-${index}`}
                style={{
                  fontWeight: '700',
                  fontSize: 11.5,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 4,
                  backgroundColor: isDark
                    ? 'rgba(37, 211, 102, 0.22)'
                    : 'rgba(7, 94, 84, 0.15)',
                  color: isDark ? '#25D366' : '#075E54',
                  fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
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
      className="w-full rounded-2xl mb-4 overflow-hidden active:opacity-95"
      style={{
        backgroundColor: isDark ? '#1C272E' : '#FFFFFF',
        borderWidth: 0,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.35 : 0.06,
        shadowRadius: 8,
      }}
      onPress={handlePress}
      disabled={!handlePress}
    >
      {/* 1. Header Section: Category, Meta Status & Name */}
      <View className="p-3.5 pb-2.5">
        <View className="flex-row items-center justify-between mb-2">
          {/* Category Chip */}
          <View
            className="flex-row items-center px-2.5 py-1 rounded-full gap-1.5"
            style={{ backgroundColor: catMeta.bg }}
          >
            <Ionicons name={catMeta.icon} size={12} color={catMeta.text} />
            <Text
              className="text-[11px] font-bold tracking-tight"
              style={{ color: catMeta.text }}
            >
              {catMeta.label}
            </Text>
          </View>

          {/* Meta Approval Status Badge */}
          <View
            className={`flex-row items-center px-2.5 py-1 rounded-full gap-1 ${
              isApproved
                ? 'bg-emerald-500/15'
                : isPending
                ? 'bg-amber-500/15'
                : 'bg-rose-500/15'
            }`}
          >
            <Ionicons
              name={
                isApproved
                  ? 'checkmark-circle'
                  : isPending
                  ? 'time'
                  : 'alert-circle'
              }
              size={12}
              color={isApproved ? '#25D366' : isPending ? '#F59E0B' : '#EF4444'}
            />
            <Text
              className="text-[11px] font-bold"
              style={{
                color: isApproved
                  ? '#25D366'
                  : isPending
                  ? '#F59E0B'
                  : '#EF4444',
              }}
            >
              {isApproved
                ? 'Meta Approved'
                : isPending
                ? 'In Review'
                : 'Rejected'}
            </Text>
          </View>
        </View>

        {/* Template Name & Language */}
        <Text
          className={`text-base font-bold tracking-tight mb-0.5 ${
            isDark ? 'text-[#F8FAFC]' : 'text-[#0F172A]'
          }`}
          numberOfLines={1}
        >
          {template.name}
        </Text>
        <Text
          className={`text-xs font-medium ${
            isDark ? 'text-[#94A3B8]' : 'text-[#64748B]'
          }`}
        >
          {formatLanguage(template.language)} • {formatDate(template)}
        </Text>
      </View>

      {/* 2. Authentic WhatsApp Chat Screen Preview Canvas */}
      <View
        className="mx-3.5 mb-3 p-3 rounded-2xl relative overflow-hidden"
        style={{
          backgroundColor: isDark ? '#0B141A' : '#ECE5DD',
          borderWidth: 0,
          borderColor: 'transparent',
        }}
      >
        {/* Subtle Watermark/Doodle accent */}
        <View className="absolute top-2 right-2 opacity-10">
          <Ionicons
            name="logo-whatsapp"
            size={48}
            color={isDark ? '#25D366' : '#075E54'}
          />
        </View>

        {/* Signature WhatsApp Outgoing Message Bubble (Borderless) */}
        <View
          className="rounded-2xl rounded-tr-sm p-3.5 pb-2"
          style={{
            backgroundColor: isDark ? '#005C4B' : '#D9FDD3',
            borderWidth: 0,
            borderColor: 'transparent',
            maxWidth: '96%',
            alignSelf: 'flex-start',
            elevation: 0,
          }}
        >
          {/* Header Component (Media or Text) */}
          {headerComp && headerFormat !== 'TEXT' && (
            <View
              className="rounded-lg p-2.5 mb-2.5 flex-row items-center gap-2"
              style={{
                backgroundColor: isDark
                  ? 'rgba(0, 0, 0, 0.25)'
                  : 'rgba(255, 255, 255, 0.55)',
                borderWidth: 0,
              }}
            >
              <Ionicons
                name={
                  headerFormat === 'IMAGE'
                    ? 'image-outline'
                    : headerFormat === 'VIDEO'
                    ? 'videocam-outline'
                    : 'document-text-outline'
                }
                size={18}
                color={isDark ? '#25D366' : '#075E54'}
              />
              <Text
                className="text-xs font-bold uppercase tracking-wider"
                style={{ color: isDark ? '#25D366' : '#075E54' }}
              >
                {headerFormat} Header
              </Text>
            </View>
          )}

          {headerText ? (
            <Text
              className="text-[13px] font-extrabold mb-1.5"
              style={{ color: isDark ? '#FFFFFF' : '#111B21' }}
            >
              {headerText}
            </Text>
          ) : null}

          {/* Body Content with Highlighted {{variables}} */}
          <View className="mb-1">{renderBodyText()}</View>

          {/* Footer Component */}
          {footerText ? (
            <Text
              className="text-[10px] font-medium mt-1.5"
              style={{ color: isDark ? '#99BEB7' : '#667781' }}
            >
              {footerText}
            </Text>
          ) : null}

          {/* Timestamp & Iconic WhatsApp Blue Double Checkmarks */}
          <View className="flex-row items-center justify-end mt-1 gap-1">
            <Text
              className="text-[9.5px] font-medium"
              style={{ color: isDark ? '#99BEB7' : '#667781' }}
            >
              10:42 AM
            </Text>
            <Ionicons
              name={isApproved ? 'checkmark-done' : 'checkmark'}
              size={14}
              color={isApproved ? '#53BDEB' : isDark ? '#99BEB7' : '#8696A0'}
            />
          </View>
        </View>

        {/* Authentic WhatsApp CTA / Quick Reply Action Buttons (Borderless) */}
        {buttons.length > 0 && (
          <View className="mt-2.5 gap-1.5" style={{ maxWidth: '96%' }}>
            {buttons.map((btn: any, idx: number) => {
              const isUrl = btn.type === 'URL';
              const isPhone = btn.type === 'PHONE_NUMBER';

              return (
                <Pressable
                  key={idx}
                  className="flex-row items-center justify-center py-2 px-3 rounded-xl active:opacity-80"
                  style={{
                    backgroundColor: isDark ? '#1F2C34' : '#FFFFFF',
                    borderWidth: 0,
                    borderColor: 'transparent',
                    elevation: 0,
                  }}
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    if (isUrl && btn.url) {
                      Linking.openURL(btn.url).catch(() => {});
                    } else if (isPhone && btn.phone_number) {
                      Linking.openURL(`tel:${btn.phone_number}`).catch(() => {});
                    }
                  }}
                >
                  <Ionicons
                    name={
                      isUrl
                        ? 'open-outline'
                        : isPhone
                        ? 'call-outline'
                        : 'chatbubble-outline'
                    }
                    size={14}
                    color={isDark ? '#25D366' : '#075E54'}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    className="text-xs font-bold"
                    style={{ color: isDark ? '#25D366' : '#075E54' }}
                    numberOfLines={1}
                  >
                    {btn.text || 'Action Button'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* 3. Card Action Bar: Copy & Quick Details (Borderless) */}
      <View
        className="flex-row items-center justify-between px-3.5 py-2.5"
        style={{
          borderTopWidth: 0,
          borderWidth: 0,
        }}
      >
        <View className="flex-row items-center gap-1.5">
          <Ionicons
            name="cube-outline"
            size={13}
            color={isDark ? '#64748B' : '#94A3B8'}
          />
          <Text
            className="text-[11px] font-medium"
            style={{ color: isDark ? '#94A3B8' : '#64748B' }}
          >
            {comps.length} Components
          </Text>
        </View>

        <Pressable
          className={`flex-row items-center px-3 py-1.5 rounded-lg active:opacity-75 ${
            copied
              ? 'bg-emerald-500/20'
              : isDark
              ? 'bg-white/10'
              : 'bg-black/5'
          }`}
          onPress={handleCopy}
        >
          <Ionicons
            name={copied ? 'checkmark-circle' : 'copy-outline'}
            size={13}
            color={copied ? '#25D366' : isDark ? '#E2E8F0' : '#334155'}
            style={{ marginRight: 4 }}
          />
          <Text
            className="text-xs font-semibold"
            style={{
              color: copied ? '#25D366' : isDark ? '#E2E8F0' : '#334155',
            }}
          >
            {copied ? 'Copied!' : 'Copy Body'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
};
