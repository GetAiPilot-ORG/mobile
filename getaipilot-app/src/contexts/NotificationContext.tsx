import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { Platform } from 'react-native';
import { NotificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

export interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user } = useAuth();

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
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
    if (type === 'message' || type === 'chat' || data.conversationId) {
      return data.conversationId ? `/inbox/${data.conversationId}` : '/inbox';
    }
    if (type === 'billing' || type === 'quota') return '/account/plans';
    if (type === 'broadcast' || type === 'campaign') return '/fleet';
    if (type === 'call') return '/(tabs)/activity';

    return null;
  };

  /**
   * Core handler for user tapping a notification (Kill, Background, or Foreground mode)
   */
  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
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
    setIsRegistering(true);
    try {
      const result = await NotificationService.registerForPushNotificationsAsync();
      const granted = result.status === 'granted';
      setPermissionGranted(granted);

      if (result.token) {
        setExpoPushToken(result.token);
        if (user?.id) {
          await NotificationService.syncPushTokenWithBackend(result.token, user.id);
        }
        return result.token;
      }
      return null;
    } catch (err) {
      console.warn('[NotificationContext] Registration error:', err);
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
    await NotificationService.scheduleLocalNotification({
      title,
      body,
      channelId,
      data: { route },
    });
  };

  // Automatically register & sync when user session is available
  useEffect(() => {
    if (Platform.OS === 'web') return;

    // Check existing permissions on mount
    Notifications.getPermissionsAsync()
      .then(({ status }) => {
        setPermissionGranted(status === 'granted');
      })
      .catch(() => {});

    if (user?.id) {
      requestPermissions().catch((e) => {
        console.warn('[NotificationContext] Auto-register notice:', e);
      });
    }
  }, [user?.id]);

  // Set up notification received & response listeners for Foreground, Background, and Kill modes
  useEffect(() => {
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
  }, [router]);

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
