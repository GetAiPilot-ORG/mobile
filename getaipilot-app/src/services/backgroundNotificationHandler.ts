import { Platform } from 'react-native';

// Safely load expo-notifications without crashing if native module is absent (e.g. Expo Go / unlinked build)
let Notifications: typeof import('expo-notifications') | undefined;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = undefined;
}

// ------------------------------------------------------------------
// 1. Foreground handler
//
// Expo uses this handler to decide presentation while the app is foregrounded.
// Keep foreground alerts enabled; suppressing them would hide valid pushes
// without preventing duplicate sends from independent backend processes.
// ------------------------------------------------------------------
if (Platform.OS !== 'web' && Notifications?.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const trigger = (notification?.request?.trigger || {}) as any;
        const isRemotePush =
          trigger?.type === 'push' ||
          trigger?.type === 'remote' ||
          Boolean(notification?.request?.content?.data?.tag);

        // Android FCM natively presents remote push notifications (with full logo/icon).
        // If the app is foregrounded and expo-notifications also presents it,
        // Android shows a duplicate banner without the logo.
        // On iOS, however, iOS relies entirely on setNotificationHandler while foregrounded;
        // suppressing it on iOS completely silences and hides foreground push notifications.
        if (isRemotePush && Platform.OS === 'android') {
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: true,
            shouldShowBanner: false,
            shouldShowList: true,
          };
        }

        // On iOS (and for local notifications on Android), present the banner, sound & badge
        return {
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
          shouldShowBanner: true,
          shouldShowList: true,
        };
      },
    });
  } catch (handlerErr) {
    console.warn('[BackgroundNotificationHandler] setNotificationHandler error:', handlerErr);
  }
}

// ------------------------------------------------------------------
// 2. Optional headless background task
//
// This log-only task is defined but not registered because the app currently
// needs no headless notification processing. Task registration alone does not
// demonstrate duplicate presentation; any future task must avoid scheduling a
// second local notification for a push already presented by the system.
// ------------------------------------------------------------------
export const BACKGROUND_NOTIFICATION_TASK = 'GETAIPILOT_BACKGROUND_NOTIFICATION_TASK';

try {
  const TaskManager = require('expo-task-manager');
  if (TaskManager?.defineTask && !TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
    TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }: any) => {
      if (error) {
        console.error('[BackgroundNotificationTask] Task error:', error);
        return;
      }
      console.log('[BackgroundNotificationTask] Background payload (log only):', data);
    });
  }
  // 🚫 Do NOT call Notifications.registerTaskAsync here.
} catch {
  // expo-task-manager native module is not present in the current build.
  // Standard notifications still display via FCM + system channels.
}
