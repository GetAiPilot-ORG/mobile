import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';

interface ProductCardProps {
  name: string;
  category?: string;
  description: string;
  icon?: string;
  logoImage?: any;
  themeColor?: string;
  status?: string;
  actionText?: string;
  onPress: () => void;
  onActionPress?: () => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  name,
  description,
  icon,
  logoImage,
  themeColor = '#0070F3',
  onPress,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
        !isDark && styles.cardLightShadow,
        pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
      ]}
      onPress={handlePress}
    >
      <View style={styles.contentRow}>
        {/* App Squircle Logo */}
        {logoImage ? (
          <Image source={logoImage} style={styles.logoImage} resizeMode="contain" />
        ) : (
          <View style={[styles.iconFallback, { backgroundColor: `${themeColor}22` }]}>
            <Text style={styles.iconText}>{icon || '⚡'}</Text>
          </View>
        )}

        {/* Title & Description */}
        <View style={styles.titleInfo}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Text
            style={[styles.description, { color: colors.textMuted }]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        {/* Apple iOS Chevron */}
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={styles.chevron} />
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardLightShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 12,
  },
  iconFallback: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  titleInfo: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 15.5,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginBottom: 3,
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  chevron: {
    marginLeft: 4,
  },
});
