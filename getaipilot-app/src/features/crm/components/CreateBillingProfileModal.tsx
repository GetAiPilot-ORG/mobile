import { getColors, useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useContacts } from '../hooks/useContacts';
import { CRMBillingProfile } from '../types';

interface CreateBillingProfileModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (profile: Partial<CRMBillingProfile>) => Promise<void>;
  defaultContactId?: string;
  isLoading?: boolean;
  orgId?: string;
}

export const CreateBillingProfileModal: React.FC<CreateBillingProfileModalProps> = ({
  visible,
  onClose,
  onSubmit,
  defaultContactId,
  isLoading = false,
  orgId,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const [legalName, setLegalName] = useState('');
  const [contactId, setContactId] = useState<string>(defaultContactId || '');
  const [gstin, setGstin] = useState('');
  const [pan, setPan] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Madhya Pradesh');
  const [pincode, setPincode] = useState('');
  const [stateCode, setStateCode] = useState('23');
  const [placeOfSupply, setPlaceOfSupply] = useState('Madhya Pradesh');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: contactsData } = useContacts({ limit: 50 });

  const resetForm = () => {
    setLegalName('');
    setContactId(defaultContactId || '');
    setGstin('');
    setPan('');
    setEmail('');
    setPhone('');
    setStreet('');
    setCity('');
    setState('Madhya Pradesh');
    setPincode('');
    setStateCode('23');
    setPlaceOfSupply('Madhya Pradesh');
    setErrorMessage('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!legalName.trim()) {
      setErrorMessage('Legal name is required');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      }
      return;
    }

    try {
      setErrorMessage('');
      await onSubmit({
        legal_name: legalName.trim(),
        contact_id: contactId || null,
        gstin: gstin.trim().toUpperCase() || '',
        pan: pan.trim().toUpperCase() || '',
        email: email.trim() || '',
        phone: phone.trim() || '',
        billing_address_street: street.trim() || '',
        billing_address_city: city.trim() || '',
        billing_address_state: state.trim() || '',
        billing_address_pincode: pincode.trim() || '',
        state_code: stateCode.trim() || '',
        place_of_supply: placeOfSupply.trim() || '',
        ...(orgId ? { org_id: orgId } : {}),
      });
      handleClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create billing profile');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
      >
        <View
          style={[
            styles.modalContent,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.text }]}>
                Add Client Billing Profile
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                Tax information, legal business identity & address
              </Text>
            </View>
            <Pressable
              style={[styles.closeBtn, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
              onPress={handleClose}
              hitSlop={8}
            >
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {errorMessage ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <ScrollView
            style={styles.formScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Legal Name */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>
                Legal / Entity Name <Text style={{ color: '#EF4444' }}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="e.g. Acme Technologies Pvt Ltd"
                placeholderTextColor={colors.textMuted}
                value={legalName}
                onChangeText={setLegalName}
              />
            </View>

            {/* Link Contact / Lead */}
            {contactsData?.contacts && contactsData.contacts.length > 0 ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Link Contact / Client</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  <Pressable
                    style={[
                      styles.chip,
                      {
                        backgroundColor: contactId === '' ? '#3B82F6' : isDark ? '#1F2937' : '#F3F4F6',
                        borderColor: contactId === '' ? '#2563EB' : colors.border,
                      },
                    ]}
                    onPress={() => setContactId('')}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: contactId === '' ? '#FFF' : colors.text },
                      ]}
                    >
                      None
                    </Text>
                  </Pressable>
                  {contactsData.contacts.map((c) => (
                    <Pressable
                      key={c.id}
                      style={[
                        styles.chip,
                        {
                          backgroundColor: contactId === c.id ? '#3B82F6' : isDark ? '#1F2937' : '#F3F4F6',
                          borderColor: contactId === c.id ? '#2563EB' : colors.border,
                        },
                      ]}
                      onPress={() => {
                        setContactId(c.id);
                        if (!legalName && c.company) setLegalName(c.company);
                        if (!email && c.email) setEmail(c.email);
                        if (!phone && c.phone) setPhone(c.phone);
                      }}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: contactId === c.id ? '#FFF' : colors.text },
                        ]}
                      >
                        {c.first_name} {c.last_name} {c.company ? `(${c.company})` : ''}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}

            {/* GSTIN & PAN */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>GSTIN</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="23AAAAA0000A1Z5"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={gstin}
                  onChangeText={(val) => {
                    setGstin(val.toUpperCase());
                    if (val.length >= 2 && !stateCode) {
                      setStateCode(val.slice(0, 2));
                    }
                  }}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>PAN Number</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="ABCDE1234F"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  value={pan}
                  onChangeText={(val) => setPan(val.toUpperCase())}
                />
              </View>
            </View>

            {/* Email & Phone */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Billing Email</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="billing@company.com"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Billing Phone</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="+91 9876543210"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                />
              </View>
            </View>

            {/* Street Address */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Street Address</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Building, Suite, Street name"
                placeholderTextColor={colors.textMuted}
                value={street}
                onChangeText={setStreet}
              />
            </View>

            {/* City & State */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>City</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Bhopal"
                  placeholderTextColor={colors.textMuted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>State</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="Madhya Pradesh"
                  placeholderTextColor={colors.textMuted}
                  value={state}
                  onChangeText={(val) => {
                    setState(val);
                    if (!placeOfSupply) setPlaceOfSupply(val);
                  }}
                />
              </View>
            </View>

            {/* Pincode & State Code */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>Pincode</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="462001"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={pincode}
                  onChangeText={setPincode}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={[styles.label, { color: colors.textMuted }]}>State Code (GST)</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: isDark ? '#111827' : '#F9FAFB',
                      borderColor: colors.border,
                      color: colors.text,
                    },
                  ]}
                  placeholder="23"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  value={stateCode}
                  onChangeText={setStateCode}
                />
              </View>
            </View>

            {/* Place of Supply */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textMuted }]}>Place of Supply</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: isDark ? '#111827' : '#F9FAFB',
                    borderColor: colors.border,
                    color: colors.text,
                  },
                ]}
                placeholder="Madhya Pradesh"
                placeholderTextColor={colors.textMuted}
                value={placeOfSupply}
                onChangeText={setPlaceOfSupply}
              />
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Pressable
              style={[styles.cancelBtn, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}
              onPress={handleClose}
              disabled={isLoading}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.submitBtn, { backgroundColor: '#3B82F6', opacity: isLoading ? 0.7 : 1 }]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="card" size={16} color="#FFFFFF" />
                  <Text style={styles.submitBtnText}>Create Profile</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  formScroll: {
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: 460,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  chipScroll: {
    flexDirection: 'row',
    marginTop: 2,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: Platform.OS === 'ios' ? 32 : 18,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
