import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';

interface SampleAudio {
  id: string;
  title: string;
  duration: string;
  category: string;
  transcript: string;
  summary: string[];
}

const SAMPLE_VOICE_NOTES: SampleAudio[] = [
  {
    id: '1',
    title: 'Customer Support Inquiry',
    duration: '0:24',
    category: 'WhatsApp Bot',
    transcript:
      'Hello, thank you for reaching out to GetAiPilot customer support. We are confirming that your automated WhatsApp broadcast campaign is scheduled for 4:00 PM today with 2,500 verified phone contacts.',
    summary: [
      'WhatsApp campaign scheduled for 4:00 PM today.',
      'Recipient audience size: 2,500 verified contacts.',
      'Customer support ticket marked as confirmed.',
    ],
  },
  {
    id: '2',
    title: 'Executive Sales Call Notes',
    duration: '0:45',
    category: 'GAP CRM',
    transcript:
      'The client from Acme Enterprise is looking to migrate their 15-agent sales pipeline from HubSpot to GAP CRM. They requested custom Telesub monetization links and full Supabase database synchronization before the end of Q3.',
    summary: [
      'Client: Acme Enterprise (15-agent sales pipeline).',
      'Migrating from HubSpot to GAP CRM.',
      'Requested Telesub monetization links & Supabase sync by Q3.',
    ],
  },
  {
    id: '3',
    title: 'AI Telecalling Agent Feedback',
    duration: '0:18',
    category: 'Voice Pilot',
    transcript:
      'Voice pilot agent completed 120 outbound follow-up calls with an 88% pickup rate. 42 qualified leads booked consultation slots automatically.',
    summary: [
      'Completed 120 outbound calls with 88% pickup rate.',
      '42 qualified leads booked direct appointments.',
    ],
  },
];

const LANGUAGES = [
  { code: 'en', label: 'English (US/UK)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
];

export default function SpeechToTextScreen() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);

  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');
  const [transcript, setTranscript] = useState('');
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Recording Timer
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      setRecordSeconds(0);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggleRecord = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (isRecording) {
      setIsRecording(false);
      setIsProcessing(true);

      setTimeout(() => {
        setIsProcessing(false);
        setTranscript(
          'Hi team, this is our weekly product strategy meeting transcript. We successfully tested the new QR Code Studio and QuickForms with live AI schema generation on iOS and Android.'
        );
        setSummaryBullets([
          'Tested new QR Code Studio across mobile platforms.',
          'QuickForms live AI schema generation operational on iOS & Android.',
          'All team deliverables on track for production release.',
        ]);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, 1400);
    } else {
      setTranscript('');
      setSummaryBullets([]);
      setCopied(false);
      setIsRecording(true);
    }
  };

  const handleLoadSample = (sample: SampleAudio) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTranscript(sample.transcript);
    setSummaryBullets(sample.summary);
    setCopied(false);
    Alert.alert('Loaded Audio Sample ✨', `Loaded "${sample.title}" (${sample.duration})`);
  };

  const handleCopyText = async () => {
    const textToCopy =
      activeTab === 'transcript'
        ? transcript
        : summaryBullets.map((b) => `• ${b}`).join('\n');
    await Clipboard.setStringAsync(textToCopy);
    setCopied(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!transcript) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await Share.share({
        message: `🎙️ AI Audio Transcript:\n\n${transcript}\n\nKey Takeaways:\n${summaryBullets
          .map((b) => `• ${b}`)
          .join('\n')}\n\nTranscribed with GetAiPilot Mobile.`,
      });
    } catch {}
  };

  return (
    <AppScreen safeArea={false} className="flex-1 bg-[#0B0D10]">
      <AppTopBar title="AI Speech-to-Text" subtitle="Voice Notes & Audio Transcriber" showBack={true} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Main Recording Studio Card */}
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-sm font-black text-white mb-1">Voice Note Transcriber</Text>
          <Text className="text-xs text-slate-400 leading-4 mb-3.5">
            Record speech in real-time or select an audio sample to generate clean text and AI executive summaries.
          </Text>

          {/* Language Selector Pills */}
          <Text className="text-xs font-bold text-slate-300 mb-1.5">Recognition Language:</Text>
          <View className="flex-row flex-wrap gap-1.5 mb-4">
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                className={`px-3 py-1.5 rounded-lg border ${
                  selectedLanguage === lang.code ? 'bg-[#0084FF] border-[#0084FF]' : 'bg-[#111317] border-[#262930]'
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedLanguage(lang.code);
                }}
              >
                <Text
                  className={`text-xs font-bold ${
                    selectedLanguage === lang.code ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Big Recording Button Chassis */}
          <View className="items-center py-3">
            {/* Waveform Visualizer */}
            {isRecording && (
              <View className="flex-row items-center gap-1 h-14 mb-2.5">
                <View className="w-1.5 h-7 rounded-sm bg-red-500" />
                <View className="w-1.5 h-11 rounded-sm bg-red-500" />
                <View className="w-1.5 h-5 rounded-sm bg-red-500" />
                <View className="w-1.5 h-14 rounded-sm bg-red-500" />
                <View className="w-1.5 h-9 rounded-sm bg-red-500" />
                <View className="w-1.5 h-6 rounded-sm bg-red-500" />
                <View className="w-1.5 h-12 rounded-sm bg-red-500" />
              </View>
            )}

            {/* Mic Button */}
            <Pressable
              className={`w-20 h-20 rounded-full justify-center items-center shadow-lg mb-2.5 ${
                isRecording ? 'bg-red-500 shadow-red-500/50' : 'bg-[#0084FF] shadow-[#0084FF]/50'
              }`}
              onPress={handleToggleRecord}
              disabled={isProcessing}
            >
              <Text className="text-3xl">{isRecording ? '⏹' : '🎙️'}</Text>
            </Pressable>

            {/* Status & Live Timer */}
            <Text className={`text-xl font-black font-mono mb-1 ${isRecording ? 'text-red-500' : 'text-white'}`}>
              {isRecording ? formatTimer(recordSeconds) : '00:00'}
            </Text>

            <Text className="text-xs font-semibold text-slate-400 text-center">
              {isRecording
                ? 'Recording in Progress... Tap to Stop & Transcribe'
                : isProcessing
                ? 'Whisper AI is Transcribing & Summarizing...'
                : 'Tap microphone to start recording'}
            </Text>

            {isProcessing && (
              <ActivityIndicator size="large" color="#0084FF" className="mt-3.5" />
            )}
          </View>
        </View>

        {/* 1-Tap Sample Audio Notes */}
        <View className="rounded-2xl p-4 mb-4 border border-[#262930] bg-[#181A1F]">
          <Text className="text-sm font-black text-white mb-1">Or Test with Sample Voice Notes</Text>
          <Text className="text-xs text-slate-400 mb-3">
            Experience instant AI speech recognition without speaking out loud.
          </Text>

          <View className="gap-2">
            {SAMPLE_VOICE_NOTES.map((sample) => (
              <Pressable
                key={sample.id}
                className="flex-row items-center p-3 rounded-xl border border-[#262930] bg-[#111317]"
                onPress={() => handleLoadSample(sample)}
              >
                <View className="w-8 h-8 rounded-full items-center justify-center bg-[#0084FF]/20">
                  <Text className="text-sm">▶️</Text>
                </View>

                <View className="flex-1 ml-2.5">
                  <Text className="text-xs font-black text-white">{sample.title}</Text>
                  <Text className="text-[10px] text-[#0084FF] font-semibold">
                    {sample.category} • {sample.duration}
                  </Text>
                </View>

                <Text className="text-xs font-bold text-[#0084FF]">Load ➔</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* RESULTS CARD */}
        {transcript ? (
          <View className="rounded-2xl p-4 border border-[#262930] bg-[#181A1F] mb-4">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-sm font-black text-white">AI Output</Text>

              {/* Tabs */}
              <View className="flex-row p-1 rounded-lg bg-[#111317] border border-[#262930]">
                <Pressable
                  className={`px-2.5 py-1 rounded-md ${activeTab === 'transcript' ? 'bg-[#0084FF]' : ''}`}
                  onPress={() => setActiveTab('transcript')}
                >
                  <Text className={`text-[11px] font-bold ${activeTab === 'transcript' ? 'text-white' : 'text-slate-400'}`}>
                    Full Text 📝
                  </Text>
                </Pressable>

                <Pressable
                  className={`px-2.5 py-1 rounded-md ${activeTab === 'summary' ? 'bg-[#0084FF]' : ''}`}
                  onPress={() => setActiveTab('summary')}
                >
                  <Text className={`text-[11px] font-bold ${activeTab === 'summary' ? 'text-white' : 'text-slate-400'}`}>
                    AI Summary ⚡
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Display Body */}
            {activeTab === 'transcript' ? (
              <View className="p-3.5 rounded-xl border border-[#262930] bg-[#111317] mb-3.5">
                <Text className="text-xs text-slate-200 leading-5">{transcript}</Text>
              </View>
            ) : (
              <View className="p-3.5 rounded-xl border border-[#262930] bg-[#111317] mb-3.5">
                {summaryBullets.map((bullet, idx) => (
                  <View key={idx} className="flex-row items-start mb-2">
                    <Text className="text-[#0084FF] mr-2 text-sm leading-4">•</Text>
                    <Text className="text-xs text-slate-200 flex-1 leading-4">{bullet}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions Bar */}
            <View className="flex-row gap-2">
              <Pressable
                className="flex-1 py-3 rounded-xl items-center border border-[#262930] bg-[#111317]"
                onPress={handleCopyText}
              >
                <Text className="text-xs font-bold text-white">
                  {copied ? 'Copied to Clipboard ✅' : 'Copy Text 📋'}
                </Text>
              </Pressable>

              <Pressable
                className="flex-1 py-3 rounded-xl items-center bg-[#0084FF]"
                onPress={handleShare}
              >
                <Text className="text-xs font-bold text-white">Share Transcript 📤</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}
