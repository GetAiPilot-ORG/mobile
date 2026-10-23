import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
  Linking,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Calendar01Icon,
  Calendar03Icon,
  Rocket01Icon,
  Share01Icon,
  Copy01Icon,
  ArrowUpRight01Icon,
  CheckmarkCircle01Icon,
  Link01Icon,
  UserIcon,
} from '@/constants/icons';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useTheme, getColors, AppColors } from '@/theme';

interface EventTemplate {
  title: string;
  category: string;
  defaultDate: string;
  defaultTime: string;
  platform: 'Google Meet' | 'Zoom' | 'YouTube Live' | 'In-Person';
  description: string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: 'AI Automation Masterclass 2026',
    category: 'Webinar',
    defaultDate: 'Tomorrow',
    defaultTime: '6:00 PM - 7:30 PM IST',
    platform: 'Google Meet',
    description: 'Learn how to build multi-channel Telegram & WhatsApp bots with AI telecalling agents.',
  },
  {
    title: '1-on-1 Growth Strategy Discovery',
    category: 'Consultation',
    defaultDate: 'Next Monday',
    defaultTime: '3:00 PM - 3:45 PM IST',
    platform: 'Zoom',
    description: 'Deep dive into your CRM pipeline and revenue monetization roadmap.',
  },
  {
    title: 'Live Product Launch & Q&A',
    category: 'Live Stream',
    defaultDate: 'This Friday',
    defaultTime: '8:00 PM IST',
    platform: 'YouTube Live',
    description: 'Exclusive first look at GetAiPilot v2.0 features with live demo & community rewards.',
  },
];

const PLATFORMS = ['Google Meet', 'Zoom', 'YouTube Live', 'In-Person'] as const;

export default function EventLinksScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const [eventName, setEventName] = useState('AI Automation Masterclass 2026');
  const [eventDate, setEventDate] = useState('Sept 15, 2026');
  const [eventTime, setEventTime] = useState('6:00 PM IST');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/gap-demo-live');
  const [selectedPlatform, setSelectedPlatform] = useState<typeof PLATFORMS[number]>('Google Meet');
  const [description, setDescription] = useState('Join our live session to master Telegram, WhatsApp & Voice AI automation.');
  const [copied, setCopied] = useState(false);

  const handleApplyTemplate = (tmpl: EventTemplate) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEventName(tmpl.title);
    setEventDate(tmpl.defaultDate);
    setEventTime(tmpl.defaultTime);
    setSelectedPlatform(tmpl.platform);
    setDescription(tmpl.description);
  };

  const getGoogleCalendarUrl = (): string => {
    const title = encodeURIComponent(eventName.trim());
    const details = encodeURIComponent(`${description}\n\nJoin Live: ${meetingUrl}`);
    const location = encodeURIComponent(meetingUrl || selectedPlatform);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
  };

  const handleOpenGoogleCalendar = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const gCalUrl = getGoogleCalendarUrl();
    Linking.openURL(gCalUrl).catch(() => {
      Alert.alert('Error', 'Unable to open Google Calendar on this device.');
    });
  };

  const handleShareInvite = async () => {
    if (!eventName.trim()) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `You're Invited: "${eventName}"\n📅 When: ${eventDate} at ${eventTime}\n📍 Platform: ${selectedPlatform}\n🔗 Meeting Link: ${meetingUrl}\n\nAdd to Google Calendar:\n${getGoogleCalendarUrl()}`,
        title: 'Event Invitation',
      });
    } catch { }
  };

  const handleCopyInviteText = async () => {
    const inviteText = `Event: ${eventName}\nWhen: ${eventDate} • ${eventTime}\nPlatform: ${selectedPlatform}\nJoin: ${meetingUrl}\n\nCalendar Link: ${getGoogleCalendarUrl()}`;
    await Clipboard.setStringAsync(inviteText);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const calUrl = getGoogleCalendarUrl();

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Event Links Studio" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Creator Card */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.headerIconBubble}>
              <HugeiconsIcon icon={Calendar03Icon} size={19} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>1-Click Calendar Links</Text>
              <Text style={styles.cardSubtitle}>
                Generate smart RSVP links for Google Calendar, Apple iCal, & Zoom
              </Text>
            </View>
          </View>

          {/* Quick Starter Templates */}
          <Text style={styles.inputLabel}>Event Templates</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.templateScroll}
          >
            {EVENT_TEMPLATES.map((tmpl) => (
              <Pressable
                key={tmpl.title}
                style={styles.templateChip}
                onPress={() => handleApplyTemplate(tmpl)}
              >
                <HugeiconsIcon icon={Rocket01Icon} size={14} color={colors.accent} />
                <Text style={styles.templateChipText}>{tmpl.category}: {tmpl.title.split(' ')[0]}</Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Event Title */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>Event Title</Text>
            <View style={styles.inputBox}>
              <TextInput
                style={styles.textInput}
                placeholder="Product Launch Webinar"
                placeholderTextColor={colors.mutedForeground}
                value={eventName}
                onChangeText={setEventName}
              />
            </View>
          </View>

          {/* Date & Time Row */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Date</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Oct 24, 2026"
                  placeholderTextColor={colors.mutedForeground}
                  value={eventDate}
                  onChangeText={setEventDate}
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Time</Text>
              <View style={styles.inputBox}>
                <TextInput
                  style={styles.textInput}
                  placeholder="6:00 PM IST"
                  placeholderTextColor={colors.mutedForeground}
                  value={eventTime}
                  onChangeText={setEventTime}
                />
              </View>
            </View>
          </View>

          {/* Platform Selector */}
          <View style={[styles.inputGroup, { marginTop: 12 }]}>
            <Text style={styles.inputLabel}>Meeting Platform</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
            >
              {PLATFORMS.map((plat) => {
                const active = selectedPlatform === plat;
                return (
                  <Pressable
                    key={plat}
                    style={[
                      styles.platformChip,
                      active && styles.platformChipActive,
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedPlatform(plat);
                    }}
                  >
                    <Text
                      style={[
                        styles.platformChipText,
                        active && styles.platformChipTextActive,
                      ]}
                    >
                      {plat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Meeting URL */}
          <View style={[styles.inputGroup, { marginTop: 10 }]}>
            <Text style={styles.inputLabel}>Join Link / Meeting URL</Text>
            <View style={styles.inputBox}>
              <HugeiconsIcon icon={Link01Icon} size={17} color={colors.mutedForeground} />
              <TextInput
                style={styles.textInput}
                placeholder="https://meet.google.com/abc-defg-hij"
                placeholderTextColor={colors.mutedForeground}
                value={meetingUrl}
                onChangeText={setMeetingUrl}
                autoCapitalize="none"
              />
            </View>
          </View>
        </View>

        {/* Digital Event Pass Ticket Preview */}
        <View style={styles.ticketCard}>
          <View style={styles.ticketHeader}>
            <View style={styles.ticketBadge}>
              <HugeiconsIcon icon={Calendar01Icon} size={14} color={colors.accent} />
              <Text style={styles.ticketBadgeText}>CONFIRMED INVITE</Text>
            </View>
            <View style={styles.platformBadge}>
              <Text style={styles.platformBadgeText}>{selectedPlatform}</Text>
            </View>
          </View>

          <Text style={styles.ticketTitle}>{eventName || 'Live Event'}</Text>

          <View style={styles.ticketScheduleRow}>
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>DATE</Text>
              <Text style={styles.scheduleValue}>{eventDate || 'TBD'}</Text>
            </View>
            <View style={styles.scheduleDivider} />
            <View style={styles.scheduleItem}>
              <Text style={styles.scheduleLabel}>TIME</Text>
              <Text style={styles.scheduleValue}>{eventTime || 'TBD'}</Text>
            </View>
          </View>

          {description ? (
            <Text style={styles.ticketDesc} numberOfLines={2}>
              {description}
            </Text>
          ) : null}

          {/* QR Code to Add to Calendar */}
          <View style={styles.qrChassis}>
            <QRCode value={calUrl} size={140} color="#18181B" backgroundColor="#FFFFFF" />
            <Text style={styles.qrHint}>Scan to add to smartphone calendar</Text>
          </View>

          {/* Actions Dock */}
          <View style={styles.actionsRow}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtnPrimary,
                { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
              ]}
              onPress={handleOpenGoogleCalendar}
            >
              <HugeiconsIcon
                icon={Calendar01Icon}
                size={16}
                color={colors.buttonPrimaryForeground}
              />
              <Text style={styles.actionBtnPrimaryText}>Add to G-Cal</Text>
            </Pressable>

            <TouchableOpacity
              style={[
                styles.actionBtnSecondary,
              ]}
              onPress={handleCopyInviteText}
            >
              <HugeiconsIcon
                icon={copied ? CheckmarkCircle01Icon : Copy01Icon}
                size={16}
                color={copied ? '#10B981' : colors.text}
              />
              <Text style={styles.actionBtnSecondaryText}>
                {copied ? 'Copied!' : 'Copy Invite'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionBtnOutline,
              ]}
              onPress={handleShareInvite}
            >
              <HugeiconsIcon icon={Share01Icon} size={16} color={colors.text} />
              <Text style={styles.actionBtnOutlineText}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const createStyles = (colors: AppColors, isDark: boolean) =>
  StyleSheet.create({
    scrollContent: {
      padding: 16,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 18,
      marginBottom: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    },
    headerIconBubble: {
      width: 40,
      height: 40,
      borderRadius: 13,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.foreground,
    },
    cardSubtitle: {
      fontSize: 12,
      color: colors.mutedForeground,
      marginTop: 2,
    },
    inputLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.foreground,
      marginBottom: 6,
    },
    templateScroll: {
      gap: 8,
      paddingVertical: 4,
    },
    templateChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    },
    templateChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    inputGroup: {
      gap: 6,
    },
    inputBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FFFFFF',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.cardBorder,
      borderRadius: 14,
      paddingHorizontal: 12,
      paddingVertical: Platform.OS === 'ios' ? 12 : 9,
    },
    textInput: {
      flex: 1,
      fontSize: 14,
      color: colors.foreground,
      padding: 0,
    },
    platformChip: {
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.surfaceSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.border,
    },
    platformChipActive: {
      backgroundColor: colors.buttonPrimary,
      borderColor: colors.buttonPrimary,
    },
    platformChipText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    platformChipTextActive: {
      color: colors.buttonPrimaryForeground,
      fontWeight: '700',
    },
    ticketCard: {
      backgroundColor: colors.card,
      borderRadius: 24,
      padding: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : colors.cardBorder,
    },
    ticketHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 12,
    },
    ticketBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 9,
      paddingVertical: 4,
      borderRadius: 999,
    },
    ticketBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.7,
      color: colors.accent,
    },
    platformBadge: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceSecondary,
      paddingHorizontal: 8,
      paddingVertical: 3.5,
      borderRadius: 8,
    },
    platformBadgeText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    ticketTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.foreground,
      marginBottom: 12,
    },
    ticketScheduleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : colors.surfaceSecondary,
      padding: 12,
      borderRadius: 14,
      marginBottom: 12,
    },
    scheduleItem: {
      flex: 1,
    },
    scheduleLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.mutedForeground,
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    scheduleValue: {
      fontSize: 13.5,
      fontWeight: '700',
      color: colors.foreground,
    },
    scheduleDivider: {
      width: 1,
      height: 24,
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : colors.border,
      marginHorizontal: 12,
    },
    ticketDesc: {
      fontSize: 12.5,
      lineHeight: 18,
      color: colors.mutedForeground,
      marginBottom: 14,
    },
    qrChassis: {
      backgroundColor: '#FFFFFF',
      padding: 14,
      borderRadius: 18,
      alignItems: 'center',
      alignSelf: 'center',
      shadowColor: '#29213E',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 3,
      marginBottom: 16,
    },
    qrHint: {
      fontSize: 11,
      fontWeight: '600',
      color: '#6B7280',
      marginTop: 8,
    },
    actionsRow: {
      flexDirection: 'row',
      gap: 8,
    },
    actionBtnPrimary: {
      flex: 1.2,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.buttonPrimary,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnPrimaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.buttonPrimaryForeground,
    },
    actionBtnSecondary: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accentSoft,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnSecondaryText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    actionBtnOutline: {
      flex: 0.8,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
      backgroundColor: 'transparent',
      borderWidth: 1.2,
      borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : colors.cardBorder,
      paddingVertical: 12,
      borderRadius: 14,
    },
    actionBtnOutlineText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
  });
