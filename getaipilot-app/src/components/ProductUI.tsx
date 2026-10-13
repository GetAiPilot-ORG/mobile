import { useTheme } from '@/theme';
import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { Animated, Easing, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type ProductTone = 'mint' | 'lavender' | 'peach' | 'pink';

export function useProductPalette() {
  const { colors, isDark } = useTheme();
  return {
    ...colors,
    mint: isDark ? '#263D3D' : '#D8F0F0',
    lavender: isDark ? '#39304A' : '#E7DEFA',
    peach: isDark ? '#49372D' : '#F9E5D4',
    pink: isDark ? '#46303C' : '#F7DFE9',
  };
}

export function ProductHeading({ title, description, action, onAction }: {
  title: string; description?: string; action?: string; onAction?: () => void;
}) {
  const colors = useProductPalette();
  return (
    <View style={{ gap: 16, marginBottom: 24 }}>
      <Text style={{ fontSize: 30, lineHeight: 38, letterSpacing: -0.7, fontWeight: '500', color: colors.text }}>{title}</Text>
      {description && <Text style={{ fontSize: 14, lineHeight: 21, color: colors.textSecondary }}>{description}</Text>}
      {action && onAction && <ProductButton label={action} onPress={onAction} />}
    </View>
  );
}

export function ProductButton({ label, onPress, icon, secondary = false, disabled = false }: {
  label: string; onPress: () => void; icon?: IconName; secondary?: boolean; disabled?: boolean;
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
    <Animated.View style={{ alignSelf: 'flex-start', transform: [{ scale }] }}>
    <Pressable onPressIn={() => feedback(true)} onPressOut={() => feedback(false)} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled }} disabled={disabled} onPress={(event) => { event.stopPropagation(); onPress(); }}
      style={({ pressed }) => ({ alignSelf: 'flex-start', minHeight: 46, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 30, backgroundColor: secondary ? colors.card : colors.buttonPrimary, opacity: disabled ? 0.45 : pressed ? 0.75 : 1 })}>
      {icon && <Ionicons name={icon} size={17} color={ink} />}
      <Text style={{ color: ink, fontSize: 13, fontWeight: '500' }}>{label}</Text>
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
        <Text style={{ flex: 1, color: colors.text, fontSize: 18, fontWeight: '500' }}>{title}</Text>
        {onAction && <Pressable accessibilityRole="button" accessibilityLabel={`${action} ${title.toLowerCase()}`} onPress={onAction} style={{ minHeight: 44, justifyContent: 'center' }}><Text style={{ fontSize: 13, color: colors.link }}>{action}</Text></Pressable>}
      </View>
      {children}
    </View>
  );
}

export function ProductMetrics({ items }: { items: { label: string; value: React.ReactNode; onPress?: () => void }[] }) {
  const colors = useProductPalette();
  return (
    <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 20, flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginBottom: 26 }}>
      {items.map((item) => (
        <Pressable key={item.label} disabled={!item.onPress} onPress={item.onPress} accessibilityRole={item.onPress ? 'button' : undefined} accessibilityLabel={`${item.label}: ${item.value}`}
          style={{ width: items.length > 3 ? '46%' : undefined, flex: items.length <= 3 ? 1 : undefined, minWidth: 0, gap: 7 }}>
          <Text style={{ fontSize: String(item.value).length > 10 ? 15 : String(item.value).length > 6 ? 18 : 25, fontWeight: '500', color: colors.text }} numberOfLines={1} adjustsFontSizeToFit>{item.value}</Text>
          <Text style={{ fontSize: 12, color: colors.textSecondary }}>{item.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

export function ProductActions({ items }: { items: { title: string; icon: IconName; tone?: ProductTone; onPress: () => void }[] }) {
  const colors = useProductPalette();
  const { width, fontScale } = useWindowDimensions();
  const compact = items.length <= 3 && width >= 360 && fontScale <= 1.2;
  const children = items.map((item) => <Pressable key={item.title} onPress={item.onPress} accessibilityRole="button" accessibilityLabel={item.title}
    style={({ pressed }) => ({ backgroundColor: colors[item.tone || 'lavender'], flex: compact ? 1 : undefined, width: compact ? undefined : 130, minWidth: 0, minHeight: 116, borderRadius: 22, padding: 16, gap: 18, justifyContent: 'space-between', opacity: pressed ? 0.75 : 1 })}>
    <Ionicons name={item.icon} size={24} color={colors.text} />
    <Text style={{ fontSize: 13, lineHeight: 18, color: colors.text, fontWeight: '500' }}>{item.title}</Text>
  </Pressable>);
  return compact ? <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View> :
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 4 }}>{children}</ScrollView>;
}

export function ProductRow({ title, detail, icon, trailing, onPress, tone = 'mint' }: {
  title: string; detail?: string; icon?: IconName; trailing?: React.ReactNode; onPress?: () => void; tone?: ProductTone;
}) {
  const colors = useProductPalette();
  return (
    <Pressable disabled={!onPress} onPress={onPress} accessibilityRole={onPress ? 'button' : undefined} accessibilityLabel={title}
      style={({ pressed }) => ({ backgroundColor: colors.card, borderRadius: 22, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10, opacity: pressed ? 0.75 : 1 })}>
      {icon && <View style={{ width: 44, height: 44, borderRadius: 16, backgroundColor: colors[tone], alignItems: 'center', justifyContent: 'center' }}><Ionicons name={icon} size={21} color={colors.text} /></View>}
      <View style={{ flex: 1, gap: 5 }}><Text numberOfLines={2} style={{ fontSize: 15, lineHeight: 21, fontWeight: '500', color: colors.text }}>{title}</Text>{detail && <Text numberOfLines={2} style={{ fontSize: 12, lineHeight: 18, color: colors.textSecondary }}>{detail}</Text>}</View>
      {trailing || (onPress && <Ionicons name="chevron-forward" size={17} color={colors.iconSecondary} />)}
    </Pressable>
  );
}

export function ProductEmpty({ title, description, action, onAction }: { title: string; description?: string; action?: string; onAction?: () => void }) {
  const colors = useProductPalette();
  return <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 22, gap: 12 }}>
    <Text style={{ fontSize: 16, color: colors.text, fontWeight: '500' }}>{title}</Text>
    {description && <Text style={{ fontSize: 13, lineHeight: 20, color: colors.textSecondary }}>{description}</Text>}
    {action && onAction && <ProductButton label={action} onPress={onAction} />}
  </View>;
}

export function ProductPageHeader({ title, onBack }: { title: string; onBack: () => void }) {
  const colors = useProductPalette();
  return <View style={{ paddingHorizontal: 20, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
    <Pressable onPress={onBack} accessibilityRole="button" accessibilityLabel="Back" style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}><Ionicons name="chevron-back" size={20} color={colors.text} /></Pressable>
    <Text style={{ flex: 1, fontSize: 28, lineHeight: 35, fontWeight: '500', letterSpacing: -0.6, color: colors.text }}>{title}</Text>
  </View>;
}
