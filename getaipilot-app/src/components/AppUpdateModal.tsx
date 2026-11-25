import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/theme';
import {
  checkForAppUpdate,
  openPlayStore,
  dismissVersionUpdate,
  AppUpdateInfo,
} from '../services/appUpdateService';

export const AppUpdateModal: React.FC = () => {
  const { isDark } = useTheme();
  const [updateInfo, setUpdateInfo] = useState<AppUpdateInfo | null>(null);
  const [visible, setVisible] = useState<boolean>(false);

  useEffect(() => {
    // Only check on native mobile platforms
    if (Platform.OS === 'web') return;

    // Check with a slight delay so app launch and splash animations finish smoothly
    const timer = setTimeout(async () => {
      try {
        const info = await checkForAppUpdate();
        if (info.isUpdateAvailable) {
          setUpdateInfo(info);
          setVisible(true);
        }
      } catch {
        // Ignored
      }
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  if (!visible || !updateInfo) {
    return null;
  }

  const handleUpdate = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    openPlayStore();
  };

  const handleDismiss = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    if (updateInfo.latestVersion) {
      await dismissVersionUpdate(updateInfo.latestVersion);
    }
    setVisible(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.container,
            isDark ? styles.containerDark : styles.containerLight,
          ]}
        >
          {/* Top Icon Badge */}
          <View style={styles.iconCircle}>
            <Ionicons name="logo-google-playstore" size={32} color="#0A84FF" />
          </View>

          {/* Title & Subtitle */}
          <Text style={[styles.title, { color: isDark ? '#FFFFFF' : '#0F172A' }]}>
            New Version Available!
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? '#94A3B8' : '#64748B' }]}>
            An updated version of GetAIPilot is ready on Google Play Store with performance improvements and bug fixes.
          </Text>

          {/* Version Comparison Pill */}
          <View style={[styles.versionPill, isDark ? styles.versionPillDark : styles.versionPillLight]}>
            <Text style={[styles.versionOld, { color: isDark ? '#94A3B8' : '#64748B' }]}>
              v{updateInfo.currentVersion}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={14}
              color={isDark ? '#64748B' : '#94A3B8'}
              style={{ marginHorizontal: 8 }}
            />
            <Text style={styles.versionNew}>
              v{updateInfo.latestVersion}
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonRow}>
            {!updateInfo.isMandatory && (
              <Pressable
                style={[
                  styles.dismissBtn,
                  isDark ? styles.dismissBtnDark : styles.dismissBtnLight,
                ]}
                onPress={handleDismiss}
              >
                <Text style={[styles.dismissBtnText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
                  Later
                </Text>
              </Pressable>
            )}

            <Pressable
              style={styles.updateBtn}
              onPress={handleUpdate}
            >
              <Ionicons name="cloud-download-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.updateBtnText}>Update Now</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 22,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  containerDark: {
    backgroundColor: '#1E1A29',
    borderColor: '#312B43',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(10, 132, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  versionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginBottom: 20,
  },
  versionPillDark: {
    backgroundColor: '#2D283E',
  },
  versionPillLight: {
    backgroundColor: '#F1F5F9',
  },
  versionOld: {
    fontSize: 13,
    fontWeight: '500',
  },
  versionNew: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0A84FF',
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  dismissBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissBtnDark: {
    backgroundColor: '#2D283E',
  },
  dismissBtnLight: {
    backgroundColor: '#F1F5F9',
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  updateBtn: {
    flex: 1.5,
    flexDirection: 'row',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

