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
// Android FCM draws the tray entry (with the large icon) for remote push.
// If we let expo-notifications ALSO draw a banner / tray entry for the same
// remote push, the user sees 2 entries — and the Expo one has no large icon.
//
// Therefore: for remote push, this handler returns "show nothing"
// (FCM already did the display). For local schedules (sendTestNotification,
// milestone alerts), the handler returns "show normally".
// ------------------------------------------------------------------
if (Notifications?.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const trigger = notification?.request?.trigger as any;
        const notifData = (notification?.request?.content?.data || {}) as Record<string, any>;

        // Only explicit local timer / scheduled notifications should trigger an in-app alert.
        // For ALL remote push notifications, Android FCM / APNs already displays the system tray entry.
        // Returning false here guarantees Expo NEVER creates a duplicate second notification banner.
        const isLocalNotification =
          Boolean(notifData?.isLocal) ||
          trigger?.type === 'timeInterval' ||
          trigger?.type === 'date' ||
          trigger?.type === 'calendar';

        if (!isLocalNotification) {
          // Remote push: FCM already drew the notification tray entry. Suppress duplicate alert.
          return {
            shouldShowAlert: false,
            shouldPlaySound: false,
            shouldSetBadge: false,
            shouldShowBanner: false,
            shouldShowList: false,
          };
        }

        // Local scheduled notification — let it display normally.
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
// We DEFINE the task (harmless) but do NOT call registerTaskAsync.
// Calling registerTaskAsync causes some expo-notifications SDK versions to
// re-deliver the same remote push through the handler chain a second time,
// which is exactly the "2× notification" symptom.
//
// If you later need real background side-effects (e.g. writing to the DB),
// call registerTaskAsync ONLY after you are certain you are not also
// processing the same push via addNotificationReceivedListener.
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