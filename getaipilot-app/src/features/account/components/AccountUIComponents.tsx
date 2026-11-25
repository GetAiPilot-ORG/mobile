import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// ─── Theme Colors ─────────────────────────────────────────────────────────────
export interface AccountPalette {
  background: string;
  card: string;
  primary: string;
  primaryLight: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  danger: string;
  divider: string;
}

export function getAccountPalette(isDark: boolean): AccountPalette {
  return {
    background: isDark ? '#14131B' : '#F8F9FD',
    card: isDark ? '#1C1A25' : '#FFFFFF',
    primary: isDark ? '#B9A8FF' : '#7055E8',
    primaryLight: isDark ? 'rgba(112, 85, 232, 0.18)' : '#EEE8FF',
    textPrimary: isDark ? '#F5F3FB' : '#20212B',
    textSecondary: isDark ? '#9CA3AF' : '#73798B',
    border: isDark ? 'rgba(255, 255, 255, 0.08)' : '#EAEBF2',
    success: '#16A34A',
    danger: '#E5484D',
    divider: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F0F1F6',
  };
}

// ─── Reusable Card Container ──────────────────────────────────────────────────
export const AccountCard: React.FC<{
  children: React.ReactNode;
  isDark: boolean;
  style?: ViewStyle;
  noPadding?: boolean;
}> = ({ children, isDark, style, noPadding = false }) => {
  const palette = getAccountPalette(isDark);
  return (
    <View
      style={[
        styles.cardOuter,
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          padding: noPadding ? 0 : 16,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
};

// ─── Section Header ───────────────────────────────────────────────────────────
export const SectionHeading: React.FC<{
  title: string;
  isDark: boolean;
  rightAction?: React.ReactNode;
}> = ({ title, isDark, rightAction }) => {
  const palette = getAccountPalette(isDark);
  return (
    <View style={styles.sectionHeaderRow}>
      <Text style={[styles.sectionTitle, { color: palette.textSecondary }]}>
        {title.toUpperCase()}
      </Text>
      {rightAction}
    </View>
  );
};

// ─── Info Row (Label-Value) ───────────────────────────────────────────────────
export const InfoRow: React.FC<{
  label: string;
  value: string;
  isDark: boolean;
  isLast?: boolean;
}> = ({ label, value, isDark, isLast = false }) => {
  const palette = getAccountPalette(isDark);
  return (
    <View
      style={[
        styles.infoRow,
        !isLast && { borderBottomColor: palette.divider, borderBottomWidth: 1 },
      ]}
    >
      <Text style={[styles.infoLabel, { color: palette.textSecondary }]}>{label}</Text>
      <Text
        style={[styles.infoValue, { color: palette.textPrimary }]}
        numberOfLines={1}
      >
        {value || '—'}
      </Text>
    </View>
  );
};

// ─── Settings / Navigation Row ────────────────────────────────────────────────
export const SettingsNavRow: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconBg: string;
  iconColor: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  isDark: boolean;
  isLast?: boolean;
}> = ({
  icon,
  iconBg,
  iconColor,
  title,
  subtitle,
  onPress,
  isDark,
  isLast = false,
}) => {
    const palette = getAccountPalette(isDark);
    return (
      <Pressable
        cssInterop={false}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={({ pressed }) => [
          styles.navRow,
          !isLast && { borderBottomColor: palette.divider, borderBottomWidth: 1 },
          { opacity: pressed ? 0.75 : 1 },
        ]}
      >
        <View style={[styles.squircleIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={18} color={iconColor} />
        </View>
        <View style={{ flex: 1, gap: 1 }}>
          <Text style={[styles.navRowTitle, { color: palette.textPrimary }]}>
            {title}
          </Text>
          {Boolean(subtitle) && (
            <Text style={[styles.navRowSubtitle, { color: palette.textSecondary }]}>
              {subtitle}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-forward" size={17} color={palette.textSecondary} />
      </Pressable>
    );
  };

// ─── Form Input Field ─────────────────────────────────────────────────────────
export interface InputFieldProps extends TextInputProps {
  label: string;
  isDark: boolean;
  error?: string;
}

export const InputField: React.FC<InputFieldProps> = ({
  label,
  isDark,
  error,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const palette = getAccountPalette(isDark);

  return (
    <View style={styles.inputWrapper}>
      <Text style={[styles.fieldLabel, { color: palette.textPrimary }]}>{label}</Text>
      <TextInput
        style={[
          styles.textInput,
          {
            backgroundColor: isDark ? '#252230' : '#F8F9FD',
            borderColor: error
              ? palette.danger
              : isFocused
                ? palette.primary
                : palette.border,
            color: palette.textPrimary,
          },
          style,
        ]}
        placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        {...props}
      />
      {Boolean(error) && (
        <Text style={[styles.fieldError, { color: palette.danger }]}>{error}</Text>
      )}
    </View>
  );
};

// ─── Primary Button ───────────────────────────────────────────────────────────
export const PrimaryButton: React.FC<{
  label: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  isDark: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}> = ({ label, onPress, isLoading = false, disabled = false, isDark, icon, style }) => {
  const palette = getAccountPalette(isDark);
  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      disabled={disabled || isLoading}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.primaryBtn,
        {
          backgroundColor: palette.primary,
          opacity: disabled || isLoading ? 0.6 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color="#FFFFFF" size="small" />
      ) : (
        <>
          {Boolean(icon) && (
            <Ionicons name={icon} size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
          )}
          <Text style={styles.primaryBtnText}>{label}</Text>
        </>
      )}
    </Pressable>
  );
};

// ─── Secondary Button ─────────────────────────────────────────────────────────
export const SecondaryButton: React.FC<{
  label: string;
  onPress: () => void;
  isDark: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}> = ({ label, onPress, isDark, icon, style }) => {
  const palette = getAccountPalette(isDark);
  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.secondaryBtn,
        {
          backgroundColor: isDark ? '#252230' : '#FFFFFF',
          borderColor: palette.border,
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      {Boolean(icon) && (
        <Ionicons
          name={icon}
          size={16}
          color={palette.textPrimary}
          style={{ marginRight: 6 }}
        />
      )}
      <Text style={[styles.secondaryBtnText, { color: palette.textPrimary }]}>
        {label}
      </Text>
    </Pressable>
  );
};

// ─── Danger Button ────────────────────────────────────────────────────────────
export const DangerButton: React.FC<{
  label: string;
  onPress: () => void;
  isDark: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  style?: ViewStyle;
}> = ({ label, onPress, isDark, icon = 'log-out-outline', style }) => {
  const palette = getAccountPalette(isDark);
  return (
    <Pressable
      cssInterop={false}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [
        styles.dangerBtn,
        {
          backgroundColor: isDark ? 'rgba(229, 72, 77, 0.12)' : '#FDE8E8',
          borderColor: isDark ? 'rgba(229, 72, 77, 0.25)' : 'rgba(229, 72, 77, 0.2)',
          opacity: pressed ? 0.75 : 1,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={16} color={palette.danger} style={{ marginRight: 6 }} />
      <Text style={[styles.dangerBtnText, { color: palette.danger }]}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  cardOuter: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    marginTop: 4,
    paddingHorizontal: 2,
  },
  sectionTitle: {
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 13.5,
    fontWeight: '400',
  },
  infoValue: {
    fontSize: 13.5,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
    minHeight: 56,
  },
  squircleIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRowTitle: {
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  navRowSubtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  inputWrapper: {
    marginBottom: 12,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12.5,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  textInput: {
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  fieldError: {
    fontSize: 11.5,
    marginTop: 2,
  },
  primaryBtn: {
    height: 46,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryBtn: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  dangerBtn: {
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dangerBtnText: {
    fontSize: 13.5,
    fontWeight: '600',
  },
});

