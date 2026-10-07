import {
  useRouter } from 'expo-router';
import React from 'react';
import { Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTheme, getColors } from '@/theme';

interface ProductActionCardProps {
  title: string;
  description: string;
  icon: string;
  badge?: string;
  route: string;
  accentColor?: string;
}

export const ProductActionCard: React.FC<ProductActionCardProps> = ({
  title,
  description,
  icon,
  badge,
  route,
  accentColor = '#3b82f6',
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
        pressed && styles.cardPressed,
      ]}
      onPress={() => router.push(route as any)}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, { backgroundColor: `${accentColor}20` }]}>
          <Text style={[styles.icon, { color: accentColor }]}>{icon}</Text>
        </View>
        {badge ? (
          <View style={[styles.badge, { backgroundColor: `${accentColor}30` }]}>
            <Text style={[styles.badgeText, { color: accentColor }]}>{badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.title, { color: isDark ? '#f8fafc' : '#0f172a' }]}>{title}</Text>
      <Text style={[styles.description, { color: isDark ? '#94a3b8' : '#64748b' }]} numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardDark: {
    backgroundColor: '#0f172a',
    borderColor: '#1e293b',
  },
  cardLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 20,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});
