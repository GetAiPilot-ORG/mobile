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
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

export default function EventLinksScreen() {
  const [eventName, setEventName] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventLink, setEventLink] = useState('');
  const [generatedCalendarUrl, setGeneratedCalendarUrl] = useState('');

  const handleCreateEvent = () => {
    if (!eventName.trim()) {
      Alert.alert('Validation Error', 'Please enter an event name.');
      return;
    }

    const titleEncoded = encodeURIComponent(eventName.trim());
    const link = `https://gap.to/e/${titleEncoded.toLowerCase()}-${Math.random().toString(36).substring(2, 6)}`;
    setGeneratedCalendarUrl(link);
  };

  const handleShare = async () => {
    if (!generatedCalendarUrl) return;
    try {
      await Share.share({
        message: `Join our live session "${eventName}" on ${eventDate || 'Upcoming date'}: ${generatedCalendarUrl}`,
        title: 'Event Invitation Link',
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="Event Links Studio" subtitle="Calendar & Webinar Invitations" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create Event Invitation Link</Text>
          <Text style={styles.cardSubtitle}>
            Generate dynamic 1-click calendar invite links (Google Calendar, Apple iCal, Outlook) for webinars and product launches.
          </Text>

          <Text style={styles.inputLabel}>Event / Webinar Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. AI Automation Masterclass 2026"
            placeholderTextColor={colors.mutedForeground}
            value={eventName}
            onChangeText={setEventName}
          />

          <Text style={styles.inputLabel}>Date & Time</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Sept 15, 2026 at 6:00 PM IST"
            placeholderTextColor={colors.mutedForeground}
            value={eventDate}
            onChangeText={setEventDate}
          />

          <Text style={styles.inputLabel}>Live Meeting Link (Zoom / GMeet)</Text>
          <TextInput
            style={styles.input}
            placeholder="https://meet.google.com/xyz-abc"
            placeholderTextColor={colors.mutedForeground}
            value={eventLink}
            onChangeText={setEventLink}
            autoCapitalize="none"
          />

          <Pressable style={styles.createBtn} onPress={handleCreateEvent}>
            <Text style={styles.createBtnText}>Generate Event Invitation 📅</Text>
          </Pressable>
        </View>

        {generatedCalendarUrl ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Event Invite Ready:</Text>
            <View style={styles.urlBox}>
              <Text style={styles.urlText}>{generatedCalendarUrl}</Text>
            </View>

            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Share Event Invitation 📤</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 8,
  },
  urlBox: {
    backgroundColor: colors.muted,
    padding: 12,
    borderRadius: 8,
    marginBottom: 14,
  },
  urlText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  shareBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
