import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../contexts/ThemeContext';

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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isDark ? styles.cardDark : styles.cardLight,
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
          <Text style={[styles.name, isDark ? styles.nameDark : styles.nameLight]} numberOfLines={1}>
            {name}
          </Text>
          <Text
            style={[styles.description, isDark ? styles.descriptionDark : styles.descriptionLight]}
            numberOfLines={2}
          >
            {description}
          </Text>
        </View>

        {/* Apple iOS Chevron */}
        <Ionicons name="chevron-forward" size={18} color="#8E8E93" style={styles.chevron} />
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
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardDark: {
    backgroundColor: '#161B22',
    borderColor: '#262C36',
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
  nameLight: {
    color: '#000000',
  },
  nameDark: {
    color: '#FFFFFF',
  },
  description: {
    fontSize: 12,
    lineHeight: 16,
  },
  descriptionLight: {
    color: '#6B7280',
  },
  descriptionDark: {
    color: '#8E8E93',
  },
  chevron: {
    marginLeft: 4,
  },
});
