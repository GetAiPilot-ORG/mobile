// Safely load expo-notifications without crashing if native module is absent (e.g. Expo Go / unlinked build)
let Notifications: typeof import('expo-notifications') | undefined;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = undefined;
}

// 1. Configure how notifications appear when app is in foreground / background
// Must run at module level so that incoming notifications trigger banner & sound
if (Notifications?.setNotificationHandler) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        // For remote push notifications on Android, Google FCM already handles the system notification banner
        // with the richContent large image. Firing shouldShowAlert here causes Android to show a duplicate banner without the image.
        const trigger = notification?.request?.trigger as any;
        const notifData = (notification?.request?.content?.data || {}) as Record<string, any>;
        const isRemotePush =
          trigger?.type === 'push' ||
          Boolean(trigger?.remoteMessage) ||
          Boolean(notifData?.tag) ||
          Boolean(notifData?.imageUrl) ||
          Boolean(notification?.request?.identifier?.startsWith('getai_'));
        return {
          shouldShowAlert: !isRemotePush,
          shouldPlaySound: !isRemotePush,
          shouldSetBadge: true,
          shouldShowBanner: !isRemotePush,
          shouldShowList: true,
        };
      },
    });
  } catch (handlerErr) {
    console.warn('[BackgroundNotificationHandler] setNotificationHandler error:', handlerErr);
  }
}

// 2. Headless background task with expo-task-manager (optional)
// Safely wrapped in try-catch so it NEVER crashes if native ExpoTaskManager module is not compiled into the current binary
export const BACKGROUND_NOTIFICATION_TASK = 'GETAIPILOT_BACKGROUND_NOTIFICATION_TASK';

try {
  const TaskManager = require('expo-task-manager');
  if (TaskManager?.defineTask && !TaskManager.isTaskDefined(BACKGROUND_NOTIFICATION_TASK)) {
    TaskManager.defineTask(
      BACKGROUND_NOTIFICATION_TASK,
      async ({ data, error }: any) => {
        if (error) {
          console.error('[BackgroundNotificationTask] Task error:', error);
          return;
        }
        console.log('[BackgroundNotificationTask] Received notification in background/kill mode:', data);
      }
    );
  }

  if (Notifications?.registerTaskAsync) {
    Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK).catch(() => {});
  }
} catch {
  // Native module ExpoTaskManager is not present in the current build.
  // Standard notifications will still display via Google FCM and system notification channels.
}
