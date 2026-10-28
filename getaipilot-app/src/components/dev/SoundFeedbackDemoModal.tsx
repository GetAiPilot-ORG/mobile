import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon } from '@/constants/icons';
import { soundService, SoundType } from '../../services/soundFeedbackService';

interface SoundDemoModalProps {
  visible: boolean;
  onClose: () => void;
  isDark: boolean;
}

export function SoundFeedbackDemoModal({
  visible,
  onClose,
  isDark,
}: SoundDemoModalProps) {
  const [soundEnabled, setSoundEnabled] = useState(soundService?.isSoundOn?.() ?? true);
  const [hapticsEnabled, setHapticsEnabled] = useState(soundService?.isHapticsOn?.() ?? true);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);

  const handleToggleSound = (val: boolean) => {
    setSoundEnabled(val);
    soundService.setSoundEnabled(val);
  };

  const handleToggleHaptics = (val: boolean) => {
    setHapticsEnabled(val);
    soundService.setHapticsEnabled(val);
  };

  const handleTestSound = (type: SoundType, name: string) => {
    soundService.play(type);
    setLastPlayed(name);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: isDark ? '#13141F' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.headerTitleCol}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <View style={styles.badgePill}>
                  <Text style={styles.badgePillText}>TEAM LEAD EVALUATION SUITE</Text>
                </View>
                <View style={[styles.badgePill, { backgroundColor: 'rgba(56, 189, 248, 0.15)', borderColor: 'rgba(56, 189, 248, 0.35)' }]}>
                  <Text style={[styles.badgePillText, { color: '#38BDF8' }]}>@web-kits/audio</Text>
                </View>
              </View>
              <Text style={[styles.mainTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                Button Audio & Haptic Feedback
              </Text>
              <Text style={[styles.mainSubtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                Interactive live demo to evaluate audio UX in GetAiPilot
              </Text>
            </View>

            <TouchableOpacity
              onPress={onClose}
              hitSlop={8}
              style={[
                styles.closeBtn,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)' },
              ]}
            >
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={16}
                color={isDark ? '#FFFFFF' : '#0F172A'}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Control Toggles: Audio & Haptics */}
            <View
              style={[
                styles.controlsCard,
                {
                  backgroundColor: isDark ? '#1C1D2D' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                },
              ]}
            >
              <View style={styles.controlRow}>
                <View style={styles.controlTextCol}>
                  <Text style={[styles.controlLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Sound Effects (Audio)
                  </Text>
                  <Text style={styles.controlDesc}>
                    Audible tone on button presses
                  </Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={handleToggleSound}
                  trackColor={{ false: '#475569', true: '#8B5CF6' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View style={[styles.divider, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]} />

              <View style={styles.controlRow}>
                <View style={styles.controlTextCol}>
                  <Text style={[styles.controlLabel, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                    Haptic Vibrations
                  </Text>
                  <Text style={styles.controlDesc}>
                    Tactile motor feedback (expo-haptics)
                  </Text>
                </View>
                <Switch
                  value={hapticsEnabled}
                  onValueChange={handleToggleHaptics}
                  trackColor={{ false: '#475569', true: '#10B981' }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Device Volume Check Advisory */}
            <View
              style={[
                styles.advisoryBanner,
                {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : 'rgba(14, 165, 233, 0.08)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(14, 165, 233, 0.2)',
                },
              ]}
            >
              <Text style={styles.advisoryIcon}>🔊</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.advisoryTitle, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                  Device Speaker Check
                </Text>
                <Text style={[styles.advisoryBody, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Ensure your phone's <Text style={{ fontWeight: '700' }}>Media Volume</Text> is turned up and physical Silent/Mute switch is disabled.
                </Text>
              </View>
            </View>

            {/* Live Interactive Sound Test Section */}
            <Text style={[styles.sectionHeading, { color: isDark ? '#E2E8F0' : '#1E293B' }]}>
              1. Live Auditory Profiles (Tap to Test)
            </Text>

            <View style={styles.buttonsGrid}>
              {/* Profile A: Mechanical Click */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleTestSound('click', 'Mechanical Switch Click')}
                style={[
                  styles.soundTestBtn,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F1F5F9',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
                  },
                ]}
              >
                <Text style={styles.soundEmoji}>🔘</Text>
                <Text style={[styles.btnTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
                  Mechanical Click
                </Text>
                <Text style={styles.btnTag}>1400Hz Tactile Chirp (55ms)</Text>
                <Text style={styles.btnDesc}>Standard navigation & tile taps</Text>
              </TouchableOpacity>

              {/* Profile B: Soft Water Pop */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleTestSound('pop', 'Soft Water Pop')}
                style={[
                  styles.soundTestBtn,
                  {
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.08)' : '#F0F9FF',
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : '#BAE6FD',
                  },
                ]}
              >
                <Text style={styles.soundEmoji}>💧</Text>
                <Text style={[styles.btnTitle, { color: isDark ? '#38BDF8' : '#0284C7' }]}>
                  Soft Water Pop
                </Text>
                <Text style={styles.btnTag}>380Hz ➔ 1050Hz Glide (70ms)</Text>
                <Text style={styles.btnDesc}>Playful micro-interactions</Text>
              </TouchableOpacity>

              {/* Profile C: Milestone Celebration Chime */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleTestSound('success', 'Milestone Chime')}
                style={[
                  styles.soundTestBtn,
                  {
                    backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                    borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
                  },
                ]}
              >
                <Text style={styles.soundEmoji}>🎉</Text>
                <Text style={[styles.btnTitle, { color: isDark ? '#34D399' : '#059669' }]}>
                  Milestone Chime
                </Text>
                <Text style={styles.btnTag}>C6 + E6 + G6 Triad (320ms)</Text>
                <Text style={styles.btnDesc}>Deal won / Workflow published</Text>
              </TouchableOpacity>

              {/* Profile D: AI Radar Ping */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handleTestSound('radar', 'AI Radar Ping')}
                style={[
                  styles.soundTestBtn,
                  {
                    backgroundColor: isDark ? 'rgba(168, 85, 247, 0.08)' : '#FAF5FF',
                    borderColor: isDark ? 'rgba(168, 85, 247, 0.25)' : '#E9D5FF',
                  },
                ]}
              >
                <Text style={styles.soundEmoji}>📡</Text>
                <Text style={[styles.btnTitle, { color: isDark ? '#C084FC' : '#7C3AED' }]}>
                  AI Radar Ping
                </Text>
                <Text style={styles.btnTag}>1750Hz Telemetry Ping (160ms)</Text>
                <Text style={styles.btnDesc}>Voice AI / Agent active pulse</Text>
              </TouchableOpacity>
            </View>

            {lastPlayed && (
              <View style={styles.statusToast}>
                <Text style={styles.statusToastText}>
                  ▶ Played: <Text style={{ fontWeight: '700' }}>{lastPlayed}</Text>
                </Text>
              </View>
            )}

            {/* Section 2: Executive UX Guide for Team Lead */}
            <Text style={[styles.sectionHeading, { color: isDark ? '#E2E8F0' : '#1E293B', marginTop: 18 }]}>
              2. Architectural Analysis: Why or Why Not?
            </Text>

            {/* Why USE Card */}
            <View
              style={[
                styles.rationaleCard,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.08)' : '#F0FDF4',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.25)' : '#BBF7D0',
                },
              ]}
            >
              <Text style={[styles.rationaleTitle, { color: isDark ? '#34D399' : '#059669' }]}>
                ✅ When Sound IS Good (Actual Use Cases)
              </Text>
              <Text style={[styles.bulletPoint, { color: isDark ? '#D1FAE5' : '#14532D' }]}>
                • <Text style={{ fontWeight: '700' }}>Sensory Confirmation:</Text> Reassures the user that a request was sent before API latency finishes.
              </Text>
              <Text style={[styles.bulletPoint, { color: isDark ? '#D1FAE5' : '#14532D' }]}>
                • <Text style={{ fontWeight: '700' }}>Dopamine Milestones:</Text> Great for celebrating positive achievements like winning a deal in CRM, publishing a campaign, or receiving a referral payout (like Stripe or Apple Pay).
              </Text>
              <Text style={[styles.bulletPoint, { color: isDark ? '#D1FAE5' : '#14532D' }]}>
                • <Text style={{ fontWeight: '700' }}>Eyes-Free / Voice AI:</Text> When users talk to the Voice AI agent and aren’t watching the screen, auditory pings confirm connection and listening states.
              </Text>
            </View>

            {/* Why NOT Use Card */}
            <View
              style={[
                styles.rationaleCard,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEF2F2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.25)' : '#FECACA',
                  marginTop: 10,
                },
              ]}
            >
              <Text style={[styles.rationaleTitle, { color: isDark ? '#F87171' : '#DC2626' }]}>
                ❌ Why NOT Use Sound on Every Button
              </Text>
              <Text style={[styles.bulletPoint, { color: isDark ? '#FEE2E2' : '#7F1D1D' }]}>
                • <Text style={{ fontWeight: '700' }}>Office & Workplace Friction:</Text> B2B operators check CRM/telemetry in meetings, desks, and calls. Constant clicking causes embarrassment.
              </Text>
              <Text style={[styles.bulletPoint, { color: isDark ? '#FEE2E2' : '#7F1D1D' }]}>
                • <Text style={{ fontWeight: '700' }}>Rapid Click Fatigue:</Text> After 50 clicks in a dashboard session, repetitive mechanical sound becomes annoying.
              </Text>
              <Text style={[styles.bulletPoint, { color: isDark ? '#FEE2E2' : '#7F1D1D' }]}>
                • <Text style={{ fontWeight: '700' }}>Media & Music Clutter:</Text> Conflicts with background music or podcasts playing on the device.
              </Text>
            </View>

            {/* Recommended Industry Decision */}
            <View
              style={[
                styles.recommendationCard,
                {
                  backgroundColor: isDark ? '#23153C' : '#F5F3FF',
                  borderColor: isDark ? '#7C3AED' : '#C4B5FD',
                  marginTop: 12,
                },
              ]}
            >
              <Text style={styles.recBadge}>RECOMMENDED INDUSTRY CONSENSUS</Text>
              <Text style={[styles.recTitle, { color: isDark ? '#FFFFFF' : '#1E1B4B' }]}>
                Hybrid Model (The Stripe / Linear Pattern)
              </Text>
              <Text style={[styles.recBody, { color: isDark ? '#E9D5FF' : '#4338CA' }]}>
                1. Use <Text style={{ fontWeight: '700' }}>Haptics (expo-haptics)</Text> for 95% of standard button presses (silent, physical, latency-free).{'\n'}
                2. Reserve <Text style={{ fontWeight: '700' }}>Sound Chimes</Text> exclusively for critical success milestones (Deal Won, Engine Deployed).{'\n'}
                3. Always provide an explicit toggle in <Text style={{ fontWeight: '700' }}>Settings ➔ Sound Effects</Text> and respect device mute switches.
              </Text>
            </View>

            <View style={{ height: 30 }} />
          </ScrollView>

          {/* Dismiss Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={styles.doneBtn}
          >
            <Text style={styles.doneBtnText}>Close Evaluation Suite</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8,
  },
  headerTitleCol: {
    flex: 1,
    gap: 4,
  },
  badgePill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(139, 92, 246, 0.18)',
    borderWidth: 0.8,
    borderColor: 'rgba(139, 92, 246, 0.35)',
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A78BFA',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  mainSubtitle: {
    fontSize: 12,
    lineHeight: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    maxHeight: 520,
  },
  controlsCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
    gap: 10,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlTextCol: {
    flex: 1,
    gap: 2,
  },
  controlLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  controlDesc: {
    fontSize: 11,
    color: '#64748B',
  },
  divider: {
    height: 1,
    width: '100%',
  },
  advisoryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  advisoryIcon: {
    fontSize: 20,
  },
  advisoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2,
  },
  advisoryBody: {
    fontSize: 11,
    lineHeight: 15,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  buttonsGrid: {
    gap: 8,
  },
  soundTestBtn: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 2,
  },
  soundEmoji: {
    fontSize: 18,
    marginBottom: 2,
  },
  btnTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  btnTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  btnDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  statusToast: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    alignSelf: 'center',
  },
  statusToastText: {
    fontSize: 11,
    color: '#A78BFA',
  },
  rationaleCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 4,
  },
  rationaleTitle: {
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  bulletPoint: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  recommendationCard: {
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 14,
    gap: 4,
  },
  recBadge: {
    fontSize: 9,
    fontWeight: '900',
    color: '#C084FC',
    letterSpacing: 0.6,
  },
  recTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  recBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  doneBtn: {
    marginTop: 12,
    backgroundColor: '#8B5CF6',
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
