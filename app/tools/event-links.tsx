import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Share,
  Linking,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';

interface EventTemplate {
  title: string;
  category: string;
  icon: string;
  defaultDate: string;
  defaultTime: string;
  platform: 'Google Meet' | 'Zoom' | 'YouTube Live' | 'In-Person';
  description: string;
}

const EVENT_TEMPLATES: EventTemplate[] = [
  {
    title: 'AI Automation Masterclass 2026',
    category: 'Webinar',
    icon: '🚀',
    defaultDate: 'Tomorrow',
    defaultTime: '6:00 PM - 7:30 PM IST',
    platform: 'Google Meet',
    description: 'Learn how to build multi-channel Telegram & WhatsApp bots with AI telecalling agents.',
  },
  {
    title: '1-on-1 Growth Strategy Discovery',
    category: 'Consultation',
    icon: '🤝',
    defaultDate: 'Next Monday',
    defaultTime: '3:00 PM - 3:45 PM IST',
    platform: 'Zoom',
    description: 'Deep dive into your CRM pipeline and revenue monetization roadmap.',
  },
  {
    title: 'Live Product Launch & Q&A',
    category: 'Live Stream',
    icon: '🎤',
    defaultDate: 'This Friday',
    defaultTime: '8:00 PM IST',
    platform: 'YouTube Live',
    description: 'Exclusive first look at GetAiPilot v2.0 features with live demo & community rewards.',
  },
];

const PLATFORMS = ['Google Meet', 'Zoom', 'YouTube Live', 'In-Person'] as const;

export default function EventLinksScreen() {
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
    Alert.alert('Template Loaded! ✨', `"${tmpl.title}" is ready.`);
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
        message: `📅 You're Invited: "${eventName}"\n🕒 When: ${eventDate} at ${eventTime}\n📍 Platform: ${selectedPlatform}\n🔗 Meeting Link: ${meetingUrl}\n\n✨ Add to Google Calendar:\n${getGoogleCalendarUrl()}\n\nPowered by GetAiPilot Event Studio.`,
      });
    } catch {}
  };

  const handleCopyInviteText = async () => {
    const inviteText = `📅 Event: ${eventName}\n🕒 Date: ${eventDate} • ${eventTime}\n📍 Platform: ${selectedPlatform}\n🔗 Join URL: ${meetingUrl}`;
    await Clipboard.setStringAsync(inviteText);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="Event Links Studio" subtitle="1-Click Calendar & RSVP Invitations" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* 1-Tap Starter Templates */}
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-sm font-black text-white mb-1">1-Tap Event Starters</Text>
          <Text className="text-xs text-slate-400 mb-3 leading-4">
            Pick a pre-configured template to build your calendar invitation in seconds.
          </Text>

          <View className="gap-2">
            {EVENT_TEMPLATES.map((tmpl, idx) => (
              <Pressable
                key={idx}
                className="flex-row items-center p-3 rounded-xl border border-[#262930] bg-[#111317]"
                onPress={() => handleApplyTemplate(tmpl)}
              >
                <Text className="text-2xl">{tmpl.icon}</Text>
                <View className="flex-1 ml-2.5">
                  <Text className="text-xs font-black text-white">{tmpl.title}</Text>
                  <Text className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {tmpl.category} • {tmpl.platform}
                  </Text>
                </View>
                <Text className="text-xs font-bold text-[#0084FF]">Use ➔</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Event Configuration Form */}
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-sm font-black text-white mb-2">Event Details</Text>

          <Text className="text-xs font-bold text-slate-300 mb-1">Event / Webinar Title *</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
            value={eventName}
            onChangeText={setEventName}
            placeholder="e.g. Masterclass 2026"
            placeholderTextColor="#64748B"
          />

          <View className="flex-row gap-2.5 mb-3">
            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-300 mb-1">Date</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="Sept 15, 2026"
                placeholderTextColor="#64748B"
              />
            </View>

            <View className="flex-1">
              <Text className="text-xs font-bold text-slate-300 mb-1">Time / Duration</Text>
              <TextInput
                className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white"
                value={eventTime}
                onChangeText={setEventTime}
                placeholder="6:00 PM IST"
                placeholderTextColor="#64748B"
              />
            </View>
          </View>

          {/* Platform Selector Chips */}
          <Text className="text-xs font-bold text-slate-300 mb-1.5">Event Platform:</Text>
          <View className="flex-row flex-wrap gap-1.5 mb-3">
            {PLATFORMS.map((plat) => (
              <Pressable
                key={plat}
                className={`px-3 py-1.5 rounded-lg border ${
                  selectedPlatform === plat ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedPlatform(plat);
                }}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedPlatform === plat ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {plat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Text className="text-xs font-bold text-slate-300 mb-1">Meeting / Stream Link</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white mb-3"
            value={meetingUrl}
            onChangeText={setMeetingUrl}
            placeholder="https://meet.google.com/xyz"
            placeholderTextColor="#64748B"
            autoCapitalize="none"
            keyboardType="url"
          />

          <Text className="text-xs font-bold text-slate-300 mb-1">Short Description / Agenda</Text>
          <TextInput
            className="rounded-xl border border-[#262930] bg-[#111317] px-3.5 py-2 text-xs text-white h-16"
            value={description}
            onChangeText={setDescription}
            placeholder="Key talking points..."
            placeholderTextColor="#64748B"
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* LIVE VIP EVENT TICKET PASS */}
        <View className="rounded-3xl p-5 border-2 border-[#0084FF] bg-[#181A1F] mb-4 shadow-xl">
          <View className="flex-row justify-between items-center mb-2.5">
            <View className="bg-[#0084FF]/20 px-2.5 py-1 rounded-md">
              <Text className="text-[#0084FF] text-[10px] font-black tracking-wider">OFFICIAL EVENT PASS 🎟️</Text>
            </View>
            <Text className="text-xs font-extrabold text-[#0084FF]">{selectedPlatform}</Text>
          </View>

          <Text className="text-lg font-black text-white mb-1">{eventName || 'Untitled Event'}</Text>
          <Text className="text-xs text-slate-400 mb-3.5 leading-4" numberOfLines={2}>
            {description}
          </Text>

          {/* Meta Grid */}
          <View className="rounded-xl p-3 gap-2 bg-[#111317] border border-[#262930]">
            <View>
              <Text className="text-[9px] font-black uppercase text-slate-400 tracking-wider">DATE & TIME</Text>
              <Text className="text-xs font-bold text-white mt-0.5">
                {eventDate} • {eventTime}
              </Text>
            </View>

            <View>
              <Text className="text-[9px] font-black uppercase text-slate-400 tracking-wider">ACCESS LINK</Text>
              <Text className="text-xs font-bold text-[#0084FF] mt-0.5" numberOfLines={1}>
                {meetingUrl || 'Link will be provided'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="gap-2 mt-4">
            <Pressable className="py-3 rounded-xl items-center bg-[#0084FF]" onPress={handleOpenGoogleCalendar}>
              <Text className="text-xs font-extrabold text-white">📅 Add to Google Calendar (1-Click)</Text>
            </Pressable>

            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 py-2.5 rounded-xl items-center border border-[#262930] bg-[#111317]"
                onPress={handleCopyInviteText}
              >
                <Text className="text-xs font-bold text-white">
                  {copied ? 'Copied! ✅' : 'Copy Invite 📋'}
                </Text>
              </Pressable>

              <Pressable
                className="flex-1 py-2.5 rounded-xl items-center bg-[#25D366]"
                onPress={handleShareInvite}
              >
                <Text className="text-xs font-bold text-black">Share Pass 📤</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </AppScreen>
  );
}
