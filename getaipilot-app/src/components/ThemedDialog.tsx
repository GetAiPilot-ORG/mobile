import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Easing,
  Modal,
  Platform,
  Pressable,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Gift,
  Info,
  LogOut,
  Share2,
  Smartphone,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react-native';
import { useTheme } from '@/theme';

export type ThemedDialogType =
  | 'logout'
  | 'referral'
  | 'destructive'
  | 'success'
  | 'warning'
  | 'info'
  | 'default';

export type DialogButtonLayout = 'auto' | 'row' | 'column';
export type DialogButtonAlign = 'stretch' | 'right' | 'center' | 'left';

export type DialogButtonVariant =
  | 'primary'
  | 'destructive'
  | 'secondary'
  | 'ghost'
  | 'outline'
  | 'referral'
  | 'success';

export interface DialogButton {
  text: string;
  onPress?: () => void | Promise<void>;
  variant?: DialogButtonVariant;
  textColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface ThemedDialogProps {
  visible: boolean;
  onClose: () => void;
  type?: ThemedDialogType;
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  showIcon?: boolean;
  dismissable?: boolean;
  showCloseButton?: boolean;
  buttonLayout?: DialogButtonLayout;
  buttonAlign?: DialogButtonAlign;
  alignRight?: boolean;
  textAlign?: 'left' | 'center' | 'right';

  // Custom Card Colors
  backgroundColor?: string;
  borderColor?: string;

  // Buttons
  primaryButton?: DialogButton;
  secondaryButton?: DialogButton;
  buttons?: DialogButton[];

  // Specialized referral options
  referralCode?: string;
  referralLink?: string;
  referralReward?: string;
  onShareReferral?: () => void;

  // Specialized logout/account options
  accountEmail?: string;
  accountName?: string;
  deviceName?: string;

  // Custom body
  children?: React.ReactNode;

  // Prompt / Input options
  isPrompt?: boolean;
  promptValue?: string;
  promptPlaceholder?: string;
  onPromptChange?: (text: string) => void;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  secureTextEntry?: boolean;

  // Custom button texts
  confirmText?: string;
  cancelText?: string;

  // Custom button colors
  confirmTextColor?: string;
  confirmBgColor?: string;
  confirmBorderColor?: string;
  cancelTextColor?: string;
  cancelBgColor?: string;
  cancelBorderColor?: string;
}

export const ThemedDialog: React.FC<ThemedDialogProps> = ({
  visible,
  onClose,
  type = 'default',
  title,
  description,
  icon,
  showIcon = true,
  dismissable = true,
  showCloseButton = true,
  buttonLayout = 'auto',
  buttonAlign = 'stretch',
  alignRight = false,
  textAlign,
  backgroundColor,
  borderColor,
  primaryButton,
  secondaryButton,
  buttons,
  referralCode,
  referralLink,
  referralReward,
  onShareReferral,
  accountEmail,
  accountName,
  deviceName,
  children,
  isPrompt = false,
  promptValue = '',
  promptPlaceholder,
  onPromptChange,
  keyboardType = 'default',
  secureTextEntry = false,
  confirmText,
  cancelText,
  confirmTextColor,
  confirmBgColor,
  confirmBorderColor,
  cancelTextColor,
  cancelBgColor,
  cancelBorderColor,
}) => {
  const { colors } = useTheme();
  const palette = colors as typeof colors & Partial<
    Record<
      | 'primary'
      | 'primaryForeground'
      | 'primaryMuted'
      | 'accent'
      | 'accentSoft'
      | 'background'
      | 'canvas'
      | 'surface'
      | 'surfaceGrouped'
      | 'surfaceElevated'
      | 'foreground'
      | 'card'
      | 'cardBorder'
      | 'border'
      | 'destructive'
      | 'destructiveSoft'
      | 'success'
      | 'successSoft'
      | 'warning'
      | 'warningSoft'
      | 'muted'
      | 'mutedForeground',
      string
    >
  >;
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [copiedCode, setCopiedCode] = useState(false);
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  const [currentPromptValue, setCurrentPromptValue] = useState(promptValue || '');

  useEffect(() => {
    if (visible && isPrompt) {
      setCurrentPromptValue(promptValue || '');
    }
  }, [visible, isPrompt, promptValue]);

  // Animations
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const translateYAnim = useRef(new Animated.Value(14)).current;

  useEffect(() => {
    if (visible) {
      setCopiedCode(false);
      Haptics.impactAsync(
        type === 'logout' || type === 'destructive'
          ? Haptics.ImpactFeedbackStyle.Medium
          : Haptics.ImpactFeedbackStyle.Light
      ).catch(() => { });

      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 85,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.spring(translateYAnim, {
          toValue: 0,
          tension: 85,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.94,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
        Animated.timing(translateYAnim, {
          toValue: 10,
          duration: 150,
          useNativeDriver: true,
          easing: Easing.in(Easing.quad),
        }),
      ]).start();
    }
  }, [visible, type]);

  const handleDismiss = () => {
    if (!dismissable) return;
    Haptics.selectionAsync().catch(() => { });
    onClose();
  };

  // Listen for hardware back press on Android when dialog is visible
  useEffect(() => {
    if (!visible) return;

    const onBackPress = () => {
      if (dismissable) {
        handleDismiss();
        return true;
      }
      return true;
    };

    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [visible, dismissable]);

  const handleCopyCode = async () => {
    if (!referralCode) return;
    try {
      await Clipboard.setStringAsync(referralCode);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => { });
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2400);
    } catch (err) {
      console.warn('[ThemedDialog] Copy error:', err);
    }
  };

  const handleDefaultShare = async () => {
    if (onShareReferral) {
      onShareReferral();
      return;
    }
    const link = referralLink || `https://getaipilot.com/?ref=${encodeURIComponent(referralCode || '')}`;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
      await Share.share({
        title: 'Join GetAiPilot with my referral code!',
        message: `Boost your productivity with GetAiPilot! Use my referral code ${referralCode || ''} to get started: ${link}`,
        url: link,
      });
    } catch (err) {
      console.warn('[ThemedDialog] Share error:', err);
    }
  };

  const executeButtonAction = async (btn: DialogButton, id: string) => {
    if (btn.disabled || btn.loading || loadingMap[id]) return;

    if (btn.variant === 'destructive') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => { });
    } else {
      Haptics.selectionAsync().catch(() => { });
    }

    if (btn.onPress) {
      try {
        setLoadingMap((prev) => ({ ...prev, [id]: true }));
        await btn.onPress();
      } catch (err) {
        console.error('[ThemedDialog] Action error:', err);
      } finally {
        setLoadingMap((prev) => ({ ...prev, [id]: false }));
      }
    }
  };

  // Determine badge styling based on dialog type
  const getTypeConfig = () => {
    switch (type) {
      case 'logout':
        return {
          badgeBg: palette.destructiveSoft || 'rgba(239, 68, 68, 0.12)',
          badgeBorder: palette.destructive || 'rgba(239, 68, 68, 0.24)',
          iconColor: '#EF4444',
          defaultIcon: <LogOut size={24} color="#EF4444" strokeWidth={2.2} />,
          accentColor: '#EF4444',
          defaultPrimaryVariant: 'destructive' as const,
        };
      case 'destructive':
        return {
          badgeBg: palette.destructiveSoft || 'rgba(239, 68, 68, 0.12)',
          badgeBorder: palette.destructive || 'rgba(239, 68, 68, 0.24)',
          iconColor: '#EF4444',
          defaultIcon: <AlertTriangle size={24} color="#EF4444" strokeWidth={2.2} />,
          accentColor: '#EF4444',
          defaultPrimaryVariant: 'destructive' as const,
        };
      case 'referral':
        return {
          badgeBg: palette.accentSoft || 'rgba(108, 85, 197, 0.12)',
          badgeBorder: palette.accent || 'rgba(108, 85, 197, 0.22)',
          iconColor: palette.primary || colors.buttonPrimary,
          defaultIcon: <Gift size={24} color={palette.primary || colors.buttonPrimary} strokeWidth={2.2} />,
          accentColor: palette.primary || colors.buttonPrimary,
          defaultPrimaryVariant: 'primary' as const,
        };
      case 'success':
        return {
          badgeBg: palette.successSoft || 'rgba(22, 163, 74, 0.12)',
          badgeBorder: palette.success || 'rgba(22, 163, 74, 0.20)',
          iconColor: palette.success || '#16A34A',
          defaultIcon: <CheckCircle2 size={24} color={palette.success || '#16A34A'} strokeWidth={2.2} />,
          accentColor: palette.success || '#16A34A',
          defaultPrimaryVariant: 'primary' as const,
        };
      case 'warning':
        return {
          badgeBg: palette.warningSoft || 'rgba(182, 68, 0, 0.10)',
          badgeBorder: palette.warning || 'rgba(182, 68, 0, 0.20)',
          iconColor: palette.warning || '#B64400',
          defaultIcon: <AlertTriangle size={24} color={palette.warning || '#B64400'} strokeWidth={2.2} />,
          accentColor: palette.warning || '#B64400',
          defaultPrimaryVariant: 'primary' as const,
        };
      case 'info':
      default:
        return {
          badgeBg: palette.accentSoft || 'rgba(108, 85, 197, 0.10)',
          badgeBorder: palette.accent || 'rgba(108, 85, 197, 0.18)',
          iconColor: palette.primary || colors.buttonPrimary,
          defaultIcon: <Info size={24} color={palette.primary || colors.buttonPrimary} strokeWidth={2.2} />,
          accentColor: palette.primary || colors.buttonPrimary,
          defaultPrimaryVariant: 'primary' as const,
        };
    }
  };

  const typeConfig = getTypeConfig();

  // If type is referral and no primaryButton is supplied, configure a default Share button
  const effectivePrimaryButton =
    primaryButton ||
    (type === 'referral' && referralCode
      ? {
        text: 'Share Link',
        icon: <Share2 size={15} color={colors.buttonPrimaryForeground} strokeWidth={2.2} />,
        variant: 'primary' as const,
        onPress: handleDefaultShare,
      }
      : undefined);

  // Determine button list:
  // For 2 buttons: Secondary (Cancel/Done) first on Left, Primary (Confirm/Sign Out) second on Right
  const finalSecondaryButton: DialogButton | undefined =
    secondaryButton ||
    (cancelText
      ? {
        text: cancelText,
        variant: 'secondary',
        textColor: cancelTextColor,
        backgroundColor: cancelBgColor,
        borderColor: cancelBorderColor,
        onPress: onClose,
      }
      : undefined);

  const finalPrimaryButton: DialogButton | undefined =
    effectivePrimaryButton ||
    (confirmText
      ? {
        text: confirmText,
        variant: (type === 'destructive' || type === 'logout' ? 'destructive' : 'primary'),
        textColor: confirmTextColor,
        backgroundColor: confirmBgColor,
        borderColor: confirmBorderColor,
        onPress: onClose,
      }
      : undefined);

  let resolvedButtons: DialogButton[] = buttons || [
    ...(finalSecondaryButton ? [finalSecondaryButton] : []),
    ...(finalPrimaryButton
      ? [
        {
          variant: finalPrimaryButton.variant || typeConfig.defaultPrimaryVariant,
          ...finalPrimaryButton,
        },
      ]
      : []),
  ];

  if (resolvedButtons.length === 0) {
    resolvedButtons.push({
      text: 'OK',
      variant: 'primary',
      onPress: onClose,
    });
  }

  // Determine whether to layout buttons in a row side-by-side or stacked in a column
  const isRowLayout =
    buttonLayout === 'row' ||
    (buttonLayout === 'auto' &&
      resolvedButtons.length === 2 &&
      resolvedButtons.every((b) => (b.text || '').length <= 13));

  // Ensure that in a 2-button row, Cancel is on the Left and Sign Out / Destructive is on the Right
  if (isRowLayout && resolvedButtons.length === 2) {
    const firstText = (resolvedButtons[0].text || '').toLowerCase();
    const secondText = (resolvedButtons[1].text || '').toLowerCase();
    const isFirstCancel =
      resolvedButtons[0].variant === 'secondary' ||
      firstText.includes('cancel') ||
      firstText.includes('stay') ||
      firstText.includes('back') ||
      firstText.includes('dismiss');
    const isFirstSignOut =
      resolvedButtons[0].variant === 'destructive' ||
      firstText.includes('sign out') ||
      firstText.includes('logout') ||
      firstText.includes('delete');
    const isSecondCancel =
      resolvedButtons[1].variant === 'secondary' ||
      secondText.includes('cancel') ||
      secondText.includes('stay') ||
      secondText.includes('back') ||
      secondText.includes('dismiss');

    if (isFirstSignOut && isSecondCancel) {
      resolvedButtons = [resolvedButtons[1], resolvedButtons[0]];
    }
  }

  const renderButton = (btn: DialogButton, index: number) => {
    const btnId = `btn-${index}`;
    const isLoading = btn.loading || loadingMap[btnId];
    const lowerText = (btn.text || '').toLowerCase();

    // Determine specific role "kam ke hisab se"
    let effectiveVariant: DialogButtonVariant = btn.variant || 'primary';
    if (!btn.variant) {
      if (
        lowerText.includes('no') ||
        lowerText.includes('dismiss') ||
        lowerText.includes('close') ||
        lowerText.includes('not now') ||
        lowerText.includes('later') ||
        lowerText.includes('stay') ||
        (resolvedButtons.length === 2 && index === 0)
      ) {
        effectiveVariant = 'secondary';
      } else if (
        lowerText.includes('logout') ||
        lowerText.includes('log out') ||
        lowerText.includes('sign out') ||
        lowerText.includes('signout') ||
        lowerText.includes('delete') ||
        lowerText.includes('remove') ||
        type === 'logout' ||
        type === 'destructive'
      ) {
        effectiveVariant = 'destructive';
      } else if (
        lowerText.includes('share') ||
        lowerText.includes('refer') ||
        lowerText.includes('invite') ||
        type === 'referral'
      ) {
        effectiveVariant = 'referral';
      } else if (
        lowerText.includes('save') ||
        lowerText.includes('success') ||
        type === 'success'
      ) {
        effectiveVariant = 'success';
      }
    }

    const isDestructive = effectiveVariant === 'destructive';
    const isReferral = effectiveVariant === 'referral';
    const isSuccess = effectiveVariant === 'success';
    const isSecondary = effectiveVariant === 'secondary' || effectiveVariant === 'outline';
    const isGhost = effectiveVariant === 'ghost';

    let btnBg = colors.buttonPrimary;
    let btnTextColor = colors.buttonPrimaryForeground;
    let btnBorderColor = 'transparent';
    let btnShadow: any = {};
    let defaultIcon: React.ReactNode = null;

    if (isDestructive) {
      // Destructive task: Sign Out, Delete, Revoke
      // Styled with soft red background, red text, and subtle border
      const isSignOut =
        lowerText.includes('sign out') ||
        lowerText.includes('signout') ||
        lowerText.includes('logout') ||
        lowerText.includes('log out') ||
        type === 'logout';

      btnBg = palette.destructiveSoft || '#FEE2E2';
      btnTextColor = palette.destructive || '#DC2626';
      btnBorderColor = palette.destructive || 'rgba(220, 38, 38, 0.22)';
      btnShadow = {};

      defaultIcon = isSignOut ? (
        <LogOut size={15} color={btnTextColor} strokeWidth={2.2} />
      ) : lowerText.includes('delete') || lowerText.includes('remove') ? (
        <Trash2 size={15} color={btnTextColor} strokeWidth={2.2} />
      ) : (
        <LogOut size={15} color={btnTextColor} strokeWidth={2.2} />
      );
    } else if (isReferral) {
      // Referral task: Share, Invite, Copy code
      btnBg = palette.accent || colors.buttonPrimary;
      btnTextColor = '#FFFFFF';
      btnBorderColor = palette.accent || 'transparent';
      btnShadow = Platform.select({
        ios: {
          shadowColor: '#7C3AED',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        },
        android: { elevation: 3 },
      }) || {};
      defaultIcon = <Share2 size={15} color="#FFFFFF" strokeWidth={2.2} />;
    } else if (isSuccess) {
      // Success task: Save, Done, Confirm
      btnBg = palette.success || '#16A34A';
      btnTextColor = '#FFFFFF';
      btnBorderColor = 'transparent';
      btnShadow = Platform.select({
        ios: {
          shadowColor: '#16A34A',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.25,
          shadowRadius: 5,
        },
        android: { elevation: 3 },
      }) || {};
      defaultIcon = <Check size={15} color="#FFFFFF" strokeWidth={2.4} />;
    } else if (isSecondary) {
      // Passive/Dismiss task: Cancel, Back, Later
      btnBg = palette.surfaceGrouped || '#F1F5F9';
      btnTextColor = palette.mutedForeground || colors.mutedText;
      btnBorderColor = palette.border || '#E2E8F0';
    } else if (isGhost) {
      btnBg = 'transparent';
      btnTextColor = colors.mutedText;
    } else {
      // Standard Primary task
      btnBg = palette.primary || colors.buttonPrimary;
      btnTextColor = palette.primaryForeground || colors.buttonPrimaryForeground;
      btnShadow = Platform.select({
        ios: {
          shadowColor: palette.primary || colors.buttonPrimary,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
        },
        android: { elevation: 2 },
      }) || {};
    }

    const finalBg = btn.backgroundColor || btnBg;
    const finalTextColor = btn.textColor || btnTextColor;
    const finalBorderColor = btn.borderColor || btnBorderColor;

    let iconToRender = btn.icon !== undefined ? btn.icon : defaultIcon;
    if (iconToRender && React.isValidElement(iconToRender) && btn.textColor && !btn.icon) {
      iconToRender = React.cloneElement(iconToRender as React.ReactElement<any>, {
        color: finalTextColor,
      });
    }

    const isRightAligned = buttonAlign === 'right' || alignRight === true;

    return (
      <TouchableOpacity
        key={btnId}
        style={[
          styles.buttonBase,
          isRowLayout && !isRightAligned && styles.buttonFlex,
          isRowLayout && isRightAligned && { minWidth: 92, paddingHorizontal: 16 },
          !isRowLayout && isRightAligned && { alignSelf: 'flex-end', minWidth: 100 },
          {
            backgroundColor: finalBg,
            borderColor: finalBorderColor,
            borderWidth:
              isSecondary ||
                isDestructive ||
                Boolean(btn.borderColor) ||
                Boolean(finalBorderColor && finalBorderColor !== 'transparent')
                ? 1
                : 0,
          },
          btnShadow,
        ]}
        onPress={() => executeButtonAction(btn, btnId)}
        disabled={btn.disabled || isLoading}
        accessibilityRole="button"
        accessibilityLabel={btn.text}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color={finalTextColor} />
        ) : (
          <View style={styles.buttonInner}>
            {iconToRender && <View style={styles.buttonIcon}>{iconToRender}</View>}
            <Text
              style={[
                styles.buttonText,
                {
                  color: finalTextColor,
                  fontWeight: isSecondary ? '600' : '700',
                },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {btn.text}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlayContainer}>
        {/* Animated Dim Backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: 'rgba(15, 23, 42, 0.48)',
              opacity: backdropAnim,
            },
          ]}
        >
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={handleDismiss} />
        </Animated.View>

        {/* Dialog Card */}
        <Animated.View
          style={[
            styles.cardContainer,
            {
              maxWidth: Math.min(windowWidth - 40, 360),
              backgroundColor: backgroundColor || (palette.card || palette.surface || '#FFFFFF'),
              borderColor: borderColor || (palette.cardBorder || palette.border || 'rgba(0, 0, 0, 0.06)'),
              transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
              opacity: backdropAnim,
            },
          ]}
        >
          {/* Top Right Close Button (Optional) */}
          {dismissable && showCloseButton && (
            <TouchableOpacity
              style={[
                styles.closeButton,
                {
                  backgroundColor: palette.surfaceGrouped || 'rgba(0, 0, 0, 0.04)',

                },
              ]}
              onPress={handleDismiss}
              accessibilityLabel="Close dialog"
            >
              <X size={16} color={palette.mutedForeground || colors.mutedText} strokeWidth={2.4} />
            </TouchableOpacity>
          )}

          {/* Centered Icon Badge */}
          {showIcon && (icon || typeConfig.defaultIcon) ? (
            <View
              style={[
                styles.iconBadge,
                {
                  backgroundColor: typeConfig.badgeBg,
                  borderColor: typeConfig.badgeBorder,
                },
              ]}
            >
              {icon || typeConfig.defaultIcon}
            </View>
          ) : null}

          {/* Title */}
          {title ? (
            <Text
              style={[
                styles.title,
                { color: colors.text },
                (textAlign || (alignRight ? 'right' : undefined)) && {
                  textAlign: textAlign || (alignRight ? 'right' : 'center'),
                },
              ]}
            >
              {title}
            </Text>
          ) : null}

          {/* Description */}
          {description ? (
            <Text
              style={[
                styles.description,
                { color: !title ? colors.text : colors.mutedText },
                !title && { fontSize: 16, fontWeight: '600', lineHeight: 22, marginTop: 4, marginBottom: 18 },
                (textAlign || (alignRight ? 'right' : undefined)) && {
                  textAlign: textAlign || (alignRight ? 'right' : 'center'),
                },
              ]}
            >
              {description}
            </Text>
          ) : null}

          {/* Prompt Input Field */}
          {isPrompt && (
            <View style={styles.promptContainer}>
              <TextInput
                style={[
                  styles.promptInput,
                  {
                    backgroundColor: palette.surfaceGrouped || '#F5F3FB',
                    borderColor: palette.border || 'rgba(0, 0, 0, 0.10)',
                    color: colors.text,
                  },
                ]}
                value={currentPromptValue}
                onChangeText={(text) => {
                  setCurrentPromptValue(text);
                  onPromptChange?.(text);
                }}
                placeholder={promptPlaceholder || 'Enter value...'}
                placeholderTextColor={colors.mutedText}
                keyboardType={keyboardType}
                secureTextEntry={secureTextEntry}
                autoFocus
              />
            </View>
          )}

          {/* SPECIALIZED: Referral Content */}
          {type === 'referral' && referralCode && (
            <View style={styles.referralSection}>
              {/* Tap to copy code box */}
              <TouchableOpacity
                style={[
                  styles.referralCodeBox,
                  {
                    backgroundColor: palette.surfaceGrouped || '#F5F3FB',
                    borderColor: copiedCode
                      ? typeConfig.accentColor
                      : palette.accent || 'rgba(108, 85, 197, 0.20)',
                  },
                ]}
                onPress={handleCopyCode}
                accessibilityRole="button"
                accessibilityLabel="Copy referral code"
              >
                <View style={styles.referralCodeLeft}>
                  <Text style={[styles.referralCodeLabel, { color: colors.mutedText }]}>
                    YOUR REFERRAL CODE
                  </Text>
                  <Text style={[styles.referralCodeValue, { color: colors.text }]}>
                    {referralCode}
                  </Text>
                </View>

                <View
                  style={[
                    styles.copyPill,
                    {
                      backgroundColor: copiedCode
                        ? palette.successSoft || 'rgba(22, 163, 74, 0.12)'
                        : palette.accentSoft || 'rgba(108, 85, 197, 0.12)',
                    },
                  ]}
                >
                  {copiedCode ? (
                    <>
                      <Check size={13} color={palette.success || '#16A34A'} strokeWidth={2.4} />
                      <Text style={[styles.copyPillText, { color: palette.success || '#16A34A' }]}>
                        Copied!
                      </Text>
                    </>
                  ) : (
                    <>
                      <Copy size={13} color={typeConfig.accentColor} strokeWidth={2.2} />
                      <Text style={[styles.copyPillText, { color: typeConfig.accentColor }]}>
                        Tap to copy
                      </Text>
                    </>
                  )}
                </View>
              </TouchableOpacity>

              {/* Reward perk badge */}
              <View
                style={[
                  styles.rewardBadge,
                  {
                    backgroundColor: palette.accentSoft || 'rgba(108, 85, 197, 0.06)',
                  },
                ]}
              >
                <Sparkles size={15} color={typeConfig.accentColor} strokeWidth={2} />
                <Text style={[styles.rewardText, { color: colors.text }]}>
                  {referralReward || 'Earn 20% recurring commission on every friend who subscribes.'}
                </Text>
              </View>
            </View>
          )}

          {/* SPECIALIZED: Logout / Account Details */}
          {type === 'logout' && (accountEmail || accountName || deviceName) && (
            <View
              style={[
                styles.accountBadgeContainer,
                {
                  backgroundColor: palette.surfaceGrouped || '#F5F3FB',
                  borderColor: palette.cardBorder || 'rgba(0, 0, 0, 0.05)',
                },
              ]}
            >
              <View
                style={[
                  styles.accountAvatarCircle,
                  {
                    backgroundColor: palette.destructiveSoft || 'rgba(239, 68, 68, 0.10)',
                  },
                ]}
              >
                {deviceName ? (
                  <Smartphone size={16} color="#EF4444" strokeWidth={2} />
                ) : (
                  <User size={16} color="#EF4444" strokeWidth={2} />
                )}
              </View>
              <View style={styles.accountTextCol}>
                <Text
                  style={[styles.accountPrimaryText, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {deviceName || accountName || 'Current Session'}
                </Text>
                {accountEmail ? (
                  <Text
                    style={[styles.accountSubText, { color: colors.mutedText }]}
                    numberOfLines={1}
                  >
                    {accountEmail}
                  </Text>
                ) : null}
              </View>
            </View>
          )}

          {/* Custom Children */}
          {children && <View style={styles.customContent}>{children}</View>}

          {/* Action Buttons */}
          <View
            style={[
              styles.buttonsContainer,
              isRowLayout ? styles.buttonsRow : styles.buttonsColumn,
              (buttonAlign === 'right' || alignRight) && {
                justifyContent: 'flex-end',
                alignItems: isRowLayout ? 'center' : 'flex-end',
              },
              buttonAlign === 'center' && {
                justifyContent: 'center',
                alignItems: isRowLayout ? 'center' : 'center',
              },
              buttonAlign === 'left' && {
                justifyContent: 'flex-start',
                alignItems: isRowLayout ? 'center' : 'flex-start',
              },
            ]}
          >
            {resolvedButtons.map((btn, index) => renderButton(btn, index))}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  cardContainer: {
    width: '75%',
    borderRadius: 24,
    borderWidth: 1,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    alignSelf: 'center',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.30,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
      web: {
        boxShadow: '0 16px 40px -8px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 18.5,
    fontWeight: '700',
    textAlign: 'center',
    alignSelf: 'stretch',
    letterSpacing: -0.3,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  description: {
    fontSize: 13.5,
    lineHeight: 19.5,
    textAlign: 'center',
    alignSelf: 'stretch',
    paddingHorizontal: 6,
    marginBottom: 16,
  },
  referralSection: {
    width: '100%',
    marginBottom: 16,
    gap: 10,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  referralCodeLeft: {
    flex: 1,
  },
  referralCodeLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  referralCodeValue: {
    fontSize: 16.5,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    gap: 4,
  },
  copyPillText: {
    fontSize: 11.5,
    fontWeight: '600',
  },
  rewardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 8,
  },
  rewardText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  accountBadgeContainer: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    gap: 10,
  },
  accountAvatarCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountTextCol: {
    flex: 1,
  },
  accountPrimaryText: {
    fontSize: 13,
    fontWeight: '600',
  },
  accountSubText: {
    fontSize: 11.5,
    marginTop: 1,
  },
  customContent: {
    width: '100%',
    marginBottom: 16
  },
  promptContainer: {
    width: '100%',
    marginTop: 14,
    marginBottom: 6,
  },
  promptInput: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  buttonsContainer: {
    width: '100%',
    marginTop: 18,
  },
  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  buttonsColumn: {
    flexDirection: 'column',
    gap: 10,
  },
  buttonBase: {
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  buttonFlex: {
    flex: 1,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  buttonIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
});
