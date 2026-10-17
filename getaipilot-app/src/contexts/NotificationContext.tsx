import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import type {
  Notification,
  EventSubscription,
  NotificationResponse,
} from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { NotificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

type NotificationsModule = typeof import('expo-notifications');

let Notifications: NotificationsModule | null = null;
try {
  if (Constants.appOwnership !== 'expo') {
    Notifications = require('expo-notifications');
  }
} catch {
  Notifications = null;
}

export interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notification | null;
  clearNotification: () => void;
  permissionGranted: boolean;
  isDevice: boolean;
  isRegistering: boolean;
  requestPermissions: () => Promise<string | null>;
  sendTestNotification: (
    title?: string,
    body?: string,
    channelId?: string,
    route?: string
  ) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

/**
 * No-op context used when running in Expo Go (notifications unavailable).
 * All hooks in NotificationProvider still run; consumers simply receive inert values.
 */
const NOOP_CONTEXT: NotificationContextType = {
  expoPushToken: null,
  notification: null,
  clearNotification: () => { },
  permissionGranted: false,
  isDevice: false,
  isRegistering: false,
  requestPermissions: async () => null,
  sendTestNotification: async () => { },
};

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  // IMPORTANT: All hooks must be called unconditionally, before any early return.
  const canUseNotifications = Constants.appOwnership !== 'expo';

  const router = useRouter();
  const { user } = useAuth();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const notificationListener = useRef<EventSubscription | null>(null);
  const responseListener = useRef<EventSubscription | null>(null);
  const lastHandledNotificationId = useRef<string | null>(null);

  const clearNotification = () => {
    setNotification(null);
  };

  /**
   * Helper to map notification data payload to an app route
   */
  const resolveRoute = (data?: Record<string, any>): string | null => {
    if (!data) return null;
    if (data.route && typeof data.route === 'string') return data.route;
    if (data.url && typeof data.url === 'string') return data.url;

    // By event/type fallback
    const type = data.type || data.category;
    if (type === 'lead') return '/crm/contacts';
    if (type === 'deal') return '/crm/deals';
    if (type === 'task') return '/crm/tasks';
    if (type === 'message' || type === 'chat' || type === 'handover' || data.conversationId) {
      return data.conversationId ? `/inbox/${data.conversationId}` : '/inbox';
    }
    if (type === 'team' || type === 'team_member') return '/crm';
    if (type === 'social' || type === 'social_connected') return '/tools';
    if (type === 'whatsapp' || type === 'whatsapp_connected') return '/(tabs)';
    if (type === 'template' || type === 'template_verified') return '/(tabs)';
    if (type === 'billing' || type === 'quota') return '/account/plans';
    if (type === 'campaign') return '/fleet';
    if (type === 'call') return '/(tabs)/activity';

    // Admin & system broadcast updates for regular mobile users
    if (type === 'broadcast' || type === 'announcement') return '/(tabs)';
    if (type === 'maintenance') return '/(tabs)';
    if (type === 'feature' || type === 'tools') return '/tools';
    if (type === 'offer' || type === 'pricing') return '/pricing';

    return null;
  };

  /**
   * Core handler for user tapping a notification (Kill, Background, or Foreground mode)
   */
  const handleNotificationResponse = (response: NotificationResponse) => {
    const notifId = response?.notification?.request?.identifier;
    if (notifId && lastHandledNotificationId.current === notifId) {
      return; // Deduplicate so cold-boot doesn't execute twice
    }
    if (notifId) {
      lastHandledNotificationId.current = notifId;
    }

    const data = response?.notification?.request?.content?.data as Record<string, any> | undefined;
    const targetRoute = resolveRoute(data);

    if (targetRoute) {
      // Delay ensures the router and root stack are mounted, especially on cold boot (Kill mode)
      setTimeout(() => {
        try {
          router.push(targetRoute as any);
        } catch (routeErr) {
          console.warn('[NotificationContext] Navigation error on notification response:', routeErr);
        }
      }, 350);
    }
  };

  // Request permissions and register token
  const requestPermissions = async (): Promise<string | null> => {
    if (!Notifications) {
      console.log('ℹ️ [NotificationContext] Notifications module not available (e.g. Expo Go)');
      return null;
    }
    setIsRegistering(true);
    try {
      console.log('🔄 [NotificationContext] Requesting push permissions & token for user:', user?.id || 'anonymous');
      const result = await NotificationService.registerForPushNotificationsAsync();
      const granted = result.status === 'granted';
      setPermissionGranted(granted);

      if (result.token) {
        console.log('==============================================');
        console.log('🔥 [PUSH TOKEN ACQUIRED]:', result.token);
        console.log('==============================================');
        setExpoPushToken(result.token);
        if (user?.id) {
          console.log('📡 [NotificationContext] Syncing token to backend for user:', user.id);
          await NotificationService.syncPushTokenWithBackend(result.token, user.id);
        }
        return result.token;
      } else {
        console.warn('⚠️ [PUSH TOKEN NULL]:', result.error || `Status: ${result.status}`);
      }
      return null;
    } catch (err) {
      console.warn('❌ [NotificationContext] Registration error:', err);
      return null;
    } finally {
      setIsRegistering(false);
    }
  };

  // Trigger test notification locally across any channel & route
  const sendTestNotification = async (
    title = 'GetAiPilot Push Notification 🚀',
    body = 'Your push notifications are configured and active in your ecosystem.',
    channelId = 'default',
    route = '/account/plans'
  ) => {
    if (!Notifications) return;
    await NotificationService.scheduleLocalNotification({
      title,
      body,
      channelId,
      data: { route },
    });
  };

  // Automatically register & sync when user session is available
  useEffect(() => {
    if (!canUseNotifications) return;
    if (!Notifications) return;
    if (Platform.OS === 'web') return;

    // Check existing permissions on mount
    Notifications.getPermissionsAsync()
      .then(({ status }) => {
        setPermissionGranted(status === 'granted');
      })
      .catch(() => { });

    if (user?.id) {
      requestPermissions().catch((e) => {
        console.warn('[NotificationContext] Auto-register notice:', e);
      });
    }
  }, [user?.id, canUseNotifications]);

  // Set up notification received & response listeners for Foreground, Background, and Kill modes
  useEffect(() => {
    if (!canUseNotifications) return;
    if (!Notifications) return;
    if (Platform.OS === 'web') return;

    // 1. KILL / QUIT MODE: Check if the app was launched by tapping a push notification from cold state
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) {
          console.log('[NotificationContext] Cold boot from Kill mode detected, navigating...');
          handleNotificationResponse(response);
        }
      })
      .catch((err) => {
        console.warn('[NotificationContext] Error getting initial notification response:', err);
      });

    // 2. FOREGROUND MODE: Notification received while the user is actively inside the app
    notificationListener.current = Notifications.addNotificationReceivedListener((incoming) => {
      setNotification(incoming);
    });

    // 3. BACKGROUND & FOREGROUND TAP: User taps a notification banner while app is in background or foreground
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, [router, canUseNotifications]);

  // When notifications are unavailable (Expo Go), render children with an inert context.
  // All hooks above have already run unconditionally, so this early return is safe.
  if (!canUseNotifications || !Notifications) {
    return (
      <NotificationContext.Provider value={NOOP_CONTEXT}>
        {children}
      </NotificationContext.Provider>
    );
  }

  return (
    <NotificationContext.Provider
      value={{
        expoPushToken,
        notification,
        clearNotification,
        permissionGranted,
        isDevice: Boolean(Device.isDevice),
        isRegistering,
        requestPermissions,
        sendTestNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}