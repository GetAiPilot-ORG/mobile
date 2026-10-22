import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
  Share,
  Platform,
  Linking,
  PermissionsAndroid,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as FileSystem from 'expo-file-system/legacy';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { useThemedDialog } from '@/components';
import { useTheme, getColors } from '@/theme';
let Sharing: typeof import('expo-sharing') | null = null;
try {
  Sharing = require('expo-sharing');
} catch {
  Sharing = null;
}

const LANGUAGES = [
  { code: 'auto', label: 'Auto Detect 🌐' },
  { code: 'en', label: 'English (US/UK)' },
  { code: 'hi', label: 'Hindi (हिन्दी)' },
  { code: 'es', label: 'Spanish (Español)' },
  { code: 'fr', label: 'French (Français)' },
];

/**
 * Embedded HTML Audio Recording Engine for Android & iOS WebView
 * Uses standard W3C MediaRecorder & getUserMedia with zero external native dependencies!
 * Directly handles user touch gesture and relaxes DSP echoCancellation to avoid HAL audio driver crash on Xiaomi/MIUI.
 */
const getWebViewRecorderHtml = (primaryColor: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * {
      box-sizing: border-box;
      -webkit-tap-highlight-color: transparent;
      user-select: none;
      -webkit-user-select: none;
      margin: 0;
      padding: 0;
    }
    html, body {
      width: 100%;
      height: 100%;
      background: transparent;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .mic-circle-btn {
      width: 86px;
      height: 86px;
      border-radius: 43px;
      border: none;
      outline: none;
      background-color: ${primaryColor || '#6C55C5'};
      box-shadow: 0 6px 14px rgba(108, 85, 197, 0.4);
      display: flex;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: background-color 0.25s ease, transform 0.12s ease, box-shadow 0.25s ease;
    }
    .mic-circle-btn:active {
      transform: scale(0.92);
    }
    .mic-circle-btn.recording {
      background-color: #EF4444 !important;
      box-shadow: 0 6px 16px rgba(239, 68, 68, 0.5) !important;
      animation: pulse 1.5s infinite;
    }
    .mic-circle-btn.disabled {
      opacity: 0.6;
      pointer-events: none;
    }
    @keyframes pulse {
      0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.6); }
      70% { box-shadow: 0 0 0 14px rgba(239, 68, 68, 0); }
      100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
    }
    .icon-svg {
      width: 38px;
      height: 38px;
      pointer-events: none;
    }
  </style>
</head>
<body>
  <button id="recBtn" class="mic-circle-btn" type="button" onclick="window.toggleRecording()">
    <svg id="micIcon" class="icon-svg" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"></path>
      <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
      <line x1="12" y1="19" x2="12" y2="22"></line>
    </svg>
    <svg id="stopIcon" class="icon-svg" viewBox="0 0 24 24" fill="#FFFFFF" style="display: none;">
      <rect x="6" y="6" width="12" height="12" rx="2.5"></rect>
    </svg>
  </button>

  <script>
    var mediaRecorder = null;
    var recordedChunks = [];
    var mediaStream = null;
    var isRecording = false;
    var isStarting = false;
    var isProcessing = false;
    var primaryThemeColor = '${primaryColor || '#6C55C5'}';

    function post(type, payload) {
      try {
        if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
          window.ReactNativeWebView.postMessage(JSON.stringify(Object.assign({ type: type }, payload || {})));
        }
      } catch (e) {}
    }

    function setBtnUi(recording) {
      var btn = document.getElementById('recBtn');
      var mic = document.getElementById('micIcon');
      var stop = document.getElementById('stopIcon');
      if (!btn) return;
      if (recording) {
        btn.classList.add('recording');
        if (mic) mic.style.display = 'none';
        if (stop) stop.style.display = 'block';
      } else {
        btn.classList.remove('recording');
        btn.style.backgroundColor = primaryThemeColor;
        if (mic) mic.style.display = 'block';
        if (stop) stop.style.display = 'none';
      }
    }

    function stopActiveStream() {
      if (mediaStream) {
        try {
          mediaStream.getTracks().forEach(function(t) {
            try { t.stop(); } catch(_) {}
          });
        } catch (_) {}
        mediaStream = null;
      }
    }

    async function getAudioStream() {
      stopActiveStream();

      // Candidate 1: Relaxed audio parameters without hardware DSP filters (echoCancellation: false)
      // This is crucial on Xiaomi / MIUI / HyperOS and Samsung devices to prevent HAL driver crash (NotReadableError)
      var candidates = [
        {
          audio: {
            echoCancellation: false,
            noiseSuppression: false,
            autoGainControl: false
          }
        },
        { audio: true },
        { audio: { channelCount: 1 } },
        { audio: { echoCancellation: { ideal: false } } }
      ];

      for (var i = 0; i < candidates.length; i++) {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            var s = await navigator.mediaDevices.getUserMedia(candidates[i]);
            post('DEBUG', { step: 'candidate_success', candidateIndex: i });
            return s;
          } catch (e) {
            post('DEBUG', { step: 'candidate_fail', candidateIndex: i, name: e && e.name, message: e && e.message });
          }
        }
      }

      // Legacy fallback
      var legacy = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
      if (legacy) {
        try {
          var sLegacy = await new Promise(function(resolve, reject) {
            legacy.call(navigator, { audio: true }, resolve, reject);
          });
          return sLegacy;
        } catch (e2) {
          post('DEBUG', { step: 'legacy_fail', error: String(e2) });
        }
      }

      throw new Error('Microphone audio source could not be opened. Please verify microphone permission in settings and ensure no other recording app is active.');
    }

    window.startRecording = async function() {
      if (isRecording || isStarting || isProcessing) return;
      isStarting = true;
      try {
        recordedChunks = [];
        mediaStream = await getAudioStream();

        var mimeType = '';
        if (typeof MediaRecorder !== 'undefined') {
          if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
            mimeType = 'audio/webm;codecs=opus';
          } else if (MediaRecorder.isTypeSupported('audio/webm')) {
            mimeType = 'audio/webm';
          } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
            mimeType = 'audio/mp4';
          } else if (MediaRecorder.isTypeSupported('audio/aac')) {
            mimeType = 'audio/aac';
          }
        }

        mediaRecorder = mimeType ? new MediaRecorder(mediaStream, { mimeType: mimeType }) : new MediaRecorder(mediaStream);

        mediaRecorder.ondataavailable = function(e) {
          if (e.data && e.data.size > 0) {
            recordedChunks.push(e.data);
          }
        };

        mediaRecorder.onstop = function() {
          try {
            var blob = new Blob(recordedChunks, { type: mimeType || 'audio/webm' });
            var reader = new FileReader();
            reader.onloadend = function() {
              var result = reader.result;
              var base64 = result.indexOf(',') !== -1 ? result.split(',')[1] : result;
              post('RECORDING_DATA', {
                base64: base64,
                mimeType: mimeType || 'audio/webm',
                size: blob.size
              });
            };
            reader.readAsDataURL(blob);
          } catch(err) {
            post('ERROR', { code: 'ENCODE_ERROR', error: 'Failed to encode recorded audio: ' + err.message });
          } finally {
            stopActiveStream();
          }
        };

        mediaRecorder.start(200);
        isRecording = true;
        setBtnUi(true);
        post('RECORDING_STARTED');
      } catch (err) {
        isRecording = false;
        setBtnUi(false);
        stopActiveStream();
        var isPerm = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || (err.message && err.message.toLowerCase().indexOf('permission') !== -1);
        post('ERROR', {
          code: isPerm ? 'PERMISSION_DENIED' : 'RECORD_FAILED',
          error: (err.name ? (err.name + ': ') : '') + (err.message || 'Microphone recording failed.')
        });
      } finally {
        isStarting = false;
      }
    };

    window.stopRecording = function() {
      if (!isRecording) return;
      isRecording = false;
      setBtnUi(false);
      post('RECORDING_STOPPED');
      try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        } else {
          stopActiveStream();
        }
      } catch (err) {
        stopActiveStream();
        post('ERROR', { code: 'STOP_ERROR', error: err.message });
      }
    };

    window.toggleRecording = function() {
      if (isRecording) {
        window.stopRecording();
      } else {
        window.startRecording();
      }
    };

    window.setThemeColor = function(color) {
      primaryThemeColor = color;
      var btn = document.getElementById('recBtn');
      if (btn && !isRecording) {
        btn.style.backgroundColor = color;
      }
    };

    window.setProcessing = function(processing) {
      isProcessing = !!processing;
      var btn = document.getElementById('recBtn');
      if (!btn) return;
      if (isProcessing) {
        btn.classList.add('disabled');
      } else {
        btn.classList.remove('disabled');
      }
    };

    window.setBtnUi = setBtnUi;

    post('READY');
  </script>
</body>
</html>
`;

export default function SpeechToTextScreen() {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const { confirm: showCustomConfirm, showAlert: showCustomAlert } = useThemedDialog();

  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(LANGUAGES[0].code);

  const [activeTab, setActiveTab] = useState<'transcript' | 'summary'>('transcript');
  const [transcript, setTranscript] = useState('');
  const [summaryBullets, setSummaryBullets] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // Proactively check/request microphone permission on screen mount for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
        .then((hasPerm) => {
          if (!hasPerm) {
            PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
              title: 'Microphone Permission',
              message: 'GetAIPilot requires microphone access to record audio and convert speech to text.',
              buttonPositive: 'Allow',
              buttonNegative: 'Deny',
            }).catch(() => { });
          }
        })
        .catch(() => { });
    }
  }, []);

  const webViewRef = useRef<WebView>(null);
  const isWebViewReady = useRef(false);
  const webMediaRecorderRef = useRef<any>(null);
  const webAudioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Dynamic Theme Mapping
  const theme = {
    bg: colors.background,
    card: colors.card,
    cardBorder: colors.border,
    text: colors.foreground,
    mutedText: colors.mutedForeground,
    inputBg: isDark ? '#141416' : '#FFFFFF',
    primary: colors.primary,
    primarySoft: colors.accentSoft,
  };

  // Recording Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Synchronize dynamic primary theme color to WebView
  useEffect(() => {
    if (Platform.OS !== 'web' && webViewRef.current) {
      webViewRef.current.injectJavaScript(`if (window.setThemeColor) window.setThemeColor('${theme.primary}'); true;`);
    }
  }, [theme.primary]);

  // Synchronize processing state to disable button inside WebView
  useEffect(() => {
    if (Platform.OS !== 'web' && webViewRef.current) {
      webViewRef.current.injectJavaScript(`if (window.setProcessing) window.setProcessing(${isProcessing}); true;`);
    }
  }, [isProcessing]);

  // Synchronize recording state UI to button inside WebView
  useEffect(() => {
    if (Platform.OS !== 'web' && webViewRef.current) {
      webViewRef.current.injectJavaScript(`if (window.setBtnUi) window.setBtnUi(${isRecording}); true;`);
    }
  }, [isRecording]);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const generateSummaryBullets = (text: string) => {
    if (!text || text.length < 10) {
      setSummaryBullets(['Voice note transcribed successfully.']);
      return;
    }

    const sentences = text
      .split(/(?<=[.!?।\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 8);

    if (sentences.length <= 3) {
      setSummaryBullets(sentences.length > 0 ? sentences : [text]);
    } else {
      const bullets = [
        sentences[0],
        sentences[Math.floor(sentences.length / 2)],
        sentences[sentences.length - 1],
      ].filter(Boolean);
      setSummaryBullets(bullets);
    }
  };

  /**
   * Upload recorded audio file to OpenAI Whisper API via Supabase Edge Function
   */
  const processAndTranscribeAudio = async (
    fileUriOrBlob: string | Blob,
    fileName: string,
    mimeType: string
  ) => {
    setIsProcessing(true);
    setTranscript('');
    setSummaryBullets([]);

    try {
      console.log('🎙️ [Speech-to-Text] Uploading audio for transcription:', { fileName, mimeType });

      const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://uklxlappjcuvdqjvecfh.supabase.co';
      const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
      let cleanTranscript = '';

      if (Platform.OS !== 'web' && typeof fileUriOrBlob === 'string') {
        // Native Mobile (Android & iOS): Use native FileSystem.uploadAsync for high-performance multipart streaming
        const uploadResult = await FileSystem.uploadAsync(
          `${supabaseUrl}/functions/v1/transcribe-audio`,
          fileUriOrBlob,
          {
            uploadType: FileSystem.FileSystemUploadType.MULTIPART,
            fieldName: 'file',
            mimeType: mimeType || 'audio/webm',
            httpMethod: 'POST',
            headers: {
              apikey: anonKey,
              Authorization: `Bearer ${anonKey}`,
            },
            parameters: {
              response_format: 'text',
              ...(selectedLanguage && selectedLanguage !== 'auto' ? { language: selectedLanguage } : {}),
            },
          }
        );

        if (uploadResult.status < 200 || uploadResult.status >= 300) {
          console.error('❌ [Speech-to-Text] Whisper response error:', uploadResult.status, uploadResult.body);
          throw new Error(uploadResult.body || `Server responded with status ${uploadResult.status}`);
        }

        cleanTranscript = (uploadResult.body || '').trim();
      } else {
        // Web Platform: Standard Browser FormData & fetch
        const formData = new FormData();
        if (typeof fileUriOrBlob === 'string') {
          const res = await fetch(fileUriOrBlob);
          const blob = await res.blob();
          formData.append('file', blob, fileName);
        } else {
          formData.append('file', fileUriOrBlob, fileName);
        }

        if (selectedLanguage && selectedLanguage !== 'auto') {
          formData.append('language', selectedLanguage);
        }
        formData.append('response_format', 'text');

        const response = await fetch(`${supabaseUrl}/functions/v1/transcribe-audio`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${anonKey}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error('❌ [Speech-to-Text] Whisper response error:', response.status, errText);
          throw new Error(errText || `Server responded with status ${response.status}`);
        }

        const resultText = await response.text();
        cleanTranscript = (resultText || '').trim();
      }

      if (!cleanTranscript) {
        throw new Error('No intelligible speech detected. Please speak louder and closer to the microphone.');
      }

      console.log('✅ [Speech-to-Text] Transcription success:', cleanTranscript.slice(0, 80));
      setTranscript(cleanTranscript);
      generateSummaryBullets(cleanTranscript);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('❌ [Speech-to-Text] Transcription failure:', err);
      showCustomAlert({
        title: 'Transcription Error',
        message: err.message || 'Could not transcribe speech. Please try speaking again.',
        type: 'warning',
        buttonText: 'Try Again',
        buttonBgColor: colors.accent,
        buttonTextColor: colors.text,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Handle audio recorded by native WebView bridge
   */
  const handleWebViewMessage = async (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'READY') {
        isWebViewReady.current = true;
      } else if (data.type === 'DEBUG') {
        console.log('🐞 [Speech-to-Text Debug]:', data);
      } else if (data.type === 'RECORDING_STARTED') {
        setIsRecording(true);
        setTranscript('');
        setSummaryBullets([]);
        setCopied(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else if (data.type === 'RECORDING_STOPPED') {
        setIsRecording(false);
      } else if (data.type === 'RECORDING_DATA') {
        setIsRecording(false);
        const { base64, mimeType } = data;

        if (!base64) {
          showCustomAlert({
            title: 'Recording Failed',
            message: 'No audio data was captured. Please speak closer to the microphone.',
            type: 'warning',
            buttonText: 'OK',
            buttonBgColor: colors.accent,
            buttonTextColor: colors.text,
          });
          return;
        }

        // Save base64 audio to temporary cache file
        const ext = mimeType?.includes('mp4') ? 'mp4' : mimeType?.includes('aac') ? 'aac' : 'webm';
        const tempUri = `${FileSystem.cacheDirectory}recording_${Date.now()}.${ext}`;

        await FileSystem.writeAsStringAsync(tempUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        await processAndTranscribeAudio(tempUri, `speech_recording.${ext}`, mimeType);

        // Cleanup temporary audio cache
        FileSystem.deleteAsync(tempUri, { idempotent: true }).catch(() => { });
      } else if (data.type === 'ERROR') {
        setIsRecording(false);
        console.warn('🎙️ [Speech-to-Text] WebView recorder event:', data);

        let isActualPermissionMissing = false;
        if (Platform.OS === 'android') {
          try {
            const hasPerm = await PermissionsAndroid.check(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
            );
            if (!hasPerm) {
              isActualPermissionMissing = true;
            }
          } catch (_) { }
        } else if (data.code === 'PERMISSION_DENIED') {
          isActualPermissionMissing = true;
        }

        if (isActualPermissionMissing) {
          showMicrophonePermissionAlert();
        } else {
          showCustomAlert({
            title: 'Recording Notice',
            message:
              data.error?.includes('NotReadableError')
                ? 'Could not access device microphone. Please close other apps using audio (calls, voice notes) and try again.'
                : data.error ||
                'Microphone recorder could not start. Please tap the microphone button again.',
            type: 'warning',
            buttonText: 'Try Again',
            buttonBgColor: colors.accent,
            buttonTextColor: colors.text,
          });
        }
      }
    } catch (err) {
      console.error('[Speech-to-Text] WebView message parse error:', err);
      setIsRecording(false);
    }
  };

  /**
   * Show custom themed alert dialog prompting user to enable microphone permissions
   */
  const showMicrophonePermissionAlert = (customMessage?: string) => {
    showCustomConfirm({
      title: 'Enable Microphone Access',
      message:
        customMessage ||
        'Microphone permission is required to record voice and convert speech to text. Please enable it in your device settings.',
      type: 'warning',
      confirmText: 'Open Settings',
      cancelText: 'Cancel',
      confirmBgColor: colors.accent,
      confirmTextColor: colors.text,
      cancelBgColor: colors.primary,
      cancelTextColor: colors.text,
      onConfirm: () => {
        Linking.openSettings().catch(() => { });
      },
    });
  };

  /**
   * Tap Mic to Start / Stop Recording
   */
  const handleToggleRecord = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    // 1. Web Platform (Browser)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && navigator.mediaDevices) {
      if (isRecording) {
        setIsRecording(false);
        if (webMediaRecorderRef.current && webMediaRecorderRef.current.state !== 'inactive') {
          webMediaRecorderRef.current.stop();
        }
      } else {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          webAudioChunksRef.current = [];
          const recorder = new (window as any).MediaRecorder(stream);
          webMediaRecorderRef.current = recorder;

          recorder.ondataavailable = (e: any) => {
            if (e.data && e.data.size > 0) {
              webAudioChunksRef.current.push(e.data);
            }
          };

          recorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            const audioBlob = new Blob(webAudioChunksRef.current, { type: 'audio/webm' });
            await processAndTranscribeAudio(audioBlob, 'web_recording.webm', 'audio/webm');
          };

          recorder.start(200);
          setIsRecording(true);
        } catch (err: any) {
          showMicrophonePermissionAlert(
            'Microphone access is blocked in your browser. Please allow microphone permissions to record audio.'
          );
        }
      }
      return;
    }

    // 2. Native Mobile (Android & iOS) via Embedded Audio Recorder Engine
    if (isRecording) {
      webViewRef.current?.injectJavaScript('window.stopRecording(); true;');
    } else {
      if (Platform.OS === 'android') {
        try {
          const hasPermission = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO
          );
          if (!hasPermission) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
              {
                title: 'Microphone Permission',
                message: 'GetAIPilot requires microphone access to record audio and convert speech to text.',
                buttonPositive: 'Allow',
                buttonNegative: 'Deny',
              }
            );
            if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
              showMicrophonePermissionAlert();
              return;
            }
          }
        } catch (err) {
          console.warn('[Speech-to-Text] Error checking Android permission:', err);
        }
      }

      setTranscript('');
      setSummaryBullets([]);
      setCopied(false);
      webViewRef.current?.injectJavaScript('window.startRecording(); true;');
    }
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

  // const handleShare = async () => {
  //   if (!transcript) return;
  //   try {
  //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  //     await Share.share({
  //       message: `AI Audio Transcript:\n\n${transcript}\n\nKey Takeaways:\n${summaryBullets
  //         .map((b) => `• ${b}`)
  //         .join('\n')}\n\nTranscribed with GetAiPilot AI.`,
  //     });
  //   } catch { }
  // };


  const handleShare = async () => {
    if (!transcript) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Build the .txt file content
      const fileContent = [
        'AI Audio Transcript',
        '===================',
        '',
        transcript,
        '',
        'Key Takeaways',
        '-------------',
        ...summaryBullets.map((b) => `• ${b}`),
        '',
        '---',
        'Transcribed with GetAiPilot AI.',
      ].join('\n');

      // 1. WEB: Blob + download / Web Share API
      if (Platform.OS === 'web') {
        const blob = new Blob([fileContent], { type: 'text/plain;charset=utf-8' });
        const fileName = `transcript_${Date.now()}.txt`;

        const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
        if (nav?.canShare && nav?.share) {
          try {
            const file = new File([blob], fileName, { type: 'text/plain' });
            if (nav.canShare({ files: [file] })) {
              await nav.share({
                files: [file],
                title: 'AI Audio Transcript',
                text: 'Transcribed with GetAiPilot AI.',
              });
              return;
            }
          } catch {
            // fallback to download
          }
        }

        // Fallback: trigger a download
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        return;
      }

      // 2. NATIVE (Android & iOS): Write to cache file and share
      let sharedAsFile = false;
      const fileName = 'transcript_share.txt';
      const fileUri = `${FileSystem.cacheDirectory}${fileName}`;

      try {
        await FileSystem.writeAsStringAsync(fileUri, fileContent, {
          encoding: FileSystem.EncodingType.UTF8,
        });

        const canShare = Sharing ? await Sharing.isAvailableAsync().catch(() => false) : false;
        if (canShare && Sharing) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: 'Share Transcript',
            UTI: 'public.plain-text',
          });
          sharedAsFile = true;
        }
      } catch (fileErr) {
        console.warn('[Speech-to-Text] File share notice, falling back to text share:', fileErr);
      }

      // 3. Fallback: Native text share sheet if file share failed or was unavailable
      if (!sharedAsFile) {
        await Share.share({
          message: fileContent,
          title: 'AI Audio Transcript',
        });
      }
    } catch (err: any) {
      console.warn('[Speech-to-Text] Share failed:', err);
      Alert.alert('Share Error', err?.message || 'Could not open share sheet.');
    }
  };

  return (
    <AppScreen safeArea={false} backgroundColor={theme.bg}>
      <AppTopBar title="AI Speech-to-Text" showBack={true} />



      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Recording Studio Card */}
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Voice Speech Transcriber</Text>
          <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
            Tap the microphone, speak into your device, and stop to convert your voice to clean text using OpenAI Whisper.
          </Text>

          {/* Language Selector Pills */}
          <Text style={[styles.inputLabel, { color: theme.mutedText }]}>Spoken Language:</Text>
          <View style={styles.langRow}>
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                style={[
                  styles.langPill,
                  {
                    backgroundColor: selectedLanguage === lang.code ? theme.primary : colors.background,
                    borderColor: selectedLanguage === lang.code ? theme.primary : theme.cardBorder,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedLanguage(lang.code);
                }}
              >
                <Text
                  style={[
                    styles.langPillText,
                    { color: selectedLanguage === lang.code ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Big Recording Button Chassis */}
          <View style={styles.recorderContainer}>
            {/* Animated Waveform Visualizer */}
            {isRecording && (
              <View style={styles.waveformContainer}>
                <View style={[styles.waveBar, { height: 26, backgroundColor: '#EF4444' }]} />
                <View style={[styles.waveBar, { height: 46, backgroundColor: '#EF4444' }]} />
                <View style={[styles.waveBar, { height: 20, backgroundColor: '#EF4444' }]} />
                <View style={[styles.waveBar, { height: 54, backgroundColor: '#EF4444' }]} />
                <View style={[styles.waveBar, { height: 36, backgroundColor: '#EF4444' }]} />
                <View style={[styles.waveBar, { height: 22, backgroundColor: '#EF4444' }]} />
                <View style={[styles.waveBar, { height: 48, backgroundColor: '#EF4444' }]} />
              </View>
            )}

            {/* Pulsing Mic / Stop Button */}
            {Platform.OS === 'web' ? (
              <Pressable
                style={[
                  styles.micCircleBtn,
                  {
                    backgroundColor: isRecording ? '#EF4444' : theme.primary,
                    shadowColor: isRecording ? '#EF4444' : theme.primary,
                  },
                ]}
                onPress={handleToggleRecord}
                disabled={isProcessing}
              >
                <Ionicons name={isRecording ? 'stop' : 'mic'} size={38} color="#FFFFFF" />
              </Pressable>
            ) : (
              <View style={styles.micWebViewContainer}>
                <WebView
                  ref={webViewRef}
                  source={{
                    html: getWebViewRecorderHtml(theme.primary),
                    baseUrl: 'https://localhost',
                  }}
                  originWhitelist={['*']}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  allowsInlineMediaPlayback={true}
                  mediaPlaybackRequiresUserAction={false}
                  mediaCapturePermissionGrantType="grant"
                  androidLayerType="hardware"
                  mixedContentMode="compatibility"
                  onMessage={handleWebViewMessage}
                  style={styles.micWebView}
                  scrollEnabled={false}
                  bounces={false}
                  overScrollMode="never"
                  showsHorizontalScrollIndicator={false}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            )}

            {/* Status & Live Timer */}
            <Text style={[styles.recordingTimerText, { color: isRecording ? '#EF4444' : theme.text }]}>
              {isRecording ? formatTimer(recordSeconds) : '00:00'}
            </Text>

            <Text style={[styles.recorderStatusHint, { color: theme.mutedText }]}>
              {isRecording
                ? 'Recording your voice... Tap the red button to finish'
                : isProcessing
                  ? 'Whisper AI is transcribing your speech...'
                  : 'Tap microphone to speak'}
            </Text>

            {isProcessing && (
              <View style={{ alignItems: 'center', marginTop: 14 }}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={{ fontSize: 12, color: theme.mutedText, marginTop: 6, fontWeight: '600' }}>
                  Converting speech to text with Whisper AI...
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* ── TRANSCRIPTION & AI SUMMARY RESULTS CARD ──────────────── */}
        {transcript ? (
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <View>
                <Text style={[styles.cardHeading, { color: theme.text }]}>Transcribed Output</Text>
              </View>

              {/* Segmented Switcher (Full Text vs Summary) */}
              <View style={[styles.outputTabs, { backgroundColor: colors.background }]}>
                <Pressable
                  style={[styles.outputTabBtn, activeTab === 'transcript' && { backgroundColor: theme.primary }]}
                  onPress={() => setActiveTab('transcript')}
                >
                  <Text
                    style={[
                      styles.outputTabBtnText,
                      { color: activeTab === 'transcript' ? '#FFFFFF' : theme.mutedText },
                    ]}
                  >
                    Full Text
                  </Text>
                </Pressable>

                <Pressable
                  style={[styles.outputTabBtn, activeTab === 'summary' && { backgroundColor: theme.primary }]}
                  onPress={() => setActiveTab('summary')}
                >
                  <Text
                    style={[
                      styles.outputTabBtnText,
                      { color: activeTab === 'summary' ? '#FFFFFF' : theme.mutedText },
                    ]}
                  >
                    Key Points
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Display Body */}
            {activeTab === 'transcript' ? (
              <View style={[styles.transcriptBox, { backgroundColor: colors.background, borderColor: theme.cardBorder }]}>
                <Text style={[styles.transcriptBodyText, { color: theme.text }]} selectable>
                  {transcript}
                </Text>
              </View>
            ) : (
              <View style={[styles.transcriptBox, { backgroundColor: colors.background, borderColor: theme.cardBorder }]}>
                {summaryBullets.map((bullet, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
                    <Text style={{ color: theme.primary, marginRight: 8, fontSize: 14 }}>•</Text>
                    <Text style={[styles.bulletText, { color: theme.text }]} selectable>
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Actions Bar */}
            <View style={styles.resultsActionRow}>
              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: colors.background, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                ]}
                onPress={handleCopyText}
              >
                <Ionicons name="copy-outline" size={15} color={theme.text} style={{ marginRight: 5 }} />
                <Text style={[styles.actionBtnText, { color: theme.text }]}>
                  {copied ? 'Copied to Clipboard' : 'Copy Text'}
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.actionBtn,
                  { backgroundColor: theme.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
                ]}
                onPress={handleShare}
              >
                <Ionicons name="share-social-outline" size={15} color="#FFFFFF" style={{ marginRight: 5 }} />
                <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Share Transcript</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  micWebViewContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 12,
  },
  micWebView: {
    width: 96,
    height: 96,
    backgroundColor: 'transparent',
  },
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
  cardHeading: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  langPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  langPillText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  recorderContainer: {
    alignItems: 'center',
    paddingVertical: 18,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 60,
    marginBottom: 12,
  },
  waveBar: {
    width: 6,
    borderRadius: 3,
  },
  micCircleBtn: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
    marginBottom: 12,
  },
  recordingTimerText: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  recorderStatusHint: {
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
  outputTabs: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 8,
  },
  outputTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  outputTabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  transcriptBox: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  transcriptBodyText: {
    fontSize: 13.5,
    lineHeight: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  resultsActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
});
