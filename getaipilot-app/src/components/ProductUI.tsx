import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, ArrowRight01Icon } from '@/constants/icons';
import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Animated, Easing, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

// Inline Pressable style callbacks must bypass NativeWind's native interop.
// Otherwise Android loses card backgrounds, spacing, and row layouts.
type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type ProductTone = 'mint' | 'lavender' | 'peach' | 'pink';

export function useProductPalette() {
  const { colors, isDark } = useTheme();
  return {
    ...colors,
    isDark,
    mint: isDark ? '#263D3D' : '#D8F0F0',
    lavender: isDark ? '#39304A' : '#E7DEFA',
    peach: isDark ? '#49372D' : '#F9E5D4',
    pink: isDark ? '#46303C' : '#F7DFE9',
  };
}

export function ProductHeading({ title, description, action, onAction, isLocked = false, children }: {
  title: string; description?: string; action?: string; onAction?: () => void; isLocked?: boolean; children?: React.ReactNode;
}) {
  const colors = useProductPalette();
  return (
    <View style={{ gap: description ? 8 : 14, marginBottom: 26 }}>
      <Text style={{ fontSize: 30, lineHeight: 36, letterSpacing: -0.75, fontWeight: '600', color: colors.text }}>{title}</Text>
      {Boolean(description) ? <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>{description}</Text> : null}
      {Boolean(action && onAction) ? <ProductButton label={action!} onPress={onAction!} isLocked={isLocked} /> : null}
      {children}
    </View>
  );
}

export function ProductButton({ label, onPress, icon, secondary = false, disabled = false, isLocked = false, fullWidth = false }: {
  label: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean; isLocked?: boolean; fullWidth?: boolean;
}) {
  const colors = useProductPalette();
  const ink = secondary ? colors.text : colors.buttonPrimaryForeground;
  const [scale] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (reducedMotion) { scale.stopAnimation(); scale.setValue(1); }
    return () => scale.stopAnimation();
  }, [reducedMotion, scale]);
  const feedback = (pressed: boolean) => {
    if (reducedMotion) return;
    Animated.timing(scale, { toValue: pressed ? 0.98 : 1, duration: pressed ? 100 : 140, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  };
  return (
    <Animated.View style={{ alignSelf: fullWidth ? 'stretch' : 'flex-start', width: fullWidth ? '100%' : undefined, transform: [{ scale }] }}>
    <Pressable cssInterop={false} onPressIn={() => feedback(true)} onPressOut={() => feedback(false)} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={(event) => { event.stopPropagation(); onPress(); }}
      style={({ pressed }) => ({
        alignSelf: fullWidth ? 'stretch' : 'flex-start',
        width: fullWidth ? '100%' : undefined,
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingHorizontal: fullWidth ? 12 : 20,
        paddingVertical: 12,
        borderRadius: 30,
        backgroundColor: secondary ? colors.card : colors.buttonPrimary,
        borderWidth: secondary ? 1 : 0,
        borderColor: colors.isDark ? 'rgba(255, 255, 255, 0.12)' : (colors.cardBorder || '#E9E6F2'),
        opacity: disabled ? 0.45 : pressed ? 0.75 : 1
      })}>
      {isLocked ? (
        <Ionicons name="lock-closed" size={15} color={ink} />
      ) : icon ? (
        <Ionicons name={icon} size={17} color={ink} />
      ) : null}
      <Text style={{ color: ink, fontSize: 13, fontWeight: '500' }} numberOfLines={1}>{label}</Text>
    </Pressable>
    </Animated.View>
  );
}

export function ProductSection({ title, action = 'View all', onAction, children }: {
  title: string; action?: string; onAction?: () => void; children: React.ReactNode;
}) {
  const colors = useProductPalette();
  return (
    <View style={{ marginBottom: 26 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <Text style={{ flex: 1, color: colors.text, fontSize: 18, lineHeight: 24, fontWeight: '600', letterSpacing: -0.25 }}>{title}</Text>
        {onAction ? <Pressable accessibilityRole="button" accessibilityLabel={`${action} ${title.toLowerCase()}`} onPress={onAction} hitSlop={6} style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 3 }}><Text style={{ fontSize: 13, fontWeight: '500', color: colors.link }}>{action}</Text><Ionicons name="chevron-forward" size={13} color={colors.link} /></Pressable> : null}
      </View>
      {children}
    </View>
  );
}

export function ProductMetrics({ items }: { items: { label: string; value: React.ReactNode; onPress?: () => void }[] }) {
  const colors = useProductPalette();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, paddingVertical: 18, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 26 }}>
      {items.map((item) => (
        <Pressable key={item.label} disabled={!item.onPress} onPress={item.onPress} accessibilityRole={item.onPress ? 'button' : undefined} accessibilityLabel={`${item.label}: ${item.value}`}
          style={{ width: items.length > 3 ? '46%' : undefined, flex: items.length <= 3 ? 1 : undefined, minWidth: 0, gap: 6, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: String(item.value).length > 10 ? 15 : String(item.value).length > 6 ? 18 : 25, fontWeight: '600', color: colors.text, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
          <Text style={{ fontSize: 12, fontWeight: '500', color: colors.textSecondary, textAlign: 'center' }} numberOfLines={1}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ProductActions({ items }: { items: { title: string; icon: any; tone?: ProductTone; onPress: () => void; isLocked?: boolean }[] }) {
  const colors = useProductPalette();
  const { width, fontScale } = useWindowDimensions();
  const compact = items.length <= 3 && width >= 360 && fontScale <= 1.2;
  const renderItemIcon = (icon: any) => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      return <HugeiconsIcon icon={icon} size={21} color={colors.text} strokeWidth={2} />;
    }
    return <Ionicons name={icon} size={21} color={colors.text} />;
  };
  const children = items.map((item) => <Pressable cssInterop={false} key={item.title} onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.title}
    style={({ pressed }) => ({ backgroundColor: colors[item.tone || 'lavender'], flex: compact ? 1 : undefined, width: compact ? undefined : 136, minWidth: 0, minHeight: 120, borderRadius: 22, padding: 15, gap: 16, justifyContent: 'space-between', opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] })}>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
        {renderItemIcon(item.icon)}
      </View>
      {item.isLocked && (
        <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(245, 158, 11, 0.25)', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="lock-closed" size={11} color="#D97706" />
        </View>
      )}
    </View>
    <Text style={{ fontSize: 13, lineHeight: 18, color: colors.text, fontWeight: '600' }}>{item.title}</Text>
  </Pressable>);
  return compact ? <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View> :
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>{children}</ScrollView>;
}

export function ProductRow({ title, detail, icon, trailing, onPress, tone = 'mint', isLocked }: {
  title: string; detail?: string; icon?: any; trailing?: React.ReactNode; onPress?: () => void; tone?: ProductTone; isLocked?: boolean;
}) {
  const colors = useProductPalette();
  const renderRowIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) return icon;
    if (typeof icon === 'function' || (typeof icon === 'object' && icon !== null)) {
      return <HugeiconsIcon icon={icon} size={21} color={colors.text} strokeWidth={2} />;
    }
    return <Ionicons name={icon} size={21} color={colors.text} />;
  };

  return (
    <Pressable cssInterop={false} disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={title}
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: 22, padding: 16, minHeight: 76, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.992 : 1 }] })}>
      {icon ? <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: colors[tone], alignItems: 'center', justifyContent: 'center' }}>{renderRowIcon()}</View> : null}
      <View style={{ flex: 1, gap: 5 }}>
        <Text numberOfLines={2} style={{ fontSize: 15, lineHeight: 21, fontWeight: '500', color: colors.text }}>{title}</Text>
        {Boolean(detail) ? <Text numberOfLines={2} style={{ fontSize: 12, lineHeight: 18, color: colors.textSecondary }}>{detail}</Text> : null}
      </View>
      {trailing != null ? trailing : isLocked ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(245, 158, 11, 0.12)', paddingHorizontal: 8, paddingVertical: 4.5, borderRadius: 12 }}>
          <Ionicons name="lock-closed" size={12} color="#D97706" />
          <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#D97706', letterSpacing: 0.3 }}>PLAN</Text>
        </View>
      ) : (onPress ? <HugeiconsIcon icon={ArrowRight01Icon} size={17} color={colors.iconSecondary} strokeWidth={2} /> : null)}
    </Pressable>
  );
}

export function ProductEmpty({ title, description, action, onAction }: { title: string; description?: string; action?: string; onAction?: () => void }) {
  const colors = useProductPalette();
  return <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 22, gap: 12 }}>
    <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{title}</Text>
    {Boolean(description) ? <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>{description}</Text> : null}
    {Boolean(action && onAction) ? <ProductButton label={action!} onPress={onAction!} /> : null}
  </View>;
}

export function ProductPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const colors = useProductPalette();
  return <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
      <HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.text} strokeWidth={2} />
    </Pressable>
    <Text style={{ flex: 1, fontSize: 28, lineHeight: 35, fontWeight: '500', letterSpacing: -0.6, color: colors.text }}>{title}</Text>
  </View>;
}
