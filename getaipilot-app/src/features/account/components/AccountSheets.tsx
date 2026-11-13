import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getAccountPalette, InputField, PrimaryButton, SecondaryButton } from './AccountUIComponents';

// ─── 1. Avatar Action Sheet ───────────────────────────────────────────────────
interface AvatarActionSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectOption: (option: 'camera' | 'gallery' | 'remove') => void;
  isDark: boolean;
}

export const AvatarActionSheet: React.FC<AvatarActionSheetProps> = ({
  visible,
  onClose,
  onSelectOption,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  const handlePress = (option: 'camera' | 'gallery' | 'remove') => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
    onSelectOption(option);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handleBar, { backgroundColor: palette.divider }]} />

          <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>
            Change Profile Picture
          </Text>
          <Text style={[styles.sheetSubtitle, { color: palette.textSecondary }]}>
            Choose a photo from your device or remove current avatar.
          </Text>

          <View style={styles.actionOptions}>
            <Pressable
              cssInterop={false}
              onPress={() => handlePress('camera')}
              accessibilityRole="button"
              accessibilityLabel="Take a new photo with camera"
              style={({ pressed }) => [
                styles.actionItem,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8F9FD',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(112, 85, 232, 0.2)' : '#EEE8FF' }]}>
                <Ionicons name="camera-outline" size={20} color={palette.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: palette.textPrimary }]}>Take Photo</Text>
                <Text style={[styles.actionDesc, { color: palette.textSecondary }]}>Capture with camera</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
            </Pressable>

            <Pressable
              cssInterop={false}
              onPress={() => handlePress('gallery')}
              accessibilityRole="button"
              accessibilityLabel="Choose photo from photo library"
              style={({ pressed }) => [
                styles.actionItem,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#F8F9FD',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#DCFCE7' }]}>
                <Ionicons name="images-outline" size={20} color="#10B981" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: palette.textPrimary }]}>Choose from Library</Text>
                <Text style={[styles.actionDesc, { color: palette.textSecondary }]}>Select an existing image</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={palette.textSecondary} />
            </Pressable>

            <Pressable
              cssInterop={false}
              onPress={() => handlePress('remove')}
              accessibilityRole="button"
              accessibilityLabel="Remove current avatar"
              style={({ pressed }) => [
                styles.actionItem,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.08)' : '#FEE2E2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FECACA',
                  borderWidth: 1,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <View style={[styles.actionIconBox, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FCA5A5' }]}>
                <Ionicons name="trash-outline" size={20} color="#EF4444" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.actionTitle, { color: '#EF4444' }]}>Remove Photo</Text>
                <Text style={[styles.actionDesc, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>Reset to default initials</Text>
              </View>
            </Pressable>
          </View>

          <SecondaryButton
            label="Cancel"
            onPress={onClose}
            isDark={isDark}
            style={{ marginTop: 8 }}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── 2. Edit Profile Quick Sheet ──────────────────────────────────────────────
interface EditProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  fullName: string;
  setFullName: (v: string) => void;
  phone: string;
  setPhone: (v: string) => void;
  businessEmail: string;
  setBusinessEmail: (v: string) => void;
  businessName: string;
  setBusinessName: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  isSaving: boolean;
  onSave: () => Promise<void>;
  isDark: boolean;
}

export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  visible,
  onClose,
  fullName,
  setFullName,
  phone,
  setPhone,
  businessEmail,
  setBusinessEmail,
  businessName,
  setBusinessName,
  city,
  setCity,
  isSaving,
  onSave,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
              maxHeight: '85%',
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handleBar, { backgroundColor: palette.divider }]} />

          <View style={styles.sheetHeaderRow}>
            <View>
              <Text style={[styles.sheetTitle, { color: palette.textPrimary }]}>
                Edit Profile
              </Text>
              <Text style={[styles.sheetSubtitle, { color: palette.textSecondary }]}>
                Update your public name, contact and company details.
              </Text>
            </View>
            <Pressable
              cssInterop={false}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={8}
            >
              <Ionicons name="close-circle" size={24} color={palette.textSecondary} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ marginVertical: 12 }}>
            <InputField
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. John Doe"
              isDark={isDark}
            />
            <InputField
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="e.g. +91 98765 43210"
              keyboardType="phone-pad"
              isDark={isDark}
            />
            <InputField
              label="Backup / Business Email"
              value={businessEmail}
              onChangeText={setBusinessEmail}
              placeholder="e.g. backup@work.com"
              keyboardType="email-address"
              autoCapitalize="none"
              isDark={isDark}
            />
            <InputField
              label="Company / Brand Name"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="e.g. Acme Studio"
              isDark={isDark}
            />
            <InputField
              label="City / Location"
              value={city}
              onChangeText={setCity}
              placeholder="e.g. Mumbai, India"
              isDark={isDark}
            />
          </ScrollView>

          <View style={{ gap: 8, marginTop: 4 }}>
            <PrimaryButton
              label={isSaving ? 'Saving Changes...' : 'Save Profile'}
              onPress={onSave}
              isLoading={isSaving}
              isDark={isDark}
              icon="checkmark-outline"
            />
            <SecondaryButton
              label="Cancel"
              onPress={onClose}
              isDark={isDark}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── 3. Sign Out Confirmation Sheet ───────────────────────────────────────────
interface SignOutConfirmSheetProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDark: boolean;
}

export const SignOutConfirmSheet: React.FC<SignOutConfirmSheetProps> = ({
  visible,
  onClose,
  onConfirm,
  isDark,
}) => {
  const palette = getAccountPalette(isDark);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[
            styles.sheetContainer,
            {
              backgroundColor: palette.card,
              borderColor: palette.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handleBar, { backgroundColor: palette.divider }]} />

          <View style={[styles.warningIconCircle, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2' }]}>
            <Ionicons name="log-out-outline" size={28} color="#EF4444" />
          </View>

          <Text style={[styles.sheetTitle, { color: palette.textPrimary, textAlign: 'center' }]}>
            Sign out of GetAiPilot?
          </Text>
          <Text style={[styles.sheetSubtitle, { color: palette.textSecondary, textAlign: 'center', marginBottom: 20 }]}>
            Are you sure you want to sign out? Your cloud data, active bots and workspace configurations will remain completely safe.
          </Text>

          <View style={{ gap: 10 }}>
            <Pressable
              cssInterop={false}
              onPress={onConfirm}
              accessibilityRole="button"
              accessibilityLabel="Confirm Sign Out"
              style={({ pressed }) => [
                styles.confirmSignOutBtn,
                {
                  backgroundColor: isDark ? 'rgba(239, 68, 68, 0.16)' : '#FEE2E2',
                  borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.25)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name="log-out-outline" size={17} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={styles.confirmSignOutText}>Yes, Sign Out</Text>
            </Pressable>

            <SecondaryButton
              label="Cancel"
              onPress={onClose}
              isDark={isDark}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── 4. Lightweight Floating Copy Toast ───────────────────────────────────────
export const CopyToast: React.FC<{
  message: string | null;
  isDark: boolean;
}> = ({ message, isDark }) => {
  if (!message) return null;

  return (
    <View
      style={[
        styles.toastPill,
        {
          backgroundColor: isDark ? 'rgba(30, 27, 46, 0.95)' : 'rgba(24, 24, 27, 0.92)',
          borderColor: isDark ? 'rgba(185, 168, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
      <Text style={styles.toastText}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    fontWeight: '400',
    marginTop: 3,
  },
  actionOptions: {
    marginVertical: 16,
    gap: 10,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    gap: 12,
  },
  actionIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  actionDesc: {
    fontSize: 12,
    marginTop: 1,
  },
  warningIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  confirmSignOutBtn: {
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmSignOutText: {
    color: '#EF4444',
    fontSize: 14.5,
    fontWeight: '700',
  },
  toastPill: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    zIndex: 99999,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 22,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
