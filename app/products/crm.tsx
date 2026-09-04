import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  Linking,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { StatusBadge } from '../../src/components/StatusBadge';
import { MetricCard } from '../../src/components/MetricCard';
import { colors } from '../../src/theme/colors';
import { useAuth } from '../../src/contexts/AuthContext';

interface LeadItem {
  id: string;
  name: string;
  company: string;
  value: string;
  stage: 'Lead' | 'Contacted' | 'Qualified' | 'Closed';
  phone: string;
}

export default function CRMProductScreen() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'pipeline' | 'new-lead' | 'contacts'>('pipeline');
  const [selectedStage, setSelectedStage] = useState<string>('All');

  // New lead form
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadValue, setLeadValue] = useState('');

  const [leads, setLeads] = useState<LeadItem[]>([
    { id: '1', name: 'Rajesh Kumar', company: 'Apex Real Estate', value: '₹45,000', stage: 'Qualified', phone: '+919840123456' },
    { id: '2', name: 'Dr. Sarah Jenkins', company: 'Zenith Healthtech', value: '₹1,20,000', stage: 'Lead', phone: '+14155552671' },
    { id: '3', name: 'Vikram Mehta', company: 'Mehta Logistics', value: '₹80,000', stage: 'Contacted', phone: '+919882233445' },
    { id: '4', name: 'Elena Rostova', company: 'Nordic AI Solutions', value: '₹2,50,000', stage: 'Closed', phone: '+447911123456' },
  ]);

  const handleAddLead = () => {
    if (!leadName.trim() || !leadPhone.trim()) {
      Alert.alert('Validation Error', 'Please enter lead name and contact phone number.');
      return;
    }

    const newLead: LeadItem = {
      id: String(Date.now()),
      name: leadName,
      company: leadCompany || 'Independent',
      phone: leadPhone,
      value: leadValue ? `₹${leadValue}` : '₹50,000',
      stage: 'Lead',
    };

    setLeads([newLead, ...leads]);
    setLeadName('');
    setLeadCompany('');
    setLeadPhone('');
    setLeadValue('');
    setActiveTab('pipeline');
    Alert.alert('Lead Created', 'New prospective client added to your CRM pipeline.');
  };

  const handleActionWhatsApp = (phone: string) => {
    const clean = phone.replace(/[^0-9]/g, '');
    Linking.openURL(`https://wa.me/${clean}?text=Hi!%20Connecting%20from%20GetAIPilot.`);
  };

  const handleActionCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const filteredLeads =
    selectedStage === 'All'
      ? leads
      : leads.filter((l) => l.stage === selectedStage);

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="GAP Smart CRM" subtitle="Pipelines & Lead Conversions" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero Card */}
        <View style={[styles.heroCard, { backgroundColor: '#78350F' }]}>
          <View style={styles.heroHeader}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(245, 158, 11, 0.25)' }]}>
              <Text style={styles.iconText}>📊</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.heroTitle}>Smart Lead Pipeline</Text>
              <Text style={styles.heroSub}>Omnichannel Contact Management</Text>
            </View>
            <StatusBadge status="ACTIVE" size="sm" />
          </View>

          <View style={styles.heroDivider} />

          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Pipeline Value</Text>
              <Text style={styles.heroStatValue}>₹4.95L</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Active Leads</Text>
              <Text style={styles.heroStatValue}>{leads.length}</Text>
            </View>
            <View style={styles.heroStatItem}>
              <Text style={styles.heroStatLabel}>Win Rate</Text>
              <Text style={[styles.heroStatValue, { color: '#F59E0B' }]}>32%</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabsContainer}>
          <Pressable
            style={[styles.tabBtn, activeTab === 'pipeline' && styles.tabBtnActive]}
            onPress={() => setActiveTab('pipeline')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'pipeline' && styles.tabBtnTextActive]}>
              Pipeline
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'new-lead' && styles.tabBtnActive]}
            onPress={() => setActiveTab('new-lead')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'new-lead' && styles.tabBtnTextActive]}>
              + Add Lead
            </Text>
          </Pressable>
          <Pressable
            style={[styles.tabBtn, activeTab === 'contacts' && styles.tabBtnActive]}
            onPress={() => setActiveTab('contacts')}
          >
            <Text style={[styles.tabBtnText, activeTab === 'contacts' && styles.tabBtnTextActive]}>
              Contacts
            </Text>
          </Pressable>
        </View>

        {/* TAB 1: PIPELINE */}
        {activeTab === 'pipeline' && (
          <View>
            {/* Stage filter pills */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stageScroll}>
              {['All', 'Lead', 'Contacted', 'Qualified', 'Closed'].map((s) => (
                <Pressable
                  key={s}
                  style={[styles.stageChip, selectedStage === s && styles.stageChipActive]}
                  onPress={() => setSelectedStage(s)}
                >
                  <Text style={[styles.stageText, selectedStage === s && styles.stageTextActive]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.leadsList}>
              {filteredLeads.map((item) => (
                <View key={item.id} style={styles.leadCard}>
                  <View style={styles.leadTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.leadName}>{item.name}</Text>
                      <Text style={styles.leadCompany}>{item.company}</Text>
                    </View>
                    <View style={styles.stageBadge}>
                      <Text style={styles.stageBadgeText}>{item.stage}</Text>
                    </View>
                  </View>

                  <View style={styles.leadDivider} />

                  <View style={styles.leadBottom}>
                    <Text style={styles.leadValue}>Deal: {item.value}</Text>
                    <View style={styles.leadActions}>
                      <Pressable
                        style={styles.actionBtnWa}
                        onPress={() => handleActionWhatsApp(item.phone)}
                      >
                        <Text style={styles.actionBtnText}>WhatsApp</Text>
                      </Pressable>
                      <Pressable
                        style={styles.actionBtnCall}
                        onPress={() => handleActionCall(item.phone)}
                      >
                        <Text style={styles.actionBtnText}>Call</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* TAB 2: ADD LEAD */}
        {activeTab === 'new-lead' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Create New Opportunity</Text>
            <Text style={styles.cardSubtitle}>
              Capture contact information and estimated deal size for your CRM.
            </Text>

            <Text style={styles.inputLabel}>Prospect / Lead Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Anand Sharma"
              placeholderTextColor={colors.mutedForeground}
              value={leadName}
              onChangeText={setLeadName}
            />

            <Text style={styles.inputLabel}>Organization / Company</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Sharma Textiles Ltd"
              placeholderTextColor={colors.mutedForeground}
              value={leadCompany}
              onChangeText={setLeadCompany}
            />

            <Text style={styles.inputLabel}>Contact Phone (with country code)</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 98765 43210"
              placeholderTextColor={colors.mutedForeground}
              value={leadPhone}
              onChangeText={setLeadPhone}
              keyboardType="phone-pad"
            />

            <Text style={styles.inputLabel}>Estimated Deal Amount (INR)</Text>
            <TextInput
              style={styles.input}
              placeholder="50000"
              placeholderTextColor={colors.mutedForeground}
              value={leadValue}
              onChangeText={setLeadValue}
              keyboardType="numeric"
            />

            <Pressable style={styles.createBtn} onPress={handleAddLead}>
              <Text style={styles.createBtnText}>Save Lead into Pipeline →</Text>
            </Pressable>
          </View>
        )}

        {/* TAB 3: CONTACTS */}
        {activeTab === 'contacts' && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Client Directory</Text>
            <Text style={styles.cardSubtitle}>All verified accounts and contact records.</Text>

            {leads.map((c) => (
              <View key={c.id} style={styles.contactRow}>
                <View style={styles.contactAvatar}>
                  <Text style={styles.contactAvatarText}>{c.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.contactName}>{c.name}</Text>
                  <Text style={styles.contactSub}>{c.company} • {c.phone}</Text>
                </View>
                <Pressable
                  style={styles.contactMsgBtn}
                  onPress={() => handleActionWhatsApp(c.phone)}
                >
                  <Text style={styles.contactMsgText}>Chat</Text>
                </Pressable>
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
  stageScroll: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  stageChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stageChipActive: {
    backgroundColor: colors.products.crm,
    borderColor: colors.products.crm,
  },
  stageText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  stageTextActive: {
    color: '#FFFFFF',
  },
  leadsList: {
    gap: 10,
  },
  leadCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  leadTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  leadCompany: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  stageBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stageBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.products.crm,
  },
  leadDivider: {
    height: 1,
    backgroundColor: colors.muted,
    marginVertical: 10,
  },
  leadBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leadValue: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.foreground,
  },
  leadActions: {
    flexDirection: 'row',
    gap: 6,
  },
  actionBtnWa: {
    backgroundColor: colors.products.whatsapp,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnCall: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
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
  createBtn: {
    backgroundColor: colors.products.crm,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.muted,
  },
  contactAvatar: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  contactAvatarText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.products.crm,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.foreground,
  },
  contactSub: {
    fontSize: 11.5,
    color: colors.mutedForeground,
    marginTop: 1,
  },
  contactMsgBtn: {
    backgroundColor: colors.muted,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  contactMsgText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.foreground,
  },
});
