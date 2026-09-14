import React from 'react';
import { StyleSheet, Text, View, ScrollView, Pressable, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useMembers } from '../hooks/useMembers';
import { useCrmDashboard } from '../hooks/useCrmDashboard';

interface CRMMoreScreenProps {
  onSelectSection: (section: 'contacts' | 'activities') => void;
}

export const CRMMoreScreen: React.FC<CRMMoreScreenProps> = ({ onSelectSection }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { data: members = [] } = useMembers();
  const { data: dashboard } = useCrmDashboard();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#0F1015' : '#F8FAFC' }]} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>More CRM Modules</Text>
          <Text style={[styles.subtitle, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Team directory, contacts & touchpoint analytics</Text>
        </View>

        {/* Feature Navigation Grid */}
        <View style={styles.menuList}>
          <Pressable
            style={[styles.menuCard, isDark ? styles.cardDark : styles.cardLight]}
            onPress={() => onSelectSection('contacts')}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
              <Ionicons name="people" size={22} color="#3B82F6" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Contacts Directory</Text>
              <Text style={[styles.menuDesc, { color: isDark ? '#9CA3AF' : '#64748B' }]}>All leads, customers, and partners in one place</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#6B7280' : '#94A3B8'} />
          </Pressable>

          <Pressable
            style={[styles.menuCard, isDark ? styles.cardDark : styles.cardLight]}
            onPress={() => onSelectSection('activities')}
          >
            <View style={[styles.menuIcon, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
              <Ionicons name="time" size={22} color="#F59E0B" />
            </View>
            <View style={styles.menuInfo}>
              <Text style={[styles.menuTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Activity Stream</Text>
              <Text style={[styles.menuDesc, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Unified log of calls, meetings, notes & follow-ups</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={isDark ? '#6B7280' : '#94A3B8'} />
          </Pressable>
        </View>

        {/* Team Members Section */}
        <View style={styles.sectionBlock}>
          <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>CRM Team ({members.length})</Text>

          <View style={styles.membersList}>
            {members.map((m) => (
              <View key={m.id} style={[styles.memberCard, isDark ? styles.cardDark : styles.cardLight]}>
                <View style={[styles.memberAvatar, { backgroundColor: isDark ? '#262A34' : '#E2E8F0' }]}>
                  <Text style={styles.memberAvatarText}>
                    {(m.name?.[0] || 'U').toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={[styles.memberName, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>{m.name}</Text>
                  <Text style={[styles.memberEmail, { color: isDark ? '#9CA3AF' : '#64748B' }]}>{m.email}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: isDark ? '#262A34' : '#F1F5F9' }]}>
                  <Text style={[styles.roleText, { color: isDark ? '#D1D5DB' : '#475569' }]}>{m.role || 'Sales Rep'}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Highlights */}
        {dashboard?.stats ? (
          <View style={styles.sectionBlock}>
            <Text style={[styles.sectionTitle, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>Performance Snapshot</Text>
            <View style={styles.snapshotGrid}>
              <View style={[styles.snapshotCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.snapshotLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Total Contacts</Text>
                <Text style={[styles.snapshotVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>{dashboard.stats.totalContacts}</Text>
              </View>
              <View style={[styles.snapshotCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.snapshotLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Active Deals</Text>
                <Text style={[styles.snapshotVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>{dashboard.stats.openDeals}</Text>
              </View>
              <View style={[styles.snapshotCard, isDark ? styles.cardDark : styles.cardLight]}>
                <Text style={[styles.snapshotLabel, { color: isDark ? '#9CA3AF' : '#64748B' }]}>Won Value</Text>
                <Text style={[styles.snapshotVal, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>₹{dashboard.stats.wonDealValueThisMonth.toLocaleString()}</Text>
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
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
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
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: '#181A20',
    borderColor: '#262A34',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
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
    fontSize: 16,
    fontWeight: '600',
  },
  menuDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  sectionTitle: {
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
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
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
    fontSize: 14,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: 12,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '500',
  },
  snapshotGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  snapshotCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  snapshotLabel: {
    fontSize: 11,
  },
  snapshotVal: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
});
