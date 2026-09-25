import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  useColorScheme,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { VoiceCampaign } from '../api/voiceApi';

interface CampaignDetailsModalProps {
  visible: boolean;
  campaign: VoiceCampaign | null;
  onClose: () => void;
  onEdit: (campaign: VoiceCampaign) => void;
  onDelete: (campaignId: string) => Promise<void>;
  onStatusChange: (campaignId: string, status: 'running' | 'paused' | 'completed') => Promise<void>;
  onInspectCall?: (call: any) => void;
  isActionLoading?: boolean;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({
  visible,
  campaign,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onInspectCall,
  isActionLoading,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  if (!campaign) return null;

  const total = campaign.total_contacts || 0;
  const completed = campaign.completed_contacts || 0;
  const failed = campaign.failed_contacts || 0;
  const pending = campaign.pending_contacts ?? Math.max(0, total - completed - failed);
  const retries = campaign.retry_count ?? 1;
  const progressPct = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  const handleDelete = () => {
    Alert.alert(
      'Delete Campaign',
      `Are you sure you want to permanently delete "${campaign.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await onDelete(campaign.id);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        {/* Header */}
        <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={[styles.headerTitle, isDark && styles.textDark]} numberOfLines={1}>
              {campaign.name}
            </Text>
            <Text style={styles.headerSubtitle}>
              {campaign.category || 'Outreach'} • Created on {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'Recent'}
            </Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#000000'} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          {/* Status & Control Actions */}
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <View style={styles.statusRow}>
              <View>
                <Text style={styles.metaLabel}>CAMPAIGN LIFECYCLE</Text>
                <View style={[styles.statusPill, getStatusBadgeStyle(campaign.status)]}>
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(campaign.status) }]} />
                  <Text style={[styles.statusText, { color: getStatusColor(campaign.status) }]}>
                    {campaign.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.actionButtonsGroup}>
                {campaign.status === 'running' ? (
                  <Pressable
                    style={[styles.lifecycleBtn, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}
                    onPress={() => onStatusChange(campaign.id, 'paused')}
                    disabled={isActionLoading}
                  >
                    <Ionicons name="pause" size={14} color="#F59E0B" />
                    <Text style={[styles.lifecycleBtnText, { color: '#F59E0B' }]}>Pause</Text>
                  </Pressable>
                ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                  <Pressable
                    style={[styles.lifecycleBtn, { backgroundColor: 'rgba(48, 209, 88, 0.15)' }]}
                    onPress={() => onStatusChange(campaign.id, 'running')}
                    disabled={isActionLoading}
                  >
                    <Ionicons name="play" size={14} color="#30D158" />
                    <Text style={[styles.lifecycleBtnText, { color: '#30D158' }]}>Start</Text>
                  </Pressable>
                ) : null}

                <Pressable
                  style={[styles.lifecycleBtn, isDark ? styles.iconBtnDark : styles.iconBtnLight]}
                  onPress={() => onEdit(campaign)}
                >
                  <Ionicons name="create-outline" size={15} color={isDark ? '#FFFFFF' : '#000000'} />
                  <Text style={[styles.lifecycleBtnText, isDark && styles.textDark]}>Edit</Text>
                </Pressable>

                <Pressable
                  style={[styles.lifecycleBtn, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}
                  onPress={handleDelete}
                >
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                </Pressable>
              </View>
            </View>

            <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressHeader}>
                <Text style={styles.metaLabel}>DISPATCH PROGRESS</Text>
                <Text style={[styles.progressPctText, isDark && styles.textDark]}>{progressPct}%</Text>
              </View>
              <View style={[styles.progressBarTrack, isDark ? styles.trackDark : styles.trackLight]}>
                <View style={[styles.progressBarFill, { width: `${progressPct}%` }]} />
              </View>
            </View>
          </View>

          {/* Contact Metrics Telemetry 4-Grid */}
          <View style={styles.metricsRow}>
            <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.metricLabel}>Total Contacts</Text>
              <Text style={[styles.metricVal, isDark && styles.textDark]}>{total}</Text>
            </View>
            <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.metricLabel}>Completed</Text>
              <Text style={[styles.metricVal, { color: '#30D158' }]}>{completed}</Text>
            </View>
            <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.metricLabel}>Pending</Text>
              <Text style={[styles.metricVal, { color: '#F59E0B' }]}>{pending}</Text>
            </View>
            <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.metricLabel}>Failed / DND</Text>
              <Text style={[styles.metricVal, { color: '#EF4444' }]}>{failed}</Text>
            </View>
          </View>

          {/* Configuration Specs */}
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={styles.sectionTitle}>CAMPAIGN CONFIGURATION</Text>

            <View style={styles.configItem}>
              <View style={styles.configIconBox}>
                <Ionicons name="mic" size={16} color="#8B5CF6" />
              </View>
              <View style={styles.configContent}>
                <Text style={styles.metaLabel}>ASSIGNED VOICE AGENT</Text>
                <Text style={[styles.configValue, isDark && styles.textDark]}>
                  {campaign.assistant_name || 'Sales Representative Bot'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

            <View style={styles.configItem}>
              <View style={styles.configIconBox}>
                <Ionicons name="keypad" size={16} color="#0A84FF" />
              </View>
              <View style={styles.configContent}>
                <Text style={styles.metaLabel}>DEDICATED CALLER NUMBER</Text>
                <Text style={[styles.configValue, isDark && styles.textDark]}>
                  {campaign.phone_number || '+91 80 4735 9000 (Dedicated Pro Line)'}
                </Text>
              </View>
            </View>

            <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />

            <View style={styles.configItem}>
              <View style={styles.configIconBox}>
                <Ionicons name="refresh" size={16} color="#F59E0B" />
              </View>
              <View style={styles.configContent}>
                <Text style={styles.metaLabel}>RETRY COUNT ON UNANSWERED</Text>
                <Text style={[styles.configValue, isDark && styles.textDark]}>
                  {retries} automatic retries
                </Text>
              </View>
            </View>
          </View>

          {/* Recent Dispatched Calls in Campaign */}
          <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={styles.sectionTitle}>RECENT CAMPAIGN CALLS</Text>
            {(campaign.recent_calls || [
              { id: 'rc_1', customerNumber: '+91 98765 43210', duration: '1m 12s', status: 'completed', time: '10 mins ago' },
              { id: 'rc_2', customerNumber: '+91 98123 45678', duration: '0m 45s', status: 'completed', time: '25 mins ago' },
              { id: 'rc_3', customerNumber: '+91 99234 56789', duration: '0s', status: 'failed', time: '1 hour ago' },
            ]).map((rc, idx, arr) => (
              <View key={rc.id || idx}>
                <Pressable
                  style={styles.recentCallRow}
                  onPress={() => onInspectCall && onInspectCall(rc)}
                >
                  <View style={[styles.callStatusDot, { backgroundColor: rc.status === 'completed' ? '#30D158' : '#EF4444' }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.recentCallPhone, isDark && styles.textDark]}>{rc.customerNumber}</Text>
                    <Text style={styles.recentCallMeta}>{rc.time} • Duration: {rc.duration}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color="#8E8E93" />
                </Pressable>
                {idx < arr.length - 1 && <View style={[styles.divider, isDark ? styles.dividerDark : styles.dividerLight]} />}
              </View>
            ))}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

function getStatusColor(status: string) {
  switch (status) {
    case 'running': return '#30D158';
    case 'paused': return '#F59E0B';
    case 'completed': return '#0A84FF';
    case 'failed': return '#EF4444';
    default: return '#64748B';
  }
}

function getStatusBadgeStyle(status: string) {
  switch (status) {
    case 'running': return { backgroundColor: 'rgba(48, 209, 88, 0.15)' };
    case 'paused': return { backgroundColor: 'rgba(245, 158, 11, 0.15)' };
    case 'completed': return { backgroundColor: 'rgba(10, 132, 255, 0.15)' };
    case 'failed': return { backgroundColor: 'rgba(239, 68, 68, 0.15)' };
    default: return { backgroundColor: 'rgba(100, 116, 139, 0.15)' };
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F2F2F7' },
  containerDark: { backgroundColor: '#020617' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLight: { backgroundColor: '#FFFFFF', borderBottomColor: '#E2E8F0' },
  headerDark: { backgroundColor: '#0F172A', borderBottomColor: '#1E293B' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#000000' },
  headerSubtitle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  textDark: { color: '#F8FAFC' },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#E2E8F0' },
  closeBtnDark: { backgroundColor: '#1E293B' },
  content: { flex: 1 },
  contentContainer: { padding: 16, gap: 14, paddingBottom: 40 },
  card: { borderRadius: 16, padding: 16, borderWidth: 1 },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#0F172A', borderColor: '#1E293B' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  metaLabel: { fontSize: 10.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800' },
  actionButtonsGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lifecycleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  lifecycleBtnText: { fontSize: 12, fontWeight: '700' },
  iconBtnLight: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  iconBtnDark: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  divider: { height: 1, marginVertical: 12 },
  dividerLight: { backgroundColor: '#E2E8F0' },
  dividerDark: { backgroundColor: '#1E293B' },
  progressContainer: { gap: 6 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressPctText: { fontSize: 13, fontWeight: '700' },
  progressBarTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  trackLight: { backgroundColor: '#E2E8F0' },
  trackDark: { backgroundColor: '#1E293B' },
  progressBarFill: { height: '100%', backgroundColor: '#8B5CF6', borderRadius: 4 },
  metricsRow: { flexDirection: 'row', gap: 8 },
  metricCard: { flex: 1, borderRadius: 14, padding: 12, borderWidth: 1 },
  metricLabel: { fontSize: 10.5, color: '#64748B', fontWeight: '500', marginBottom: 4 },
  metricVal: { fontSize: 16, fontWeight: '800' },
  sectionTitle: { fontSize: 11.5, fontWeight: '700', color: '#64748B', letterSpacing: 0.5, marginBottom: 12 },
  configItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  configIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(139, 92, 246, 0.12)', justifyContent: 'center', alignItems: 'center' },
  configContent: { flex: 1 },
  configValue: { fontSize: 13.5, fontWeight: '600' },
  recentCallRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  callStatusDot: { width: 8, height: 8, borderRadius: 4 },
  recentCallPhone: { fontSize: 13.5, fontWeight: '600' },
  recentCallMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
});
