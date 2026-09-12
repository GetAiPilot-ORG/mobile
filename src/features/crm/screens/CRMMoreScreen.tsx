import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '../hooks/useMembers';
import { useCrmDashboard } from '../hooks/useCrmDashboard';

interface CRMMoreScreenProps {
  onSelectSection: (section: 'contacts' | 'activities') => void;
}

export const CRMMoreScreen: React.FC<CRMMoreScreenProps> = ({ onSelectSection }) => {
  const { data: members = [] } = useMembers();
  const { data: dashboard } = useCrmDashboard();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>More CRM Modules</Text>
          <Text style={styles.subtitle}>Team directory, contacts & touchpoint analytics</Text>
        </View>

        {/* Feature Navigation Grid */}
        <View style={styles.menuList}>
          <Pressable style={styles.menuCard} onPress={() => onSelectSection('contacts')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="people" size={22} color="#3B82F6" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Contacts Directory</Text>
              <Text style={styles.menuDesc}>All leads, customers, and partners in one place</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </Pressable>

          <Pressable style={styles.menuCard} onPress={() => onSelectSection('activities')}>
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="time" size={22} color="#F59E0B" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={styles.menuTitle}>Activity Stream</Text>
              <Text style={styles.menuDesc}>Unified log of calls, meetings, notes & follow-ups</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </Pressable>
        </View>

        {/* Team Members Section */}
        <View style={styles.sectionBlock}>
          <Text style={styles.sectionTitle}>CRM Team ({members.length})</Text>

          <View style={styles.membersList}>
            {members.map((m) => (
              <View key={m.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(m.name?.[0] || 'U').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberEmail}>{m.email}</Text>
                </View>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{m.role || 'Sales Rep'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Highlights */}
        {dashboard?.stats ? (
          <View style={styles.sectionBlock}>
            <Text style={styles.sectionTitle}>Performance Snapshot</Text>
            <View style={styles.snapshotGrid}>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Total Contacts</Text>
                <Text style={styles.snapshotVal}>{dashboard.stats.totalContacts}</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Active Deals</Text>
                <Text style={styles.snapshotVal}>{dashboard.stats.openDeals}</Text>
              </View>
              <View style={styles.snapshotCard}>
                <Text style={styles.snapshotLabel}>Won Value</Text>
                <Text style={styles.snapshotVal}>₹{dashboard.stats.wonDealValueThisMonth.toLocaleString()}</Text>
              </View>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F1015',
  },
  scroll: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  header: {
    paddingVertical: 14,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  menuList: {
    gap: 12,
    marginBottom: 24,
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuInfo: {
    flex: 1,
  },
  menuTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  menuDesc: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  membersList: {
    gap: 8,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181A20',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#262A34',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    color: '#3B82F6',
    fontSize: 14,
    fontWeight: '700',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  memberEmail: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  roleBadge: {
    backgroundColor: '#262A34',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    color: '#D1D5DB',
    fontSize: 11,
    fontWeight: '500',
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  snapshotCard: {
    flex: 1,
    backgroundColor: '#181A20',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#262A34',
  },
  snapshotLabel: {
    color: '#9CA3AF',
    fontSize: 11,
  },
  snapshotVal: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
