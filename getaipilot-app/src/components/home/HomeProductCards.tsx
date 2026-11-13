import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowUpRight01Icon,
  AiSparklesIcon,
} from '@hugeicons/core-free-icons';
import { soundService } from '../../services/soundFeedbackService';

interface HomeProductCardsProps {
  isDark: boolean;
  onOpen: (route: string) => void;
  sectionHeader?: React.ReactNode;
}

interface ProductItem {
  id: string;
  name: string;
  subtitle: string;
  badge: string;
  image?: any;
  isSpecial?: boolean;
  route: string;
  accent: string;
  bgLight: string;
  bgDark: string;
  borderLight: string;
  borderDark: string;
}

const PRODUCTS: ProductItem[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Hub',
    subtitle: 'Broadcasts & Meta Cloud',
    badge: 'Meta API',
    image: require('../../../assets/images/products/whatsapp.webp'),
    route: '/products/whatsapp',
    accent: '#059669',
    bgLight: '#EAF7EE',
    bgDark: '#12261B',
    borderLight: '#C6EED2',
    borderDark: 'rgba(16, 185, 129, 0.22)',
  },
  {
    id: 'telegram',
    name: 'Telegram Pilot',
    subtitle: 'Channels & Bot Relay',
    badge: 'Relay Bot',
    image: require('../../../assets/images/products/telegram.webp'),
    route: '/products/telegram',
    accent: '#0284C7',
    bgLight: '#EBF5FE',
    bgDark: '#102235',
    borderLight: '#CAE4FD',
    borderDark: 'rgba(2, 132, 199, 0.22)',
  },
  {
    id: 'voice',
    name: 'Voice AI',
    subtitle: 'Inbound & Outbound',
    badge: '24/7 Calls',
    image: require('../../../assets/images/products/voice.webp'),
    route: '/products/voice',
    accent: '#7C3AED',
    bgLight: '#F3EEFE',
    bgDark: '#201535',
    borderLight: '#E0D4FD',
    borderDark: 'rgba(139, 92, 246, 0.22)',
  },
  {
    id: 'social',
    name: 'Social Pilot',
    subtitle: 'Automated Publishing',
    badge: 'Publish',
    image: require('../../../assets/images/products/social.webp'),
    route: '/products/social',
    accent: '#DB2777',
    bgLight: '#FDEEF5',
    bgDark: '#2E1324',
    borderLight: '#FAD0E4',
    borderDark: 'rgba(236, 72, 153, 0.22)',
  },
  {
    id: 'crm',
    name: 'Smart CRM',
    subtitle: 'Pipelines & Deals',
    badge: 'Pipeline',
    image: require('../../../assets/images/products/crm.webp'),
    route: '/products/crm',
    accent: '#D97706',
    bgLight: '#FEF4E6',
    bgDark: '#2C1D0E',
    borderLight: '#FDE2BF',
    borderDark: 'rgba(245, 158, 11, 0.22)',
  },
  {
    id: 'explore',
    name: 'Explore All',
    subtitle: 'All Engines & Tools',
    badge: '12+ Tools',
    isSpecial: true,
    route: '/(tabs)/products',
    accent: '#6366F1',
    bgLight: '#EEF2FF',
    bgDark: '#19183B',
    borderLight: '#D4DBFE',
    borderDark: 'rgba(99, 102, 241, 0.25)',
  },
];

export function HomeProductCards({
  isDark,
  onOpen,
  sectionHeader,
}: HomeProductCardsProps) {
  const { width: windowWidth } = useWindowDimensions();
  // Parent container has 20pt padding on left and right (total 40)
  // Gap between 2 columns is 12pt
  const cardWidth = Math.floor((windowWidth - 40 - 12) / 2);

  const handlePress = (route: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    soundService.play('click');
    onOpen(route);
  };

  const titleColor = isDark ? '#FFFFFF' : '#1A1822';
  const descColor = isDark ? '#A19CB0' : '#6A6577';
  const circleBtnBg = isDark ? 'rgba(255, 255, 255, 0.12)' : '#FFFFFF';
  const iconSquircleBg = isDark ? 'rgba(255, 255, 255, 0.08)' : '#FFFFFF';

  return (
    <View style={styles.container}>
      {sectionHeader}

      <View style={styles.grid}>
        {PRODUCTS.map((item) => {
          const bg = isDark ? item.bgDark : item.bgLight;
          const borderColor = isDark ? item.borderDark : item.borderLight;

          return (
            <Pressable
              key={item.id}
              cssInterop={false}
              accessibilityRole="button"
              accessibilityLabel={`Open ${item.name}`}
              onPress={() => handlePress(item.route)}
              style={({ pressed }) => [
                styles.squareCard,
                {
                  width: cardWidth,
                  height: cardWidth,
                  backgroundColor: bg,
                  borderColor: borderColor,
                  opacity: pressed ? 0.88 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              {/* Top Row: Pill Badge + Circular Arrow Button */}
              <View style={styles.topRow}>
                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.75)',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  <Text style={[styles.tagText, { color: item.accent }]}>
                    {item.badge}
                  </Text>
                </View>

                <View
                  style={[
                    styles.arrowCircle,
                    {
                      backgroundColor: circleBtnBg,
                      shadowColor: item.accent,
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : 'rgba(0, 0, 0, 0.04)',
                    },
                  ]}
                >
                  <HugeiconsIcon
                    icon={ArrowUpRight01Icon}
                    size={13}
                    color={item.accent}
                    strokeWidth={2.4}
                  />
                </View>
              </View>

              {/* Center: 3D Product Icon in floating squircle frame */}
              <View style={styles.centerIconWrapper}>
                <View
                  style={[
                    styles.iconSquircle,
                    {
                      backgroundColor: iconSquircleBg,
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(255, 255, 255, 0.9)',
                      shadowColor: item.accent,
                    },
                  ]}
                >
                  {item.isSpecial ? (
                    <HugeiconsIcon
                      icon={AiSparklesIcon}
                      size={24}
                      color={item.accent}
                      strokeWidth={2}
                    />
                  ) : (
                    <Image
                      source={item.image}
                      style={styles.iconImage}
                      resizeMode="contain"
                    />
                  )}
                </View>
              </View>

              {/* Bottom: Typography */}
              <View style={styles.bottomContent}>
                <Text
                  style={[styles.title, { color: titleColor }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Text
                  style={[styles.subtitle, { color: descColor }]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  squareCard: {
    borderRadius: 24,
    borderWidth: 0.2,
    padding: 13,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tagBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    borderWidth: 0.8,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 1,
  },
  centerIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  iconSquircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 0.1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 3,
  },
  iconImage: {
    width: 32,
    height: 32,
  },
  bottomContent: {
    gap: 2,
  },
  title: {
    fontSize: 14.5,
    lineHeight: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '500',
  },
});
