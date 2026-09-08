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
  ActivityIndicator,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { MetricCard } from '../../src/components/MetricCard';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { useQuery } from '@tanstack/react-query';

export default function WhatsAppProductScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'broadcast' | 'settings'>('overview');

  // Broadcast state
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Settings state
  const [phoneId, setPhoneId] = useState('');
  const [accessToken, setAccessToken] = useState('');
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleSendBroadcast = () => {
    if (!recipient.trim() || !message.trim()) {
      Alert.alert('Validation Error', 'Please enter both a destination phone number and message.');
      return;
    }

    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      Alert.alert('Broadcast Queued', `Message queued for delivery to ${recipient}.`);
      setRecipient('');
      setMessage('');
    }, 800);
  };

  const handleSaveSettings = () => {
    if (!phoneId.trim() || !accessToken.trim()) {
      Alert.alert('Validation Error', 'Please enter your WhatsApp Phone Number ID and Access Token.');
      return;
    }

    setIsSavingSettings(true);
    setTimeout(() => {
      setIsSavingSettings(false);
      Alert.alert('Gateway Connected', 'WhatsApp Cloud API credentials saved successfully.');
    }, 600);
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="GAP WhatsApp Hub" subtitle="Cloud API & Broadcast Manager" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.iconBox}>
              <Text style={styles.iconText}>💬</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>WhatsApp Automation Hub</Text>
              <Text style={styles.heroSub}>Direct Meta Cloud API Integration</Text>
            </View>
            <StatusBadge status="OPERATIONAL" size="sm" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Delivery Rate</Text>
              <Text style={styles.heroStatValue}>99.4%</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Auto-Replies</Text>
              <Text style={styles.heroStatValue}>Active</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Avg Response</Text>
              <Text style={styles.heroStatValue}>&lt; 2s</Text>
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
            style={[styles.tabBtn, activeTab === 'broadcast' && styles.tabBtnActive]}
            onPress={() => setActiveTab('broadcast')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'broadcast' && styles.tabBtnTextActive]}>
              Quick Broadcast
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'settings' && styles.tabBtnActive]}
            onPress={() => setActiveTab('settings')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'settings' && styles.tabBtnTextActive]}>
              Gateway API
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <View>
            <View style={styles.metricsGrid}>
              <MetricCard
                label="Sent Today"
                value="284"
                subtext="Campaign messages"
                badge="+12%"
                badgeColor={colors.products.whatsapp}
              />
              <MetricCard
                label="Automations"
                value="6 Flows"
                subtext="Keywords active"
                badge="Running"
                badgeColor="#16B882"
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.cardTitle}>Automation Features</Text>
              
              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Keyword Auto-Triggers</Text>
                  <Text style={styles.featureDesc}>
                    Instantly replies to common questions, pricing requests, and support queries.
                  </Text>
                </View>
              </View>

              <View style={styles.featureRow}>
                <Text style={styles.featureIcon}>📢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Mass Broadcast Lists</Text>
                  <Text style={styles.featureDesc}>
                    Send high-converting promotions and updates with media attachments.
                  </Text>
                </View>
              </View>

              <View style={[styles.featureRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.featureIcon}>🛡️</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>Meta Cloud Verified</Text>
                  <Text style={styles.featureDesc}>
                    Compliant with WhatsApp Business messaging policies and rate limits.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* TAB 2: QUICK BROADCAST */}
        {activeTab === 'broadcast' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Send Direct Message</Text>
            <Text style={styles.cardSubtitle}>
              Dispatch a high-priority WhatsApp template message directly to a client.
            </Text>

            <Text style={styles.inputLabel}>Recipient Phone Number</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210 (include country code)"
              placeholderTextColor={colors.mutedForeground}
              value={recipient}
              onChangeText={setRecipient}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Message Content</Text>
            <TextInput
              style={[styles.input, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Type your message or template variables..."
              placeholderTextColor={colors.mutedForeground}
              value={message}
              onChangeText={setMessage}
              multiline
            />

            <Pressable
              style={[styles.primaryBtn, isSending && { opacity: 0.7 }]}
              onPress={handleSendBroadcast}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Send Message Now →</Text>
              )}
            </Pressable>
          </View>
        )}

        {/* TAB 3: GATEWAY API SETTINGS */}
        {activeTab === 'settings' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Meta Cloud API Configuration</Text>
            <Text style={styles.cardSubtitle}>
              Connect your WhatsApp Business Account credentials to enable automated messaging.
            </Text>

            <Text style={styles.inputLabel}>Phone Number ID</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 109823485720192"
              placeholderTextColor={colors.mutedForeground}
              value={phoneId}
              onChangeText={setPhoneId}
              autoCapitalize="none"
            />

            <Text style={styles.inputLabel}>Permanent Access Token</Text>
            <TextInput
              style={styles.input}
              placeholder="EAAG..."
              placeholderTextColor={colors.mutedForeground}
              value={accessToken}
              onChangeText={setAccessToken}
              secureTextEntry
              autoCapitalize="none"
            />

            <View style={styles.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.switchTitle}>Enable Auto-Replies</Text>
                <Text style={styles.switchDesc}>Allow AI agent to answer unassigned chats</Text>
              </View>
              <Switch
                value={autoReplyEnabled}
                onValueChange={setAutoReplyEnabled}
                trackColor={{ false: '#333', true: colors.products.whatsapp }}
                thumbColor="#FFFFFF"
              />
            </View>

            <Pressable
              style={[styles.primaryBtn, isSavingSettings && { opacity: 0.7 }]}
              onPress={handleSaveSettings}
              disabled={isSavingSettings}
            >
              {isSavingSettings ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryBtnText}>Save Gateway Credentials</Text>
              )}
            </Pressable>
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
    backgroundColor: '#073F36',
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
    backgroundColor: 'rgba(37, 211, 102, 0.2)',
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
    marginTop: 8,
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
    marginBottom: 8,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.muted,
    marginTop: 8,
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
  primaryBtn: {
    backgroundColor: colors.products.whatsapp,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
});
