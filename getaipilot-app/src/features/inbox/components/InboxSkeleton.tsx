import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonCircle, SkeletonText, SkeletonRow } from '@/components/Skeleton';
import { useTheme, getColors } from '@/theme';

export const InboxSkeleton: React.FC = () => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  return (
    <View style={styles.container}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.05)'
                : 'rgba(0, 0, 0, 0.04)',
            },
          ]}
        >
          {/* Avatar Skeleton */}
          <SkeletonCircle size={46} style={{ marginRight: 12 }} />

          {/* Body Skeleton */}
          <View style={{ flex: 1 }}>
            {/* Top row: Name & Timestamp */}
            <View style={styles.topRow}>
              <SkeletonText width={130} height={15} style={{ borderRadius: 6 }} />
              <SkeletonText width={40} height={12} style={{ borderRadius: 4 }} />
            </View>

            {/* Preview row: 2 lines */}
            <SkeletonText width={'85%'} height={12} style={{ marginTop: 8, borderRadius: 4 }} />
            <SkeletonText width={'60%'} height={12} style={{ marginTop: 5, borderRadius: 4 }} />

            {/* Meta chips row */}
            <View style={styles.metaRow}>
              <SkeletonText width={64} height={18} style={{ borderRadius: 9 }} />
              <SkeletonText width={80} height={18} style={{ borderRadius: 9 }} />
              <SkeletonText width={50} height={18} style={{ borderRadius: 9 }} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  card: {
    borderRadius: 20,
    padding: 13,
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
});

