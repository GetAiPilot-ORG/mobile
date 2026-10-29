import React from 'react';
import { StyleSheet, View } from 'react-native';
import {
  AccountCard,
  InputField,
  PrimaryButton,
  SectionHeading,
} from './AccountUIComponents';

interface EditProfileTabProps {
  fullName: string;
  setFullName: (val: string) => void;
  phone: string;
  setPhone: (val: string) => void;
  businessName: string;
  setBusinessName: (val: string) => void;
  businessEmail: string;
  setBusinessEmail: (val: string) => void;
  website: string;
  setWebsite: (val: string) => void;
  city: string;
  setCity: (val: string) => void;
  country: string;
  setCountry: (val: string) => void;
  isSaving: boolean;
  onSave: () => void;
  isDark: boolean;
}

export const EditProfileTab: React.FC<EditProfileTabProps> = ({
  fullName,
  setFullName,
  phone,
  setPhone,
  businessName,
  setBusinessName,
  businessEmail,
  setBusinessEmail,
  website,
  setWebsite,
  city,
  setCity,
  country,
  setCountry,
  isSaving,
  onSave,
  isDark,
}) => {
  return (
    <View style={styles.container}>
      {/* 1. Personal Information */}
      <SectionHeading title="Personal Information" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <InputField
          label="Full Name"
          value={fullName}
          onChangeText={setFullName}
          placeholder="e.g. Alex Morgan"
          isDark={isDark}
          autoCapitalize="words"
        />
        <InputField
          label="Phone Number"
          value={phone}
          onChangeText={setPhone}
          placeholder="+1 (555) 000-0000"
          keyboardType="phone-pad"
          isDark={isDark}
        />
      </AccountCard>

      {/* 2. Business Information */}
      <SectionHeading title="Business Information" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <InputField
          label="Business / Company Name"
          value={businessName}
          onChangeText={setBusinessName}
          placeholder="e.g. Acme Studio"
          isDark={isDark}
          autoCapitalize="words"
        />
        <InputField
          label="Business Email"
          value={businessEmail}
          onChangeText={setBusinessEmail}
          placeholder="contact@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
          isDark={isDark}
        />
        <InputField
          label="Website"
          value={website}
          onChangeText={setWebsite}
          placeholder="https://example.com"
          keyboardType="url"
          autoCapitalize="none"
          isDark={isDark}
        />
      </AccountCard>

      {/* 3. Location */}
      <SectionHeading title="Location" isDark={isDark} />
      <AccountCard isDark={isDark}>
        <View style={styles.twoColRow}>
          <View style={{ flex: 1 }}>
            <InputField
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="e.g. San Francisco"
              isDark={isDark}
              autoCapitalize="words"
            />
          </View>
          <View style={{ flex: 1 }}>
            <InputField
              label="Country"
              value={country}
              onChangeText={setCountry}
              placeholder="e.g. United States"
              isDark={isDark}
              autoCapitalize="words"
            />
          </View>
        </View>
      </AccountCard>

      {/* 4. Save Button Action */}
      <View style={styles.btnWrapper}>
        <PrimaryButton
          label="Save Profile Changes"
          onPress={onSave}
          isLoading={isSaving}
          isDark={isDark}
          icon="checkmark-outline"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 12,
  },
  btnWrapper: {
    marginTop: 8,
    marginBottom: 20,
  },
});

