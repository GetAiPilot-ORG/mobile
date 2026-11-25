import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SavedQRCode } from './types';
import { useTheme, getColors } from '@/theme';
import * as Haptics from 'expo-haptics';

interface SavedStandeesListProps {
  savedCodes: SavedQRCode[];
  isLoading: boolean;
  onLoadSaved: (saved: SavedQRCode) => void;
  onDeleteSaved: (id: string) => void;
}

export const SavedStandeesList: React.FC<SavedStandeesListProps> = ({
  savedCodes,
  isLoading,
  onLoadSaved,
  onDeleteSaved,
}) => {
  const { isDark } = useTheme();
  const colors = getColors(isDark);

  const confirmDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete QR Standee',
      `Are you sure you want to delete "${title || 'this standee'}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            onDeleteSaved(id);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            My Saved QR Standees
          </Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>
            Access, re-edit, or re-export your previously saved business standees.
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size="small" color="#0A4737" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Loading saved standees...
          </Text>
        </View>
      ) : savedCodes.length === 0 ? (
        <View
          style={[
            styles.emptyCard,
            {
              backgroundColor: isDark ? '#181722' : '#FFFFFF',
              borderColor: colors.border,
            },
          ]}
        >
          <Ionicons name="qr-code-outline" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            No saved QR standees yet
          </Text>
          <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
            Customize your standee above and tap &quot;Save to Dashboard&quot; to store it.
          </Text>
        </View>
      ) : (
        <View style={styles.listGrid}>
          {savedCodes.map((item) => {
            const templateId = item.style_config?.selectedCanvas || 'Custom';
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: isDark ? '#181722' : '#FFFFFF',
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[styles.itemTitle, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {item.title || 'Untitled Standee'}
                    </Text>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{templateId}</Text>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => confirmDelete(item.id, item.title)}
                    style={styles.deleteBtn}
                  >
                    <Ionicons name="trash-outline" size={17} color="#EF4444" />
                  </Pressable>
                </View>

                <Text
                  style={[styles.itemContent, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {item.content}
                </Text>

                <View
                  style={[
                    styles.cardFooter,
                    { borderTopColor: isDark ? '#262435' : '#F1F5F9' },
                  ]}
                >
                  <Pressable
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      onLoadSaved(item);
                    }}
                    style={[
                      styles.loadBtn,
                      { backgroundColor: isDark ? '#143126' : '#ECFDF5' },
                    ]}
                  >
                    <Ionicons name="create-outline" size={14} color="#0A4737" />
                    <Text style={styles.loadBtnText}>Load Template</Text>
                  </Pressable>

                  <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    gap: 12,
  },
  headerRow: {
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  centerBox: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
  },
  emptyCard: {
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 6,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 4,
  },
  emptyDesc: {
    fontSize: 11.5,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 16,
  },
  listGrid: {
    gap: 10,
  },
  card: {
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  itemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0A4737',
    textTransform: 'uppercase',
  },
  deleteBtn: {
    padding: 4,
  },
  itemContent: {
    fontSize: 11.5,
  },
  cardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  loadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  loadBtnText: {
    color: '#0A4737',
    fontSize: 11.5,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 10.5,
  },
});
