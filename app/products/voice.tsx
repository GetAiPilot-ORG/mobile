import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { MetricCard } from '../../src/components/MetricCard';
import { colors } from '../../src/theme/colors';

export default function VoiceProductScreen() {
  const [activeTab, setActiveTab] = useState<'overview' | 'agent' | 'logs'>('overview');
  const [agentName, setAgentName] = useState('Sarah - Lead Qualifier');
  const [promptInstructions, setPromptInstructions] = useState(
    'You are a friendly sales development representative for GetAIPilot. Greet the customer, ask about their automation needs, and book a follow-up demo.'
  );
  const [voiceGender, setVoiceGender] = useState<'female' | 'male'>('female');
  const [isLiveActive, setIsLiveActive] = useState(true);

  const handleTestCall = () => {
    Alert.alert(
      'Simulate AI Voice Call',
      'Initiate an AI test phone call to verify prompt responsiveness and latency.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Test Call',
          onPress: () => {
            Alert.alert('Call Connected', '🎙️ AI Voice Agent is active. Response latency: 420ms.');
          },
        },
      ]
    );
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="GAP AI Voice Pilot" subtitle="Conversational Telecalling Agent" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: '#2E1065' }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(139, 92, 246, 0.25)' }]}>
              <Text style={styles.iconText}>🎙️</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Autonomous Voice Agent</Text>
              <Text style={styles.heroSub}>Sub-second latency voice model</Text>
            </View>
            <StatusBadge status="ACTIVE" size="sm" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Avg Latency</Text>
              <Text style={styles.heroStatValue}>420ms</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Minutes Used</Text>
              <Text style={styles.heroStatValue}>48 / 500</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Success Rate</Text>
              <Text style={[styles.heroStatValue, { color: '#8B5CF6' }]}>94.2%</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'overview' && styles.tabBtnActive]}
            onPress={() => setActiveTab('overview')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'overview' && styles.tabBtnTextActive]}>
              Overview
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'agent' && styles.tabBtnActive]}
            onPress={() => setActiveTab('agent')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'agent' && styles.tabBtnTextActive]}>
              Agent Prompt
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'logs' && styles.tabBtnActive]}
            onPress={() => setActiveTab('logs')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'logs' && styles.tabBtnTextActive]}>
              Call History
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View>
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Total Calls"
                value="112"
                subtext="This month"
                badge="+24%"
                badgeColor={colors.products.voice}
              />
              <MetricCard
                label="Conversion"
                value="28%"
                subtext="Demo scheduled"
                badge="High"
                badgeColor="#16B882"
              />
            </View>

            <Pressable style={styles.testCallBtn} onPress={handleTestCall}>
              <Text style={styles.testCallBtnText}>📞 Launch Test Simulation Call</Text>
            </Pressable>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Agent Capabilities</Text>
              
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>🗣️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Natural Speech Synthesis</Text>
                  <Text style={styles.featureDesc}>
                    Fluid tone with human-like breathing, interruptions, and contextual adaptation.
                  </Text>
                </View>
              </View>

              <View style={[styles.featureRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.featureIcon}>📝</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Automatic Call Summarization</Text>
                  <Text style={styles.featureDesc}>
                    Extracts key intent, email addresses, and schedule times to CRM instantly.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: AGENT PROMPT */}
        {activeTab === 'agent' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Configure Voice Persona</Text>
            <Text style={styles.cardSubtitle}>
              Customize the personality, voice model, and conversation guidelines for your agent.
            </Text>

            <Text style={styles.inputLabel}>Agent Identity Name</Text>
            <TextInput
              style={styles.input}
              value={agentName}
              onChangeText={setAgentName}
              placeholder="e.g. Maya - Support Specialist"
            />

            <Text style={styles.inputLabel}>System Prompt Instructions</Text>
            <TextInput
              style={[styles.input, { height: 110, textAlignVertical: 'top' }]}
              value={promptInstructions}
              onChangeText={setPromptInstructions}
              multiline
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Live Inbound Listening</Text>
                <Text style={styles.switchDesc}>Answer incoming telephone calls immediately</Text>
              </View>
              <Switch
                value={isLiveActive}
                onValueChange={setIsLiveActive}
                trackColor={{ false: '#333', true: colors.products.voice }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable
              style={styles.saveBtn}
              onPress={() => Alert.alert('Saved', 'AI Agent prompt configuration updated.')}
            >
              <Text style={styles.saveBtnText}>Save Agent Persona</Text>
            </Pressable>
          </View>
        )}

        {/* TAB 3: CALL HISTORY */}
        {activeTab === 'logs' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Recent Telecalls</Text>
            <Text style={styles.cardSubtitle}>Real-time transcriptions & sentiment tags.</Text>

            {[
              { phone: '+91 98402 11029', duration: '2m 14s', outcome: 'Demo Booked', score: 'Positive' },
              { phone: '+1 (555) 019-2834', duration: '1m 08s', outcome: 'Follow Up Requested', score: 'Neutral' },
              { phone: '+91 88201 92837', duration: '3m 45s', outcome: 'Pricing Inquired', score: 'Positive' },
            ].map((call, idx) => (
              <View key={idx} style={styles.callRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.callPhone}>{call.phone}</Text>
                  <Text style={styles.callMeta}>Duration: {call.duration} • {call.outcome}</Text>
                </View>
                <View style={styles.sentimentBadge}>
                  <Text style={styles.sentimentText}>{call.score}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  heroTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginVertical: 14,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  heroStatItem: {
    alignItems: 'center',
  },
  heroStatLabel: {
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  heroStatValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  tabBtnTextActive: {
    color: colors.primaryForeground,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  testCallBtn: {
    backgroundColor: colors.products.voice,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  testCallBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
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
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: colors.mutedForeground,
    lineHeight: 17,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  featureIcon: {
    fontSize: 18,
    marginRight: 12,
    marginTop: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  featureDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
    marginTop: 6,
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
    marginBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
    marginTop: 4,
    marginBottom: 12,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  switchDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveBtnText: {
    color: colors.primaryForeground,
    fontWeight: '800',
    fontSize: 14,
  },
  callRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  callPhone: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  callMeta: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  sentimentBadge: {
    backgroundColor: 'rgba(22, 184, 130, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sentimentText: {
    color: '#16B882',
    fontWeight: '800',
    fontSize: 11,
  },
});
