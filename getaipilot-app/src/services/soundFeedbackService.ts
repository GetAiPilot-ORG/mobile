import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { defineSound, ensureReady } from '@web-kits/audio';

export type SoundType = 'click' | 'pop' | 'success' | 'radar';

type NativeAudioDispatcher = (type: SoundType, volume: number) => void;
let nativeAudioBridgeDispatcher: NativeAudioDispatcher | null = null;

export function registerNativeAudioBridge(dispatcher: NativeAudioDispatcher) {
  nativeAudioBridgeDispatcher = dispatcher;
  return () => {
    if (nativeAudioBridgeDispatcher === dispatcher) {
      nativeAudioBridgeDispatcher = null;
    }
  };
}

/**
 * 1. Declarative Sound Synthesizers via @web-kits/audio
 * Uses Web Audio API graph with ADSR envelopes, pitch sweeps, and multi-layer synthesis.
 * Tuned with higher gain and ample duration for crisp audibility on mobile speakers.
 */
const webKitsSounds: Record<SoundType, (opts?: any) => any> = {
  click: defineSound({
    source: {
      type: 'sine',
      frequency: { start: 1400, end: 320 },
    },
    envelope: { attack: 0.001, decay: 0.05 },
    gain: 0.75,
  }),
  pop: defineSound({
    source: {
      type: 'sine',
      frequency: { start: 380, end: 1050 },
    },
    envelope: { attack: 0.005, decay: 0.065 },
    gain: 0.8,
  }),
  success: defineSound({
    layers: [
      {
        source: { type: 'sine', frequency: 1046.5 }, // C6
        envelope: { attack: 0.005, decay: 0.3 },
        gain: 0.6,
      },
      {
        source: { type: 'sine', frequency: 1318.5 }, // E6
        envelope: { attack: 0.04, decay: 0.28 },
        gain: 0.5,
      },
      {
        source: { type: 'sine', frequency: 1567.98 }, // G6
        envelope: { attack: 0.08, decay: 0.26 },
        gain: 0.45,
      },
    ],
  }),
  radar: defineSound({
    source: {
      type: 'sine',
      frequency: 1750,
    },
    envelope: { attack: 0.003, decay: 0.16 },
    gain: 0.75,
  }),
};

/**
 * 2. Procedural In-Memory WAV Fallback Generator
 * Generates lightweight 16-bit PCM WAV data URIs as offline fallbacks.
 */
function generateWavDataUri(
  generator: (time: number, index: number, sampleRate: number) => number,
  durationSeconds: number,
  sampleRate = 44100
): string {
  const totalSamples = Math.floor(sampleRate * durationSeconds);
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = totalSamples * bytesPerSample;

  const header = [
    'RIFF',
    String.fromCharCode(
      (36 + dataSize) & 0xff,
      ((36 + dataSize) >> 8) & 0xff,
      ((36 + dataSize) >> 16) & 0xff,
      ((36 + dataSize) >> 24) & 0xff
    ),
    'WAVEfmt ',
    String.fromCharCode(16, 0, 0, 0),
    String.fromCharCode(1, 0),
    String.fromCharCode(1, 0),
    String.fromCharCode(
      sampleRate & 0xff,
      (sampleRate >> 8) & 0xff,
      (sampleRate >> 16) & 0xff,
      (sampleRate >> 24) & 0xff
    ),
    String.fromCharCode(
      byteRate & 0xff,
      (byteRate >> 8) & 0xff,
      (byteRate >> 16) & 0xff,
      (byteRate >> 24) & 0xff
    ),
    String.fromCharCode(blockAlign & 0xff, (blockAlign >> 8) & 0xff),
    String.fromCharCode(16, 0),
    'data',
    String.fromCharCode(
      dataSize & 0xff,
      (dataSize >> 8) & 0xff,
      (dataSize >> 16) & 0xff,
      (dataSize >> 24) & 0xff
    ),
  ].join('');

  const sampleChars: string[] = [];
  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const s = Math.max(-1, Math.min(1, generator(t, i, sampleRate)));
    const int16 = s < 0 ? Math.floor(s * 0x8000) : Math.floor(s * 0x7fff);
    const lowByte = int16 & 0xff;
    const highByte = (int16 >> 8) & 0xff;
    sampleChars.push(String.fromCharCode(lowByte, highByte));
  }

  const binaryString = header + sampleChars.join('');
  return `data:audio/wav;base64,${toBase64(binaryString)}`;
}

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
function toBase64(str: string): string {
  if (typeof btoa === 'function') {
    try {
      return btoa(str);
    } catch {
      // Fallback
    }
  }
  let output = '';
  for (let i = 0; i < str.length; i += 3) {
    const b0 = str.charCodeAt(i);
    const b1 = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
    const b2 = i + 2 < str.length ? str.charCodeAt(i + 2) : 0;
    output += B64_CHARS[(b0 >> 2) & 0x3f];
    output += B64_CHARS[((b0 & 0x03) << 4) | ((b1 >> 4) & 0x0f)];
    output += i + 1 < str.length ? B64_CHARS[((b1 & 0x0f) << 2) | ((b2 >> 6) & 0x03)] : '=';
    output += i + 2 < str.length ? B64_CHARS[b2 & 0x3f] : '=';
  }
  return output;
}

const CLICK_WAV = generateWavDataUri((t) => {
  return Math.sin(2 * Math.PI * 1400 * t) * Math.exp(-t * 55);
}, 0.06);

const POP_WAV = generateWavDataUri((t) => {
  const freq = 380 + t * 9000;
  return Math.sin(2 * Math.PI * freq * t) * Math.exp(-t * 40);
}, 0.075);

const SUCCESS_WAV = generateWavDataUri((t) => {
  const c6 = Math.sin(2 * Math.PI * 1046.5 * t) * Math.exp(-t * 8);
  const e6 = Math.sin(2 * Math.PI * 1318.5 * Math.max(0, t - 0.04)) * Math.exp(-Math.max(0, t - 0.04) * 7);
  const g6 = Math.sin(2 * Math.PI * 1567.98 * Math.max(0, t - 0.08)) * Math.exp(-Math.max(0, t - 0.08) * 6);
  return (c6 * 0.45 + (t >= 0.04 ? e6 * 0.35 : 0) + (t >= 0.08 ? g6 * 0.3 : 0));
}, 0.34);

const RADAR_WAV = generateWavDataUri((t) => {
  return Math.sin(2 * Math.PI * 1750 * t) * Math.exp(-t * 18) * 0.85;
}, 0.17);

const SOUND_URIS: Record<SoundType, string> = {
  click: CLICK_WAV,
  pop: POP_WAV,
  success: SUCCESS_WAV,
  radar: RADAR_WAV,
};

class SoundFeedbackService {
  private isAudioEnabled = true;
  private isHapticsEnabled = true;
  private lastPlayTimestamp = 0;
  private minIntervalMs = 40; // Rate limit debouncing

  public setSoundEnabled(enabled: boolean) {
    this.isAudioEnabled = enabled;
  }

  public setHapticsEnabled(enabled: boolean) {
    this.isHapticsEnabled = enabled;
  }

  public isSoundOn() {
    return this.isAudioEnabled;
  }

  public isHapticsOn() {
    return this.isHapticsEnabled;
  }

  /**
   * Play feedback sound with @web-kits/audio synthesis & haptic coupling
   */
  public async play(
    type: SoundType = 'click',
    options?: {
      volume?: number;
      haptic?: boolean;
    }
  ) {
    const now = Date.now();
    // Rate limit check
    if (now - this.lastPlayTimestamp < this.minIntervalMs) {
      return;
    }
    this.lastPlayTimestamp = now;

    // Trigger paired haptics on native platforms
    if (this.isHapticsEnabled && options?.haptic !== false) {
      if (Platform.OS !== 'web') {
        try {
          switch (type) {
            case 'success':
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              break;
            case 'radar':
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              break;
            default:
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              break;
          }
        } catch {
          // Safe fallback
        }
      }
    }

    if (!this.isAudioEnabled) return;

    const volume = options?.volume ?? 0.85;

    // A. Native Mobile (Android & iOS): Play via Headless Web Audio Bridge
    if (Platform.OS !== 'web') {
      if (nativeAudioBridgeDispatcher) {
        nativeAudioBridgeDispatcher(type, volume);
        return;
      }
      return;
    }

    // B. Web Browser: Play directly via @web-kits/audio & Web Audio API
    try {
      if (typeof window !== 'undefined' && ((window as any).AudioContext || (window as any).webkitAudioContext)) {
        await ensureReady().catch(() => {});
        const synth = webKitsSounds[type];
        if (synth) {
          synth({ volume });
          return;
        }
      }
    } catch {
      // Fallback to HTML5 audio element
    }

    // Secondary fallback engine (HTML5 Audio with WAV)
    const uri = SOUND_URIS[type];
    if (!uri) return;

    try {
      if (typeof window !== 'undefined' && typeof (window as any).Audio !== 'undefined') {
        const audio = new (window as any).Audio(uri);
        audio.volume = volume;
        audio.play().catch(() => {});
      }
    } catch {
      // Safe guard
    }
  }
}

export const soundService = new SoundFeedbackService();
