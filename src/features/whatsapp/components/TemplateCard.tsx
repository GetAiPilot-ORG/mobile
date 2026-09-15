import React from 'react';
import { StyleSheet, Text, View, Pressable, Linking, Platform, useColorScheme } from 'react-native';
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

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
      <Text style={[styles.bodyText, { color: isDark ? '#e9edef' : '#111b21' }]}>
        {parts.map((part, index) => {
          if (/^\{\{\d+\}\}$/.test(part)) {
            return (
              <Text
                key={`${part}-${index}`}
                style={[
                  styles.variableBadge,
                  {
                    backgroundColor: isDark ? 'rgba(0, 168, 132, 0.2)' : 'rgba(0, 168, 132, 0.12)',
                    color: isDark ? '#25d366' : '#008069',
                  },
                ]}
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
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        pressed && handlePress ? { opacity: 0.85 } : null,
      ]}
      onPress={handlePress}
      disabled={!handlePress}
    >
      {/* 1. Header Row */}
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: theme.bg, borderColor: theme.border }]}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={theme.iconColor} />
        </View>

        <View style={styles.infoCol}>
          <Text style={[styles.templateName, { color: isDark ? '#f8fafc' : '#0f172a' }]} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={[styles.metaSubtitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>
            {theme.label} • {formatLanguage(template.language)}
          </Text>
        </View>
      </View>

      {/* 2. Pending Alert if undergoing Meta verification */}
      {isPending && (
        <View style={styles.pendingBanner}>
          <View style={styles.pulsingDot} />
          <Text style={styles.pendingBannerText}>Meta review in progress</Text>
        </View>
      )}

      {/* 3. WhatsApp Mock Chat Wallpaper Canvas */}
      <View style={[styles.canvasContainer, isDark ? styles.canvasContainerDark : styles.canvasContainerLight]}>
        {/* Subtle decorative background pattern elements */}
        <View style={styles.canvasPattern} />

        {/* WhatsApp Chat Bubble */}
        <View style={[styles.chatBubble, isDark ? styles.chatBubbleDark : styles.chatBubbleLight]}>
          {/* Header */}
          {headerText ? (
            <View style={[styles.headerContainer, { borderBottomColor: isDark ? '#2a3942' : '#f1f5f9' }]}>
              <Text style={[styles.headerText, { color: isDark ? '#e9edef' : '#111b21' }]}>{headerText}</Text>
            </View>
          ) : null}

          {/* Body Content with Variable Badges */}
          <View style={styles.bodyContainer}>{renderBodyText()}</View>

          {/* Footer Text */}
          {footerText ? (
            <Text style={[styles.footerText, { color: isDark ? '#8696a0' : '#667781' }]}>{footerText}</Text>
          ) : null}

          {/* Timestamp & Sky Blue Double Ticks */}
          <View style={styles.tickRow}>
            <Text style={[styles.timeText, { color: isDark ? '#8696a0' : '#667781' }]}>10:38 AM</Text>
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
          <View style={styles.buttonsContainer}>
            {buttons.slice(0, 2).map((btn: any, idx: number) => {
              const isUrl = btn.type === 'URL';
              const isPhone = btn.type === 'PHONE_NUMBER';
              return (
                <Pressable
                  key={idx}
                  style={[styles.actionBtn, isDark ? styles.actionBtnDark : styles.actionBtnLight]}
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
                    style={[styles.actionBtnText, { color: isDark ? '#38bdf8' : '#0284c7' }]}
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
      <View style={styles.bottomBar}>
        <View style={styles.dateGroup}>
          <Ionicons name="calendar-outline" size={13} color={isDark ? '#64748b' : '#94a3b8'} style={{ marginRight: 4 }} />
          <Text style={[styles.dateText, { color: isDark ? '#64748b' : '#64748b' }]}>{formatDate(template)}</Text>
        </View>

        <View
          style={[
            styles.statusPill,
            isApproved
              ? styles.statusApproved
              : isPending
              ? styles.statusPending
              : styles.statusRejected,
          ]}
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
            style={[
              styles.statusText,
              { color: isApproved ? '#25d366' : isPending ? '#fbbf24' : '#f87171' },
            ]}
          >
            {isApproved ? 'Approved' : isPending ? 'Pending' : isRejected ? 'Rejected' : (template.status || 'Approved')}
          </Text>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  infoCol: {
    flex: 1,
  },
  templateName: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  metaSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  pendingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    marginBottom: 10,
  },
  pulsingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#f59e0b',
    marginRight: 6,
  },
  pendingBannerText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#fbbf24',
  },
  canvasContainer: {
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    marginBottom: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  canvasContainerDark: {
    backgroundColor: '#0b141a',
    borderColor: '#1e293b',
  },
  canvasContainerLight: {
    backgroundColor: '#efeae2',
    borderColor: '#e2e8f0',
  },
  canvasPattern: {
    ...StyleSheet.absoluteFill,
    opacity: 0.15,
  },
  chatBubble: {
    borderRadius: 12,
    padding: 12,
    paddingBottom: 6,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 1,
  },
  chatBubbleDark: {
    backgroundColor: '#1f2c34',
    borderColor: '#2a3942',
  },
  chatBubbleLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  headerContainer: {
    borderBottomWidth: 1,
    paddingBottom: 6,
    marginBottom: 6,
  },
  headerText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  bodyContainer: {
    marginBottom: 4,
  },
  bodyText: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '400',
  },
  variableBadge: {
    fontWeight: '700',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    fontSize: 11,
    borderRadius: 4,
    paddingHorizontal: 2,
  },
  footerText: {
    fontSize: 9.5,
    marginTop: 4,
  },
  tickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  timeText: {
    fontSize: 9,
    fontWeight: '500',
  },
  buttonsContainer: {
    marginTop: 8,
    gap: 6,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 7,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionBtnDark: {
    backgroundColor: '#182229',
    borderColor: '#2a3942',
  },
  actionBtnLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  actionBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  dateGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 7,
    borderWidth: 1,
  },
  statusApproved: {
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    borderColor: 'rgba(37, 211, 102, 0.25)',
  },
  statusPending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  statusRejected: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
});

