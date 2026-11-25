import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewFeedback } from './types';
import { useTheme, getColors } from '@/theme';
import * as Haptics from 'expo-haptics';

interface CustomerReviewsListProps {
  feedbacks: ReviewFeedback[];
  isLoading: boolean;
  onRefresh: () => void;
}

export const CustomerReviewsList: React.FC<CustomerReviewsListProps> = ({
  feedbacks,
  isLoading,
  onRefresh,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Customer Reviews & Private Feedback
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Real-time ratings collected from customers who scanned your Google Review standee.
          </Text>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onRefresh();
          }}
          style={[
            styles.refreshBtn,
            {
              backgroundColor: isDark ? '#262435' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#0A4737" />
          ) : (
            <Ionicons name="refresh-outline" size={16} color={colors.foreground} />
          )}
          <Text style={[styles.refreshBtnText, { color: colors.foreground }]}>
            Refresh
          </Text>
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#E11D48" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Fetching customer reviews & feedback...
          </Text>
        </View>
      ) : feedbacks.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark ? '#181722' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="chatbubbles-outline" size={40} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No customer feedback recorded yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            When guests scan your Google Review acrylic standee, their 1-3 star ratings and private feedback appear here in real time to protect your Google rating.
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {feedbacks.map((fb) => (
            <View
              key={fb.id}
              style={[
                styles.feedbackCard,
                {
                  backgroundColor: isDark ? '#181722' : '#FFFFFF',
                  borderColor: colors.border,
                },
              ]}
            >
              <View style={styles.cardTopRow}>
                {/* 5-Star Visualizer */}
                <View style={styles.starsRow}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Ionicons
                      key={i}
                      name="star"
                      size={16}
                      color={i < (fb.rating || 5) ? '#F59E0B' : isDark ? '#333145' : '#E2E8F0'}
                    />
                  ))}
                </View>

                <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                  {new Date(fb.created_at).toLocaleDateString()}
                </Text>
              </View>

              <Text style={[styles.quoteText, { color: colors.foreground }]}>
                &ldquo;{fb.feedback_text || 'Customer submitted rating'}&rdquo;
              </Text>

              <View
                style={[
                  styles.cardBottomRow,
                  { borderTopColor: isDark ? '#262435' : '#F1F5F9' },
                ]}
              >
                <Text style={[styles.authorText, { color: colors.foreground }]}>
                  {fb.customer_name || 'Anonymous Guest'}
                </Text>
                <Text style={[styles.sourceText, { color: colors.mutedForeground }]}>
                  {fb.qr_title || 'Review Standee'}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  refreshBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  centerBox: {
    padding: 40,
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 11.5,
    textAlign: 'center',
    lineHeight: 17,
    maxWidth: 280,
  },
  list: {
    gap: 12,
  },
  feedbackCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  dateText: {
    fontSize: 11,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  authorText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sourceText: {
    fontSize: 11,
  },
});
