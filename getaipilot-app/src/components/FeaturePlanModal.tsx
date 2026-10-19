import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTheme, getColors } from '@/theme';
import { PlanCategory } from '../core/pricing/pricingService';

export interface FeaturePlanModalProps {
  visible: boolean;
  onClose: () => void;
  featureName: string;
  category: PlanCategory;
  description?: string;
  benefits?: string[];
}

const CATEGORY_NAMES: Record<PlanCategory, { title: string; color: string; icon: keyof typeof Ionicons.glyphMap }> = {
  all: { title: 'GAP Pro Suite', color: '#0284C7', icon: 'diamond-outline' },
  'all-in-one': { title: 'GAP Pro Suite', color: '#8B5CF6', icon: 'diamond-outline' },
  telegram: { title: 'Telegram Hub', color: '#0284C7', icon: 'paper-plane-outline' },
  whatsapp: { title: 'WhatsApp Hub', color: '#10B981', icon: 'logo-whatsapp' },
  calling: { title: 'Voice AI Pilot', color: '#8B5CF6', icon: 'call-outline' },
  crm: { title: 'Smart CRM', color: '#F59E0B', icon: 'people-outline' },
  social: { title: 'Social Pilot', color: '#EC4899', icon: 'share-social-outline' },
};

export const FeaturePlanModal: React.FC<FeaturePlanModalProps> = ({
  visible,
  onClose,
  featureName,
  category,
  description,
  benefits,
}) => {
  const router = useRouter();
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const catMeta = CATEGORY_NAMES[category] || CATEGORY_NAMES.telegram;

  const defaultBenefits = [
    '24/7 automated execution & live assistant replies',
    'Full access without queue limits or quota caps',
    'Priority high-speed webhook delivery & support',
  ];

  const activeBenefits = benefits && benefits.length > 0 ? benefits : defaultBenefits;

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onClose();
    // Route to plans screen with category filter
    const targetCategory = category === 'all-in-one' ? 'all-in-one' : category;
    router.push(`/account/plans?category=${targetCategory}` as any);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {/* Close Button */}
              <Pressable
                style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                  onClose();
                }}
              >
                <Ionicons name="close" size={18} color={isDark ? '#94A3B8' : '#64748B'} />
              </Pressable>

              {/* Glowing Icon & Category Badge */}
              <View style={styles.iconContainer}>
                <View style={[styles.iconHalo, { backgroundColor: `${catMeta.color}18` }]}>
                  <View style={[styles.iconCircle, { backgroundColor: `${catMeta.color}25` }]}>
                    <Ionicons name="lock-closed" size={26} color={catMeta.color} />
                  </View>
                </View>
                <View style={[styles.planBadge, { backgroundColor: `${catMeta.color}15`, borderColor: `${catMeta.color}35` }]}>
                  <Ionicons name={catMeta.icon} size={11} color={catMeta.color} />
                  <Text style={[styles.planBadgeText, { color: catMeta.color }]}>
                    {catMeta.title.toUpperCase()} PLAN REQUIRED
                  </Text>
                </View>
              </View>

              {/* Title & Description */}
              <Text style={[styles.title, { color: colors.text }]}>
                Unlock {featureName}
              </Text>
              <Text style={[styles.description, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                {description ||
                  `Access to ${featureName} is available with ${catMeta.title} or the GAP Pro All-In-One suite. Upgrade today to unlock full autonomous power.`}
              </Text>

              {/* Benefits Checklist */}
              <View style={[styles.benefitsBox, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#F8FAFC', borderColor: isDark ? 'rgba(255,255,255,0.06)' : '#E2E8F0' }]}>
                {activeBenefits.map((b, idx) => (
                  <View key={idx} style={styles.benefitRow}>
                    <View style={styles.checkIconWrapper}>
                      <Ionicons name="checkmark-circle" size={16} color="#10B981" />
                    </View>
                    <Text style={[styles.benefitText, { color: isDark ? '#CBD5E1' : '#334155' }]}>
                      {b}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Actions */}
              <View style={styles.actionsRow}>
                <Pressable
                  style={({ pressed }) => [
                    styles.upgradeBtn,
                    { backgroundColor: catMeta.color },
                    pressed && { opacity: 0.88, transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={handleUpgrade}
                >
                  <Ionicons name="sparkles" size={16} color="#FFFFFF" />
                  <Text style={styles.upgradeBtnText}>View Plans & Upgrade</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.maybeLaterBtn,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
                    onClose();
                  }}
                >
                  <Text style={[styles.maybeLaterText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                    Maybe Later
                  </Text>
                </Pressable>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 24,
    borderWidth: 1,
    padding: 22,
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconHalo: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 1,
  },
  planBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  benefitsBox: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  checkIconWrapper: {
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitText: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 17,
  },
  actionsRow: {
    gap: 8,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 3,
  },
  upgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  maybeLaterBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  maybeLaterText: {
    fontSize: 12.5,
    fontWeight: '600',
  },
});
