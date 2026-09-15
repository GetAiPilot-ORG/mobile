import React from 'react';
import { StyleSheet, Text, useColorScheme, View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { WhatsAppConnection } from '../types';

interface ConnectionStatusCardProps {
  connection?: WhatsAppConnection;
  isLoading?: boolean;
  onConnectPress?: () => void;
  onSwitchAccountPress?: () => void;
  hasMultipleAccounts?: boolean;
}

export const ConnectionStatusCard: React.FC<ConnectionStatusCardProps> = ({
  connection,
  isLoading,
  onConnectPress,
  onSwitchAccountPress,
  hasMultipleAccounts = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isConnected = connection?.connected === true && Boolean(connection?.phone_number);

  const rawLimit = connection?.messaging_limit;
  const formattedLimit = rawLimit && rawLimit !== 'TIER_NOT_SET' && rawLimit !== 'null'
    ? rawLimit.replace('TIER_', '') + ' msgs / 24h'
    : 'Not Configured';

  const handleCopyPhone = async () => {
    if (connection?.phone_number) {
      await Clipboard.setStringAsync(connection.phone_number);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      {/* Profile & Connection Info Header */}
      <View style={styles.mainRow}>
        {/* iOS Avatar with Live Connection Dot */}
        <View style={styles.avatarWrapper}>
          <View style={[styles.avatar, isDark ? styles.avatarDark : styles.avatarLight]}>
            <Ionicons
              name="logo-whatsapp"
              size={24}
              color={isConnected ? '#22C55E' : (isDark ? '#8E8E93' : '#64748B')}
            />
          </View>
          {/* Live Online / Connected Indicator Ring */}
          <View
            style={[
              styles.statusRing,
              isDark ? styles.statusRingDark : styles.statusRingLight,
              { backgroundColor: isConnected ? '#22C55E' : '#EF4444' },
            ]}
          />
        </View>

        {/* Business Details */}
        <View style={styles.infoCol}>
          <View style={styles.nameRow}>
            <Text style={[styles.displayName, isDark ? styles.textLight : styles.textDark]} numberOfLines={1}>
              {connection?.display_name || (isConnected ? 'WhatsApp Business' : 'No Active Connection')}
            </Text>
            {isConnected && <Ionicons name="checkmark-circle" size={15} color="#0084FF" />}
          </View>

          <View style={styles.subMetaRow}>
            {connection?.phone_number ? (
              <Pressable style={styles.phonePressable} onPress={handleCopyPhone} hitSlop={6}>
                <Text style={[styles.phoneNumber, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                  {connection.phone_number}
                </Text>
                <Ionicons
                  name="copy-outline"
                  size={11.5}
                  color={isDark ? '#64748B' : '#94A3B8'}
                />
              </Pressable>
            ) : (
              <Text style={[styles.phoneNumber, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
                No Number Linked
              </Text>
            )}

            <Text style={[styles.dotSeparator, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>•</Text>

            <Text style={[styles.statusCaption, { color: isConnected ? '#22C55E' : '#EF4444' }]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>

        {/* Switch Account Action if multiple numbers */}
        {hasMultipleAccounts && onSwitchAccountPress && (
          <Pressable
            style={({ pressed }) => [
              styles.switchBtn,
              isDark ? styles.switchBtnDark : styles.switchBtnLight,
              pressed && { opacity: 0.7 },
            ]}
            onPress={onSwitchAccountPress}
          >
            <Ionicons name="swap-horizontal" size={14} color={isDark ? '#0A84FF' : '#007AFF'} />
            <Text style={[styles.switchBtnText, { color: isDark ? '#0A84FF' : '#007AFF' }]}>
              Switch
            </Text>
          </Pressable>
        )}
      </View>

      {/* SLA / Connection Notice Row */}
      {isConnected ? (
        <View style={[styles.footerRow, isDark ? styles.footerBorderDark : styles.footerBorderLight]}>
          <View style={styles.tierInfo}>
            <Ionicons name="speedometer-outline" size={13} color={isDark ? '#64748B' : '#94A3B8'} />
            <Text style={[styles.limitLabel, isDark ? styles.textSecondaryDark : styles.textSecondaryLight]}>
              Tier Limit:{' '}
              <Text style={[styles.limitValue, isDark ? styles.textLight : styles.textDark]}>
                {formattedLimit}
              </Text>
            </Text>
          </View>

          <View style={styles.metaLiveTag}>
            <Text style={styles.metaLiveText}>Meta Cloud API</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.disconnectedFooter, isDark ? styles.disconnectedFooterDark : styles.disconnectedFooterLight]}>
          <Ionicons name="information-circle" size={14} color="#EF4444" style={{ marginRight: 6 }} />
          <Text style={[styles.disconnectedText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
            WhatsApp is disconnected. Link your number in web dashboard to resume messaging.
          </Text>
        </View>
      )}
    </View>
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
    backgroundColor: '#1C1C1E',
    borderColor: '#2C2C2E',
  },
  cardLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  avatarDark: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    borderColor: 'rgba(34, 197, 94, 0.25)',
  },
  avatarLight: {
    backgroundColor: 'rgba(34, 197, 94, 0.1)',
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  statusRing: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
  },
  statusRingDark: {
    borderColor: '#1C1C1E',
  },
  statusRingLight: {
    borderColor: '#FFFFFF',
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  displayName: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phonePressable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  phoneNumber: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  dotSeparator: {
    fontSize: 11,
  },
  statusCaption: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  footerBorderDark: {
    borderTopColor: '#2C2C2E',
  },
  footerBorderLight: {
    borderTopColor: '#E5E7EB',
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  limitLabel: {
    fontSize: 12,
  },
  limitValue: {
    fontWeight: '600',
  },
  metaLiveTag: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  metaLiveText: {
    color: '#818CF8',
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  disconnectedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 10,
  },
  disconnectedFooterDark: {
    borderTopColor: '#2C2C2E',
  },
  disconnectedFooterLight: {
    borderTopColor: '#E5E7EB',
  },
  disconnectedText: {
    fontSize: 11.5,
    lineHeight: 16,
    flex: 1,
  },
  switchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
  },
  switchBtnDark: {
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
  },
  switchBtnLight: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  switchBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  textLight: {
    color: '#FFFFFF',
  },
  textDark: {
    color: '#000000',
  },
  textSecondaryDark: {
    color: '#8E8E93',
  },
  textSecondaryLight: {
    color: '#6B7280',
  },
});


