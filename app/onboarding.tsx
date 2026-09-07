import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/contexts/AuthContext';
import { colors } from '../src/theme/colors';

const CATEGORIES = [
  'Creators & Influencers',
  'Brand & Business',
  'Agency & Marketing',
  'Crypto & Stock Market',
  'Real Estate & Property',
  'Health & Fitness',
  'E-Commerce & Retail',
  'Other',
];

const TEAM_SIZES = ['1-5', '6-15', '16-50', '50+'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [accountType, setAccountType] = useState<'personal' | 'business'>('business');
  const [businessName, setBusinessName] = useState('');
  const [fullName, setFullName] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [teamSize, setTeamSize] = useState(TEAM_SIZES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCompleteOnboarding = async () => {
    if (!user) return;
    setError(null);

    if (accountType === 'business' && !businessName.trim()) {
      setError('Please provide your business or agency name.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || businessName.trim() || user.email?.split('@')[0],
          account_type: accountType,
          business_name: businessName.trim() || null,
          category,
          team_size: teamSize,
          phone: phone.trim() || null,
          onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;

      await refreshProfile();
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setError(err.message || 'Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Progress header */}
        <View style={styles.header}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>GET AIPILOT WORKSPACE</Text>
          </View>
          <Text style={styles.title}>
            {step === 1 ? 'Choose Account Type' : 'Configure Workspace'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Tailor your AI workspace engines according to your needs'
              : 'Set up your default workspace profile and automation channels'}
          </Text>
        </View>

        {/* Step 1: Account Type Selection */}
        {step === 1 && (
          <View style={styles.card}>
            <Pressable
              style={[
                styles.typeOption,
                accountType === 'business' && styles.typeOptionActive,
              ]}
              onPress={() => setAccountType('business')}
            >
              <View style={styles.typeIconBox}>
                <Text style={{ fontSize: 24 }}>🏢</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeTitle}>Business / Agency</Text>
                <Text style={styles.typeDesc}>
                  For marketing teams, agencies, and businesses managing multiple channels
                </Text>
              </View>
              {accountType === 'business' && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </Pressable>

            <Pressable
              style={[
                styles.typeOption,
                accountType === 'personal' && styles.typeOptionActive,
              ]}
              onPress={() => setAccountType('personal')}
            >
              <View style={styles.typeIconBox}>
                <Text style={{ fontSize: 24 }}>👤</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeTitle}>Creator / Individual</Text>
                <Text style={styles.typeDesc}>
                  For solo founders, creators, and community managers
                </Text>
              </View>
              {accountType === 'personal' && (
                <View style={styles.checkCircle}>
                  <Text style={styles.checkText}>✓</Text>
                </View>
              )}
            </Pressable>

            <Pressable style={styles.primaryBtn} onPress={() => setStep(2)}>
              <Text style={styles.primaryBtnText}>Continue to Details →</Text>
            </Pressable>
          </View>
        )}

        {/* Step 2: Details Form */}
        {step === 2 && (
          <View style={styles.card}>
            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <Text style={styles.inputLabel}>
              {accountType === 'business' ? 'Business / Agency Name *' : 'Your Full Name *'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder={accountType === 'business' ? 'e.g. Apex Marketing Labs' : 'e.g. Rahul Sharma'}
              placeholderTextColor={colors.mutedForeground}
              value={accountType === 'business' ? businessName : fullName}
              onChangeText={accountType === 'business' ? setBusinessName : setFullName}
            />

            <Text style={styles.inputLabel}>Industry / Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              {CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  style={[styles.chip, category === cat && styles.chipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.chipText, category === cat && styles.chipTextActive]}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {accountType === 'business' && (
              <>
                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Team Size</Text>
                <View style={styles.sizeRow}>
                  {TEAM_SIZES.map((size) => (
                    <Pressable
                      key={size}
                      style={[styles.sizeBtn, teamSize === size && styles.sizeBtnActive]}
                      onPress={() => setTeamSize(size)}
                    >
                      <Text style={[styles.sizeText, teamSize === size && styles.sizeTextActive]}>
                        {size}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>WhatsApp / Contact Mobile</Text>
            <TextInput
              style={styles.input}
              placeholder="+91 9876543210"
              placeholderTextColor={colors.mutedForeground}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <Pressable
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={() => setStep(1)}
              >
                <Text style={styles.secondaryBtnText}>← Back</Text>
              </Pressable>
              <Pressable
                style={[styles.primaryBtn, { flex: 2, marginTop: 0 }]}
                onPress={handleCompleteOnboarding}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryBtnText}>Launch Workspace 🚀</Text>
                )}
              </Pressable>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 50,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: colors.foreground,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.mutedForeground,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 320,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 14,
    backgroundColor: colors.surface,
  },
  typeOptionActive: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(0, 60, 51, 0.03)',
  },
  typeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: colors.muted,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  typeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.foreground,
  },
  typeDesc: {
    fontSize: 12,
    color: colors.mutedForeground,
    marginTop: 2,
    lineHeight: 16,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
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
    paddingVertical: 11,
    fontSize: 14,
    color: colors.foreground,
    marginBottom: 10,
  },
  chipScroll: {
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: colors.muted,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.mutedForeground,
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  sizeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeBtn: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.muted,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sizeBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  sizeText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.foreground,
  },
  sizeTextActive: {
    color: '#FFFFFF',
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 2,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14.5,
  },
  secondaryBtn: {
    backgroundColor: colors.muted,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.foreground,
    fontWeight: '800',
    fontSize: 14,
  },
  errorBox: {
    backgroundColor: 'rgba(220, 38, 38, 0.08)',
    borderColor: 'rgba(220, 38, 38, 0.25)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    color: colors.destructive,
    fontSize: 12.5,
    fontWeight: '600',
  },
});
