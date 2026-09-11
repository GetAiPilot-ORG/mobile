import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface TrackerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const TrackerModal: React.FC<TrackerModalProps> = ({ visible, onClose }) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [campaign, setCampaign] = useState('Instagram_Reel_Traffic');
  const [source, setSource] = useState('meta_ads');
  const [generatedLink, setGeneratedLink] = useState('https://t.me/GetAiPilotOfficialBot?start=c_ig_traffic_42');

  const handleGenerate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setGeneratedLink(`https://t.me/GetAiPilotOfficialBot?start=c_${campaign.toLowerCase()}_${Date.now().toString().slice(-4)}`);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, isDark ? styles.containerDark : styles.containerLight]}>
        <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
          <View>
            <Text style={[styles.title, isDark ? styles.textDark : styles.textLight]}>GAP Tracker</Text>
            <Text style={styles.subtitle}>UTM Deep Links & Join Attribution Analytics</Text>
          </View>
          <Pressable style={[styles.closeBtn, isDark ? styles.closeBtnDark : styles.closeBtnLight]} onPress={onClose}>
            <Ionicons name="close" size={20} color={isDark ? '#FFFFFF' : '#0F172A'} />
          </Pressable>
        </View>

        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          <View style={styles.metricGrid}>
            <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.metricLabel}>TOTAL CLICKS</Text>
              <Text style={styles.metricVal}>1,420</Text>
            </View>
            <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.metricLabel}>CONVERSIONS</Text>
              <Text style={styles.metricVal}>310</Text>
            </View>
            <View style={[styles.metricCard, isDark ? styles.cardDark : styles.cardLight]}>
              <Text style={styles.metricLabel}>CONV. RATE</Text>
              <Text style={styles.metricVal}>21.8%</Text>
            </View>
          </View>

          <Text style={[styles.sectionHeader, isDark ? styles.textDark : styles.textLight]}>
            Generate Attribution Deep Link
          </Text>

          <View style={styles.field}>
            <Text style={styles.label}>CAMPAIGN NAME</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              value={campaign}
              onChangeText={setCampaign}
              placeholder="e.g. YouTube_Launch_Promo"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>TRAFFIC SOURCE</Text>
            <TextInput
              style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
              value={source}
              onChangeText={setSource}
              placeholder="e.g. google_ads, influencer_shoutout"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Pressable style={styles.genBtn} onPress={handleGenerate}>
            <Ionicons name="sparkles" size={16} color="#FFFFFF" />
            <Text style={styles.genBtnText}>Generate Unique Link</Text>
          </Pressable>

          <View style={[styles.linkCard, isDark ? styles.cardDark : styles.cardLight]}>
            <Text style={styles.linkLabel}>YOUR TRACKING LINK</Text>
            <Text style={styles.linkText} selectable>{generatedLink}</Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  containerLight: { backgroundColor: '#F8FAFC' },
  containerDark: { backgroundColor: '#0B0F19' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  borderLight: { borderBottomColor: '#E2E8F0' },
  borderDark: { borderBottomColor: '#262C36' },
  title: { fontSize: 18, fontWeight: '700' },
  textLight: { color: '#0F172A' },
  textDark: { color: '#F8FAFC' },
  subtitle: { color: '#64748B', fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnLight: { backgroundColor: '#F1F5F9' },
  closeBtnDark: { backgroundColor: '#262C36' },
  body: { flex: 1 },
  bodyContent: { padding: 16 },
  metricGrid: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  metricCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cardLight: { backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' },
  cardDark: { backgroundColor: '#161B26', borderColor: '#262C36' },
  metricLabel: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  metricVal: { color: '#0284C7', fontSize: 16, fontWeight: '800', marginTop: 4 },
  sectionHeader: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  field: { marginBottom: 14 },
  label: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 6, letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
  },
  inputLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    color: '#0F172A',
  },
  inputDark: {
    backgroundColor: '#161B26',
    borderColor: '#262C36',
    color: '#F8FAFC',
  },
  genBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
    marginBottom: 16,
  },
  genBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  linkCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  linkLabel: { color: '#64748B', fontSize: 10, fontWeight: '700' },
  linkText: { color: '#059669', fontSize: 13, fontWeight: '600', marginTop: 4 },
});
