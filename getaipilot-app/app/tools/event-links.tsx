import React, { useState } from 'react';
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
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useTheme, getColors } from '@/theme';

interface EventTemplate {
  title: string;
  category: string;
  icon: keyof typeof Ionicons.glyphMap;
  defaultDate: string;
  defaultTime: string;
  platform: 'Google Meet' | 'Zoom' | 'YouTube Live' | 'In-Person';
  description: string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: 'AI Automation Masterclass 2026',
    category: 'Webinar',
    icon: 'rocket-outline',
    defaultDate: 'Tomorrow',
    defaultTime: '6:00 PM - 7:30 PM IST',
    platform: 'Google Meet',
    description: 'Learn how to build multi-channel Telegram & WhatsApp bots with AI telecalling agents.',
  },
  {
    title: '1-on-1 Growth Strategy Discovery',
    category: 'Consultation',
    icon: 'people-outline',
    defaultDate: 'Next Monday',
    defaultTime: '3:00 PM - 3:45 PM IST',
    platform: 'Zoom',
    description: 'Deep dive into your CRM pipeline and revenue monetization roadmap.',
  },
  {
    title: 'Live Product Launch & Q&A',
    category: 'Live Stream',
    icon: 'videocam-outline',
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

  const [eventName, setEventName] = useState('AI Automation Masterclass 2026');
  const [eventDate, setEventDate] = useState('Sept 15, 2026');
  const [eventTime, setEventTime] = useState('6:00 PM IST');
  const [meetingUrl, setMeetingUrl] = useState('https://meet.google.com/gap-demo-live');
  const [selectedPlatform, setSelectedPlatform] = useState<typeof PLATFORMS[number]>('Google Meet');
  const [description, setDescription] = useState('Join our live session to master Telegram, WhatsApp & Voice AI automation.');

  const [copied, setCopied] = useState(false);

  // Dynamic Theme Mapping
  const theme = {
    bg: colors.background,
    card: colors.card,
    cardBorder: colors.border,
    text: colors.foreground,
    mutedText: colors.mutedForeground,
    inputBg: isDark ? '#141416' : '#FFFFFF',
    inputBorder: colors.border,
    primary: colors.primary,
    primarySoft: colors.accentSoft,
  };

  const handleApplyTemplate = (tmpl: EventTemplate) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEventName(tmpl.title);
    setEventDate(tmpl.defaultDate);
    setEventTime(tmpl.defaultTime);
    setSelectedPlatform(tmpl.platform);
    setDescription(tmpl.description);
    Alert.alert('Template Loaded', `"${tmpl.title}" is ready.`);
  };

  // Build Real 1-Click Google Calendar URL
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
        message: `You're Invited: "${eventName}"\nWhen: ${eventDate} at ${eventTime}\nPlatform: ${selectedPlatform}\nMeeting Link: ${meetingUrl}\n\nAdd to Google Calendar:\n${getGoogleCalendarUrl()}\n\nPowered by GetAiPilot Event Studio.`,
      });
    } catch {}
  };

  const handleCopyInviteText = async () => {
    const inviteText = `Event: ${eventName}\nDate: ${eventDate} • ${eventTime}\nPlatform: ${selectedPlatform}\nJoin URL: ${meetingUrl}`;
    await Clipboard.setStringAsync(inviteText);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppScreen safeArea={false} backgroundColor={theme.bg}>
      <AppTopBar title="Event Links Studio" 
      // subtitle="1-Click Calendar & RSVP Invitations" 
      showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* 1-Tap Starter Templates */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>1-Tap Event Starters</Text>
          <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
            Pick a pre-configured template to build your calendar invitation in seconds.
          </Text>

          <View style={{ gap: 8 }}>
            {EVENT_TEMPLATES.map((tmpl, idx) => (
              <Pressable
                key={idx}
                style={[
                  styles.templateCard,
                  { backgroundColor: isDark ? '#141416' : '#F9FAFB', borderColor: theme.cardBorder },
                ]}
                onPress={() => handleApplyTemplate(tmpl)}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: isDark ? '#252230' : '#E9E6F2',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name={tmpl.icon} size={22} color={theme.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.templateTitle, { color: theme.text }]}>{tmpl.title}</Text>
                  <Text style={[styles.templateMeta, { color: theme.mutedText }]}>
                    {tmpl.category} • {tmpl.platform}
                  </Text>
                </View>
                <Ionicons name="arrow-forward" size={16} color={theme.primary} />
              </Pressable>
            ))}
          </View>
        </View>

        {/* Event Configuration Form */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Event Details</Text>

          <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Event / Webinar Title *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            value={eventName}
            onChangeText={setEventName}
            placeholder="e.g. Masterclass 2026"
            placeholderTextColor={theme.mutedText}
          />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="Sept 15, 2026"
                placeholderTextColor={theme.mutedText}
              />
            </View>

            <View style={{ flex: 1 }}>
              <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Time / Duration</Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
                value={eventTime}
                onChangeText={setEventTime}
                placeholder="6:00 PM IST"
                placeholderTextColor={theme.mutedText}
              />
            </View>
          </View>

          {/* Platform Selector Chips */}
          <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 4 }]}>Event Platform:</Text>
          <View style={styles.platformRow}>
            {PLATFORMS.map((plat) => (
              <Pressable
                key={plat}
                style={[
                  styles.platformChip,
                  {
                    backgroundColor: selectedPlatform === plat ? theme.primary : isDark ? '#141416' : '#F3F4F6',
                    borderColor: selectedPlatform === plat ? theme.primary : theme.cardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPlatform(plat);
                }}
              >
                <Text
                  style={[
                    styles.platformChipText,
                    { color: selectedPlatform === plat ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {plat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text style={[styles.inputLabel, { color: theme.mutedText, marginTop: 12 }]}>Meeting / Stream Link</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            value={meetingUrl}
            onChangeText={setMeetingUrl}
            placeholder="https://meet.google.com/xyz"
            placeholderTextColor={theme.mutedText}
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Short Description / Agenda</Text>
          <TextInput
            style={[styles.input, { height: 60, backgroundColor: theme.inputBg, borderColor: theme.inputBorder, color: theme.text }]}
            value={description}
            onChangeText={setDescription}
            placeholder="Key talking points..."
            placeholderTextColor={theme.mutedText}
            multiline
          />
        </View>

        {/* ── LIVE VIP EVENT TICKET PASS PREVIEW ────────────────────────── */}
        <View style={[styles.ticketCard, { backgroundColor: isDark ? '#000000' : '#FFFFFF', borderColor: theme.primary }]}>
          <View style={styles.ticketHeader}>
            <View style={styles.ticketBadge}>
              <Ionicons name="ticket-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.ticketBadgeText}>OFFICIAL EVENT PASS</Text>
            </View>
            <Text style={[styles.platformPill, { color: theme.primary }]}>{selectedPlatform}</Text>
          </View>

          <Text style={[styles.ticketTitle, { color: isDark ? '#FFFFFF' : '#000000' }]}>{eventName || 'Untitled Event'}</Text>
          <Text style={[styles.ticketDesc, { color: theme.mutedText }]} numberOfLines={2}>
            {description}
          </Text>

          {/* Meta Grid */}
          <View style={[styles.ticketMetaBox, { backgroundColor: isDark ? '#141416' : '#F5F3FB' }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.mutedText }]}>DATE & TIME</Text>
              <Text style={[styles.metaValue, { color: isDark ? '#FFFFFF' : '#000000' }]}>
                {eventDate} • {eventTime}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: theme.mutedText }]}>ACCESS LINK</Text>
              <Text style={[styles.metaValue, { color: theme.primary }]} numberOfLines={1}>
                {meetingUrl || 'Link will be provided'}
              </Text>
            </View>
          </View>

          {/* 1-Click Action Buttons */}
          <View style={{ gap: 8, marginTop: 14 }}>
            <Pressable style={[styles.gCalBtn, { backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]} onPress={handleOpenGoogleCalendar}>
              <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
              <Text style={styles.gCalBtnText}>Add to Google Calendar (1-Click)</Text>
            </Pressable>

            <View style={styles.actionRow}>
              <Pressable
                style={[styles.subBtn, { backgroundColor: isDark ? '#252230' : '#E9E6F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                onPress={handleCopyInviteText}
              >
                <Ionicons name={copied ? 'checkmark-circle-outline' : 'copy-outline'} size={15} color={theme.text} />
                <Text style={[styles.subBtnText, { color: theme.text }]}>
                  {copied ? 'Copied!' : 'Copy Invite'}
                </Text>
              </Pressable>

              <Pressable
                style={[styles.subBtn, { backgroundColor: colors.products.whatsapp, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }]}
                onPress={handleShareInvite}
              >
                <Ionicons name="share-social-outline" size={15} color="#FFFFFF" />
                <Text style={[styles.subBtnText, { color: '#FFFFFF' }]}>Share Pass</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  card: {
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    borderWidth: 0,
  },
  cardTitle: {
    fontSize: 16.5,
    fontWeight: '800',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    lineHeight: 18,
    marginBottom: 14,
  },
  templateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 24,
    borderWidth: 0,
  },
  templateTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  templateMeta: {
    fontSize: 11,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    borderWidth: 1,
    marginBottom: 10,
  },
  platformRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  platformChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  platformChipText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  ticketCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 2,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  ticketBadge: {
    backgroundColor: 'rgba(0, 132, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  ticketBadgeText: {
    color: '#0084FF',
    fontSize: 10.5,
    fontWeight: '800',
  },
  platformPill: {
    fontSize: 12,
    fontWeight: '800',
  },
  ticketTitle: {
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  ticketDesc: {
    fontSize: 12.5,
    lineHeight: 17,
    marginBottom: 14,
  },
  ticketMetaBox: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  metaItem: {
    gap: 2,
  },
  metaLabel: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  gCalBtn: {
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
  },
  gCalBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13.5,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  subBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  subBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});
