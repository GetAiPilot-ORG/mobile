// Import of expo-notifications
let Notifications: typeof import('expo-notifications') | undefined;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = undefined;
}
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiClient } from '../core/api/client';
import { supabase } from '../lib/supabase';

export const PUSH_TOKEN_STORAGE_KEY = '@getaipilot_expo_push_token';
export const LAST_SYNCED_USER_KEY = '@getaipilot_push_token_synced_user';

// Configure how notifications appear when app is in foreground
// Guarded so it does not crash when expo-notifications is unavailable (Expo Go)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationRegistrationResult {
  token: string | null;
  status: 'granted' | 'denied' | 'undetermined' | 'unsupported';
  error?: string;
}

export class NotificationService {
  /**
   * Initialize Android notification channels with high priority, sound & lights
   * Covers all platform update categories: default, leads, messages, billing, campaigns, calls, and system
   */
  static async setupChannels(): Promise<void> {
    if (!Notifications) return;
    if (Platform.OS === 'android') {
      try {
        // 1. Default general alerts
        await Notifications.setNotificationChannelAsync('default', {
          name: 'General Alerts & Updates',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          enableVibrate: true,
          showBadge: true,
        });

        // 2. New incoming leads & CRM prospects
        await Notifications.setNotificationChannelAsync('leads', {
          name: 'New Leads & Prospects',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          enableVibrate: true,
          showBadge: true,
        });

        // 3. Customer messages & chats (WhatsApp / Telegram / Web)
        await Notifications.setNotificationChannelAsync('messages', {
          name: 'Customer Messages & Chats',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 200, 150, 200],
          lightColor: '#3B82F6',
          enableVibrate: true,
          showBadge: true,
        });

        // 4. Urgent billing, credit depletion & subscription events
        await Notifications.setNotificationChannelAsync('billing', {
          name: 'Billing & Plan Quotas',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 150, 150, 150],
          lightColor: '#8B5CF6',
          enableVibrate: true,
          showBadge: true,
        });

        // 5. Marketing broadcasts & campaigns completion
        await Notifications.setNotificationChannelAsync('campaigns', {
          name: 'Campaigns & Broadcasts',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 200, 200, 200],
          lightColor: '#F59E0B',
          enableVibrate: true,
          showBadge: true,
        });

        // 6. Voice AI Agent & phone calls
        await Notifications.setNotificationChannelAsync('calls', {
          name: 'Voice AI & Phone Calls',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 300, 200, 300],
          lightColor: '#EC4899',
          enableVibrate: true,
          showBadge: true,
        });

        // 7. System status & Bot infrastructure updates
        await Notifications.setNotificationChannelAsync('system', {
          name: 'System & Bot Updates',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 150, 150, 150],
          lightColor: '#6366F1',
          enableVibrate: true,
          showBadge: true,
        });

        // 8. Admin console alerts & security activities
        await Notifications.setNotificationChannelAsync('admin', {
          name: 'Admin & Security Activities',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 150, 250],
          lightColor: '#EF4444',
          enableVibrate: true,
          showBadge: true,
        });
      } catch (err) {
        console.warn('[NotificationService] Error setting up Android channels:', err);
      }
    }
  }

  /**
   * Request push notification permissions and retrieve the Expo Push Token
   */
  static async registerForPushNotificationsAsync(): Promise<NotificationRegistrationResult> {
    if (!Notifications) return { token: null, status: 'unsupported' };
    await this.setupChannels();

    if (Platform.OS === 'web') {
      return { token: null, status: 'unsupported' };
    }

    if (!Device.isDevice) {
      console.log('[NotificationService] Running on simulator/emulator. Remote push notifications require a physical device.');
      // In simulator, we still check existing permissions
      const { status } = await Notifications.getPermissionsAsync();
      return {
        token: null,
        status: status === 'granted' ? 'granted' : 'undetermined',
        error: 'Push notifications require a physical device',
      };
    }

    try {
      // 1. Check existing permission status
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 2. Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.log('[NotificationService] Permission not granted for push notifications.');
        return { token: null, status: finalStatus };
      }

      // 3. Obtain Expo Push Token using EAS project ID (with retry for network/Google Play Services initialization)
      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ??
        Constants?.easConfig?.projectId ??
        'b20e09aa-b2a4-483d-ba57-6b1b70f6d988';

      let token: string | null = null;
      let lastFetchError: any = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          if (attempt > 1) {
            console.log(`🔄 [NotificationService] Retrying push token fetch (attempt ${attempt}/3)...`);
            await new Promise((res) => setTimeout(res, 2000 * attempt));
          }
          const tokenData = await Notifications.getExpoPushTokenAsync({
            projectId,
          });
          if (tokenData?.data) {
            token = tokenData.data;
            break;
          }
        } catch (fetchErr: any) {
          lastFetchError = fetchErr;
          console.warn(`⚠️ [NotificationService] Token fetch attempt ${attempt} notice:`, fetchErr?.message || fetchErr);
        }
      }

      if (!token && lastFetchError) {
        throw lastFetchError;
      }

      if (token) {
        console.log('==============================================');
        console.log('🔥 [NotificationService] EXPO PUSH TOKEN:');
        console.log(token);
        console.log('==============================================');
        await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      }

      return {
        token,
        status: token ? 'granted' : 'denied',
      };
    } catch (error: any) {
      console.warn('❌ [NotificationService] Failed to obtain Expo push token:', error?.message || error);
      return {
        token: null,
        status: 'denied',
        error: error?.message || 'Failed to fetch push token',
      };
    }
  }

  /**
   * Send / Sync token with BFF and Supabase for the authenticated user
   */
  static async syncPushTokenWithBackend(token: string, userId: string): Promise<boolean> {
    if (!token || !userId) return false;
    console.log(`📡 [NotificationService] Syncing push token for user ${userId}...`);

    try {
      const lastSyncedUser = await AsyncStorage.getItem(LAST_SYNCED_USER_KEY);
      const lastToken = await AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

      // Skip redundant sync if already synced for this user with identical token
      if (lastSyncedUser === userId && lastToken === token) {
        return true;
      }

      const payload = {
        push_token: token,
        platform: Platform.OS,
        device_name: Device.modelName || (Platform.OS === 'ios' ? 'iPhone' : 'Android Device'),
        app_version: Constants?.expoConfig?.version || '1.0.0',
        updated_at: new Date().toISOString(),
      };

      // 1. Try BFF endpoint
      let bffSuccess = false;
      try {
        await apiClient.post('/mobile/v1/user/push-token', payload);
        bffSuccess = true;
      } catch (bffErr) {
        // BFF might be offline or route being established
        console.warn('[NotificationService] BFF push token sync notice, trying Supabase direct:', bffErr);
      }

      // 2. Fallback / Direct sync to Supabase profiles metadata
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            push_token: token,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId);

        if (profileError) {
          // If profiles table doesn't have a push_token column, log quietly without breaking
          console.warn('⚠️ [NotificationService] Supabase profile push_token update notice:', profileError.message);
        } else {
          console.log('✅ [NotificationService] Successfully updated push_token in profiles table for user:', userId);
        }
      } catch (sbErr) {
        console.warn('[NotificationService] Supabase fallback error:', sbErr);
      }

      await AsyncStorage.setItem(LAST_SYNCED_USER_KEY, userId);
      await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
      return bffSuccess;
    } catch (err) {
      console.warn('[NotificationService] Sync token error:', err);
      return false;
    }
  }

  /**
   * Trigger an instant local push notification for verification / preview
   */
  static async scheduleLocalNotification(options: {
    title: string;
    body: string;
    data?: Record<string, any>;
    channelId?: string;
  }): Promise<string> {
    if (!Notifications) return '';
    await this.setupChannels();

    return await Notifications.scheduleNotificationAsync({
      content: {
        title: options.title,
        body: options.body,
        data: options.data || {},
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        color: '#10B981',
      },
      trigger: null, // Send immediately
    });
  }

  /**
   * Clear badge count on app icon
   */
  static async clearBadgeCount(): Promise<void> {
    if (!Notifications) return;
    try {
      await Notifications.setBadgeCountAsync(0);
    } catch {
      // Ignore if not supported on platform
    }
  }
}