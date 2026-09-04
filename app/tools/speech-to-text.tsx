import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Share,
  ActivityIndicator,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

export default function SpeechToTextScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');

  const handleToggleRecord = () => {
    if (isRecording) {
      // Stop recording and transcribe
      setIsRecording(false);
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        setTranscript(
          'Hello, thank you for reaching out to GetAIPilot customer support. We are confirming your automated WhatsApp campaign is now scheduled for 4:00 PM today.'
        );
      }, 1200);
    } else {
      // Start recording
      setIsRecording(true);
      setTranscript('');
    }
  };

  const handleShare = async () => {
    if (!transcript) return;
    try {
      await Share.share({
        message: transcript,
        title: 'Transcribed Audio Text',
      });
    } catch (e: any) {
      console.error(e);
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="AI Speech-to-Text" subtitle="Audio & Voice Note Transcriber" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Audio Transcription Studio</Text>
          <Text style={styles.cardSubtitle}>
            Record customer voice notes or meeting audio to generate high-accuracy transcripts powered by whisper-level AI models.
          </Text>

          <View style={styles.recorderWrapper}>
            <Pressable
              style={[
                styles.recordBtn,
                isRecording ? styles.recordBtnActive : null,
              ]}
              onPress={handleToggleRecord}
              disabled={isProcessing}
            >
              <Text style={styles.recordIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
            </Pressable>
            <Text style={styles.recordStatus}>
              {isRecording
                ? 'Recording... Tap to Stop & Transcribe'
                : isProcessing
                ? 'Processing AI Transcription...'
                : 'Tap microphone to speak'}
            </Text>
          </View>

          {isProcessing && (
            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 20 }} />
          )}
        </View>

        {transcript ? (
          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Generated Transcript:</Text>
            <View style={styles.transcriptBox}>
              <Text style={styles.transcriptText}>{transcript}</Text>
            </View>

            <Pressable style={styles.shareBtn} onPress={handleShare}>
              <Text style={styles.shareBtnText}>Copy / Share Transcript 📋</Text>
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
    marginBottom: 20,
  },
  recorderWrapper: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  recordBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 14,
  },
  recordBtnActive: {
    backgroundColor: colors.destructive,
  },
  recordIcon: {
    fontSize: 34,
    color: '#FFFFFF',
  },
  recordStatus: {
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.foreground,
  },
  resultCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 8,
  },
  transcriptBox: {
    backgroundColor: colors.muted,
    padding: 14,
    borderRadius: 10,
    marginBottom: 14,
  },
  transcriptText: {
    fontSize: 14,
    color: colors.foreground,
    lineHeight: 20,
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
