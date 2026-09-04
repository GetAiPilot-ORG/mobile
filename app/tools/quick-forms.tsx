import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { AppScreen } from '../../src/components/AppScreen';
import { AppTopBar } from '../../src/components/AppTopBar';
import { colors } from '../../src/theme/colors';

export default function QuickFormsScreen() {
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [requirePhone, setRequirePhone] = useState(true);
  const [formsList, setFormsList] = useState([
    { id: '1', title: 'Customer Feedback Survey', submissions: 42, active: true },
    { id: '2', title: 'VIP Consultation Request', submissions: 18, active: true },
  ]);

  const handleCreateForm = () => {
    if (!formTitle.trim()) {
      Alert.alert('Validation Error', 'Please enter a title for your QuickForm.');
      return;
    }

    const newForm = {
      id: String(Date.now()),
      title: formTitle,
      submissions: 0,
      active: true,
    };

    setFormsList([newForm, ...formsList]);
    setFormTitle('');
    setFormDescription('');
    Alert.alert('Form Created', 'Your public QuickForm link is ready to share.');
  };

  return (
    <AppScreen safeArea={false} backgroundColor={colors.background}>
      <AppTopBar title="QuickForms Studio" subtitle="Embeddable Lead & Survey Forms" showBack={true} />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Create New QuickForm</Text>
          <Text style={styles.cardSubtitle}>
            Build lightweight forms to collect prospect details, feedback, and customer surveys with automated CRM sync.
          </Text>

          <Text style={styles.inputLabel}>Form Title</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. Free Strategy Session Booking"
            placeholderTextColor={colors.mutedForeground}
            value={formTitle}
            onChangeText={setFormTitle}
          />

          <Text style={styles.inputLabel}>Headline / Instructions</Text>
          <TextInput
            style={[styles.input, { height: 75, textAlignVertical: 'top' }]}
            placeholder="Brief instructions shown to respondents..."
            placeholderTextColor={colors.mutedForeground}
            value={formDescription}
            onChangeText={setFormDescription}
            multiline
          />

          <Pressable style={styles.createBtn} onPress={handleCreateForm}>
            <Text style={styles.createBtnText}>Publish QuickForm ✨</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Your Active Forms ({formsList.length})</Text>

        <View style={styles.list}>
          {formsList.map((f) => (
            <View key={f.id} style={styles.formItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.formItemTitle}>{f.title}</Text>
                <Text style={styles.formItemSub}>{f.submissions} responses collected</Text>
              </View>
              <Pressable
                style={styles.viewSubmissionsBtn}
                onPress={() => Alert.alert('Submissions', `${f.title} has collected ${f.submissions} entries.`)}
              >
                <Text style={styles.viewSubmissionsText}>View Entries →</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    lineHeight: 18,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
    marginBottom: 6,
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
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.foreground,
    marginBottom: 12,
  },
  list: {
    gap: 10,
  },
  formItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formItemTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: colors.foreground,
  },
  formItemSub: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
  },
  viewSubmissionsBtn: {
    backgroundColor: colors.muted,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewSubmissionsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.foreground,
  },
});
