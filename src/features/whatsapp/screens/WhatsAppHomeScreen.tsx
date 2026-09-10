import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ConnectionStatusCard } from '../components/ConnectionStatusCard';
import { UsageCard } from '../components/UsageCard';
import { WhatsAppMetricCard } from '../components/WhatsAppMetricCard';
import { useWhatsAppBroadcasts } from '../hooks/useWhatsAppBroadcasts';
import { useWhatsAppContacts } from '../hooks/useWhatsAppContacts';
import { useWhatsAppStatus } from '../hooks/useWhatsAppStatus';
import { useWhatsAppTemplates } from '../hooks/useWhatsAppTemplates';
import { useWhatsAppUsage } from '../hooks/useWhatsAppUsage';
import { WhatsAppBroadcastsScreen } from './WhatsAppBroadcastsScreen';
import { WhatsAppContactsScreen } from './WhatsAppContactsScreen';
import { WhatsAppTemplatesScreen } from './WhatsAppTemplatesScreen';

export const WhatsAppHomeScreen: React.FC = () => {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [activeTab, setActiveTab] = useState<'home' | 'contacts' | 'templates' | 'broadcasts'>('home');

  const { data: status, isLoading: statusLoading, refetch: refetchStatus, isRefetching: statusRefetching } = useWhatsAppStatus();
  const { data: contactsData, refetch: refetchContacts } = useWhatsAppContacts({ limit: 5 });
  const { data: templates, refetch: refetchTemplates } = useWhatsAppTemplates('APPROVED');
  const { data: broadcastsData, refetch: refetchBroadcasts } = useWhatsAppBroadcasts({ limit: 3 });
  const { data: usage, isLoading: usageLoading, refetch: refetchUsage } = useWhatsAppUsage();

  const handleRefresh = async () => {
    await Promise.all([
      refetchStatus(),
      refetchContacts(),
      refetchTemplates(),
      refetchBroadcasts(),
      refetchUsage(),
    ]);
  };

  if (activeTab === 'contacts') {
    return <WhatsAppContactsScreen onBack={() => setActiveTab('home')} />;
  }

  if (activeTab === 'templates') {
    return <WhatsAppTemplatesScreen onBack={() => setActiveTab('home')} />;
  }

  if (activeTab === 'broadcasts') {
    return <WhatsAppBroadcastsScreen onBack={() => setActiveTab('home')} />;
  }

  const approvedTemplatesCount = templates?.length ?? 0;
  const totalContactsCount = contactsData?.total_count ?? 0;
  const totalBroadcastsCount = broadcastsData?.total_count ?? 0;
  const deliveryRate = usage && usage.messages_sent > 0
    ? `${Math.min(100, Math.round((usage.messages_delivered / usage.messages_sent) * 1000) / 10)}%`
    : '100.0%';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#020617' : '#f8fafc' }]}>
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>WhatsApp Business</Text>
          <Text style={styles.subtitle}>Meta Cloud Enterprise Hub</Text>
        </View>

        <Pressable
          style={styles.inboxButton}
          onPress={() => router.push('/(tabs)/inbox' as any)}
        >
          <Text style={styles.inboxButtonText}>💬 Open Inbox</Text>
        </Pressable>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={statusRefetching} onRefresh={handleRefresh} tintColor="#25d366" />
        }
      >
        {/* Connection Status Card */}
        <ConnectionStatusCard connection={status} isLoading={statusLoading} />

        {/* Cloud Wallet & Usage Card */}
        <UsageCard usage={usage} isLoading={usageLoading} />

        {/* Metrics 2x2 Grid */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Overview & Capabilities</Text>
        <View style={styles.grid}>
          <WhatsAppMetricCard
            label="Contacts"
            value={totalContactsCount.toLocaleString()}
            subtext="Synchronized audience"
            icon="👥"
          />
          <WhatsAppMetricCard
            label="Templates"
            value={approvedTemplatesCount}
            subtext="Approved by Meta"
            icon="📄"
          />
          <WhatsAppMetricCard
            label="Broadcasts"
            value={totalBroadcastsCount}
            subtext="Campaigns executed"
            icon="📢"
          />
          <WhatsAppMetricCard
            label="Delivery Rate"
            value={deliveryRate}
            subtext="Cloud SLA"
            icon="⚡"
          />
        </View>

        {/* Quick Actions Navigation */}
        <Text style={[styles.sectionTitle, { color: isDark ? '#94a3b8' : '#64748b' }]}>Product Navigation</Text>
        <View style={styles.actionsList}>
          <Pressable
            style={[styles.actionCard, isDark ? styles.actionCardDark : styles.actionCardLight]}
            onPress={() => setActiveTab('contacts')}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? '#020617' : '#f1f5f9' }]}>
              <Text style={styles.actionEmoji}>👥</Text>
            </View>
            <View style={styles.actionDetails}>
              <Text style={[styles.actionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Audience & Contacts</Text>
              <Text style={[styles.actionSub, { color: isDark ? '#64748b' : '#64748b' }]}>View contacts, segment tags & link CRM leads</Text>
            </View>
            <Text style={[styles.actionArrow, { color: isDark ? '#475569' : '#94a3b8' }]}>→</Text>
          </Pressable>

          <Pressable
            style={[styles.actionCard, isDark ? styles.actionCardDark : styles.actionCardLight]}
            onPress={() => setActiveTab('templates')}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? '#020617' : '#f1f5f9' }]}>
              <Text style={styles.actionEmoji}>📄</Text>
            </View>
            <View style={styles.actionDetails}>
              <Text style={[styles.actionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Meta Templates</Text>
              <Text style={[styles.actionSub, { color: isDark ? '#64748b' : '#64748b' }]}>Approved marketing, utility & otp message templates</Text>
            </View>
            <Text style={[styles.actionArrow, { color: isDark ? '#475569' : '#94a3b8' }]}>→</Text>
          </Pressable>

          <Pressable
            style={[styles.actionCard, isDark ? styles.actionCardDark : styles.actionCardLight]}
            onPress={() => setActiveTab('broadcasts')}
          >
            <View style={[styles.actionIcon, { backgroundColor: isDark ? '#020617' : '#f1f5f9' }]}>
              <Text style={styles.actionEmoji}>📢</Text>
            </View>
            <View style={styles.actionDetails}>
              <Text style={[styles.actionTitle, { color: isDark ? '#f8fafc' : '#0f172a' }]}>Broadcast Campaigns</Text>
              <Text style={[styles.actionSub, { color: isDark ? '#64748b' : '#64748b' }]}>Launch new bulk sends & view delivery funnels</Text>
            </View>
            <Text style={[styles.actionArrow, { color: isDark ? '#475569' : '#94a3b8' }]}>→</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerDark: {
    backgroundColor: '#0b1329',
    borderBottomColor: '#1e293b',
  },
  headerLight: {
    backgroundColor: '#ffffff',
    borderBottomColor: '#e2e8f0',
  },
  headerTitleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 12,
    color: '#25d366',
    fontWeight: '600',
  },
  inboxButton: {
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#25d366',
  },
  inboxButtonText: {
    color: '#25d366',
    fontSize: 12,
    fontWeight: '800',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  actionsList: {
    gap: 10,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
  },
  actionCardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  actionCardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionEmoji: {
    fontSize: 20,
  },
  actionDetails: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 12,
  },
  actionArrow: {
    fontSize: 16,
    fontWeight: '800',
  },
});
