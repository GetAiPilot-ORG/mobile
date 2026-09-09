import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
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
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={2}>
        {description}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
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
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  description: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
  },
});
